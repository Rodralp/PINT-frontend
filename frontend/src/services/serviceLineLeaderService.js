import apiClient from './apiClient';

export async function fetchMyServiceLine(accountId) {
  const response = await apiClient.get(`/service-line-leader/minha-service-line?accountId=${encodeURIComponent(accountId)}`);
  return response.data;
}

export async function fetchHistoricoAreasSLL(accountId) {
  const response = await apiClient.get(`/service-line-leader/historico/areas?accountId=${encodeURIComponent(accountId)}`);
  return response.data;
}

export async function fetchHistoricoBadgesSLL(accountId) {
  const response = await apiClient.get(`/service-line-leader/historico/badges?accountId=${encodeURIComponent(accountId)}`);
  return response.data;
}

export async function fetchHistoricoConsultoresSLL(accountId) {
  const response = await apiClient.get(`/service-line-leader/historico/consultores?accountId=${encodeURIComponent(accountId)}`);
  return response.data;
}

export async function fetchRankingConsultoresSLL(accountId) {
  const response = await apiClient.get(`/service-line-leader/ranking?accountId=${encodeURIComponent(accountId)}`);
  return response.data;
}

export async function fetchDetalhesConsultorSLL(accountId, consultorId) {
  const response = await apiClient.get(`/service-line-leader/historico/consultor?accountId=${encodeURIComponent(accountId)}&consultorId=${encodeURIComponent(consultorId)}`);
  return response.data;
}

export async function fetchDetalhesBadgeSLL(accountId, badgeId) {
  const response = await apiClient.get(`/service-line-leader/historico/badge?accountId=${encodeURIComponent(accountId)}&badgeId=${encodeURIComponent(badgeId)}`);
  return response.data;
}

export async function fetchHistoricoPorEstado(accountId, type, estado, entityId) {
  let endpoint = '';
  let id = '';
  
  // Extrair o tipo base (serviceLine, area, badge, consultor) e o ID
  if (type.includes('serviceLine')) {
    endpoint = '/service-line-leader/historico/service-line';
  } else if (type.includes('area')) {
    endpoint = '/service-line-leader/historico/area';
    id = `&areaId=${encodeURIComponent(entityId)}`;
  } else if (type.includes('badge')) {
    endpoint = '/service-line-leader/historico/badge-estado';
    id = `&badgeId=${encodeURIComponent(entityId)}`;
  } else if (type.includes('consultor')) {
    endpoint = '/service-line-leader/historico/consultor-estado';
    id = `&consultorId=${encodeURIComponent(entityId)}`;
  }
  
  const response = await apiClient.get(`${endpoint}?accountId=${encodeURIComponent(accountId)}${id}&estado=${encodeURIComponent(estado)}`);
  return response.data;
}

export async function fetchHistoricoCandidaturaSLL(pedidoId) {
  const response = await apiClient.get(`/service-line-leader/historico/candidatura?pedidoId=${encodeURIComponent(pedidoId)}`);
  return response.data;
}
