import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';

export const API_BASE_URL = APP_CONFIG.API_BASE_URL;
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

const request = async (endpoint, method = 'GET', body = null, isFormData = false) => {
  const { token } = await getStoredAuthData();
  const headers = {
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || (data.errors ? Object.values(data.errors)[0]?.[0] : null) || 'حدث خطأ في الاتصال بالخادم';
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  // Public & Auth
  login: (credentials) => request('/login', 'POST', credentials),
  register: (userData) => request('/register', 'POST', userData),
  sendOtp: (payload) => request('/send-otp', 'POST', payload),
  logout: () => request('/logout', 'POST'),
  getMe: () => request('/me', 'GET'),
  updatePassword: (payload) => request('/password', 'PUT', payload),

  // Profile (User's Matrimonial Form)
  getProfile: () => request('/profile', 'GET'),
  updateProfile: (profileData) => request('/profile', 'PUT', profileData),

  // Matches & Contact
  getMatches: (params = '') => request(`/matches${params ? `?${params}` : ''}`, 'GET'),
  unlockContact: (partnerId) => request(`/matches/${partnerId}/contact`, 'POST'),

  // Subscriptions & Payment
  subscribePlan: (planType) => request('/subscriptions/subscribe', 'POST', { type: planType }),
  submitManualTransfer: (formData, isMultipart = false) =>
    request('/subscriptions/manual-transfer', 'POST', formData, isMultipart),

  // Favorites
  getFavorites: () => request('/favorites', 'GET'),
  toggleFavorite: (targetUserId) => request('/favorites', 'POST', { favorite_user_id: targetUserId }),

  // Reports
  sendReport: (reportedId, reason) => request('/reports', 'POST', { reported_id: reportedId, reason }),

  // Admin APIs (admin role)
  getAdminStats: (period = 'all', year = null, month = null) => {
    let q = `period=${period}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return request(`/admin/stats?${q}`, 'GET');
  },
  getAdminUsers: () => request('/admin/users', 'GET'),
  updateAdminUser: (id, userData) => request(`/admin/users/${id}`, 'PUT', userData),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, 'DELETE'),
  toggleBanUser: (id) => request(`/admin/users/${id}/toggle-ban`, 'POST'),
  getAdminReports: () => request('/admin/reports', 'GET'),
  updateAdminReport: (id, statusData) => request(`/admin/reports/${id}`, 'PUT', statusData),

  // Super Admin APIs (super_admin role)
  getAdminPayments: (status = null, plan = null) => {
    let q = '';
    if (status) q += `status=${status}&`;
    if (plan) q += `plan=${plan}&`;
    return request(`/admin/payments${q ? `?${q}` : ''}`, 'GET');
  },
  approvePayment: (paymentId) => request(`/admin/payments/${paymentId}/approve`, 'POST'),
  rejectPayment: (paymentId, reason) =>
    request(`/admin/payments/${paymentId}/reject`, 'POST', { rejection_reason: reason }),
  changeUserRole: (userId, role) => request(`/admin/users/${userId}/change-role`, 'POST', { role }),
  promoteByPhone: (phone) => request('/admin/users/promote-by-phone', 'POST', { phone }),
};
