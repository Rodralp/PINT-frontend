import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  SearchCheck,
  Search,
} from 'lucide-react';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import { fetchMyRequests } from '../../services/consultorService';
import '../../css/Consultor/MeusPedidos.css';

const statusConfig = {
  aprovado: {
    label: 'Aprovado',
    cardClass: 'status-card approved',
    badgeClass: 'request-status approved',
    Icon: CheckCircle2,
  },
  pendente: {
    label: 'Pendente',
    cardClass: 'status-card pending',
    badgeClass: 'request-status pending',
    Icon: Search,
  },
  rejeitado: {
    label: 'Rejeitado',
    cardClass: 'status-card rejected',
    badgeClass: 'request-status rejected',
    Icon: AlertTriangle,
  },
  validacao: {
    label: 'Em Validação',
    cardClass: 'status-card in-review',
    Icon: SearchCheck,
  },
};

const filters = [
  { id: 'aprovado', label: 'Aprovado' },
  { id: 'pendente', label: 'Pendente' },
  { id: 'rejeitado', label: 'Rejeitado' },
];

const ITEMS_PER_PAGE = 10;

function MeusPedidos() {
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState([]);
  const [activeFilters, setActiveFilters] = useState(filters.map((filter) => filter.id));
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadMyRequests = async () => {
      try {
        const data = await fetchMyRequests();
        if (isMounted && Array.isArray(data)) {
          setAllRequests(data);
        }
      } catch {
        if (isMounted) {
          setAllRequests([]);
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

    return allRequests.filter((item) => activeFilters.includes(item.status));
  }, [activeFilters, allRequests]);

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

  return (
    <Layout>
      <div className="page orders-page">
        <header className="page-header orders-header">
          <h1>Meus Pedidos</h1>
        </header>

        <div className="status-grid orders-status-grid">
          <article className="status-card default submitted">
            <div className="status-card-icon">
              <Clock3 size={26} strokeWidth={2} />
            </div>
            <div className="status-card-content">
              <span>Todos</span>
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
            <h2>Histórico de Candidaturas de Badges</h2>
            <div className="orders-filter-row">
              <span>Filtrar por:</span>
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
                  <th>Badge Pedida</th>
                  <th>Nível</th>
                  <th>Data do Pedido</th>
                  <th>Estado do Pedido</th>
                  <th>Detalhes do Pedido</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="orders-empty-row">Sem pedidos para os filtros escolhidos.</td>
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

export default MeusPedidos;