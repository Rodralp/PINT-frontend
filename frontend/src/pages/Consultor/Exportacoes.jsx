import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Download, FileDown, Filter, Search, SlidersHorizontal, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { fetchCatalogBadges } from '../../services/consultorService';
import '../../css/Consultor/Exportacoes_C.css';
import '../../css/Consultor/CatalogoBadges_C.css';
import { downloadHtmlAsPdf, resolveImageUrl, resolveBadgeFrameImage, renderMaskedBadge } from '../../utils/pdfExport.js';

const SPECIAL_BADGE_TYPE = 'special';

const badgeTypes = [
  { id: 'todos', label: 'Todos' },
  { id: 'badge_level_junior', label: 'Júnior' },
  { id: 'badge_level_intermediate', label: 'Intermédio' },
  { id: 'badge_level_senior', label: 'Sénior' },
  { id: 'badge_level_specialist', label: 'Especialista' },
  { id: 'badge_level_knowledge_lead', label: 'Líder de Conhecimento' },
  { id: SPECIAL_BADGE_TYPE, label: 'Especial' },
];

const getColumnsCount = () => {
  const width = window.innerWidth;
  if (width > 1400) return 5;
  if (width > 1200) return 4;
  if (width > 900) return 3;
  return 2;
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

const normalizeBadgeItem = (item) => {
  const typeId = item.typeId || item.levelKey || (item.isSpecial ? SPECIAL_BADGE_TYPE : null);
  const isSpecial = typeId === SPECIAL_BADGE_TYPE || item.isSpecial || !item.levelKey;

  return {
    ...item,
    typeId,
    isSpecial,
  };
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

const generateBadgesCSV = (badges) => {
  const headers = ['Nome', 'Área', 'Nível', 'Pontos', 'Data', 'ID'];
  const rows = badges.map(badge => [
    badge.name || badge.area,
    badge.area,
    badge.typeId || badge.levelKey || '',
    badge.points,
    badge.date,
    badge.id,
  ]);

  return [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')
  ).join('\n');
};

const translateLevel = (levelKey) => {
  const levelMap = {
    'badge_level_junior': 'Júnior',
    'badge_level_intermediate': 'Intermédio',
    'badge_level_senior': 'Sénior',
    'badge_level_specialist': 'Especialista',
    'badge_level_knowledge_lead': 'Líder de Conhecimento',
    'special': 'Especial',
  };
  return levelMap[levelKey] || levelKey || '';
};

const generateBadgePagesPDF = async (badges, userName) => {
  const renderedBadges = await Promise.all(
    badges.map((badge) =>
      renderMaskedBadge(resolveImageUrl(badge.badgeImage), badge.typeId || badge.levelKey, 120)
    )
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Badges Export</title>
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
            <span style="font-weight:600;color:#495057;">Área</span>
            <span style="font-weight:700;color:#0066ff;">${badge.area || ''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">Nível</span>
            <span style="font-weight:700;color:#0066ff;">${translateLevel(badge.typeId || badge.levelKey)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">Pontos</span>
            <span style="font-weight:700;color:#0066ff;">${badge.points || ''}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
            <span style="font-weight:600;color:#495057;">Data</span>
            <span style="font-weight:700;color:#0066ff;">${badge.date || ''}</span>
          </div>
          <div style="font-size:16px;color:#868e96;margin:12px 0;">Dados da Badge</div>
          <div style="font-size:22px;font-weight:700;color:#343a40;margin:8px 0;">${userName}</div>
        </div>`;
      }).join('')}
    </body>
    </html>
  `;

  return html;
};

const generateProfessionalCertificatePDF = async (badge, userName) => {
  const badgeDataUrl = await renderMaskedBadge(resolveImageUrl(badge.badgeImage), badge.typeId || badge.levelKey, 150);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificado - ${userName}</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;">
      <div style="background:white;border-radius:24px;padding:60px 80px;max-width:600px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,102,255,0.15);border:4px solid #0066ff;position:relative;overflow:hidden;">
        <div style="font-size:18px;font-weight:700;color:#0066ff;letter-spacing:2px;margin-bottom:20px;text-transform:uppercase;">SOFTINSA</div>
        <h3 style="font-size:22px;font-weight:700;color:#495057;margin-bottom:30px;">Certificado de Conquista</h3>
        <div style="margin:0 auto 40px auto;display:flex;justify-content:center;align-items:center;width:150px;height:150px;">
          <img style="width:150px;height:150px;object-fit:contain;" src="${badgeDataUrl}" alt="Badge" />
        </div>
        <p style="color:#868e96;font-size:16px;margin:12px 0;">Concedemos o presente certificado a</p>
        <div style="font-size:22px;font-weight:700;color:#343a40;margin:8px 0;">${userName}</div>
        <p style="color:#868e96;font-size:16px;margin:12px 0;">pela conquista da badge</p>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
          <span style="font-weight:600;color:#495057;">Badge</span>
          <span style="font-weight:700;color:#0066ff;">${badge.area || ''}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e9ecef;font-size:16px;">
          <span style="font-weight:600;color:#495057;">Nível</span>
          <span style="font-weight:700;color:#0066ff;">${translateLevel(badge.typeId || badge.levelKey)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;font-size:16px;">
          <span style="font-weight:600;color:#495057;">Data</span>
          <span style="font-weight:700;color:#0066ff;">${badge.date || new Date().toLocaleDateString('pt-PT')}</span>
        </div>
      </div>
    </body>
    </html>
  `;
  return html;
};

function Exportacoes() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('badges');
  const [badgeItems, setBadgeItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('points_desc');
  const [page, setPage] = useState(1);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);
  const [selectedCertificateId, setSelectedCertificateId] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const [columnsCount, setColumnsCount] = useState(getColumnsCount);

  useEffect(() => {
    const handleResize = () => {
      setColumnsCount(getColumnsCount());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadBadges = async () => {
      setIsLoading(true);
      
      try {
        const data = await fetchCatalogBadges(false);
        
        if (!isMounted) {
          return;
        }
        
        if (Array.isArray(data) && data.length > 0) {
          const obtainedBadges = data.filter((item) => item.status === 'obtido');
          setBadgeItems(obtainedBadges.map(normalizeBadgeItem));
        } else {
          setBadgeItems([]);
        }
        setStatusMessage('');
      } catch {
        if (isMounted) {
          setBadgeItems([]);
          setStatusMessage('Não foi possível carregar os badges. Tente novamente em alguns segundos.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBadges();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedBadgeIds((current) => {
      const validIds = current.filter((badgeId) => badgeItems.some((item) => item.id === badgeId));

      if (validIds.length > 0) {
        return validIds;
      }

      return badgeItems.map((item) => item.id);
    });

    setSelectedCertificateId((current) => {
      if (current && badgeItems.some((item) => item.id === current)) {
        return current;
      }

      return badgeItems[0]?.id || null;
    });
  }, [badgeItems]);

  const filters = useMemo(() => {
    return [...badgeTypes, { id: 'expiring_soon', label: 'Perto de expirar' }];
  }, []);

  const sortOptions = useMemo(() => [
    { id: 'points_desc', label: t('exports_sort_points_desc') },
    { id: 'points_asc', label: t('exports_sort_points_asc') },
    { id: 'area_asc', label: t('exports_sort_area_asc') },
    { id: 'area_desc', label: t('exports_sort_area_desc') },
  ], [t]);

  const sortButtonLabels = useMemo(() => ({
    points_desc: 'Pontos ↓',
    points_asc: 'Pontos ↑',
    area_asc: 'Area A-Z',
    area_desc: 'Area Z-A',
  }), []);

  const activeFilterLabel = useMemo(() => {
    const selected = filters.find((filter) => filter.id === activeFilter);
    return selected ? (selected.labelKey ? t(selected.labelKey) : selected.label) : t('exports_filter_all');
  }, [activeFilter, filters, t]);

  const activeSortLabel = sortButtonLabels[sortBy] || 'Pontos ↓';
  const hasActiveFilter = activeFilter !== 'todos';
  const hasActiveSort = sortBy !== 'points_desc';

  const filteredBadges = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return badgeItems.filter((item) => {
      const badgeTitle = String(item.name || item.title || item.area || '').toLowerCase();
      const levelLabel = item.isSpecial ? 'Especial' : t(item.levelKey || '');
      const translatedLevel = levelLabel.toLowerCase();
      const searchMatch =
        normalizedSearch.length === 0
        || badgeTitle.includes(normalizedSearch)
        || translatedLevel.includes(normalizedSearch);
      const filterMatch = activeFilter === 'todos' || activeFilter === 'expiring_soon' || item.typeId === activeFilter;

      let expirationMatch = true;
      if (activeFilter === 'expiring_soon') {
        const expStatus = getExpirationStatus(item.validade);
        expirationMatch = expStatus !== null && (expStatus.status === 'expiring' || expStatus.status === 'expired');
      }

      return searchMatch && filterMatch && expirationMatch;
    });
  }, [badgeItems, activeFilter, searchTerm, t]);

  const sortedBadges = useMemo(() => {
    return [...filteredBadges].sort((a, b) => {
      if (sortBy === 'area_asc') {
        return String(a.area || a.name || '').localeCompare(String(b.area || b.name || ''));
      }

      if (sortBy === 'area_desc') {
        return String(b.area || b.name || '').localeCompare(String(a.area || a.name || ''));
      }

      if (sortBy === 'points_asc') {
        return a.points - b.points;
      }

      return b.points - a.points;
    });
  }, [filteredBadges, sortBy]);

  const itemsPerPage = columnsCount * 2;
  const totalPages = Math.max(1, Math.ceil(sortedBadges.length / itemsPerPage));

  const pagedBadges = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedBadges.slice(start, end);
  }, [sortedBadges, page, itemsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, activeFilter, sortBy]);

  useEffect(() => {
    if (selectedCertificateId && pagedBadges.some((item) => item.id === selectedCertificateId)) {
      return;
    }

    if (pagedBadges[0]) {
      setSelectedCertificateId(pagedBadges[0].id);
    }
  }, [pagedBadges, selectedCertificateId]);

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

  const selectedCount = selectedBadgeIds.filter((badgeId) => badgeItems.some((item) => item.id === badgeId)).length;
  const allVisibleSelected = filteredBadges.length > 0 && filteredBadges.every((item) => selectedBadgeIds.includes(item.id));

  const toggleBadgeSelection = (badgeId) => {
    setSelectedBadgeIds((current) => {
      if (current.includes(badgeId)) {
        return current.filter((item) => item !== badgeId);
      }

      return [...current, badgeId];
    });
  };

  const toggleSelectAll = () => {
    setSelectedBadgeIds((current) => {
      if (allVisibleSelected) {
        return current.filter((badgeId) => !filteredBadges.some((item) => item.id === badgeId));
      }

      const next = new Set(current);
      filteredBadges.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  };

  const selectedCertificate = badgeItems.find((item) => item.id === selectedCertificateId) || badgeItems[0];
  const userName = getLoginName() || t('app_user_default');

  const exportToPDF = async () => {
    const selectedBadges = badgeItems.filter(item => selectedBadgeIds.includes(item.id));
    if (selectedBadges.length === 0) {
      alert('Por favor, selecione pelo menos um badge para exportar.');
      return;
    }

    try {
      const htmlContent = await generateBadgePagesPDF(selectedBadges, userName);
      const date = new Date().toISOString().split('T')[0];
      downloadHtmlAsPdf(htmlContent, `badges-${date}.pdf`);
    } catch (error) {
      console.error('Error generating badge pages:', error);
      alert('Erro ao gerar páginas das badges. Por favor, tente novamente.');
    }
  };

  const exportToExcel = async () => {
    const selectedBadges = badgeItems.filter(item => selectedBadgeIds.includes(item.id));
    if (selectedBadges.length === 0) {
      alert('Por favor, selecione pelo menos um badge para exportar.');
      return;
    }

    try {
      const csvContent = generateBadgesCSV(selectedBadges);
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

  const exportCertificateToPDF = async () => {
    if (!selectedCertificate) {
      alert('Por favor, selecione um badge para gerar o certificado.');
      return;
    }

    try {
      const htmlContent = await generateProfessionalCertificatePDF(selectedCertificate, userName);
      const date = new Date().toISOString().split('T')[0];
      downloadHtmlAsPdf(htmlContent, `certificado-${date}.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Erro ao gerar certificado. Por favor, tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('loading_export')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page exports-page">
        <header className="page-header exports-header">
          <h1>{t('exports_title')}</h1>
        </header>

        {statusMessage && (
          <div className="alert alert-warning py-2" role="status">
            {statusMessage}
          </div>
        )}

        <div className="exports-tabs" role="tablist" aria-label={t('exports_title')}>
          <button
            type="button"
            className={`exports-tab ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
            role="tab"
            aria-selected={activeTab === 'badges'}
          >
            {t('exports_tab_badges')}
          </button>
          <button
            type="button"
            className={`exports-tab ${activeTab === 'certificado' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificado')}
            role="tab"
            aria-selected={activeTab === 'certificado'}
          >
            {t('exports_tab_certificate')}
          </button>
        </div>

        <section className={`shell exports-shell${activeTab === 'badges' ? ' no-top-left-radius' : ''}`}>

          <div className="toolbar catalog-controls">
            <div className="search-wrap catalog-search-wrap">
              <Search size={20} />
              <input
                type="text"
                placeholder={t('search_badges')}
                aria-label={t('search_badges')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="catalog-dropdown" ref={filterDropdownRef}>
                <button
                    type="button"
                    className={`action-btn catalog-action-btn ${showFilterDropdown || hasActiveFilter ? 'active' : ''}`}
                    onClick={() => {
                      setShowFilterDropdown((current) => !current);
                      setShowSortDropdown(false);
                    }}
                  >
                    <Filter size={20} />
                    <span className="action-btn-label catalog-action-btn-label">{`${t('filter_search')}: ${activeFilterLabel}`}</span>
                  </button>

                  {showFilterDropdown && (
                    <div className="dropdown-menu catalog-dropdown-menu" role="menu" aria-label="Filtros de badges">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          className={`dropdown-item ${activeFilter === filter.id ? 'active' : ''}`}
                          onClick={() => {
                            setActiveFilter(filter.id);
                            setShowFilterDropdown(false);
                          }}
                        >
                          {filter.labelKey ? t(filter.labelKey) : filter.label}
                        </button>
                      ))}
                    </div>
                  )}
            </div>

            <div className="catalog-dropdown" ref={sortDropdownRef}>
              <button
                    type="button"
                    className={`action-btn catalog-action-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                    onClick={() => {
                      setShowSortDropdown((current) => !current);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <SlidersHorizontal size={20} />
                    <span className="action-btn-label catalog-action-btn-label">{`${t('sort')}: ${activeSortLabel}`}</span>
                  </button>

                  {showSortDropdown && (
                    <div className="dropdown-menu catalog-dropdown-menu" role="menu" aria-label="Ordenacao de badges">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`dropdown-item ${sortBy === option.id ? 'active' : ''}`}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortDropdown(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
            </div>
          </div>

          {activeTab === 'badges' && (
            <>
              <div className="exports-section-head">
                <h2>{t('exports_badges_section_title')}</h2>
                <div className="exports-section-actions">
                  <button type="button" className="exports-link-button" onClick={toggleSelectAll}>
                    {allVisibleSelected ? t('exports_deselect_all') : t('exports_select_all')}
                  </button>
                  <span className="exports-selected-count">{t('exports_selected_count', { count: selectedCount })}</span>
                  <button type="button" className="btn-outline exports-secondary-btn" onClick={exportToPDF} disabled={selectedBadgeIds.length === 0}>
                    <FileDown size={16} />
                    <span>{t('exports_export_pdf')}</span>
                  </button>
                  <button type="button" className="btn-primary exports-primary-btn" onClick={exportToExcel} disabled={selectedBadgeIds.length === 0}>
                    <Download size={16} />
                    <span>{t('exports_export_excel')}</span>
                  </button>
                </div>
              </div>

              <div className="catalog-grid">
                {pagedBadges.map((item) => {
                  const isSelected = selectedBadgeIds.includes(item.id);
                  const badgeTitle = item.name || item.title || item.area || 'Badge';
                  const levelLabel = item.isSpecial ? 'Especial' : t(item.levelKey || '');
                  const badgeDate = item.date || '--';
                  const expirationInfo = getExpirationStatus(item.validade);

                  return (
                    <article
                      key={item.id}
                      className={`card catalog-card ${isSelected ? 'selected' : ''}`}
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
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(251, 191, 36, 0.9)',
                          color: '#92400e',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 1,
                        }}>
                          <Clock3 size={12} />
                          {expirationInfo.label}
                        </div>
                      )}

                      <div className="catalog-badge-frame">
                        <BadgeImage
                          className="catalog-badge-image"
                          src={item.badgeImage}
                          alt={levelLabel}
                          frameSrc={item.badgeFrameImage}
                          levelKey={item.levelKey}
                          typeId={item.typeId}
                          levelLabel={levelLabel}
                        />
                      </div>

                      <div className="catalog-card-title">{badgeTitle}</div>
                      {item.description && (
                        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px', lineHeight: '1.4' }}>
                          {item.description}
                        </div>
                      )}
                      <div className="catalog-card-level">{levelLabel}</div>

                      <div className="catalog-card-meta">
                        <div className="catalog-meta-row">
                          <Trophy size={14} />
                          <span>{item.points} {t('points')}</span>
                        </div>
                        <div className="catalog-meta-row" style={{
                          color: expirationInfo?.status === 'expiring' ? '#b45309' : expirationInfo?.status === 'expired' ? '#dc2626' : '#6b7280',
                        }}>
                          <Clock3 size={14} />
                          <span>
                            {item.validade
                              ? (expirationInfo?.status === 'expired'
                                ? 'Expirada'
                                : `Expira: ${new Date(item.validade).toLocaleDateString('pt-PT')}`
                              )
                              : badgeDate
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

          {activeTab === 'certificado' && (
            <div className="exports-certificate-layout">
              <aside className="exports-certificate-sidebar">
                <div className="exports-section-head compact">
                  <h2>{t('exports_certificate_list_title')}</h2>
                  <div className="exports-mini-pager">{page} / {totalPages}</div>
                </div>

                <div className="exports-certificate-list">
                  {pagedBadges.map((item) => {
                    const isSelected = item.id === selectedCertificateId;
                    const levelLabel = item.isSpecial ? 'Especial' : t(item.levelKey || '');

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`exports-certificate-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedCertificateId(item.id)}
                      >
                        <BadgeImage src={item.badgeImage} alt={levelLabel} className="exports-certificate-thumb" levelKey={item.levelKey} typeId={item.typeId} levelLabel={levelLabel} />
                        <div className="exports-certificate-item-text">
                          <strong>{item.area || item.name}</strong>
                          <span>{levelLabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button type="button" className="btn-primary exports-primary-btn exports-full-width-btn" onClick={exportCertificateToPDF} disabled={!selectedCertificate}>
                  <FileDown size={16} />
                  <span>{t('exports_export_pdf')}</span>
                </button>
              </aside>

              <div className="exports-certificate-preview-wrap">
                <div className="exports-certificate-preview">
                  <div className="exports-certificate-brand">SOFTINSA</div>
                  <h3>{t('exports_certificate_title')}</h3>
                  <BadgeImage
                    src={selectedCertificate?.badgeImage || badgeItems[0]?.badgeImage}
                    alt={selectedCertificate ? t(selectedCertificate.levelKey || '') : t('exports_certificate_title')}
                    className="exports-certificate-badge"
                    levelKey={selectedCertificate?.levelKey}
                    typeId={selectedCertificate?.typeId}
                    levelLabel={selectedCertificate ? t(selectedCertificate.levelKey || '') : ''}
                  />
                  <p className="exports-certificate-copy">{t('exports_certificate_sentence')}</p>
                  <strong className="exports-certificate-name">{userName}</strong>
                  <p className="exports-certificate-copy">{t('exports_certificate_earned')}</p>
                  <strong className="exports-certificate-area">{selectedCertificate?.area || selectedCertificate?.name || t('exports_certificate_title')}</strong>
                  <span className="exports-certificate-level">
                    {selectedCertificate ? t(selectedCertificate.levelKey || '') : t('exports_certificate_title')}
                  </span>
                  <span className="exports-certificate-date">{selectedCertificate?.date || '--'}</span>
                </div>
              </div>
            </div>
          )}

          {filteredBadges.length === 0 && !isLoading && (
            <div className="empty-state catalog-empty-state">Nenhum badge encontrado com os filtros escolhidos.</div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default Exportacoes;
