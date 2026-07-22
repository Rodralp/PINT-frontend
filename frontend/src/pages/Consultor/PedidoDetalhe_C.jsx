import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Users,
} from 'lucide-react';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchPedidoDetail } from '../../services/consultorService';
import '../../css/Shared/GestaoPedidosDetalhe.css';
import '../../css/TalentManager/GestaoPedidos_TM.css';

const statusMeta = (t) => ({
  pendente: {
    label: t('pedido_detalhe_c_status_in_review'),
    className: 'validacao',
    Icon: Clock3,
  },
  aprovado: {
    label: t('pedido_detalhe_c_status_approved'),
    className: 'enviado',
    Icon: CheckCircle2,
  },
  rejeitado: {
    label: t('pedido_detalhe_c_status_rejected'),
    className: 'rejeitado',
    Icon: AlertTriangle,
  },
});

function PedidoDetalheC() {
  const { t } = useTranslation();
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
        <LoadingSpinner fullPage message={t('request_detail_loading')} />
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout>
        <div className="tm-order-detail-page">
          <header className="tm-order-detail-header">
            <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label={t('back')}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>{t('request_detail_not_found')}</h1>
              <p>{t('request_detail_not_found_msg')}</p>
            </div>
          </header>
        </div>
      </Layout>
    );
  }

  const currentStatus = statusMeta(t)[request.status] || statusMeta(t).pendente;
  const StatusIcon = currentStatus.Icon;
  const showReviewer = ['aprovado', 'rejeitado'].includes(request.status) && Boolean(request.reviewerName);

  const toggleRequirement = (requirementId) => {
    setOpenRequirementId((current) => (current === requirementId ? null : requirementId));
  };

  return (
    <Layout>
      <div className="tm-order-detail-page">
        <header className="tm-order-detail-header">
          <button type="button" className="tm-orders-back-btn" onClick={handleGoBack} aria-label={t('back')}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>{t('pedido_detalhe_c_title')}</h1>
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
                  levelKey={request.levelKey}
                  levelLabel={request.levelLabel}
                />
              </div>

              <div className="tm-order-hero-content">
                <h2>{request.badge}</h2>
                <p>{request.levelLabel}</p>

                <div className="tm-order-hero-meta">
                  <span>
                    <Clock3 size={16} />
                    <strong>{t('request_detail_expires')}</strong>
                    {request.expiresAt}
                  </span>
                  <span>
                    <Users size={16} />
                    {request.points} {t('points')}
                  </span>
                  <span>
                    <FileText size={16} />
                    {request.requirements?.length || 0} {t('request_detail_requirements')}
                  </span>
                </div>

                {request.badgeDescription && (
                  <p style={{ marginTop: '12px', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                    {request.badgeDescription}
                  </p>
                )}

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
              <h3>{t('request_detail_requirements_title')}</h3>

              <div className="tm-order-requirements-list">
                {(request.requirements || []).map((item) => (
                  <article key={item.id} className={`tm-order-requirement-item ${openRequirementId === item.id ? 'is-open' : ''}`}>
                    <div className="tm-order-requirement-head">
                      <div>
                        <p>{item.title}</p>
                        <span>{String(item.files || 0).padStart(2, '0')} {t('request_detail_submitted_files')}</span>
                      </div>
                      <button
                        type="button"
                        className="tm-order-requirement-view-btn"
                        aria-label={openRequirementId === item.id ? `${t('request_detail_hide')} ${item.title}` : `${t('request_detail_show')} ${item.title}`}
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
                            levelKey={request.levelKey}
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
              <h3>{t('request_detail_submitted_by')}</h3>
              <div className="tm-order-person-card">
                <img
                  src={request.submittedByAvatar || '/avatars/default-avatar.svg'}
                  alt={request.submittedBy || 'Utilizador'}
                  className="tm-order-person-avatar"
                  onError={(event) => { event.currentTarget.src = '/avatars/default-avatar.svg'; }}
                />
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
                <h3>{t('request_detail_verdict_by')}</h3>
                <div className="tm-order-person-card compact">
                  <img
                    src={request.reviewerAvatar || '/avatars/default-avatar.svg'}
                    alt={request.reviewerName || '?'}
                    className="tm-order-person-avatar evaluated"
                    onError={(event) => { event.currentTarget.src = '/avatars/default-avatar.svg'; }}
                  />
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
                <h3>{t('request_detail_verdict')}</h3>
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
