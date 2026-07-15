import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recoverPassword, resetPassword } from '../services/authService';
import '../css/ForgotPassword.css';
import PuzzleCaptcha from './PuzzleCaptcha';

const dashboardPathByRole = {
  consultor: '/consultor/dashboard',
  'talent-manager': '/talent-manager/dashboard',
  'service-line-leader': '/service-line-leader/dashboard',
  'admin-gestor': '/admin-gestor/dashboard',
};

const DEFAULT_ROLE = 'consultor';

const normalizeRoles = (rolesValue) => {
  const rawRoles = Array.isArray(rolesValue)
    ? rolesValue
    : typeof rolesValue === 'string'
      ? rolesValue.split(';')
      : [];
  const parsedRoles = rawRoles.map((r) => String(r).trim().toLowerCase()).filter(Boolean);
  const unique = [...new Set(parsedRoles)];
  return unique.length > 0 ? unique : [DEFAULT_ROLE];
};

const resolveDashboardPath = (rolesValue) => {
  const roles = normalizeRoles(rolesValue);
  return roles.map((role) => dashboardPathByRole[role]).find(Boolean) || '/consultor/dashboard';
};

function ForgotPasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [recoveredAccountId, setRecoveredAccountId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError(t('err_required_email'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('err_invalid_email'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError(t('forgot_password_too_short'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('forgot_password_mismatch'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (validateEmail()) {
      try {
        setIsLoading(true);
        const data = await recoverPassword({ email });
        setRecoveredAccountId(data.accountId);
        setStep('captcha');
      } catch {
        setEmailError(t('forgot_email_not_found'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCaptchaComplete = () => {
    setStep('newPassword');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    try {
      setIsLoading(true);
      const account = await resetPassword({ email, newPassword });

      const accountRoles = normalizeRoles(account.roles ?? account.role);

      const dadosLogin = {
        id: account.id,
        nome: account.nome,
        email: account.email,
        role: accountRoles[0],
        roles: accountRoles,
        status: account.status,
        hasPreferences: Boolean(account.hasPreferences),
        token: account.token,
      };

      sessionStorage.setItem('loginData', JSON.stringify(dadosLogin));

      const dashboardPath = resolveDashboardPath(accountRoles);
      const mustChoosePreferences = accountRoles.includes(DEFAULT_ROLE) && !account.hasPreferences;

      handleReset();
      window.location.href = mustChoosePreferences ? '/consultor/preferencias' : dashboardPath;
    } catch {
      setPasswordError(t('forgot_password_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setEmailError('');
    setRecoveredAccountId(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setStep('email');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        <button className="forgot-password-close" onClick={handleReset}>
          ✕
        </button>

        {step === 'email' && (
          <div className="forgot-password-content">
            <h2>{t('forgot_title')}</h2>
            <p>{t('forgot_subtitle')}</p>
            
            <form onSubmit={handleEmailSubmit}>
              <div className="forgot-form-group">
                <input
                  type="email"
                  placeholder={t('login_placeholder_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? 'forgot-input error' : 'forgot-input'}
                />
                {emailError && <span className="forgot-error">{emailError}</span>}
              </div>
              <button type="submit" className="forgot-btn-continue">
                {isLoading ? 'A validar...' : t('forgot_verify_email')}
              </button>
            </form>
          </div>
        )}

        {step === 'captcha' && (
          <div className="forgot-password-content">
            <h2>{t('forgot_security_title')}</h2>
            <p>{t('forgot_security_subtitle')}</p>
            <PuzzleCaptcha onComplete={handleCaptchaComplete} />
          </div>
        )}

        {step === 'newPassword' && (
          <div className="forgot-password-content">
            <div className="forgot-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2>{t('forgot_set_new_password')}</h2>
            <p>{t('forgot_subtitle')}</p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="forgot-form-group">
                <input
                  type="password"
                  placeholder={t('forgot_new_password')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="forgot-input"
                />
              </div>
              <div className="forgot-form-group">
                <input
                  type="password"
                  placeholder={t('forgot_confirm_password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={passwordError ? 'forgot-input error' : 'forgot-input'}
                />
                {passwordError && <span className="forgot-error">{passwordError}</span>}
              </div>
              <button type="submit" className="forgot-btn-continue">
                {isLoading ? 'A guardar...' : t('forgot_set_new_password')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
