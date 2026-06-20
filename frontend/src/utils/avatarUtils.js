export const DEFAULT_AVATAR_URL = '/avatars/default-avatar.svg';

export function getStoredLoginData() {
  const session = sessionStorage.getItem('loginData');
  if (session) {
    try { return { data: JSON.parse(session), source: 'session' }; } catch { /* ignore */ }
  }
  const local = localStorage.getItem('loginData');
  if (local) {
    try { return { data: JSON.parse(local), source: 'local' }; } catch { /* ignore */ }
  }
  return { data: null, source: 'session' };
}

export function updateStoredLoginData(patch) {
  const stored = getStoredLoginData();
  if (!stored.data) return;
  const merged = { ...stored.data, ...patch };
  const serialized = JSON.stringify(merged);
  if (stored.source === 'local') {
    localStorage.setItem('loginData', serialized);
  } else {
    sessionStorage.setItem('loginData', serialized);
  }
}

export function getAvatarUrl(loginData) {
  if (loginData?.avatar) return loginData.avatar;
  return DEFAULT_AVATAR_URL;
}
