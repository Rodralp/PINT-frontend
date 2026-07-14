import { useState } from 'react';
import '../css/Shared/BadgeImage.css';

const BADGE_NOT_FOUND = '/badges/badge-not-found.svg';

const badgeFrameByLevel = {
  badge_level_junior: '/badges/J%C3%BAnior.png',
  badge_level_intermediate: '/badges/Interm%C3%A9dio.png',
  badge_level_senior: '/badges/S%C3%A9nior.png',
  badge_level_specialist: '/badges/Especialista.png',
  special: '/badges/Especial.png',
  badge_level_knowledge_lead: '/badges/L%C3%ADder%20de%20Conhecimento.png',
};

const badgeMaskByLevel = {
  badge_level_junior: '/badges/gs_J%C3%BAnior_Especial.png',
  badge_level_intermediate: '/badges/gs_Interm%C3%A9dio.png',
  badge_level_senior: '/badges/gs_S%C3%A9nior.png',
  badge_level_specialist: '/badges/gs_Especialista.png',
  badge_level_knowledge_lead: '/badges/gs_L%C3%ADder%20de%20Conhecimento.png',
  special: '/badges/gs_J%C3%BAnior_Especial.png',
};

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const normalizeImageKey = (value) => {
  const cleanValue = String(value || '').trim();

  try {
    return decodeURI(cleanValue).toLowerCase();
  } catch {
    return cleanValue.toLowerCase();
  }
};

const resolveBadgeFrameImage = ({ levelKey, typeId, levelLabel }) => {
  const directKey = String(levelKey || typeId || '').trim();
  if (badgeFrameByLevel[directKey]) {
    return badgeFrameByLevel[directKey];
  }

  const normalized = normalizeText(`${levelKey || ''} ${typeId || ''} ${levelLabel || ''}`);

  if (normalized.includes('junior')) {
    return badgeFrameByLevel.badge_level_junior;
  }

  if (normalized.includes('intermediate') || normalized.includes('intermedio') || normalized.includes('interm')) {
    return badgeFrameByLevel.badge_level_intermediate;
  }

  if (normalized.includes('senior')) {
    return badgeFrameByLevel.badge_level_senior;
  }

  if (normalized.includes('especialista') || normalized.includes('specialist')) {
    return badgeFrameByLevel.badge_level_specialist;
  }

  if (normalized.includes('especial') || normalized.includes('special')) {
    return badgeFrameByLevel.special;
  }

  if (normalized.includes('lider') || normalized.includes('lead')) {
    return badgeFrameByLevel.badge_level_knowledge_lead;
  }

  return null;
};

const resolveBadgeMaskImage = ({ levelKey, typeId, levelLabel }) => {
  const directKey = String(levelKey || typeId || '').trim();
  if (badgeMaskByLevel[directKey]) {
    return badgeMaskByLevel[directKey];
  }

  const normalized = normalizeText(`${levelKey || ''} ${typeId || ''} ${levelLabel || ''}`);

  if (normalized.includes('junior')) {
    return badgeMaskByLevel.badge_level_junior;
  }

  if (normalized.includes('intermediate') || normalized.includes('intermedio') || normalized.includes('interm')) {
    return badgeMaskByLevel.badge_level_intermediate;
  }

  if (normalized.includes('senior')) {
    return badgeMaskByLevel.badge_level_senior;
  }

  if (normalized.includes('especialista') || normalized.includes('specialist')) {
    return badgeMaskByLevel.badge_level_specialist;
  }

  if (normalized.includes('especial') || normalized.includes('special')) {
    return badgeMaskByLevel.special;
  }

  if (normalized.includes('lider') || normalized.includes('lead')) {
    return badgeMaskByLevel.badge_level_knowledge_lead;
  }

  return null;
};

function BadgeImage({
  src,
  alt = '',
  className = '',
  frameSrc,
  levelKey,
  typeId,
  levelLabel,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const resolvedFrameSrc = frameSrc === false
    ? null
    : frameSrc || resolveBadgeFrameImage({ levelKey, typeId, levelLabel });
  const hasImage = !!src && !imgFailed;
  const resolvedImageSrc = imgFailed ? BADGE_NOT_FOUND : src || null;
  const resolvedMaskSrc = resolveBadgeMaskImage({ levelKey, typeId, levelLabel });
  const isRoundFrame = normalizeImageKey(resolvedFrameSrc || '').includes('especial');

  if (!resolvedFrameSrc || !hasImage) {
    if (!resolvedFrameSrc) {
      return (
        <img
          className={`${className}${isRoundFrame ? ' badge-image--round' : ''}`.trim()}
          src={resolvedImageSrc || BADGE_NOT_FOUND}
          alt={alt}
          onError={() => { if (!imgFailed) setImgFailed(true); }}
        />
      );
    }
    return (
      <span
        className={`badge-image-composite${isRoundFrame ? ' badge-image-composite--round' : ''} ${className}`.trim()}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <span className="badge-image-composite-stage" aria-hidden="true" style={{ background: '#fff' }}>
          <img
            className="badge-image-composite-inner"
            src={BADGE_NOT_FOUND}
            alt=""
            style={resolvedMaskSrc ? {
              WebkitMaskImage: `url('${resolvedMaskSrc}')`,
              WebkitMaskSize: '100% 100%',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: `url('${resolvedMaskSrc}')`,
              maskSize: '100% 100%',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
            } : undefined}
          />
          <img
            className="badge-image-composite-frame"
            src={frameFailed ? null : resolvedFrameSrc}
            alt=""
            onError={() => { if (!frameFailed) setFrameFailed(true); }}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`badge-image-composite${isRoundFrame ? ' badge-image-composite--round' : ''} ${className}`.trim()}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span className="badge-image-composite-stage" aria-hidden="true">
        <img
          className="badge-image-composite-inner"
          src={resolvedImageSrc}
          alt=""
          onError={() => { if (!imgFailed) setImgFailed(true); }}
          style={resolvedMaskSrc ? {
            WebkitMaskImage: `url('${resolvedMaskSrc}')`,
            WebkitMaskSize: '100% 100%',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: `url('${resolvedMaskSrc}')`,
            maskSize: '100% 100%',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
          } : undefined}
        />
        <img
          className="badge-image-composite-frame"
          src={frameFailed ? null : resolvedFrameSrc}
          alt=""
          onError={() => { if (!frameFailed) setFrameFailed(true); }}
        />
      </span>
    </span>
  );
}

export { resolveBadgeFrameImage };
export default BadgeImage;
