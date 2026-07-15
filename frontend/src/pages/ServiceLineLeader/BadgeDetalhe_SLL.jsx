import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Trophy,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BadgeImage from '../../components/BadgeImage';
import { fetchBadgeRequirements } from '../../services/consultorService';
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

function BadgeDetalheSLL() {
  const { badgeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [openRequirementId, setOpenRequirementId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicRequirements, setDynamicRequirements] = useState(null);

  const [badge] = useState(() => {
    if (location.state?.badge) {
      return location.state.badge;
    }
    return defaultBadgeDetails;
  });

  const hasBadgeId = Number.isInteger(Number(badge?.badgeDbId)) && Number(badge.badgeDbId) > 0;
  const isSpecialBadge = Boolean(badge?.isSpecial) || badge?.typeId === 'special' || !badge?.levelKey;
  const levelLabel = isSpecialBadge ? 'Especial' : t(badge?.levelKey || '');
  const resolvedBadgeDbId = useMemo(
    () => resolveBadgeDbId(badgeId, badge),
    [badgeId, badge],
  );
  const badgeTitle = badge.name || badge.area || 'Badge';

  useEffect(() => {
    setDynamicRequirements(null);
  }, [badgeId, badge?.badgeDbId]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

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

  const requirements = useMemo(() => {
    if (!hasBadgeId) {
      return [];
    }
    const prefix = getRequirementPrefixByLevel(badge.levelKey);
    const sourceRequirements = Array.isArray(dynamicRequirements) && dynamicRequirements.length > 0
      ? dynamicRequirements
      : Array.isArray(badge.requirements) && badge.requirements.length > 0
        ? badge.requirements
        : [];

    if (sourceRequirements.length === 0) {
      return [];
    }

    return sourceRequirements.map((item, index) => {
      const rawTitle = String(item?.title || item?.requisito || `Requisito ${index + 1}`).trim();
      const hasPrefixedTitle = /^[A-E]\d+\s*-\s*/i.test(rawTitle);

      return {
        ...item,
        id: String(item?.id || `req-${index + 1}`),
        title: isSpecialBadge
          ? rawTitle
          : (hasPrefixedTitle ? rawTitle : `${prefix}${index + 1} - ${rawTitle}`),
        description: item?.description || item?.r_descricao || '',
        image: item?.image || item?.imagem || badge.badgeImage,
      };
    });
  }, [badge.requirements, badge.levelKey, badge.badgeImage, hasBadgeId, isSpecialBadge, dynamicRequirements]);

  const fallbackBackRoute =
    typeof location.state?.backTo === 'string' && location.state.backTo.trim().length > 0
      ? location.state.backTo
      : '/service-line-leader/minha-service-line';

  const handleGoBack = () => {
    if (typeof location.state?.backTo === 'string' && location.state.backTo.trim().length > 0) {
      navigate(fallbackBackRoute);
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

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="badge-details-page">
        <header className="badge-details-header">
          <button type="button" className="badge-details-back-btn" onClick={handleGoBack} aria-label={t('back')}>
            <ArrowLeft size={22} />
          </button>
          <h1>Badge</h1>
        </header>

        <section className="badge-hero-card" aria-label={`Detalhes do badge ${badgeId || ''}`}>
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

            {badge.description && (
              <p style={{ marginTop: '8px', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                {badge.description}
              </p>
            )}

            <div className="badge-hero-meta">
              <span>
                <Trophy size={16} />
                {badge.points} pontos
              </span>

              <span>
                <FileText size={16} />
                {requirements.length} requisitos
              </span>

              {badge.validade && (
                <span>
                  <Clock3 size={16} />
                  <strong>Expira em</strong>
                  {new Date(badge.validade).toLocaleDateString('pt-PT')}
                </span>
              )}
            </div>
          </div>
        </section>

        <p className="badge-breadcrumb">
          {badgeTitle} {'>'} {badge.serviceLineName} {'>'} {badge.learningPathName} {'>'} {levelLabel}
        </p>

        <section className="badge-requirements-card">
          <h3>{t('requirements')}</h3>
          {!hasBadgeId && (
            <p className="badge-requirements-empty">Este nivel ainda nao tem badge associado.</p>
          )}

          {hasBadgeId && requirements.length === 0 && (
            <p className="badge-requirements-empty">Sem requisitos definidos para este badge.</p>
          )}

          {hasBadgeId && requirements.map((requirement, index) => {
            const isOpen = openRequirementId === requirement.id;
            const ToggleIcon = isOpen ? EyeOff : Eye;

            return (
              <article key={`${badge.id}-${requirement.id}`} className={`badge-requirement-item ${isOpen ? 'is-open' : ''}`}>
                <div className="badge-requirement-head">
                  <div>
                    <p>{requirement.title}</p>
                  </div>

                  <button
                    type="button"
                    className="badge-requirement-view-btn"
                    aria-label={isOpen ? `Ocultar requisito ${index + 1}` : `Ver requisito ${index + 1}`}
                    title={isOpen ? 'Ocultar requisito' : 'Ver requisito'}
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
                      alt={`Ilustracao do requisito ${index + 1}`}
                      className="badge-requirement-detail-image"
                      levelKey={badge.levelKey}
                      typeId={badge.typeId}
                      levelLabel={levelLabel}
                    />
                    <div className="badge-requirement-detail-content">
                      <p>{requirement.description}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </Layout>
  );
}

export default BadgeDetalheSLL;
