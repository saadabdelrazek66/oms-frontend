const DAY_LABELS_AR = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

/**
 * Extract up to 2 uppercase initials from a person's name.
 */
export function getInitials(name = '', fallback = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return fallback;
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();
}

/**
 * Safely parse the stored user object from localStorage.
 */
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') || {};
  } catch {
    return {};
  }
}

/**
 * Extract the current user's first name safely.
 */
export function getUserFirstName(fallback = 'عضو الفريق') {
  const user = getStoredUser();
  return user?.name ? String(user.name).trim().split(/\s+/)[0] : fallback;
}

/**
 * Format a full localized Arabic date (weekday, day month year).
 */
export function formatArabicFullDate(date = new Date()) {
  return new Date(date).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format timestamp into concise Arabic short month/day + 12h time.
 */
export function formatArabicShortDateTime(dateString, emptyLabel = 'غير محدد') {
  if (!dateString) return emptyLabel;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return emptyLabel;
  return d.toLocaleString('ar-EG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format 24h "HH:MM" time strings into localized 12h Arabic notation.
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).slice(0, 5).split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (Number.isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Format a work-week day range into Arabic (e.g. "من السبت إلى الخميس").
 */
export function formatWorkDaysRange(startDay, endDay) {
  if (!startDay || !endDay) return '';
  const s = DAY_LABELS_AR[String(startDay).toLowerCase()] || startDay;
  const e = DAY_LABELS_AR[String(endDay).toLowerCase()] || endDay;
  return `من ${s} إلى ${e}`;
}

/**
 * Safely join arrays or JSON-encoded array strings into a readable list.
 */
export function safeJoinList(value, separator = '، ') {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(separator);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(separator);
    } catch {
      return value;
    }
  }
  return String(value);
}

/**
 * Compute capped daily capacity utilization percentage.
 */
export function computeCapacityPercent(hours = 0, maxCapacity = 8) {
  const max = Number(maxCapacity) > 0 ? Number(maxCapacity) : 8;
  return Math.min(100, Math.round((Number(hours || 0) / max) * 100));
}

/**
 * Determine workload badge theme class from assigned hours vs capacity.
 */
export function getWorkloadBadgeClass(hours = 0, maxCapacity = 8) {
  const h = Number(hours || 0);
  const max = Number(maxCapacity) > 0 ? Number(maxCapacity) : 8;
  if (h > max) return 'badge-red';
  if (h >= max * 0.85) return 'badge-orange';
  return 'badge-green';
}

/**
 * Determine workload progress-bar fill theme class.
 */
export function getWorkloadFillClass(hours = 0, maxCapacity = 8) {
  const h = Number(hours || 0);
  const max = Number(maxCapacity) > 0 ? Number(maxCapacity) : 8;
  if (h > max) return 'fill-red';
  if (h >= max * 0.85) return 'fill-orange';
  return 'fill-green';
}
