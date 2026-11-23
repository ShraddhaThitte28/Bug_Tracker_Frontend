import api from './axios';

/**
 * Register a new user account.
 * Payload: { username, email, password }
 */
export async function registerApi(username, email, password) {
  const response = await api.post('/auth/register', { username, email, password });
  return response.data;
}

/**
 * Login user and obtain JWT access token.
 * Payload: { email, password }
 */
export async function loginApi(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

/**
 * Fetch currently authenticated user profile.
 */
export async function getCurrentUserApi() {
  const response = await api.get('/auth/me');
  return response.data;
}
