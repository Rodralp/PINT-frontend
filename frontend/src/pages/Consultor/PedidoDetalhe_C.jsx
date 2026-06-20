import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Users,
} from 'lucide-react';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import { fetchPedidoDetail } from '../../services/consultorService';
import '../../css/Shared/GestaoPedidosDetalhe.css';

const statusMeta = {
  pendente: {
    label: 'Em Validação',
    className: 'validacao',
    Icon: Clock3,
  },
  aprovado: {
    label: 'Aprovado',
    className: 'enviado',
    Icon: CheckCircle2,
  },
  rejeitado: {
    label: 'Rejeitado',
    className: 'rejeitado',
    Icon: AlertTriangle,
  },
};

function PedidoDetalheC() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [openRequirementId, setOpenRequirementId] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      try {
        const data = await fetchPedidoDetail(pedidoId);
        if (isMounted) {
          setRequest(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [pedidoId]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/consultor/meus-pedidos');
  };

  if (loading) {
    return (
      <Layout>
        <div className="tm-order-detail-page">
          <header className="tm-order-detail-header">
            <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>Candidatura</h1>
            </div>
          </header>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <div className="tm-order-detail-page">
          <header className="tm-order-detail-header">
            <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>Pedido não encontrado</h1>
              <p>O pedido não existe ou foi removido.</p>
            </div>
          </header>
        </div>
      </Layout>
    );
  }

  const currentStatus = statusMeta[request.status] || statusMeta.pendente;
  const StatusIcon = currentStatus.Icon;
  const showReviewer = ['aprovado', 'rejeitado'].includes(request.status) && Boolean(request.reviewerName);

  const toggleRequirement = (requirementId) => {
    setOpenRequirementId((current) => (current === requirementId ? null : requirementId));
  };

  return (
    <Layout>
      <div className="tm-order-detail-page">
        <header className="tm-order-detail-header">
          <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>Candidatura</h1>
          </div>
        </header>

        <section className="tm-order-hero-grid">
          <div className="tm-order-hero-main">
            <div className="tm-order-hero-card">
              <div className="tm-order-badge-frame">
                <BadgeImage
                  src={request.badgeImage}
                  alt={request.badge}
                  className="tm-order-badge-image"
                  levelLabel={request.levelLabel}
                />
              </div>

              <div className="tm-order-hero-content">
                <h2>{request.badge}</h2>
                <p>{request.levelLabel}</p>

                <div className="tm-order-hero-meta">
                  <span>
                    <Clock3 size={16} />
                    <strong>Expira</strong>
                    {request.expiresAt}
                  </span>
                  <span>
                    <Users size={16} />
                    {request.points} pontos
                  </span>
                  <span>
                    <FileText size={16} />
                    {request.requirements?.length || 0} requisitos
                  </span>
                </div>

                <div className={`tm-order-status-banner ${currentStatus.className}`}>
                  <StatusIcon size={18} />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
            </div>

            <p className="tm-order-breadcrumb">
              {request.area} {'>'} {request.path} {'>'} {request.badge} {'>'} {(request.levelLabel || '').replace('Nível ', '')}
            </p>

            <section className="tm-order-requirements-card">
              <h3>Requisitos</h3>

              <div className="tm-order-requirements-list">
                {(request.requirements || []).map((item) => (
                  <article key={item.id} className={`tm-order-requirement-item ${openRequirementId === item.id ? 'is-open' : ''}`}>
                    <div className="tm-order-requirement-head">
                      <div>
                        <p>{item.title}</p>
                        <span>{String(item.files || 0).padStart(2, '0')} Arquivos Submetidos</span>
                      </div>
                      <button
                        type="button"
                        className="tm-order-requirement-view-btn"
                        aria-label={openRequirementId === item.id ? `Ocultar ${item.title}` : `Ver ${item.title}`}
                        aria-expanded={openRequirementId === item.id}
                        onClick={() => toggleRequirement(item.id)}
                      >
                        {openRequirementId === item.id ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {openRequirementId === item.id && (
                      <div className="tm-order-requirement-detail">
                        <div className="tm-order-requirement-detail-media">
                          <BadgeImage
                            src={item.image || request.badgeImage}
                            alt={request.badge}
                            className="tm-order-requirement-detail-image"
                            levelLabel={request.levelLabel}
                          />
                        </div>
                        <p>
                          {item.description ||
                            'Texto de exemplo que resume o requisito selecionado do subnível, do nível, da service line, do learning path.'}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="tm-order-sidebar">
            <div className="tm-order-submission-card">
              <h3>Submissão por:</h3>
              <div className="tm-order-person-card">
                <div className="tm-order-person-avatar">{String(request.submittedBy || 'U').slice(0, 1)}</div>
                <div>
                  <strong>{request.submittedBy || 'Utilizador'}</strong>
                  <span>
                    <CalendarDays size={14} />
                    {request.submissionDate}
                  </span>
                </div>
              </div>
            </div>

            {showReviewer ? (
              <div className="tm-order-evaluated-card">
                <h3>Avaliado por:</h3>
                <div className="tm-order-person-card compact">
                  <div className="tm-order-person-avatar evaluated">{(request.reviewerName || '?').slice(0, 1)}</div>
                  <div>
                    <strong>{request.reviewerName}</strong>
                    <span>
                      <CalendarDays size={14} />
                      {request.reviewerDate}
                    </span>
                  </div>
                </div>
                <p>{request.reviewerNote}</p>
              </div>
            ) : (
              <div className="tm-order-evaluated-card">
                <h3>Estado da Candidatura:</h3>
                <p>{request.reviewerNote || 'A aguardar validação.'}</p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </Layout>
  );
}

export default PedidoDetalheC;
