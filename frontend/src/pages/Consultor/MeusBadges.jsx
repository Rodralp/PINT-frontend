import { useMemo, useRef, useState, useEffect } from 'react';
import { CheckCircle2, Clock3, Filter, SearchCheck, Search, SlidersHorizontal, Trophy, AlertTriangle, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import Pagination from '../../components/Pagination';
import { fetchMyBadges } from '../../services/consultorService';
import '../../css/Consultor/CatalogoBadges_C.css';

const badgeStates = [
  {
    id: 'aprovado',
    label: 'Aprovado',
    tint: 'rgba(34, 197, 94, 0.18)',
    border: 'rgba(21, 128, 61, 0.48)',
    buttonBg: '#dcfce7',
    buttonBorder: '#16a34a',
    buttonColor: '#15803d',
    Icon: CheckCircle2,
  },
  {
    id: 'pendente-tm',
    label: 'Em Validação',
    tint: 'rgba(250, 204, 21, 0.14)',
    border: 'rgba(234, 179, 8, 0.36)',
    buttonBg: '#fef3c7',
    buttonBorder: '#eab308',
    buttonColor: '#b45309',
    Icon: SearchCheck,
  },
  {
    id: 'pendente-sll',
    label: 'Em Validação',
    tint: 'rgba(250, 204, 21, 0.14)',
    border: 'rgba(234, 179, 8, 0.36)',
    buttonBg: '#fef3c7',
    buttonBorder: '#eab308',
    buttonColor: '#b45309',
    Icon: SearchCheck,
  },
  {
    id: 'candidatura_em_progresso',
    label: 'Candidatura em Progresso',
    tint: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(37, 99, 235, 0.34)',
    buttonBg: '#dbeafe',
    buttonBorder: '#2563eb',
    buttonColor: '#1d4ed8',
    Icon: TimerReset,
  },
  {
    id: 'rejeitado',
    label: 'Rejeitado',
    tint: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(239, 68, 68, 0.34)',
    buttonBg: '#fee2e2',
    buttonBorder: '#ef4444',
    buttonColor: '#dc2626',
    Icon: AlertTriangle,
  },
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

function MeusBadges() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const defaultSort = 'points_desc';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState(defaultSort);
  const [badgeItems, setBadgeItems] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [columnsCount, setColumnsCount] = useState(getColumnsCount);
  
  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setColumnsCount(getColumnsCount());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = columnsCount * 2;

  const badgeStateMap = useMemo(
    () => badgeStates.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadMyBadges = async () => {
      try {
        const data = await fetchMyBadges();
        if (isMounted) {
          setBadgeItems(Array.isArray(data) ? data : []);
          setStatusMessage('');
        }
      } catch {
        if (isMounted) {
          setBadgeItems([]);
          setStatusMessage('Não foi possível carregar os badges. Tente novamente em alguns segundos.');
        }
      }
    };

    loadMyBadges();

    return () => {
      isMounted = false;
    };
  }, []);

  const filters = useMemo(() => [
    { id: 'todos', label: 'Todos' },
    { id: 'special', label: 'Especial' },
    { id: 'aprovado', label: 'Aprovado' },
    { id: 'pendente', label: 'Em Validação' },
    { id: 'candidatura_em_progresso', label: 'Candidatura em Progresso' },
    { id: 'rejeitado', label: 'Rejeitado' },
  ], []);

  const sortOptions = useMemo(() => [
    { id: 'points_desc', label: 'Pontos (Maior para Menor)' },
    { id: 'points_asc', label: 'Pontos (Menor para Maior)' },
    { id: 'area_asc', label: 'Area (A-Z)' },
    { id: 'area_desc', label: 'Area (Z-A)' },
  ], []);

  const sortButtonLabels = useMemo(() => ({
    points_desc: 'Pontos ↓',
    points_asc: 'Pontos ↑',
    area_asc: 'Area A-Z',
    area_desc: 'Area Z-A',
  }), []);

  const activeFilterLabel = useMemo(() => {
    const selected = filters.find((filter) => filter.id === activeFilter);
    return selected ? selected.label : 'Todos';
  }, [filters, activeFilter]);

  const activeSortLabel = sortButtonLabels[sortBy] || 'Pontos ↓';
  const hasActiveFilter = activeFilter !== 'todos';
  const hasActiveSort = sortBy !== defaultSort;

  const filteredBadges = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return badgeItems.filter((item) => {
      const isSpecial = Boolean(item?.isSpecial) || item?.typeId === 'special' || !item?.levelKey;
      const translatedLevel = isSpecial ? 'Especial' : t(item.levelKey || '');
      const stateLabel = badgeStateMap[item.stateId]?.label || '';
      const badgeTitle = String(item.name || item.area || '').toLowerCase();
      const filterMatch = activeFilter === 'todos'
        || (activeFilter === 'special' ? isSpecial
          : activeFilter === 'pendente' ? (item.stateId === 'pendente-tm' || item.stateId === 'pendente-sll')
          : item.stateId === activeFilter);
      const searchMatch =
        normalizedSearch.length === 0
        || badgeTitle.includes(normalizedSearch)
        || translatedLevel.toLowerCase().includes(normalizedSearch)
        || stateLabel.toLowerCase().includes(normalizedSearch);

      return filterMatch && searchMatch;
    });
  }, [badgeItems, activeFilter, searchTerm, badgeStateMap, t]);

  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / itemsPerPage));

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

  const pagedBadges = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedBadges.slice(start, end);
  }, [sortedBadges, page, itemsPerPage]);

  const onSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const onFilterSelect = (filterId) => {
    setActiveFilter(filterId);
    setPage(1);
    setShowFilterDropdown(false);
  };

  const onSortSelect = (sortId) => {
    setSortBy(sortId);
    setPage(1);
    setShowSortDropdown(false);
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown((current) => !current);
    setShowSortDropdown(false);
  };

  const toggleSortDropdown = () => {
    setShowSortDropdown((current) => !current);
    setShowFilterDropdown(false);
  };

  const handleOpenBadgeDetails = (item) => {
    const badgeDbId = Number(item?.badgeDbId);
    const routeBadgeId = Number.isInteger(badgeDbId) && badgeDbId > 0
      ? String(badgeDbId)
      : String(item.id);

    navigate(`/consultor/badge/${encodeURIComponent(routeBadgeId)}`, {
      state: {
        badge: item,
        backTo: '/consultor/meus-badges',
        activeSidebarRoute: '/consultor/meus-badges',
      },
    });
  };

  const handleCardKeyDown = (event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenBadgeDetails(item);
    }
  };

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

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>{t('my_badges_title')}</h1>
        </header>

        <section className="shell">
          {statusMessage && (
            <div className="alert alert-warning py-2" role="status">
              {statusMessage}
            </div>
          )}

          <div className="toolbar catalog-controls">
            <div className="search-wrap">
              <Search size={20} />
              <input
                type="text"
                placeholder={t('search_badges')}
                aria-label={t('search_badges')}
                value={searchTerm}
                onChange={onSearchChange}
              />
            </div>

            <div className="catalog-dropdown" ref={filterDropdownRef}>
              <button
                type="button"
                className={`action-btn catalog-action-btn ${showFilterDropdown || hasActiveFilter ? 'active' : ''}`}
                onClick={toggleFilterDropdown}
              >
                <Filter size={20} />
                <span className="catalog-action-btn-label">{`${t('filter_search')}: ${activeFilterLabel}`}</span>
              </button>

              {showFilterDropdown && (
                <div className="dropdown-menu" role="menu" aria-label="Filtros de badges">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`dropdown-item ${activeFilter === filter.id ? 'active' : ''}`}
                      onClick={() => onFilterSelect(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="catalog-dropdown" ref={sortDropdownRef}>
              <button
                type="button"
                className={`action-btn catalog-action-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                onClick={toggleSortDropdown}
              >
                <SlidersHorizontal size={20} />
                <span className="catalog-action-btn-label">{`${t('sort')}: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu" role="menu" aria-label="Ordenacao de badges">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`dropdown-item ${sortBy === option.id ? 'active' : ''}`}
                      onClick={() => onSortSelect(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="catalog-grid">
            {pagedBadges.map((item) => {
              const isSpecial = Boolean(item?.isSpecial) || item?.typeId === 'special' || !item.levelKey;
              const levelLabel = isSpecial ? 'Especial' : t(item.levelKey || '');
              const currentState = badgeStateMap[item.stateId] || badgeStateMap.aprovado;
              const { Icon } = currentState;
              const expirationInfo = getExpirationStatus(item.validade);

              return (
                <article
                  key={item.id}
                  className="catalog-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenBadgeDetails(item)}
                  onKeyDown={(event) => handleCardKeyDown(event, item)}
                  style={{
                    background: currentState.tint,
                    borderColor: currentState.border,
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

                  <div className="catalog-card-title">{item.name || item.area || 'Badge'}</div>
                  <div className="catalog-card-level">{levelLabel}</div>

                  <div className="catalog-card-meta">
                    <div className="catalog-meta-row">
                      <Trophy size={14} />
                      <span>{item.points} {t('points')}</span>
                    </div>
                    {item.status === 'obtido' && (
                      <div className="catalog-meta-row">
                        <CheckCircle2 size={14} />
                        <span>Obtida: {item.date}</span>
                      </div>
                    )}
                    {item.status === 'rejeitado' && (
                      <div className="catalog-meta-row">
                        <AlertTriangle size={14} />
                        <span>Rejeitado: {item.date}</span>
                      </div>
                    )}
                    {item.status !== 'obtido' && item.status !== 'rejeitado' && (
                      <div className="catalog-meta-row">
                        <TimerReset size={14} />
                        <span>Pedido: {item.date}</span>
                      </div>
                    )}
                    {item.validade && (
                      <div className="catalog-meta-row">
                        <Clock3 size={14} />
                        <span>
                          {expirationInfo?.status === 'expired'
                            ? 'Expirada'
                            : `Expira: ${new Date(item.validade).toLocaleDateString('pt-PT')}`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={currentState.label}
                    title={currentState.label}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenBadgeDetails(item);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: `2px solid ${currentState.buttonBorder}`,
                      background: currentState.buttonBg,
                      color: currentState.buttonColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </button>
                  
                </article>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div className="empty-state catalog-empty-state">Nenhum badge encontrado com os filtros escolhidos.</div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default MeusBadges;
