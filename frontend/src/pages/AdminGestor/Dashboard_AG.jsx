import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Award, Users, FileCheck2, FileText, CheckCircle2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import SeeMore_PopUp from '../../components/SeeMore_PopUp';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchAdminGestorDashboard } from '../../services/dashboardService';
import '../../css/TalentManager/Dashboard_TM.css';
import '../../css/AdminGestor/Dashboard_AG.css';

const BADGES_TIMELINE_DAYS = 12;
const NOVOS_CONSULTORES_DAYS = 10;
const defaultBadgesTimelineValues = Array.from({ length: BADGES_TIMELINE_DAYS }, () => 0);
const defaultNovosConsultoresValues = Array.from({ length: NOVOS_CONSULTORES_DAYS }, () => 0);

const iconByKey = {
  trophy: Trophy,
  award: Award,
  users: Users,
  fileText: FileText,
  checkCircle: CheckCircle2,
  settings: Settings,
};

const buildDailyTimelineData = (values, labelFormat = 'day') => {
  const today = new Date();

  return values.map((value, index) => {
    const daysOffset = values.length - 1 - index;
    const date = new Date(today);
    date.setDate(today.getDate() - daysOffset);

    const label =
      labelFormat === 'day-month'
        ? date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
        : date.toLocaleDateString('pt-PT', { day: '2-digit' });

    return {
      value,
      label,
    };
  });
};

const calculateVisibleTimelinePoints = (containerWidth, totalPoints) => {
  const minColumnWidth = 42;
  const maxPointsByWidth = Math.floor(containerWidth / minColumnWidth);
  return Math.max(4, Math.min(totalPoints, maxPointsByWidth));
};

const buildChartScale = (data) => {
  const maxVisibleValue = Math.max(...data.map(({ value }) => value));
  const yAxisStep = Math.max(1, Math.ceil(maxVisibleValue / 3));
  const chartMaxValue = yAxisStep * 3;
  const yAxisTicks = [0, 1, 2, 3].map((multiplier) => yAxisStep * multiplier);

  return { chartMaxValue, yAxisTicks };
};

