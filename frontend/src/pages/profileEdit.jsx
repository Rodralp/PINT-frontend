import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Save, ChevronUp, ChevronDown, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import BadgeImage from '../components/BadgeImage'
import apiClient from '../services/apiClient'
import { fetchMyBadges, deleteUserImage } from '../services/consultorService'
import '../css/AdminGestor/BadgeAdmin.css'
import '../css/Consultor/CatalogoBadges_C.css'
import { portugueseLocations } from '../utils/locations'

const normalizeLevelId = (level) => {
  const normalized = String(level || '').trim().toLowerCase();
  if (normalized.includes('júnior') || normalized.includes('junior')) return 'junior';
  if (normalized.includes('intermédio') || normalized.includes('intermedio')) return 'intermediate';
  if (normalized.includes('sénior') || normalized.includes('senior')) return 'senior';
  if (normalized.includes('especialista')) return 'specialist';
  if (normalized.includes('líder') || normalized.includes('lider')) return 'knowledge_lead';
  return null;
};

function readStoredLogin() {
  const session = sessionStorage.getItem('loginData')
  if (session) {
    try { return { data: JSON.parse(session), source: 'session' } } catch { /* ignore */ }
  }
  const local = localStorage.getItem('loginData')
  if (local) {
    try { return { data: JSON.parse(local), source: 'local' } } catch { /* ignore */ }
  }
  return { data: null, source: 'session' }
}

