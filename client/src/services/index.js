import api from './api'

export const projectService = {
  getAll: () => api.get('/projects').then(r => r.data),
  getOne: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
}

export const taskService = {
  getByProject: (projectId) => api.get(`/tasks?projectId=${projectId}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data),
  updateStatus: (id, status, order) => api.patch(`/tasks/${id}/status`, { status, order }).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  getStats: () => api.get('/tasks/stats').then(r => r.data),
}

export const aiService = {
  generateTasks: (prompt, projectId) => api.post('/ai/generate-tasks', { prompt, projectId }).then(r => r.data),
}
