import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Trophy,
  Award,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchRankingConsultores } from '../../services/consultorService';
import '../../css/Consultor/Ranking_C.css';

const ITEMS_PER_PAGE = 12;

const buildAvatarUrl = (consultant) =>
  consultant.avatar
  || `/avatars/default-avatar.svg`;

function RankingConsultores() {
  const { t } = useTranslation();
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeServiceLine, setActiveServiceLine] = useState('all');
  const [sortBy, setSortBy] = useState('points_desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const defaultSort = 'points_desc';

  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRanking = async () => {
      try {
        const data = await fetchRankingConsultores();
        if (isMounted && Array.isArray(data)) {
          setConsultants(data);
          setStatusMessage('');
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setConsultants([]);
          setStatusMessage(t('ranking_consultores_load_error'));
          setIsLoading(false);
        }
      }
    };

    loadRanking();

    return () => {
      isMounted = false;
    };
  }, []);

  const serviceLineOptions = useMemo(
    () => ['all', ...new Set(consultants.map((item) => item.serviceLine))],
    [consultants],
  );

  const sortOptions = useMemo(() => [
    { id: 'points_desc', label: `${t('dashboard_points_short')} (Maior para Menor)` },
    { id: 'points_asc', label: `${t('dashboard_points_short')} (Menor para Maior)` },
    { id: 'badges_desc', label: `${t('dashboard_badges_short')} (Maior para Menor)` },
    { id: 'badges_asc', label: `${t('dashboard_badges_short')} (Menor para Maior)` },
    { id: 'name_asc', label: `${t('name')} (A-Z)` },
    { id: 'name_desc', label: `${t('name')} (Z-A)` },
  ], [t]);

  const sortButtonLabels = useMemo(() => ({
    points_desc: `${t('dashboard_points_short')} ↓`,
    points_asc: `${t('dashboard_points_short')} ↑`,
    badges_desc: `${t('dashboard_badges_short')} ↓`,
    badges_asc: `${t('dashboard_badges_short')} ↑`,
    name_asc: `${t('name')} A-Z`,
    name_desc: `${t('name')} Z-A`,
  }), [t]);

  const filteredConsultants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return consultants.filter((item) => {
      const serviceLineMatch = activeServiceLine === 'all' || item.serviceLine === activeServiceLine;
      const searchMatch =
        normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.email.toLowerCase().includes(normalizedSearch)
        || item.serviceLine.toLowerCase().includes(normalizedSearch);

      return serviceLineMatch && searchMatch;
    });
  }, [searchTerm, activeServiceLine, consultants]);

  const sortedConsultants = useMemo(() => {
    return [...filteredConsultants].sort((a, b) => {
      if (sortBy === 'points_asc') {
        return a.points - b.points || a.badges - b.badges || a.name.localeCompare(b.name);
      }

      if (sortBy === 'badges_desc') {
        return b.badges - a.badges || b.points - a.points || a.name.localeCompare(b.name);
      }

      if (sortBy === 'badges_asc') {
        return a.badges - b.badges || a.points - b.points || a.name.localeCompare(b.name);
      }

      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }

      return b.points - a.points || b.badges - a.badges || a.name.localeCompare(b.name);
    });
  }, [filteredConsultants, sortBy]);

  const rankMode = useMemo(
    () => (sortBy === 'badges_desc' || sortBy === 'badges_asc' ? 'badges' : 'points'),
    [sortBy],
  );

  const rankingByConsultantId = useMemo(() => {
    const rankingReference = [...filteredConsultants].sort((a, b) => {
      if (rankMode === 'badges') {
        return b.badges - a.badges || b.points - a.points || a.name.localeCompare(b.name);
      }

      return b.points - a.points || b.badges - a.badges || a.name.localeCompare(b.name);
    });

    const rankingMap = {};
    let previous = null;
    let currentRank = 0;

    rankingReference.forEach((item, index) => {
      const hasSameScoreAsPrevious =
        previous
        && previous.points === item.points
        && previous.badges === item.badges;

      if (!hasSameScoreAsPrevious) {
        currentRank = index + 1;
      }

      rankingMap[item.id] = currentRank;
      previous = item;
    });

    return rankingMap;
  }, [filteredConsultants, rankMode]);

  const totalPages = Math.max(1, Math.ceil(sortedConsultants.length / ITEMS_PER_PAGE));

  const pagedConsultants = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedConsultants.slice(start, end).map((item) => ({
      ...item,
      rank: rankingByConsultantId[item.id] || 0,
    }));
  }, [sortedConsultants, page, rankingByConsultantId]);

  const activeFilterLabel = activeServiceLine === 'all' ? t('all_service_lines') : activeServiceLine;
  const activeSortLabel = sortButtonLabels[sortBy] || 'Pontos ↓';
  const hasActiveFilter = activeServiceLine !== 'all';
  const hasActiveSort = sortBy !== defaultSort;

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

  const onSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const onFilterSelect = (serviceLine) => {
    setActiveServiceLine(serviceLine);
    setShowFilterDropdown(false);
    setPage(1);
  };

  const onSortSelect = (selectedSort) => {
    setSortBy(selectedSort);
    setShowSortDropdown(false);
    setPage(1);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>{t('ranking_consultores_title')}</h1>
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
                placeholder={t('search_consultants')}
                aria-label={t('search_consultants')}
                value={searchTerm}
                onChange={onSearchChange}
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
                <span className="catalog-action-btn-label">{`${t('filter_search')}: ${activeFilterLabel}`}</span>
              </button>

              {showFilterDropdown && (
                <div className="dropdown-menu" role="menu" aria-label={t('filter_by_service_line')}>
                  {serviceLineOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`dropdown-item ${activeServiceLine === option ? 'active' : ''}`}
                      onClick={() => onFilterSelect(option)}
                    >
                      {option === 'all' ? t('all_service_lines') : option}
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
                <span className="catalog-action-btn-label">{`${t('sort')}: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu" role="menu" aria-label={t('sort_ranking')}>
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

          <div className="ranking-current-state">
            {sortedConsultants.length} {t('consultants')} · {activeFilterLabel} · {activeSortLabel}
          </div>

          <div className="ranking-grid">
            {pagedConsultants.map((consultant) => {
              const isTopThree = consultant.rank <= 3;

              return (
                <article key={consultant.id} className="ranking-card">
                  <div className={`ranking-badge ${isTopThree ? `top-${consultant.rank}` : ''}`}>
                    {isTopThree ? <Trophy size={20} strokeWidth={2} /> : <span>#{consultant.rank}</span>}
                  </div>

                  <img
                    className="ranking-avatar"
                    src={buildAvatarUrl(consultant)}
                    alt={consultant.name}
                    onError={(event) => {
                      event.currentTarget.src = `/avatars/default-avatar.svg`;
                    }}
                  />

                  <div className="ranking-content">
                    <strong>{consultant.name}</strong>
                    <span>{consultant.email}</span>

                    <div className="ranking-metrics">
                      <div>
                        <small>{t('dashboard_points_short')}</small>
                        <p>{consultant.points}</p>
                      </div>
                      <div>
                        <small>{t('dashboard_badges_short')}</small>
                        <p>
                          <Award size={13} />
                          {consultant.badges}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {sortedConsultants.length === 0 && (
            <div className="empty-state ranking-empty-state">{t('no_items')}</div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default RankingConsultores;