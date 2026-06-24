import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  SearchCheck,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../css/ServiceLineLeader/GestaoPedidos_SLL.css';
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

const getTableLabel = (tableStatus) => {
  if (tableStatus === 'aprovado') {
    return 'Aprovado';
  }

  if (tableStatus === 'rejeitado') {
    return 'Rejeitado';
  }

  return 'Pendente';
};

const statusConfig = {
  submetido: {
    label: 'Todos',
    tone: 'gray',
    icon: Clock3,
  },
  validacao: {
    label: 'Em Validação',
    tone: 'amber',
    icon: SearchCheck,
  },
  rejeitado: {
    label: 'Rejeitados',
    tone: 'red',
    icon: AlertTriangle,
  },
  aprovado: {
    label: 'Aprovados',
    tone: 'green',
    icon: CheckCircle2,
  },
};

function GestaoPedidosSLL() {
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
        const data = await fetchManagedRequests('service-line-leader');
        if (!isMounted) {
          return;
        }

        setRequests(Array.isArray(data) ? data : []);
        setStatusMessage('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRequests([]);
        setStatusMessage(error?.message || 'Nao foi possivel carregar os pedidos.');
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

  const summaryCounts = useMemo(
    () => ({
      submitted: requests.length,
      inReview: requests.filter((request) => request.status === 'validacao').length,
      rejected: requests.filter((request) => request.status === 'rejeitado').length,
      approved: requests.filter((request) => request.status === 'aprovado').length,
    }),
    [requests],
  );

  const summaryCards = useMemo(
    () => [
      { id: 'submitted', label: statusConfig.submetido.label, tone: statusConfig.submetido.tone, icon: statusConfig.submetido.icon, value: summaryCounts.submitted },
      { id: 'inReview', label: statusConfig.validacao.label, tone: statusConfig.validacao.tone, icon: statusConfig.validacao.icon, value: summaryCounts.inReview },
      { id: 'rejected', label: statusConfig.rejeitado.label, tone: statusConfig.rejeitado.tone, icon: statusConfig.rejeitado.icon, value: summaryCounts.rejected },
      { id: 'approved', label: statusConfig.aprovado.label, tone: statusConfig.aprovado.tone, icon: statusConfig.aprovado.icon, value: summaryCounts.approved },
    ],
    [summaryCounts],
  );

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
  }, [activeFilters, requests, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);

  const pagedRequests = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, safePage]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/service-line-leader/dashboard');
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

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message="A carregar pedidos..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page sll-orders-page">
        <header className="page-header sll-orders-header">
          <button type="button" className="sll-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>Gestão de Pedidos</h1>
          </div>
        </header>

        <section className="sll-orders-summary-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.id} className={`sll-request-card ${card.tone}`}>
                <span className="sll-request-card-icon">
                  <Icon size={26} strokeWidth={2} />
                </span>
                <div className="sll-request-card-content">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="shell sll-orders-main-card">
          {statusMessage && <p>{statusMessage}</p>}

          <div className="sll-orders-board-header">
            <div>
              <h2>Pedidos de Todos os Consultores</h2>
                <div className="sll-orders-filter-inline">
                  <p>Filtrar por:</p>
                  <div className="sll-orders-filter-row">
                    {tableFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`sll-filter-chip ${activeFilters.includes(filter.id) ? 'active' : 'inactive'} ${filter.id}`}
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

          <div className="table-wrap sll-orders-table-wrap">
            <table className="table sll-orders-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('consultant')}>
                    <span className="sll-orders-sort-head">Nome do Consultor {renderSortIcon('consultant')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('badge')}>
                    <span className="sll-orders-sort-head">Badge Pedida {renderSortIcon('badge')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('level')}>
                    <span className="sll-orders-sort-head">Nível {renderSortIcon('level')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('date')}>
                    <span className="sll-orders-sort-head">Data do Pedido {renderSortIcon('date')}</span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    <span className="sll-orders-sort-head">Estado do Pedido {renderSortIcon('status')}</span>
                  </th>
                  <th>Detalhes do Pedido</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state sll-orders-empty-row">
                      Sem pedidos para os filtros escolhidos.
                    </td>
                  </tr>
                )}

                {pagedRequests.map((request) => {
                  const statusClass = tableStatusStyles[request.tableStatus] || 'pending';

                  return (
                    <tr key={request.id}>
                      <td>{request.consultant}</td>
                      <td>{request.badge}</td>
                      <td>{request.level}</td>
                      <td>{request.date}</td>
                      <td>
                        <span className={`sll-status-pill ${statusClass}`}>
                          {getTableLabel(request.tableStatus)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sll-view-btn"
                          onClick={() => navigate(`/service-line-leader/pedidos/${request.id}`)}
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

          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </section>
      </div>
    </Layout>
  );
}

export default GestaoPedidosSLL;
