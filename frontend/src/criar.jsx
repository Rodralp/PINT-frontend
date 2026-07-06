import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import RgpdConsentModal from './components/RgpdConsentModal';
import { registerAccount } from './services/authService';
import './css/LoginAccount.css';

function CriarConta() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmaSenha: ''
  });

  const [erros, setErros] = useState({});
  const [mostraSenha, setMostraSenha] = useState(false);
  const [mostraConfirmaSenha, setMostraConfirmaSenha] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRgpdModal, setShowRgpdModal] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
  const toggleMostraConfirmaSenha = () => setMostraConfirmaSenha(!mostraConfirmaSenha);

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = t('err_required_name');
    }

    if (!formData.email.trim()) {
      novosErros.email = t('err_required_email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      novosErros.email = t('err_invalid_email');
    }

    if (!formData.senha) {
      novosErros.senha = t('err_required_password');
    } else if (formData.senha.length < 8) {
      novosErros.senha = t('err_password_min');
    }

    if (!formData.confirmaSenha) {
      novosErros.confirmaSenha = t('err_required_confirm_password');
    } else if (formData.senha !== formData.confirmaSenha) {
      novosErros.confirmaSenha = t('err_password_mismatch');
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setShowRgpdModal(true);
  };

  const handleRgpdAccept = () => {
    setShowRgpdModal(false);
    submitRegistration();
  };

  const handleRgpdDecline = () => {
    setShowRgpdModal(false);
  };

  const submitRegistration = async () => {
    try {
      await registerAccount({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      });

      setApiError('');
      setShowSuccess(true);

      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmaSenha: ''
      });
    } catch {
      setApiError('Ja existe conta com este email ou nao foi possivel criar a conta.');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/');
  };

  return (
    <div className="entrar-root">
      <Navbar />

      {/* TERMS MODAL */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* PRIVACY MODAL */}
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* RGPD CONSENT MODAL */}
      <RgpdConsentModal
        isOpen={showRgpdModal}
        onAccept={handleRgpdAccept}
        onDecline={handleRgpdDecline}
      />

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="entrar-overlay">
          <div className="entrar-success-modal">
            <svg className="entrar-success-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0088FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <h2>{t('register_success_title')}</h2>
            <p>{t('register_success_subtitle')}</p>
            <button onClick={handleCloseSuccess} className="entrar-success-btn">
              {t('register_success_cta')}
            </button>
          </div>
        </div>
      )}

      <div className="entrar-container">
        <div className="entrar-form-container">
        {/* TÃ­tulo e subtÃ­tulo */}
        <div className="entrar-header">
          <h1>{t('register_title')}</h1>
          <p>{t('register_subtitle')}</p>
        </div>

        {apiError && (
          <div className="alert alert-danger py-2" role="alert">
            {apiError}
          </div>
        )}

        {/* FormulÃ¡rio */}
        <form onSubmit={handleSubmit} className="entrar-form">
          <div className="entrar-form-group">
            <input
              type="text"
              name="nome"
              placeholder={t('register_placeholder_name')}
              value={formData.nome}
              onChange={handleChange}
              className={erros.nome ? 'entrar-input erro' : 'entrar-input'}
            />
            {erros.nome && <span className="entrar-erro">{erros.nome}</span>}
          </div>

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

          <div className="entrar-form-group">
            <div className="entrar-password-wrapper">
              <input
                type={mostraConfirmaSenha ? 'text' : 'password'}
                name="confirmaSenha"
                placeholder={t('register_placeholder_confirm_password')}
                value={formData.confirmaSenha}
                onChange={handleChange}
                className={erros.confirmaSenha ? 'entrar-input erro' : 'entrar-input'}
              />
              <svg 
                className="entrar-eye-icon" 
                onClick={toggleMostraConfirmaSenha}
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
                {mostraConfirmaSenha ? (
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
            {erros.confirmaSenha && <span className="entrar-erro">{erros.confirmaSenha}</span>}
          </div>

          <button type="submit" className="entrar-btn-continuar">
            {t('register_continue')}
          </button>
        </form>

        {/* Login link */}
        <div className="entrar-login-link">
          <span>{t('register_have_account')}</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/entrar'); }}>{t('register_login_link')}</a>
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

export default CriarConta;

