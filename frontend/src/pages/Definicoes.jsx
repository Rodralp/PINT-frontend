import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  ChevronRight,
  KeyRound,
  Lock,
  LogOut,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { changePassword } from '../services/authService';
import { fetchUserNotificationSettings, updateUserNotificationSettings } from '../services/communicationService';
import '../css/Definicoes.css';

const DEFAULT_ROLE = 'consultor';
const DADOS_LOGIN_KEY = 'dadosLogin';

const dashboardPathByRole = {
  consultor: '/consultor/dashboard',
  'talent-manager': '/talent-manager/dashboard',
  'service-line-leader': '/service-line-leader/dashboard',
  'admin-gestor': '/admin-gestor/dashboard',
};

const roleLabelKeyByRole = {
  consultor: 'sidebar_section_consultor',
  'talent-manager': 'sidebar_section_tm',
  'service-line-leader': 'sidebar_section_sll',
  'admin-gestor': 'sidebar_section_admin',
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailUpdates: true,
  inAppAlerts: true,
};

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

const normalizeRoles = (rolesValue) => {
  const rawRoles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(';')
      : [];

  const parsedRoles = rawRoles
    .map((role) => String(role).trim().toLowerCase())
    .filter(Boolean);

  const uniqueRoles = [...new Set(parsedRoles)];
  return uniqueRoles.length > 0 ? uniqueRoles : [DEFAULT_ROLE];
};

const resolveDashboardPath = (rolesValue) => {
  const roles = normalizeRoles(rolesValue);
  const path = roles
    .map((role) => dashboardPathByRole[role])
    .find(Boolean);

  return path || '/consultor/dashboard';
};


const updateStoredPassword = ({ accountId, email, newPassword }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const updateAuthStorageItem = (storage, key) => {
    const raw = storage.getItem(key);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const hasMatchingAccountId = Number(parsed?.id) === Number(accountId);
      const hasMatchingEmail = String(parsed?.email || '').trim().toLowerCase() === normalizedEmail;

      if (!hasMatchingAccountId && !hasMatchingEmail) {
        return;
      }

      storage.setItem(key, JSON.stringify({ ...parsed, senha: newPassword }));
    } catch {
      // ignore
    }
  };

  updateAuthStorageItem(sessionStorage, 'loginData');
  updateAuthStorageItem(localStorage, 'loginData');

  const rememberedRaw = localStorage.getItem(DADOS_LOGIN_KEY);
  if (!rememberedRaw) {
    return;
  }

  try {
    const parsedRemembered = JSON.parse(rememberedRaw);
    const rememberedEmail = String(parsedRemembered?.email || '').trim().toLowerCase();
    if (!normalizedEmail || rememberedEmail !== normalizedEmail) {
      return;
    }

    localStorage.setItem(DADOS_LOGIN_KEY, JSON.stringify({
      email: parsedRemembered.email,
      senha: newPassword,
    }));
  } catch {
    // ignore
  }
};

