import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens, ApiError } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = (): string | null => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor to add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post<{ data: AuthTokens }>(
            `${API_URL}/auth/refresh`,
            { refreshToken }
          );
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

          setAccessToken(newAccessToken);
          setRefreshToken(newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return api(originalRequest);
        } catch {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: AuthTokens & { user: unknown } }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<{ data: AuthTokens & { user: unknown } }>('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Partial<{ firstName: string; lastName: string; language: string }>) =>
    api.patch('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
};

export const toolsApi = {
  getAll: (params?: { neighborhoodId?: string; category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/tools', { params }),
  getById: (id: string) => api.get(`/tools/${id}`),
  create: (data: FormData) => api.post('/tools', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, data: FormData) => api.patch(`/tools/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/tools/${id}`),
  getMyTools: () => api.get('/tools/my'),
};

export const lendingsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/lendings', { params }),
  getById: (id: string) => api.get(`/lendings/${id}`),
  create: (data: { toolId: string; startDate: string; endDate: string; message?: string }) =>
    api.post('/lendings', data),
  approve: (id: string) => api.post(`/lendings/${id}/approve`),
  reject: (id: string, reason?: string) => api.post(`/lendings/${id}/reject`, { reason }),
  cancel: (id: string) => api.post(`/lendings/${id}/cancel`),
  return: (id: string) => api.post(`/lendings/${id}/return`),
  extend: (id: string, newEndDate: string) => api.post(`/lendings/${id}/extend`, { newEndDate }),
  getMyRequests: () => api.get('/lendings/my-requests'),
  getIncomingRequests: () => api.get('/lendings/incoming'),
};

export const neighborhoodsApi = {
  getAll: () => api.get('/neighborhoods'),
  getById: (id: string) => api.get(`/neighborhoods/${id}`),
  create: (data: { name: string; description: string }) => api.post('/neighborhoods', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/neighborhoods/${id}`, data),
  delete: (id: string) => api.delete(`/neighborhoods/${id}`),
  join: (inviteCode: string) => api.post('/neighborhoods/join', { inviteCode }),
  leave: (id: string) => api.post(`/neighborhoods/${id}/leave`),
  getMembers: (id: string) => api.get(`/neighborhoods/${id}/members`),
  generateInvite: (id: string) => api.post(`/neighborhoods/${id}/invite`),
  getMyNeighborhoods: () => api.get('/neighborhoods/my'),
};

export default api;
