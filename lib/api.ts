import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let isCheckingAuth = false;

export const setCheckingAuth = (val: boolean) => { isCheckingAuth = val; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url: string = err.config?.url ?? '';
      
      // ✅ Broader check — cover all auth-related endpoints
      const isAuthEndpoint = 
        url.includes('/auth/me') || 
        url.includes('/auth/login') ||
        url.includes('/admin/auth');

      // ✅ Don't redirect if we're still doing the initial session check
      if (!isAuthEndpoint && !isCheckingAuth) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Admin Auth ───────────────────────────────────────────────
export const adminAuthApi = {
  login:          (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  me:             () => api.get('/admin/auth/me'),
  logout:         () => api.post('/admin/auth/logout'),
  updateMe:       (data: Record<string, unknown>) => api.patch('/admin/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/admin/auth/password', { currentPassword, newPassword }),
  // Superadmin only
  listAdmins:   (params?: Record<string, unknown>) => api.get('/admin/auth/admins', { params }),
  createAdmin:  (data: Record<string, unknown>) => api.post('/admin/auth/create-admin', data),
  updateAdmin:  (id: string, data: Record<string, unknown>) => api.patch(`/admin/auth/admins/${id}`, data),
  deleteAdmin:  (id: string) => api.delete(`/admin/auth/admins/${id}`),
};

// ─── Stats ────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get('/admin/stats'),
};

// ─── Web Users ────────────────────────────────────────────────
export const usersApi = {
  list:   (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ─── Properties ───────────────────────────────────────────────
export const propertiesApi = {
  list:   (params?: Record<string, unknown>) => api.get('/admin/properties', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/properties/${id}`, data),
  delete: (id: string) => api.delete(`/admin/properties/${id}`),
};

// ─── Inquiries ────────────────────────────────────────────────
export const inquiriesApi = {
  list:          (params?: Record<string, unknown>) => api.get('/admin/inquiries', { params }),
  getOne:        (id: string) => api.get(`/admin/inquiries/${id}`),
  updateStatus:  (id: string, status: string) =>
    api.patch(`/admin/inquiries/${id}/status`, { status }),
  sendMessage:   (id: string, text: string) =>
    api.post(`/admin/inquiries/${id}/message`, { text }),
  hideMessage:   (msgId: string, data: { visibleToUser?: boolean; visibleToOwner?: boolean }) =>
    api.patch(`/admin/inquiries/message/${msgId}/hide`, data),
  editMessage:   (msgId: string, text: string) =>
    api.patch(`/admin/inquiries/message/${msgId}/edit`, { text }),
  deleteMessage: (msgId: string) =>
    api.delete(`/admin/inquiries/message/${msgId}`),
};

// ─── Newsletter ───────────────────────────────────────────────
export const newsletterApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/newsletter', { params }),
};

// ─── Support Tickets ──────────────────────────────────────────
export const supportApi = {
  list:           (params?: Record<string, unknown>) => api.get('/admin/support', { params }),
  stats:          () => api.get('/admin/support/stats'),
  getOne:         (id: string, params?: Record<string, unknown>) =>
    api.get(`/admin/support/${id}`, { params }),
  sendMessage:    (id: string, message: string) =>
    api.post(`/admin/support/${id}/messages`, { message }),
  updateStatus:   (id: string, status: string) =>
    api.patch(`/admin/support/${id}/status`, { status }),
  updatePriority: (id: string, priority: string) =>
    api.patch(`/admin/support/${id}/priority`, { priority }),
  assign:         (id: string, assignedTo: string) =>
    api.patch(`/admin/support/${id}/assign`, { assignedTo }),
  close:          (id: string) => api.post(`/admin/support/${id}/close`),
  delete:         (id: string) => api.delete(`/admin/support/${id}`),
};

// ─── Reviews ──────────────────────────────────────────────────
export const reviewsApi = {
  list:         (params?: Record<string, unknown>) => api.get('/admin/reviews', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/reviews/${id}/status`, { status }),
  delete:       (id: string) => api.delete(`/admin/reviews/${id}`),
};