import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock3, Eye, EyeOff, FileText, Trophy } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import BadgeImage from './components/BadgeImage';
import { fetchCatalogBadges, fetchBadgeRequirements } from './services/consultorService';
import './css/BadgePublica.css';

const defaultBadgeDetails = {
  id: 'badge-public-default',
  name: '',
  area: '',
  levelKey: '',
  points: 0,
  badgeImage: '',
  date: '',
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

function BadgePublica() {
  const { badgeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [openRequirementId, setOpenRequirementId] = useState(null);
  const [dynamicRequirements, setDynamicRequirements] = useState(null);

  const badge = useMemo(() => {
    if (location.state?.badge) {
      return location.state.badge;
    }

    return defaultBadgeDetails;
  }, [location.state]);

  const resolvedBadgeDbId = useMemo(
    () => resolveBadgeDbId(badgeId, badge),
    [badgeId, badge],
  );

  const badgeTitle = badge.name || badge.area || 'Badge';
  const isSpecialBadge = Boolean(badge?.isSpecial) || badge?.typeId === 'special' || !badge?.levelKey;
  const levelLabel = isSpecialBadge ? 'Especial' : t(badge.levelKey || '');

  useEffect(() => {
    let isMounted = true;

    const loadBadgeFromApi = async () => {
      if (location.state?.badge) return;

      try {
        const items = await fetchCatalogBadges();
        if (!isMounted || !Array.isArray(items)) return;

        const decodedId = decodeURIComponent(badgeId || '');
        const matched = items.find((it) => String(it.id) === String(decodedId) || String(it.badgeDbId) === decodedId || String(it.id) === `badge-${decodedId}`);
        if (matched && isMounted) {
          const template = matched;
          try {
            navigate(location.pathname, { replace: true, state: { badge: template } });
          } catch {
            // ignore navigation errors
          }
        }
      } catch {
        // ignore and keep fallback
      }
    };

    loadBadgeFromApi();

    return () => {
      isMounted = false;
    };
  }, [badgeId, location.state, navigate, location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadRequirements = async () => {
      try {
        const badgeDbId = resolvedBadgeDbId;
        if (!badgeDbId) return;

        const reqs = await fetchBadgeRequirements(badgeDbId);
        if (isMounted && Array.isArray(reqs)) {
          setDynamicRequirements(reqs);
        }
      } catch {
        // ignore and keep static requirements
      }
    };

    loadRequirements();

    return () => {
      isMounted = false;
    };
  }, [resolvedBadgeDbId]);

  const requirements = useMemo(() => {
    if (dynamicRequirements && Array.isArray(dynamicRequirements) && dynamicRequirements.length > 0) {
      return dynamicRequirements;
    }
    if (Array.isArray(badge.requirements) && badge.requirements.length > 0) {
      return badge.requirements;
    }
    return [];
  }, [dynamicRequirements, badge.requirements]);

  const handleGoBack = () => {
    navigate('/galeria-publica');
  };

  const toggleRequirement = (requirementId) => {
    setOpenRequirementId((current) => (current === requirementId ? null : requirementId));
  };

  return (
    <div className="bp-root">
      <Navbar />

      <main className="bp-main">
        <section className="bp-shell">
          <div className="bp-page">
            <header className="bp-header">
              <button type="button" className="bp-back-btn" onClick={handleGoBack} aria-label={t('back')}>
                <ArrowLeft size={22} />
              </button>
              <h1>Badge</h1>
            </header>

            <section className="bp-hero-card" aria-label={`Detalhes do badge ${badgeId || ''}`}>
              <div className="bp-hero-media">
                <BadgeImage
                  className="bp-hero-image"
                  src={badge.badgeImage}
                  alt={levelLabel}
                  frameSrc={badge.badgeFrameImage}
                  levelKey={badge.levelKey}
                  typeId={badge.typeId}
                  levelLabel={levelLabel}
                />
              </div>

              <div className="bp-hero-content">
                <h2>{badgeTitle}</h2>
                <p>{levelLabel}</p>

                <div className="bp-hero-meta">
                  <span>
                    <Clock3 size={16} />
                    <strong>Expira</strong>
                    {badge.date}
                  </span>
                  <span>
                    <Trophy size={16} />
                    {badge.points} {t('points')}
                  </span>
                  <span>
                    <FileText size={16} />
                    {requirements.length} requisitos
                  </span>
                </div>
              </div>
            </section>

            <p className="bp-breadcrumb">
              Jornada Tecnica {'>'} Application Operations {'>'} {badgeTitle} {'>'} {levelLabel}
            </p>

            <section className="bp-requirements-card">
              <h3>{t('requirements')}</h3>
              {requirements.length === 0 ? (
                <p className="bp-requirements-empty">Sem requisitos definidos para este badge.</p>
              ) : (
                <div className="bp-requirements-list">
                  {requirements.map((requirement, index) => {
                    const isOpen = openRequirementId === requirement.id;
                    const ToggleIcon = isOpen ? EyeOff : Eye;

                    return (
                      <article key={`${badge.id}-${requirement.id}`} className={`bp-requirement-item ${isOpen ? 'is-open' : ''}`}>
                        <div className="bp-requirement-head">
                          <p>{requirement.title}</p>
                          <button
                            type="button"
                            className="bp-requirement-view-btn"
                            aria-label={isOpen ? `Ocultar requisito ${index + 1}` : `Ver requisito ${index + 1}`}
                            title={isOpen ? 'Ocultar requisito' : 'Ver requisito'}
                            aria-expanded={isOpen}
                            onClick={() => toggleRequirement(requirement.id)}
                          >
                            <ToggleIcon size={19} />
                          </button>
                        </div>

                        {isOpen && (
                          <div className="bp-requirement-detail">
                            <img
                              src={requirement.image || badge.badgeImage}
                              alt={`Ilustracao do requisito ${index + 1}`}
                              className="bp-requirement-detail-image"
                            />
                            <p>{requirement.description}</p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BadgePublica;
