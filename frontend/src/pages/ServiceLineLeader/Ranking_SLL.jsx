import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  SlidersHorizontal,
  Trophy,
  Award,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchRankingConsultoresSLL } from '../../services/serviceLineLeaderService';
import '../../css/Consultor/Ranking_C.css';

const ITEMS_PER_PAGE = 12;

const buildAvatarUrl = (consultant) =>
  consultant.avatar
  || `/avatars/default-avatar.svg`;

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

const resolveUserServiceLine = (loginData, consultants) => {
  const knownServiceLines = [...new Set(consultants.map((item) => item.serviceLine).filter(Boolean))];

  if (knownServiceLines.length === 0) {
    return 'LowCode';
  }

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

  if (email) {
    const matchedConsultant = consultants.find(
      (item) => String(item.email || '').trim().toLowerCase() === email,
    );

    if (matchedConsultant?.serviceLine) {
      return matchedConsultant.serviceLine;
    }
  }

  if (knownServiceLines.includes('LowCode')) {
    return 'LowCode';
  }

  return knownServiceLines[0];
};

const resolveServiceLineStats = (consultant, currentServiceLine) => {
  const stats = Array.isArray(consultant?.serviceLineStats) ? consultant.serviceLineStats : [];

  if (stats.length === 0) {
    return {
      points: Number(consultant?.points) || 0,
      badges: Number(consultant?.badges) || 0,
    };
  }

  const normalizedTarget = normalizeServiceLine(currentServiceLine);
  const matched = stats.find(
    (item) => normalizeServiceLine(item?.serviceLine) === normalizedTarget,
  );

  if (!matched) {
    return { points: 0, badges: 0 };
  }

  return {
    points: Number(matched.points) || 0,
    badges: Number(matched.badges) || 0,
  };
};

function RankingSLL() {
  const { t } = useTranslation();

  const sortOptions = useMemo(() => [
    { id: 'points_desc', label: t('ranking_sll_sort_points_desc') },
    { id: 'points_asc', label: t('ranking_sll_sort_points_asc') },
    { id: 'badges_desc', label: t('ranking_sll_sort_badges_desc') },
    { id: 'badges_asc', label: t('ranking_sll_sort_badges_asc') },
    { id: 'name_asc', label: t('ranking_sll_sort_name_az') },
    { id: 'name_desc', label: t('ranking_sll_sort_name_za') },
  ], [t]);

  const sortButtonLabels = useMemo(() => ({
    points_desc: t('dashboard_points_short') + ' ↓',
    points_asc: t('dashboard_points_short') + ' ↑',
    badges_desc: t('dashboard_badges_short') + ' ↓',
    badges_asc: t('dashboard_badges_short') + ' ↑',
    name_asc: t('name') + ' A-Z',
    name_desc: t('name') + ' Z-A',
  }), [t]);

  const loginData = useMemo(() => getStoredLoginData(), []);
  const [consultants, setConsultants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('points_desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const defaultSort = 'points_desc';
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRanking = async () => {
      const accountId = Number(loginData?.id);
      if (!Number.isInteger(accountId) || accountId <= 0) {
        return;
      }

      try {
        const data = await fetchRankingConsultoresSLL(accountId);
        if (isMounted && Array.isArray(data)) {
          setConsultants(data);
          setStatusMessage('');
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setConsultants([]);
          setStatusMessage(t('error_generic'));
          setIsLoading(false);
        }
      }
    };

    loadRanking();

    return () => {
      isMounted = false;
    };
  }, [loginData]);

  const currentServiceLine = useMemo(
    () => resolveUserServiceLine(loginData, consultants),
    [loginData, consultants],
  );

  const scopedConsultants = useMemo(() => {
    const normalizedCurrentServiceLine = normalizeServiceLine(currentServiceLine);

    return consultants.filter(
      (item) => normalizeServiceLine(item.serviceLine) === normalizedCurrentServiceLine,
    ).map((item) => {
      const stats = resolveServiceLineStats(item, currentServiceLine);
      return {
        ...item,
        points: stats.points,
        badges: stats.badges,
      };
    });
  }, [consultants, currentServiceLine]);

  const filteredConsultants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return scopedConsultants.filter((item) => {
      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch)
        || item.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm, scopedConsultants]);

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

    rankingReference.forEach((item) => {
      const hasSameScoreAsPrevious =
        previous
        && previous.points === item.points
        && previous.badges === item.badges;

      if (!hasSameScoreAsPrevious) {
        currentRank += 1;
      }

      rankingMap[item.id] = currentRank;
      previous = item;
    });

    return rankingMap;
  }, [filteredConsultants, rankMode]);

  const totalPages = Math.max(1, Math.ceil(sortedConsultants.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedConsultants = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return sortedConsultants.slice(start, end).map((item) => ({
      ...item,
      rank: rankingByConsultantId[item.id] || 0,
    }));
  }, [sortedConsultants, safePage, rankingByConsultantId]);

  const activeSortLabel = sortButtonLabels[sortBy] || (t('dashboard_points_short') + ' ↓');
  const hasActiveSort = sortBy !== defaultSort;

  useEffect(() => {
    const handleOutsideClick = (event) => {
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
          <h1>{t('ranking_sll_title')}</h1>
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
                placeholder={t('search_placeholder')}
                aria-label={t('search_placeholder')}
                value={searchTerm}
                onChange={onSearchChange}
              />
            </div>

            <div className="catalog-dropdown" ref={sortDropdownRef}>
              <button
                type="button"
                className={`action-btn catalog-action-btn ${showSortDropdown || hasActiveSort ? 'active' : ''}`}
                onClick={() => setShowSortDropdown((current) => !current)}
              >
                <SlidersHorizontal size={20} />
                <span className="catalog-action-btn-label">{`${t('sort')}: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu" role="menu" aria-label={t('sort')}>
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
            {t('ranking_sll_consultants_count', { count: sortedConsultants.length, serviceLine: currentServiceLine })} · {activeSortLabel}
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
            <div className="empty-state ranking-empty-state">
              {t('ranking_sll_empty_state')}
            </div>
          )}

          <Pagination page={safePage} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default RankingSLL;
