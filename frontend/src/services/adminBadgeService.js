import apiClient from './apiClient';

const BASE_PATH = '/admin-gestor/badges';

export async function fetchAdminBadge(badgeId) {
  const response = await apiClient.get(`${BASE_PATH}/${badgeId}`);
  return response.data;
}

export async function createAdminBadge(payload) {
  const response = await apiClient.post(BASE_PATH, payload || {});
  return response.data;
}

export async function updateAdminBadge(badgeId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/${badgeId}`, payload || {});
  return response.data;
}

export async function fetchExpiringSoonBadges(days = 30) {
  const response = await apiClient.get(`${BASE_PATH}/expiring-soon`, { params: { days } });
  return response.data;
}
