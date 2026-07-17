import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  SearchCheck,
  Search,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchMyRequests } from '../../services/consultorService';
import '../../css/Consultor/MeusPedidos.css';

const ITEMS_PER_PAGE = 10;

function MeusPedidos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allRequests, setAllRequests] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const statusConfig = {
    aprovado: {
      label: t('meus_pedidos_status_approved'),
      cardClass: 'status-card approved',
      badgeClass: 'success',
      Icon: CheckCircle2,
    },
    pendente: {
      label: t('meus_pedidos_status_pending'),
      cardClass: 'status-card pending',
      badgeClass: 'warning',
      Icon: Search,
    },
    rejeitado: {
      label: t('meus_pedidos_status_rejected'),
      cardClass: 'status-card rejected',
      badgeClass: 'danger',
      Icon: AlertTriangle,
    },
    validacao: {
      label: t('meus_pedidos_status_in_review'),
      cardClass: 'status-card in-review',
      badgeClass: 'warning',
      Icon: SearchCheck,
    },
  };

  const filters = useMemo(() => [
    { id: 'aprovado', label: t('meus_pedidos_status_approved') },
    { id: 'pendente', label: t('meus_pedidos_status_pending') },
    { id: 'rejeitado', label: t('meus_pedidos_status_rejected') },
  ], [t]);

  const filtersFromUrl = useMemo(() => {
    const param = searchParams.get('filters');
    if (param) {
      const ids = param.split(',').map((s) => s.trim()).filter(Boolean);
      const validIds = ids.filter((id) => filters.some((f) => f.id === id));
      return validIds.length > 0 ? validIds : filters.map((f) => f.id);
    }
    return filters.map((filter) => filter.id);
  }, [searchParams, filters]);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    let isMounted = true;

    const loadMyRequests = async () => {
      try {
        const data = await fetchMyRequests();
        if (isMounted && Array.isArray(data)) {
          setAllRequests(data);
          setStatusMessage('');
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setAllRequests([]);
          setStatusMessage(t('error_generic'));
          setIsLoading(false);
        }
      }
    };

    loadMyRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const submitted = allRequests.length;
    const inReview = allRequests.filter((item) => item.status === 'pendente').length;
    const rejected = allRequests.filter((item) => item.status === 'rejeitado').length;
    const approved = allRequests.filter((item) => item.status === 'aprovado').length;

    return { submitted, inReview, rejected, approved };
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    if (activeFilters.length === 0) {
      return [];
    }

    const parseRequestDate = (dateString) => {
      const [day, month, year] = String(dateString || '').split('/');
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
    };

    const getSortValue = (request) => {
      switch (sortConfig.key) {
        case 'badge':
          return String(request.badge || '').toLowerCase();
        case 'level':
          return String(request.level || '').toLowerCase();
        case 'status':
          return String(request.status || '').toLowerCase();
        case 'date':
        default:
          return parseRequestDate(request.date);
      }
    };

    return allRequests
      .filter((item) => activeFilters.includes(item.status))
      .sort((left, right) => {
        const leftValue = getSortValue(left);
        const rightValue = getSortValue(right);

        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return sortConfig.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
        }

        const compare = String(leftValue).localeCompare(String(rightValue), 'pt');
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
  }, [activeFilters, allRequests, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, page]);

  const onFilterSelect = (filterId) => {
    setActiveFilters((current) => {
      if (current.includes(filterId)) {
        return current.filter((item) => item !== filterId);
      }

      return [...current, filterId];
    });

    setPage(1);
  };

  const handleOpenRequestDetails = (request) => {
    navigate(`/consultor/meus-pedidos/${request.id}`, {
      state: { request },
    });
  };

  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === 'desc' ? 'asc' : 'desc' }
        : { key, direction: 'desc' }
    ));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUp size={12} aria-hidden="true" style={{ opacity: 0 }} />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={12} aria-hidden="true" />
      : <ArrowDown size={12} aria-hidden="true" />;
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
      <div className="page orders-page">
        <header className="page-header orders-header">
          <h1>{t('meus_pedidos_title')}</h1>
        </header>

        {statusMessage && (
          <div className="alert alert-warning py-2" role="status">
            {statusMessage}
          </div>
        )}

        <div className="status-grid orders-status-grid">
          <article className="status-card default submitted">
            <div className="status-card-icon">
              <Clock3 size={26} strokeWidth={2} />
            </div>
            <div className="status-card-content">
              <span>{t('meus_pedidos_all')}</span>
              <strong>{counts.submitted}</strong>
            </div>
          </article>

          <article className={"status-card warning " + statusConfig.validacao.cardClass.split(' ').pop()}>
            <div className="status-card-icon">
              <statusConfig.validacao.Icon size={26} strokeWidth={2} />
            </div>
            <div className="status-card-content">
              <span>{statusConfig.validacao.label}</span>
              <strong>{counts.inReview}</strong>
            </div>
          </article>

          <article className={"status-card danger " + statusConfig.rejeitado.cardClass.split(' ').pop()}>
            <div className="status-card-icon">
              <statusConfig.rejeitado.Icon size={26} strokeWidth={2} />
            </div>
            <div className="status-card-content">
              <span>{statusConfig.rejeitado.label}s</span>
              <strong>{counts.rejected}</strong>
            </div>
          </article>

          <article className={"status-card success " + statusConfig.aprovado.cardClass.split(' ').pop()}>
            <div className="status-card-icon">
              <statusConfig.aprovado.Icon size={26} strokeWidth={2} />
            </div>
            <div className="status-card-content">
              <span>{statusConfig.aprovado.label}s</span>
              <strong>{counts.approved}</strong>
            </div>
          </article>
        </div>

        <section className="shell orders-shell">
          <div className="orders-shell-header">
            <h2>{t('meus_pedidos_history_title')}</h2>
            <div className="orders-filter-row">
              <span>{t('meus_pedidos_filter_by')}</span>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`filter-chip orders-filter-chip ${activeFilters.includes(filter.id) ? 'is-active' : 'is-inactive'} ${filter.id}`}
                  onClick={() => onFilterSelect(filter.id)}
                  aria-pressed={activeFilters.includes(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table className="table orders-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('badge')}>
                    <span className="ag-orders-sort-head">{t('meus_pedidos_badge_requested')} {renderSortIcon('badge')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('level')}>
                    <span className="ag-orders-sort-head">{t('meus_pedidos_level')} {renderSortIcon('level')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('date')}>
                    <span className="ag-orders-sort-head">{t('meus_pedidos_request_date')} {renderSortIcon('date')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    <span className="ag-orders-sort-head">{t('meus_pedidos_request_status')} {renderSortIcon('status')}</span>
                  </th>
                  <th>{t('meus_pedidos_request_details')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="orders-empty-row">{t('no_items')}</td>
                  </tr>
                )}

                {pagedRequests.map((request) => {
                  const requestStatus = statusConfig[request.status] || statusConfig.pendente;

                  return (
                    <tr key={request.id}>
                      <td>{request.badge}</td>
                      <td>{request.level}</td>
                      <td>{request.date}</td>
                      <td>
                        <span className={"status-badge " + (requestStatus.badgeClass.split(' ').pop())}>
                          {requestStatus.label}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-outline orders-view-btn"
                          onClick={() => handleOpenRequestDetails(request)}
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default MeusPedidos;