import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Link,
  SearchCheck,
  SendHorizontal,
  TimerReset,
  Trophy,
  Share2,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import LinkedInShareButton from '../../components/LinkedInShareButton';
import {
  fetchBadgeRequirements,
  fetchMyBadges,
  requestBadgeAcquisition,
  uploadEvidence,
} from '../../services/consultorService';
import '../../css/Consultor/BadgeDetalhe.css';

const defaultBadgeDetails = {
  id: 'badge-default',
  area: '',
  serviceLineName: '',
  learningPathName: '',
  levelKey: '',
  points: 0,
  badgeImage: '',
  date: '',
};

const normalizeBadgeStatus = (badge) => {
  const stateId = String(badge?.stateId || '').trim().toLowerCase();
  if (stateId === 'aprovado') {
    return 'obtido';
  }

  if (stateId === 'pendente-tm' || stateId === 'pendente-sll') {
    return 'pendente';
  }

  if (stateId === 'candidatura_em_progresso') {
    return 'candidatura_em_progresso';
  }

  if (stateId === 'rejeitado') {
    return 'evidencias_insuficientes';
  }

  const rawStatus = String(badge?.status || '').trim().toLowerCase();
  if (rawStatus === 'pendente-tm' || rawStatus === 'pendente-sll') {
    return 'pendente';
  }
  if (rawStatus === 'candidatura_em_progresso') {
    return 'candidatura_em_progresso';
  }
  if (rawStatus === 'rejeitado') {
    return 'evidencias_insuficientes';
  }
  if (rawStatus === 'aprovado') {
    return 'obtido';
  }

  return 'visualizar';
};

const getRequirementPrefixByLevel = (levelKey) => {
  const normalized = String(levelKey || '').toLowerCase();
  if (normalized.includes('junior')) return 'A';
  if (normalized.includes('intermediate')) return 'B';
  if (normalized.includes('senior')) return 'C';
  if (normalized.includes('specialist')) return 'D';
  return 'E';
};

const resolveBadgeDbId = (routeBadgeId, badgeState) => {
  const direct = Number(badgeState?.badgeDbId);
  if (Number.isInteger(direct) && direct > 0) {
    return direct;
  }

  const fromRoute = String(routeBadgeId || '').trim();
  if (fromRoute) {
    const numericRoute = Number(fromRoute);
    if (Number.isInteger(numericRoute) && numericRoute > 0) {
      return numericRoute;
    }

    const match = fromRoute.match(/^badge-(\d+)$/i);
    if (match) {
      const numericMatch = Number(match[1]);
      if (Number.isInteger(numericMatch) && numericMatch > 0) {
        return numericMatch;
      }
    }
  }

  const fromStateId = String(badgeState?.id || '').trim();
  if (fromStateId) {
    const numericStateId = Number(fromStateId);
    if (Number.isInteger(numericStateId) && numericStateId > 0) {
      return numericStateId;
    }

    const match = fromStateId.match(/^badge-(\d+)$/i);
    if (match) {
      const numericMatch = Number(match[1]);
      if (Number.isInteger(numericMatch) && numericMatch > 0) {
        return numericMatch;
      }
    }
  }

  return null;
};

