import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { downloadHtmlAsPdf, resolveImageUrl, resolveBadgeFrameImage, renderMaskedBadge } from '../../utils/pdfExport.js';
import {
  ArrowDownToLine,
  Clock3,
  FileDown,
  Filter,
  Medal,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import BadgeImage from '../../components/BadgeImage';
import { fetchManagedRequests } from '../../services/requestManagementService';
import { fetchAdminUsers } from '../../services/adminUserService';
import { fetchCatalogBadges } from '../../services/consultorService';
import { fetchBadgeAssignmentReport } from '../../services/reportService';
import '../../css/AdminGestor/Exportacoes_AG.css';
import '../../css/Consultor/CatalogoBadges_C.css';

const parsePtDate = (value) => {
  const normalized = String(value || '').trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split('/').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }

  return parsed;
};

const normalizeLevelId = (level) => {
  const normalized = String(level || '').trim().toLowerCase();

  if (normalized.includes('júnior') || normalized.includes('junior')) {
    return 'junior';
  }

  if (normalized.includes('intermédio') || normalized.includes('intermedio')) {
    return 'intermedio';
  }

  if (normalized.includes('sénior') || normalized.includes('senior')) {
    return 'senior';
  }

  if (normalized.includes('especialista')) {
    return 'especialista';
  }

  if (normalized.includes('líder') || normalized.includes('lider')) {
    return 'lider';
  }

  return 'junior';
};

const getExpirationStatus = (validade, t) => {
  if (!validade) return null;
  const today = new Date();
  const expDate = new Date(validade);
  const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) return { status: 'expired', label: t('export_expired'), days: daysUntil };
  if (daysUntil <= 30) return { status: 'expiring', label: `${t('export_expires')} ${daysUntil} dias`, days: daysUntil };
  return null;
};

const badgeLevels = [
  { id: 'junior', label: 'Júnior', points: 100, badgeImage: '/badges/Júnior.png' },
  { id: 'intermedio', label: 'Intermédio', points: 150, badgeImage: '/badges/Intermédio.png' },
  { id: 'senior', label: 'Sénior', points: 200, badgeImage: '/badges/Sénior.png' },
  { id: 'especialista', label: 'Especialista', points: 250, badgeImage: '/badges/Especialista.png' },
  { id: 'lider', label: 'Líder de Conhecimento', points: 300, badgeImage: '/badges/Líder de Conhecimento.png' },
  { id: 'especial', label: 'Especial', points: 0, badgeImage: '/badges/Especial.png' },
];

const ALL_LEVEL_NAMES = ['Nível Júnior', 'Nível Intermédio', 'Nível Sénior', 'Nível Especialista', 'Nível Lider de Conhecimento', 'Especial'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

const buildBarChartScale = (data) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const step = Math.max(1, Math.ceil(maxVal / 4));
  const max = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((m) => step * m);
  return { max, ticks };
};

const normalizeLevelTitle = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'N/A';
  }

  if (raw.includes(' - ')) {
    const suffix = raw.split(' - ').slice(1).join(' - ').trim();
    if (suffix) {
      return suffix;
    }
  }

  return raw.replace(/^nivel\s+/i, '').trim() || raw;
};

const formatDateForUi = (value, fallback = '--/--/----') => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return fallback;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString('pt-PT');
};

const normalizeRequestExportStatus = (request) => {
  const tableStatus = String(request?.tableStatus || '').trim().toLowerCase();
  if (tableStatus === 'aprovado') {
    return 'enviado';
  }

  if (tableStatus === 'rejeitado') {
    return 'rejeitado';
  }

  const workflowStatus = String(request?.status || '').trim().toLowerCase();
  if (workflowStatus === 'aprovado') {
    return 'enviado';
  }

  if (workflowStatus === 'rejeitado') {
    return 'rejeitado';
  }

  return 'pendente';
};

const normalizeConsultantStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'ativo' || normalized === 'inativo' || normalized === 'pendente') {
    return normalized;
  }

  return 'inativo';
};

const toConsultantStatusLabel = (status, t) => {
  const normalized = normalizeConsultantStatus(status);
  if (normalized === 'ativo') {
    return t('active');
  }

  if (normalized === 'pendente') {
    return t('export_filter_pending');
  }

  return t('inactive');
};

const getLoginName = () => {
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');

  if (!storedLoginData) {
    return '';
  }

  try {
    const parsed = JSON.parse(storedLoginData);
    return parsed?.nome || '';
  } catch {
    return '';
  }
};

const translateLevel = (levelKey, t) => {
  const map = {
    'badge_level_junior': 'badge_level_junior',
    'badge_level_intermediate': 'badge_level_intermediate',
    'badge_level_senior': 'badge_level_senior',
    'badge_level_specialist': 'badge_level_specialist',
    'badge_level_knowledge_lead': 'badge_level_knowledge_lead',
    'junior': 'badge_level_junior',
    'intermedio': 'badge_level_intermediate',
    'senior': 'badge_level_senior',
    'especialista': 'badge_level_specialist',
    'lider': 'badge_level_knowledge_lead'
  };
  return t(map[levelKey] || levelKey);
};

