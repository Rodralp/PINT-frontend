import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Trophy,
  Award,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import { fetchRankingConsultores } from '../../services/consultorService';
import '../../css/Consultor/Ranking_C.css';

const ITEMS_PER_PAGE = 12;

const buildAvatarUrl = (consultant) =>
  consultant.avatar
  || `/avatars/default-avatar.svg`;

function RankingConsultores() {
  const [consultants, setConsultants] = useState([]);
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
  }, []);

  const serviceLineOptions = useMemo(
    () => ['all', ...new Set(consultants.map((item) => item.serviceLine))],
    [consultants],
  );

  const sortOptions = useMemo(() => [
    { id: 'points_desc', label: 'Pontos (Maior para Menor)' },
    { id: 'points_asc', label: 'Pontos (Menor para Maior)' },
    { id: 'badges_desc', label: 'Badges (Maior para Menor)' },
    { id: 'badges_asc', label: 'Badges (Menor para Maior)' },
    { id: 'name_asc', label: 'Nome (A-Z)' },
    { id: 'name_desc', label: 'Nome (Z-A)' },
  ], []);

  const sortButtonLabels = useMemo(() => ({
    points_desc: 'Pontos ↓',
    points_asc: 'Pontos ↑',
    badges_desc: 'Badges ↓',
    badges_asc: 'Badges ↑',
    name_asc: 'Nome A-Z',
    name_desc: 'Nome Z-A',
  }), []);

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

  const activeFilterLabel = activeServiceLine === 'all' ? 'Todas as Service Lines' : activeServiceLine;
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

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <h1>Ranking de Consultores</h1>
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
                <span className="catalog-action-btn-label">{`Filtrar pesquisa: ${activeFilterLabel}`}</span>
              </button>

              {showFilterDropdown && (
                <div className="dropdown-menu" role="menu" aria-label="Filtrar por service line">
                  {serviceLineOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`dropdown-item ${activeServiceLine === option ? 'active' : ''}`}
                      onClick={() => onFilterSelect(option)}
                    >
                      {option === 'all' ? 'Todas as Service Lines' : option}
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
            {sortedConsultants.length} consultor(es) · {activeFilterLabel} · {activeSortLabel}
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
            <div className="empty-state ranking-empty-state">Nao ha consultores para os filtros escolhidos.</div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default RankingConsultores;