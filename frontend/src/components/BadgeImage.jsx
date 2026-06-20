import '../css/Shared/BadgeImage.css';

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
  const resolvedFrameSrc = frameSrc === false
    ? null
    : frameSrc || resolveBadgeFrameImage({ levelKey, typeId, levelLabel });
  const resolvedImageSrc = src || resolvedFrameSrc;
  const resolvedMaskSrc = resolveBadgeMaskImage({ levelKey, typeId, levelLabel });
  const shouldCompose =
    resolvedFrameSrc &&
    resolvedImageSrc &&
    normalizeImageKey(resolvedImageSrc) !== normalizeImageKey(resolvedFrameSrc);
  const isRoundFrame = normalizeImageKey(resolvedFrameSrc || '').includes('especial');

  if (!shouldCompose) {
    return (
      <img
        className={`${className}${isRoundFrame ? ' badge-image--round' : ''}`.trim()}
        src={resolvedImageSrc}
        alt={alt}
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
      <span className="badge-image-composite-stage" aria-hidden="true">
        <img
          className="badge-image-composite-inner"
          src={resolvedImageSrc}
          alt=""
          style={resolvedMaskSrc ? {
            WebkitMaskImage: `url('${resolvedMaskSrc}')`,
            WebkitMaskSize: 'contain',
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: `url('${resolvedMaskSrc}')`,
            maskSize: 'contain',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
          } : undefined}
        />
        <img className="badge-image-composite-frame" src={resolvedFrameSrc} alt="" />
      </span>
    </span>
  );
}

export { resolveBadgeFrameImage };
export default BadgeImage;
