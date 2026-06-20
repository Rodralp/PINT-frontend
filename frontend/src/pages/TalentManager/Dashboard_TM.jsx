import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Award, Users, FileCheck2, FileText, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/Layout';
import SeeMore_PopUp from '../../components/SeeMore_PopUp';
import { fetchTalentManagerDashboard } from '../../services/dashboardService';
import '../../css/TalentManager/Dashboard_TM.css';

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

function DashboardTM() {
  const badgesChartRef = useRef(null);
  const novosConsultoresChartRef = useRef(null);
  const [badgesTimelineValues, setBadgesTimelineValues] = useState(defaultBadgesTimelineValues);
  const [novosConsultoresValues, setNovosConsultoresValues] = useState(defaultNovosConsultoresValues);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [topConsultores, setTopConsultores] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [dashboardStatusMessage, setDashboardStatusMessage] = useState('');
  const [isTopConsultoresModalOpen, setIsTopConsultoresModalOpen] = useState(false);
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
        const data = await fetchTalentManagerDashboard();
        
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

        setOnlineUsers(Number(data.onlineUsers) || 0);
        setPendingRequests(Number(data.pendingRequests) || 0);
        setTopConsultores(Array.isArray(data.topConsultores) ? data.topConsultores : []);
        setRecentActivities(Array.isArray(data.recentActivities) ? data.recentActivities : []);

        setDashboardStatusMessage('');
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
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

  return (
    <Layout>
      <div className="page dashboard-tm">
        <header className="page-header dashboard-tm-header">
          <h1>Dashboard Talent Manager</h1>
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
                <div className="metric-card-title">Numero de Pedidos de Badges</div>
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
                  <div className="metric-card-title">Utilizadores Online</div>
                  <div className="metric-stat-body">
                    <span className="metric-stat-icon">
                      <Users size={36} strokeWidth={2} />
                    </span>
                    <strong>{onlineUsers}</strong>
                  </div>
                </section>

                <section className="metric-card metric-card-stat">
                  <div className="metric-card-title">Pedidos a Verificar</div>
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
                <div className="metric-card-title">Novos Consultores</div>
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
                  <h2>Top Consultores</h2>
                  <a
                    href="#consultores"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTopConsultoresModalOpen(true);
                    }}
                  >
                    Ver todos
                  </a>
                </div>
                <div className="consultores-grid">
                  {topConsultores.map((consultor) => {
                    return (
                      <div key={consultor.id} className="consultor-card">
                        <div className="consultor-header">
                          <div className="consultor-avatar">
                            {consultor.avatar ? (
                              <img src={consultor.avatar} alt={consultor.name} className="consultor-avatar-img" />
                            ) : (
                              <Users size={24} className="icon-color" />
                            )}
                          </div>
                          <div className="consultor-info">
                            <div className="consultor-name">
                              <span className="consultor-rank">#{consultor.rank}</span>
                              {consultor.name}
                            </div>
                            <div className="consultor-email">{consultor.email}</div>
                          </div>
                        </div>
                        <div className="consultor-stats">
                          <div className="stat">
                            <span className="stat-label">Pontos</span>
                            <span className="stat-value">{consultor.points}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Badges</span>
                            <span className="stat-value">{consultor.badges}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topConsultores.length === 0 && (
                    <div className="text-muted">Sem dados de consultores para apresentar.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="col-12 col-lg-6 d-flex">
              <section className="activities-section h-100 w-100">
                <div className="section-header">
                  <h2>Atividades Recentes (Talent Manager)</h2>
                  <a
                    href="#atividades"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsActivitiesModalOpen(true);
                    }}
                  >
                    Ver todos
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
                    <div className="text-muted">Sem atividades recentes para apresentar.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <SeeMore_PopUp
          isOpen={isTopConsultoresModalOpen}
          onClose={() => setIsTopConsultoresModalOpen(false)}
          title="Top Consultores"
          items={topConsultores}
          renderItem={(consultor) => {
            return (
              <div className="consultor-card" style={{ marginBottom: 0 }}>
                <div className="consultor-header">
                  <div className="consultor-avatar">
                    {consultor.avatar ? (
                      <img src={consultor.avatar} alt={consultor.name} className="consultor-avatar-img" />
                    ) : (
                      <Users size={24} className="icon-color" />
                    )}
                  </div>
                  <div className="consultor-info">
                    <div className="consultor-name">
                      <span className="consultor-rank">#{consultor.rank}</span>
                      {consultor.name}
                    </div>
                    <div className="consultor-email">{consultor.email}</div>
                  </div>
                </div>
                <div className="consultor-stats">
                  <div className="stat">
                    <span className="stat-label">Pontos</span>
                    <span className="stat-value">{consultor.points}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Badges</span>
                    <span className="stat-value">{consultor.badges}</span>
                  </div>
                </div>
              </div>
            );
          }}
          emptyMessage="Sem dados de consultores para apresentar."
        />

        <SeeMore_PopUp
          isOpen={isActivitiesModalOpen}
          onClose={() => setIsActivitiesModalOpen(false)}
          title="Atividades Recentes (Talent Manager)"
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
          emptyMessage="Sem atividades recentes para apresentar."
        />
      </div>
    </Layout>
  );
}

export default DashboardTM;
