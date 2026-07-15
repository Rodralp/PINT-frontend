import apiClient from './apiClient';

const DEFAULT_ROLE = 'consultor';
const DEFAULT_STATUS = 'pendente';

const normalizeEmail = (value) => value.trim().toLowerCase();

const normalizeRoles = (rolesValue) => {
  const rawRoles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(';')
      : [];

  const parsedRoles = rawRoles
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  const uniqueRoles = [...new Set(parsedRoles)];
  return uniqueRoles.length > 0 ? uniqueRoles : [DEFAULT_ROLE];
};

const sanitizeAccount = (account) => {
  const roles = normalizeRoles(account.roles ?? account.role);

  return {
    id: account.id,
    nome: account.nome || '',
    email: normalizeEmail(account.email || ''),
    role: roles[0],
    roles,
    status: account.status || DEFAULT_STATUS,
    hasPreferences: Boolean(account.hasPreferences),
    token: account.token || null,
  };
};

export async function registerAccount(payload) {
  const nome = payload?.nome?.trim() || '';
  const email = normalizeEmail(payload?.email || '');
  const senha = payload?.senha || '';

  if (!nome || !email || !senha) {
    throw new Error('Missing required fields.');
  }

  const response = await apiClient.post('/auth/register', { nome, email, senha });
  return sanitizeAccount(response.data);
}

export async function loginAccount(payload) {
  const email = normalizeEmail(payload?.email || '');
  const senha = payload?.senha || '';

  const response = await apiClient.post('/auth/login', { email, senha });
  return sanitizeAccount(response.data);
}

export async function recoverPassword(payload) {
  const email = normalizeEmail(payload?.email || '');

  const response = await apiClient.post('/auth/recover-password', { email });
  return response.data;
}

export async function resetPassword(payload) {
  const email = normalizeEmail(payload?.email || '');
  const newPassword = String(payload?.newPassword || '');

  if (!email || !newPassword) {
    throw new Error('Missing required fields.');
  }

  const response = await apiClient.post('/auth/reset-password', { email, newPassword });
  return sanitizeAccount(response.data);
}

export async function fetchRgpdTopics() {
  const response = await apiClient.get('/auth/rgpd-topics');
  return response.data;
}
export async function changePassword(payload) {
  const accountId = Number(payload?.accountId);
  const currentPassword = String(payload?.currentPassword || '');
  const newPassword = String(payload?.newPassword || '');

  if (!Number.isInteger(accountId) || accountId <= 0 || !currentPassword || !newPassword) {
    throw new Error('Missing required fields.');
  }

  const response = await apiClient.post('/auth/change-password', {
    accountId,
    currentPassword,
    newPassword,
  });

  return response.data;
}
