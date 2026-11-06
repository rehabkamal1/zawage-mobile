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

  const login = async (emailOrPhone, password, code = null) => {
    const payload = {
      email: emailOrPhone,
      password,
    };
    if (code) payload.code = code;

    const res = await api.login(payload);
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      await saveAuthData(res.token, res.user);
      return res;
    }
    return res;
  };

  const register = async (name, email, password, gender) => {
    const res = await api.register({
      name,
      email,
      password,
      gender,
    });
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
