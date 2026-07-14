import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, Save, Trash2, XCircle } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import BadgeImage from '../../components/BadgeImage';
import { fetchAdminLearningPaths } from '../../services/adminLearningPathService';
import { createAdminBadge, fetchAdminBadge, updateAdminBadge } from '../../services/adminBadgeService';
import '../../css/AdminGestor/BadgeAdmin.css';

const SPECIAL_BADGE_TYPE = 'special';
const STANDARD_BADGE_TYPE = 'standard';
const MAX_BADGE_IMAGE_SIZE_BYTES = 1_500_000;

const badgeLevels = [
  { levelKey: 'badge_level_junior', label: 'Júnior', points: 100, badgeImage: '/badges/J%C3%BAnior.png' },
  { levelKey: 'badge_level_intermediate', label: 'Intermédio', points: 150, badgeImage: '/badges/Interm%C3%A9dio.png' },
  { levelKey: 'badge_level_senior', label: 'Sénior', points: 200, badgeImage: '/badges/S%C3%A9nior.png' },
  { levelKey: 'badge_level_specialist', label: 'Especialista', points: 250, badgeImage: '/badges/Especialista.png' },
  { levelKey: 'badge_level_knowledge_lead', label: 'Líder de Conhecimento', points: 300, badgeImage: '/badges/L%C3%ADder%20de%20Conhecimento.png' },
];

const specialRequirementOptions = [
  { id: 'badge_count', label: 'Número de badges obtidas' },
  { id: 'ranking_position', label: 'Posição no ranking' },
  { id: 'streak_days', label: 'Dias consecutivos de atividade' },
];

const formatDateLabel = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return '12 Jan 2026';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const buildRequirement = (seed = {}) => ({
  id: seed.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: seed.type || specialRequirementOptions[0].id,
  value: seed.value !== undefined && seed.value !== null ? String(seed.value) : '',
});

const buildStandardRequirement = (seed = {}) => ({
  id: seed.id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: seed.title || seed.requisito || '',
  description: seed.description || seed.r_descricao || '',
  image: seed.image || seed.imagem || seed.r_imagem || '',
});

const resolveLevelMeta = (levelKey) =>
  badgeLevels.find((level) => level.levelKey === levelKey) || badgeLevels[0];

const resolveLevelMetaFromTitle = (title) => {
  const normalized = String(title || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes('junior')) {
    return badgeLevels[0];
  }

  if (normalized.includes('intermedio') || normalized.includes('interm')) {
    return badgeLevels[1];
  }

  if (normalized.includes('senior')) {
    return badgeLevels[2];
  }

  if (normalized.includes('especialista')) {
    return badgeLevels[3];
  }

  if (normalized.includes('lider')) {
    return badgeLevels[4];
  }

  return null;
};