function Definicoes() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const loginData = useMemo(() => getStoredLoginData(), []);
  const roles = useMemo(() => normalizeRoles(loginData?.roles ?? loginData?.role), [loginData]);
  const primaryRole = roles[0];
  const accountId = Number(loginData?.id);
  const isConsultor = roles.includes(DEFAULT_ROLE);
  const roleLabelKey = roleLabelKeyByRole[primaryRole] || roleLabelKeyByRole.consultor;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('account');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({ ...DEFAULT_NOTIFICATION_SETTINGS });
  const [notificationDefaults, setNotificationDefaults] = useState({ ...DEFAULT_NOTIFICATION_SETTINGS });
  const [notificationStatus, setNotificationStatus] = useState({ type: '', message: '' });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadNotificationSettings = async () => {
      if (!Number.isInteger(accountId) || accountId <= 0) {
        if (isMounted) {
          setIsLoadingNotifications(false);
        }
        return;
      }

      try {
        setIsLoadingNotifications(true);
        const data = await fetchUserNotificationSettings();

        if (!isMounted) {
          return;
        }

        const defaults = data?.defaults || DEFAULT_NOTIFICATION_SETTINGS;
        const settings = data?.settings || defaults;

        setNotificationDefaults({ ...DEFAULT_NOTIFICATION_SETTINGS, ...defaults });
        setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...settings });
        setNotificationStatus({ type: '', message: '' });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setNotificationDefaults({ ...DEFAULT_NOTIFICATION_SETTINGS });
        setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS });
        setNotificationStatus({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar as notificacoes.',
        });
      } finally {
        if (isMounted) {
          setIsLoadingNotifications(false);
        }
      }
    };

    loadNotificationSettings();

    return () => {
      isMounted = false;
    };
  }, [accountId]);

  const sectionItems = useMemo(() => {
    const baseItems = [
      {
        id: 'account',
        title: t('settings_section_account'),
        subtitle: t('settings_section_account_sub'),
        icon: UserRound,
      },
      {
        id: 'security',
        title: t('settings_section_security'),
        subtitle: t('settings_section_security_sub'),
        icon: KeyRound,
      },
      {
        id: 'notifications',
        title: t('settings_section_notifications'),
        subtitle: t('settings_section_notifications_sub'),
        icon: Bell,
      },
      {
        id: 'session',
        title: t('settings_section_session'),
        subtitle: t('settings_section_session_sub'),
        icon: LogOut,
      },
    ];

    if (isConsultor) {
      baseItems.splice(2, 0, {
        id: 'preferences',
        title: t('settings_section_preferences'),
        subtitle: t('settings_section_preferences_sub'),
        icon: SlidersHorizontal,
      });
    }

    return baseItems;
  }, [isConsultor, t]);

  const visibleSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return sectionItems;
    }

    return sectionItems.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedSearch),
    );
  }, [sectionItems, searchTerm]);

  const activeSectionId = visibleSections.some((item) => item.id === selectedSectionId)
    ? selectedSectionId
    : visibleSections[0]?.id || null;
  const activeSection = sectionItems.find((item) => item.id === activeSectionId) || null;

  if (!loginData) {
    return <Navigate to="/entrar" replace />;
  }

  const dashboardPath = resolveDashboardPath(roles);
  const userName = loginData?.nome || t('app_user_default');
  const userEmail = loginData?.email || 'user@example.com';

  const handleChangePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordStatus({ type: '', message: '' });
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();
    if (!Number.isInteger(accountId) || accountId <= 0) {
      setPasswordStatus({ type: 'error', message: t('settings_password_error_generic') });
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: t('settings_password_error_required') });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: t('settings_password_error_length') });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: t('settings_password_error_mismatch') });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        accountId,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      updateStoredPassword({
        accountId,
        email: userEmail,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus({ type: 'success', message: t('settings_password_success') });
    } catch (error) {
      setPasswordStatus({ type: 'error', message: error?.message || t('settings_password_error_generic') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleNotification = (field) => {
    setNotificationSettings((current) => ({ ...current, [field]: !current[field] }));
    setNotificationStatus({ type: '', message: '' });
  };

  const handleSaveNotifications = async () => {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      setNotificationStatus({ type: 'error', message: 'Nao foi possivel guardar as notificacoes.' });
      return;
    }

    try {
      setIsSavingNotifications(true);
      const data = await updateUserNotificationSettings(notificationSettings);

      const defaults = data?.defaults || notificationDefaults;
      const settings = data?.settings || notificationSettings;

      setNotificationDefaults({ ...DEFAULT_NOTIFICATION_SETTINGS, ...defaults });
      setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...settings });
      setNotificationStatus({ type: 'success', message: t('settings_notifications_saved') });
    } catch (error) {
      setNotificationStatus({
        type: 'error',
        message: error?.message || 'Nao foi possivel guardar as notificacoes.',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleResetNotifications = () => {
    setNotificationSettings({ ...notificationDefaults });
    setNotificationStatus({ type: '', message: '' });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loginData');
    localStorage.removeItem('loginData');
    localStorage.removeItem('iniciarAuto');
    navigate('/');
  };

  const renderDetailContent = () => {
    if (!activeSection) {
      return (
        <div className="settings-empty-state">
          {t('settings_no_results')}
        </div>
      );
    }

    if (activeSection.id === 'account') {
      return (
        <article className="settings-detail-card">
          <div className="settings-detail-tag">{t('settings_section_account')}</div>
          <h3>{t('settings_account_title')}</h3>
          <p>{t('settings_account_description')}</p>

          <div className="settings-account-grid">
            <div className="settings-info-box">
              <span>{t('settings_field_name')}</span>
              <strong>{userName}</strong>
            </div>
            <div className="settings-info-box">
              <span>{t('settings_field_email')}</span>
              <strong>{userEmail}</strong>
            </div>
            <div className="settings-info-box">
              <span>{t('settings_field_role')}</span>
              <strong>{roles.map((role) => t(roleLabelKeyByRole[role] || roleLabelKeyByRole.consultor)).join(' + ')}</strong>
            </div>
          </div>

          <div className="settings-actions-row">
            <button type="button" className="settings-secondary-btn" onClick={() => navigate('/profile')}>
              {t('settings_go_profile')}
            </button>
            <button type="button" className="settings-primary-btn" onClick={() => navigate(dashboardPath)}>
              {t('settings_back_dashboard')}
            </button>
          </div>
        </article>
      );
    }

    if (activeSection.id === 'security') {
      return (
        <article className="settings-detail-card">
          <div className="settings-detail-tag">{t('settings_section_security')}</div>
          <h3>{t('settings_password_title')}</h3>
          <p>{t('settings_password_description')}</p>

          <form className="settings-password-form" onSubmit={handleSubmitPassword}>
            <label htmlFor="settings-current-password">
              {t('settings_password_current')}
              <input
                id="settings-current-password"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handleChangePasswordInput}
                placeholder={t('settings_password_current')}
              />
            </label>

            <label htmlFor="settings-new-password">
              {t('settings_password_new')}
              <input
                id="settings-new-password"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handleChangePasswordInput}
                placeholder={t('settings_password_new')}
              />
            </label>

            <label htmlFor="settings-confirm-password">
              {t('settings_password_confirm')}
              <input
                id="settings-confirm-password"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handleChangePasswordInput}
                placeholder={t('settings_password_confirm')}
              />
            </label>

            {passwordStatus.message && (
              <div className={`settings-inline-status ${passwordStatus.type === 'success' ? 'success' : 'error'}`} role="status">
                {passwordStatus.message}
              </div>
            )}

            <button type="submit" className="settings-primary-btn" disabled={isChangingPassword}>
              <ShieldCheck size={18} />
              {isChangingPassword ? t('settings_saving') : t('settings_password_save')}
            </button>
          </form>
        </article>
      );
    }

    if (activeSection.id === 'preferences') {
      return (
        <article className="settings-detail-card">
          <div className="settings-detail-tag">{t('settings_section_preferences')}</div>
          <h3>{t('settings_preferences_title')}</h3>
          <p>{t('settings_preferences_description')}</p>

          <div className="settings-actions-row">
            <button type="button" className="settings-primary-btn" onClick={() => navigate('/consultor/preferencias')}>
              <SlidersHorizontal size={18} />
              {t('settings_go_preferences')}
            </button>
            <button type="button" className="settings-secondary-btn" onClick={() => navigate('/consultor/catalogo-badges')}>
              {t('settings_go_catalog')}
            </button>
          </div>
        </article>
      );
    }

    if (activeSection.id === 'notifications') {
      return (
        <article className="settings-detail-card">
          <div className="settings-detail-tag">{t('settings_section_notifications')}</div>
          <h3>{t('settings_notifications_title')}</h3>
          <p>{t('settings_notifications_description')}</p>

          <div className="settings-toggle-list">
            <label className="settings-toggle-item">
              <span>{t('settings_notifications_email')}</span>
              <input
                type="checkbox"
                checked={Boolean(notificationSettings.emailUpdates)}
                disabled={isLoadingNotifications || isSavingNotifications}
                onChange={() => handleToggleNotification('emailUpdates')}
              />
            </label>

            <label className="settings-toggle-item">
              <span>{t('settings_notifications_in_app')}</span>
              <input
                type="checkbox"
                checked={Boolean(notificationSettings.inAppAlerts)}
                disabled={isLoadingNotifications || isSavingNotifications}
                onChange={() => handleToggleNotification('inAppAlerts')}
              />
            </label>


          </div>

          {isLoadingNotifications && (
            <div className="settings-inline-status info" role="status">
              A carregar definicoes de notificacoes...
            </div>
          )}

          {notificationStatus.message && !isLoadingNotifications && (
            <div
              className={`settings-inline-status ${notificationStatus.type === 'error' ? 'error' : 'success'}`}
              role="status"
            >
              {notificationStatus.message}
            </div>
          )}

          <div className="settings-actions-row">
            <button
              type="button"
              className="settings-primary-btn"
              onClick={handleSaveNotifications}
              disabled={isLoadingNotifications || isSavingNotifications}
            >
              <Save size={18} />
              {isSavingNotifications ? t('settings_saving') : t('settings_save_changes')}
            </button>
            <button
              type="button"
              className="settings-secondary-btn"
              onClick={handleResetNotifications}
              disabled={isLoadingNotifications || isSavingNotifications}
            >
              {t('settings_reset_defaults')}
            </button>
          </div>
        </article>
      );
    }

    return (
      <article className="settings-detail-card">
        <div className="settings-detail-tag">{t('settings_section_session')}</div>
        <h3>{t('settings_session_title')}</h3>
        <p>{t('settings_session_description')}</p>

        <div className="settings-actions-row">
          <button type="button" className="settings-danger-btn" onClick={handleLogout}>
            <LogOut size={18} />
            {t('topbar_logout')}
          </button>
          <button type="button" className="settings-secondary-btn" onClick={() => navigate('/')}>
            {t('settings_go_home')}
          </button>
        </div>
      </article>
    );
  };

  return (
    <Layout>
      <div className="settings-page">
        <header className="settings-header">
          <h1>{t('settings_title')}</h1>
        </header>

        <section className="settings-shell">
          <div className="settings-toolbar">
            <label className="settings-search-wrap" htmlFor="settings-search-input">
              <Search size={20} />
              <input
                id="settings-search-input"
                type="text"
                value={searchTerm}
                placeholder={t('settings_search_placeholder')}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label={t('settings_search_placeholder')}
              />
            </label>

            <button type="button" className="settings-toolbar-btn" onClick={() => navigate(dashboardPath)}>
              <ChevronRight size={18} />
              {t('settings_back_dashboard')}
            </button>

            <button
              type="button"
              className="settings-toolbar-btn"
              onClick={() => setSelectedSectionId(isConsultor ? 'preferences' : 'security')}
            >
              <Lock size={18} />
              {isConsultor ? t('settings_go_preferences') : t('settings_password_title')}
            </button>
          </div>

          <div className="settings-grid">
            <aside className="settings-list-panel">
              <div className="settings-panel-head">
                <h2>{t('settings_panel_title')}</h2>
                <span>{visibleSections.length}</span>
              </div>

              <div className="settings-list">
                {visibleSections.map((item) => {
                  const Icon = item.icon;
                  const isSelected = item.id === activeSectionId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`settings-list-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSectionId(item.id)}
                    >
                      <span className="settings-list-icon">
                        <Icon size={18} />
                      </span>
                      <span className="settings-list-content">
                        <strong>{item.title}</strong>
                        <small>{item.subtitle}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="settings-detail-panel">
              {renderDetailContent()}
            </section>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Definicoes;
