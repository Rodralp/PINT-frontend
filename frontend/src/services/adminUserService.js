import apiClient from './apiClient';

const sanitizeUsers = (items) => (
  Array.isArray(items)
    ? items.map((item) => ({
      id: Number(item?.id),
      nome: String(item?.nome || ''),
      email: String(item?.email || ''),
      role: String(item?.role || 'consultor'),
      roles: Array.isArray(item?.roles) ? item.roles : [String(item?.role || 'consultor')],
      status: String(item?.status || 'ativo'),
      joinedAt: String(item?.joinedAt || '--/--/----'),
      points: Number(item?.points || 0),
      badges: Number(item?.badges || 0),
      serviceLines: Array.isArray(item?.serviceLines) ? item.serviceLines : [],
    }))
    : []
);

export async function fetchAdminUsers({ tab = 'users', search = '', accountType = 'all' } = {}) {
  const response = await apiClient.get('/auth/admin/users', {
    params: {
      tab,
      search,
      accountType,
    },
  });

  return sanitizeUsers(response.data);
}

export async function fetchAdminServiceLines() {
  const response = await apiClient.get('/auth/admin/service-lines');
  return Array.isArray(response.data) ? response.data : [];
}

export async function createAdminUser(payload) {
  const response = await apiClient.post('/auth/admin/users', payload || {});
  return response.data;
}

export async function updateAdminUserPermissions(accountId, payload) {
  const response = await apiClient.patch(`/auth/admin/users/${accountId}/permissions`, payload || {});
  return response.data;
}

export async function updateAdminUserStatus(accountId, payload) {
  const response = await apiClient.patch(`/auth/admin/users/${accountId}/status`, payload || {});
  return response.data;
}

export async function decidePendingUser(accountId, payload) {
  const response = await apiClient.post(`/auth/admin/users/${accountId}/decision`, payload || {});
  return response.data;
}
