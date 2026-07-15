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

const ensureLoggedAccountId = async () => {
  const stored = getStoredLoginData();
  const accountId = stored?.data?.id;

  if (!accountId) {
    return null;
  }

  return Number(accountId);
};

export async function fetchHistoricoServiceLines() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/talent-manager/historico/service-lines?accountId=${accountId}`);
  return response.data;
}

export async function fetchHistoricoBadges() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/talent-manager/historico/badges?accountId=${accountId}`);
  return response.data;
}

export async function fetchHistoricoConsultores() {
  const accountId = await ensureLoggedAccountId();
  if (!accountId) {
    throw new Error('Missing logged account id.');
  }

  const response = await apiClient.get(`/talent-manager/historico/consultores?accountId=${accountId}`);
  return response.data;
}

export async function fetchDetalhesConsultor(consultorId) {
  const response = await apiClient.get(`/talent-manager/historico/consultor?consultorId=${consultorId}`);
  return response.data;
}

export async function fetchDetalhesBadge(badgeId) {
  const response = await apiClient.get(`/talent-manager/historico/badge?badgeId=${badgeId}`);
  return response.data;
}

export async function fetchDetalhesServiceLine(serviceLineId) {
  const response = await apiClient.get(`/talent-manager/historico/service-line?serviceLineId=${serviceLineId}`);
  return response.data;
}

export async function fetchHistoricoPorEstadoTM(type, estado, entityId, extraParams = {}) {
  let endpoint = '';
  let params = `estado=${encodeURIComponent(estado)}`;

  if (type.includes('serviceLine')) {
    endpoint = '/talent-manager/historico/service-line-estado';
    if (extraParams.serviceLineId) {
      params += `&serviceLineId=${encodeURIComponent(extraParams.serviceLineId)}`;
    }
  } else if (type.includes('area')) {
    endpoint = '/talent-manager/historico/area-estado';
    params += `&areaId=${encodeURIComponent(entityId)}`;
  } else if (type.includes('badge')) {
    endpoint = '/talent-manager/historico/badge-estado';
    params += `&badgeId=${encodeURIComponent(entityId)}`;
  } else if (type.includes('consultor')) {
    endpoint = '/talent-manager/historico/consultor-estado';
    params += `&consultorId=${encodeURIComponent(entityId)}`;
  }

  const response = await apiClient.get(`${endpoint}?${params}`);
  return response.data;
}

export async function fetchHistoricoCandidaturaTM(pedidoId) {
  const response = await apiClient.get(`/talent-manager/historico/candidatura?pedidoId=${encodeURIComponent(pedidoId)}`);
  return response.data;
}
