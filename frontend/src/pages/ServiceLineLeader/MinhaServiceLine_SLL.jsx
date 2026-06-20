import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Layout from '../../components/Layout';
import { fetchMyServiceLine } from '../../services/serviceLineLeaderService';
import '../../css/Consultor/LearningPaths_C.css';

const getStoredLoginData = () => {
  const storedLoginData = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');

  if (!storedLoginData) {
    return null;
  }

  try {
    return JSON.parse(storedLoginData);
  } catch {
    return null;
  }
};

function MinhaServiceLineSLL() {
  const loginData = useMemo(() => getStoredLoginData(), []);
  const [serviceLines, setServiceLines] = useState([]);
  const [expandedAreaIds, setExpandedAreaIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadMyServiceLine = async () => {
      const accountId = Number(loginData?.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        if (isMounted) {
          setErrorMessage('Nao foi possivel identificar o utilizador autenticado.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await fetchMyServiceLine(accountId);
        const normalizedServiceLines = Array.isArray(data)
          ? data
          : data
            ? [data]
            : [];

        if (isMounted) {
          setServiceLines(normalizedServiceLines);
          setExpandedAreaIds([]);
          setErrorMessage('');
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error?.message || 'Nao foi possivel carregar a Service Line.');
          setServiceLines([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMyServiceLine();

    return () => {
      isMounted = false;
    };
  }, [loginData]);

  const toggleArea = (areaId) => {
    setExpandedAreaIds((current) =>
      current.includes(areaId) ? current.filter((id) => id !== areaId) : [...current, areaId],
    );
  };

  const calculateProgress = (serviceLine) => {
    const totalLevels = (serviceLine?.areas || []).reduce(
      (total, area) => total + (Array.isArray(area.levels) ? area.levels.length : 0),
      0,
    );

    return {
      totalLevels,
      label: `${totalLevels} niveis disponiveis`,
    };
  };

  return (
    <Layout>
      <div className="page learning-paths-page is-classic">
        <header className="page-header lp-header">
          <div className="lp-header-left">
            <div className="lp-header-copy">
              <h1>Minha Service Line</h1>
            </div>
          </div>
        </header>

        {isLoading && <p className="lp-progress-label">A carregar Service Line...</p>}

        {!isLoading && errorMessage && <p className="lp-progress-label">{errorMessage}</p>}

        {!isLoading && !errorMessage && serviceLines.length > 0 && serviceLines.map((serviceLine) => (
          <section key={serviceLine.id} className="lp-shell lp-shell-surface">
            <article className="lp-path-card">
              <header className="lp-path-banner">
                <h2>{serviceLine.learningPath?.name || 'Learning Path'}</h2>
              </header>

              <div className="lp-section-body">
                <article className="lp-service-line-hero">
                  <img src={serviceLine.image} alt={serviceLine.name} className="lp-service-line-hero-image" />

                  <div className="lp-service-line-hero-content">
                    <h2>{serviceLine.name}</h2>
                    <p>{serviceLine.description}</p>
                    <span className="lp-progress-label">{calculateProgress(serviceLine).label}</span>
                  </div>
                </article>

                <section className="lp-area-shell" aria-label={`Areas da service line ${serviceLine.name}`}>
                  <div className="lp-area-list">
                    {serviceLine.areas.map((area) => {
                      const areaRowId = `${serviceLine.id}-${area.id}`;
                      const isExpanded = expandedAreaIds.includes(areaRowId);

                      return (
                        <article key={areaRowId} className={`lp-area-card ${isExpanded ? 'is-expanded' : ''}`}>
                          <button
                            type="button"
                            className="lp-area-toggle"
                            onClick={() => toggleArea(areaRowId)}
                            aria-expanded={isExpanded}
                            aria-controls={`area-badges-${areaRowId}`}
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
                            <div id={`area-badges-${areaRowId}`} className="lp-area-badges">
                              <div className="lp-area-content-head">
                                <h3>Niveis</h3>
                                <span className="lp-progress-label">{(area.levels || []).length} niveis</span>
                              </div>

                              <div className="lp-level-list">
                                {area.levels.map((level, index) => (
                                  <div
                                    key={`${areaRowId}-${level.id}-${index}`}
                                    className="lp-level-row"
                                    aria-label={`Nivel ${level.title}`}
                                  >
                                    <div className="lp-level-copy">
                                      <strong>{level.title}</strong>
                                      <span>{level.subtitle}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            </article>
          </section>
        ))}
      </div>
    </Layout>
  );
}

export default MinhaServiceLineSLL;