const generateBadgesCSV = (badges, t) => {
  const BOM = '\uFEFF';
  const headers = [t('export_csv_badge_name'), t('export_csv_type'), t('export_th_area'), t('export_th_points'), t('export_th_date'), 'ID'];
  const rows = badges.map(badge => {
    const levelName = translateLevel(badge.levelId || badge.level, t);
    return [
      `"${badge.name || badge.area} - ${levelName}"`,
      `"${levelName}"`,
      `"${badge.area}"`,
      badge.points,
      `"${badge.date}"`,
      `"${badge.id}"`
    ];
  });

  return BOM + [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');
};

const generateBadgePagesPDF = async (badges, userName, t) => {
  const renderedBadges = await Promise.all(
    badges.map((badge) =>
      renderMaskedBadge(resolveImageUrl(badge.badgeImage), badge.levelId || badge.level, 120)
    )
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t('export_tab_badges')}</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;">
      ${badges.map((badge, index) => {
        const badgeDataUrl = renderedBadges[index];
        return `
        <div style="background:white;border-radius:24px;padding:60px 80px;max-width:600px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,102,255,0.15);border:4px solid #0066ff;position:relative;margin-bottom:40px;overflow:hidden;${index < badges.length - 1 ? 'page-break-after:always;' : ''}">
          <div style="font-size:18px;font-weight:700;color:#0066ff;letter-spacing:2px;margin-bottom:30px;text-transform:uppercase;">SOFTINSA</div>
          <div style="margin:0 auto 40px auto;display:flex;justify-content:center;align-items:center;width:120px;height:120px;">
            <img src="${badgeDataUrl}" alt="Badge" style="width:120px;height:120px;object-fit:contain;" />
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">${t('export_th_area')}</span>
            <span style="font-weight:700;color:#0066ff;">${badge.area || ''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">${t('export_th_level')}</span>
            <span style="font-weight:700;color:#0066ff;">${translateLevel(badge.levelId || badge.level, t)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">${t('export_th_points')}</span>
            <span style="font-weight:700;color:#0066ff;">${badge.points || ''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">${t('export_th_date')}</span>
            <span style="font-weight:700;color:#0066ff;">${badge.date || ''}</span>
          </div>
          <div style="font-size:16px;color:#868e96;margin:12px 0;">${t('export_badge_data')}</div>
          <div style="font-size:22px;font-weight:700;color:#343a40;margin:8px 0;">${userName}</div>
        </div>`;
      }).join('')}
    </body>
    </html>
  `;
  return html;
};

const generateRequestsPDF = (requests, t) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t('export_tab_requests')}</title>
    </head>
    <body style="margin:0;padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="font-size:28px;color:#343a40;margin:0 0 8px 0;">${t('export_tab_requests')}</h1>
        <p style="color:#868e96;font-size:14px;margin:0;">${t('export_date_label')}: ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <thead>
          <tr style="background:#0066ff;color:white;">
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">ID</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_consultant')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_badge')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_level')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_date')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_status')}</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(req => `
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${req.id}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${req.consultant}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${req.badge}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${req.level}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${req.date}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;"><span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;background:${req.status === 'enviado' ? '#d1fae5' : req.status === 'pendente' ? '#fef3c7' : '#fee2e2'};color:${req.status === 'enviado' ? '#047857' : req.status === 'pendente' ? '#b45309' : '#b91c1c'};">${req.status === 'enviado' ? 'Aprovado' : req.status === 'pendente' ? 'Pendente' : 'Rejeitado'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
};

const generateRequestsCSV = (requests, t) => {
  const BOM = '\uFEFF';
  const headers = ['ID', t('export_th_consultant'), t('export_th_badge'), t('export_th_level'), t('export_th_date'), t('export_th_status')];
  const rows = requests.map(req => [
    req.id,
    `"${req.consultant}"`,
    `"${req.badge}"`,
    `"${req.level}"`,
    `"${req.date}"`,
    `"${req.status}"`
  ]);
  return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
};

const generateConsultantsPDF = (consultants, t) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t('export_tab_consultants')}</title>
    </head>
    <body style="margin:0;padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="font-size:28px;color:#343a40;margin:0 0 8px 0;">${t('export_tab_consultants')}</h1>
        <p style="color:#868e96;font-size:14px;margin:0;">${t('export_date_label')}: ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <thead>
          <tr style="background:#0066ff;color:white;">
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_ranking')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_name')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_email')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_points')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_joined_date')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_badges')}</th>
            <th style="padding:14px 16px;text-align:left;font-weight:600;font-size:14px;">${t('export_th_status')}</th>
          </tr>
        </thead>
        <tbody>
          ${consultants.map((c, index) => `
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${index + 1}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${c.name}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${c.email}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${c.points}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${c.joinedAt}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;">${c.badges}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e9ecef;font-size:14px;color:#495057;"><span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;background:${c.status === 'ativo' ? '#d4edda' : '#f8d7da'};color:${c.status === 'ativo' ? '#155724' : '#721c24'};">${c.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
};

const generateConsultantsCSV = (consultants, t) => {
  const BOM = '\uFEFF';
  const headers = [t('export_th_ranking'), t('export_th_name'), t('export_th_email'), t('export_th_points'), t('export_th_joined_date'), t('export_th_badges'), t('export_th_status')];
  const rows = consultants.map((c, index) => [
    index + 1,
    `"${c.name}"`,
    `"${c.email}"`,
    c.points,
    `"${c.joinedAt}"`,
    c.badges,
    `"${c.status}"`
  ]);
  return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
};

function ExportacoesAG() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = useMemo(() => [
    { id: 'pedidos', label: t('export_tab_requests') },
    { id: 'badges', label: t('export_tab_badges') },
    { id: 'consultores', label: t('export_tab_consultants') },
    { id: 'relatorio', label: t('export_tab_report') },
  ], [t]);

  const requestStatusFilters = useMemo(() => [
    { id: 'enviado', label: t('export_filter_sent') },
    { id: 'pendente', label: t('export_filter_pending') },
    { id: 'rejeitado', label: t('export_filter_rejected') },
  ], [t]);

  const levelFilterOptions = useMemo(() => [
    { id: 'todos', label: t('export_filter_all_levels') },
    { id: 'junior', label: t('badge_level_junior') },
    { id: 'intermedio', label: t('badge_level_intermediate') },
    { id: 'senior', label: t('badge_level_senior') },
    { id: 'especialista', label: t('badge_level_specialist') },
    { id: 'lider', label: t('badge_level_knowledge_lead') },
  ], [t]);

  const consultantFilterOptions = useMemo(() => [
    { id: 'todos', label: t('export_filter_all_states') },
    { id: 'ativo', label: t('active') },
    { id: 'inativo', label: t('inactive') },
  ], [t]);

  const requestSortOptions = useMemo(() => [
    { id: 'recentes', label: t('export_sort_recent') },
    { id: 'antigas', label: t('export_sort_oldest') },
    { id: 'consultor_az', label: t('export_sort_consultant_az') },
  ], [t]);

  const badgeSortOptions = useMemo(() => [
    { id: 'padrao', label: t('export_sort_default') },
    { id: 'points_desc', label: t('export_sort_points_desc') },
    { id: 'points_asc', label: t('export_sort_points_asc') },
    { id: 'area_asc', label: t('export_sort_area_az') },
  ], [t]);

  const consultantSortOptions = useMemo(() => [
    { id: 'points_desc', label: t('export_sort_points_desc') },
    { id: 'points_asc', label: t('export_sort_points_asc') },
    { id: 'badges_desc', label: t('export_sort_badges_desc') },
    { id: 'badges_asc', label: t('export_sort_badges_asc') },
    { id: 'nome_az', label: t('export_sort_name_az') },
    { id: 'entrada_recente', label: t('export_sort_joined_recent') },
  ], [t]);

  const tabDefaults = useMemo(() => ({
    pedidos: { filter: 'todos', sort: 'recentes' },
    badges: { filter: 'todos', sort: 'padrao' },
    consultores: { filter: 'todos', sort: 'points_desc' },
    relatorio: { filter: 'todos', sort: 'padrao' },
  }), []);

  const requestStatusMeta = useMemo(() => ({
    enviado: { label: t('export_filter_sent'), className: 'sent' },
    pendente: { label: t('export_filter_pending'), className: 'pending' },
    rejeitado: { label: t('export_filter_rejected'), className: 'rejected' },
  }), [t]);

  const [requestItems, setRequestItems] = useState([]);
  const [consultantItems, setConsultantItems] = useState([]);
  const [badgeItems, setBadgeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [requestsData, consultantsData, badgesData] = await Promise.all([
          fetchManagedRequests('admin-gestor'),
          fetchAdminUsers({ tab: 'users', search: '', accountType: 'consultor' }),
          fetchCatalogBadges(false),
        ]);

        const formattedRequests = (Array.isArray(requestsData) ? requestsData : []).map((request) => ({
          id: Number(request?.id),
          detailId: Number(request?.id),
          consultant: String(request?.consultant || 'N/A'),
          badge: String(request?.badge || 'N/A'),
          level: normalizeLevelTitle(request?.level || request?.levelLabel || 'N/A'),
          date: formatDateForUi(request?.date),
          status: normalizeRequestExportStatus(request),
        }));

        const formattedConsultants = (Array.isArray(consultantsData) ? consultantsData : []).map((consultant) => ({
          id: Number(consultant?.id),
          name: String(consultant?.nome || consultant?.name || 'N/A'),
          email: String(consultant?.email || 'N/A'),
          points: Number(consultant?.points || 0),
          joinedAt: formatDateForUi(consultant?.joinedAt || consultant?.dataEntrada),
          badges: Number(consultant?.badges || 0),
          status: normalizeConsultantStatus(consultant?.status),
        }));

        const formattedBadges = (Array.isArray(badgesData) ? badgesData : []).map((badge, index) => {
          const isSpecial = Boolean(badge?.isSpecial) || badge?.typeId === 'special' || !badge?.levelKey;
          const levelKey = isSpecial ? null : (badge?.levelKey || badge?.typeId || null);
          const levelLabel = isSpecial ? 'Especial' : (badge?.levelLabel || badge?.level || translateLevel(levelKey, t) || 'Badge');
          const typeId = badge?.typeId || levelKey || (isSpecial ? 'special' : null);

          return {
            id: Number(badge?.id) || index,
            name: badge?.name || badge?.area || 'Badge',
            area: badge?.area || badge?.name || 'Badge',
            levelId: levelKey,
            levelKey: levelKey,
            typeId: typeId,
            isSpecial,
            levelLabel: levelLabel,
            level: levelLabel,
            points: Number(badge?.points) || 0,
            badgeImage: badge?.badgeImage || null,
            validade: badge?.validade || null,
            date: formatDateForUi(badge?.date),
          };
        });

        setRequestItems(formattedRequests);
        setConsultantItems(formattedConsultants);
        setBadgeItems(formattedBadges);
      } catch (err) {
        console.error('Error loading export data:', err);
        setError(t('export_load_error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const [activeTab, setActiveTab] = useState('pedidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(tabDefaults.pedidos.filter);
  const [sortBy, setSortBy] = useState(tabDefaults.pedidos.sort);
  const [activeRequestStatuses, setActiveRequestStatuses] = useState(requestStatusFilters.map((item) => item.id));
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);
  const [selectedConsultantIds, setSelectedConsultantIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);

  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportAreaId, setReportAreaId] = useState('');
  const [reportNivelId, setReportNivelId] = useState('');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [expandedReportAreas, setExpandedReportAreas] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const filterOptions = useMemo(
    () => (activeTab === 'consultores' ? consultantFilterOptions : levelFilterOptions),
    [activeTab],
  );

  const sortOptions = useMemo(() => {
    if (activeTab === 'pedidos') {
      return requestSortOptions;
    }

    if (activeTab === 'consultores') {
      return consultantSortOptions;
    }

    return badgeSortOptions;
  }, [activeTab]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }

      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requestItems.filter((item) => {
      const levelId = normalizeLevelId(item.level);
      const matchesSearch =
        normalizedSearch.length === 0
        || item.consultant.toLowerCase().includes(normalizedSearch)
        || item.badge.toLowerCase().includes(normalizedSearch)
        || item.level.toLowerCase().includes(normalizedSearch);
      const matchesLevel = activeFilter === 'todos' || levelId === activeFilter;
      const matchesStatus = activeRequestStatuses.includes(item.status);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [requestItems, searchTerm, activeFilter, activeRequestStatuses]);

  const sortedRequests = useMemo(() => {
    const nextRows = [...filteredRequests];

    if (sortBy === 'antigas') {
      nextRows.sort((a, b) => parsePtDate(a.date) - parsePtDate(b.date));
      return nextRows;
    }

    if (sortBy === 'consultor_az') {
      nextRows.sort((a, b) => (a.consultant || '').localeCompare(b.consultant || ''));
      return nextRows;
    }

    nextRows.sort((a, b) => parsePtDate(b.date) - parsePtDate(a.date));
    return nextRows;
  }, [filteredRequests, sortBy]);

  const filteredBadges = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return badgeItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || item.area.toLowerCase().includes(normalizedSearch)
        || item.level.toLowerCase().includes(normalizedSearch);
      const matchesLevel = activeFilter === 'todos' || item.levelId === activeFilter
        || (activeFilter === 'especial' && item.isSpecial);

      return matchesSearch && matchesLevel;
    });
  }, [badgeItems, searchTerm, activeFilter]);

  const sortedBadges = useMemo(() => {
    const nextRows = [...filteredBadges];

    if (sortBy === 'points_desc') {
      nextRows.sort((a, b) => b.points - a.points || a.area.localeCompare(b.area));
      return nextRows;
    }

    if (sortBy === 'points_asc') {
      nextRows.sort((a, b) => a.points - b.points || a.area.localeCompare(b.area));
      return nextRows;
    }

    if (sortBy === 'area_asc') {
      nextRows.sort((a, b) => (a.area || '').localeCompare(b.area || '') || a.points - b.points);
      return nextRows;
    }

    nextRows.sort((a, b) => a.area.localeCompare(b.area) || a.level.localeCompare(b.level));
    return nextRows;
  }, [filteredBadges, sortBy]);

  const filteredConsultants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return consultantItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.email.toLowerCase().includes(normalizedSearch);
      const matchesStatus = activeFilter === 'todos' || item.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [consultantItems, searchTerm, activeFilter]);

  const sortedConsultants = useMemo(() => {
    const nextRows = [...filteredConsultants];

    if (sortBy === 'points_asc') {
      nextRows.sort((a, b) => a.points - b.points || (a.name || '').localeCompare(b.name || ''));
      return nextRows;
    }

    if (sortBy === 'badges_desc') {
      nextRows.sort((a, b) => (b.badges || 0) - (a.badges || 0) || b.points - a.points || (a.name || '').localeCompare(b.name || ''));
      return nextRows;
    }

    if (sortBy === 'badges_asc') {
      nextRows.sort((a, b) => (a.badges || 0) - (b.badges || 0) || a.points - b.points || (a.name || '').localeCompare(b.name || ''));
      return nextRows;
    }

    if (sortBy === 'nome_az') {
      nextRows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return nextRows;
    }

    if (sortBy === 'entrada_recente') {
      nextRows.sort((a, b) => parsePtDate(b.joinedAt) - parsePtDate(a.joinedAt));
      return nextRows;
    }

    nextRows.sort((a, b) => b.points - a.points || (a.name || '').localeCompare(b.name || ''));
    return nextRows;
  }, [filteredConsultants, sortBy]);

  const pageSize = 10;

  const totalItems =
    activeTab === 'pedidos'
      ? sortedRequests.length
      : activeTab === 'badges'
        ? sortedBadges.length
        : sortedConsultants.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const consultantRankMap = useMemo(() => {
    const sorted = [...filteredConsultants].sort((a, b) => b.points - a.points || b.badges - a.badges || (a.name || '').localeCompare(b.name || ''));
    const map = {};
    let lastRank = 0;
    let lastPoints = null;
    let lastBadges = null;
    sorted.forEach((c, i) => {
      if (c.points !== lastPoints || c.badges !== lastBadges) {
        lastRank = i + 1;
        lastPoints = c.points;
        lastBadges = c.badges;
      }
      map[c.id] = lastRank;
    });
    return map;
  }, [filteredConsultants]);

  const pagedRequests = useMemo(() => sortedRequests.slice(start, end), [sortedRequests, start, end]);
  const pagedBadges = useMemo(() => sortedBadges.slice(start, end), [sortedBadges, start, end]);

  const pagedConsultants = useMemo(() => {
    return sortedConsultants.slice(start, end).map((c) => ({
      ...c,
      rank: consultantRankMap[c.id] || 1,
    }));
  }, [sortedConsultants, start, end, consultantRankMap]);

  const selectedRequestCount = filteredRequests.filter((item) => selectedRequestIds.includes(item.id)).length;
  const selectedBadgeCount = filteredBadges.filter((item) => selectedBadgeIds.includes(item.id)).length;
  const selectedConsultantCount = filteredConsultants.filter((item) => selectedConsultantIds.includes(item.id)).length;

  const allFilteredRequestsSelected =
    filteredRequests.length > 0 && filteredRequests.every((item) => selectedRequestIds.includes(item.id));
  const allFilteredBadgesSelected =
    filteredBadges.length > 0 && filteredBadges.every((item) => selectedBadgeIds.includes(item.id));
  const allFilteredConsultantsSelected =
    filteredConsultants.length > 0 && filteredConsultants.every((item) => selectedConsultantIds.includes(item.id));

  const selectedCount =
    activeTab === 'pedidos'
      ? selectedRequestCount
      : activeTab === 'badges'
        ? selectedBadgeCount
        : selectedConsultantCount;

  const allSelectedCurrentTab =
    activeTab === 'pedidos'
      ? allFilteredRequestsSelected
      : activeTab === 'badges'
        ? allFilteredBadgesSelected
        : allFilteredConsultantsSelected;

  const hasActiveFilter = activeFilter !== tabDefaults[activeTab].filter;
  const hasActiveSort = sortBy !== tabDefaults[activeTab].sort;

  const searchPlaceholder = activeTab === 'consultores' ? t('export_search_consultants') : t('export_search_badges');

  const userName = getLoginName() || 'João Gomes';

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
    setActiveFilter(tabDefaults[tabId].filter);
    setSortBy(tabDefaults[tabId].sort);
    setPage(1);
    setShowFilterDropdown(false);
    setShowSortDropdown(false);

    if (tabId === 'pedidos') {
      setActiveRequestStatuses(requestStatusFilters.map((item) => item.id));
    }
  };

  const toggleRequestStatusFilter = (statusId) => {
    setActiveRequestStatuses((current) => {
      if (current.includes(statusId)) {
        return current.filter((item) => item !== statusId);
      }

      return [...current, statusId];
    });

    setPage(1);
  };

  const toggleRequestSelection = (id) => {
    setSelectedRequestIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]);
  };

  const toggleBadgeSelection = (id) => {
    setSelectedBadgeIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]);
  };

  const toggleConsultantSelection = (id) => {
    setSelectedConsultantIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]);
  };

  const toggleSelectAll = () => {
    if (activeTab === 'pedidos') {
      setSelectedRequestIds((current) => {
        if (allFilteredRequestsSelected) {
          return current.filter((id) => !filteredRequests.some((item) => item.id === id));
        }

        const next = new Set(current);
        filteredRequests.forEach((item) => next.add(item.id));
        return Array.from(next);
      });
      return;
    }

    if (activeTab === 'badges') {
      setSelectedBadgeIds((current) => {
        if (allFilteredBadgesSelected) {
          return current.filter((id) => !filteredBadges.some((item) => item.id === id));
        }

        const next = new Set(current);
        filteredBadges.forEach((item) => next.add(item.id));
        return Array.from(next);
      });
      return;
    }

    setSelectedConsultantIds((current) => {
      if (allFilteredConsultantsSelected) {
        return current.filter((id) => !filteredConsultants.some((item) => item.id === id));
      }

      const next = new Set(current);
      filteredConsultants.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  // Export handlers
  const exportBadgesToPDF = async () => {
    const selected = badgeItems.filter((item) => selectedBadgeIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const htmlContent = await generateBadgePagesPDF(selected, userName, t);
      const date = new Date().toISOString().split('T')[0];
      downloadHtmlAsPdf(htmlContent, `badges-${date}.pdf`);
    } catch (error) {
      console.error('Error generating badge pages:', error);
      alert(t('export_error_pages'));
    }
  };

  const exportBadgesToExcel = () => {
    const selected = badgeItems.filter((item) => selectedBadgeIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const csvContent = generateBadgesCSV(selected, t);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `badges-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert(t('export_error_csv'));
    }
  };

  const exportRequestsToPDF = () => {
    const selected = requestItems.filter((item) => selectedRequestIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const htmlContent = generateRequestsPDF(selected, t);
      const date = new Date().toISOString().split('T')[0];
      downloadHtmlAsPdf(htmlContent, `pedidos-${date}.pdf`, { orientation: 'portrait' });
    } catch (error) {
      console.error('Error generating requests PDF:', error);
      alert(t('export_error_pages'));
    }
  };

  const exportRequestsToExcel = () => {
    const selected = requestItems.filter((item) => selectedRequestIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const csvContent = generateRequestsCSV(selected, t);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating requests CSV:', error);
      alert(t('export_error_csv'));
    }
  };

  const exportConsultantsToPDF = () => {
    const selected = consultantItems.filter((item) => selectedConsultantIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const htmlContent = generateConsultantsPDF(selected, t);
      const date = new Date().toISOString().split('T')[0];
      downloadHtmlAsPdf(htmlContent, `consultores-${date}.pdf`, { orientation: 'portrait' });
    } catch (error) {
      console.error('Error generating consultants PDF:', error);
      alert(t('export_error_pages'));
    }
  };

  const exportConsultantsToExcel = () => {
    const selected = consultantItems.filter((item) => selectedConsultantIds.includes(item.id));
    if (selected.length === 0) {
      alert(t('export_select_badge_alert'));
      return;
    }
    try {
      const csvContent = generateConsultantsCSV(selected, t);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consultores-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating consultants CSV:', error);
      alert(t('export_error_csv'));
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      const data = await fetchBadgeAssignmentReport({
        areaId: reportAreaId,
        nivelId: reportNivelId,
        dateFrom: reportDateFrom,
        dateTo: reportDateTo,
      });
      setReportData(Array.isArray(data) ? data : []);
      setExpandedReportAreas([]);
      setReportGenerated(true);
    } catch (err) {
      console.error('Error generating report:', err);
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  };

  const reportSummary = useMemo(() => {
    const map = {};
    reportData.forEach((row) => {
      const key = row.areaNome || '-';
      if (!map[key]) {
        map[key] = { area: key, totalBadges: 0, totalPoints: 0 };
      }
      map[key].totalBadges += 1;
      map[key].totalPoints += Number(row.pontosObtidos || row.badgePontos || 0);
    });
    return Object.values(map).sort((a, b) => a.area.localeCompare(b.area));
  }, [reportData]);

  const toggleReportArea = (area) => {
    setExpandedReportAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const chartByArea = useMemo(() => {
    const map = {};
    badgeItems.filter((b) => !b.isSpecial).forEach((b) => {
      if (b.area) map[b.area] = 0;
    });
    reportData.forEach((r) => {
      if (!r.areaNome) return;
      map[r.areaNome] = (map[r.areaNome] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportData, badgeItems]);

  const chartByLevel = useMemo(() => {
    const map = {};
    ALL_LEVEL_NAMES.forEach((name) => { map[name] = 0; });
    reportData.forEach((r) => {
      const key = r.nivelNome || '-';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportData]);

  const buildPieGradient = (data, total) => {
    if (total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
    let acc = 0;
    const segments = data.map((d, i) => {
      const start = acc;
      acc += (d.value / total) * 100;
      return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${acc}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  };

  const buildChartSectionHtml = (data, title) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const step = Math.max(1, Math.ceil(maxVal / 4));
    const chartMax = step * 4;
    const ticks = [0, 1, 2, 3, 4].map((m) => step * m);

    const barColumns = data.map((d, i) => {
      const pct = chartMax > 0 ? (d.value / chartMax) * 100 : 0;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0"><span style="font-size:9px;font-weight:700;color:#2f3747">${d.value}</span><div style="width:100%;height:100px;display:flex;align-items:flex-end;justify-content:center"><div style="width:60%;max-width:32px;height:${pct}%;background:${color};border-radius:3px 3px 0 0"></div></div><span style="font-size:8px;color:#64748b;text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%">${d.name}</span></div>`;
    }).join('');

    const legendItems = data.map((d, i) => {
      const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      return `<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#475569"><span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;max-width:120px">${d.name}</span><span style="font-weight:700;color:#2f3747;flex-shrink:0">${pct}%</span></div>`;
    }).join('');

    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const svgSegments = total === 0 ? '' : data.map((d, i) => {
      const pct = d.value / total;
      const segLen = pct * circumference;
      const rest = circumference - segLen;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      const seg = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="24" stroke-dasharray="${segLen} ${rest}" stroke-dashoffset="${-offset}" />`;
      offset += segLen;
      return seg;
    }).join('');
    const pieSvg = total === 0
      ? '<div style="width:120px;height:120px;border-radius:50%;background:#e2e8f0;flex-shrink:0"></div>'
      : `<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0"><g transform="rotate(-90 60 60)">${svgSegments}</g></svg>`;

    return `
      <div style="display:flex;gap:12px;margin-bottom:16px;page-break-inside:avoid">
        <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px;min-width:0">
          <h4 style="font-size:12px;font-weight:700;color:#2f3747;margin:0 0 8px">${title} — ${t('report_chart_bar')}</h4>
          <div style="display:flex;align-items:flex-end;gap:3px;height:140px;padding-left:24px;position:relative">
            <div style="position:absolute;left:0;top:0;bottom:0;width:22px;display:flex;flex-direction:column-reverse;justify-content:space-between;pointer-events:none">
              ${ticks.map((tick) => `<span style="font-size:8px;color:#8892a4;line-height:1;text-align:right">${tick}</span>`).join('')}
            </div>
            ${barColumns}
          </div>
        </div>
        <div style="flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px;min-width:0">
          <h4 style="font-size:12px;font-weight:700;color:#2f3747;margin:0 0 8px">${title} — ${t('report_chart_pie')}</h4>
          <div style="display:flex;align-items:center;gap:12px;justify-content:center">
            ${pieSvg}
            <div style="display:flex;flex-direction:column;gap:4px;min-width:0">${legendItems}</div>
          </div>
        </div>
      </div>`;
  };

  const exportReportToPDF = async () => {
    if (reportData.length === 0) return;

    const areaChartsHtml = reportAreaId === '' && reportNivelId !== 'especial'
      ? buildChartSectionHtml(chartByArea, t('report_chart_by_area'))
      : '';
    const levelChartsHtml = reportNivelId === ''
      ? buildChartSectionHtml(chartByLevel, t('report_chart_by_level'))
      : '';

    const summaryRowsHtml = reportSummary.map((row) => {
      return `<tr><td style="padding:10px 14px;border-bottom:1px solid #e9ecef;font-size:13px;color:#495057;font-weight:600">${row.area}</td><td style="padding:10px 14px;border-bottom:1px solid #e9ecef;font-size:13px;color:#495057;text-align:center">${row.totalBadges}</td><td style="padding:10px 14px;border-bottom:1px solid #e9ecef;font-size:13px;color:#495057;text-align:right">${new Intl.NumberFormat('pt-PT').format(row.totalPoints)}</td></tr>`;
    }).join('');

    const detailRowsHtml = reportData.map((r) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057">${r.areaNome || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057">${r.consultorNome || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057">${r.consultorEmail || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057">${r.badgeNome || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057">${r.nivelNome || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057;white-space:nowrap">${r.dataObtencao || '-'}</td><td style="padding:8px 10px;border-bottom:1px solid #e9ecef;font-size:12px;color:#495057;text-align:right">${r.pontosObtidos || r.badgePontos || 0}</td></tr>`).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t('export_tab_report')}</title>
      </head>
      <body style="margin:0;padding:16px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:24px;color:#343a40;margin:0 0 6px 0;">${t('export_tab_report')}</h1>
          <p style="color:#868e96;font-size:13px;margin:0;">${t('export_date_label')}: ${new Date().toLocaleDateString('pt-PT')}</p>
        </div>
        ${areaChartsHtml}
        ${levelChartsHtml}
        <div style="page-break-before:always"></div>
        <h2 style="font-size:15px;color:#2f3747;margin:20px 0 10px;font-weight:700">${t('report_summary_title')}</h2>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);margin-bottom:20px"><thead><tr style="background:#0066ff;color:white;"><th style="padding:12px 14px;text-align:left;font-weight:600;font-size:13px;">${t('report_col_area')}</th><th style="padding:12px 14px;text-align:center;font-weight:600;font-size:13px;">${t('report_total_badges')}</th><th style="padding:12px 14px;text-align:right;font-weight:600;font-size:13px;">${t('report_total_points')}</th></tr></thead><tbody>${summaryRowsHtml}</tbody></table>
        <div style="page-break-before:always"></div>
        <h2 style="font-size:15px;color:#2f3747;margin:20px 0 10px;font-weight:700">${t('report_detail_title')}</h2>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)"><thead><tr style="background:#0066ff;color:white;"><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">${t('report_col_area')}</th><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">${t('report_col_consultant')}</th><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">Email</th><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">${t('report_col_badge')}</th><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">${t('report_col_level')}</th><th style="padding:10px 10px;text-align:left;font-weight:600;font-size:12px;">${t('report_col_date')}</th><th style="padding:10px 10px;text-align:right;font-weight:600;font-size:12px;">${t('report_col_points')}</th></tr></thead><tbody>${detailRowsHtml}</tbody></table>
      </body>
      </html>
    `;

    const filename = `relatorio-badges-${new Date().toISOString().split('T')[0]}.pdf`;
    await downloadHtmlAsPdf(html, filename, { orientation: 'portrait' });
  };

  const exportReportToExcel = () => {
    if (reportData.length === 0) return;
    const BOM = '\uFEFF';
    const headers = [t('report_col_area'), t('report_col_consultant'), 'Email', t('report_col_badge'), t('report_col_level'), t('report_col_date'), t('report_col_points')];
    const rows = reportData.map((r) => [r.areaNome || '-', r.consultorNome || '-', r.consultorEmail || '-', r.badgeNome || '-', r.nivelNome || '-', r.dataObtencao || '-', r.pontosObtidos || r.badgePontos || 0]);
    const csv = BOM + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-badges-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('export_loading')} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="page">
          <header className="page-header">
            <h1>{t('export_title_ag')}</h1>
          </header>
          <div className="tm-export-error">
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>{t('export_title_ag')}</h1>
        </header>

        <div className="tm-export-tabs" role="tablist" aria-label="Separadores de exportação">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tm-export-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="shell tm-export-shell">

          {activeTab !== 'relatorio' && (
          <div className="toolbar tm-export-toolbar">
            <label className="search-wrap tm-export-search" htmlFor="tm-export-search-input">
              <Search size={20} />
              <input
                id="tm-export-search-input"
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <div className="tm-export-control-group" ref={filterDropdownRef}>
              <button
                type="button"
                className={`tm-export-control-btn ${showFilterDropdown || hasActiveFilter ? 'active' : ''}`}
                onClick={() => {
                  setShowFilterDropdown((current) => !current);
                  setShowSortDropdown(false);
                }}
              >
                <Filter size={18} />
                <span className="tm-export-control-btn-label">{t('export_filter_search')}</span>
              </button>

              {showFilterDropdown && (
                <div className="dropdown-menu tm-export-dropdown-menu" role="menu" aria-label="Filtrar pesquisa">
                  {filterOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`dropdown-item tm-export-dropdown-item ${activeFilter === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFilter(item.id);
                        setShowFilterDropdown(false);
                        setPage(1);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tm-export-control-group" ref={sortDropdownRef}>
              <button
                type="button"
                className={`tm-export-control-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                onClick={() => {
                  setShowSortDropdown((current) => !current);
                  setShowFilterDropdown(false);
                }}
              >
                <SlidersHorizontal size={18} />
                <span className="tm-export-control-btn-label">{t('export_sort_btn')}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu tm-export-dropdown-menu" role="menu" aria-label="Ordenar">
                  {sortOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`dropdown-item tm-export-dropdown-item ${sortBy === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(item.id);
                        setShowSortDropdown(false);
                        setPage(1);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {activeTab === 'pedidos' && (
            <>
              <div className="tm-export-section-head">
                <h2>{t('export_tab_requests')}</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? t('deselect_all') : t('select_all')}
                  </button>
                  <span className="tm-export-selected-count">{t('exports_selected_count', { count: selectedCount })}</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar pedidos em PDF" onClick={exportRequestsToPDF}>
                    <FileDown size={16} />
                    <span>{t('export_pdf')}</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar pedidos em Excel" onClick={exportRequestsToExcel}>
                    <ArrowDownToLine size={16} />
                    <span>{t('export_excel')}</span>
                  </button>
                </div>
              </div>

              <div className="tm-export-status-row">
                <span>{t('pedidos_filter_by')}</span>
                {requestStatusFilters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`tm-export-status-chip ${activeRequestStatuses.includes(item.id) ? 'active' : ''} ${item.id}`}
                    onClick={() => toggleRequestStatusFilter(item.id)}
                    aria-pressed={activeRequestStatuses.includes(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="table-wrap tm-export-table-wrap">
                <table className="table tm-export-table">
                  <thead>
                    <tr>
                      <th />
                      <th>{t('export_th_consultant')}</th>
                      <th>{t('export_th_badge')}</th>
                      <th>{t('export_th_level')}</th>
                      <th>{t('export_th_request_date')}</th>
                      <th>{t('export_th_request_status')}</th>
                      <th>{t('export_th_request_details')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-state tm-export-empty-row">{t('export_no_results')}</td>
                      </tr>
                    )}

                    {pagedRequests.map((item) => {
                      const status = requestStatusMeta[item.status] || requestStatusMeta.pendente;

                      return (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="tm-export-checkbox"
                              checked={selectedRequestIds.includes(item.id)}
                              onChange={() => toggleRequestSelection(item.id)}
                              aria-label={`Selecionar pedido de ${item.consultant}`}
                            />
                          </td>
                          <td>{item.consultant}</td>
                          <td>{item.badge}</td>
                          <td>{item.level}</td>
                          <td>{item.date}</td>
                          <td>
                            <span className={`tm-export-request-pill ${status.className}`}>{status.label}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="tm-export-view-btn"
                              onClick={() => navigate(`/admin-gestor/pedidos/${item.detailId}`)}
                            >
                              {t('pedidos_btn_view')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'badges' && (
            <>
              <div className="tm-export-section-head">
                <h2>{t('export_tab_badges')}</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? t('deselect_all') : t('select_all')}
                  </button>
                  <span className="tm-export-selected-count">{t('exports_selected_count', { count: selectedCount })}</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar badges em PDF" onClick={exportBadgesToPDF} disabled={selectedBadgeIds.length === 0}>
                    <FileDown size={16} />
                    <span>{t('export_pdf')}</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar badges em Excel" onClick={exportBadgesToExcel} disabled={selectedBadgeIds.length === 0}>
                    <ArrowDownToLine size={16} />
                    <span>{t('export_excel')}</span>
                  </button>
                </div>
              </div>

              <div className="catalog-grid">
                {pagedBadges.map((item) => {
                  const isSelected = selectedBadgeIds.includes(item.id);
                  const badgeTitle = item.name || item.area || 'Badge';
                  const levelLabel = item.isSpecial ? 'Especial' : item.levelLabel || item.level;
                  const expirationInfo = getExpirationStatus(item.validade, t);

                  return (
                    <article
                      key={item.id}
                      className={`catalog-card ${isSelected ? 'selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleBadgeSelection(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleBadgeSelection(item.id);
                        }
                      }}
                    >
                      {expirationInfo && expirationInfo.status === 'expiring' && (
                        <div style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(251, 191, 36, 0.9)', color: '#92400e',
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                          fontWeight: '600', display: 'flex', alignItems: 'center',
                          gap: '4px', zIndex: 1,
                        }}>
                          <Clock3 size={12} />
                          {expirationInfo.label}
                        </div>
                      )}

                      <div className="catalog-badge-frame">
                        <BadgeImage src={item.badgeImage} alt={levelLabel} className="catalog-badge-image" levelKey={item.levelKey || item.levelId} typeId={item.typeId} levelLabel={levelLabel} />
                      </div>
                      <div className="catalog-card-title">{badgeTitle}</div>
                      <div className="catalog-card-level">{levelLabel}</div>
                      <div className="catalog-card-meta">
                        <div className="catalog-meta-row">
                          <Trophy size={14} />
                          <span>{item.points} {t('export_points_suffix')}</span>
                        </div>
                        <div className="catalog-meta-row" style={{
                          color: expirationInfo?.status === 'expiring' ? '#b45309'
                               : expirationInfo?.status === 'expired' ? '#dc2626'
                               : '#6b7280',
                        }}>
                          <Clock3 size={14} />
                          <span>
                            {item.validade
                              ? (expirationInfo?.status === 'expired'
                                ? t('export_expired')
                                : `${t('export_expires')} ${new Date(item.validade).toLocaleDateString('pt-PT')}`
                              )
                              : item.date
                            }
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}


          {activeTab === 'consultores' && (
            <>
              <div className="tm-export-section-head">
                <h2>{t('export_tab_consultants')}</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? t('deselect_all') : t('select_all')}
                  </button>
                  <span className="tm-export-selected-count">{t('exports_selected_count', { count: selectedCount })}</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar consultores em PDF" onClick={exportConsultantsToPDF}>
                    <FileDown size={16} />
                    <span>{t('export_pdf')}</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar consultores em Excel" onClick={exportConsultantsToExcel}>
                    <ArrowDownToLine size={16} />
                    <span>{t('export_excel')}</span>
                  </button>
                </div>
              </div>

              <div className="table-wrap tm-export-table-wrap">
                <table className="table tm-export-table consultores">
                  <thead>
                    <tr>
                      <th />
                      <th>{t('export_th_ranking')}</th>
                      <th>{t('export_th_name')}</th>
                      <th>{t('export_th_email')}</th>
                      <th>{t('export_th_points')}</th>
                      <th>{t('export_th_joined_date')}</th>
                      <th>{t('export_th_badges')}</th>
                      <th>{t('export_th_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedConsultants.length === 0 && (
                      <tr>
                        <td colSpan={8} className="empty-state tm-export-empty-row">{t('export_no_results')}</td>
                      </tr>
                    )}

                    {pagedConsultants.map((item) => {
                      const isTopThree = item.rank <= 3;

                      return (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="tm-export-checkbox"
                              checked={selectedConsultantIds.includes(item.id)}
                              onChange={() => toggleConsultantSelection(item.id)}
                              aria-label={`Selecionar ${item.name}`}
                            />
                          </td>
                          <td>
                            <span className={`tm-export-rank ${isTopThree ? `top-${item.rank}` : 'default'}`}>
                              {isTopThree ? <Medal size={14} /> : `#${item.rank}`}
                            </span>
                          </td>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                          <td>
                            <span className="tm-export-points">
                              {new Intl.NumberFormat('pt-PT').format(item.points)}
                            </span>
                          </td>
                          <td>{item.joinedAt}</td>
                          <td>
                            <span className="tm-export-badge-count">{item.badges}</span>
                          </td>
                          <td>
                            <span className={`tm-export-consultor-status ${item.status}`}>
                              {toConsultantStatusLabel(item.status, t)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'relatorio' && (
            <>
              <div className="tm-export-section-head">
                <h2>{t('export_tab_report')}</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-btn secondary" onClick={exportReportToPDF} disabled={reportData.length === 0}>
                    <FileDown size={16} /> {t('export_pdf')}
                  </button>
                  <button type="button" className="tm-export-btn primary" onClick={exportReportToExcel} disabled={reportData.length === 0}>
                    <ArrowDownToLine size={16} /> {t('export_excel')}
                  </button>
                </div>
              </div>

              <div className="tm-export-report-filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('report_filter_area')}</label>
                  <select value={reportAreaId} onChange={(e) => { setReportAreaId(e.target.value); setReportGenerated(false); }} disabled={reportNivelId === 'especial'} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dbe6f2', fontSize: 13, opacity: reportNivelId === 'especial' ? 0.5 : 1 }}>
                    <option value="">{t('export_filter_all')}</option>
                    {[...new Set(badgeItems.filter((b) => !b.isSpecial).map((b) => b.area).filter(Boolean))].sort().map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('report_filter_level')}</label>
                  <select value={reportNivelId} onChange={(e) => { setReportNivelId(e.target.value); if (e.target.value === 'especial') setReportAreaId(''); setReportGenerated(false); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dbe6f2', fontSize: 13 }}>
                    <option value="">{t('export_filter_all')}</option>
                    {badgeLevels.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('report_filter_date_from')}</label>
                  <input type="date" value={reportDateFrom} onChange={(e) => { setReportDateFrom(e.target.value); setReportGenerated(false); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dbe6f2', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('report_filter_date_to')}</label>
                  <input type="date" value={reportDateTo} onChange={(e) => { setReportDateTo(e.target.value); setReportGenerated(false); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dbe6f2', fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" className="tm-export-btn primary" onClick={generateReport} disabled={reportLoading}>
                    {reportLoading ? '...' : t('report_generate')}
                  </button>
                </div>
              </div>

              {reportLoading && <LoadingSpinner />}

              {!reportLoading && reportGenerated && reportData.length > 0 && (
                <>
                  {(() => {
                    const totalArea = chartByArea.reduce((s, d) => s + d.value, 0);
                    const areaScale = buildBarChartScale(chartByArea);
                    const totalLevel = chartByLevel.reduce((s, d) => s + d.value, 0);
                    const levelScale = buildBarChartScale(chartByLevel);
                    return (
                      <div className="report-chart-grid">
                        {reportAreaId === '' && reportNivelId !== 'especial' && (
                          <>
                            <div className="report-chart-card">
                              <h4>{t('report_chart_by_area')}</h4>
                              <div className="report-bar-chart">
                                <div className="report-bar-chart-y-axis">
                                  {areaScale.ticks.map((tick) => (
                                    <span key={tick} className="report-bar-chart-y-tick">{tick}</span>
                                  ))}
                                </div>
                                {chartByArea.map((d, i) => (
                                  <div key={d.name} className="report-bar-column">
                                    <span className="report-bar-value">{d.value}</span>
                                    <div className="report-bar-track">
                                      <div className="report-bar" style={{ height: `${(d.value / areaScale.max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    </div>
                                    <span className="report-bar-label" title={d.name}>{d.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="report-chart-card">
                              <h4>{t('report_chart_by_area')}</h4>
                              <div className="report-pie-wrap">
                                <div className="report-pie" style={{ background: buildPieGradient(chartByArea, totalArea) }} />
                                <div className="report-pie-legend">
                                  {chartByArea.map((d, i) => (
                                    <div key={d.name} className="report-pie-legend-item">
                                      <span className="report-pie-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                      <span className="report-pie-legend-name">{d.name}</span>
                                      <span className="report-pie-legend-pct">{totalArea > 0 ? Math.round((d.value / totalArea) * 100) : 0}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {reportNivelId === '' && (
                          <>
                            <div className="report-chart-card">
                              <h4>{t('report_chart_by_level')}</h4>
                              <div className="report-bar-chart">
                                <div className="report-bar-chart-y-axis">
                                  {levelScale.ticks.map((tick) => (
                                    <span key={tick} className="report-bar-chart-y-tick">{tick}</span>
                                  ))}
                                </div>
                                {chartByLevel.map((d, i) => (
                                  <div key={d.name} className="report-bar-column">
                                    <span className="report-bar-value">{d.value}</span>
                                    <div className="report-bar-track">
                                      <div className="report-bar" style={{ height: `${(d.value / levelScale.max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    </div>
                                    <span className="report-bar-label" title={d.name}>{d.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="report-chart-card">
                              <h4>{t('report_chart_by_level')}</h4>
                              <div className="report-pie-wrap">
                                <div className="report-pie" style={{ background: buildPieGradient(chartByLevel, totalLevel) }} />
                                <div className="report-pie-legend">
                                  {chartByLevel.map((d, i) => (
                                    <div key={d.name} className="report-pie-legend-item">
                                      <span className="report-pie-legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                      <span className="report-pie-legend-name">{d.name}</span>
                                      <span className="report-pie-legend-pct">{totalLevel > 0 ? Math.round((d.value / totalLevel) * 100) : 0}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t('report_summary_title')}</h3>
                  <div className="tm-export-table-wrap" style={{ marginBottom: 20 }}>
                    <table className="table orders-table">
                      <thead>
                        <tr>
                          <th>{t('report_col_area')}</th>
                          <th>{t('report_total_badges')}</th>
                          <th>{t('report_total_points')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportSummary.map((row) => (
                          <React.Fragment key={row.area}>
                            <tr>
                              <td><strong>{row.area}</strong></td>
                              <td>{row.totalBadges}</td>
                              <td>{new Intl.NumberFormat('pt-PT').format(row.totalPoints)}</td>
                              <td>
                                <button type="button" className="tm-export-btn secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleReportArea(row.area)}>
                                  {expandedReportAreas.includes(row.area) ? '▾' : '▸'} {t('report_detail_title')}
                                </button>
                              </td>
                            </tr>
                            {expandedReportAreas.includes(row.area) && reportData.filter((r) => (r.areaNome || '-') === row.area).map((r, idx) => (
                              <tr key={idx} style={{ background: '#f9fafb' }}>
                                <td style={{ paddingLeft: 24 }}>{r.consultorNome}</td>
                                <td>{r.badgeNome}</td>
                                <td>{r.nivelNome}</td>
                                <td>{r.dataObtencao}</td>
                                <td>{r.pontosObtidos || r.badgePontos || 0}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t('report_detail_title')}</h3>
                  <div className="tm-export-table-wrap">
                    <table className="table orders-table">
                      <thead>
                        <tr>
                          <th>{t('report_col_area')}</th>
                          <th>{t('report_col_consultant')}</th>
                          <th>Email</th>
                          <th>{t('report_col_badge')}</th>
                          <th>{t('report_col_level')}</th>
                          <th>{t('report_col_date')}</th>
                          <th>{t('report_col_points')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.areaNome || '-'}</td>
                            <td>{r.consultorNome}</td>
                            <td>{r.consultorEmail}</td>
                            <td>{r.badgeNome}</td>
                            <td>{r.nivelNome || '-'}</td>
                            <td>{r.dataObtencao}</td>
                            <td>{r.pontosObtidos || r.badgePontos || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!reportLoading && reportData.length === 0 && reportAreaId === '' && reportDateFrom === '' && reportDateTo === '' && (
                <p style={{ color: '#8892a4', textAlign: 'center', padding: 40 }}>{t('report_no_data')}</p>
              )}
            </>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default ExportacoesAG;

