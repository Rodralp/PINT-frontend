import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchPreferenceAreas, saveUserPreferences } from '../../services/consultorService';
import '../../css/Consultor/Preferencias_C.css';

const DASHBOARD_PATH = '/consultor/dashboard';
const PREFERENCES_PATH = '/consultor/preferencias';

const resolveNextPath = (fromPath) => {
  if (typeof fromPath !== 'string') {
    return DASHBOARD_PATH;
  }

  if (!fromPath.startsWith('/consultor/') || fromPath === PREFERENCES_PATH) {
    return DASHBOARD_PATH;
  }

  return fromPath;
};

function Preferencias() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAreas = async () => {
      try {
        const response = await fetchPreferenceAreas();
        if (!isMounted) {
          return;
        }

        const normalizedAreas = Array.isArray(response) ? response : [];
        setAreas(normalizedAreas);
        setSelectedAreaIds(
          normalizedAreas
            .filter((area) => area.selected)
            .map((area) => Number(area.id))
            .filter((id) => Number.isInteger(id) && id > 0),
        );
        setStatusMessage('');
      } catch {
        if (isMounted) {
          setStatusMessage(t('preferences_error_load'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAreas();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const filteredAreas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return areas;
    }

    return areas.filter((area) => {
      const searchable = `${area.name || ''} ${area.description || ''} ${area.serviceLine || ''}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [areas, searchTerm]);

  const toggleAreaSelection = (areaId) => {
    setSelectedAreaIds((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    );
    setStatusMessage('');
  };

  const handleCardKeyDown = (event, areaId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAreaSelection(areaId);
    }
  };

  const handleContinue = async () => {
    if (selectedAreaIds.length === 0) {
      setStatusMessage(t('preferences_error_min_selection'));
      return;
    }

    setIsSaving(true);
    try {
      await saveUserPreferences(selectedAreaIds);
      navigate(resolveNextPath(location.state?.from), { replace: true });
    } catch {
      setStatusMessage(t('preferences_error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('preferences_loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="preferences-page">
        <main className="preferences-main">
        <section className="preferences-panel">
          <header className="preferences-header">
            <h1>{t('preferences_title')}</h1>
            <p>{t('preferences_subtitle')}</p>
            <span>{t('preferences_hint')}</span>
          </header>

          <div className="preferences-search-wrap">
            <Search size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('preferences_search_placeholder')}
              aria-label={t('preferences_search_placeholder')}
            />
          </div>

          {statusMessage && (
            <div className="preferences-status" role="status">
              {statusMessage}
            </div>
          )}

          <div className="preferences-grid">
            {filteredAreas.map((area) => {
              const areaId = Number(area.id);
              const isSelected = selectedAreaIds.includes(areaId);

              return (
                <article
                  key={areaId}
                  className={`preferences-card ${isSelected ? 'is-selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAreaSelection(areaId)}
                  onKeyDown={(event) => handleCardKeyDown(event, areaId)}
                >
                  <div className="preferences-card-head">
                    <div className="preferences-card-title-group">
                      <strong>{area.name}</strong>
                      <span>{area.serviceLine || '-'}</span>
                    </div>
                    <CheckCircle2 size={22} className={`preferences-card-check ${isSelected ? 'is-visible' : ''}`} />
                  </div>

                  <p>{area.description || '-'}</p>

                  <footer>{t('preferences_badges_count', { count: Number(area.badgeCount) || 0 })}</footer>
                </article>
              );
            })}

            {filteredAreas.length === 0 && (
              <div className="preferences-empty">{t('preferences_empty')}</div>
            )}
          </div>

          <div className="preferences-footer">
            <span>{t('preferences_selected_count', { count: selectedAreaIds.length })}</span>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading || isSaving}
            >
              {isSaving ? t('preferences_loading') : t('preferences_continue')}
            </button>
          </div>
        </section>
      </main>
    </div>
    </Layout>
  );
}

export default Preferencias;
