import api from './axios';

/**
 * Fetch tickets accessible to the logged-in user.
 * Optional query params: { project_id, status_filter, priority_filter, type_filter }
 */
export async function getTicketsApi(params = {}) {
  const response = await api.get('/tickets', { params });
  return response.data;
}

/**
 * Create a new ticket.
 * Payload: { title, description, type, status, priority, project_id, assignee_id }
 * Note: created_by is omitted; backend assigns it automatically from JWT.
 */
export async function createTicketApi(ticketData) {
  const response = await api.post('/tickets', ticketData);
  return response.data;
}

/**
 * Update a ticket's workflow status.
 * Uses PUT /tickets/{ticket_id} with partial payload { status }.
 * The backend TicketUpdate schema preserves all other fields.
 */
export async function updateTicketStatusApi(ticketId, status) {
  const response = await api.put(`/tickets/${ticketId}`, { status });
  return response.data;
}

/**
 * Fetch a single ticket by its ID.
 * Returns TicketResponse.
 */
export async function getTicketByIdApi(ticketId) {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data;
}

/**
 * Update ticket details (partial update).
 * Uses PUT /tickets/{ticket_id}; only the supplied payload fields are changed.
 * Returns the updated TicketResponse.
 */
export async function updateTicketApi(ticketId, payload) {
  const response = await api.put(`/tickets/${ticketId}`, payload);
  return response.data;
}

/**
 * Delete a ticket (also deletes its comments and replies).
 * Uses DELETE /tickets/{ticket_id}; the backend responds with 204 No Content.
 */
export async function deleteTicketApi(ticketId) {
  const response = await api.delete(`/tickets/${ticketId}`);
  return response.data;
}


