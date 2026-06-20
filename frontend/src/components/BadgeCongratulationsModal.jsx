import { useTranslation } from 'react-i18next';
import BadgeImage from './BadgeImage';
import '../css/BadgeCongratulationsModal.css';

function BadgeCongratulationsModal({ isOpen, onClose, badge }) {
  const { t, i18n } = useTranslation();

  if (!isOpen || !badge) return null;

  const locale = i18n.language?.startsWith('es') ? 'es-ES' : i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT';

  const formattedDate = badge.date
    ? new Date(badge.date).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const badgeImageSrc = badge.image || '/badges/default.png';

  return (
    <div className="badge-congrats-overlay" onClick={onClose}>
      <div className="badge-congrats-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="badge-congrats-title">{t('badge_congrats_title', 'Parabéns!')}</h2>
        <p className="badge-congrats-subtitle">{t('badge_congrats_subtitle', 'Conquistou um novo badge')}</p>

        <div className="badge-congrats-image-wrapper">
          <BadgeImage
            className="badge-congrats-badge-img"
            src={badgeImageSrc}
            alt={badge.name}
            typeId="special"
            levelLabel={badge.tipo}
          />
        </div>

        <h3 className="badge-congrats-name">{badge.name}</h3>
        <p className="badge-congrats-type">{badge.tipo || t('badge_congrats_special_badge', 'Badge Especial')}</p>

        {badge.points > 0 && (
          <div className="badge-congrats-points">
            + {badge.points} {t('app_points_suffix', 'pontos')}
          </div>
        )}

        <div className="badge-congrats-footer">
          {formattedDate && (
            <span className="badge-congrats-date">{formattedDate}</span>
          )}
          <button
            type="button"
            className="badge-congrats-continue-btn"
            onClick={onClose}
          >
            {t('badge_congrats_continue', 'Continuar')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BadgeCongratulationsModal;
