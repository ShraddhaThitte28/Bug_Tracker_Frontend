import api from './axios';

/**
 * Fetch projects accessible to the logged-in user.
 */
export async function getProjectsApi() {
  const response = await api.get('/projects');
  return response.data;
}

/**
 * Fetch team members of a project.
 */
export async function getProjectMembersApi(projectId) {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
}

