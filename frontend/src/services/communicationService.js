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

const getLoggedAccountId = () => {
  const stored = getStoredLoginData();
  const accountId = Number(stored?.data?.id);
  return Number.isInteger(accountId) && accountId > 0 ? accountId : null;
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

export async function fetchAnnouncementRecipients() {
  const response = await apiClient.get('/announcements/recipients');
  return response.data;
}

export async function sendAnnouncement({ title, message, recipientIds, attachments, type, priority }) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const formData = new FormData();
  formData.append('accountId', String(accountId));
  formData.append('title', title || '');
  formData.append('message', message || '');

  if (type) {
    formData.append('type', String(type));
  }

  if (priority) {
    formData.append('priority', String(priority));
  }

  formData.append('recipientIds', JSON.stringify(recipientIds || []));

  (Array.isArray(attachments) ? attachments : []).forEach((file) => {
    formData.append('files', file);
  });

  const response = await apiClient.post('/announcements', formData);
  return response.data;
}

export async function fetchUserAnnouncements() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/announcements?accountId=${accountId}`);
  return response.data;
}

export async function fetchUserNotifications() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/notifications?accountId=${accountId}`);
  return response.data;
}

export async function fetchUserNotificationSettings() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/notifications/settings?accountId=${accountId}`);
  return response.data;
}

export async function updateUserNotificationSettings(settings) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.put('/notifications/settings', {
    accountId,
    settings: settings || {},
  });

  return response.data;
}

export function getAnnouncementAttachmentDownloadUrl(logId, fileId, accountIdOverride) {
  const accountId = accountIdOverride || getLoggedAccountId();
  if (!accountId || !logId || !fileId) {
    return '#';
  }

  const safeLogId = encodeURIComponent(logId);
  const safeFileId = encodeURIComponent(fileId);
  return `${API_BASE_URL}/announcements/${safeLogId}/files/${safeFileId}/download?accountId=${accountId}`;
}

export async function markNotificationRead(notificationId) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.patch(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    { accountId },
  );

  return response.data;
}
