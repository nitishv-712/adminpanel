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
      const isAuthEndpoint =
        url.includes('/auth/me') ||
        url.includes('/auth/login') ||
        url.includes('/admin/auth');
      if (!isAuthEndpoint && !isCheckingAuth) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Admin Auth ───────────────────────────────────────────────────────────────
export const adminAuthApi = {
  login:          (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  me:             () => api.get('/admin/auth/me'),
  logout:         () => api.post('/admin/auth/logout'),
  updateMe:       (data: Record<string, unknown>) => api.patch('/admin/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/admin/auth/password', { currentPassword, newPassword }),
  // adminUsers resource
  listAdmins:   (params?: Record<string, unknown>) => api.get('/admin/auth/admins', { params }),
  getAdmin:     (id: string) => api.get(`/admin/auth/admins/${id}`),
  createAdmin:  (data: Record<string, unknown>) => api.post('/admin/auth/admins', data),
  updateAdmin:  (id: string, data: Record<string, unknown>) => api.patch(`/admin/auth/admins/${id}`, data),
  deleteAdmin:  (id: string) => api.delete(`/admin/auth/admins/${id}`),
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const rolesApi = {
  // ─── ROLES ───────────────────────────────────────────────────────────────
  list:               () => api.get('/admin/roles'),
  getOne:             (id: string) => api.get(`/admin/roles/${id}`),
  getResourceActions: () => api.get('/admin/roles/resource-actions'),
  create:             (body: { name: string; label: string; description?: string; permissions?: Record<string, Record<string, boolean>> }) =>
    api.post('/admin/roles', body),
  updatePermissions:  (id: string, permissions: Record<string, Record<string, boolean>>) =>
    api.patch(`/admin/roles/${id}/permissions`, { permissions }),

  // ─── GROUPS ──────────────────────────────────────────────────────────────
  listGroups:   (params?: { role?: string; isActive?: boolean }) =>
    api.get('/admin/groups', { params }),
  getGroup:     (id: string) => api.get(`/admin/groups/${id}`),
  createGroup:  (body: { name: string; role: string; description?: string; permissions?: Record<string, Record<string, boolean>> }) =>
    api.post('/admin/groups', body),
  updateGroup:  (id: string, body: { name?: string; description?: string; permissions?: Record<string, Record<string, boolean>> }) =>
    api.patch(`/admin/groups/${id}`, body),
  deleteGroup:  (id: string) => api.delete(`/admin/groups/${id}`),

  addMember:    (groupId: string, adminId: string) =>
    api.post(`/admin/groups/${groupId}/members`, { adminId }),
  removeMember: (groupId: string, adminId: string) =>
    api.delete(`/admin/groups/${groupId}/members/${adminId}`),
};

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupsApi = {
  list:         (params?: Record<string, unknown>) => api.get('/admin/groups', { params }),
  getOne:       (id: string) => api.get(`/admin/groups/${id}`),
  create:       (data: Record<string, unknown>) => api.post('/admin/groups', data),
  update:       (id: string, data: Record<string, unknown>) => api.patch(`/admin/groups/${id}`, data),
  delete:       (id: string) => api.delete(`/admin/groups/${id}`),
  addMember:    (groupId: string, adminId: string) =>
    api.post(`/admin/groups/${groupId}/members`, { adminId }),
  removeMember: (groupId: string, adminId: string) =>
    api.delete(`/admin/groups/${groupId}/members/${adminId}`),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogsApi = {
  list:        (params?: {
    resource?:    string;
    action?:      string;
    performedBy?: string;
    targetId?:    string;
    ip?:          string;
    from?:        string;
    to?:          string;
    page?:        number;
    limit?:       number;
  }) => api.get('/admin/audit-logs', { params }),
  getOne:      (id: string) => api.get(`/admin/audit-logs/${id}`),
  getMeta:     () => api.get('/admin/audit-logs/meta'),
  update:      (id: string, data: { note?: string; flagged?: boolean }) =>
    api.patch(`/admin/audit-logs/${id}`, data),
  delete:      (id: string) => api.delete(`/admin/audit-logs/${id}`),
  bulkDelete:  (data: { resource?: string; action?: string; before?: string }) =>
    api.delete('/admin/audit-logs', { data }),
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get('/admin/stats'),
};

// ─── Web Users ────────────────────────────────────────────────────────────────
export const usersApi = {
  list:   (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getOne: (id: string) => api.get(`/admin/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  verify: (id: string) => api.patch(`/admin/users/${id}/verify`),
  ban:    (id: string, ban: boolean, reason?: string) =>
    api.patch(`/admin/users/${id}/ban`, { ban, reason }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};

// ─── Properties ───────────────────────────────────────────────────────────────
export const propertiesApi = {
  list:   (params?: Record<string, unknown>) => api.get('/admin/properties', { params }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/admin/properties/${id}`, data),
  delete: (id: string) => api.delete(`/admin/properties/${id}`),
};

// ─── Inquiries ────────────────────────────────────────────────────────────────
export const inquiriesApi = {
  list:          (params?: Record<string, unknown>) => api.get('/admin/inquiries', { params }),
  getOne:        (id: string) => api.get(`/admin/inquiries/${id}`),
  updateStatus:  (id: string, status: string) =>
    api.patch(`/admin/inquiries/${id}/status`, { status }),
  delete:        (id: string) => api.delete(`/admin/inquiries/${id}`),
  sendMessage:   (id: string, text: string) =>
    api.post(`/admin/inquiries/${id}/message`, { text }),
  hideMessage:   (msgId: string, data: { visibleToUser?: boolean; visibleToOwner?: boolean }) =>
    api.patch(`/admin/inquiries/message/${msgId}/hide`, data),
  editMessage:   (msgId: string, text: string) =>
    api.patch(`/admin/inquiries/message/${msgId}/edit`, { text }),
  deleteMessage: (msgId: string) =>
    api.delete(`/admin/inquiries/message/${msgId}`),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const newsletterApi = {
  list:   (params?: Record<string, unknown>) => api.get('/admin/newsletter', { params }),
  delete: (id: string) => api.delete(`/admin/newsletter/${id}`),
  export: () => api.get('/admin/newsletter/export'),
};

// ─── Support Tickets ──────────────────────────────────────────────────────────
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

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsApi = {
  list:         (params?: Record<string, unknown>) => api.get('/admin/reviews', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/reviews/${id}/status`, { status }),
  delete:       (id: string) => api.delete(`/admin/reviews/${id}`),
};
