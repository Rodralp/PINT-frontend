import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import { loginAccount } from './services/authService';
import apiClient from './services/apiClient';
import './css/LoginAccount.css';

const dashboardPathByRole = {
  consultor: '/consultor/dashboard',
  'talent-manager': '/talent-manager/dashboard',
  'service-line-leader': '/service-line-leader/dashboard',
  'admin-gestor': '/admin-gestor/dashboard',
};

const DEFAULT_ROLE = 'consultor';
const CONSULTOR_PREFERENCES_PATH = '/consultor/preferencias';
const DADOS_LOGIN_KEY = 'dadosLogin';
const INICIAR_AUTO_KEY = 'iniciarAuto';

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
  const firstMatchingPath = roles
    .map((role) => dashboardPathByRole[role])
    .find(Boolean);

  return firstMatchingPath || '/consultor/dashboard';
};

const getRememberedLoginData = () => {
  try {
    const raw = localStorage.getItem(DADOS_LOGIN_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...data, guardarDados: true };
    }
  } catch { /* ignore */ }
  return null;
};

function Entrar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Preencher campos caso o utilizador tenha escolhido guardar dados de login.
  const savedLoginData = getRememberedLoginData();
  const initialFormData = savedLoginData ? {
    email: savedLoginData.email || '',
    senha: savedLoginData.senha || '',
    guardarDados: Boolean(savedLoginData.guardarDados),
  } : {
    email: '',
    senha: '',
    guardarDados: false
  };

  const [formData, setFormData] = useState(initialFormData);
  const [erros, setErros] = useState({});
  const [mostraSenha, setMostraSenha] = useState(false);
  const [loginFeedbackType, setLoginFeedbackType] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/consultor/dashboard');

  // If loginData already exists, redirect to dashboard.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('loginData') || localStorage.getItem('loginData');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          const path = dashboardPathByRole[parsed.role] || '/consultor/dashboard';
          navigate(path, { replace: true });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Limpar erro do campo ao digitar
    if (erros[name]) {
      setErros(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleMostraSenha = () => setMostraSenha(!mostraSenha);

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.email.trim()) {
      novosErros.email = t('err_required_email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = t('err_invalid_email');
    }

    if (!formData.senha) {
      novosErros.senha = t('err_required_password');
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoginFeedbackType(null);

      const account = await loginAccount({
        email: formData.email,
        senha: formData.senha,
      });

      const accountRoles = normalizeRoles(account.roles ?? account.role);
      const hasPreferences = Boolean(account.hasPreferences);

      const dadosLogin = {
        ...formData,
        id: account.id,
        nome: account.nome,
        email: account.email,
        role: accountRoles[0],
        roles: accountRoles,
        status: account.status,
        hasPreferences,
        token: account.token,
      };

      if (formData.guardarDados) {
        localStorage.setItem(DADOS_LOGIN_KEY, JSON.stringify({
          email: formData.email,
          senha: formData.senha,
        }));
        localStorage.setItem(INICIAR_AUTO_KEY, '1');
        localStorage.setItem('loginData', JSON.stringify(dadosLogin));
      } else {
        localStorage.removeItem(DADOS_LOGIN_KEY);
        localStorage.removeItem(INICIAR_AUTO_KEY);
        localStorage.removeItem('loginData');
      }

      // O estado autenticado fica apenas na sessão ativa.
      sessionStorage.setItem('loginData', JSON.stringify(dadosLogin));

      apiClient.get(`/consultor/user-image?accountId=${account.id}`).then((imgRes) => {
        if (imgRes.data?.image) {
          const currentSession = JSON.parse(sessionStorage.getItem('loginData') || '{}');
          currentSession.avatar = imgRes.data.image;
          sessionStorage.setItem('loginData', JSON.stringify(currentSession));

          if (formData.guardarDados) {
            const currentLocal = JSON.parse(localStorage.getItem('loginData') || '{}');
            currentLocal.avatar = imgRes.data.image;
            localStorage.setItem('loginData', JSON.stringify(currentLocal));
          }
        }
      }).catch(() => {});

      const mustChoosePreferences = accountRoles.includes(DEFAULT_ROLE) && !hasPreferences;
      setRedirectPath(mustChoosePreferences ? CONSULTOR_PREFERENCES_PATH : resolveDashboardPath(accountRoles));
      setLoginFeedbackType('success');
    } catch (error) {
      if (error?.code === 'ACCOUNT_PENDING_APPROVAL') {
        setErros({});
        setLoginFeedbackType('pending');
        return;
      }

      setErros(prev => ({
        ...prev,
        email: t('err_invalid_credentials'),
        senha: t('err_invalid_credentials')
      }));
    }
  };

  const handleCloseFeedback = () => {
    const shouldRedirect = loginFeedbackType === 'success';
    setLoginFeedbackType(null);

    if (shouldRedirect) {
      navigate(redirectPath);
    }
  };

  return (
    <div className="entrar-root">
      <Navbar />

      {/* TERMS MODAL */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* PRIVACY MODAL */}
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} />

      {/* SUCCESS MODAL */}
      {loginFeedbackType && (
        <div className="entrar-overlay">
          <div className="entrar-success-modal">
            <svg
              className="entrar-success-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke={loginFeedbackType === 'success' ? '#0088FF' : '#F59E0B'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {loginFeedbackType === 'success' ? (
                <polyline points="20 6 9 17 4 12"/>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
            <h2>{loginFeedbackType === 'success' ? t('login_success_title') : t('login_pending_title')}</h2>
            <p>{loginFeedbackType === 'success' ? t('login_success_subtitle') : t('login_pending_subtitle')}</p>
            <button onClick={handleCloseFeedback} className="entrar-success-btn">
              {loginFeedbackType === 'success' ? t('login_success_cta') : t('login_pending_cta')}
            </button>
          </div>
        </div>
      )}

      <div className="entrar-container">
        <div className="entrar-form-container">
          {/* Título e subtítulo */}
          <div className="entrar-header">
            <h1>{t('login_title')}</h1>
            <p>{t('login_subtitle')}</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="entrar-form">
            <div className="entrar-form-group">
              <input
                type="email"
                name="email"
                placeholder={t('login_placeholder_email')}
                value={formData.email}
                onChange={handleChange}
                className={erros.email ? 'entrar-input erro' : 'entrar-input'}
              />
              {erros.email && <span className="entrar-erro">{erros.email}</span>}
            </div>

            <div className="entrar-form-group">
              <div className="entrar-password-wrapper">
                <input
                  type={mostraSenha ? 'text' : 'password'}
                  name="senha"
                  placeholder={t('login_placeholder_password')}
                  value={formData.senha}
                  onChange={handleChange}
                  className={erros.senha ? 'entrar-input erro' : 'entrar-input'}
                />
                <svg 
                  className="entrar-eye-icon" 
                  onClick={toggleMostraSenha}
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {mostraSenha ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  )}
                </svg>
              </div>
              {erros.senha && <span className="entrar-erro">{erros.senha}</span>}
            </div>

            <div className="entrar-form-group entrar-checkbox-group">
              <input
                type="checkbox"
                name="guardarDados"
                id="guardarDados"
                checked={formData.guardarDados}
                onChange={handleChange}
              />
              <label htmlFor="guardarDados">{t('login_remember')}</label>
            </div>

            <button type="submit" className="entrar-btn-continuar">
              {t('login_continue')}
            </button>
          </form>

          {/* Forgot password link */}
          <div className="entrar-forgot-link">
            <a href="#esquecer" onClick={(e) => { e.preventDefault(); setShowForgotPasswordModal(true); }}>{t('forgot_link')}</a>
          </div>

          {/* Signup link */}
          <div className="entrar-signup-link">
            <span>{t('login_no_account')}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/criar'); }}>{t('nav_register')}</a>
          </div>

          {/* Footer links */}
          <div className="entrar-footer-links">
            <p>{t('legal_agree_prefix')}</p>
            <div className="entrar-links">
              <a href="#termos" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>{t('legal_terms')}</a>
              <span>{` ${t('legal_and')} `}</span>
              <a href="#privacidade" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>{t('legal_privacy')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Entrar;