const parseNumericId = (value) => {
  const raw = String(value || '');
  const match = raw.match(/(\d+)/);
  const parsed = match ? Number(match[1]) : Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const buildLevelOptions = (paths) => {
  const options = [];

  (paths || []).forEach((path) => {
    const pathName = path?.name || 'Learning Path';
    (path?.serviceLines || []).forEach((serviceLine) => {
      const serviceLineName = serviceLine?.name || 'Service Line';
      (serviceLine?.areas || []).forEach((area) => {
        const areaName = area?.name || 'Area';
        (area?.levels || []).forEach((level) => {
          const levelId = parseNumericId(level?.id);
          if (!levelId) {
            return;
          }

          options.push({
            id: levelId,
            title: level?.title || 'Nivel',
            label: `${pathName} / ${serviceLineName} / ${areaName} / ${level?.title || 'Nivel'}`,
            badgeCount: Number(level?.badgeCount) || 0,
          });
        });
      });
    });
  });

  return options;
};

const getSelectableLevelOptions = (levelOptions, currentLevelId) =>
  (levelOptions || []).filter((option) => option.badgeCount === 0 || option.id === currentLevelId);

const buildFormState = (badge, isCreate) => {
  const hasBadge = Boolean(badge);
  const isSpecial = hasBadge
    ? badge.typeId === SPECIAL_BADGE_TYPE || badge.isSpecial === true
    : false;

  const levelMetaFromBadgeType = !isSpecial && badge?.typeId
    ? resolveLevelMeta(badge.typeId)
    : null;
  const levelMetaFromBadgeTitle = !isSpecial
    ? resolveLevelMetaFromTitle(badge?.levelTitle || badge?.level || '')
    : null;
  const levelMeta = levelMetaFromBadgeType || levelMetaFromBadgeTitle || badgeLevels[0];

  const pointsValue = Number.isFinite(Number(badge?.points))
    ? Number(badge.points)
    : isSpecial
      ? 0
      : levelMeta.points;

  const badgeImage = badge?.badgeImage || (isSpecial ? '/badges/Especial.png' : levelMeta.badgeImage);

  const specialRequirements = Array.isArray(badge?.specialRequirements) && badge.specialRequirements.length > 0
    ? badge.specialRequirements.map((req) => buildRequirement(req))
    : [buildRequirement()];

  const requirements = Array.isArray(badge?.requirements) && badge.requirements.length > 0
    ? badge.requirements.map((req) => buildStandardRequirement(req))
    : [buildStandardRequirement()];

  return {
    id: badge?.id || (isCreate ? '' : badge?.id || ''),
    badgeDbId: badge?.badgeDbId || null,
    levelId: parseNumericId(badge?.levelId),
    name: badge?.name || badge?.area || '',
    description: badge?.description || '',
    type: isSpecial ? SPECIAL_BADGE_TYPE : STANDARD_BADGE_TYPE,
    badgeTypeId: isSpecial ? '' : levelMeta.levelKey,
    points: String(pointsValue),
    badgeImage,
    date: badge?.date || formatDateLabel(),
    specialRequirements,
    requirements,
    validade: badge?.validade || '',
  };
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Nao foi possivel ler o ficheiro de imagem.'));
  reader.readAsDataURL(file);
});

