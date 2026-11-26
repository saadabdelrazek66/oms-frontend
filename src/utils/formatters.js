/**
 * أدوات التنسيق المشتركة عبر كامل واجهات النظام (Dates, Hours, Currency, Sizes, Initials)
 */

export function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback;
  const str = String(value).replace('T', ' ');
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    return str.slice(0, 16);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export function formatDateArabic(value, fallback = '—', withTime = false) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  const opts = withTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return new Intl.DateTimeFormat('ar-EG', opts).format(d);
}

export function formatHours(hours) {
  const num = Number(hours);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(2)));
}

export function formatCurrency(amount, currency = 'EGP', locale = 'ar-EG') {
  const num = Number(amount || 0);
  if (!Number.isFinite(num)) return `0 ${currency}`;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function formatBytes(bytes) {
  const num = Number(bytes || 0);
  if (!num) return '';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export function getInitials(name, fallback = '؟') {
  if (!name || !String(name).trim()) return fallback;
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}
