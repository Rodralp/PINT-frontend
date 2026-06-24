import apiClient from './apiClient';

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

  if (source === 'session') {
    sessionStorage.setItem('loginData', serialized);
    localStorage.removeItem('loginData');
    return;
  }

  if (data?.guardarDados) {
    localStorage.setItem('loginData', serialized);
    sessionStorage.removeItem('loginData');
  } else {
    sessionStorage.setItem('loginData', serialized);
    localStorage.removeItem('loginData');
  }
};

const updateStoredLoginData = (patch) => {
  const stored = getStoredLoginData();
  if (!stored?.data) {
    return;
  }

  persistLoginData(stored.source, {
    ...stored.data,
    ...patch,
  });
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

export async function fetchCatalogBadges(includeExpired = false) {
  const accountId = await ensureLoggedAccountId();
  const params = new URLSearchParams();
  if (includeExpired) params.set('includeExpired', 'true');
  if (accountId) params.set('accountId', accountId);
  const qs = params.toString();
  const response = await apiClient.get(`/consultor/catalog-badges${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function fetchLearningPaths() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/learning-paths?accountId=${accountId}`);
  return response.data;
}

export async function fetchMyBadges() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/meus-badges?accountId=${accountId}`);
  return response.data;
}

export async function requestBadgeAcquisition(badgeId) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.post(`/consultor/badges/${encodeURIComponent(badgeId)}/adquirir`, { accountId });
  return response.data;
}

export async function fetchPreferenceAreas() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/preferencias/areas?accountId=${accountId}`);
  return response.data;
}

export async function fetchUserPreferences() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/preferencias?accountId=${accountId}`);
  return response.data;
}

export async function saveUserPreferences(areaIds) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.put('/consultor/preferencias', { accountId, areaIds });
  updateStoredLoginData({ hasPreferences: true });
  return response.data;
}

export async function fetchBadgeSuggestions(limit = 3) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const parsedLimit = Number(limit);
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;
  const response = await apiClient.get(`/consultor/sugestoes?accountId=${accountId}&limit=${safeLimit}`);
  return response.data;
}

export async function fetchMyRequests() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/meus-pedidos?accountId=${accountId}`);
  return response.data;
}

export async function fetchPedidoDetail(pedidoId) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/pedidos/${encodeURIComponent(pedidoId)}?accountId=${accountId}`);
  return response.data;
}

export async function fetchRankingConsultores() {
  const response = await apiClient.get('/consultor/ranking');
  return response.data;
}

export async function fetchReminders() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/lembretes?accountId=${accountId}`);
  return response.data;
}

export async function createReminder(payload) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.post('/consultor/lembretes', { ...payload, accountId });
  return response.data;
}

export async function updateReminder(id, payload) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.put(`/consultor/lembretes/${id}`, { ...payload, accountId });
  return response.data;
}

export async function deleteReminder(id) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  await apiClient.delete(`/consultor/lembretes/${id}?accountId=${accountId}`);
}

export async function fetchProfileData() {
  const accountId = await ensureLoggedAccountId();
  const path = accountId
    ? `/consultor/profile?accountId=${accountId}`
    : '/consultor/profile';

  const response = await apiClient.get(path);
  const data = response.data;

  if (data && typeof data === 'object') {
    const points = Number(data.points);
    const badges = Number(data.badges);
    const ranking = Number(data.ranking);

    const patch = {};

    if (Number.isFinite(points)) {
      patch.points = points;
    }

    if (Number.isFinite(badges)) {
      patch.badges = badges;
    }

    if (Number.isFinite(ranking) && ranking > 0) {
      patch.ranking = ranking;
    }

    if (data.serviceLine) {
      patch.serviceLine = data.serviceLine;
    }

    if (Object.keys(patch).length > 0) {
      updateStoredLoginData(patch);
    }
  }

  return data;
}

// Public profile fetch by consultor id (does not require logged user)
export async function fetchPublicProfile(consultorId) {
  const parsed = String(consultorId || '').trim();
  if (!parsed) {
    throw new Error('Missing consultor id.');
  }

  const response = await apiClient.get(`/consultor/profile?accountId=${encodeURIComponent(parsed)}`);
  return response.data;
}

// Fetch badge requirements by badge ID
export async function fetchBadgeRequirements(badgeId) {
  const parsed = String(badgeId || '').trim();
  if (!parsed) {
    throw new Error('Missing badge id.');
  }

  const response = await apiClient.get(`/consultor/badge/${encodeURIComponent(parsed)}/requirements`);
  return response.data;
}

export async function uploadEvidence(pedidoId, nreq, files) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  if (!pedidoId) throw new Error('Missing pedido id.');

  const form = new FormData();
  form.append('accountId', String(accountId));
  form.append('nreq', String(nreq || ''));

  if (files && files.length) {
    // files can be FileList or array
    const arr = Array.from(files);
    arr.forEach((f) => form.append('files', f));
  }

  const response = await apiClient.post(`/consultor/pedidos/${encodeURIComponent(pedidoId)}/evidencias`, form);

  return response.data;
}

export async function fetchUserImage() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/consultor/user-image?accountId=${accountId}`);
  return response.data;
}

export async function uploadUserImage(imageData) {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.post('/consultor/user-image', { accountId, image: imageData });
  return response.data;
}

export async function deleteUserImage() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  await apiClient.delete(`/consultor/user-image?accountId=${accountId}`);
}
