import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../css/Navbar.css';

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

const IconLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const FlagPortuguese = () => <img className="lang-flag-img" src="/flags/pt.svg" alt="PT" />;
const FlagEnglish = () => <img className="lang-flag-img" src="/flags/gb.svg" alt="GB" />;
const FlagSpanish = () => <img className="lang-flag-img" src="/flags/es.svg" alt="ES" />;

function Navbar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const loginData = getStoredLoginData();
  const isLoggedIn = Number.isInteger(Number(loginData?.id)) && Number(loginData.id) > 0;
  const dashboardPath = resolveDashboardPath(loginData?.roles ?? loginData?.role);

  const languages = [
    { code: 'pt', label: 'Português', flag: FlagPortuguese },
    { code: 'en', label: 'English', flag: FlagEnglish },
    { code: 'es', label: 'Español', flag: FlagSpanish }
  ];

  const currentLang = languages.find(lang => i18n.language?.startsWith(lang.code)) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownWrappers = document.querySelectorAll('.navbar-lang-dropdown-wrapper');
      let isClickInside = false;
      
      dropdownWrappers.forEach(wrapper => {
        if (wrapper && wrapper.contains(event.target)) {
          isClickInside = true;
        }
      });
      
      if (!isClickInside) {
        setShowLangDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setShowLangDropdown(false);
  };

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white shadow-sm fixed-top main-navbar" style={{ height: '60px' }}>
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/SoftinsaLogo.png" alt="Softinsa Logo" height="35" className="d-inline-block align-text-center" />
        </a>
        
        <button className="navbar-toggler border-0 shadow-none ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse bg-white navbar-menu-panel" id="navbarContent">
          <div className="navbar-nav ms-auto mb-0 mb-md-0 d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3 gap-md-4 mt-0 mt-md-0 px-0">
            <a href="https://www.softinsa.pt" className="nav-link text-dark fw-medium d-flex align-items-center gap-1 p-0" target="_blank" rel="noreferrer">
              <IconLink /> www.softinsa.pt
            </a>
            <a
              href="/galeria-publica"
              className="nav-link text-dark fw-medium d-flex align-items-center gap-1 p-0"
              onClick={(event) => {
                event.preventDefault();
                navigate('/galeria-publica');
              }}
            >
              <IconSearch /> {t('nav_public_gallery')}
            </a>
            {isLoggedIn ? (
              <button className="btn btn-primary rounded-pill px-4 fw-semibold border-0" style={{ backgroundColor: '#0088FF' }} onClick={() => navigate(dashboardPath)}>
                {t('nav_back_dashboard')}
              </button>
            ) : (
              <>
                <button className="btn btn-primary rounded-pill px-4 fw-semibold border-0" style={{ backgroundColor: '#0088FF' }} onClick={() => navigate('/entrar')}>
                  {t('nav_login')}
                </button>
                <button className="btn btn-dark rounded-pill px-4 fw-semibold" onClick={() => navigate('/criar')}>
                  {t('nav_register')}
                </button>
              </>
            )}
            <div className="navbar-lang-dropdown-wrapper d-md-none">
              <button 
                className="nav-link text-dark fw-medium d-flex align-items-center gap-1 navbar-lang-btn"
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                onClick={() => setShowLangDropdown(!showLangDropdown)}
              >
                <IconGlobe />
                <span>{t('nav_language')}</span>
              </button>
              {showLangDropdown && (
                <div className="navbar-lang-dropdown navbar-lang-dropdown-mobile">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`navbar-lang-option ${i18n.language?.startsWith(lang.code) ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <lang.flag />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="navbar-lang-dropdown-wrapper d-none d-md-flex" ref={dropdownRef}>
          <button 
            className="nav-link text-dark fw-medium d-flex align-items-center gap-1 navbar-lang-btn"
            style={{ cursor: 'pointer', background: 'none', border: 'none' }}
            onClick={() => setShowLangDropdown(!showLangDropdown)}
          >
            <span>{currentLang.label}</span>
            <IconGlobe />
          </button>
          {showLangDropdown && (
            <div className="navbar-lang-dropdown">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`navbar-lang-option ${i18n.language?.startsWith(lang.code) ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <lang.flag />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>



      
    </nav>
  );
}

export default Navbar;
