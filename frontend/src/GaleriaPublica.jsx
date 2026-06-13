import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BadgeImage from './components/BadgeImage';
import { fetchCatalogBadges, fetchRankingConsultores } from './services/consultorService';
import './css/GaleriaPublica.css';
import './css/Consultor/CatalogoBadges_C.css';

const resolveBadgeLevel = (item) => {
  const byKey = {
    badge_level_junior: 'Junior',
    badge_level_intermediate: 'Intermedio',
    badge_level_senior: 'Senior',
    badge_level_specialist: 'Especialista',
    badge_level_knowledge_lead: 'Lider de Conhecimento',
  };

  return item.levelLabel || byKey[item.levelKey] || 'Intermedio';
};

const resolveBadgeLevelKey = (item) => {
  const byLabel = {
    Junior: 'badge_level_junior',
    Intermedio: 'badge_level_intermediate',
    Senior: 'badge_level_senior',
    Especialista: 'badge_level_specialist',
    'Lider de Conhecimento': 'badge_level_knowledge_lead',
  };

  return item.levelKey || byLabel[item.levelLabel] || 'badge_level_intermediate';
};

const normalizeBadges = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item, index) => {
    const isSpecial = Boolean(item.isSpecial) || item.typeId === 'special';
    const levelKey = isSpecial ? null : resolveBadgeLevelKey(item);
    const levelLabel = isSpecial ? 'Especial' : resolveBadgeLevel({ ...item, levelKey });

    return {
      id: item.id || `${item.area || 'badge'}-${index}`,
      name: item.name || item.title || item.area || 'Badge',
      area: item.area || 'Area Tecnica',
      levelKey,
      levelLabel,
      typeId: item.typeId || levelKey,
      isSpecial,
      points: Number(item.points) || 0,
      badgeImage: item.badgeImage || '/badges/Interm%C3%A9dio.png',
      badgeFrameImage: item.badgeFrameImage || null,
      date: item.date || '12 Jan 2026',
    };
  });
};

const normalizeConsultores = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item, index) => ({
    id: item.id || index + 1,
    name: item.name || 'Consultor',
    email: item.email || 'sem-email@softinsa.pt',
    serviceLine: item.serviceLine || 'Service Line',
    points: Number(item.points) || 0,
    badges: Number(item.badges) || 0,
    avatar: item.avatar || `https://i.pravatar.cc/120?u=${item.email || item.name}`,
    serviceLineStats: Array.isArray(item.serviceLineStats) ? item.serviceLineStats : [],
  }));
};

