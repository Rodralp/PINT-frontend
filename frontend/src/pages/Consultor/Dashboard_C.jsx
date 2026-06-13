import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import SeeMore_PopUp from '../../components/SeeMore_PopUp';
import BadgeCongratulationsModal from '../../components/BadgeCongratulationsModal';
import { fetchConsultorDashboard } from '../../services/dashboardService';
import { fetchBadgeSuggestions } from '../../services/consultorService';
import {
  Award,
  Flame,
  Clock3,
  Trophy,
  AlertTriangle,
  SearchCheck,
  TimerReset,
  Sparkles,
  GraduationCap,
  ChevronsRight,
  ArrowRight,
  Crown
} from 'lucide-react';
import '../../css/Consultor/Dashboard_C.css';

const TIMELINE_DAYS = 12;
const defaultTimelineValues = Array.from({ length: TIMELINE_DAYS }, () => 0);
const SEEN_SPECIAL_BADGES_PREFIX = 'seenSpecialBadgeIds_';

const getSeenSpecialBadgesKey = () => {
  try {
    const raw = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
    const data = raw ? JSON.parse(raw) : null;
    const accountId = Number(data?.id);
    return Number.isInteger(accountId) && accountId > 0
      ? `${SEEN_SPECIAL_BADGES_PREFIX}${accountId}`
      : null;
  } catch {
    return null;
  }
};

const statIconMap = {
  award: Award,
  flame: Flame,
  clock: Clock3,
  crown: Crown,
};

const progressIconMap = {
  alertTriangle: AlertTriangle,
  searchCheck: SearchCheck,
  clock: Clock3,
};

const buildTimelineData = (values, locale) => {
  const today = new Date();

  return values.map((value, index) => {
    const daysOffset = values.length - 1 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - daysOffset);

    return {
      value,
      label: date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
    };
  });
};

const calculateVisibleTimelinePoints = (containerWidth, totalPoints) => {
  const minColumnWidth = 42;
  const maxPointsByWidth = Math.floor(containerWidth / minColumnWidth);
  return Math.max(4, Math.min(totalPoints, maxPointsByWidth));
};

const defaultDashboardStats = [
  { titleKey: 'dashboard_stat_badges_title', value: '0', icon: Award, tone: 'gold' },
  { titleKey: 'dashboard_stat_streak_title', value: '0', icon: Flame, tone: 'fire' },
  { titleKey: 'dashboard_stat_requests_title', value: '0', icon: Clock3, tone: 'blue' },
  { titleKey: 'dashboard_stat_ranking_title', value: '#0', icon: Crown, tone: 'rank' },
];

