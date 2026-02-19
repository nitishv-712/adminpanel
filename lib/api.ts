import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  me: () => api.get('/admin/auth/me'),
};

// ─── Stats ───────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get('/admin/stats'),
};

// ─── Users ───────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ─── Properties ──────────────────────────────────────────────
export const propertiesApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/properties', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/properties/${id}`, data),
  delete: (id: string) => api.delete(`/admin/properties/${id}`),
};

// ─── Inquiries ───────────────────────────────────────────────
export const inquiriesApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/inquiries', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/inquiries/${id}/status`, { status }),
};

// ─── Newsletter ──────────────────────────────────────────────
export const newsletterApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/newsletter', { params }),
};
