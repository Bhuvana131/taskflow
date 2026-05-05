// frontend/src/utils/helpers.js

export const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const today = () => new Date().toISOString().split('T')[0];

export const isOverdue = (dueDate, status) =>
  dueDate && status !== 'done' && new Date(dueDate) < new Date();

export const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const statusLabel = (s) =>
  ({ todo: 'To Do', in_progress: 'In Progress', done: 'Done' }[s] || s);

export const priorityColor = (p) =>
  ({ high: '#A32D2D', medium: '#854F0B', low: '#27500A' }[p] || '#444');

export const statusColor = (s) =>
  ({ todo: '#185FA5', in_progress: '#854F0B', done: '#27500A' }[s] || '#444');

export const getErrorMessage = (err) =>
  err?.response?.data?.message
  || err?.response?.data?.errors?.[0]?.message
  || err?.message
  || 'Something went wrong';