function BadgeAdmin() {
  const { badgeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreate = !badgeId || badgeId === 'novo';

  const [initialBadge, setInitialBadge] = useState(() => location.state?.badge || null);
  const [form, setForm] = useState(() => buildFormState(initialBadge, isCreate));
  const [formErrors, setFormErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [levelOptions, setLevelOptions] = useState([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSpecial = form.type === SPECIAL_BADGE_TYPE;

  const selectedBadgeTypeMeta = useMemo(
    () => resolveLevelMeta(form.badgeTypeId || badgeLevels[0].levelKey),
    [form.badgeTypeId],
  );

  const selectableLevelOptions = useMemo(
    () => getSelectableLevelOptions(levelOptions, form.levelId),
    [levelOptions, form.levelId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadLevels = async () => {
      setIsLoadingLevels(true);
      try {
        const data = await fetchAdminLearningPaths();
        if (!isMounted) {
          return;
        }

        setLevelOptions(buildLevelOptions(data));
      } catch {
        if (isMounted) {
          setStatusMessage('Falha ao carregar os níveis.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingLevels(false);
        }
      }
    };

    loadLevels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (location.state?.badge) {
      setInitialBadge(location.state.badge);
      setStatusMessage('');
    }

    if (isCreate) {
      setInitialBadge(null);
      setStatusMessage('');
      return () => {
        isMounted = false;
      };
    }

    const loadBadge = async () => {
      try {
        const parsedBadgeId = parseNumericId(badgeId) || badgeId;
        const data = await fetchAdminBadge(parsedBadgeId);
        if (isMounted) {
          setInitialBadge(data);
          setStatusMessage('');
        }
      } catch {
        if (isMounted) {
          setStatusMessage('Badge não encontrada.');
        }
      }
    };

    loadBadge();

    return () => {
      isMounted = false;
    };
  }, [badgeId, isCreate, location.state?.badge]);

  useEffect(() => {
    setForm(buildFormState(initialBadge, isCreate));
    setFormErrors({});
  }, [initialBadge, isCreate]);

  useEffect(() => {
    if (!initialBadge && !isCreate) {
      setStatusMessage('Badge não encontrada.');
    }
  }, [initialBadge, isCreate]);

  const handleBack = () => {
    const backTo = typeof location.state?.backTo === 'string'
      ? location.state.backTo
      : '/admin-gestor/catalogo-badges';
    navigate(backTo);
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;

    if (field === 'points') {
      const numericValue = Number(value);
      const safeValue = value === ''
        ? ''
        : (Number.isFinite(numericValue) ? String(Math.max(0, numericValue)) : '0');
      setForm((current) => ({
        ...current,
        [field]: safeValue,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;
    const nextType = value === SPECIAL_BADGE_TYPE ? SPECIAL_BADGE_TYPE : STANDARD_BADGE_TYPE;

    setForm((current) => {
      if (nextType === SPECIAL_BADGE_TYPE) {
        return {
          ...current,
          type: nextType,
          levelId: null,
          badgeTypeId: '',
          points: '0',
          badgeImage: current.badgeImage && !current.badgeImage.startsWith('/badges/')
            ? current.badgeImage
            : '/badges/default.png',
          specialRequirements: current.specialRequirements.length > 0
            ? current.specialRequirements
            : [buildRequirement()],
          requirements: current.requirements,
        };
      }

      const fallbackBadgeType = current.badgeTypeId || badgeLevels[0].levelKey;
      const badgeTypeMeta = resolveLevelMeta(fallbackBadgeType);
      const availableOptions = getSelectableLevelOptions(levelOptions, current.levelId);
      const nextLevelId = current.levelId || availableOptions[0]?.id || null;

      return {
        ...current,
        type: nextType,
        levelId: nextLevelId,
        badgeTypeId: badgeTypeMeta.levelKey,
        points: String(badgeTypeMeta.points),
        badgeImage: current.badgeImage && !current.badgeImage.startsWith('/badges/')
          ? current.badgeImage
          : badgeTypeMeta.badgeImage,
        requirements: current.requirements && current.requirements.length > 0
          ? current.requirements
          : [buildStandardRequirement()],
      };
    });
  };

  const handleBadgeTypeChange = (event) => {
    const { value } = event.target;
    const selectedMeta = resolveLevelMeta(value);

    setForm((current) => ({
      ...current,
      badgeTypeId: selectedMeta.levelKey,
      points: String(selectedMeta.points),
      badgeImage: current.badgeImage && !current.badgeImage.startsWith('/badges/')
        ? current.badgeImage
        : selectedMeta.badgeImage,
    }));
  };

  const handleLevelChange = (event) => {
    const { value } = event.target;
    const parsedLevelId = parseNumericId(value);

    setForm((current) => ({
      ...current,
      levelId: parsedLevelId,
    }));
  };

  const handleImageFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setStatusMessage('Escolha um ficheiro de imagem válido.');
      return;
    }

    if (selectedFile.size > MAX_BADGE_IMAGE_SIZE_BYTES) {
      setStatusMessage('A imagem é demasiado grande (máximo 1.5MB).');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      setForm((current) => ({
        ...current,
        badgeImage: dataUrl,
      }));
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error?.message || 'Não foi possível carregar a imagem.');
    }
  };

  const clearCustomImage = () => {
    setForm((current) => ({
      ...current,
      badgeImage: isSpecial ? '/badges/Especial.png' : selectedBadgeTypeMeta.badgeImage,
    }));
  };

  const updateRequirement = (id, patch) => {
    setForm((current) => ({
      ...current,
      specialRequirements: current.specialRequirements.map((req) =>
        req.id === id ? { ...req, ...patch } : req,
      ),
    }));
  };

  const addRequirement = () => {
    setForm((current) => ({
      ...current,
      specialRequirements: [...current.specialRequirements, buildRequirement()],
    }));
  };

  const removeRequirement = (id) => {
    setForm((current) => ({
      ...current,
      specialRequirements: current.specialRequirements.filter((req) => req.id !== id),
    }));
  };

  const updateStandardRequirement = (id, patch) => {
    setForm((current) => ({
      ...current,
      requirements: current.requirements.map((req) =>
        req.id === id ? { ...req, ...patch } : req,
      ),
    }));
  };

  const handleStandardRequirementImageFileChange = (id) => async (event) => {
    const input = event.target;
    const selectedFile = input.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!String(selectedFile.type || '').startsWith('image/')) {
      setStatusMessage('Escolha um ficheiro de imagem valido.');
      input.value = '';
      return;
    }

    if (selectedFile.size > MAX_BADGE_IMAGE_SIZE_BYTES) {
      setStatusMessage('A imagem e demasiado grande (maximo 1.5MB).');
      input.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      updateStandardRequirement(id, { image: dataUrl });
      setStatusMessage('');
    } catch (error) {
      setStatusMessage(error?.message || 'Nao foi possivel carregar a imagem.');
    } finally {
      input.value = '';
    }
  };

  const clearStandardRequirementImage = (id) => {
    updateStandardRequirement(id, { image: '' });
  };

  const addStandardRequirement = () => {
    setForm((current) => ({
      ...current,
      requirements: [...current.requirements, buildStandardRequirement()],
    }));
  };

  const removeStandardRequirement = (id) => {
    setForm((current) => ({
      ...current,
      requirements: current.requirements.filter((req) => req.id !== id),
    }));
  };

  const isRequirementTypeDisabled = (typeId, currentRequirementId) =>
    form.specialRequirements.some((requirement) => requirement.id !== currentRequirementId && requirement.type === typeId);

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Indique o nome do badge.';
    }

    if (!isSpecial && !form.badgeTypeId) {
      nextErrors.badgeTypeId = 'Selecione o nível do badge.';
    }

    if (!isSpecial && !form.levelId) {
      nextErrors.levelId = 'Selecione um nível associado válido.';
    }

    if (!isSpecial && selectableLevelOptions.length === 0 && isCreate) {
      nextErrors.levelId = 'Não existem níveis disponíveis sem badge associada.';
    }

    if (isSpecial) {
      const validSpecial = form.specialRequirements.filter((req) => Number(req.value) > 0);
      if (validSpecial.length === 0) {
        nextErrors.specialRequirements = 'Defina pelo menos um trigger com valor.';
      }
    }

    if (!isSpecial) {
      const validRequirements = form.requirements.filter(
        (req) => String(req.title || '').trim() && String(req.description || '').trim(),
      );
      if (validRequirements.length === 0) {
        nextErrors.requirements = 'Adicione pelo menos um requisito válido.';
      }
    }

    const numericPoints = Number(form.points);
    if (!Number.isFinite(numericPoints) || numericPoints < 0) {
      nextErrors.points = 'Os pontos não podem ser negativos.';
    }

    if (form.validade) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7);
      const validadeDate = new Date(form.validade);
      if (validadeDate < minDate) {
        nextErrors.validade = 'A data de expiração deve ser pelo menos 7 dias no futuro.';
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setStatusMessage('Existem campos inválidos. Verifique os erros no formulário.');
      return;
    }

    setIsSaving(true);
    setStatusMessage('');

    const pointsValue = Number(form.points);
    const safePoints = Number.isFinite(pointsValue)
      ? pointsValue
      : (isSpecial ? 0 : selectedBadgeTypeMeta.points);

    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();
    const specialRequirementsPayload = isSpecial
      ? form.specialRequirements
        .map((requirement) => ({
          type: String(requirement.type || '').trim(),
          value: Number(requirement.value),
        }))
        .filter((requirement) => Number.isInteger(requirement.value) && requirement.value > 0)
      : [];

    const requirementsPayload = isSpecial
      ? []
      : form.requirements
        .map((requirement) => ({
          title: String(requirement.title || '').trim(),
          description: String(requirement.description || '').trim(),
          image: requirement.image || null,
        }))
        .filter((requirement) => requirement.title && requirement.description);

    const payload = {
      name: trimmedName,
      description: trimmedDescription,
      points: safePoints,
      levelId: isSpecial ? null : form.levelId,
      isSpecial,
      typeId: isSpecial ? SPECIAL_BADGE_TYPE : form.badgeTypeId,
      badgeImage: form.badgeImage || null,
      specialRequirements: specialRequirementsPayload,
      requirements: requirementsPayload,
      validade: form.validade || null,
    };

    try {
      if (isCreate) {
        await createAdminBadge(payload);
      } else {
        const targetBadgeId = form.badgeDbId || parseNumericId(badgeId);
        if (!targetBadgeId) {
          setStatusMessage('Não foi possível identificar o badge para atualizar.');
          setIsSaving(false);
          return;
        }

        await updateAdminBadge(targetBadgeId, payload);
      }

      navigate('/admin-gestor/catalogo-badges', {
        state: { refreshCatalog: Date.now() },
      });
    } catch (error) {
      setStatusMessage(error?.message || 'Erro ao guardar badge.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page">
        <header className="page-header">
          <button type="button" className="badge-admin-back" onClick={handleBack}>
            <ChevronLeft size={18} />
          </button>

          <div>
            <h1>{isCreate ? 'Criar badge' : 'Editar badge'}</h1>
          </div>

          <div className="badge-admin-actions">
            <button type="button" className="badge-admin-btn ghost" onClick={handleBack}>
              Cancelar
            </button>
            <button type="button" className="badge-admin-btn primary" onClick={handleSave} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="badge-admin-alert" role="status">{statusMessage}</div>
        )}

        <section className="badge-admin-card">
          <div className="badge-admin-grid">
            <label className="badge-admin-field">
              <span>Nome do badge</span>
              <input
                type="text"
                value={form.name}
                onChange={handleFieldChange('name')}
                placeholder="Ex: MVP de Badges"
              />
              {formErrors.name && <span className="badge-admin-error">{formErrors.name}</span>}
            </label>

            <label className="badge-admin-field">
              <span>Descrição</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={handleFieldChange('description')}
                placeholder="Resumo do badge"
              />
            </label>

            <label className="badge-admin-field">
              <span>Tipo</span>
              <select value={form.type} onChange={handleTypeChange}>
                <option value={STANDARD_BADGE_TYPE}>Nível (com candidatura)</option>
                <option value={SPECIAL_BADGE_TYPE}>Especial (sem candidatura)</option>
              </select>
            </label>

            {!isSpecial && (
              <label className="badge-admin-field">
                <span>Nível do badge</span>
                <select value={form.badgeTypeId || ''} onChange={handleBadgeTypeChange}>
                  {badgeLevels.map((option) => (
                    <option key={option.levelKey} value={option.levelKey}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.badgeTypeId && <span className="badge-admin-error">{formErrors.badgeTypeId}</span>}
              </label>
            )}

            {!isSpecial && (
              <label className="badge-admin-field">
                <span>Nível associado</span>
                <select value={form.levelId || ''} onChange={handleLevelChange} disabled={isLoadingLevels}>
                  <option value="">Selecionar nível</option>
                  {selectableLevelOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.levelId && <span className="badge-admin-error">{formErrors.levelId}</span>}
              </label>
            )}

            <label className="badge-admin-field">
              <span>Pontos</span>
              <input
                type="number"
                min="0"
                value={form.points}
                onChange={handleFieldChange('points')}
              />
              {formErrors.points && <span className="badge-admin-error">{formErrors.points}</span>}
            </label>

            <label className="badge-admin-field">
              <span>Data de expiração (opcional)</span>
              <input
                type="date"
                value={form.validade || ''}
                onChange={handleFieldChange('validade')}
              />
              {formErrors.validade && <span className="badge-admin-error">{formErrors.validade}</span>}
              <span className="badge-admin-help-text">
                Se definida, a badge irá expirar nesta data. Deixe vazio para badge sem expiração.
              </span>
            </label>

            <div className="badge-admin-field">
              <span>Imagem do badge (ficheiro)</span>
              <input type="file" accept="image/*" onChange={handleImageFileChange} />
              <div className="badge-admin-image-preview-wrap">
                <BadgeImage
                  className="badge-admin-image-preview"
                  src={form.badgeImage}
                  alt="Preview badge"
                  frameSrc={isSpecial ? false : selectedBadgeTypeMeta.badgeImage}
                  levelKey={form.badgeTypeId}
                  levelLabel={selectedBadgeTypeMeta.label}
                />
                <button type="button" className="badge-admin-btn ghost" onClick={clearCustomImage}>
                  <XCircle size={16} />
                  Repor imagem padrão
                </button>
              </div>
              <span className="badge-admin-help-text">
                Formatos suportados: png, jpg, svg, etc. (máximo 1.5MB).
              </span>
            </div>
          </div>
        </section>

        <section className="badge-admin-card">
          <div className="badge-admin-section-title">Triggers especiais</div>
          {!isSpecial && (
            <p className="badge-admin-muted">
              Este badge segue o fluxo normal de candidatura e validação.
            </p>
          )}
          {isSpecial && (
            <div className="badge-admin-reqs">
              {form.specialRequirements.map((req) => (
                <div key={req.id} className="badge-admin-req-row">
                  <select
                    value={req.type}
                    onChange={(event) => updateRequirement(req.id, { type: event.target.value })}
                  >
                    {specialRequirementOptions.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={isRequirementTypeDisabled(option.id, req.id)}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={req.value}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      if (rawValue === '') {
                        updateRequirement(req.id, { value: '' });
                        return;
                      }

                      const parsed = Number(rawValue);
                      const safeValue = Number.isFinite(parsed) ? String(Math.max(0, parsed)) : '0';
                      updateRequirement(req.id, { value: safeValue });
                    }}
                    placeholder="Valor"
                  />
                  <button
                    type="button"
                    className="badge-admin-btn icon"
                    onClick={() => removeRequirement(req.id)}
                    aria-label="Remover trigger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button type="button" className="badge-admin-btn ghost" onClick={addRequirement}>
                <Plus size={16} />
                Adicionar trigger
              </button>

              {formErrors.specialRequirements && (
                <span className="badge-admin-error">{formErrors.specialRequirements}</span>
              )}
            </div>
          )}
        </section>

        <section className="badge-admin-card">
          <div className="badge-admin-section-title">Requisitos do badge</div>
          {isSpecial ? (
            <p className="badge-admin-muted">
              Este badge especial não utiliza requisitos de candidatura.
            </p>
          ) : (
            <div className="badge-admin-reqs">
              {form.requirements.map((req) => (
                <div key={req.id} className="badge-admin-req-row standard">
                  <input
                    type="text"
                    value={req.title}
                    onChange={(event) => updateStandardRequirement(req.id, { title: event.target.value })}
                    placeholder="Título do requisito"
                  />
                  <textarea
                    rows={2}
                    value={req.description}
                    onChange={(event) => updateStandardRequirement(req.id, { description: event.target.value })}
                    placeholder="Descrição do requisito"
                  />
                  <div className="badge-admin-req-image-field">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStandardRequirementImageFileChange(req.id)}
                      aria-label="Imagem do requisito"
                    />
                    {req.image ? (
                      <div className="badge-admin-req-image-preview-row">
                        <img
                          className="badge-admin-req-image-preview"
                          src={req.image}
                          alt="Preview requisito"
                        />
                        <button
                          type="button"
                          className="badge-admin-btn ghost"
                          onClick={() => clearStandardRequirementImage(req.id)}
                        >
                          <XCircle size={16} />
                          Remover
                        </button>
                      </div>
                    ) : (
                      <span className="badge-admin-help-text">Imagem opcional</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="badge-admin-btn icon"
                    onClick={() => removeStandardRequirement(req.id)}
                    aria-label="Remover requisito"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button type="button" className="badge-admin-btn ghost" onClick={addStandardRequirement}>
                <Plus size={16} />
                Adicionar requisito
              </button>

              {formErrors.requirements && (
                <span className="badge-admin-error">{formErrors.requirements}</span>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default BadgeAdmin;
