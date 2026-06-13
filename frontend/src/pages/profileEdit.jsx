import { useState } from 'react'
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../components/Layout'
import apiClient from '../services/apiClient'
import '../css/AdminGestor/BadgeAdmin.css'

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
  if (source === 'local') {
    localStorage.setItem('loginData', serialized)
    sessionStorage.removeItem('loginData')
    return
  }
  sessionStorage.setItem('loginData', serialized)
  localStorage.removeItem('loginData')
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const stored = readStoredLogin()
  const loginData = stored.data || {}

  const [name, setName] = useState(loginData.nome || '')
  const [location, setLocation] = useState(loginData.location || loginData.localidade || '')
  const [avatar, setAvatar] = useState(loginData.avatar || `https://i.pravatar.cc/120?u=${encodeURIComponent((loginData.email||loginData.nome||'').toLowerCase())}`)

  const [skills, setSkills] = useState(Array.isArray(loginData.skillsItems) ? loginData.skillsItems.map(s => ({ ...s, visible: typeof s.visible === 'boolean' ? s.visible : true })) : [])
  const [certifications, setCertifications] = useState(Array.isArray(loginData.certificationsItems) ? loginData.certificationsItems.map(c => ({ ...c, visible: typeof c.visible === 'boolean' ? c.visible : true })) : [])

  const [statusMessage, setStatusMessage] = useState('')

  const addSkill = () => setSkills(s => [...s, { title: '', subtitleKey: '', accent: 'gold', visible: true }])
  const removeSkill = (idx) => setSkills(s => s.filter((_,i) => i!==idx))
  const updateSkill = (idx, patch) => setSkills(s => s.map((it,i) => i===idx ? { ...it, ...patch } : it))

  const addCert = () => setCertifications(s => [...s, { title: '', subtitleKey: '', accent: 'blue', visible: true }])
  const removeCert = (idx) => setCertifications(s => s.filter((_,i) => i!==idx))
  const updateCert = (idx, patch) => setCertifications(s => s.map((it,i) => i===idx ? { ...it, ...patch } : it))

  const onSave = async () => {
    const newData = {
      ...loginData,
      nome: name,
      location,
      avatar,
      skillsItems: skills,
      certificationsItems: certifications,
    }

    persistStoredLogin(stored.source, newData)

    try {
      await apiClient.put('/consultor/profile', { accountId: loginData.id, nome: name })
      setStatusMessage('')
    } catch {
      // falha silenciosa — a edição local foi guardada
    }

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
            <button type="button" className="badge-admin-btn primary" onClick={onSave}>
              <Save size={16} />
              {t('save') || 'Guardar'}
            </button>
          </div>
        </header>

        {statusMessage && (
          <div className="badge-admin-alert" role="status">{statusMessage}</div>
        )}

        <section className="badge-admin-card">
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div className="badge-admin-image-preview-wrap" style={{ flexShrink: 0 }}>
              <img
                className="badge-admin-image-preview"
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover' }}
                src={avatar}
                alt="avatar"
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <label className="badge-admin-field" style={{ flex: 1 }}>
                  <span>Nome</span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </label>
                <label className="badge-admin-field" style={{ flex: 1 }}>
                  <span>Localização</span>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Lisboa, Portugal"
                  />
                </label>
              </div>
              <label className="badge-admin-field">
                <span>Imagem de Perfil</span>
                <input
                  type="text"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>
        </section>

        <section className="badge-admin-card">
          <div className="badge-admin-section-title">{t('profile_skills') || 'Competências'}</div>
          <div className="badge-admin-reqs">
            {skills.map((s, idx) => (
              <div key={idx} className="badge-admin-req-row standard">
                <input
                  type="text"
                  value={s.title}
                  onChange={e => updateSkill(idx, { title: e.target.value })}
                  placeholder={t('skill_title') || 'Título'}
                />
                <input
                  type="text"
                  value={s.subtitleKey}
                  onChange={e => updateSkill(idx, { subtitleKey: e.target.value })}
                  placeholder={t('skill_subtitle') || 'Subtítulo'}
                />
                <label className="badge-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={s.visible}
                    onChange={e => updateSkill(idx, { visible: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 13 }}>{t('visible') || 'Mostrar'}</span>
                </label>
                <button
                  type="button"
                  className="badge-admin-btn icon"
                  onClick={() => removeSkill(idx)}
                  aria-label={t('remove') || 'Remover'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="badge-admin-btn ghost" onClick={addSkill}>
              <Plus size={16} />
              {t('add_skill') || 'Adicionar Competência'}
            </button>
          </div>
        </section>

        <section className="badge-admin-card">
          <div className="badge-admin-section-title">{t('profile_certifications') || 'Certificações'}</div>
          <div className="badge-admin-reqs">
            {certifications.map((c, idx) => (
              <div key={idx} className="badge-admin-req-row standard">
                <input
                  type="text"
                  value={c.title}
                  onChange={e => updateCert(idx, { title: e.target.value })}
                  placeholder={t('cert_title') || 'Título'}
                />
                <input
                  type="text"
                  value={c.subtitleKey}
                  onChange={e => updateCert(idx, { subtitleKey: e.target.value })}
                  placeholder={t('cert_subtitle') || 'Subtítulo'}
                />
                <label className="badge-admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={e => updateCert(idx, { visible: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 13 }}>{t('visible') || 'Mostrar'}</span>
                </label>
                <button
                  type="button"
                  className="badge-admin-btn icon"
                  onClick={() => removeCert(idx)}
                  aria-label={t('remove') || 'Remover'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="badge-admin-btn ghost" onClick={addCert}>
              <Plus size={16} />
              {t('add_cert') || 'Adicionar Certificação'}
            </button>
          </div>
        </section>
      </div>
    </Layout>
  )
}
