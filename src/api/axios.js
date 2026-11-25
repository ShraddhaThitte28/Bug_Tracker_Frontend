import axios from 'axios';

// Base URL configured via environment variable (empty string uses Vite dev proxy)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For FormData requests, remove inherited application/json header so the browser/Axios
    // can automatically set multipart/form-data with the correct boundary.
    if (config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle global errors like expired token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if unauthorized, except when on the login endpoint
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Format backend FastAPI error messages into a human-readable string.
 * Handles both simple strings (e.g., detail="Not found") and
 * Pydantic validation error lists (e.g., detail=[{loc: [...], msg: "..."}]).
 */
export function formatApiError(error) {
  if (!error.response) {
    return error.message || 'Network error: cannot reach the server.';
  }
  const detail = error.response.data?.detail;
  if (!detail) {
    return `Server error (${error.response.status})`;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((err) => `${err.loc?.slice(-1)[0] || 'Field'}: ${err.msg}`).join(', ');
  }
  return JSON.stringify(detail);
}

export default api;

