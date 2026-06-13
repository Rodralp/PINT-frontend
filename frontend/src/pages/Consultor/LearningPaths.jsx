import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  SearchCheck,
  TimerReset,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { fetchLearningPaths } from '../../services/consultorService';
import '../../css/Consultor/LearningPaths_C.css';

const statusConfig = {
  obtido: {
    label: 'Badge obtido',
    className: 'status-obtido',
    Icon: CheckCircle2,
  },
  candidatura_em_progresso: {
    label: 'Candidatura em progresso',
    className: 'status-progresso',
    Icon: TimerReset,
  },
  'pendente-tm': {
    label: 'Em Validacao',
    className: 'status-validacao',
    Icon: SearchCheck,
  },
  'pendente-sll': {
    label: 'Em Validacao',
    className: 'status-validacao',
    Icon: SearchCheck,
  },
  evidencias_insuficientes: {
    label: 'Evidencias insuficientes',
    className: 'status-insuficiente',
    Icon: AlertTriangle,
  },
  visualizar: {
    label: 'Visualizar',
    className: 'status-visualizar',
    Icon: null,
  },
  sem_badge: {
    label: 'Sem badge associado',
    className: 'status-sem-badge',
    Icon: AlertTriangle,
  },
};

const flattenServiceLineLevels = (serviceLine) =>
  (serviceLine?.areas || []).flatMap((area) => area.levels || []);

const calculateProgress = (levels) => {
  const total = levels.length;
  const obtidas = levels.filter((level) => level.status === 'obtido').length;
  const isComplete = total > 0 && obtidas === total;
  const percent = total > 0 ? Math.round((obtidas / total) * 100) : 0;

  return {
    total,
    obtidas,
    isComplete,
    percent,
    label: isComplete ? 'Area Completada' : `${obtidas} de ${total} badges obtidas`,
  };
};

