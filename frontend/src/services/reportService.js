import apiClient from './apiClient';

export async function fetchBadgeAssignmentReport(filters = {}) {
  const params = new URLSearchParams();
  if (filters.areaId) params.append('areaId', filters.areaId);
  if (filters.nivelId) params.append('nivelId', filters.nivelId);
  if (filters.serviceLineId) params.append('serviceLineId', filters.serviceLineId);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  const query = params.toString();
  const { data } = await apiClient.get(`/reports/badge-assignments${query ? `?${query}` : ''}`);
  return data;
}
