/**
 * Production Axios API Client for Book Buddy.
 * Handles base URLs, automatic JWT Bearer token injection, and unified error handling.
 */

import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds: Accommodates Render free-tier cold-start wakeups (30-50s)
});

// Cold-Start In-Flight Request Tracker (fires after 2.5 seconds of pending network activity)
let activeRequestsCount = 0;
let coldStartTimer = null;

const notifyColdStart = (isCold) => {
  window.dispatchEvent(new CustomEvent('book_buddy_cold_start', { detail: { isColdStart: isCold } }));
};

const handleRequestStart = () => {
  activeRequestsCount++;
  if (activeRequestsCount === 1 && !coldStartTimer) {
    coldStartTimer = setTimeout(() => {
      notifyColdStart(true);
    }, 2500); // 2.5s threshold indicates cloud container is booting up
  }
};

const handleRequestEnd = () => {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    notifyColdStart(false);
  }
};

// Request Interceptor: Injects active JWT session token and starts cold-start timer
api.interceptors.request.use(
  (config) => {
    handleRequestStart();
    const token = localStorage.getItem('book_buddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    handleRequestEnd();
    return Promise.reject(error);
  }
);

// Response Interceptor: Clears timer and handles 401s (token expiration) cleanly
api.interceptors.response.use(
  (response) => {
    handleRequestEnd();
    return response;
  },
  (error) => {
    handleRequestEnd();
    if (error.response && error.response.status === 401) {
      // Clear token if server rejects authentication
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
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

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
