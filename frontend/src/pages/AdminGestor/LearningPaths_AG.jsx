import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, ChevronRight, Eye, EyeOff, FileText, Folder, FolderOpen, Pencil, Plus, X } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  fetchAdminLearningPaths,
  createAdminLearningPath,
  updateAdminLearningPath,
  updateAdminLearningPathStatus,
  createAdminServiceLine,
  updateAdminServiceLine,
  updateAdminServiceLineStatus,
  createAdminArea,
  updateAdminArea,
  updateAdminAreaStatus,
  createAdminLevel,
  updateAdminLevel,
  updateAdminLevelStatus,
} from '../../services/adminLearningPathService';
import '../../css/Consultor/LearningPaths_C.css';
import '../../css/AdminGestor/LearningPaths_AG.css';

const getEntityLabel = (type, t) => {
  const labels = {
    learningPath: t('learning_paths_entity_lp'),
    serviceLine: t('learning_paths_entity_sl'),
    area: t('learning_paths_entity_area'),
    level: t('learning_paths_entity_level'),
  };
  return labels[type] || type;
};

const SIDEBAR_WIDTH_STORAGE_KEY = 'lp-admin-explorer-sidebar-width';
const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 560;
const MAX_EDITOR_IMAGE_SIZE_BYTES = 1_500_000;

const clampSidebarWidth = (value) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));

const buildAreaRowId = (serviceLineId, areaId) => `${serviceLineId}-${areaId}`;

const normalizeText = (value) => String(value || '').trim();

