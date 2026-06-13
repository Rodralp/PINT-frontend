import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Layout from '../components/Layout';
import SeeMore_PopUp from '../components/SeeMore_PopUp';
import {
  Award,
  Flame,
  Clock3,
  Trophy,
  AlertCircle,
  Search,
  TimerReset,
  Sparkles,
  GraduationCap,
  ChevronsRight,
  ArrowRight,
  Crown,
  Edit3,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  Zap
} from 'lucide-react';
import { fetchProfileData } from '../services/consultorService';
import '../css/Consultor/Dashboard_C.css';
import '../css/profile.css';

const defaultTimelineValues = Array.from({ length: 12 }, () => 0);

const calculateVisibleTimelinePoints = (containerWidth, totalPoints) => {
  const minColumnWidth = 42;
  const maxPointsByWidth = Math.floor(containerWidth / minColumnWidth);
  return Math.max(4, Math.min(totalPoints, maxPointsByWidth));
};

const statIconMap = {
  award: Award,
  flame: Flame,
  clock: Clock3,
  crown: Crown,
};

const activityIconMap = {
  award: Award,
  badge: Award,
  rank: TrendingUp,
  skill: Star,
  achievement: Trophy,
  streak: Zap,
  trending: TrendingUp,
  star: Star,
  zap: Zap,
  trophy: Trophy,
};

const defaultProfileStats = [
  { titleKey: 'dashboard_stat_badges_title', value: '0', icon: Award, tone: 'gold' },
  { titleKey: 'dashboard_stat_streak_title', value: '0', icon: Flame, tone: 'fire' },
  { titleKey: 'dashboard_stat_requests_title', value: '0', icon: Clock3, tone: 'blue' },
  { titleKey: 'dashboard_stat_ranking_title', value: '#-', icon: Crown, tone: 'rank' },
];

const defaultSkillsItems = [];

const defaultCertificationsItems = [];

const defaultActivityItems = [];

