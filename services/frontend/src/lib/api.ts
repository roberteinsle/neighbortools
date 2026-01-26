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
    api.post('/users/profile', data), // Using POST instead of PATCH for proxy compatibility
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
};

export const toolsApi = {
  getAll: (params?: { neighborhoodId?: string; category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/tools', { params }),
  getById: (id: string) => api.get(`/tools/${id}`),
  create: (data: { name: string; description: string; category: string; condition: string; neighborhoodId: string }) =>
    api.post('/tools', data),
  update: (id: string, data: { name?: string; description?: string; category?: string; condition?: string }) =>
    api.put(`/tools/${id}`, data),
  delete: (id: string) => api.delete(`/tools/${id}`),
  getMyTools: () => api.get('/tools/my'),
  toggleAvailability: (id: string, isAvailable: boolean) =>
    api.put(`/tools/${id}/availability`, { isAvailable }),
  // Image operations
  uploadImages: (toolId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post(`/tools/${toolId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (toolId: string, imageId: string) =>
    api.delete(`/tools/${toolId}/images/${imageId}`),
  setPrimaryImage: (toolId: string, imageId: string) =>
    api.put(`/tools/${toolId}/images/${imageId}/primary`),
  getByNeighborhood: (neighborhoodId: string, params?: { page?: number; pageSize?: number }) =>
    api.get(`/tools/neighborhood/${neighborhoodId}`, { params }),
};

export const lendingsApi = {
  getAll: (params?: { status?: string; role?: string; page?: number; pageSize?: number }) =>
    api.get('/lendings', { params }),
  getById: (id: string) => api.get(`/lendings/${id}`),
  create: (data: {
    toolId: string;
    toolName: string;
    lenderId: string;
    neighborhoodId: string;
    startDate: string;
    endDate: string;
    message?: string;
  }) => api.post('/lendings', data),
  approve: (id: string) => api.put(`/lendings/${id}/approve`),
  reject: (id: string, reason?: string) => api.put(`/lendings/${id}/reject`, { reason }),
  cancel: (id: string) => api.put(`/lendings/${id}/cancel`),
  start: (id: string) => api.put(`/lendings/${id}/start`),
  return: (id: string, note?: string) => api.put(`/lendings/${id}/return`, { note }),
  extend: (id: string, newEndDate: string) => api.put(`/lendings/${id}/extend`, { newEndDate }),
  getMyRequests: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get('/lendings', { params: { ...params, role: 'borrower' } }),
  getIncomingRequests: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get('/lendings', { params: { ...params, role: 'lender' } }),
  getHistory: (id: string) => api.get(`/lendings/${id}/history`),
};

export const neighborhoodsApi = {
  getAll: () => api.get('/neighborhoods'),
  getById: (id: string) => api.get(`/neighborhoods/${id}`),
  create: (data: { name: string; description: string }) => api.post('/neighborhoods', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/neighborhoods/${id}`, data),
  delete: (id: string) => api.delete(`/neighborhoods/${id}`),
  join: (inviteCode: string) => api.post('/neighborhoods/join', { inviteCode }),
  leave: (id: string) => api.post(`/neighborhoods/${id}/leave`),
  getMembers: (id: string) => api.get(`/neighborhoods/${id}/members`),
  regenerateInviteCode: (id: string) => api.post(`/neighborhoods/${id}/regenerate-code`),
  getMyNeighborhoods: () => api.get('/neighborhoods'),
};

export const membersApi = {
  updateRole: (memberId: string, role: 'MEMBER' | 'ADMIN') =>
    api.put(`/members/${memberId}/role`, { role }),
  remove: (memberId: string) => api.delete(`/members/${memberId}`),
  sendInvite: (neighborhoodId: string, email: string) =>
    api.post('/members/invite', { neighborhoodId, email }),
  listInvites: (neighborhoodId: string) => api.get(`/members/invites/${neighborhoodId}`),
  revokeInvite: (inviteId: string) => api.delete(`/members/invites/${inviteId}`),
};

export const categoriesApi = {
  getAll: (params?: { language?: string }) =>
    api.get('/categories', { params }),
  getTopLevel: (params?: { language?: string }) =>
    api.get('/categories/top-level', { params }),
  getById: (id: string) =>
    api.get(`/categories/${id}`),
  getWithChildren: (id: string, params?: { language?: string }) =>
    api.get(`/categories/${id}/with-children`, { params }),
  getToolsByCategory: (id: string, neighborhoodId: string, params?: { page?: number; pageSize?: number }) =>
    api.get(`/categories/${id}/tools`, { params: { neighborhoodId, ...params } }),
  create: (data: { key: string; nameEn: string; nameDe?: string; nameEs?: string; nameFr?: string; emoji?: string; parentId?: string; sortOrder?: number }) =>
    api.post('/categories', data),
  update: (id: string, data: { nameEn?: string; nameDe?: string; nameEs?: string; nameFr?: string; emoji?: string; sortOrder?: number; isActive?: boolean }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
  seed: () =>
    api.post('/categories/seed'),
};

export const adminApi = {
  // User management
  getUsers: (params?: { page?: number; pageSize?: number }) =>
    api.get('/users', { params }),
  updateUser: (id: string, data: Partial<{ firstName: string; lastName: string; role: string; isActive: boolean }>) =>
    api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // SMTP configuration
  getSmtpConfig: () => api.get('/notifications/admin/smtp'),
  updateSmtpConfig: (data: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  }) => api.put('/notifications/admin/smtp', data),
  sendTestEmail: (recipient: string) => api.post('/notifications/admin/smtp/test', { recipient }),

  // Stats and logs
  getStats: () => api.get('/notifications/admin/stats'),
  getEmailLogs: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get('/notifications/admin/email-logs', { params }),
};

export default api;
