import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
import BadgeImage from '../../components/BadgeImage';
import { fetchManagedRequests } from '../../services/requestManagementService';
import { fetchMyServiceLine, fetchHistoricoBadgesSLL, fetchHistoricoConsultoresSLL } from '../../services/serviceLineLeaderService';
import '../../css/ServiceLineLeader/Exportacoes_SLL.css';

const tabs = [
  { id: 'pedidos', label: 'Pedidos de Badges' },
  { id: 'badges', label: 'Badges' },
  { id: 'consultores', label: 'Consultores' },
];

const requestStatusFilters = [
  { id: 'enviado', label: 'Enviados' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'rejeitado', label: 'Rejeitado' },
];

const levelFilterOptions = [
  { id: 'todos', label: 'Todos os níveis' },
  { id: 'junior', label: 'Júnior' },
  { id: 'intermedio', label: 'Intermédio' },
  { id: 'senior', label: 'Sénior' },
  { id: 'especialista', label: 'Especialista' },
  { id: 'lider', label: 'Líder de Conhecimento' },
];

const consultantFilterOptions = [
  { id: 'todos', label: 'Todos os estados' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'inativo', label: 'Inativo' },
];

const requestSortOptions = [
  { id: 'recentes', label: 'Mais recentes' },
  { id: 'antigas', label: 'Mais antigas' },
  { id: 'consultor_az', label: 'Consultor (A-Z)' },
];

const badgeSortOptions = [
  { id: 'padrao', label: 'Ordem padrão' },
  { id: 'points_desc', label: 'Pontos (Maior para Menor)' },
  { id: 'points_asc', label: 'Pontos (Menor para Maior)' },
  { id: 'area_asc', label: 'Área (A-Z)' },
];

const consultantSortOptions = [
  { id: 'points_desc', label: 'Pontos (Maior para Menor)' },
  { id: 'points_asc', label: 'Pontos (Menor para Maior)' },
  { id: 'nome_az', label: 'Nome (A-Z)' },
  { id: 'entrada_recente', label: 'Data de entrada (Recente)' },
];

const tabDefaults = {
  pedidos: { filter: 'todos', sort: 'recentes' },
  badges: { filter: 'todos', sort: 'padrao' },
  consultores: { filter: 'todos', sort: 'points_desc' },
};

const knownServiceLines = [];

const serviceLineByEmail = {};

const badgeLevels = [];

const requestStatusMeta = {
  enviado: { label: 'Enviados', className: 'sent' },
  pendente: { label: 'Pendente', className: 'pending' },
  rejeitado: { label: 'Rejeitado', className: 'rejected' },
};

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

const toConsultantStatusLabel = (status) => {
  const normalized = normalizeConsultantStatus(status);
  if (normalized === 'ativo') {
    return 'Ativo';
  }

  if (normalized === 'pendente') {
    return 'Pendente';
  }

  return 'Inativo';
};

const buildBadgeDisplayMeta = (level) => {
  const levelId = normalizeLevelId(level);
  const template = badgeLevels.find((item) => item.id === levelId) || badgeLevels[0];

  return {
    levelId,
    points: Number(template?.points) || 0,
    badgeImage: template?.badgeImage || '/badges/default.png',
  };
};

const getStoredLoginData = () => {
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');

  if (!storedLoginData) {
    return null;
  }

  try {
    return JSON.parse(storedLoginData);
  } catch {
    return null;
  }
};

const normalizeServiceLine = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const resolveUserServiceLine = (loginData) => {
  const candidates = [
    loginData?.serviceLine,
    loginData?.service_line,
    loginData?.serviceLineName,
    loginData?.service_line_name,
    loginData?.area,
    loginData?.departamento,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeServiceLine(candidate);
    const matched = knownServiceLines.find((line) => normalizeServiceLine(line) === normalizedCandidate);

    if (matched) {
      return matched;
    }
  }

  const email = String(loginData?.email || '').trim().toLowerCase();

  if (serviceLineByEmail[email]) {
    return serviceLineByEmail[email];
  }

  return 'LowCode';
};

const getLoginName = (loginData) => loginData?.nome || '';

const translateLevel = (levelKey) => {
  const translations = {
    'badge_level_junior': 'Júnior',
    'badge_level_intermediate': 'Intermédio',
    'badge_level_senior': 'Sénior',
    'badge_level_specialist': 'Especialista',
    'badge_level_knowledge_lead': 'Líder de Conhecimento',
    'junior': 'Júnior',
    'intermedio': 'Intermédio',
    'senior': 'Sénior',
    'especialista': 'Especialista',
    'lider': 'Líder de Conhecimento'
  };
  return translations[levelKey] || levelKey;
};

