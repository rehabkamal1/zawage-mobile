import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { api, saveAuthData, getStoredAuthData, clearAuthData } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const { token: savedToken, user: savedUser } = await getStoredAuthData();
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);

        // Refresh user profile and subscriptions from backend in background
        api.getMe()
          .then(data => {
            if (data.user) {
              setUser(data.user);
              saveAuthData(savedToken, data.user);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.log('Session load error', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentialsOrIdentifier, maybePassword = null, maybeCode = null) => {
    let payload = {};
    if (typeof credentialsOrIdentifier === 'object' && credentialsOrIdentifier !== null) {
      payload = { ...credentialsOrIdentifier };
    } else {
      const identifier = String(credentialsOrIdentifier || '').trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      payload = {
        auth_method: isEmail ? 'email' : 'phone',
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        password: maybePassword,
      };
      if (maybeCode) payload.code = maybeCode;
    }

    const res = await api.login(payload);
    const resolvedToken = res.access_token || res.token;
    if (resolvedToken && res.user) {
      setToken(resolvedToken);
      setUser(res.user);
      await saveAuthData(resolvedToken, res.user);
      return { ...res, token: resolvedToken, access_token: resolvedToken };
    }
    return res;
  };

  const register = async (userDataOrName, maybeEmail, maybePassword, maybeGender, maybePhone) => {
    let payload = {};
    if (typeof userDataOrName === 'object' && userDataOrName !== null) {
      payload = { ...userDataOrName };
    } else {
      payload = {
        name: userDataOrName,
        email: maybeEmail,
        password: maybePassword,
        gender: maybeGender,
        phone: maybePhone,
        auth_method: maybePhone ? 'phone' : 'email',
      };
    }
    const res = await api.register(payload);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setUser(null);
    setToken(null);
    await clearAuthData();
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        if (token) {
          await saveAuthData(token, data.user);
        }
      }
      return data.user;
    } catch (e) {
      return null;
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    if (token) {
      saveAuthData(token, updatedUser);
    }
  };

  const value = useMemo(() => {
    const role = user?.role || 'guest';
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = isSuperAdmin || role === 'admin';
    const isMale = user?.gender === 'male';
    const isFemale = user?.gender === 'female';

    return {
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      role,
      isAdmin,
      isSuperAdmin,
      isMale,
      isFemale,
      login,
      register,
      logout,
      refreshUser,
      updateUserProfile,
    };
  }, [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
