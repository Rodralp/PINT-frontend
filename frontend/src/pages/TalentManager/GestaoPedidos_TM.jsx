import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Eye,
  SearchCheck,
  Users,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import BadgeImage from '../../components/BadgeImage';
import '../../css/TalentManager/GestaoPedidos_TM.css';
import { fetchManagedRequests } from '../../services/requestManagementService';

const ITEMS_PER_PAGE = 10;

const tableStatusStyles = {
  aprovado: 'approved',
  pendente: 'pending',
  rejeitado: 'rejected',
};

const statusConfig = {
  submetido: {
    icon: Clock3,
  },
  validacao: {
    icon: SearchCheck,
  },
  rejeitado: {
    icon: AlertTriangle,
  },
  aprovado: {
    icon: CheckCircle2,
  },
};

function GestaoPedidosTM() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getTableLabel = (tableStatus) => {
    if (tableStatus === 'aprovado') return t('pedidos_status_validated');
    if (tableStatus === 'rejeitado') return t('badge_status_rejected');
    return t('pedidos_status_pending');
  };

  const tableFilters = useMemo(() => [
    { id: 'aprovado', label: t('pedidos_status_validated') },
    { id: 'pendente', label: t('pedidos_status_pending') },
    { id: 'rejeitado', label: t('badge_status_rejected') },
  ], [t]);

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeFilters, setActiveFilters] = useState(['aprovado', 'pendente', 'rejeitado']);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        const data = await fetchManagedRequests('talent-manager');
        if (!isMounted) {
          return;
        }

        setRequests(Array.isArray(data) ? data : []);
        setStatusMessage('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatusMessage(error?.message || 'Nao foi possivel carregar os pedidos.');
        setRequests([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const summaryCounts = useMemo(() => ({
    submitted: requests.length,
    inReview: requests.filter((request) => request.status === 'validacao').length,
    rejected: requests.filter((request) => request.status === 'rejeitado').length,
    approved: requests.filter((request) => request.status === 'aprovado').length,
  }), [requests]);

  const summaryCards = useMemo(() => ([
    {
      id: 'submitted',
      tone: 'gray',
      label: t('pedidos_status_all'),
      value: summaryCounts.submitted,
      icon: statusConfig.submetido.icon,
    },
    {
      id: 'inReview',
      tone: 'amber',
      label: t('badge_status_in_review'),
      value: summaryCounts.inReview,
      icon: statusConfig.validacao.icon,
    },
    {
      id: 'rejected',
      tone: 'red',
      label: t('pedidos_status_rejected'),
      value: summaryCounts.rejected,
      icon: statusConfig.rejeitado.icon,
    },
    {
      id: 'approved',
      tone: 'green',
      label: t('pedidos_status_approved'),
      value: summaryCounts.approved,
      icon: statusConfig.aprovado.icon,
    },
  ]), [summaryCounts, t]);

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
        case 'consultant':
          return String(request.consultant || '').toLowerCase();
        case 'badge':
          return String(request.badge || '').toLowerCase();
        case 'level':
          return String(request.level || '').toLowerCase();
        case 'status':
          return getTableLabel(request.tableStatus).toLowerCase();
        case 'date':
        default:
          return parseRequestDate(request.date);
      }
    };

    return requests
      .filter((request) => activeFilters.includes(request.tableStatus))
      .sort((left, right) => {
        const leftValue = getSortValue(left);
        const rightValue = getSortValue(right);

        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return sortConfig.direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
        }

        const compare = String(leftValue).localeCompare(String(rightValue), 'pt');
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
  }, [activeFilters, requests, sortConfig, getTableLabel]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const toggleFilter = (filterId) => {
    setActiveFilters((current) => {
      if (current.includes(filterId)) {
        return current.filter((item) => item !== filterId);
      }

      return [...current, filterId];
    });

    setPage(1);
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
      <div className="page">
        <header className="page-header">
          <div>
            <h1>{t('pedidos_title')}</h1>
          </div>
        </header>

        <section className="ag-orders-summary-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.id} className={`ag-request-card ${card.tone}`}>
                <span className="ag-request-card-icon">
                  <Icon size={26} strokeWidth={2} />
                </span>
                <div className="ag-request-card-content">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="shell">
          {statusMessage && <p>{statusMessage}</p>}

          <div className="ag-orders-board-header">
            <div>
              <h2>{t('pedidos_subtitle')}</h2>
              <div className="ag-orders-filter-inline">
                <p>{t('pedidos_filter_by')}</p>
                <div className="ag-orders-filter-row">
                  {tableFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`ag-filter-chip ${activeFilters.includes(filter.id) ? 'active' : 'inactive'} ${filter.id}`}
                      onClick={() => toggleFilter(filter.id)}
                      aria-pressed={activeFilters.includes(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table ag-orders-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('consultant')}>
                    <span className="ag-orders-sort-head">{t('pedidos_th_consultant')} {renderSortIcon('consultant')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('badge')}>
                    <span className="ag-orders-sort-head">{t('pedidos_th_badge')} {renderSortIcon('badge')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('level')}>
                    <span className="ag-orders-sort-head">{t('pedidos_th_level')} {renderSortIcon('level')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('date')}>
                    <span className="ag-orders-sort-head">{t('pedidos_th_date')} {renderSortIcon('date')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    <span className="ag-orders-sort-head">{t('pedidos_th_status')} {renderSortIcon('status')}</span>
                  </th>
                  <th>{t('pedidos_th_details')}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state ag-orders-empty-row">
                      {t('pedidos_no_results')}
                    </td>
                  </tr>
                )}

                {pagedRequests.map((request) => {
                  const statusClass = tableStatusStyles[request.tableStatus] || 'pending';

                  return (
                    <tr key={request.id}>
                      <td>
                        <div className="ag-consultant-cell">
                          <Users size={16} />
                          <span>{request.consultant}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ag-orders-badge-cell">
                          <BadgeImage
                            src={request.badgeImage}
                            alt={request.badge}
                            className="ag-orders-badge-thumb"
                            levelKey={request.levelKey}
                            typeId={request.typeId}
                            levelLabel={request.levelLabel}
                            frameSrc={false}
                          />
                          <span>{request.badge}</span>
                        </div>
                      </td>
                      <td>{request.level}</td>
                      <td>{request.date}</td>
                      <td>
                        <span className={`ag-status-pill ${statusClass}`}>
                          {getTableLabel(request.tableStatus)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ag-view-btn"
                          onClick={() => navigate(`/talent-manager/pedidos/${request.id}`)}
                        >
                           <Eye size={14} />
                           {t('pedidos_btn_view')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={safePage} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default GestaoPedidosTM;
