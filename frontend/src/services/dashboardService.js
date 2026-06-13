import apiClient from './apiClient';

const getStoredLoginData = () => {
  const sessionLoginData = sessionStorage.getItem('loginData');
  if (sessionLoginData) {
    try {
      return JSON.parse(sessionLoginData);
    } catch {
      return null;
    }
  }

  const localLoginData = localStorage.getItem('loginData');
  if (!localLoginData) {
    return null;
  }

  try {
    return JSON.parse(localLoginData);
  } catch {
    return null;
  }
};

const getLoggedAccountId = () => {
  const loginData = getStoredLoginData();
  const accountId = Number(loginData?.id);
  return Number.isInteger(accountId) && accountId > 0 ? accountId : null;
};

export async function fetchTalentManagerDashboard() {
  const accountId = getLoggedAccountId();
  const path = accountId
    ? `/dashboard/talent-manager?accountId=${accountId}`
    : '/dashboard/talent-manager';
  const response = await apiClient.get(path);
  return response.data;
}

export async function fetchServiceLineLeaderDashboard() {
  const accountId = getLoggedAccountId();
  const path = accountId
    ? `/dashboard/service-line-leader?accountId=${accountId}`
    : '/dashboard/service-line-leader';
  const response = await apiClient.get(path);
  return response.data;
}

export async function fetchAdminGestorDashboard() {
  const accountId = getLoggedAccountId();
  const path = accountId
    ? `/dashboard/admin-gestor?accountId=${accountId}`
    : '/dashboard/admin-gestor';
  const response = await apiClient.get(path);
  return response.data;
}

export async function fetchConsultorDashboard() {
  const loginData = getStoredLoginData();
  const accountId = Number(loginData?.id);
  const path = Number.isInteger(accountId) && accountId > 0
    ? `/dashboard/consultor?accountId=${accountId}`
    : '/dashboard/consultor';

  const response = await apiClient.get(path);
  return response.data;
}
