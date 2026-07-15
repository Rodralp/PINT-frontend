import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import LoadingSpinner from '../../components/LoadingSpinner';
import BadgeImage from '../../components/BadgeImage';
import '../../css/Shared/GestaoPedidosDetalhe.css';
import {
  fetchManagedRequestById,
  getManagedEvidenceDownloadUrl,
  submitManagedRequestDecision,
} from '../../services/requestManagementService';

function PedidoAG() {
  const { t } = useTranslation();
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const statusMeta = {
    validacao: {
      label: t('badge_status_in_review'),
      className: 'validacao',
      icon: SearchCheck,
    },
    rejeitado: {
      label: t('badge_status_rejected'),
      className: 'rejeitado',
      icon: AlertTriangle,
    },
    aprovado: {
      label: t('badge_status_validated'),
      className: 'aprovado',
      icon: CheckCircle2,
    },
  };

  const verdictOptions = [
    { id: 'aprovar', label: t('request_detail_verdict_options_ag') },
    { id: 'rejeitar', label: t('request_detail_verdict_reject') },
    { id: 'devolver_consultor', label: t('request_detail_verdict_return') },
  ];
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
        setStatusMessage(error?.message || t('request_detail_error_load'));
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
        <LoadingSpinner fullPage message={t('request_detail_loading')} />
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="page ag-order-detail-page">
          <header className="page-header ag-order-detail-header">
            <button type="button" className="ag-orders-back-btn" onClick={handleGoBack} aria-label={t('back')}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1>{t('request_detail_not_found')}</h1>
              <p>{statusMessage || t('request_detail_not_found_msg')}</p>
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
      return t('request_detail_files_loaded', { count: filesCount });
    }

    if (filesCount === 1) {
      return t('request_detail_files_loaded', { count: 1 });
    }

    return t('request_detail_files_loaded', { count: 0 });
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
      setStatusMessage(t('request_detail_success'));
      setSelectedVerdict(null);
      setComment('');
    } catch (error) {
      setStatusMessage(error?.message || t('request_detail_error_submit'));
    } finally {
      setIsSubmittingVerdict(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    if (!attachment?.evidenceId) {
      setStatusMessage(t('request_detail_error_file_id'));
      return;
    }

    try {
      const url = await getManagedEvidenceDownloadUrl('admin-gestor', pedidoId, attachment.evidenceId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStatusMessage(error?.message || t('request_detail_error_download'));
    }
  };

  return (
    <Layout>
      <div className="page ag-order-detail-page">
        <header className="page-header ag-order-detail-header">
          <button type="button" className="ag-orders-back-btn" onClick={handleGoBack} aria-label={t('back')}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>{t('request_detail_title')}</h1>
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
                    <strong>{t('request_detail_expires')}</strong>
                    {request.expiresAt || '12 Jan 2026'}
                  </span>
                  <span>
                    <Trophy size={16} />
                    {request.points} {t('points')}
                  </span>
                  <span>
                    <FileText size={16} />
                    {request.evidence.length} {t('request_detail_requirements')}
                  </span>
                </div>

                {request.badgeDescription && (
                  <p style={{ marginTop: '12px', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                    {request.badgeDescription}
                  </p>
                )}

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
              <h3>{t('request_detail_requirements_title')}</h3>

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
                        aria-label={openRequirementId === item.id ? `${t('request_detail_hide')} ${item.title}` : `${t('request_detail_show')} ${item.title}`}
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
                                  {t('request_detail_download')}
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
              <h3>{t('request_detail_submitted_by')}</h3>
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
                <h3>{t('request_detail_verdict')}</h3>

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
                  placeholder={t('request_detail_add_reason')}
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
                  {isSubmittingVerdict ? t('request_detail_submitting') : t('request_detail_submit')}
                </button>

                {statusMessage && (
                  <p className="ag-order-feedback-note">{statusMessage}</p>
                )}

                {requestMotives.length > 0 && (
                  <div className="ag-order-motives">
                    <h4>{t('request_detail_registered_reasons')}</h4>
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
                <h3>{t('request_detail_verdict_by')}</h3>
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
                    <h4>{t('request_detail_registered_reasons')}</h4>
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