function DashboardC() {
  const { t, i18n } = useTranslation();
  const timelineChartRef = useRef(null);
  const locale = i18n.language?.startsWith('es') ? 'es-ES' : i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT';
  const [timelineValues, setTimelineValues] = useState(defaultTimelineValues);
  const [dashboardStats, setDashboardStats] = useState(defaultDashboardStats);
  const [inProgressItems, setInProgressItems] = useState([]);
  const [suggestionItems, setSuggestionItems] = useState([]);
  const [dashboardStatusMessage, setDashboardStatusMessage] = useState('');
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [congratsBadge, setCongratsBadge] = useState(null);
  const [congratsQueue, setCongratsQueue] = useState([]);
  const timelineData = useMemo(() => buildTimelineData(timelineValues, locale), [timelineValues, locale]);
  const [visibleTimelinePoints, setVisibleTimelinePoints] = useState(timelineData.length);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [dashboardResult, suggestionsResult] = await Promise.allSettled([
          fetchConsultorDashboard(),
          fetchBadgeSuggestions(3),
        ]);

        if (dashboardResult.status !== 'fulfilled') {
          throw dashboardResult.reason;
        }

        const data = dashboardResult.value;
        const suggestionsData = suggestionsResult.status === 'fulfilled' ? suggestionsResult.value : [];

        if (!isMounted) {
          return;
        }

        setTimelineValues(
          Array.isArray(data.timelineValues) && data.timelineValues.length > 0
            ? data.timelineValues.map((value) => Number(value) || 0)
            : defaultTimelineValues,
        );

        const mappedStats = Array.isArray(data.stats) && data.stats.length > 0
          ? data.stats.map((item) => ({
            ...item,
            icon: statIconMap[item.iconKey] || Award,
          }))
          : defaultDashboardStats;
        setDashboardStats(mappedStats);

        const mappedInProgress = Array.isArray(data.inProgressItems)
          ? data.inProgressItems.map((item) => ({
            ...item,
            icon: progressIconMap[item.iconKey] || AlertTriangle,
          }))
          : [];
        setInProgressItems(mappedInProgress);

        if (Array.isArray(suggestionsData) && suggestionsData.length > 0) {
          setSuggestionItems(suggestionsData);
        } else if (Array.isArray(data.suggestionItems)) {
          setSuggestionItems(data.suggestionItems);
        } else {
          setSuggestionItems([]);
        }

        setDashboardStatusMessage('');

        const newBadges = Array.isArray(data.newSpecialBadges) ? data.newSpecialBadges : [];
        if (newBadges.length > 0) {
          const storageKey = getSeenSpecialBadgesKey();
          let seenIds = [];
          if (storageKey) {
            try {
              const stored = localStorage.getItem(storageKey);
              seenIds = stored ? JSON.parse(stored) : [];
            } catch {
              seenIds = [];
            }
          }

          const unseenBadges = newBadges.filter((b) => !seenIds.includes(b.nbadge));
          if (unseenBadges.length > 0) {
            setCongratsQueue(unseenBadges.slice(1));
            setCongratsBadge(unseenBadges[0]);
          }
        }
      } catch {
        if (isMounted) {
          setDashboardStatusMessage('');
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!timelineChartRef.current) {
      return undefined;
    }

    const updateVisiblePoints = (width) => {
      setVisibleTimelinePoints(calculateVisibleTimelinePoints(width, timelineData.length));
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateVisiblePoints(entry.contentRect.width);
      }
    });

    observer.observe(timelineChartRef.current);
    updateVisiblePoints(timelineChartRef.current.clientWidth);

    return () => observer.disconnect();
  }, [timelineData]);

  const visibleTimelineData = timelineData.slice(-visibleTimelinePoints);
  const maxVisibleValue = Math.max(...visibleTimelineData.map(({ value }) => value));
  const yAxisStep = Math.max(1, Math.ceil(maxVisibleValue / 3));
  const chartMaxValue = yAxisStep * 3;
  const yAxisTicks = [0, 1, 2, 3].map((multiplier) => yAxisStep * multiplier);

  const handleCloseCongrats = () => {
    if (congratsBadge) {
      const storageKey = getSeenSpecialBadgesKey();
      if (storageKey) {
        try {
          const stored = localStorage.getItem(storageKey);
          const seenIds = stored ? JSON.parse(stored) : [];
          if (!seenIds.includes(congratsBadge.nbadge)) {
            seenIds.push(congratsBadge.nbadge);
            localStorage.setItem(storageKey, JSON.stringify(seenIds));
          }
        } catch {
          // Ignore storage errors
        }
      }
    }

    if (congratsQueue.length > 0) {
      setCongratsBadge(congratsQueue[0]);
      setCongratsQueue((prev) => prev.slice(1));
    } else {
      setCongratsBadge(null);
      setCongratsQueue([]);
    }
  };

  return (
    <Layout>
      <div className="dashboard-consultor-page">
        <div className="dashboard-consultor-header">
          <h1>{t('dashboard_consultor_title')}</h1>
        </div>

        {dashboardStatusMessage && (
          <div className="alert alert-warning py-2" role="status">
            {dashboardStatusMessage}
          </div>
        )}

        <div className="dashboard-consultor-grid">
          <section className="dashboard-card dashboard-timeline-card">
            <div className="dashboard-card-title">{t('dashboard_timeline_badges')}</div>
            <div className="timeline-chart-shell">
              <div className="timeline-axis" aria-hidden="true">
                {yAxisTicks.slice().reverse().map((tick) => (
                  <span key={tick} className="timeline-axis-label">
                    {tick}
                  </span>
                ))}
              </div>

              <div
                ref={timelineChartRef}
                className="timeline-chart"
                aria-label={t('dashboard_timeline_badges')}
                style={{ gridTemplateColumns: `repeat(${visibleTimelineData.length}, minmax(0, 1fr))` }}
              >
                <div className="timeline-grid-lines" aria-hidden="true">
                  {yAxisTicks.map((tick) => (
                    <span
                      key={tick}
                      className="timeline-grid-line"
                      style={{ bottom: `${(tick / chartMaxValue) * 100}%` }}
                    />
                  ))}
                </div>

                {visibleTimelineData.map(({ value, label }) => (
                  <div key={label} className="timeline-column">
                    <div className="timeline-bar-track">
                      <div
                        className="timeline-bar"
                        style={{ height: `${(value / chartMaxValue) * 100}%` }}
                      />
                    </div>
                    <span className="timeline-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="dashboard-stats-grid">
            {dashboardStats.map((item) => {
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

          <section className="dashboard-card dashboard-panel-card dashboard-progress-card">
            <div className="dashboard-panel-header">
              <h2>{t('dashboard_in_progress')}</h2>
              <a
                href="#ver-todos-progresso"
                onClick={(event) => {
                  event.preventDefault();
                  setIsProgressModalOpen(true);
                }}
              >
                {t('dashboard_view_all')} <ArrowRight size={16} />
              </a>
            </div>

            <div className="dashboard-list">
              {inProgressItems.map((item) => {
                const ProgressIcon = item.icon;

                return (
                  <article key={`${item.title}-${item.subtitleKey}`} className="dashboard-list-item">
                    <div className={`dashboard-list-badge accent-${item.accent}`}>
                    <Sparkles size={18} strokeWidth={2} />
                  </div>
                  <div className="dashboard-list-content">
                      <strong>{item.title}</strong>
                    <span>{item.subtitle || t(item.subtitleKey)}</span>
                  </div>
                    <div className={`dashboard-list-action accent-${item.accent}`}>
                      <ProgressIcon size={18} strokeWidth={2} />
                  </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="dashboard-card dashboard-panel-card dashboard-suggestions-card">
            <div className="dashboard-panel-header">
              <h2>{t('dashboard_suggestions')}</h2>
              <a
                href="#ver-todos-sugestoes"
                onClick={(event) => {
                  event.preventDefault();
                  setIsSuggestionsModalOpen(true);
                }}
              >
                {t('dashboard_view_all')} <ArrowRight size={16} />
              </a>
            </div>

            <div className="dashboard-list dashboard-suggestions-list">
              {suggestionItems.map(({ title, subtitleKey, accent }) => (
                <article key={`${title}-${subtitleKey}`} className="dashboard-list-item dashboard-suggestion-item">
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

        <SeeMore_PopUp
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          title={t('dashboard_in_progress')}
          items={inProgressItems}
          renderItem={(item) => {
            const ProgressIcon = item.icon || AlertTriangle;

            return (
              <article className="dashboard-list-item">
                <div className={`dashboard-list-badge accent-${item.accent}`}>
                  <Sparkles size={18} strokeWidth={2} />
                </div>
                <div className="dashboard-list-content">
                  <strong>{item.title}</strong>
                  <span>{item.subtitle || t(item.subtitleKey)}</span>
                </div>
                <div className={`dashboard-list-action accent-${item.accent}`}>
                  <ProgressIcon size={18} strokeWidth={2} />
                </div>
              </article>
            );
          }}
          emptyMessage={t('dashboard_empty_progress', 'Sem itens em progresso para mostrar.')}
        />

        <SeeMore_PopUp
          isOpen={isSuggestionsModalOpen}
          onClose={() => setIsSuggestionsModalOpen(false)}
          title={t('dashboard_suggestions')}
          items={suggestionItems}
          renderItem={({ title, subtitleKey, accent }) => (
            <article className="dashboard-list-item dashboard-suggestion-item">
              <div className={`dashboard-list-badge accent-${accent}`}>
                <GraduationCap size={18} strokeWidth={2} />
              </div>
              <div className="dashboard-list-content">
                <strong>{title}</strong>
                <span>{t(subtitleKey)}</span>
              </div>
              <ChevronsRight className="dashboard-item-chevron" size={18} />
            </article>
          )}
          emptyMessage={t('dashboard_empty_suggestions', 'Sem sugestões para mostrar.')}
        />

        <BadgeCongratulationsModal
          isOpen={!!congratsBadge}
          onClose={handleCloseCongrats}
          badge={congratsBadge}
        />
      </div>
    </Layout>
  );
}

export default DashboardC;
