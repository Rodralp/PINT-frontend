const STORAGE_KEY = 'adminBadgeDrafts';

const canUseStorage = () => typeof sessionStorage !== 'undefined';

export const readAdminBadges = () => {
  if (!canUseStorage()) {
    return [];
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeAdminBadges = (badges) => {
  if (!canUseStorage()) {
    return;
  }

  const safeBadges = Array.isArray(badges) ? badges : [];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeBadges));
};

const matchesBadge = (candidate, target) => {
  if (candidate?.badgeDbId && target?.badgeDbId) {
    return Number(candidate.badgeDbId) === Number(target.badgeDbId);
  }

  if (candidate?.id && target?.id) {
    return String(candidate.id) === String(target.id);
  }

  return false;
};

export const upsertAdminBadge = (badge) => {
  const current = readAdminBadges();
  const next = [...current];
  const index = next.findIndex((item) => matchesBadge(item, badge));

  if (index >= 0) {
    next[index] = { ...next[index], ...badge };
  } else {
    next.push(badge);
  }

  writeAdminBadges(next);
  return next;
};

export const mergeAdminBadges = (baseBadges = [], adminBadgesOverride) => {
  const adminBadges = Array.isArray(adminBadgesOverride)
    ? adminBadgesOverride
    : readAdminBadges();

  if (!Array.isArray(baseBadges) || adminBadges.length === 0) {
    return Array.isArray(baseBadges) ? [...baseBadges] : [...adminBadges];
  }

  const merged = [...baseBadges];

  adminBadges.forEach((adminBadge) => {
    const index = merged.findIndex((item) => matchesBadge(item, adminBadge));
    if (index >= 0) {
      merged[index] = { ...merged[index], ...adminBadge };
    } else {
      merged.push(adminBadge);
    }
  });

  return merged;
};
