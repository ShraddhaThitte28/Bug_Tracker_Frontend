import api from './axios';

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