function GaleriaPublica() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('gp_activeTab');
    return saved || 'badges';
  });
  const [badges, setBadges] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadPublicData = async () => {
      try {
        const [badgesData, consultoresData] = await Promise.all([
          fetchCatalogBadges(),
          fetchRankingConsultores(),
        ]);

        if (!isMounted) {
          return;
        }

        setBadges(normalizeBadges(badgesData));
        setConsultores(normalizeConsultores(consultoresData));
      } catch {
        if (!isMounted) {
          return;
        }

        setBadges([]);
        setConsultores([]);
      }
    };

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedConsultores = useMemo(
    () => [...consultores].sort((a, b) => b.points - a.points),
    [consultores],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBadges = useMemo(() => {
    if (!normalizedSearch) {
      return badges;
    }

    return badges.filter((badge) => {
      const badgeTitle = String(badge.name || badge.area || '').toLowerCase();
      const levelText = (badge.levelLabel || '').toLowerCase();
      return (
        badgeTitle.includes(normalizedSearch)
        || levelText.includes(normalizedSearch)
      );
    });
  }, [badges, normalizedSearch]);

  const filteredConsultores = useMemo(() => {
    if (!normalizedSearch) {
      return sortedConsultores;
    }

    return sortedConsultores.filter((consultor) => (
      consultor.name.toLowerCase().includes(normalizedSearch)
      || consultor.email.toLowerCase().includes(normalizedSearch)
      || consultor.serviceLine.toLowerCase().includes(normalizedSearch)
    ));
  }, [sortedConsultores, normalizedSearch]);

  const displayedBadges = filteredBadges;

  const handleOpenBadgeDetails = (item) => {
    navigate(`/galeria-publica/badge/${encodeURIComponent(item.id)}`, {
      state: {
        badge: item,
      },
    });
  };

  const handleCardKeyDown = (event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenBadgeDetails(item);
    }
  };

  const handleOpenConsultorProfile = (consultor) => {
    navigate(`/galeria-publica/consultor/${encodeURIComponent(String(consultor.id))}`, {
      state: {
        consultor,
      },
    });
  };

  const handleConsultorCardKeyDown = (event, consultor) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenConsultorProfile(consultor);
    }
  };

  return (
    <div className="gp-root">
      <Navbar />

      <main className="gp-main">
        <section className="gp-shell">
          <header className="gp-header">
            <h1>{t('public_gallery_title')}</h1>
            <p>{t('public_gallery_subtitle')}</p>

            <div className="gp-header-actions">
              <div className="gp-tabs" role="tablist" aria-label={t('public_gallery_tab_aria')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'badges'}
                  className={`gp-tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('badges');
                    sessionStorage.setItem('gp_activeTab', 'badges');
                  }}
                >
                  {t('public_gallery_badges')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'consultores'}
                  className={`gp-tab-btn ${activeTab === 'consultores' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('consultores');
                    sessionStorage.setItem('gp_activeTab', 'consultores');
                  }}
                >
                  {t('public_gallery_consultores')}
                </button>
              </div>

              <label className="gp-search-wrap" aria-label="Pesquisar">
                <Search size={18} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Pesquisar"
                  aria-label="Pesquisar"
                />
              </label>
            </div>
          </header>

          {activeTab === 'badges' ? (
            /*<section className="gp-grid" aria-label={t('public_gallery_badges')}>
              {badges.map((badge) => (
                <article key={badge.id} className="gp-card gp-badge-card">
                  <div className="gp-badge-image-wrap">
                    <img src={badge.badgeImage} alt={badge.levelLabel} className="gp-badge-image" />
                  </div>
                  <h2>{badge.area}</h2>
                  <p>{`${t('public_gallery_level')}: ${badge.levelLabel}`}</p>
                  <span>{`${badge.points} pts`}</span>
                </article>
              ))}
            </section>*/
            <div className="catalog-grid">
              {displayedBadges.map((item) => (
                <article
                  key={item.id}
                  className="catalog-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenBadgeDetails(item)}
                  onKeyDown={(event) => handleCardKeyDown(event, item)}
                >
                  <div className="catalog-badge-frame">
                    <BadgeImage
                      className="catalog-badge-image"
                      src={item.badgeImage}
                      alt={item.levelKey ? t(item.levelKey) : item.levelLabel}
                      frameSrc={item.badgeFrameImage}
                      levelKey={item.levelKey}
                      typeId={item.typeId}
                      levelLabel={item.levelLabel}
                    />
                  </div>

                  <div className="catalog-card-title">{item.name || item.area || 'Badge'}</div>
                  <div className="catalog-card-level">{item.levelKey ? t(item.levelKey) : item.levelLabel}</div>

                  <div className="catalog-card-meta">
                    <div className="catalog-meta-row">
                      <Trophy size={14} />
                      <span>{item.points} {t('points')}</span>
                    </div>
                    <div className="catalog-meta-row">
                      <Clock3 size={14} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <section className="catalog-grid gp-consultor-grid" aria-label={t('public_gallery_consultores')}>
              {filteredConsultores.map((consultor) => (
                <article
                  key={consultor.id}
                  className="catalog-card gp-consultor-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenConsultorProfile(consultor)}
                  onKeyDown={(event) => handleConsultorCardKeyDown(event, consultor)}
                >
                  <div className="catalog-badge-frame gp-consultor-avatar-frame" aria-hidden="true">
                    <img className="gp-consultor-avatar" src={consultor.avatar} alt="" />
                  </div>

                  <div className="catalog-card-title gp-consultor-name">{consultor.name}</div>
                  <div className="catalog-card-level gp-consultor-email">{consultor.email}</div>

                  <div className="catalog-card-meta gp-consultor-footer">
                    <div className="catalog-meta-row">
                      <Trophy size={14} />
                      <span>{consultor.points} pts</span>
                    </div>
                    <div className="catalog-meta-row">
                      <Clock3 size={14} />
                      <span>{consultor.badges} badges</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default GaleriaPublica;
