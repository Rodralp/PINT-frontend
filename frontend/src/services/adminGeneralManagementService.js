import apiClient from './apiClient';

const BASE_PATH = '/admin-gestor/general-management';

export async function fetchAdminGeneralManagement() {
  const response = await apiClient.get(BASE_PATH);
  return response.data;
}

export async function updateAdminNotificationSettings(rows) {
  const response = await apiClient.put(`${BASE_PATH}/notifications`, { rows: rows || [] });
  return response.data;
}

export async function updateAdminRgpdTopics(rows) {
  const response = await apiClient.put(`${BASE_PATH}/rgpd`, { rows: rows || [] });
  return response.data;
}
