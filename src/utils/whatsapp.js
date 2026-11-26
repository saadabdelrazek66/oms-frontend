/**
 * أدوات تنسيق أرقام وروابط واتساب الموحدة عبر المنظومة
 */

export function formatWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/\D/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // الأرقام المصرية (01x) -> (201x)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  } else if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  return cleaned;
}

export function buildWhatsAppUrl(phone, message = '') {
  const formatted = formatWhatsAppPhone(phone);
  if (!formatted) return null;
  if (!message) return `https://wa.me/${formatted}`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppChat(phone, message = '') {
  const url = buildWhatsAppUrl(phone, message);
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
