import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: 'Network error. Please try again.' });
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

// Asset APIs
export const assetAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  getCategories: () => api.get('/assets/categories'),
  createCategory: (data) => api.post('/assets/categories', data),
  getLocations: () => api.get('/assets/locations'),
  createLocation: (data) => api.post('/assets/locations', data),
  getHistory: (id, params) => api.get(`/assets/${id}/history`, { params }),
  uploadPhoto: (id, formData) => api.post(`/assets/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Borrow Request APIs
export const borrowAPI = {
  getAll: (params) => api.get('/borrow-requests', { params }),
  getById: (id) => api.get(`/borrow-requests/${id}`),
  create: (data) => api.post('/borrow-requests', data),
  submit: (id) => api.put(`/borrow-requests/${id}/submit`),
  approve: (id, data) => api.put(`/borrow-requests/${id}/approve`, data),
  reject: (id, data) => api.put(`/borrow-requests/${id}/reject`, data),
  confirmBorrow: (id) => api.put(`/borrow-requests/${id}/borrow-confirm`),
  returnAssets: (id, data) => api.put(`/borrow-requests/${id}/return`, data),
  cancel: (id) => api.put(`/borrow-requests/${id}/cancel`),
  getOverdue: () => api.get('/borrow-requests/overdue'),
};

// Repair Request APIs
export const repairAPI = {
  getAll: (params) => api.get('/repair-requests', { params }),
  getById: (id) => api.get(`/repair-requests/${id}`),
  create: (data) => api.post('/repair-requests', data),
  updateStatus: (id, data) => api.put(`/repair-requests/${id}/status`, data),
  close: (id, data) => api.put(`/repair-requests/${id}/close`, data),
  assign: (id, data) => api.put(`/repair-requests/${id}/assign`, data),
  cancel: (id, data) => api.put(`/repair-requests/${id}/cancel`, data),
};

// Parts & Inventory APIs
export const partAPI = {
  getAll: (params) => api.get('/parts', { params }),
  getById: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data),
  update: (id, data) => api.put(`/parts/${id}`, data),
  adjustStock: (id, data) => api.put(`/parts/${id}/stock-adjust`, data),
  getCategories: () => api.get('/parts/categories'),
  createCategory: (data) => api.post('/parts/categories', data),
  getLocations: () => api.get('/parts/locations'),
  createLocation: (data) => api.post('/parts/locations', data),
  getSuppliers: () => api.get('/parts/suppliers'),
  createSupplier: (data) => api.post('/parts/suppliers', data),
  getTransactions: (params) => api.get('/parts/transactions', { params }),
  getStockAlerts: () => api.get('/parts/stock-alerts'),
  getInventoryReport: () => api.get('/parts/reports/inventory'),
  getRepairPartsReport: (params) => api.get('/parts/reports/repair-parts', { params }),
  reservePart: (data) => api.post('/parts/reservations', data),
  cancelReservation: (id) => api.delete(`/parts/reservations/${id}`),
  getReservationsByRepair: (repairId) => api.get(`/parts/reservations/repair/${repairId}`),
  consumePart: (data) => api.post('/parts/consumptions', data),
  getConsumptionsByRepair: (repairId) => api.get(`/parts/consumptions/repair/${repairId}`),
};

// User APIs
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles'),
  getPermissions: () => api.get('/users/permissions'),
  createRole: (data) => api.post('/users/roles', data),
  updateRole: (id, data) => api.put(`/users/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/users/roles/${id}`),
  getDepartments: () => api.get('/users/departments'),
  createDepartment: (data) => api.post('/users/departments', data),
  updateDepartment: (id, data) => api.put(`/users/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/users/departments/${id}`),
};

// Dashboard APIs
export const dashboardAPI = {
  getAdminSummary: (params) => api.get('/dashboard/admin-summary', { params }),
  getAssetStatus: () => api.get('/dashboard/asset-status'),
  getBorrowTrends: (params) => api.get('/dashboard/borrow-trends', { params }),
  getRepairTrends: (params) => api.get('/dashboard/repair-trends', { params }),
  getAssetsByCategory: () => api.get('/dashboard/assets-by-category'),
  getOverdueItems: () => api.get('/dashboard/overdue-items'),
  getLatestActivities: (params) => api.get('/dashboard/latest-activities', { params }),
  getWarrantyExpiringSoon: (params) => api.get('/dashboard/warranty-expiring-soon', { params }),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;