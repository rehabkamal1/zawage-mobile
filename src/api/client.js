import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://mynosfi.com/api';
const TOKEN_KEY = '@nosfy_token';
const USER_KEY = '@nosfy_user';

export const saveAuthData = async (token, user) => {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save auth data', e);
  }
};

export const getStoredAuthData = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userStr = await AsyncStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch (e) {
    return { token: null, user: null };
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (e) {
    console.error('Failed to clear auth data', e);
  }
};

const request = async (endpoint, method = 'GET', body = null) => {
  const { token } = await getStoredAuthData();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || 'حدث خطأ في الاتصال بالخادم';
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => request('/login', 'POST', credentials),
  register: (userData) => request('/register', 'POST', userData),
  sendOtp: (payload) => request('/send-otp', 'POST', payload),
  logout: () => request('/logout', 'POST'),
  getMe: () => request('/me', 'GET'),
  updatePassword: (payload) => request('/password', 'PUT', payload),

  // Profile
  getProfile: () => request('/profile', 'GET'),
  updateProfile: (profileData) => request('/profile', 'PUT', profileData),

  // Matches
  getMatches: (params = '') => request(`/matches${params ? `?${params}` : ''}`, 'GET'),
  unlockContact: (partnerId) => request(`/matches/${partnerId}/contact`, 'POST'),

  // Subscriptions
  subscribePlan: (planType) => request('/subscriptions/subscribe', 'POST', { type: planType }),
  submitManualTransfer: (formData) => request('/subscriptions/manual-transfer', 'POST', formData),

  // Favorites
  getFavorites: () => request('/favorites', 'GET'),
  toggleFavorite: (targetUserId) => request('/favorites', 'POST', { favorite_user_id: targetUserId }),

  // Reports
  sendReport: (reportedId, reason) => request('/reports', 'POST', { reported_id: reportedId, reason }),
};