function LearningPaths() {
  const navigate = useNavigate();
  const location = useLocation();
  const [learningPathsData, setLearningPathsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPathId, setSelectedPathId] = useState(
    () => (
      typeof location.state?.selectedPathId === 'string'
        ? location.state.selectedPathId
        : null
    ),
  );
  const [expandedPathIds, setExpandedPathIds] = useState(
    () => (Array.isArray(location.state?.expandedPathIds) ? location.state.expandedPathIds : []),
  );
  const [selectedServiceLineId, setSelectedServiceLineId] = useState(
    () => (typeof location.state?.selectedServiceLineId === 'string' ? location.state.selectedServiceLineId : null),
  );
  const [expandedAreaIds, setExpandedAreaIds] = useState(
    () => (Array.isArray(location.state?.expandedAreaIds) ? location.state.expandedAreaIds : []),
  );

  const selectedPath = useMemo(
    () => learningPathsData.find((item) => item.id === selectedPathId) || learningPathsData[0],
    [learningPathsData, selectedPathId],
  );

  const selectedServiceLine = useMemo(() => {
    if (!selectedPath || !selectedServiceLineId) {
      return null;
    }

    return selectedPath.serviceLines.find((item) => item.id === selectedServiceLineId) || null;
  }, [selectedPath, selectedServiceLineId]);

  const pageTitle = selectedServiceLine ? 'Service Line' : 'Learning Paths';

  useEffect(() => {
    let isMounted = true;

    const loadLearningPaths = async () => {
      try {
        const data = await fetchLearningPaths();

        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLearningPathsData(data);
          setErrorMessage('');
        } else if (isMounted) {
          setLearningPathsData([]);
          setErrorMessage('Nao existem Learning Paths disponiveis para este utilizador.');
        }
      } catch (error) {
        console.error('Failed to load learning paths:', error);
        if (isMounted) {
          setLearningPathsData([]);
          setErrorMessage('Nao foi possivel carregar os Learning Paths da base de dados.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLearningPaths();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!learningPathsData.length) {
      return;
    }

    const hasSelectedPath = learningPathsData.some((item) => item.id === selectedPathId);
    if (!hasSelectedPath) {
      setSelectedPathId(learningPathsData[0].id);
    }
  }, [learningPathsData, selectedPathId]);

  const handleGoBack = () => {
    setSelectedServiceLineId(null);
    setExpandedAreaIds([]);
  };

  const selectServiceLine = (pathId, serviceLineId) => {
    setSelectedPathId(pathId);
    setSelectedServiceLineId(serviceLineId);
    setExpandedAreaIds([]);
    setExpandedPathIds((current) => Array.from(new Set([...current, pathId])));
  };

  const toggleLearningPath = (pathId) => {
    setExpandedPathIds((current) =>
      current.includes(pathId) ? current.filter((id) => id !== pathId) : [...current, pathId],
    );
  };

  const toggleArea = (areaId) => {
    setExpandedAreaIds((current) =>
      current.includes(areaId) ? current.filter((id) => id !== areaId) : [...current, areaId],
    );
  };

  const openBadgeDetails = (area, level) => {
    const badgeId = `${area.id}-${level.id}`;
    const badgeDbId = Number(level?.badgeDbId);
    if (!Number.isInteger(badgeDbId) || badgeDbId <= 0) {
      return;
    }
    const routeBadgeId = Number.isInteger(badgeDbId) && badgeDbId > 0
      ? String(badgeDbId)
      : badgeId;
    const backToState = {
      selectedPathId,
      selectedServiceLineId,
      expandedPathIds,
      expandedAreaIds: Array.from(new Set([...expandedAreaIds, area.id])),
    };

    navigate(`/consultor/badge/${encodeURIComponent(routeBadgeId)}`, {
      state: {
        badge: {
          id: badgeId,
          area: area.name,
          serviceLineName: selectedServiceLine?.name || 'Service Line',
          learningPathName: selectedPath?.name || 'Learning Path',
          levelKey: level.levelKey,
          points: level.points,
          badgeImage: level.badgeImage,
          badgeDbId: level.badgeDbId || null,
          requestId: Number(level.requestId) || null,
          requirements: Array.isArray(level.requirements) ? level.requirements : [],
          status: level.status || 'visualizar',
          date: '12 Jan 2026',
        },
        backTo: '/consultor/learning-paths',
        backToState,
      },
    });
  };

  const renderLearningPathView = () => {
    if (!learningPathsData.length) {
      return null;
    }

    return (
      <section className="lp-shell">
        <div className="lp-area-list lp-learning-path-list">
          {learningPathsData.map((path) => {
            const isExpanded = expandedPathIds.includes(path.id);

            return (
              <article key={path.id} className={`lp-area-card lp-learning-path-card ${isExpanded ? 'is-expanded' : ''}`}>
                <button
                  type="button"
                  className="lp-area-toggle"
                  onClick={() => toggleLearningPath(path.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`learning-path-${path.id}`}
                >
                  <div className="lp-path-banner lp-learning-path-banner">
                    <h2>{path.name}</h2>
                    <div className="lp-area-banner-actions">
                      <ChevronDown
                        size={20}
                        className={`lp-area-chevron ${isExpanded ? 'is-open' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div id={`learning-path-${path.id}`} className="lp-area-badges">
                    <div className="lp-section-title-row">
                      <h3>Service Lines</h3>
                    </div>

                    <div className="lp-service-line-list">
                      {path.serviceLines.map((serviceLine) => {
                        const progress = calculateProgress(flattenServiceLineLevels(serviceLine));

                        return (
                          <button
                            key={serviceLine.id}
                            type="button"
                            className="lp-service-line-card"
                            onClick={() => selectServiceLine(path.id, serviceLine.id)}
                          >
                            <div className="lp-service-line-head">
                              <strong>{serviceLine.name}</strong>
                              <ChevronRight size={24} className="lp-go-icon" aria-hidden="true" />
                            </div>

                            <div className="lp-service-line-body">
                              <img src={serviceLine.image} alt={serviceLine.name} className="lp-service-line-image" />

                              <div className="lp-service-line-main">
                                <p>{serviceLine.description}</p>
                                <span className="lp-progress-label">{progress.label}</span>

                                <div className="lp-progress-track" aria-hidden="true">
                                  <span
                                    className={`lp-progress-fill ${progress.isComplete ? 'is-success' : 'is-primary'}`}
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  const renderServiceLineView = () => {
    if (!selectedServiceLine) {
      return null;
    }

    const selectedServiceLineProgress = calculateProgress(flattenServiceLineLevels(selectedServiceLine));

    return (
      <section className="lp-shell lp-shell-surface">
        <article className="lp-service-line-hero">
          <img src={selectedServiceLine.image} alt={selectedServiceLine.name} className="lp-service-line-hero-image" />

          <div className="lp-service-line-hero-content">
            <h2>{selectedServiceLine.name}</h2>
            <p>{selectedServiceLine.description}</p>

            <span className="lp-progress-label">{selectedServiceLineProgress.label}</span>
            <div className="lp-progress-track" aria-hidden="true">
              <span
                className={`lp-progress-fill ${selectedServiceLineProgress.isComplete ? 'is-success' : 'is-primary'}`}
                style={{ width: `${selectedServiceLineProgress.percent}%` }}
              />
            </div>
          </div>
        </article>

        <section className="lp-area-shell" aria-label={`Areas da service line ${selectedServiceLine.name}`}>
          <div className="lp-area-list">
            {selectedServiceLine.areas.map((area) => {
              const isExpanded = expandedAreaIds.includes(area.id);
              const progress = calculateProgress(area.levels || []);

              return (
                <article key={area.id} className={`lp-area-card ${isExpanded ? 'is-expanded' : ''}`}>
                  <button
                    type="button"
                    className="lp-area-toggle"
                    onClick={() => toggleArea(area.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`area-badges-${area.id}`}
                  >
                    <div className="lp-area-banner">
                      <strong>{area.name}</strong>

                      <div className="lp-area-banner-actions">
                        <ChevronDown
                          size={20}
                          className={`lp-area-chevron ${isExpanded ? 'is-open' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div id={`area-badges-${area.id}`} className="lp-area-badges">
                      <div className="lp-area-content-head">
                        <h3>Niveis</h3>
                        <span className="lp-progress-label">{progress.label}</span>
                      </div>

                      <div className="lp-level-list">
                        {area.levels.map((level) => {
                          const hasBadge = Number.isInteger(Number(level?.badgeDbId)) && Number(level.badgeDbId) > 0;
                          const status = hasBadge
                            ? statusConfig[level.status] || statusConfig.visualizar
                            : statusConfig.sem_badge;
                          const StatusIcon = status.Icon;

                          return (
                            <button
                              key={`${area.id}-${level.id}`}
                              type="button"
                              className={`lp-level-row lp-level-row-action ${hasBadge ? '' : 'is-disabled'}`}
                              onClick={() => openBadgeDetails(area, level)}
                              disabled={!hasBadge}
                              aria-label={`Ver badge ${level.title}`}
                            >
                              <div className="lp-level-copy">
                                <strong>{level.title}</strong>
                                <span>{level.subtitle}</span>
                              </div>

                              <span className={`lp-level-status ${status.className}`}>
                                {StatusIcon ? <StatusIcon size={16} /> : null}
                                {status.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    );
  };

  return (
    <Layout>
      <div className="learning-paths-page is-classic">
        <header className="lp-header">
          <div className="lp-header-left">
            {selectedServiceLine && (
              <button type="button" className="lp-back-btn" onClick={handleGoBack} aria-label="Voltar">
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="lp-header-copy">
              <h1>{pageTitle}</h1>
            </div>
          </div>
        </header>

        {isLoading && <p className="lp-progress-label">A carregar Learning Paths...</p>}
        {!isLoading && errorMessage && <p className="lp-progress-label">{errorMessage}</p>}

        {!isLoading && !errorMessage && !selectedServiceLine && renderLearningPathView()}
        {!errorMessage && selectedServiceLine && renderServiceLineView()}
      </div>
    </Layout>
  );
}

export default LearningPaths;