function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profileStats, setProfileStats] = useState(defaultProfileStats);
  const [skillsItems, setSkillsItems] = useState(defaultSkillsItems);
  const [certificationsItems, setCertificationsItems] = useState(defaultCertificationsItems);
  const [activityItems, setActivityItems] = useState(defaultActivityItems);
  const [serviceLineStats, setServiceLineStats] = useState([]);
  const [profileLocation, setProfileLocation] = useState('Portugal');
  const [profileJoined, setProfileJoined] = useState('2023');
  const [statusMessage, setStatusMessage] = useState('');
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
  const loginData = storedLoginData ? JSON.parse(storedLoginData) : null;
  const userName = loginData?.nome || t('app_user_default');
  const userEmail = loginData?.email || 'user@example.com';

  const initialSeed = String(loginData?.email || loginData?.nome || userName || '').toLowerCase().replace('@', '.');
  const initialAvatar = loginData?.avatar || `https://i.pravatar.cc/120?u=${encodeURIComponent(initialSeed)}`;

  const [profileAvatar, setProfileAvatar] = useState(initialAvatar);

  // States para modals "Ver Mais"
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isCertificationsModalOpen, setIsCertificationsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const data = await fetchProfileData();
        if (!isMounted) {
          return;
        }

        if (Array.isArray(data.stats) && data.stats.length > 0) {
          const mappedStats = data.stats.map((item) => ({
            ...item,
            icon: statIconMap[item.iconKey] || Award,
          }));
          setProfileStats(mappedStats);
        }

        if (Array.isArray(data.skillsItems) && data.skillsItems.length > 0) {
          setSkillsItems(data.skillsItems);
        }

        if (Array.isArray(data.serviceLineStats) && data.serviceLineStats.length > 0) {
          setServiceLineStats(data.serviceLineStats);
        }

        if (Array.isArray(data.certificationsItems) && data.certificationsItems.length > 0) {
          setCertificationsItems(data.certificationsItems);
        }

        if (Array.isArray(data.activityItems) && data.activityItems.length > 0) {
          setActivityItems(data.activityItems);
        }

        if (typeof data.location === 'string' && data.location) {
          setProfileLocation(data.location);
        }

        if (typeof data.joined === 'string' && data.joined) {
          setProfileJoined(data.joined);
        }

        if (typeof data.avatar === 'string' && data.avatar) {
          setProfileAvatar(data.avatar);
        }

        setStatusMessage('');
      } catch {
        if (isMounted) {
          setStatusMessage('');
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Layout>
      <div className="dashboard-consultor-page">
        <div className="dashboard-consultor-header">
          <h1>{t('profile_title')}</h1>
        </div>

        {statusMessage && (
          <div className="alert alert-warning py-2" role="status">
            {statusMessage}
          </div>
        )}

        <section className="dashboard-card dashboard-profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <img src={profileAvatar} alt="Profile Avatar" />
            </div>
            <div className="profile-info">
              <h2>{userName}</h2>
              <p className="profile-role">{t('profile_type')}</p>
              <div className="profile-meta">
                <span><Mail size={16} /> {userEmail}</span>
                <span><MapPin size={16} /> {profileLocation}</span>
                <span><Calendar size={16} /> Joined {profileJoined}</span>
              </div>
            </div>
            <div className="profile-btn-space">
              <button className="profile-home-btn" onClick={() => navigate(`/galeria-publica/consultor/${encodeURIComponent(loginData?.id)}`)}>
                {t('profile_pub')}
              </button>
              <button className="profile-edit-btn">
                <Edit3 size={18} /> {t('profile_edit')}
              </button>
            </div>
          </div>
        </section>

        <div className="dashboard-consultor-grid">
          <div className="dashboard-stats-grid">
            {profileStats.map((item) => {
              const StatIcon = item.icon;

              return (
                <section key={item.titleKey} className={`dashboard-card dashboard-stat-card tone-${item.tone}`}>
                  <div className="dashboard-card-title">{t(item.titleKey)}</div>
                  <div className="dashboard-stat-body">
                    <span className="dashboard-stat-icon">
                      <StatIcon size={36} strokeWidth={2} />
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                </section>
              );
            })}
          </div>

          <section className="dashboard-card dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>{t('profile_activity_title', 'Recent Activity')}</h2>
              <a href="#ver-todos-activity" onClick={(event) => {
                event.preventDefault();
                setIsActivityModalOpen(true);
              }}>
                {t('dashboard_view_all')} <ArrowRight size={16} />
              </a>
            </div>

            <div className="dashboard-list-compact">
              {activityItems.map((activity, index) => {
                const ActivityIcon = (typeof activity.icon === 'string' ? activityIconMap[activity.icon.toLowerCase()] : activity.icon) || Award;
                const activityColor = activity.color || 'gold';
                return (
                  <div key={index} className="dashboard-list-item-compact">
                    <div className={`dashboard-list-badge accent-${activityColor}`}>
                      <ActivityIcon size={18} strokeWidth={2} />
                    </div>
                    <div className="dashboard-list-content">
                      <strong>{activity.description}</strong>
                      <span>{activity.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dashboard-card dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>{t('profile_skills')}</h2>
              <a href="#ver-todos-skills" onClick={(event) => {
                event.preventDefault();
                setIsSkillsModalOpen(true);
              }}>
                {t('dashboard_view_all')} <ArrowRight size={16} />
              </a>
            </div>

            <div className="dashboard-list">
              {Array.isArray(serviceLineStats) && serviceLineStats.length > 0 ? (
                (() => {
                  const maxBadges = Math.max(...serviceLineStats.map((s) => s.badges || 0), 1);
                  return serviceLineStats.map((stat) => {
                    const percentage = ((stat.badges || 0) / maxBadges) * 100;
                    return (
                      <article key={`sl-${stat.serviceLine}`} className="pp-service-line-item">
                        <div className="pp-service-line-header">
                          <strong>{stat.serviceLine}</strong>
                          <span className="pp-service-line-meta">
                            {stat.badges} {t('badges')} · {stat.points} {t('points')}
                          </span>
                        </div>
                        <div className="pp-progress-bar-bg">
                          <div style={{ width: `${percentage}%` }} className="pp-progress-bar-fill" />
                        </div>
                      </article>
                    );
                  });
                })()
              ) : (
                skillsItems.map(({ title, subtitleKey, accent }) => (
                  <article key={`${title}-${subtitleKey}`} className="dashboard-list-item">
                    <div className={`dashboard-list-badge accent-${accent}`}>
                      <Award size={18} strokeWidth={2} />
                    </div>
                    <div className="dashboard-list-content">
                      <strong>{title}</strong>
                      <span>{t(subtitleKey)}</span>
                    </div>
                    <ChevronsRight className="dashboard-item-chevron" size={18} />
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-card dashboard-panel-card">
            <div className="dashboard-panel-header">
              <h2>{t('profile_certifications')}</h2>
              <a href="#ver-todos-certificacoes" onClick={(event) => {
                event.preventDefault();
                setIsCertificationsModalOpen(true);
              }}>
                {t('dashboard_view_all')} <ArrowRight size={16} />
              </a>
            </div>

            <div className="dashboard-list">
              {certificationsItems.map(({ title, subtitleKey, accent }) => (
                <article key={`${title}-${subtitleKey}`} className="dashboard-list-item">
                  <div className={`dashboard-list-badge accent-${accent}`}>
                    <GraduationCap size={18} strokeWidth={2} />
                  </div>
                  <div className="dashboard-list-content">
                    <strong>{title}</strong>
                    <span>{t(subtitleKey)}</span>
                  </div>
                  <ChevronsRight className="dashboard-item-chevron" size={18} />
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modais reutilizando a componente SeeMore_PopUp */}
      <SeeMore_PopUp
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={t('profile_activity_title', 'Recent Activity')}
        items={activityItems}
        renderItem={(activity) => {
          const ActivityIcon = (typeof activity.icon === 'string' ? activityIconMap[activity.icon.toLowerCase()] : activity.icon) || Award;
          const activityColor = activity.color || 'gold';
          return (
            <div className="dashboard-list-item-compact">
              <div className={`dashboard-list-badge accent-${activityColor}`}>
                <ActivityIcon size={18} strokeWidth={2} />
              </div>
              <div className="dashboard-list-content">
                <strong>{activity.description}</strong>
                <span>{activity.date}</span>
              </div>
            </div>
          );
        }}
        emptyMessage={t('no_activities', 'Nenhuma atividade para mostrar.')}
      />

      <SeeMore_PopUp
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        title={t('profile_skills')}
        items={Array.isArray(serviceLineStats) && serviceLineStats.length > 0 ? serviceLineStats : skillsItems}
        renderItem={(item) => {
          if (Array.isArray(serviceLineStats) && serviceLineStats.length > 0) {
            const maxBadges = Math.max(...serviceLineStats.map((s) => s.badges || 0), 1);
            const percentage = ((item.badges || 0) / maxBadges) * 100;
            return (
              <article className="pp-service-line-item">
                <div className="pp-service-line-header">
                  <strong>{item.serviceLine}</strong>
                  <span className="pp-service-line-meta">
                    {item.badges} {t('badges')} · {item.points} {t('points')}
                  </span>
                </div>
                <div className="pp-progress-bar-bg">
                  <div style={{ width: `${percentage}%` }} className="pp-progress-bar-fill" />
                </div>
              </article>
            );
          }

          return (
            <article className="dashboard-list-item">
              <div className={`dashboard-list-badge accent-${item.accent}`}>
                <Award size={18} strokeWidth={2} />
              </div>
              <div className="dashboard-list-content">
                <strong>{item.title}</strong>
                <span>{t(item.subtitleKey)}</span>
              </div>
              <ChevronsRight className="dashboard-item-chevron" size={18} />
            </article>
          );
        }}
        emptyMessage={t('no_skills', 'Nenhuma habilidade para mostrar.')}
      />

      <SeeMore_PopUp
        isOpen={isCertificationsModalOpen}
        onClose={() => setIsCertificationsModalOpen(false)}
        title={t('profile_certifications')}
        items={certificationsItems}
        renderItem={(item) => (
          <article className="dashboard-list-item">
            <div className={`dashboard-list-badge accent-${item.accent}`}>
              <GraduationCap size={18} strokeWidth={2} />
            </div>
            <div className="dashboard-list-content">
              <strong>{item.title}</strong>
              <span>{t(item.subtitleKey)}</span>
            </div>
            <ChevronsRight className="dashboard-item-chevron" size={18} />
          </article>
        )}
        emptyMessage={t('no_certifications', 'Nenhuma certificação para mostrar.')}
      />
    </Layout>
  );
}

export default Profile;