function persistStoredLogin(source, data) {
  const serialized = JSON.stringify(data)
  sessionStorage.setItem('loginData', serialized)
  localStorage.setItem('loginData', serialized)
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const stored = readStoredLogin()
  const loginData = stored.data || {}

  const [name, setName] = useState(loginData.nome || '')
  const [location, setLocation] = useState(loginData.location || loginData.localidade || loginData.localizacao || '')
  const [avatar, setAvatar] = useState(loginData.avatar || `/avatars/default-avatar.svg`)
  const [avatarFile, setAvatarFile] = useState(null)

  const [obtainedBadges, setObtainedBadges] = useState([])
  const [vitrine, setVitrine] = useState([])
  const [dragIdx, setDragIdx] = useState(null)

  const [statusMessage, setStatusMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [badgesData, vitrineData] = await Promise.all([
          fetchMyBadges().catch(() => []),
          apiClient.get('/consultor/vitrine', { params: { accountId: loginData.id } }).then((r) => r.data || []).catch(() => []),
        ])

        if (!isMounted) return

        const obtained = (Array.isArray(badgesData) ? badgesData : []).filter((b) => b.status === 'obtido')
        setObtainedBadges(obtained)

        if (Array.isArray(vitrineData) && vitrineData.length > 0) {
          const vitrineIds = vitrineData.map((v) => v.nbadge)
          const matched = obtained.filter((b) => vitrineIds.includes(b.badgeDbId))
          const ordered = vitrineData.map((v) => {
            const found = matched.find((m) => m.badgeDbId === v.nbadge)
            return found || {
              badgeDbId: v.nbadge,
              name: v.b_nome || 'Badge',
              badgeImage: v.imagem || '/badges/default.png',
              points: v.pontos || 0,
              levelKey: v.tipo === 'Especial' ? 'special' : (normalizeLevelId(v.nivel) || undefined),
              typeId: v.tipo === 'Especial' ? 'special' : (normalizeLevelId(v.nivel) ? `badge_level_${normalizeLevelId(v.nivel)}` : undefined),
              isSpecial: v.tipo === 'Especial',
            }
          })
          setVitrine(ordered)
        } else {
          setVitrine(obtained.slice(0, 6))
        }

        try {
          const imgRes = await apiClient.get('/consultor/user-image', { params: { accountId: loginData.id } })
          if (isMounted && imgRes.data?.image) {
            setAvatar(imgRes.data.image)
          }
        } catch { /* no image */ }
      } catch { /* silent */ }
    }

    loadData()
    return () => { isMounted = false }
  }, [loginData.id])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('A imagem deve ter menos de 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
      setAvatarFile(file)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = async () => {
    try {
      await deleteUserImage()
      setAvatar('/avatars/default-avatar.svg')
      setAvatarFile(null)
    } catch {
      setStatusMessage('Erro ao remover foto.')
    }
  }

  const addBadgeToVitrine = (badge) => {
    if (vitrine.length >= 8) {
      setStatusMessage('A vitrine pode ter no maximo 8 badges.')
      return
    }
    if (vitrine.some((v) => v.badgeDbId === badge.badgeDbId)) return
    setVitrine((prev) => [...prev, badge])
  }

  const removeBadgeFromVitrine = (badgeDbId) => {
    setVitrine((prev) => prev.filter((v) => v.badgeDbId !== badgeDbId))
  }

  const moveVitrineBadge = (index, direction) => {
    setVitrine((prev) => {
      const next = [...prev]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  const handleDragStart = (idx) => {
    setDragIdx(idx)
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setVitrine((prev) => {
      const next = [...prev]
      const dragged = next[dragIdx]
      next.splice(dragIdx, 1)
      next.splice(idx, 0, dragged)
      return next
    })
    setDragIdx(idx)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
  }

  const availableBadges = obtainedBadges.filter((b) => !vitrine.some((v) => v.badgeDbId === b.badgeDbId))

  const onSave = async () => {
    setSaving(true)
    setStatusMessage('')

    const newData = {
      ...loginData,
      nome: name,
      localizacao: location,
      avatar,
    }

    persistStoredLogin(stored.source, newData)

    try {
      await apiClient.put('/consultor/profile', {
        accountId: loginData.id,
        nome: name,
        localizacao: location,
      })
    } catch { /* silent */ }

    if (avatarFile) {
      try {
        await apiClient.post('/consultor/user-image', {
          accountId: loginData.id,
          image: avatar,
        })
      } catch { /* silent */ }
    }

    try {
      await apiClient.post('/consultor/vitrine', {
        accountId: loginData.id,
        badges: vitrine.map((b, i) => ({ nbadge: b.badgeDbId, ordem: i })),
      })
    } catch { /* silent */ }

    setSaving(false)
    navigate('/profile')
  }

  return (
    <Layout>
      <div className="badge-admin-page">
        <header className="badge-admin-header">
          <button type="button" className="badge-admin-back" onClick={() => navigate('/profile')}>
            <ChevronLeft size={18} />
          </button>

          <div className="badge-admin-title">
            <p>{t('profile_edit') || 'Editar Perfil'}</p>
            <h1>{name || t('app_user_default') || 'Utilizador'}</h1>
          </div>

          <div className="badge-admin-actions">
            <button type="button" className="badge-admin-btn ghost" onClick={() => navigate('/profile')}>
              {t('cancel') || 'Cancelar'}
            </button>
            <button type="button" className="badge-admin-btn primary" onClick={onSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'A guardar...' : (t('save') || 'Guardar')}
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="badge-admin-alert" role="status">{statusMessage}</div>
        )}

        <section className="badge-admin-card">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px dashed #d1d5db', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  className="badge-admin-image-preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  src={avatar}
                  alt="avatar"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>Clique para mudar foto</p>
              {avatarFile && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{ marginTop: 4, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Remover foto
                </button>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <label className="badge-admin-field" style={{ flex: 1 }}>
                  <span>Nome</span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Joao Silva"
                  />
                </label>
                <label className="badge-admin-field" style={{ flex: 1 }}>
                  <span>Localizacao</span>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Lisboa, Portugal"
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {portugueseLocations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="badge-admin-card">
          <div className="badge-admin-section-title">Vitrine de Badges (max. 8)</div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Seleciona as badges que queres mostrar no teu perfil. Usa as setas ou arrasta para reordenar.
          </p>

          {vitrine.length > 0 ? (
            <div className="vitrine-edit-grid">
              {vitrine.map((badge, idx) => (
                <div
                  key={badge.badgeDbId}
                  className={`vitrine-edit-card ${dragIdx === idx ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="vitrine-edit-card-top">
                    <div className="vitrine-edit-badge-img">
                      <BadgeImage
                        src={badge.badgeImage}
                        alt={badge.name || 'Badge'}
                        levelKey={badge.levelKey || (badge.isSpecial ? 'special' : undefined)}
                        typeId={badge.typeId || (badge.isSpecial ? 'special' : undefined)}
                      />
                    </div>
                    <button
                      type="button"
                      className="vitrine-edit-remove"
                      onClick={() => removeBadgeFromVitrine(badge.badgeDbId)}
                      title="Remover da vitrine"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="vitrine-edit-card-name">
                    {badge.name || badge.area || 'Badge'}
                  </div>
                  <div className="vitrine-edit-card-controls">
                    <button
                      type="button"
                      className="vitrine-edit-arrow"
                      onClick={() => moveVitrineBadge(idx, -1)}
                      disabled={idx === 0}
                      title="Mover para cima"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className="vitrine-edit-position">{idx + 1}</span>
                    <button
                      type="button"
                      className="vitrine-edit-arrow"
                      onClick={() => moveVitrineBadge(idx, 1)}
                      disabled={idx === vitrine.length - 1}
                      title="Mover para baixo"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="badge-admin-muted" style={{ marginBottom: 16 }}>
              Nenhuma badge na vitrine. Adiciona badges abaixo.
            </p>
          )}

          {availableBadges.length > 0 && (
            <div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, fontWeight: 500 }}>
                Badges disponiveis para adicionar:
              </p>
              <div className="vitrine-available-grid">
                {availableBadges.map((badge) => (
                  <button
                    key={badge.badgeDbId}
                    type="button"
                    className="vitrine-available-chip"
                    onClick={() => addBadgeToVitrine(badge)}
                  >
                    <div className="vitrine-available-img">
                      <BadgeImage
                        src={badge.badgeImage}
                        alt={badge.name || 'Badge'}
                        levelKey={badge.levelKey || (badge.isSpecial ? 'special' : undefined)}
                        typeId={badge.typeId || (badge.isSpecial ? 'special' : undefined)}
                      />
                    </div>
                    <span className="vitrine-available-name">{badge.name || badge.area}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {obtainedBadges.length === 0 && (
            <p className="badge-admin-muted">Nenhuma badge obtida ainda.</p>
          )}
        </section>
      </div>
    </Layout>
  )
}