function BadgeDetalhe() {
  const { badgeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const statusConfig = useMemo(() => ({
    candidatura_em_progresso: { label: t('badge_status_in_progress'), className: 'is-progress', Icon: TimerReset },
    pendente: { label: t('badge_status_in_review'), className: 'is-validation', Icon: SearchCheck },
    evidencias_insuficientes: { label: t('badge_status_insufficient_evidence'), className: 'is-rejected', Icon: AlertTriangle },
    obtido: { label: t('badge_status_obtained'), className: 'is-obtained', Icon: CheckCircle2 },
  }), [t]);
  const [openRequirementId, setOpenRequirementId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [filesByRequirement, setFilesByRequirement] = useState({});
  const [currentRequestId, setCurrentRequestId] = useState(() => Number(location.state?.badge?.requestId) || null);
  const [dynamicRequirements, setDynamicRequirements] = useState(null);

  const [badge, setBadge] = useState(() => {
    if (location.state?.badge) {
      return location.state.badge;
    }

    return defaultBadgeDetails;
  });
  const [badgeStatus, setBadgeStatus] = useState(() => normalizeBadgeStatus(badge));
  const hasBadgeId = Number.isInteger(Number(badge?.badgeDbId)) && Number(badge.badgeDbId) > 0;
  const isSpecialBadge = Boolean(badge?.isSpecial) || badge?.typeId === 'special' || !badge?.levelKey;
  const levelLabel = isSpecialBadge ? t('special') : t(badge?.levelKey || '');
  const resolvedBadgeDbId = useMemo(
    () => resolveBadgeDbId(badgeId, badge),
    [badgeId, badge],
  );
  const badgeTitle = badge.name || badge.area || t('badge');

  useEffect(() => {
    if (location.state?.badge) {
      setBadge(location.state.badge);
      return;
    }

    setBadge(defaultBadgeDetails);
  }, [location.state?.badge, badgeId]);

  useEffect(() => {
    setDynamicRequirements(null);
  }, [badgeId, badge?.badgeDbId]);

  useEffect(() => {
    let isMounted = true;

    const loadFromDatabase = async () => {
      try {
        const data = await fetchMyBadges();
        if (!isMounted || !Array.isArray(data) || data.length === 0) {
          return;
        }

        const decodedId = decodeURIComponent(badgeId || '');
        const numericId = Number(decodedId);
        const locationBadgeId = Number(location.state?.badge?.badgeDbId);

        const matched = data.find((item) => {
          if (Number.isInteger(locationBadgeId) && Number(item.badgeDbId) === locationBadgeId) {
            return true;
          }

          if (decodedId && String(item.id) === decodedId) {
            return true;
          }

          return Number.isInteger(numericId) && Number(item.badgeDbId) === numericId;
        });

        if (matched) {
          setBadge((current) => ({ ...current, ...matched }));
        }
      } catch {
        // Ignore fetch errors and keep the current badge payload.
      }
    };

    loadFromDatabase();

    return () => {
      isMounted = false;
    };
  }, [badgeId, location.state?.badge?.badgeDbId]);

  useEffect(() => {
    let isMounted = true;

    const loadRequirements = async () => {
      if (!resolvedBadgeDbId) {
        return;
      }

      const hasServerRequirements = Array.isArray(badge?.requirements) && badge.requirements.length > 0;
      if (!isSpecialBadge && hasServerRequirements) {
        setDynamicRequirements(null);
        return;
      }

      try {
        const reqs = await fetchBadgeRequirements(resolvedBadgeDbId);
        if (isMounted && Array.isArray(reqs)) {
          setDynamicRequirements(reqs);
        }
      } catch {
        if (isMounted) {
          setDynamicRequirements(null);
        }
      }
    };

    loadRequirements();

    return () => {
      isMounted = false;
    };
  }, [resolvedBadgeDbId, isSpecialBadge, badge?.requirements]);

  useEffect(() => {
    // Initialize files state from badge payload when available (server may provide per-requirement files)
    const possible = badge?.requirementFiles || badge?.filesByRequirement || badge?.requirementSubmissions || badge?.submittedFiles;
    if (possible && typeof possible === 'object') {
      setFilesByRequirement(possible);
    }
  }, [badge]);

  useEffect(() => {
    setBadgeStatus(normalizeBadgeStatus(badge));
  }, [badge]);

  useEffect(() => {
    const nextRequestId = Number(badge?.requestId);
    setCurrentRequestId(Number.isInteger(nextRequestId) && nextRequestId > 0 ? nextRequestId : null);
  }, [badge]);

  const requirements = useMemo(() => {
    if (!hasBadgeId) {
      return [];
    }
    const prefix = getRequirementPrefixByLevel(badge.levelKey);
    const showFileCounters = badgeStatus !== 'visualizar';
    const sourceRequirements = Array.isArray(dynamicRequirements) && dynamicRequirements.length > 0
      ? dynamicRequirements
      : Array.isArray(badge.requirements) && badge.requirements.length > 0
        ? badge.requirements
        : [];

    if (sourceRequirements.length === 0) {
      return [];
    }

    return sourceRequirements.map((item, index) => {
      const rawTitle = String(item?.title || item?.requisito || t('badge_requirement_fallback', { num: index + 1 })).trim();
      const hasPrefixedTitle = /^[A-E]\d+\s*-\s*/i.test(rawTitle);
      const filesCount = Number(item?.files);

      return {
        ...item,
        id: String(item?.id || `req-${index + 1}`),
        title: isSpecialBadge
          ? rawTitle
          : (hasPrefixedTitle ? rawTitle : `${prefix}${index + 1} - ${rawTitle}`),
        description: item?.description || item?.r_descricao || '',
        files: Number.isInteger(filesCount) && filesCount >= 0
          ? filesCount
          : showFileCounters ? 0 : null,
        image: item?.image || item?.imagem || badge.badgeImage,
      };
    });
  }, [badge.requirements, badge.levelKey, badgeStatus, badge.badgeImage, hasBadgeId, isSpecialBadge, dynamicRequirements, t]);

  const fallbackBackRoute =
    typeof location.state?.backTo === 'string' && location.state.backTo.trim().length > 0
      ? location.state.backTo
      : '/consultor/meus-badges';

  const fallbackBackState =
    location.state?.backToState && typeof location.state.backToState === 'object'
      ? location.state.backToState
      : undefined;

  const handleGoBack = () => {
    if (typeof location.state?.backTo === 'string' && location.state.backTo.trim().length > 0) {
      navigate(fallbackBackRoute, { state: fallbackBackState });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackBackRoute);
  };

  const toggleRequirement = (requirementId) => {
    setOpenRequirementId((current) => (current === requirementId ? null : requirementId));
  };

  const _openedFromCatalog =
    (typeof location.state?.backTo === 'string' && location.state.backTo === '/consultor/catalogo-badges') ||
    location.state?.activeSidebarRoute === '/consultor/catalogo-badges';

  const canRequestBadge =
    hasBadgeId &&
    (badgeStatus === 'visualizar' || badgeStatus === 'evidencias_insuficientes');
  const isProgressStatus = badgeStatus === 'candidatura_em_progresso';
  const canSubmitProgress = hasBadgeId && (canRequestBadge || isProgressStatus);
  const hasStatusBanner = badgeStatus !== 'visualizar';
  const statusMeta = statusConfig[badgeStatus] || null;
  const showReviewMessage = badgeStatus === 'evidencias_insuficientes';
  const showShareActions = badgeStatus === 'obtido';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

  const getPublicUrl = () => {
    const badgeId = badge.badgeDbId || badge.id;
    return `${window.location.origin}/galeria-publica/badge/${badgeId}`;
  };

  const getShareUrl = () => getPublicUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicUrl()).then(() => {
      setStatusMessage(t('badge_link_copied'));
      setTimeout(() => setStatusMessage(''), 3000);
    });
  };

  const handleRequestBadge = async () => {
    setStatusMessage(t('badge_processing_submission'));

    if (isSubmitting) {
      return;
    }

    if (!canSubmitProgress) {
      setStatusMessage(t('badge_cannot_submit'));
      return;
    }

    if (!badge?.badgeDbId) {
      setStatusMessage(t('badge_identify_error'));
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage('');

      const shouldUploadEvidence = badgeStatus === 'candidatura_em_progresso' || badgeStatus === 'evidencias_insuficientes';
      if (shouldUploadEvidence) {
        const requestId = Number(currentRequestId);
        if (!Number.isInteger(requestId) || requestId <= 0) {
          throw new Error(t('badge_invalid_request'));
        }

        const entries = Object.entries(filesByRequirement);
        const uploads = [];

        for (const [requirementId, files] of entries) {
          const validFiles = Array.isArray(files) ? files.filter((f) => typeof File !== 'undefined' && f instanceof File) : [];
          if (validFiles.length === 0) {
            continue;
          }

          const nreqMatch = String(requirementId).match(/(\d+)/);
          const nreq = nreqMatch ? Number(nreqMatch[1]) : Number.NaN;
          if (!Number.isInteger(nreq) || nreq <= 0) {
            continue;
          }

          uploads.push(uploadEvidence(requestId, nreq, validFiles));
        }

        if (uploads.length === 0) {
          throw new Error(t('badge_add_file_required'));
        }

        await Promise.all(uploads);
      }

      const response = await requestBadgeAcquisition(badge.badgeDbId);
      const nextStatus = String(response?.status || 'candidatura_em_progresso').toLowerCase();
      const returnedRequestId = Number(response?.requestId);
      if (Number.isInteger(returnedRequestId) && returnedRequestId > 0) {
        setCurrentRequestId(returnedRequestId);
      }

      if (shouldUploadEvidence) {
        setFilesByRequirement({});
      }

      try {
        const data = await fetchMyBadges();
        if (Array.isArray(data) && data.length > 0) {
          const decodedId = decodeURIComponent(badgeId || '');
          const numericId = Number(decodedId);
          const matched = data.find((item) => {
            if (decodedId && String(item.id) === decodedId) {
              return true;
            }

            return Number.isInteger(numericId) && Number(item.badgeDbId) === numericId;
          });

          if (matched) {
            setBadge((current) => ({ ...current, ...matched }));
          }
        }
      } catch {
        // Ignore refresh errors after submission.
      }

      setBadgeStatus(nextStatus);
      if (nextStatus === 'obtido') {
        setStatusMessage(t('badge_already_obtained'));
      } else if (isProgressStatus) {
        setStatusMessage(t('badge_already_in_progress'));
      } else {
        setStatusMessage(t('badge_submission_success'));
      }
    } catch (error) {
      setStatusMessage(error?.message || t('badge_submission_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilesLabel = (requirementId, filesProp, attachments) => {
    const pendingFiles = Array.isArray(filesByRequirement[requirementId])
      ? filesByRequirement[requirementId].filter((file) => typeof File !== 'undefined' && file instanceof File)
      : [];
    const pendingCount = pendingFiles.length;
    const submittedCount = Array.isArray(attachments) ? attachments.length : 0;
    const countFromProp = Number.isInteger(Number(filesProp)) && Number(filesProp) >= 0 ? Number(filesProp) : 0;
    const baseCount = submittedCount > 0 ? submittedCount : countFromProp;
    const total = baseCount + pendingCount;

    if (total > 0) return `${String(total).padStart(2, '0')} ${t('badge_submitted_files')}`;
    return t('badge_no_files_submitted');
  };

  const getAttachmentLabel = (attachment) =>
    String(attachment?.label || attachment?.name || attachment?.fileName || attachment?.filename || t('file')).trim();

  const handleFilesSelected = (requirementId, fileList) => {
    const files = Array.from(fileList || []);
    setFilesByRequirement((current) => ({ ...current, [requirementId]: [...(current[requirementId] || []), ...files] }));
  };

  const handleRemoveFile = (requirementId, index) => {
    setFilesByRequirement((current) => {
      const arr = Array.isArray(current[requirementId]) ? [...current[requirementId]] : [];
      if (index >= 0 && index < arr.length) arr.splice(index, 1);
      return { ...current, [requirementId]: arr };
    });
  };

  return (
    <Layout>
      <div className="badge-details-page">
        <header className="badge-details-header">
          <button type="button" className="badge-details-back-btn" onClick={handleGoBack} aria-label={t('back')}>
            <ArrowLeft size={22} />
          </button>
          <h1>{t('badge')}</h1>
        </header>

        <section className="badge-hero-card" aria-label={`${t('badge_details_aria')} ${badgeId || ''}`}>
          <div className="badge-hero-media">
            <BadgeImage
              className="badge-hero-image"
              src={badge.badgeImage}
              alt={levelLabel}
              frameSrc={badge.badgeFrameImage}
              levelKey={badge.levelKey}
              typeId={badge.typeId}
              levelLabel={levelLabel}
            />
          </div>

          <div className="badge-hero-content">
            <h2>{badgeTitle}</h2>
            <p>{levelLabel}</p>

            <div className="badge-hero-meta">
              <span>
                <Clock3 size={16} />
                <strong>{t('obtained')}</strong>
                {badge.date}
              </span>

              <span>
                <Trophy size={16} />
                {badge.points} {t('points')}
              </span>

              <span>
                <FileText size={16} />
                {requirements.length} {t('requirements').toLowerCase()}
              </span>

              {badge.validade && (
                <span>
                  <Clock3 size={16} />
                  <strong>{t('export_expires')}</strong>
                  {new Date(badge.validade).toLocaleDateString('pt-PT')}
                </span>
              )}
            </div>

            {hasStatusBanner && statusMeta && (
              <div className={`badge-status-banner ${statusMeta.className}`}>
                <statusMeta.Icon size={20} />
                <span>{statusMeta.label}</span>
              </div>
            )}

          </div>
        </section>

        <p className="badge-breadcrumb">
          {badgeTitle} {'>'} {badge.serviceLineName} {'>'} {badge.learningPathName} {'>'} {levelLabel}
        </p>

        <section className="badge-requirements-card">
          <h3>{t('requirements')}</h3>
          {!hasBadgeId && (
            <p className="badge-requirements-empty">{t('badge_no_level_badge')}</p>
          )}

          {hasBadgeId && requirements.length === 0 && (
            <p className="badge-requirements-empty">{t('badge_no_requirements')}</p>
          )}

          {hasBadgeId && requirements.map((requirement, index) => {
            const isOpen = openRequirementId === requirement.id;
            const ToggleIcon = isOpen ? EyeOff : Eye;

            return (
              <article key={`${badge.id}-${requirement.id}`} className={`badge-requirement-item ${isOpen ? 'is-open' : ''}`}>
                <div className="badge-requirement-head">
                  <div>
                    <p>{requirement.title}</p>
                    {badgeStatus !== 'visualizar' && (
                      <span>{getFilesLabel(requirement.id, requirement.files, requirement.attachments)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="badge-requirement-view-btn"
                    aria-label={isOpen ? `${t('badge_hide_requirement')} ${index + 1}` : `${t('badge_view_requirement')} ${index + 1}`}
                    title={isOpen ? t('badge_hide_requirement') : t('badge_view_requirement')}
                    aria-expanded={isOpen}
                    onClick={() => toggleRequirement(requirement.id)}
                  >
                    <ToggleIcon size={19} />
                  </button>
                </div>

                {isOpen && (
                  <div className="badge-requirement-detail">
                    <BadgeImage
                      src={requirement.image || badge.badgeImage}
                      alt={`${t('badge_requirement_illustration')} ${index + 1}`}
                      className="badge-requirement-detail-image"
                      levelKey={badge.levelKey}
                      typeId={badge.typeId}
                      levelLabel={levelLabel}
                    />
                    <div className="badge-requirement-detail-content">
                      <p>{requirement.description}</p>
                      {badgeStatus !== 'visualizar' && (
                        <div className="badge-requirement-files">
                          <label className="badge-file-input-label">{t('badge_submitted_files')}</label>
                          <div className="badge-file-list">
                            {Array.isArray(requirement.attachments) && requirement.attachments.length > 0 ? (
                              requirement.attachments.map((attachment, index) => (
                                <div key={`${requirement.id}-attachment-${index}`} className="badge-file-item">
                                  <span className="badge-file-name">{getAttachmentLabel(attachment)}</span>
                                </div>
                              ))
                            ) : (
                              <div className="badge-file-none">{t('badge_no_file_submitted')}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {(badgeStatus === 'candidatura_em_progresso' || badgeStatus === 'evidencias_insuficientes') && (
                        <div className="badge-requirement-files">
                          <label className="badge-file-input-label">{t('badge_attach_files')}</label>
                          <input
                            className="badge-file-input"
                            type="file"
                            multiple
                            onChange={(e) => handleFilesSelected(requirement.id, e.target.files)}
                            aria-label={`${t('badge_attach_files_to_requirement')} ${index + 1}`}
                          />

                          <div className="badge-file-list">
                            {Array.isArray(filesByRequirement[requirement.id]) && filesByRequirement[requirement.id].length > 0 ? (
                              filesByRequirement[requirement.id]
                                .filter((file) => typeof File !== 'undefined' && file instanceof File)
                                .map((f, fi) => (
                                  <div key={`${requirement.id}-file-${fi}`} className="badge-file-item">
                                    <span className="badge-file-name">{f.name}</span>
                                    <button
                                      type="button"
                                      className="badge-file-remove-btn"
                                      onClick={() => handleRemoveFile(requirement.id, fi)}
                                      aria-label={`${t('remove_file')} ${f.name}`}
                                    >
                                      {t('remove')}
                                    </button>
                                  </div>
                                ))
                            ) : (
                              <div className="badge-file-none">{t('badge_no_file_attached')}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {showReviewMessage && (
          <section className="badge-review-card">
            <div className="badge-review-head">
              <h3>{t('badge_talent_manager_message')}</h3>
              <span>{badge.reviewerDate || '23 de dezembro de 2025'}</span>
            </div>
            <p>{badge.reviewMessage || 'Evidências insuficientes para a conclusão da submissão.'}</p>
          </section>
        )}

        <div className="badge-actions-row">
          {showShareActions && (
            <>
              <button type="button" className="badge-share-icon-btn" aria-label={t('badge_copy_link')} onClick={handleCopyLink}>
                <Link size={24} />
              </button>
              <LinkedInShareButton url={getShareUrl()} className="badge-share-primary-btn" />
            </>
          )}

          {!showShareActions && canSubmitProgress && (
            <button
              type="button"
              className="badge-submit-btn"
              disabled={isSubmitting}
              onClick={handleRequestBadge}
            >
              {badgeStatus === 'visualizar' ? null : <SendHorizontal size={20} />}
              {isSubmitting
                ? t('badge_submitting')
                : badgeStatus === 'visualizar'
                  ? t('badge_start_application')
                  : t('badge_submit')}
            </button>
          )}
        </div>

        {statusMessage && <p className="badge-feedback">{statusMessage}</p>}
      </div>
    </Layout>
  );
}

export default BadgeDetalhe;
