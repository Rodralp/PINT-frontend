import apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const getStoredLoginData = () => {
  const sessionLoginData = sessionStorage.getItem('loginData');

  if (sessionLoginData) {
    try {
      return { data: JSON.parse(sessionLoginData), source: 'session' };
    } catch {
      return null;
    }
  }

  const localLoginData = localStorage.getItem('loginData');
  if (!localLoginData) {
    return null;
  }

  try {
    return { data: JSON.parse(localLoginData), source: 'local' };
  } catch {
    return null;
  }
};

const persistLoginData = (source, data) => {
  const serialized = JSON.stringify(data);

  if (source === 'local') {
    localStorage.setItem('loginData', serialized);
    sessionStorage.removeItem('loginData');
    return;
  }

  sessionStorage.setItem('loginData', serialized);
  localStorage.removeItem('loginData');
};

const ensureLoggedAccountId = async () => {
  const stored = getStoredLoginData();

  if (!stored?.data) {
    return null;
  }

  const currentAccountId = Number(stored.data.id);
  if (Number.isInteger(currentAccountId) && currentAccountId > 0) {
    return currentAccountId;
  }

  const email = String(stored.data.email || '').trim();
  const senha = String(stored.data.senha || '');
  if (!email || !senha) {
    return null;
  }

  try {
    const response = await apiClient.post('/auth/login', { email, senha });
    const refreshedAccount = response.data;
    const refreshedAccountId = Number(refreshedAccount?.id);

    if (!Number.isInteger(refreshedAccountId) || refreshedAccountId <= 0) {
      return null;
    }

    persistLoginData(stored.source, {
      ...stored.data,
      id: refreshedAccountId,
      nome: refreshedAccount?.nome || stored.data.nome,
      email: refreshedAccount?.email || stored.data.email,
      role: refreshedAccount?.role || stored.data.role,
      roles: refreshedAccount?.roles || stored.data.roles,
      status: refreshedAccount?.status || stored.data.status,
      hasPreferences: typeof refreshedAccount?.hasPreferences === 'boolean'
        ? refreshedAccount.hasPreferences
        : stored.data.hasPreferences,
    });

    return refreshedAccountId;
  } catch {
    return null;
  }
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

export async function fetchManagedRequests(role) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const normalizedRole = normalizeRole(role);
  const response = await apiClient.get(
    `/request-management/${encodeURIComponent(normalizedRole)}/requests?accountId=${accountId}`,
  );
  return response.data;
}

export async function fetchManagedRequestById(role, requestId) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const normalizedRole = normalizeRole(role);
  const response = await apiClient.get(
    `/request-management/${encodeURIComponent(normalizedRole)}/requests/${encodeURIComponent(requestId)}?accountId=${accountId}`,
  );
  return response.data;
}

export async function submitManagedRequestDecision(role, requestId, payload) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const normalizedRole = normalizeRole(role);
  const response = await apiClient.post(
    `/request-management/${encodeURIComponent(normalizedRole)}/requests/${encodeURIComponent(requestId)}/decision`,
    {
      accountId,
      decision: payload?.decision,
      comment: payload?.comment || '',
    },
  );
  return response.data;
}

export async function getManagedEvidenceDownloadUrl(role, requestId, evidenceId) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const normalizedRole = normalizeRole(role);
  const safeRequestId = encodeURIComponent(requestId);
  const safeEvidenceId = encodeURIComponent(evidenceId);

  return `${API_BASE_URL}/request-management/${encodeURIComponent(normalizedRole)}/requests/${safeRequestId}/evidences/${safeEvidenceId}/download?accountId=${accountId}`;
}
