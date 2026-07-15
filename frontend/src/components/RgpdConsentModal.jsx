import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchRgpdTopics } from '../services/authService';
import '../css/LoginAccount.css';

function RgpdConsentModal({ isOpen, onAccept, onDecline }) {
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

    fetchRgpdTopics()
      .then((data) => {
        if (!cancelled) {
          setTopics(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTopics([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="terms-modal-overlay">
      <div className="terms-modal-container">
        <div className="terms-modal-header">
          <h1 className="terms-modal-title">{t('rgpd_consent_title')}</h1>
        </div>

        <div className="terms-modal-content">
          {loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#868e96' }}>
              {t('rgpd_consent_loading')}
            </p>
          )}

          {!loading && topics.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#868e96' }}>
              {t('rgpd_consent_no_topics')}
            </p>
          )}

          {!loading && topics.map((topic) => (
            <section className="terms-section" key={topic.id}>
              <h2>{topic.title}</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{topic.body}</p>
            </section>
          ))}
        </div>

        <div className="rgpd-consent-actions">
          <button type="button" className="rgpd-consent-btn decline" onClick={onDecline}>
            {t('rgpd_consent_decline')}
          </button>
          <button type="button" className="rgpd-consent-btn accept" onClick={onAccept}>
            {t('rgpd_consent_accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RgpdConsentModal;