const generateBadgesCSV = (badges) => {
  const BOM = '\uFEFF';
  const headers = ['Nome da Badge', 'Tipo', 'Área', 'Pontos', 'Data', 'ID'];
  const rows = badges.map(badge => {
    const levelName = translateLevel(badge.levelId || badge.level);
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

const generateBadgePagesPDF = (badges, userName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Badges Export</title>
      <style>
        @media print { @page { size: A4 portrait; margin: 0; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 40px; }
        .page-break { page-break-after: always; }
        .badge-card { background: white; border-radius: 24px; padding: 60px 80px; max-width: 600px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0, 102, 255, 0.15); border: 4px solid #0066ff; position: relative; margin-bottom: 40px; }
        .brand { font-size: 18px; font-weight: 700; color: #0066ff; letter-spacing: 2px; margin-bottom: 20px; text-transform: uppercase; }
        .title { font-size: 28px; font-weight: 700; color: #495057; margin-bottom: 30px; }
        .badge-container { margin: 30px 0 40px 0; display: flex; justify-content: center; align-items: center; }
        .badge-image-simple { width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1)); }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef; font-size: 16px; }
        .detail-label { font-weight: 600; color: #495057; }
        .detail-value { font-weight: 700; color: #0066ff; }
        .text-light { font-size: 16px; color: #868e96; margin: 12px 0; }
        .user-name { font-size: 22px; font-weight: 700; color: #343a40; margin: 8px 0; }
        .area { font-size: 20px; font-weight: 700; color: #343a40; margin: 8px 0; }
        .level { font-size: 16px; color: #868e96; margin: 8px 0; }
        .date { font-size: 15px; color: #868e96; margin-top: 20px; }
      </style>
    </head>
    <body>
      ${badges.map((badge, index) => `
        <div class="badge-card ${index < badges.length - 1 ? 'page-break' : ''}">
          <div class="brand">SOFTINSA</div>
          <div class="title">Badge ${index + 1} de ${badges.length}</div>
          <div class="badge-container">
            <img src="${badge.badgeImage}" alt="${translateLevel(badge.levelId || badge.level)}" class="badge-image-simple" />
          </div>
          <div class="detail-row">
            <span class="detail-label">Área</span>
            <span class="detail-value">${badge.area}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nível</span>
            <span class="detail-value">${translateLevel(badge.levelId || badge.level)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pontos</span>
            <span class="detail-value">${badge.points}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data</span>
            <span class="detail-value">${badge.date}</span>
          </div>
          <div class="text-light">Atribuído a</div>
          <div class="user-name">${userName}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
  return html;
};

const generateRequestsPDF = (requests) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pedidos de Badges</title>
      <style>
        @media print { @page { size: A4 landscape; margin: 20px; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 28px; color: #343a40; margin-bottom: 8px; }
        .header p { color: #868e96; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        thead { background: #0066ff; color: white; }
        th { padding: 14px 16px; text-align: left; font-weight: 600; font-size: 14px; }
        td { padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #495057; }
        tr:last-child td { border-bottom: none; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.sent { background: #d1ecf1; color: #0c5460; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.rejected { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pedidos de Badges</h1>
        <p>Data de exportação: ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Consultor</th>
            <th>Badge</th>
            <th>Nível</th>
            <th>Data</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(req => `
            <tr>
              <td>${req.id}</td>
              <td>${req.consultant}</td>
              <td>${req.badge}</td>
              <td>${req.level}</td>
              <td>${req.date}</td>
              <td><span class="status ${req.status}">${req.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
};

const generateRequestsCSV = (requests) => {
  const BOM = '\uFEFF';
  const headers = ['ID', 'Consultor', 'Badge', 'Nível', 'Data', 'Estado'];
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

const generateConsultantsPDF = (consultants) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Consultores</title>
      <style>
        @media print { @page { size: A4 landscape; margin: 20px; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 28px; color: #343a40; margin-bottom: 8px; }
        .header p { color: #868e96; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        thead { background: #0066ff; color: white; }
        th { padding: 14px 16px; text-align: left; font-weight: 600; font-size: 14px; }
        td { padding: 12px 16px; border-bottom: 1px solid #e9ecef; font-size: 14px; color: #495057; }
        tr:last-child td { border-bottom: none; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.ativo { background: #d4edda; color: #155724; }
        .status.inativo { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Consultores</h1>
        <p>Data de exportação: ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Ranking</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Pontos</th>
            <th>Data de Entrada</th>
            <th>Badges</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${consultants.map((c, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${c.name}</td>
              <td>${c.email}</td>
              <td>${c.points}</td>
              <td>${c.joinedAt}</td>
              <td>${c.badges}</td>
              <td><span class="status ${c.status}">${c.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return html;
};

const generateConsultantsCSV = (consultants) => {
  const BOM = '\uFEFF';
  const headers = ['Ranking', 'Nome', 'Email', 'Pontos', 'Data de Entrada', 'Badges', 'Estado'];
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

function ExportacoesSLL() {
  const navigate = useNavigate();
  const [requestItems, setRequestItems] = useState([]);
  const [consultantItems, setConsultantItems] = useState([]);
  const [badgeItems, setBadgeItems] = useState([]);
  const [loginData, setLoginData] = useState(null);
  const [currentServiceLine, setCurrentServiceLine] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get login data
        const storedLoginData = getStoredLoginData();
        setLoginData(storedLoginData);
        
        if (!storedLoginData?.id) {
          throw new Error('Utilizador não autenticado');
        }
        
        const [serviceLineData, requestsData, badgesData, consultantsData] = await Promise.all([
          fetchMyServiceLine(storedLoginData.id),
          fetchManagedRequests('service-line-leader'),
          fetchHistoricoBadgesSLL(storedLoginData.id),
          fetchHistoricoConsultoresSLL(storedLoginData.id),
        ]);

        const serviceLineName = (
          Array.isArray(serviceLineData)
            ? serviceLineData[0]?.name
            : serviceLineData?.name
        ) || resolveUserServiceLine(storedLoginData);
        setCurrentServiceLine(serviceLineName);

        const formattedRequests = (Array.isArray(requestsData) ? requestsData : []).map((request) => ({
          id: Number(request?.id),
          detailId: Number(request?.id),
          consultant: String(request?.consultant || 'N/A'),
          badge: String(request?.badge || 'N/A'),
          level: normalizeLevelTitle(request?.level || request?.levelLabel || 'N/A'),
          date: formatDateForUi(request?.date),
          status: normalizeRequestExportStatus(request),
        }));

        const formattedBadges = (Array.isArray(badgesData) ? badgesData : []).map((badge) => {
          const levelTitle = normalizeLevelTitle(badge?.level || badge?.nivel);
          const meta = buildBadgeDisplayMeta(levelTitle);

          return {
            id: Number(badge?.id),
            area: String(badge?.area || badge?.name || 'N/A'),
            levelId: meta.levelId,
            level: levelTitle,
            points: meta.points,
            badgeImage: badge?.badgeImage || meta.badgeImage,
            date: formatDateForUi(badge?.obtainedDate || badge?.dataObtencao),
          };
        });

        const formattedConsultants = (Array.isArray(consultantsData) ? consultantsData : []).map((consultant) => ({
          id: Number(consultant?.id),
          name: String(consultant?.name || consultant?.nome || 'N/A'),
          email: String(consultant?.email || 'N/A'),
          points: Number(consultant?.points || consultant?.pontos || 0),
          joinedAt: formatDateForUi(consultant?.joinedAt || consultant?.dataEntrada),
          badges: Number(consultant?.badgesObtidas || consultant?.badges || 0),
          status: normalizeConsultantStatus(consultant?.status),
        }));
        
        setRequestItems(formattedRequests);
        setBadgeItems(formattedBadges);
        setConsultantItems(formattedConsultants);
      } catch (err) {
        console.error('Error loading export data:', err);
        setError('Falha ao carregar dados para exportação');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const scopedRequestItems = requestItems;
  const scopedConsultantItems = consultantItems;
  const scopedBadgeItems = badgeItems;

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

    return scopedRequestItems.filter((item) => {
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
  }, [scopedRequestItems, searchTerm, activeFilter, activeRequestStatuses]);

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

    return scopedBadgeItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || item.area.toLowerCase().includes(normalizedSearch)
        || item.level.toLowerCase().includes(normalizedSearch);
      const matchesLevel = activeFilter === 'todos' || item.levelId === activeFilter;

      return matchesSearch && matchesLevel;
    });
  }, [scopedBadgeItems, searchTerm, activeFilter]);

  const sortedBadges = useMemo(() => {
    const nextRows = [...filteredBadges];

    if (sortBy === 'points_desc') {
      nextRows.sort((a, b) => b.points - a.points || (a.area || '').localeCompare(b.area || ''));
      return nextRows;
    }

    if (sortBy === 'points_asc') {
      nextRows.sort((a, b) => a.points - b.points || (a.area || '').localeCompare(b.area || ''));
      return nextRows;
    }

    if (sortBy === 'area_asc') {
      nextRows.sort((a, b) => (a.area || '').localeCompare(b.area || '') || a.points - b.points);
      return nextRows;
    }

    nextRows.sort((a, b) => (a.area || '').localeCompare(b.area || '') || (a.level || '').localeCompare(b.level || ''));
    return nextRows;
  }, [filteredBadges, sortBy]);

  const filteredConsultants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return scopedConsultantItems.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.email.toLowerCase().includes(normalizedSearch);
      const matchesStatus = activeFilter === 'todos' || item.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [scopedConsultantItems, searchTerm, activeFilter]);

  const sortedConsultants = useMemo(() => {
    const nextRows = [...filteredConsultants];

    if (sortBy === 'points_asc') {
      nextRows.sort((a, b) => a.points - b.points || (a.name || '').localeCompare(b.name || ''));
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

  const pagedRequests = useMemo(() => sortedRequests.slice(start, end), [sortedRequests, start, end]);
  const pagedBadges = useMemo(() => sortedBadges.slice(start, end), [sortedBadges, start, end]);

  const pagedConsultants = useMemo(
    () =>
      sortedConsultants.slice(start, end).map((item, index) => ({
        ...item,
        rank: start + index + 1,
      })),
    [sortedConsultants, start, end],
  );

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

  const searchPlaceholder = activeTab === 'consultores' ? 'Pesquisar consultores' : 'Pesquisar badges';

  const userName = getLoginName(loginData) || 'Joana Gomes';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/service-line-leader/dashboard');
  };

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

  const previousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const nextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  // Export handlers
  const exportBadgesToPDF = () => {
    const selected = badgeItems.filter((item) => selectedBadgeIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um badge para exportar.');
      return;
    }
    try {
      const htmlContent = generateBadgePagesPDF(selected, userName);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error('Error generating badge pages:', error);
      alert('Erro ao gerar páginas das badges. Por favor, tente novamente.');
    }
  };

  const exportBadgesToExcel = () => {
    const selected = badgeItems.filter((item) => selectedBadgeIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um badge para exportar.');
      return;
    }
    try {
      const csvContent = generateBadgesCSV(selected);
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
      alert('Erro ao gerar CSV. Por favor, tente novamente.');
    }
  };

  const exportRequestsToPDF = () => {
    const selected = requestItems.filter((item) => selectedRequestIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um pedido para exportar.');
      return;
    }
    try {
      const htmlContent = generateRequestsPDF(selected);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error('Error generating requests PDF:', error);
      alert('Erro ao gerar PDF dos pedidos. Por favor, tente novamente.');
    }
  };

  const exportRequestsToExcel = () => {
    const selected = requestItems.filter((item) => selectedRequestIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um pedido para exportar.');
      return;
    }
    try {
      const csvContent = generateRequestsCSV(selected);
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
      alert('Erro ao gerar CSV dos pedidos. Por favor, tente novamente.');
    }
  };

  const exportConsultantsToPDF = () => {
    const selected = consultantItems.filter((item) => selectedConsultantIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um consultor para exportar.');
      return;
    }
    try {
      const htmlContent = generateConsultantsPDF(selected);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } catch (error) {
      console.error('Error generating consultants PDF:', error);
      alert('Erro ao gerar PDF dos consultores. Por favor, tente novamente.');
    }
  };

  const exportConsultantsToExcel = () => {
    const selected = consultantItems.filter((item) => selectedConsultantIds.includes(item.id));
    if (selected.length === 0) {
      alert('Por favor, selecione pelo menos um consultor para exportar.');
      return;
    }
    try {
      const csvContent = generateConsultantsCSV(selected);
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
      alert('Erro ao gerar CSV dos consultores. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="tm-export-page">
          <header className="tm-export-header">
            <button type="button" className="tm-export-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <h1>Exportações Service Line</h1>
          </header>
          <div className="tm-export-loading">
            <p>A carregar dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="tm-export-page">
          <header className="tm-export-header">
            <button type="button" className="tm-export-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <h1>Exportações Service Line</h1>
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
      <div className="tm-export-page">
        <header className="tm-export-header">
          <button type="button" className="tm-export-back-btn" onClick={handleGoBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <h1>Exportações Service Line</h1>
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

        <section className="tm-export-shell">

          <div className="tm-export-toolbar">
            <label className="tm-export-search" htmlFor="tm-export-search-input">
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
                <span>Filtrar pesquisa</span>
              </button>

              {showFilterDropdown && (
                <div className="tm-export-dropdown-menu" role="menu" aria-label="Filtrar pesquisa">
                  {filterOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`tm-export-dropdown-item ${activeFilter === item.id ? 'active' : ''}`}
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
                <span>Ordenar</span>
              </button>

              {showSortDropdown && (
                <div className="tm-export-dropdown-menu" role="menu" aria-label="Ordenar">
                  {sortOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`tm-export-dropdown-item ${sortBy === item.id ? 'active' : ''}`}
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

          <p className="tm-export-scope-note">
            Exportação limitada à Service Line: <strong>{currentServiceLine}</strong>
          </p>

          {activeTab === 'pedidos' && (
            <>
              <div className="tm-export-section-head">
                <h2>Pedidos de Badges</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? 'Desselecionar todos' : 'Selecionar todos'}
                  </button>
                  <span className="tm-export-selected-count">{selectedCount} selecionados</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar pedidos em PDF" onClick={exportRequestsToPDF}>
                    <FileDown size={16} />
                    <span>Exportar PDF</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar pedidos em Excel" onClick={exportRequestsToExcel}>
                    <ArrowDownToLine size={16} />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              <div className="tm-export-status-row">
                <span>Filtrar por:</span>
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

              <div className="tm-export-table-wrap">
                <table className="tm-export-table">
                  <thead>
                    <tr>
                      <th />
                      <th>Nome do Consultor</th>
                      <th>Badge Pedida</th>
                      <th>Nível</th>
                      <th>Data do Pedido</th>
                      <th>Estado do Pedido</th>
                      <th>Detalhes do Pedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} className="tm-export-empty-row">Sem resultados para os filtros escolhidos.</td>
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
                              onClick={() => navigate(`/service-line-leader/pedidos/${item.detailId}`)}
                            >
                              Ver
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
                <h2>Badges</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? 'Desselecionar todos' : 'Selecionar todos'}
                  </button>
                  <span className="tm-export-selected-count">{selectedCount} selecionados</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar badges em PDF" onClick={exportBadgesToPDF}>
                    <FileDown size={16} />
                    <span>Exportar PDF</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar badges em Excel" onClick={exportBadgesToExcel}>
                    <ArrowDownToLine size={16} />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              <div className="tm-export-badges-grid">
                {pagedBadges.map((item) => {
                  const isSelected = selectedBadgeIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`tm-export-badge-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleBadgeSelection(item.id)}
                    >
                      <div className="tm-export-badge-frame">
                        <BadgeImage src={item.badgeImage} alt={item.level} className="tm-export-badge-image" levelKey={item.levelId || item.level} typeId={item.typeId} levelLabel={item.level} />
                      </div>
                      <strong>{item.area}</strong>
                      <span>{item.level}</span>
                      <div className="tm-export-badge-meta">
                        <div>
                          <Trophy size={14} />
                          {item.points} pontos
                        </div>
                        <div>
                          <Clock3 size={14} />
                          {item.date}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}


          {activeTab === 'consultores' && (
            <>
              <div className="tm-export-section-head">
                <h2>Consultores</h2>
                <div className="tm-export-section-actions">
                  <button type="button" className="tm-export-link-btn" onClick={toggleSelectAll}>
                    {allSelectedCurrentTab ? 'Desselecionar todos' : 'Selecionar todos'}
                  </button>
                  <span className="tm-export-selected-count">{selectedCount} selecionados</span>
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar consultores em PDF" onClick={exportConsultantsToPDF}>
                    <FileDown size={16} />
                    <span>Exportar PDF</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar consultores em Excel" onClick={exportConsultantsToExcel}>
                    <ArrowDownToLine size={16} />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              <div className="tm-export-table-wrap">
                <table className="tm-export-table consultores">
                  <thead>
                    <tr>
                      <th />
                      <th>Ranking</th>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Pontos</th>
                      <th>Data de Entrada</th>
                      <th>Badges</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedConsultants.length === 0 && (
                      <tr>
                        <td colSpan={8} className="tm-export-empty-row">Sem resultados para os filtros escolhidos.</td>
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
                              <TrendingUp size={13} />
                              {new Intl.NumberFormat('pt-PT').format(item.points)}
                            </span>
                          </td>
                          <td>{item.joinedAt}</td>
                          <td>
                            <span className="tm-export-badge-count">{item.badges}</span>
                          </td>
                          <td>
                            <span className={`tm-export-consultor-status ${item.status}`}>
                              {toConsultantStatusLabel(item.status)}
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

          <div className="tm-export-pagination" role="navigation" aria-label="Paginação de exportações">
            <button type="button" className="tm-export-page-btn ghost" onClick={previousPage} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`tm-export-page-btn ${pageNumber === page ? 'active' : ''}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            <button type="button" className="tm-export-page-btn ghost" onClick={nextPage} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default ExportacoesSLL;