function DashboardAG() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badgesChartRef = useRef(null);
  const novosConsultoresChartRef = useRef(null);
  const [badgesTimelineValues, setBadgesTimelineValues] = useState(defaultBadgesTimelineValues);
  const [novosConsultoresValues, setNovosConsultoresValues] = useState(defaultNovosConsultoresValues);
  const [utilizadoresCount, setUtilizadoresCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [topConsultores, setTopConsultores] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [dashboardStatusMessage, setDashboardStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const badgesTimelineData = useMemo(
    () => buildDailyTimelineData(badgesTimelineValues, 'day-month'),
    [badgesTimelineValues],
  );
  const novosConsultoresData = useMemo(
    () => buildDailyTimelineData(novosConsultoresValues, 'day-month'),
    [novosConsultoresValues],
  );
  const [visibleBadgesPoints, setVisibleBadgesPoints] = useState(badgesTimelineData.length);
  const [visibleNovosConsultoresPoints, setVisibleNovosConsultoresPoints] = useState(novosConsultoresData.length);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const data = await fetchAdminGestorDashboard();
        
        if (!isMounted) {
          return;
        }

        setBadgesTimelineValues(
          Array.isArray(data.badgesTimelineValues) && data.badgesTimelineValues.length > 0
            ? data.badgesTimelineValues.map((value) => Number(value) || 0)
            : defaultBadgesTimelineValues,
        );

        setNovosConsultoresValues(
          Array.isArray(data.novosConsultoresValues) && data.novosConsultoresValues.length > 0
            ? data.novosConsultoresValues.map((value) => Number(value) || 0)
            : defaultNovosConsultoresValues,
        );

        setUtilizadoresCount(Number(data.consultoresCount) || 0);
        setPendingRequests(Number(data.pendingRequests) || 0);
        setTopConsultores(Array.isArray(data.topConsultores) ? data.topConsultores : []);
        setRecentActivities(Array.isArray(data.recentActivities) ? data.recentActivities : []);

        setDashboardStatusMessage('');
        setIsLoading(false);
      } catch {
        if (isMounted) {
          setDashboardStatusMessage(t('dashboard_load_error'));
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const observers = [];

    if (badgesChartRef.current) {
      const updateBadgesPoints = (width) => {
        setVisibleBadgesPoints(calculateVisibleTimelinePoints(width, badgesTimelineData.length));
      };

      const badgesObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          updateBadgesPoints(entry.contentRect.width);
        }
      });

      badgesObserver.observe(badgesChartRef.current);
      updateBadgesPoints(badgesChartRef.current.clientWidth);
      observers.push(badgesObserver);
    }

    if (novosConsultoresChartRef.current) {
      const updateNovosConsultoresPoints = (width) => {
        setVisibleNovosConsultoresPoints(calculateVisibleTimelinePoints(width, novosConsultoresData.length));
      };

      const novosConsultoresObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          updateNovosConsultoresPoints(entry.contentRect.width);
        }
      });

      novosConsultoresObserver.observe(novosConsultoresChartRef.current);
      updateNovosConsultoresPoints(novosConsultoresChartRef.current.clientWidth);
      observers.push(novosConsultoresObserver);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [badgesTimelineData, novosConsultoresData]);

  const visibleBadgesData = badgesTimelineData.slice(-visibleBadgesPoints);
  const visibleNovosConsultoresData = novosConsultoresData.slice(-visibleNovosConsultoresPoints);
  const badgesScale = buildChartScale(visibleBadgesData);
  const novosConsultoresScale = buildChartScale(visibleNovosConsultoresData);

  const badgesLinePoints = visibleBadgesData.map(({ value }, index) => {
    const xPercentage =
      visibleBadgesData.length === 1 ? 50 : ((index + 0.5) / visibleBadgesData.length) * 100;
    const yPercentage = 100 - (value / badgesScale.chartMaxValue) * 100;

    return { xPercentage, yPercentage };
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page dashboard-tm dashboard-ag-theme">
        <header className="page-header dashboard-tm-header">
          <h1>{t('dashboard_ag_title')}</h1>
        </header>

        <div className="dashboard-tm-content">
          {dashboardStatusMessage && (
            <div className="alert alert-warning py-2" role="status">
              {dashboardStatusMessage}
            </div>
          )}

          <div className="row g-3 align-items-stretch metrics-container">
            <div className="col-12 col-lg-6 col-xl-5 d-flex tm-top-chart-col">
              <section className="metric-card metric-card-large h-100 w-100">
                <div className="metric-card-title">{t('dashboard_total_badge_requests')}</div>
                <div className="tm-chart-shell">
                  <div className="tm-chart-axis" aria-hidden="true">
                    {badgesScale.yAxisTicks.slice().reverse().map((tick) => (
                      <span key={tick} className="tm-chart-axis-label">{tick}</span>
                    ))}
                  </div>

                  <div
                    ref={badgesChartRef}
                    className="tm-chart tm-line-chart-grid"
                    style={{ gridTemplateColumns: `repeat(${visibleBadgesData.length}, minmax(0, 1fr))` }}
                  >
                    <div className="tm-chart-grid-lines" aria-hidden="true">
                      {badgesScale.yAxisTicks.map((tick) => (
                        <span
                          key={tick}
                          className="tm-chart-grid-line"
                          style={{ bottom: `${(tick / badgesScale.chartMaxValue) * 100}%` }}
                        />
                      ))}
                    </div>

                    <svg
                      className="tm-line-path-svg"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <polyline
                        points={badgesLinePoints.map((_, index) => {
                          const xPoint = badgesLinePoints[index].xPercentage;
                          const yPoint = badgesLinePoints[index].yPercentage;
                          return `${xPoint},${yPoint}`;
                        }).join(' ')}
                        className="tm-line-polyline"
                      />
                    </svg>

                    {visibleBadgesData.map(({ label }, index) => (
                      <div key={`${label}-${index}`} className="tm-chart-column">
                        <div className="tm-line-value-track" aria-hidden="true" />
                        <span className="tm-chart-label tm-line-day-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-lg-6 col-xl-2 d-flex tm-top-grid-col">
              <div className="tm-stats-grid w-100">
                <section className="metric-card metric-card-stat">
                  <div className="metric-card-title">{t('users_title')}</div>
                  <div className="metric-stat-body">
                    <span className="metric-stat-icon">
                      <Users size={36} strokeWidth={2} />
                    </span>
                    <strong>{utilizadoresCount}</strong>
                  </div>
                </section>

                <section className="metric-card metric-card-stat">
                  <div className="metric-card-title">{t('dashboard_pending_review')}</div>
                  <div className="metric-stat-body">
                    <span className="metric-stat-icon">
                      <FileCheck2 size={36} strokeWidth={2} />
                    </span>
                    <strong>{pendingRequests}</strong>
                  </div>
                </section>
              </div>
            </div>

            <div className="col-12 col-lg-12 col-xl-5 d-flex tm-top-chart-col">
              <section className="metric-card metric-card-large h-100 w-100">
                <div className="metric-card-title">{t('dashboard_new_consultors')}</div>
                <div className="tm-chart-shell">
                  <div className="tm-chart-axis" aria-hidden="true">
                    {novosConsultoresScale.yAxisTicks.slice().reverse().map((tick) => (
                      <span key={tick} className="tm-chart-axis-label">{tick}</span>
                    ))}
                  </div>

                  <div
                    ref={novosConsultoresChartRef}
                    className="tm-chart"
                    style={{ gridTemplateColumns: `repeat(${visibleNovosConsultoresData.length}, minmax(0, 1fr))` }}
                  >
                    <div className="tm-chart-grid-lines" aria-hidden="true">
                      {novosConsultoresScale.yAxisTicks.map((tick) => (
                        <span
                          key={tick}
                          className="tm-chart-grid-line"
                          style={{ bottom: `${(tick / novosConsultoresScale.chartMaxValue) * 100}%` }}
                        />
                      ))}
                    </div>

                    {visibleNovosConsultoresData.map(({ value, label }) => (
                      <div key={label} className="tm-chart-column">
                        <div className="tm-chart-bar-track">
                          <div
                            className="tm-chart-bar"
                            style={{ height: `${(value / novosConsultoresScale.chartMaxValue) * 100}%` }}
                          />
                        </div>
                        <span className="tm-chart-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="row g-3 align-items-stretch tm-lower-grid">
            <div className="col-12 col-lg-6 d-flex">
              <section className="consultores-section h-100 w-100">
                <div className="section-header">
                  <h2>{t('dashboard_top_consultors')}</h2>
                  <a
                    href="#consultores"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/admin-gestor/utilizadores');
                    }}
                  >
                    {t('dashboard_view_all')}
                  </a>
                </div>
                <div className="consultores-grid">
                  {topConsultores.map((consultor) => {
                    return (
                      <div key={consultor.id} className="consultor-card">
                        <div className="consultor-header">
                          <div className="consultor-avatar">
                            <img
                              src={consultor.avatar || `/avatars/default-avatar.svg`}
                              alt={consultor.name}
                              className="consultor-avatar-img"
                              onError={(e) => { e.currentTarget.src = `/avatars/default-avatar.svg`; }}
                            />
                          </div>
                          <div className="consultor-info">
                            <div className="consultor-name">
                              {consultor.name}
                            </div>
                            <div className="consultor-email">{consultor.email}</div>
                          </div>
                        </div>
                        <div className="consultor-stats">
                          <div className="stat">
                            <span className="stat-label">{t('dashboard_rank')}</span>
                            <span className="stat-value">#{consultor.rank}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">{t('dashboard_points_short')}</span>
                            <span className="stat-value">{consultor.points}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">{t('dashboard_badges_short')}</span>
                            <span className="stat-value">{consultor.badges}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topConsultores.length === 0 && (
                    <div className="text-muted">{t('dashboard_no_consultor_data')}</div>
                  )}
                </div>
              </section>
            </div>

            <div className="col-12 col-lg-6 d-flex">
              <section className="activities-section h-100 w-100">
                <div className="section-header">
                  <h2>{t('dashboard_activities_title_ag')}</h2>
                  <a
                    href="#atividades"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsActivitiesModalOpen(true);
                    }}
                  >
                    {t('dashboard_view_all')}
                  </a>
                </div>
                <div className="activities-list">
                  {recentActivities.map((activity) => {
                    const IconComponent = iconByKey[activity.iconKey] || FileText;
                    return (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          <IconComponent size={20} />
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-time">{activity.timeframe}</div>
                        </div>
                        {activity.points && <div className="activity-points">{activity.points}</div>}
                      </div>
                    );
                  })}
                  {recentActivities.length === 0 && (
                    <div className="text-muted">{t('dashboard_no_activities')}</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <SeeMore_PopUp
          isOpen={isActivitiesModalOpen}
          onClose={() => setIsActivitiesModalOpen(false)}
          title={t('dashboard_activities_title_ag')}
          items={recentActivities}
          renderItem={(activity) => {
            const IconComponent = iconByKey[activity.iconKey] || FileText;

            return (
              <div className="activity-item" style={{ marginBottom: 0 }}>
                <div className="activity-icon">
                  <IconComponent size={20} />
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.timeframe}</div>
                </div>
                {activity.points && <div className="activity-points">{activity.points}</div>}
              </div>
            );
          }}
          emptyMessage={t('dashboard_no_activities')}
        />
      </div>
    </Layout>
  );
}

export default DashboardAG;
