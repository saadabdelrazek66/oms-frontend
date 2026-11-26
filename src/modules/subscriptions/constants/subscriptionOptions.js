export const DEFAULT_REMINDER_PRESETS = [
  { value: 60, label: 'قبل 60 يوماً' },
  { value: 30, label: 'قبل 30 يوماً' },
  { value: 14, label: 'قبل 14 يوماً' },
  { value: 7, label: 'قبل 7 أيام' },
  { value: 3, label: 'قبل 3 أيام' },
  { value: 1, label: 'قبل يوم واحد' },
  { value: 0, label: 'في نفس يوم الانتهاء' },
];

export const DEFAULT_REMINDER_DAYS = [30, 14, 7, 3, 1, 0];

export const DEFAULT_CHANNELS = ['email', 'system', 'browser'];

export const SUPPORTED_CURRENCIES = ['USD', 'EGP', 'SAR', 'AED', 'EUR', 'GBP'];

export const URGENCY_META = {
  overdue: {
    value: 'overdue',
    label: 'منتهي / متأخر',
    color: 'rose',
    badgeClass: 'badge-urgency-overdue',
  },
  critical: {
    value: 'critical',
    label: 'حرج - تجديد عاجل',
    color: 'orange',
    badgeClass: 'badge-urgency-critical',
  },
  warning: {
    value: 'warning',
    label: 'تنبيه مبكر',
    color: 'amber',
    badgeClass: 'badge-urgency-warning',
  },
  normal: {
    value: 'normal',
    label: 'آمن',
    color: 'emerald',
    badgeClass: 'badge-urgency-normal',
  },
};

export const STATUS_META = {
  active: { label: 'نشط', color: 'emerald' },
  expiring_soon: { label: 'ينتهي قريباً', color: 'amber' },
  expired: { label: 'منتهي الصلاحية', color: 'rose' },
  paused: { label: 'موقوف مؤقتاً', color: 'slate' },
  cancelled: { label: 'ملغي', color: 'zinc' },
};

export function formatRemainingLabel(daysRemaining) {
  const days = Number(daysRemaining ?? 0);
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'منتهي منذ يوم' : `منتهي منذ ${abs} أيام`;
  }
  if (days === 0) return 'ينتهي اليوم!';
  if (days === 1) return 'متبقي يوم واحد';
  if (days === 2) return 'متبقي يومان';
  if (days <= 10) return `متبقي ${days} أيام`;
  return `متبقي ${days} يوماً`;
}

export function formatMoney(amount, currency = 'USD') {
  const num = Number(amount ?? 0);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
  return `${formatted} ${currency}`;
}

/**
 * Preview next expiry date client-side matching backend addMonthsNoOverflow logic.
 */
export function computeNextExpiryPreview(fromDateStr, billingCycle, customDays = null) {
  if (!fromDateStr) return '';
  const parts = String(fromDateStr).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '';

  const [year, month, day] = parts;

  if (billingCycle === 'custom_days') {
    const days = Number(customDays);
    if (!Number.isInteger(days) || days < 1) return '';
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  const monthsMap = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
    biennial: 24,
  };
  const addMonths = monthsMap[billingCycle];
  if (!addMonths) return '';

  const targetMonthIndex = (month - 1) + addMonths;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}
