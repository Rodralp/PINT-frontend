import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  SearchCheck,
  Users,
} from 'lucide-react';
import Layout from '../../components/Layout';
import '../../css/TalentManager/GestaoPedidos_TM.css';
import { fetchManagedRequests } from '../../services/requestManagementService';

const ITEMS_PER_PAGE = 10;

const tableFilters = [
  { id: 'aprovado', label: 'Aprovado' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'rejeitado', label: 'Rejeitado' },
];

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
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeFilters, setActiveFilters] = useState(tableFilters.map((filter) => filter.id));
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
      tone: 'blue',
      label: 'Todos',
      value: summaryCounts.submitted,
      icon: statusConfig.submetido.icon,
    },
    {
      id: 'inReview',
      tone: 'amber',
      label: 'Em Validação',
      value: summaryCounts.inReview,
      icon: statusConfig.validacao.icon,
    },
    {
      id: 'rejected',
      tone: 'red',
      label: 'Rejeitados',
      value: summaryCounts.rejected,
      icon: statusConfig.rejeitado.icon,
    },
    {
      id: 'approved',
      tone: 'green',
      label: 'Aprovados',
      value: summaryCounts.approved,
      icon: statusConfig.aprovado.icon,
    },
  ]), [summaryCounts]);

  const filteredRequests = useMemo(() => {
    if (activeFilters.length === 0) {
      return [];
    }

    const parseRequestDate = (dateString) => {
      const [day, month, year] = String(dateString || '').split('/');
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
    };

    const getStatusLabel = (tableStatus) => {
      if (tableStatus === 'aprovado') return 'Aprovado';
      if (tableStatus === 'rejeitado') return 'Rejeitado';
      return 'Pendente';
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
          return getStatusLabel(request.tableStatus).toLowerCase();
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
  }, [activeFilters, requests, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

  const pagedRequests = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, page]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/talent-manager/dashboard');
  };

  const toggleFilter = (filterId) => {
    setActiveFilters((current) => {
      if (current.includes(filterId)) {
        return current.filter((item) => item !== filterId);
      }

      return [...current, filterId];
    });

    setPage(1);
  };

  const previousPage = () => setPage((current) => Math.max(1, current - 1));
  const nextPage = () => setPage((current) => Math.min(totalPages, current + 1));
  const toggleSort = (key) => {
    setSortConfig((current) => (
      current.key === key
        ? { key, direction: current.direction === 'desc' ? 'asc' : 'desc' }
        : { key, direction: 'desc' }
    ));
  };
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={12} aria-hidden="true" />
      : <ArrowDown size={12} aria-hidden="true" />;
  };

  return (
    <Layout>
      <div className="tm-orders-page">
        <header className="tm-orders-header">
          <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>Gestão de Pedidos</h1>
            <p>Visão consolidada dos pedidos de badge submetidos pelos consultores.</p>
          </div>
        </header>

        <section className="tm-orders-summary-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.id} className={`tm-request-card ${card.tone}`}>
                <span className="tm-request-card-icon">
                  <Icon size={26} strokeWidth={2} />
                </span>
                <div className="tm-request-card-content">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="tm-orders-board">
          <div className="tm-orders-main-card">
            {isLoading && <p>A carregar pedidos...</p>}
            {!isLoading && statusMessage && <p>{statusMessage}</p>}

            <div className="tm-orders-board-header">
              <div>
                <h2>Pedidos de Todos os Consultores</h2>
                <div className="tm-orders-filter-inline">
                  <p>Filtrar por:</p>
                  <div className="tm-orders-filter-row">
                    {tableFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`tm-filter-chip ${activeFilters.includes(filter.id) ? 'active' : 'inactive'} ${filter.id}`}
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

            <div className="tm-orders-table-wrap">
              <table className="tm-orders-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggleSort('consultant')}>
                      <span className="tm-orders-sort-head">Nome do Consultor {renderSortIcon('consultant')}</span>
                    </th>
                    <th className="sortable" onClick={() => toggleSort('badge')}>
                      <span className="tm-orders-sort-head">Badge Pedida {renderSortIcon('badge')}</span>
                    </th>
                    <th className="sortable" onClick={() => toggleSort('level')}>
                      <span className="tm-orders-sort-head">Nível {renderSortIcon('level')}</span>
                    </th>
                    <th className="sortable" onClick={() => toggleSort('date')}>
                      <span className="tm-orders-sort-head">Data do Pedido {renderSortIcon('date')}</span>
                    </th>
                    <th className="sortable" onClick={() => toggleSort('status')}>
                      <span className="tm-orders-sort-head">Estado do Pedido {renderSortIcon('status')}</span>
                    </th>
                    <th>Detalhes do Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="tm-orders-empty-row">
                        Sem pedidos para os filtros escolhidos.
                      </td>
                    </tr>
                  )}

                  {pagedRequests.map((request) => {
                    const statusClass = tableStatusStyles[request.tableStatus] || 'pending';
                    const badgeLabel = request.tableStatus === 'aprovado'
                      ? 'Aprovado'
                      : request.tableStatus === 'rejeitado'
                        ? 'Rejeitado'
                        : 'Pendente';

                    return (
                      <tr key={request.id}>
                        <td>
                          <div className="tm-consultant-cell">
                            <Users size={16} />
                            <span>{request.consultant}</span>
                          </div>
                        </td>
                        <td>{request.badge}</td>
                        <td>{request.level}</td>
                        <td>{request.date}</td>
                        <td>
                          <span className={`tm-status-pill ${statusClass}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="tm-view-btn"
                            onClick={() => navigate(`/talent-manager/pedidos/${request.id}`)}
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="tm-orders-pagination" role="navigation" aria-label="Paginação de pedidos">
              <button type="button" className="tm-page-btn ghost" onClick={previousPage} disabled={page === 1}>
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`tm-page-btn ${pageNumber === page ? 'active' : ''}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button type="button" className="tm-page-btn ghost" onClick={nextPage} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div />
        </section>
      </div>
    </Layout>
  );
}

export default GestaoPedidosTM;