const getNumericId = (value) => {
  const parts = String(value || '').split('-');
  const parsed = Number(parts[parts.length - 1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildEntityId = (prefix, numericId) => `${prefix}-${numericId}`;

const getStatusLabel = (isActive, t) => (isActive ? t('learning_paths_status_active') : t('learning_paths_status_inactive'));

const buildEditorForm = (type, entity) => {
  switch (type) {
    case 'learningPath':
      return {
        name: entity?.name || '',
        description: entity?.description || '',
      };
    case 'serviceLine':
      return {
        name: entity?.name || '',
        description: entity?.description || '',
        image: entity?.image || '/LP_BG.png',
      };
    case 'area':
      return {
        name: entity?.name || '',
        description: entity?.description || '',
      };
    case 'level':
      return {
        title: entity?.title || '',
      };
    default:
      return {};
  }
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error());
  reader.readAsDataURL(file);
});

const getEditorEntity = (paths, editor) => {
  if (!editor) {
    return null;
  }

  const path = paths.find((item) => item.id === editor.pathId);

  if (editor.type === 'learningPath') {
    return path || null;
  }

  const serviceLine = path?.serviceLines?.find((item) => item.id === editor.serviceLineId);

  if (editor.type === 'serviceLine') {
    return serviceLine || null;
  }

  const area = serviceLine?.areas?.find((item) => item.id === editor.areaId);

  if (editor.type === 'area') {
    return area || null;
  }

  const level = area?.levels?.find((item) => item.id === editor.levelId);
  return level || null;
};

function LearningPathsAG() {
  const { t } = useTranslation();
  const [learningPathsData, setLearningPathsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return SIDEBAR_DEFAULT_WIDTH;
    }

    const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    return Number.isFinite(storedWidth) ? clampSidebarWidth(storedWidth) : SIDEBAR_DEFAULT_WIDTH;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [selectedServiceLineId, setSelectedServiceLineId] = useState(null);
  const [expandedPathIds, setExpandedPathIds] = useState([]);
  const [expandedAreaIds, setExpandedAreaIds] = useState([]);
  const [editor, setEditor] = useState(null);
  const [editorForm, setEditorForm] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState('');
  const resizeStateRef = useRef({
    startX: 0,
    startWidth: SIDEBAR_DEFAULT_WIDTH,
  });

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

  const pageTitle = selectedServiceLine ? t('learning_paths_entity_sl') : 'Learning Paths';

  const loadLearningPaths = async (options = {}) => {
    setIsLoading(true);

    try {
      const data = await fetchAdminLearningPaths();

      if (Array.isArray(data) && data.length > 0) {
        setLearningPathsData(data);
        setErrorMessage('');
        setStatusActionError('');

        if (Object.prototype.hasOwnProperty.call(options, 'pathId')) {
          setSelectedPathId(options.pathId);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'serviceLineId')) {
          setSelectedServiceLineId(options.serviceLineId);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'expandedPathIds')) {
          setExpandedPathIds(options.expandedPathIds || []);
        }

        if (Object.prototype.hasOwnProperty.call(options, 'expandedAreaIds')) {
          setExpandedAreaIds(options.expandedAreaIds || []);
        }
      } else {
        setLearningPathsData([]);
        setErrorMessage(t('learning_paths_no_available'));
      }
    } catch (error) {
      console.error('Failed to load learning paths:', error);
      setLearningPathsData([]);
      setErrorMessage(t('learning_paths_load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLearningPaths();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizingSidebar) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      const { startX, startWidth } = resizeStateRef.current;
      const delta = event.clientX - startX;
      setSidebarWidth(clampSidebarWidth(startWidth + delta));
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingSidebar]);

  useEffect(() => {
    if (!learningPathsData.length) {
      return;
    }

    const hasSelectedPath = learningPathsData.some((item) => item.id === selectedPathId);
    if (!hasSelectedPath) {
      setSelectedPathId(learningPathsData[0].id);
    }
  }, [learningPathsData, selectedPathId]);

  useEffect(() => {
    if (!selectedPath || !selectedServiceLineId) {
      return;
    }

    const hasSelectedServiceLine = selectedPath.serviceLines.some((item) => item.id === selectedServiceLineId);
    if (!hasSelectedServiceLine) {
      setSelectedServiceLineId(null);
      setExpandedAreaIds([]);
    }
  }, [selectedPath, selectedServiceLineId]);

  const handleGoBack = () => {
    setSelectedServiceLineId(null);
    setExpandedAreaIds([]);
  };

  const selectPath = (pathId) => {
    setSelectedPathId(pathId);
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

  const handleToggleEntityStatus = async (payload) => {
    if (isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusActionError('');

    try {
      const nextIsActive = !payload.isActive;
      const nextServiceLineId =
        payload.type === 'serviceLine'
          ? (selectedServiceLine?.id === payload.serviceLineId ? payload.serviceLineId : null)
          : (payload.serviceLineId || selectedServiceLine?.id || null);

      if (payload.type === 'learningPath') {
        const learningPathId = getNumericId(payload.pathId);
        if (!learningPathId) {
          throw new Error(t('learning_paths_invalid_lp'));
        }

        await updateAdminLearningPathStatus(learningPathId, nextIsActive);
      } else if (payload.type === 'serviceLine') {
        const serviceLineId = getNumericId(payload.serviceLineId);
        if (!serviceLineId) {
          throw new Error(t('learning_paths_invalid_sl'));
        }

        await updateAdminServiceLineStatus(serviceLineId, nextIsActive);
      } else if (payload.type === 'area') {
        const areaId = getNumericId(payload.areaId);
        if (!areaId) {
          throw new Error(t('learning_paths_invalid_area'));
        }

        await updateAdminAreaStatus(areaId, nextIsActive);
      } else if (payload.type === 'level') {
        const levelId = getNumericId(payload.levelId);
        if (!levelId) {
          throw new Error(t('learning_paths_invalid_level'));
        }

        await updateAdminLevelStatus(levelId, nextIsActive);
      }

      await loadLearningPaths({
        pathId: payload.pathId || selectedPath?.id || null,
        serviceLineId: nextServiceLineId,
        expandedPathIds,
        expandedAreaIds,
      });
    } catch (error) {
      setStatusActionError(error?.message || t('learning_paths_toggle_error'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSidebarResizeStart = (event) => {
    if (event.button !== 0 || window.matchMedia('(max-width: 991.98px)').matches) {
      return;
    }

    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
    setIsResizingSidebar(true);
  };

  const handleSidebarResizeKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 16 : -16;
    setSidebarWidth((current) => clampSidebarWidth(current + delta));
  };


  const closeEditor = () => {
    setEditor(null);
    setEditorForm(null);
    setEditorError('');
  };

  const openEditor = (payload) => {
    const entity = getEditorEntity(learningPathsData, payload);
    setEditor(payload);
    setEditorForm(buildEditorForm(payload.type, entity));
    setEditorError('');
  };

  const handleEditorImageFileChange = async (event) => {
    const input = event.target;
    const selectedFile = input.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setEditorError('Escolha um ficheiro de imagem valido.');
      input.value = '';
      return;
    }

    if (selectedFile.size > MAX_EDITOR_IMAGE_SIZE_BYTES) {
      setEditorError(t('learning_paths_image_too_large'));
      input.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      setEditorForm((current) => ({
        ...current,
        image: dataUrl,
      }));
      setEditorError('');
    } catch (error) {
      setEditorError(error?.message || t('learning_paths_image_error'));
    } finally {
      input.value = '';
    }
  };

  const clearEditorImage = () => {
    setEditorForm((current) => ({
      ...current,
      image: '/LP_BG.png',
    }));
  };

  const handleSaveEditor = async () => {
    if (!editor || !editorForm || isSaving) {
      return;
    }

    const { type, mode } = editor;
    const trimmedName = normalizeText(editorForm.name);
    const trimmedDescription = normalizeText(editorForm.description);
    const trimmedTitle = normalizeText(editorForm.title);

    if (type !== 'level' && !trimmedName) {
      setEditorError(t('learning_paths_name_required'));
      return;
    }

    if (type === 'level' && !trimmedTitle) {
      setEditorError(t('learning_paths_title_required'));
      return;
    }

    setIsSaving(true);
    setEditorError('');

    try {
      if (type === 'learningPath') {
        if (mode === 'create') {
          const created = await createAdminLearningPath({
            name: trimmedName,
            description: trimmedDescription,
          });
          const newPathId = buildEntityId('learning-path', created.id);
          const nextExpandedPaths = Array.from(new Set([...expandedPathIds, newPathId]));
          await loadLearningPaths({
            pathId: newPathId,
            serviceLineId: null,
            expandedPathIds: nextExpandedPaths,
            expandedAreaIds: [],
          });
          closeEditor();
          return;
        }

        const pathId = getNumericId(editor.pathId);
        if (!pathId) {
          setEditorError(t('learning_paths_invalid_lp'));
          return;
        }

        await updateAdminLearningPath(pathId, {
          name: trimmedName,
          description: trimmedDescription,
        });
        await loadLearningPaths({ pathId: editor.pathId, expandedPathIds });
        closeEditor();
        return;
      }

      if (type === 'serviceLine') {
        const pathId = editor.pathId || selectedPath?.id;
        if (!pathId) {
          setEditorError(t('learning_paths_select_lp'));
          return;
        }

        const numericPathId = getNumericId(pathId);
        if (!numericPathId) {
          setEditorError(t('learning_paths_invalid_lp'));
          return;
        }

        if (mode === 'create') {
          const created = await createAdminServiceLine(numericPathId, {
            name: trimmedName,
            description: trimmedDescription,
            image: editorForm.image || null,
          });
          const newServiceLineId = buildEntityId('service-line', created.id);
          const nextExpandedPaths = Array.from(new Set([...expandedPathIds, pathId]));
          await loadLearningPaths({
            pathId,
            serviceLineId: newServiceLineId,
            expandedPathIds: nextExpandedPaths,
            expandedAreaIds: [],
          });
          closeEditor();
          return;
        }

        const serviceLineId = getNumericId(editor.serviceLineId);
        if (!serviceLineId) {
          setEditorError(t('learning_paths_invalid_sl'));
          return;
        }

        await updateAdminServiceLine(serviceLineId, {
          name: trimmedName,
          description: trimmedDescription,
          image: editorForm.image || null,
        });
        await loadLearningPaths({ pathId, serviceLineId: editor.serviceLineId, expandedPathIds });
        closeEditor();
        return;
      }

      if (type === 'area') {
        const pathId = editor.pathId || selectedPath?.id;
        const serviceLineId = editor.serviceLineId || selectedServiceLine?.id;

        if (!pathId || !serviceLineId) {
          setEditorError(t('learning_paths_select_sl'));
          return;
        }

        const numericServiceLineId = getNumericId(serviceLineId);
        if (!numericServiceLineId) {
          setEditorError(t('learning_paths_invalid_sl'));
          return;
        }

        if (mode === 'create') {
          const created = await createAdminArea(numericServiceLineId, {
            name: trimmedName,
            description: trimmedDescription,
          });
          const newAreaId = buildEntityId('area', created.id);
          const nextExpanded = Array.from(
            new Set([...expandedAreaIds, buildAreaRowId(serviceLineId, newAreaId)]),
          );
          await loadLearningPaths({
            pathId,
            serviceLineId,
            expandedPathIds,
            expandedAreaIds: nextExpanded,
          });
          closeEditor();
          return;
        }

        const areaId = getNumericId(editor.areaId);
        if (!areaId) {
          setEditorError(t('learning_paths_invalid_area'));
          return;
        }

        await updateAdminArea(areaId, {
          name: trimmedName,
          description: trimmedDescription,
        });
        await loadLearningPaths({ pathId, serviceLineId, expandedPathIds, expandedAreaIds });
        closeEditor();
        return;
      }

      if (type === 'level') {
        const pathId = editor.pathId || selectedPath?.id;
        const serviceLineId = editor.serviceLineId || selectedServiceLine?.id;
        const areaId = editor.areaId;

        if (!pathId || !serviceLineId || !areaId) {
          setEditorError(t('learning_paths_select_area'));
          return;
        }

        const numericAreaId = getNumericId(areaId);
        if (!numericAreaId) {
          setEditorError(t('learning_paths_invalid_area'));
          return;
        }

        const nextExpanded = Array.from(
          new Set([...expandedAreaIds, buildAreaRowId(serviceLineId, areaId)]),
        );

        if (mode === 'create') {
          await createAdminLevel(numericAreaId, { title: trimmedTitle });
          await loadLearningPaths({
            pathId,
            serviceLineId,
            expandedPathIds,
            expandedAreaIds: nextExpanded,
          });
          closeEditor();
          return;
        }

        const levelId = getNumericId(editor.levelId);
        if (!levelId) {
          setEditorError(t('learning_paths_invalid_level'));
          return;
        }

        await updateAdminLevel(levelId, { title: trimmedTitle });
        await loadLearningPaths({
          pathId,
          serviceLineId,
          expandedPathIds,
          expandedAreaIds: nextExpanded,
        });
        closeEditor();
      }
    } catch (error) {
      setEditorError(error?.message || t('learning_paths_save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderExplorerTree = () => {
    if (!learningPathsData.length) {
      return null;
    }

    return (
      <aside className="lp-admin-explorer-sidebar" aria-label="Estrutura de Learning Paths">
        <header className="lp-admin-pane-head">
          <p className="lp-admin-pane-title">{t('learning_paths_structure')}</p>
          <span className="lp-admin-pane-hint">{learningPathsData.length} {t('learning_paths_folders')}</span>
        </header>

        <div className="lp-admin-tree-list">
          {learningPathsData.map((path) => {
            const isExpanded = expandedPathIds.includes(path.id);
            const isSelectedPath = selectedPath?.id === path.id;
            const pathServiceLines = path.serviceLines || [];

            return (
              <article key={path.id} className={`lp-admin-tree-group ${isSelectedPath ? 'is-active' : ''}`}>
                <div className="lp-admin-tree-row">
                  <button
                    type="button"
                    className="lp-admin-expand-btn"
                    onClick={() => toggleLearningPath(path.id)}
                    aria-label={isExpanded ? 'Fechar pasta' : 'Abrir pasta'}
                    aria-expanded={isExpanded}
                    aria-controls={`learning-path-tree-${path.id}`}
                  >
                    <ChevronDown
                      size={16}
                      className={`lp-area-chevron ${isExpanded ? 'is-open' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    className={`lp-admin-tree-node ${isSelectedPath ? 'is-selected' : ''} ${!path.isActive ? 'is-inactive' : ''}`}
                    onClick={() => {
                      selectPath(path.id);
                      if (!isExpanded) {
                        toggleLearningPath(path.id);
                      }
                    }}
                  >
                    {isExpanded ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
                    <span>{path.name}</span>
                  </button>

                  <button
                    type="button"
                    className="lp-admin-icon-btn lp-admin-tree-action"
                    onClick={() => openEditor({ type: 'learningPath', mode: 'edit', pathId: path.id })}
                    aria-label={`Editar ${path.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                {isExpanded && (
                  <div id={`learning-path-tree-${path.id}`} className="lp-admin-tree-children">
                    {pathServiceLines.length === 0 && <p className="lp-admin-tree-empty">{t('learning_paths_no_sl')}</p>}

                    {pathServiceLines.map((serviceLine) => {
                      const isSelectedServiceLine =
                        selectedServiceLine?.id === serviceLine.id && selectedPath?.id === path.id;

                      return (
                        <div key={serviceLine.id} className="lp-admin-tree-child-row">
                          <button
                            type="button"
                            className={`lp-admin-tree-child ${isSelectedServiceLine ? 'is-selected' : ''} ${!serviceLine.isActive ? 'is-inactive' : ''}`}
                            onClick={() => selectServiceLine(path.id, serviceLine.id)}
                          >
                            <FileText size={14} aria-hidden="true" />
                            <span>{serviceLine.name}</span>
                          </button>

                          <button
                            type="button"
                            className="lp-admin-icon-btn lp-admin-tree-action"
                            onClick={() =>
                              openEditor({
                                type: 'serviceLine',
                                mode: 'edit',
                                pathId: path.id,
                                serviceLineId: serviceLine.id,
                              })
                            }
                            aria-label={`Editar ${serviceLine.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="lp-admin-tree-create"
                      onClick={() => openEditor({ type: 'serviceLine', mode: 'create', pathId: path.id })}
                    >
                      <Plus size={14} />
                      {t('learning_paths_new_sl')}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    );
  };

  const renderLearningPathView = () => {
    if (!selectedPath) {
      return null;
    }

    const serviceLines = selectedPath.serviceLines || [];

    return (
      <section className="lp-admin-explorer-content">
        <header className="lp-admin-content-head">
          <div>
            <p className="lp-admin-breadcrumb">{t('learning_paths_current_dir')}</p>
            <h2>{selectedPath.name}</h2>
            <p className="lp-admin-content-meta">{serviceLines.length} {t('learning_paths_sl_count')}</p>
            <span className={`lp-admin-status-chip ${selectedPath.isActive ? 'is-active' : 'is-inactive'}`}>
              {getStatusLabel(selectedPath.isActive, t)}
            </span>
          </div>

          <div className="lp-admin-inline-actions">
            <button
              type="button"
              className="lp-admin-text-btn"
              onClick={() => openEditor({ type: 'learningPath', mode: 'edit', pathId: selectedPath.id })}
            >
              <Pencil size={16} />
              {t('learning_paths_edit_lp')}
            </button>
            <button
              type="button"
              className="lp-admin-btn secondary"
              onClick={() => openEditor({ type: 'serviceLine', mode: 'create', pathId: selectedPath.id })}
            >
              <Plus size={16} />
              {t('learning_paths_new_sl')}
            </button>
            <button
              type="button"
              className={`lp-admin-btn lp-admin-btn-status ${selectedPath.isActive ? 'is-deactivate' : 'is-activate'}`}
              onClick={() =>
                handleToggleEntityStatus({
                  type: 'learningPath',
                  pathId: selectedPath.id,
                  isActive: selectedPath.isActive,
                })
              }
              disabled={isUpdatingStatus}
            >
              {selectedPath.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
              {selectedPath.isActive ? t('learning_paths_deactivate') : t('learning_paths_activate')}
            </button>
          </div>
        </header>

        <p className="lp-admin-content-description">{selectedPath.description || t('learning_paths_no_description')}</p>

        <div className="lp-admin-file-table">
          <div className="lp-admin-file-table-head">
            <span>{t('learning_paths_th_name')}</span>
            <span>{t('learning_paths_th_areas')}</span>
            <span>{t('learning_paths_th_actions')}</span>
          </div>

          {serviceLines.length === 0 && (
            <p className="lp-admin-empty-panel">{t('learning_paths_no_sl_yet')}</p>
          )}

          {serviceLines.map((serviceLine) => (
            <article
              key={serviceLine.id}
              className={`lp-admin-file-row ${!serviceLine.isActive ? 'is-inactive' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => selectServiceLine(selectedPath.id, serviceLine.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectServiceLine(selectedPath.id, serviceLine.id);
                }
              }}
            >
              <div className="lp-admin-file-cell is-main">
                <FileText size={16} aria-hidden="true" />
                <div>
                  <strong className="lp-admin-file-name">{serviceLine.name}</strong>
                  <span className="lp-admin-file-subtitle">{serviceLine.description || t('learning_paths_no_description')}</span>
                  <span className={`lp-admin-inline-status ${serviceLine.isActive ? 'is-active' : 'is-inactive'}`}>
                    {getStatusLabel(serviceLine.isActive, t)}
                  </span>
                </div>
              </div>

              <div className="lp-admin-file-cell">{(serviceLine.areas || []).length}</div>

              <div className="lp-admin-file-cell lp-admin-file-actions">
                <button
                  type="button"
                  className="lp-admin-text-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleEntityStatus({
                      type: 'serviceLine',
                      pathId: selectedPath.id,
                      serviceLineId: serviceLine.id,
                      isActive: serviceLine.isActive,
                    });
                  }}
                  disabled={isUpdatingStatus}
                >
                  {serviceLine.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  {serviceLine.isActive ? t('learning_paths_deactivate') : t('learning_paths_activate')}
                </button>
                <button
                  type="button"
                  className="lp-admin-text-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditor({
                      type: 'serviceLine',
                      mode: 'edit',
                      pathId: selectedPath.id,
                      serviceLineId: serviceLine.id,
                    });
                  }}
                >
                  <Pencil size={16} />
                  {t('learning_paths_modal_edit')}
                </button>
                <ChevronRight size={18} className="lp-go-icon" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderServiceLineView = () => {
    if (!selectedServiceLine || !selectedPath) {
      return null;
    }

    return (
      <section className="lp-admin-explorer-content">
        <header className="lp-admin-content-head">
          <div>
            <p className="lp-admin-breadcrumb">{selectedPath.name} / {t('learning_paths_entity_sl')}</p>
            <h2>{selectedServiceLine.name}</h2>
            <p className="lp-admin-content-meta">{(selectedServiceLine.areas || []).length} {t('learning_paths_areas_count')}</p>
            <span className={`lp-admin-status-chip ${selectedServiceLine.isActive ? 'is-active' : 'is-inactive'}`}>
              {getStatusLabel(selectedServiceLine.isActive, t)}
            </span>
          </div>

          <div className="lp-admin-inline-actions">
            <button
              type="button"
              className="lp-admin-text-btn"
              onClick={() =>
                openEditor({
                  type: 'serviceLine',
                  mode: 'edit',
                  pathId: selectedPath.id,
                  serviceLineId: selectedServiceLine.id,
                })
              }
            >
              <Pencil size={16} />
              {t('learning_paths_modal_edit')}
            </button>
            <button
              type="button"
              className="lp-admin-btn secondary"
              onClick={() =>
                openEditor({
                  type: 'area',
                  mode: 'create',
                  pathId: selectedPath.id,
                  serviceLineId: selectedServiceLine.id,
                })
              }
            >
              <Plus size={16} />
              {t('learning_paths_new_area')}
            </button>
            <button
              type="button"
              className={`lp-admin-btn lp-admin-btn-status ${selectedServiceLine.isActive ? 'is-deactivate' : 'is-activate'}`}
              onClick={() =>
                handleToggleEntityStatus({
                  type: 'serviceLine',
                  pathId: selectedPath.id,
                  serviceLineId: selectedServiceLine.id,
                  isActive: selectedServiceLine.isActive,
                })
              }
              disabled={isUpdatingStatus}
            >
              {selectedServiceLine.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
              {selectedServiceLine.isActive ? t('learning_paths_deactivate') : t('learning_paths_activate')}
            </button>
          </div>
        </header>

        <article className="lp-admin-service-line-profile">
          <img
            src={selectedServiceLine.image}
            alt={selectedServiceLine.name}
            className="lp-service-line-hero-image"
          />
          <p>{selectedServiceLine.description || t('learning_paths_no_description')}</p>
        </article>

        <section className="lp-area-shell lp-admin-area-shell" aria-label={`Areas da service line ${selectedServiceLine.name}`}>
          <div className="lp-admin-section-row">
            <h3 className="lp-admin-section-title">{t('learning_paths_areas_title')}</h3>
          </div>

          <div className="lp-area-list">
            {selectedServiceLine.areas.map((area) => {
              const areaRowId = buildAreaRowId(selectedServiceLine.id, area.id);
              const isExpanded = expandedAreaIds.includes(areaRowId);

              return (
                <article key={area.id} className={`lp-area-card lp-admin-area-card ${isExpanded ? 'is-expanded' : ''} ${!area.isActive ? 'is-inactive' : ''}`}>
                  <button
                    type="button"
                    className="lp-area-toggle lp-admin-area-toggle"
                    onClick={() => toggleArea(areaRowId)}
                    aria-expanded={isExpanded}
                    aria-controls={`area-badges-${areaRowId}`}
                  >
                    <div className="lp-area-banner lp-admin-area-banner">
                      <div className="lp-admin-area-banner-main">
                        <strong>{area.name}</strong>
                        <span>{(area.levels || []).length} {t('learning_paths_levels_count')}</span>
                      </div>

                      <div className="lp-area-banner-actions">
                        <span className={`lp-admin-inline-status ${area.isActive ? 'is-active' : 'is-inactive'}`}>
                          {getStatusLabel(area.isActive, t)}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`lp-area-chevron ${isExpanded ? 'is-open' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div id={`area-badges-${areaRowId}`} className="lp-area-badges lp-admin-area-body">
                      <div className="lp-area-content-head lp-admin-area-head">
                        <div className="lp-admin-area-head-copy">
                          <h3>{t('learning_paths_levels_title')}</h3>
                          <span className="lp-progress-label">{(area.levels || []).length} {t('learning_paths_levels_count')}</span>
                        </div>
                        <div className="lp-admin-inline-actions">
                          <button
                            type="button"
                            className="lp-admin-text-btn"
                            onClick={() =>
                              openEditor({
                                type: 'area',
                                mode: 'edit',
                                pathId: selectedPath.id,
                                serviceLineId: selectedServiceLine.id,
                                areaId: area.id,
                              })
                            }
                          >
                            <Pencil size={16} />
                            {t('learning_paths_edit_area')}
                          </button>
                          <button
                            type="button"
                            className="lp-admin-text-btn"
                            onClick={() =>
                              handleToggleEntityStatus({
                                type: 'area',
                                pathId: selectedPath.id,
                                serviceLineId: selectedServiceLine.id,
                                areaId: area.id,
                                isActive: area.isActive,
                              })
                            }
                            disabled={isUpdatingStatus}
                          >
                            {area.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            {area.isActive ? t('learning_paths_deactivate_area') : t('learning_paths_activate_area')}
                          </button>
                          <button
                            type="button"
                            className="lp-admin-btn ghost"
                            onClick={() =>
                              openEditor({
                                type: 'level',
                                mode: 'create',
                                pathId: selectedPath.id,
                                serviceLineId: selectedServiceLine.id,
                                areaId: area.id,
                              })
                            }
                          >
                            <Plus size={16} />
                            {t('learning_paths_new_level')}
                          </button>
                        </div>
                      </div>

                      <div className="lp-level-list">
                        {(area.levels || []).length === 0 && (
                          <p className="lp-admin-empty">{t('learning_paths_no_levels')}</p>
                        )}
                        {(area.levels || []).map((level) => (
                          <div key={`${area.id}-${level.id}`} className={`lp-level-row lp-admin-level-row ${!level.isActive ? 'is-inactive' : ''}`}>
                            <div className="lp-level-copy">
                              <strong>{level.title}</strong>
                              <span>{level.subtitle}</span>
                              <span className={`lp-admin-inline-status ${level.isActive ? 'is-active' : 'is-inactive'}`}>
                                {getStatusLabel(level.isActive, t)}
                              </span>
                            </div>
                            <div className="lp-admin-row-actions">
                              <button
                                type="button"
                                className="lp-admin-text-btn"
                                onClick={() =>
                                  handleToggleEntityStatus({
                                    type: 'level',
                                    pathId: selectedPath.id,
                                    serviceLineId: selectedServiceLine.id,
                                    areaId: area.id,
                                    levelId: level.id,
                                    isActive: level.isActive,
                                  })
                                }
                                disabled={isUpdatingStatus}
                              >
                                {level.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                {level.isActive ? t('learning_paths_deactivate') : t('learning_paths_activate')}
                              </button>
                              <button
                                type="button"
                                className="lp-admin-text-btn"
                                onClick={() =>
                                  openEditor({
                                    type: 'level',
                                    mode: 'edit',
                                    pathId: selectedPath.id,
                                    serviceLineId: selectedServiceLine.id,
                                    areaId: area.id,
                                    levelId: level.id,
                                  })
                                }
                              >
                                <Pencil size={16} />
                                {t('learning_paths_modal_edit')}
                              </button>
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
      </section>
    );
  };

  const editorTitle = editor
    ? `${editor.mode === 'create' ? t('learning_paths_modal_new') : t('learning_paths_modal_edit')} ${getEntityLabel(editor.type, t)}`
    : '';

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner fullPage message={t('loading')} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page learning-paths-page is-classic is-admin">
        <header className="page-header lp-header">
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

          <div className="lp-admin-actions">
            <button
              type="button"
              className="lp-admin-btn"
              onClick={() => openEditor({ type: 'learningPath', mode: 'create' })}
            >
              <Plus size={16} />
              {t('learning_paths_btn_new_lp')}
            </button>
          </div>
        </header>


        {isLoading && <p className="lp-progress-label">{t('learning_paths_loading')}</p>}
        {!isLoading && errorMessage && <p className="lp-progress-label">{errorMessage}</p>}
        {!isLoading && !errorMessage && statusActionError && (
          <p className="lp-progress-label lp-admin-status-error">{statusActionError}</p>
        )}

        {!isLoading && !errorMessage && (
          <section
            className="lp-admin-explorer"
            style={{ '--lp-admin-sidebar-width': `${sidebarWidth}px` }}
          >
            {renderExplorerTree()}
            <div
              className={`lp-admin-resizer ${isResizingSidebar ? 'is-active' : ''}`}
              role="separator"
              aria-label="Ajustar largura do explorador"
              aria-orientation="vertical"
              tabIndex={0}
              onMouseDown={handleSidebarResizeStart}
              onKeyDown={handleSidebarResizeKeyDown}
            />
            <div className="lp-admin-explorer-main">
              {!selectedServiceLine && renderLearningPathView()}
              {selectedServiceLine && renderServiceLineView()}
            </div>
          </section>
        )}

        {editor && (
          <div className="lp-admin-modal-overlay" role="presentation" onClick={closeEditor}>
            <div
              className="lp-admin-modal"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="lp-admin-modal-head">
                <h2>{editorTitle}</h2>
                <button type="button" className="lp-admin-icon-btn" onClick={closeEditor} aria-label="Fechar">
                  <X size={18} />
                </button>
              </header>

              <div className="lp-admin-modal-body">
                <div className="lp-admin-modal-form">
                  {(editor.type === 'learningPath' || editor.type === 'serviceLine' || editor.type === 'area') && (
                    <label>
                      {t('learning_paths_field_name')}
                      <input
                        type="text"
                        value={editorForm?.name || ''}
                        onChange={(event) =>
                          setEditorForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                  )}

                  {(editor.type === 'learningPath' || editor.type === 'serviceLine' || editor.type === 'area') && (
                    <label>
                      {t('learning_paths_field_description')}
                      <textarea
                        rows={4}
                        value={editorForm?.description || ''}
                        onChange={(event) =>
                          setEditorForm((current) => ({ ...current, description: event.target.value }))
                        }
                      />
                    </label>
                  )}

                  {editor.type === 'serviceLine' && (
                    <div className="lp-admin-modal-image-field">
                      <span>{t('learning_paths_field_image')}</span>
                      <input type="file" accept="image/*" onChange={handleEditorImageFileChange} />
                      <div className="lp-admin-modal-image-preview-row">
                        <img
                          src={editorForm?.image || '/LP_BG.png'}
                          alt="Preview Service Line"
                          className="lp-admin-modal-image-preview"
                        />
                        <button type="button" className="lp-admin-btn ghost" onClick={clearEditorImage}>
                          {t('learning_paths_reset_image')}
                        </button>
                      </div>
                      <small>{t('learning_paths_image_formats')}</small>
                    </div>
                  )}

                  {editor.type === 'level' && (
                    <label>
                      {t('learning_paths_field_title')}
                      <input
                        type="text"
                        value={editorForm?.title || ''}
                        onChange={(event) =>
                          setEditorForm((current) => ({ ...current, title: event.target.value }))
                        }
                      />
                    </label>
                  )}
                </div>

                {editorError && <p className="lp-admin-modal-error">{editorError}</p>}

                <footer className="lp-admin-modal-actions">
                  <button type="button" className="lp-admin-btn secondary" onClick={closeEditor}>
                    {t('cancel')}
                  </button>
                  <button type="button" className="lp-admin-btn" onClick={handleSaveEditor} disabled={isSaving}>
                    {t('save')}
                  </button>
                </footer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default LearningPathsAG;
