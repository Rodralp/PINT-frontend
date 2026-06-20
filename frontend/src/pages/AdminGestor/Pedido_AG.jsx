import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  File,
  SearchCheck,
  SendHorizontal,
  Square,
  SquareCheckBig,
  Trophy,
} from 'lucide-react';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import '../../css/Shared/GestaoPedidosDetalhe.css';
import {
  fetchManagedRequestById,
  getManagedEvidenceDownloadUrl,
  submitManagedRequestDecision,
} from '../../services/requestManagementService';

const statusMeta = {
  validacao: {
    label: 'Em Validação',
    className: 'validacao',
    icon: SearchCheck,
  },
  rejeitado: {
    label: 'Rejeitado',
    className: 'rejeitado',
    icon: AlertTriangle,
  },
  aprovado: {
    label: 'Aprovado',
    className: 'aprovado',
    icon: CheckCircle2,
  },
};

const verdictOptions = [
  { id: 'aprovar', label: 'Aprovar' },
  { id: 'rejeitar', label: 'Rejeitar' },
  { id: 'devolver_consultor', label: 'Devolver ao consultor' },
];

function PedidoAG() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const [openRequirementId, setOpenRequirementId] = useState(null);
  const [selectedVerdict, setSelectedVerdict] = useState(null);
  const [comment, setComment] = useState('');
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingVerdict, setIsSubmittingVerdict] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRequest = async () => {
      try {
        const data = await fetchManagedRequestById('admin-gestor', pedidoId);
        if (!isMounted) {
          return;
        }

        setRequest(data || null);
        setStatusMessage('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setRequest(null);
        setStatusMessage(error?.message || 'Nao foi possivel carregar o pedido.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRequest();

    return () => {
      isMounted = false;
    };
  }, [pedidoId]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/admin-gestor/pedidos');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="ag-order-detail-page">
          <header className="ag-order-detail-header">
            <button type="button" className="ag-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>A carregar pedido...</h1>
            </div>
          </header>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="ag-order-detail-page">
          <header className="ag-order-detail-header">
            <button type="button" className="ag-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>Pedido não encontrado</h1>
              <p>{statusMessage || 'O pedido não existe ou foi removido.'}</p>
            </div>
          </header>
        </div>
      </Layout>
    );
  }

  const currentStatus = statusMeta[request.status] || statusMeta.validacao;
  const StatusIcon = currentStatus.icon;
  const requestMotives = Array.isArray(request.motives) ? request.motives : [];
  const showVerdictForm = Boolean(request.canReview);

  const toggleRequirement = (requirementId) => {
    setOpenRequirementId((current) => (current === requirementId ? null : requirementId));
  };

  const getRequirementFilesLabel = (item) => {
    const filesCount = Number(item?.files);

    if (Number.isInteger(filesCount) && filesCount > 1) {
      return `${String(filesCount).padStart(2, '0')} arquivos carregados`;
    }

    if (filesCount === 1) {
      return '01 arquivo carregado';
    }

    return 'XX arquivos carregados';
  };

  const handleSubmitVerdict = async () => {
    if (!selectedVerdict || isSubmittingVerdict) {
      return;
    }

    try {
      setIsSubmittingVerdict(true);
      const updated = await submitManagedRequestDecision('admin-gestor', pedidoId, {
        decision: selectedVerdict,
        comment,
      });
      setRequest(updated || request);
      setStatusMessage('Decisão submetida com sucesso.');
      setSelectedVerdict(null);
      setComment('');
    } catch (error) {
      setStatusMessage(error?.message || 'Nao foi possivel submeter a decisão.');
    } finally {
      setIsSubmittingVerdict(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    if (!attachment?.evidenceId) {
      setStatusMessage('Nao foi possivel identificar o ficheiro para download.');
      return;
    }

    try {
      const url = await getManagedEvidenceDownloadUrl('admin-gestor', pedidoId, attachment.evidenceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStatusMessage(error?.message || 'Nao foi possivel descarregar o ficheiro.');
    }
  };

  return (
    <Layout>
      <div className="ag-order-detail-page">
        <header className="ag-order-detail-header">
          <button type="button" className="ag-orders-back-btn" onClick={handleGoBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>Candidatura</h1>
          </div>
        </header>

        <section className="ag-order-hero-grid">
          <div className="ag-order-hero-main">
            <div className="ag-order-hero-card">
              <div className="ag-order-badge-frame">
                <BadgeImage
                  className="ag-order-badge-image"
                  src={request.badgeImage}
                  alt={request.badge}
                  frameSrc={request.badgeFrameImage}
                  levelKey={request.levelKey}
                  levelLabel={request.levelLabel}
                />
              </div>

              <div className="ag-order-hero-content">
                <h2>{request.badge}</h2>
                <p>{request.levelLabel}</p>

                <div className="ag-order-hero-meta">
                  <span>
                    <Clock3 size={16} />
                    <strong>Expira</strong>
                    {request.expiresAt || '12 Jan 2026'}
                  </span>
                  <span>
                    <Trophy size={16} />
                    {request.points} pontos
                  </span>
                  <span>
                    <FileText size={16} />
                    {request.evidence.length} requisitos
                  </span>
                </div>

                <div className={`ag-order-status-banner ${currentStatus.className}`}>
                  <StatusIcon size={18} />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
            </div>

            <p className="ag-order-breadcrumb">
              {request.area} {'>'} {request.path} {'>'} {request.badge} {'>'} {request.levelLabel.replace('Nível ', '')}
            </p>

            <section className="ag-order-requirements-card">
              <h3>Requisitos</h3>

              <div className="ag-order-requirements-list">
                {request.evidence.map((item) => (
                  <article
                    key={item.id}
                    className={`ag-order-requirement-item ${openRequirementId === item.id ? 'is-open' : ''}`}
                  >
                    <div className="ag-order-requirement-head">
                      <div>
                          <p>{item.title}</p>
                          <span>{getRequirementFilesLabel(item)}</span>
                        </div>
                      <button
                        type="button"
                        className="ag-order-requirement-view-btn"
                        aria-label={openRequirementId === item.id ? `Ocultar ${item.title}` : `Ver ${item.title}`}
                        aria-expanded={openRequirementId === item.id}
                        onClick={() => toggleRequirement(item.id)}
                      >
                        {openRequirementId === item.id ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {openRequirementId === item.id && (
                      <div className="ag-order-requirement-detail">
                        <div className="ag-order-requirement-detail-media">
                          <img
                            src={item.image || request.badgeImage}
                            alt={request.badge}
                            className="ag-order-requirement-detail-image"
                          />
                        </div>
                        <div className="ag-order-requirement-detail-content">
                          <p>{item.description}</p>

                          <ul className="ag-order-requirement-files-list">
                            {(item.attachments || []).map((attachment) => (
                              <li key={attachment.id}>
                                <div className="ag-order-file-main">
                                  <span className="ag-order-file-icon" aria-hidden="true">
                                    {attachment.type === 'pdf' ? <FileText size={18} /> : <File size={18} />}
                                  </span>
                                  <span>{attachment.label}</span>
                                </div>
                                <button
                                  type="button"
                                  className="ag-order-file-download-btn"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                >
                                  <Download size={16} />
                                  Download
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="ag-order-sidebar">
            <div className="ag-order-submission-card">
              <h3>Submissão por:</h3>
              <div className="ag-order-person-card">
                <img
                  src={request.submittedByAvatar}
                  alt={request.submittedBy}
                  className="ag-order-person-avatar"
                />
                <div>
                  <strong>{request.submittedBy}</strong>
                  <span>
                    <CalendarDays size={14} />
                    {request.submittedDate}
                  </span>
                </div>
              </div>
            </div>

            {showVerdictForm ? (
              <div className="ag-order-verdict-card">
                <h3>Veredito da Candidatura:</h3>

                {verdictOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`ag-order-verdict-option ${selectedVerdict === option.id ? 'active' : ''}`}
                    onClick={() => setSelectedVerdict(option.id)}
                  >
                    {selectedVerdict === option.id ? <SquareCheckBig size={18} /> : <Square size={18} />}
                    {option.label}
                  </button>
                ))}

                <textarea
                  className="ag-order-comment"
                  placeholder="Adicionar motivo para esta decisao..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />

                <button
                  type="button"
                  className="ag-order-submit-btn"
                  disabled={!selectedVerdict || isSubmittingVerdict}
                  onClick={handleSubmitVerdict}
                >
                  <SendHorizontal size={18} />
                  {isSubmittingVerdict ? 'A submeter...' : 'Submeter'}
                </button>

                {statusMessage && (
                  <p className="ag-order-feedback-note">{statusMessage}</p>
                )}

                {requestMotives.length > 0 && (
                  <div className="ag-order-motives">
                    <h4>Motivos registados</h4>
                    <ul className="ag-order-motives-list">
                      {requestMotives.map((item, index) => (
                        <li key={`${item.authorName}-${index}`}>
                          <strong>{item.authorName}</strong>
                          <span>{item.authorRole}</span>
                          <p>{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="ag-order-reviewed-card">
                <h3>Veredito por:</h3>
                <div className="ag-order-person-card compact">
                  <img
                    src={request.reviewerAvatar}
                    alt={request.reviewer}
                    className="ag-order-person-avatar"
                  />
                  <div>
                    <strong>{request.reviewer}</strong>
                    {request.reviewerRole && <span>{request.reviewerRole}</span>}
                    <span>
                      <CalendarDays size={14} />
                      {request.reviewerDate}
                    </span>
                  </div>
                </div>

                {request.notes && (
                  <p className="ag-order-review-note">
                    {statusMessage || request.notes}
                  </p>
                )}

                {requestMotives.length > 0 && (
                  <div className="ag-order-motives">
                    <h4>Motivos registados</h4>
                    <ul className="ag-order-motives-list">
                      {requestMotives.map((item, index) => (
                        <li key={`${item.authorName}-${index}`}>
                          <strong>{item.authorName}</strong>
                          <span>{item.authorRole}</span>
                          <p>{item.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </Layout>
  );
}

export default PedidoAG;
