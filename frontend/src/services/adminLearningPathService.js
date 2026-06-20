import apiClient from './apiClient';

const BASE_PATH = '/admin-gestor/learning-paths';

export async function fetchAdminLearningPaths() {
  const response = await apiClient.get(BASE_PATH);
  return response.data;
}

export async function createAdminLearningPath(payload) {
  const response = await apiClient.post(BASE_PATH, payload || {});
  return response.data;
}

export async function updateAdminLearningPath(learningPathId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/${learningPathId}`, payload || {});
  return response.data;
}

export async function updateAdminLearningPathStatus(learningPathId, isActive) {
  const response = await apiClient.patch(`${BASE_PATH}/${learningPathId}/status`, { isActive });
  return response.data;
}

export async function createAdminServiceLine(learningPathId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/${learningPathId}/service-lines`, payload || {});
  return response.data;
}

export async function updateAdminServiceLine(serviceLineId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/service-lines/${serviceLineId}`, payload || {});
  return response.data;
}

export async function updateAdminServiceLineStatus(serviceLineId, isActive) {
  const response = await apiClient.patch(`${BASE_PATH}/service-lines/${serviceLineId}/status`, { isActive });
  return response.data;
}

export async function createAdminArea(serviceLineId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/service-lines/${serviceLineId}/areas`, payload || {});
  return response.data;
}

export async function updateAdminArea(areaId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/areas/${areaId}`, payload || {});
  return response.data;
}

export async function updateAdminAreaStatus(areaId, isActive) {
  const response = await apiClient.patch(`${BASE_PATH}/areas/${areaId}/status`, { isActive });
  return response.data;
}

export async function createAdminLevel(areaId, payload) {
  const response = await apiClient.post(`${BASE_PATH}/areas/${areaId}/levels`, payload || {});
  return response.data;
}

export async function updateAdminLevel(levelId, payload) {
  const response = await apiClient.put(`${BASE_PATH}/levels/${levelId}`, payload || {});
  return response.data;
}

export async function updateAdminLevelStatus(levelId, isActive) {
  const response = await apiClient.patch(`${BASE_PATH}/levels/${levelId}/status`, { isActive });
  return response.data;
}
