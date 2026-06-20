import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Pagination from '../../components/Pagination';
import BadgeImage from '../../components/BadgeImage';
import { fetchManagedRequests } from '../../services/requestManagementService';
import { fetchAdminUsers } from '../../services/adminUserService';
import { fetchCatalogBadges } from '../../services/consultorService';
import '../../css/AdminGestor/Exportacoes_AG.css';
import '../../css/Consultor/CatalogoBadges_C.css';

const tabs = [
  { id: 'pedidos', label: 'Pedidos de Badges' },
  { id: 'badges', label: 'Badges' },
  { id: 'consultores', label: 'Consultores' },
];

const requestStatusFilters = [
  { id: 'enviado', label: 'Enviados' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'rejeitado', label: 'Rejeitados' },
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
  { id: 'badges_desc', label: 'Badges (Maior para Menor)' },
  { id: 'badges_asc', label: 'Badges (Menor para Maior)' },
  { id: 'nome_az', label: 'Nome (A-Z)' },
  { id: 'entrada_recente', label: 'Data de entrada (Recente)' },
];

const tabDefaults = {
  pedidos: { filter: 'todos', sort: 'recentes' },
  badges: { filter: 'todos', sort: 'padrao' },
  consultores: { filter: 'todos', sort: 'points_desc' },
};

const requestStatusMeta = {
  enviado: { label: 'Enviados', className: 'sent' },
  pendente: { label: 'Pendentes', className: 'pending' },
  rejeitado: { label: 'Rejeitados', className: 'rejected' },
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

const getExpirationStatus = (validade) => {
  if (!validade) return null;
  const today = new Date();
  const expDate = new Date(validade);
  const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) return { status: 'expired', label: 'Expirada', days: daysUntil };
  if (daysUntil <= 30) return { status: 'expiring', label: `Expira em ${daysUntil} dias`, days: daysUntil };
  return null;
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
    return 'Pendentes';
  }

  return 'Inativo';
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
          <div class="text-light">Dados da Badge</div>
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

function ExportacoesAG() {
  const navigate = useNavigate();
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
          const levelLabel = isSpecial ? 'Especial' : (badge?.levelLabel || badge?.level || translateLevel(levelKey) || 'Badge');
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
        setError('Falha ao carregar dados para exportação');
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
      const matchesLevel = activeFilter === 'todos' || item.levelId === activeFilter;

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

  const searchPlaceholder = activeTab === 'consultores' ? 'Pesquisar consultores' : 'Pesquisar badges';

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
        <div className="page">
          <header className="page-header">
            <h1>Exportações Administrador / Gestor</h1>
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
        <div className="page">
          <header className="page-header">
            <h1>Exportações Administrador / Gestor</h1>
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
          <h1>Exportações Administrador / Gestor</h1>
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

        <section className="shell">

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
                <span className="tm-export-control-btn-label">Filtrar pesquisa</span>
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
                <span className="tm-export-control-btn-label">Ordenar</span>
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

              <div className="table-wrap tm-export-table-wrap">
                <table className="table tm-export-table">
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
                        <td colSpan={7} className="empty-state tm-export-empty-row">Sem resultados para os filtros escolhidos.</td>
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
                  <button type="button" className="tm-export-btn secondary" aria-label="Exportar badges em PDF" onClick={exportBadgesToPDF} disabled={selectedBadgeIds.length === 0}>
                    <FileDown size={16} />
                    <span>Exportar PDF</span>
                  </button>
                  <button type="button" className="tm-export-btn primary" aria-label="Exportar badges em Excel" onClick={exportBadgesToExcel} disabled={selectedBadgeIds.length === 0}>
                    <ArrowDownToLine size={16} />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              <div className="catalog-grid">
                {pagedBadges.map((item) => {
                  const isSelected = selectedBadgeIds.includes(item.id);
                  const badgeTitle = item.name || item.area || 'Badge';
                  const levelLabel = item.isSpecial ? 'Especial' : item.levelLabel || item.level;
                  const expirationInfo = getExpirationStatus(item.validade);

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
                          <span>{item.points} pontos</span>
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
                                ? 'Expirada'
                                : `Expira: ${new Date(item.validade).toLocaleDateString('pt-PT')}`
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

              <div className="table-wrap tm-export-table-wrap">
                <table className="table tm-export-table consultores">
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
                        <td colSpan={8} className="empty-state tm-export-empty-row">Sem resultados para os filtros escolhidos.</td>
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

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default ExportacoesAG;

