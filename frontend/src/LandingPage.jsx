import Navbar from './components/Navbar';
import './css/LandingPage.css';
import { useTranslation } from 'react-i18next';

function LandingPage() {
  const { t, i18n } = useTranslation();
  

  return (
    <div className="lp-root">
      <Navbar />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
        </div>
      </section>

      {/* INFO SECTION */}
      <section className="lp-info">
        <div className="lp-info-inner">
          <div className="lp-info-col">
            <h2 className="lp-info-title">{t("about_title")}</h2>
            <p className="lp-info-lead">{t("about_lead")}</p>
            <p className="lp-info-body">
              {t("about_body")}
            </p>
          </div>
          <div className="lp-info-col">
            <h2 className="lp-info-title">{t("services_title")}</h2>
            <p className="lp-info-lead">{t("services_lead")}</p>
            <p className="lp-info-body">
              {t("services_body")}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-left">
            <h3 className="lp-footer-title">{t("footer_title")}</h3>
            <a href="mailto:info@softinsa.pt" className="lp-footer-btn">
              {t("footer_button")}
            </a>
          </div>
          <div className="lp-footer-right">
            <a href="#softinsa" className="lp-footer-link">{t("footer_softinsa")}</a>
            <a href="#privacidade" className="lp-footer-link">{t("footer_privacy")}</a>
            <a href="#utilizacao" className="lp-footer-link">{t("footer_terms")}</a>
            <a href="#contactos" className="lp-footer-link">{t("footer_contacts")}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;