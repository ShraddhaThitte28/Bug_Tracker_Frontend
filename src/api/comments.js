import api from './axios';

/**
 * Fetch threaded comments for a ticket.
 * Returns top-level comments with their direct replies in chronological order.
 */
export async function getCommentsApi(ticketId) {
  const response = await api.get(`/tickets/${ticketId}/comments`);
  return response.data;
}

/**
 * Post a comment or reply on a ticket.
 * Payload: { body, parent_id }
 * - parent_id: null for top-level comment; integer for reply.
 * - author_id is automatically assigned by the backend from the JWT.
 */
export async function createCommentApi(ticketId, commentData) {
  const response = await api.post(`/tickets/${ticketId}/comments`, commentData);
  return response.data;
}

