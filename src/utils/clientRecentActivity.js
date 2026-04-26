const STORAGE_PREFIX = 'hv_recent_activity';
const MAX_ITEMS = 8;

const getStorageKey = (userId) => `${STORAGE_PREFIX}:${userId || 'guest'}`;

export const recordRecentActivity = (userId, item) => {
  if (!userId || !item?.type || !item?.id) return;

  const key = getStorageKey(userId);
  const nextItem = {
    ...item,
    viewedAt: item.viewedAt || new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(key);
    const current = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(current)
      ? current.filter((entry) => !(entry.type === nextItem.type && entry.id === nextItem.id))
      : [];

    localStorage.setItem(key, JSON.stringify([nextItem, ...filtered].slice(0, MAX_ITEMS)));
  } catch {
    // Ignore storage errors to avoid breaking navigation flows.
  }
};

export const getRecentActivity = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
