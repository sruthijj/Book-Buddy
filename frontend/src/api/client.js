/**
 * Production Axios API Client for Book Buddy.
 * Handles base URLs, automatic JWT Bearer token injection, and unified error handling.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Request Interceptor: Injects active JWT session token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('book_buddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles 401s (token expiration) cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if server rejects authentication
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('book_buddy_token');
        localStorage.removeItem('book_buddy_user');
        window.dispatchEvent(new Event('book_buddy_auth_change'));
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// API SERVICE MODULES
// ==========================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getOne: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  updateProgress: (id, data) => api.patch(`/books/${id}/progress`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const statsAPI = {
  getSummary: () => api.get('/stats/summary'),
  getGenres: () => api.get('/stats/genres'),
  getTimeline: (days = 30) => api.get('/stats/timeline', { params: { days } }),
};

export const isbnAPI = {
  lookup: (isbn) => api.get(`/isbn/${isbn}`),
};

export const aiAPI = {
  recommend: (data) => api.post('/ai/recommend', data),
  summarize: (data) => api.post('/ai/summarize', data),
  review: (data) => api.post('/ai/review', data),
  predictCompletion: (bookId) => api.get(`/ai/predict-completion/${bookId}`),
};

export default api;
