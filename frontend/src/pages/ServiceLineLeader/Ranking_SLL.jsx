import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Trophy,
  Award,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import { fetchRankingConsultoresSLL } from '../../services/serviceLineLeaderService';
import '../../css/Consultor/Ranking_C.css';

const sortOptions = [
  { id: 'points_desc', label: 'Pontos (Maior para Menor)' },
  { id: 'points_asc', label: 'Pontos (Menor para Maior)' },
  { id: 'badges_desc', label: 'Badges (Maior para Menor)' },
  { id: 'name_asc', label: 'Nome (A-Z)' },
];

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
  const loginData = useMemo(() => getStoredLoginData(), []);
  const [consultants, setConsultants] = useState([]);
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
        }
      } catch {
        if (isMounted) {
          setConsultants([]);
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
        return a.points - b.points || a.name.localeCompare(b.name);
      }

      if (sortBy === 'badges_desc') {
        return b.badges - a.badges || b.points - a.points;
      }

      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }

      return b.points - a.points || b.badges - a.badges;
    });
  }, [filteredConsultants, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedConsultants.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedConsultants = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return sortedConsultants.slice(start, end).map((item, index) => ({
      ...item,
      rank: start + index + 1,
    }));
  }, [sortedConsultants, safePage]);

  const activeSortLabel = sortOptions.find((item) => item.id === sortBy)?.label || sortOptions[0].label;
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

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>Ranking da Service Line</h1>
        </header>

        <section className="shell">
          <div className="toolbar catalog-controls">
            <div className="search-wrap">
              <Search size={20} />
              <input
                type="text"
                placeholder="Pesquisar consultores"
                aria-label="Pesquisar consultores"
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
                <span className="catalog-action-btn-label">{`Ordenar: ${activeSortLabel}`}</span>
              </button>

              {showSortDropdown && (
                <div className="dropdown-menu" role="menu" aria-label="Ordenar ranking">
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
            {sortedConsultants.length} consultor(es) da Service Line {currentServiceLine} · {activeSortLabel}
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
                        <small>Pontos</small>
                        <p>{consultant.points}</p>
                      </div>
                      <div>
                        <small>Badges</small>
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
              Nao ha consultores para os filtros escolhidos nesta service line.
            </div>
          )}

          <Pagination page={safePage} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default RankingSLL;
