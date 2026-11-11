import React, { createContext, useState, useEffect, useContext } from 'react';
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
        // Optionally refresh user data in background
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
    const token = res.access_token || res.token;
    if (token && res.user) {
      setToken(token);
      setUser(res.user);
      await saveAuthData(token, res.user);
      return { ...res, token, access_token: token };
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

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    if (token) {
      saveAuthData(token, updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
