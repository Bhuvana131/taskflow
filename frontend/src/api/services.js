// frontend/src/api/services.js
import api from './axios';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  getMe:         ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:   ()         => api.get('/users'),
  getById:  (id)       => api.get(`/users/${id}`),
  update:   (id, data) => api.put(`/users/${id}`, data),
  delete:   (id)       => api.delete(`/users/${id}`),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll:   ()         => api.get('/projects'),
  getById:  (id)       => api.get(`/projects/${id}`),
  getStats: (id)       => api.get(`/projects/${id}/stats`),
  create:   (data)     => api.post('/projects', data),
  update:   (id, data) => api.put(`/projects/${id}`, data),
  delete:   (id)       => api.delete(`/projects/${id}`),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:       (params) => api.get('/tasks', { params }),
  getById:      (id)     => api.get(`/tasks/${id}`),
  getDashboard: ()       => api.get('/tasks/dashboard'),
  create:       (data)   => api.post('/tasks', data),
  update:       (id, data) => api.put(`/tasks/${id}`, data),
  delete:       (id)     => api.delete(`/tasks/${id}`),
};
