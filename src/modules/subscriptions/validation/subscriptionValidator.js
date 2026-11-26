import { SUPPORTED_CURRENCIES } from '../constants/subscriptionOptions.js';

export const VALIDATION_LIMITS = {
  maxAmount: 99999999.99,
  maxReminderOffsets: 12,
  maxReminderDaysBefore: 365,
  maxExternalEmails: 20,
  maxCustomCycleDays: 3650,
  maxGracePeriodDays: 90,
  maxNotesLength: 2000,
};

export function isValidDateYmd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return false;
  }
  const [y, m, d] = value.trim().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > 191) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;

  const domain = normalized.split('@')[1] || '';
  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

export function isValidHttpUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function isValidDomainName(value) {
  if (typeof value !== 'string') return false;
  const clean = value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(clean);
}

export function getCycleMaxReminderDays(billingCycle, customCycleDays = null) {
  switch (billingCycle) {
    case 'monthly':
      return 31;
    case 'quarterly':
      return 92;
    case 'semi_annual':
      return 184;
    case 'annual':
      return 366;
    case 'biennial':
      return 731;
    case 'custom_days': {
      const parsed = Number(customCycleDays);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
    default:
      return null;
  }
}

export function validateSingleEmailAddition(rawEmail, currentEmails = []) {
  const normalized = String(rawEmail || '').trim().toLowerCase();
  if (!normalized) {
    return { valid: false, message: 'يرجى كتابة البريد الإلكتروني أولاً.' };
  }
  if (!isValidEmail(normalized)) {
    return { valid: false, message: `صيغة البريد الإلكتروني (${normalized}) غير صحيحة.` };
  }
  if (currentEmails.length >= VALIDATION_LIMITS.maxExternalEmails) {
    return { valid: false, message: `الحد الأقصى للإيميلات الإضافية هو ${VALIDATION_LIMITS.maxExternalEmails}.` };
  }
  if (currentEmails.some((e) => String(e).trim().toLowerCase() === normalized)) {
    return { valid: false, message: `البريد الإلكتروني (${normalized}) مضاف مسبقاً.` };
  }
  return { valid: true, value: normalized, message: '' };
}

export function validateSingleReminderOffsetAddition(
  rawOffset,
  currentOffsets = [],
  billingCycle = null,
  customCycleDays = null
) {
  const str = String(rawOffset ?? '').trim();
  if (str === '' || !/^\d+$/.test(str)) {
    return { valid: false, message: 'يجب إدخال عدد أيام صحيح غير سالب.' };
  }
  const days = Number(str);
  if (days < 0 || days > VALIDATION_LIMITS.maxReminderDaysBefore) {
    return { valid: false, message: `عدد الأيام يجب أن يكون بين 0 و ${VALIDATION_LIMITS.maxReminderDaysBefore}.` };
  }
  if (currentOffsets.length >= VALIDATION_LIMITS.maxReminderOffsets) {
    return { valid: false, message: `الحد الأقصى للتنبيهات المجدولة هو ${VALIDATION_LIMITS.maxReminderOffsets}.` };
  }
  if (currentOffsets.map(Number).includes(days)) {
    return { valid: false, message: `يوم التذكير (${days}) مضاف مسبقاً.` };
  }
  const cycleMax = getCycleMaxReminderDays(billingCycle, customCycleDays);
  if (cycleMax !== null && days > cycleMax) {
    return {
      valid: false,
      message: `يوم التذكير (${days}) يتجاوز مدة دورة الفوترة المحددة (${cycleMax} يوماً).`,
    };
  }
  return { valid: true, value: days, message: '' };
}

export function validateSubscriptionField(field, form = {}) {
  switch (field) {
    case 'name': {
      const val = String(form.name ?? '').trim();
      if (!val) return 'اسم الاشتراك مطلوب.';
      if (val.length < 2) return 'اسم الاشتراك يجب ألا يقل عن حرفين.';
      if (val.length > 191) return 'اسم الاشتراك يجب ألا يتجاوز 191 حرفاً.';
      return '';
    }

    case 'category':
      return form.category ? '' : 'تصنيف الاشتراك مطلوب.';

    case 'provider_name': {
      const val = String(form.provider_name ?? '').trim();
      if (!val) return 'اسم المزود أو الشركة مطلوب.';
      if (val.length < 2) return 'اسم المزود يجب ألا يقل عن حرفين.';
      if (val.length > 191) return 'اسم المزود يجب ألا يتجاوز 191 حرفاً.';
      return '';
    }

    case 'domain_or_identifier': {
      const val = String(form.domain_or_identifier ?? '').trim();
      if (!val) return '';
      if (val.length > 191) return 'النطاق أو المعرف يجب ألا يتجاوز 191 حرفاً.';
      if (form.category === 'domain' && !isValidDomainName(val)) {
        return 'صيغة النطاق (Domain) غير صحيحة، مثال: example.com';
      }
      return '';
    }

    case 'management_url': {
      const val = String(form.management_url ?? '').trim();
      if (!val) return '';
      if (val.length > 500) return 'الرابط طويل جداً (الحد الأقصى 500 حرف).';
      if (!isValidHttpUrl(val)) return 'رابط لوحة التحكم يجب أن يبدأ بـ http:// أو https://.';
      return '';
    }

    case 'account_email': {
      const val = String(form.account_email ?? '').trim();
      if (!val) return '';
      if (!isValidEmail(val)) return 'صيغة بريد الحساب لدى المزود غير صحيحة.';
      return '';
    }

    case 'amount': {
      const raw = String(form.amount ?? '').trim();
      if (!raw) return 'قيمة الاشتراك مطلوبة.';
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        return 'قيمة الاشتراك يجب أن تكون رقماً صالحاً بحد أقصى خانتين عشريتين.';
      }
      const num = Number(raw);
      if (!Number.isFinite(num) || num <= 0) return 'قيمة الاشتراك يجب أن تكون أكبر من صفر.';
      if (num > VALIDATION_LIMITS.maxAmount) return 'قيمة الاشتراك تتجاوز الحد الأقصى المسموح.';
      return '';
    }

    case 'currency': {
      const cur = String(form.currency ?? '').trim().toUpperCase();
      if (!cur) return 'العملة مطلوبة.';
      if (!SUPPORTED_CURRENCIES.includes(cur)) return 'العملة المختارة غير مدعومة.';
      return '';
    }

    case 'billing_cycle':
      return form.billing_cycle ? '' : 'دورة الفوترة مطلوبة.';

    case 'custom_cycle_days': {
      if (form.billing_cycle !== 'custom_days') return '';
      const raw = String(form.custom_cycle_days ?? '').trim();
      if (!raw || !/^\d+$/.test(raw)) return 'عدد أيام الدورة المخصصة مطلوب ويجب أن يكون رقماً صحيحاً.';
      const num = Number(raw);
      if (num < 1 || num > VALIDATION_LIMITS.maxCustomCycleDays) {
        return `عدد أيام الدورة المخصصة يجب أن يكون بين 1 و ${VALIDATION_LIMITS.maxCustomCycleDays} يوماً.`;
      }
      return '';
    }

    case 'grace_period_days': {
      if (form.grace_period_days === null || form.grace_period_days === undefined || form.grace_period_days === '') {
        return '';
      }
      const raw = String(form.grace_period_days).trim();
      if (!/^\d+$/.test(raw)) return 'فترة السماح يجب أن تكون عدداً صحيحاً غير سالب.';
      const num = Number(raw);
      if (num < 0 || num > VALIDATION_LIMITS.maxGracePeriodDays) {
        return `فترة السماح يجب أن تكون بين 0 و ${VALIDATION_LIMITS.maxGracePeriodDays} يوماً.`;
      }
      return '';
    }

    case 'start_date': {
      if (!form.start_date) return 'تاريخ بداية الاشتراك مطلوب.';
      if (!isValidDateYmd(form.start_date)) return 'صيغة تاريخ البداية يجب أن تكون YYYY-MM-DD.';
      return '';
    }

    case 'next_expiry_date': {
      if (!form.next_expiry_date) return 'تاريخ الانتهاء القادم مطلوب.';
      if (!isValidDateYmd(form.next_expiry_date)) return 'صيغة تاريخ الانتهاء يجب أن تكون YYYY-MM-DD.';
      if (isValidDateYmd(form.start_date) && form.next_expiry_date <= form.start_date) {
        return 'تاريخ الانتهاء القادم يجب أن يكون بعد تاريخ بداية الاشتراك.';
      }
      return '';
    }

    case 'channels': {
      const channels = Array.isArray(form.channels) ? form.channels : [];
      if (channels.length === 0) return 'يجب اختيار قناة تنبيه واحدة على الأقل.';
      return '';
    }

    case 'reminder_days_before': {
      const offsets = Array.isArray(form.reminder_days_before) ? form.reminder_days_before : [];
      if (offsets.length === 0) return 'يجب تحديد يوم تذكير واحد على الأقل قبل موعد الانتهاء.';
      if (offsets.length > VALIDATION_LIMITS.maxReminderOffsets) {
        return `الحد الأقصى لعدد تنبيهات التذكير هو ${VALIDATION_LIMITS.maxReminderOffsets}.`;
      }
      const cycleMax = getCycleMaxReminderDays(form.billing_cycle, form.custom_cycle_days);
      const seen = new Set();
      for (const item of offsets) {
        const num = Number(item);
        if (!Number.isInteger(num) || num < 0 || num > VALIDATION_LIMITS.maxReminderDaysBefore) {
          return `جميع أيام التذكير يجب أن تكون أعداداً صحيحة بين 0 و ${VALIDATION_LIMITS.maxReminderDaysBefore}.`;
        }
        if (cycleMax !== null && num > cycleMax) {
          return `يوم التذكير (${num}) لا يمكن أن يتجاوز مدة دورة الفوترة (${cycleMax} يوماً).`;
        }
        if (seen.has(num)) {
          return `يوجد تكرار في يوم التذكير (${num}).`;
        }
        seen.add(num);
      }
      return '';
    }

    case 'notify_emails': {
      const emails = Array.isArray(form.notify_emails) ? form.notify_emails : [];
      if (emails.length > VALIDATION_LIMITS.maxExternalEmails) {
        return `الحد الأقصى للإيميلات الإضافية هو ${VALIDATION_LIMITS.maxExternalEmails}.`;
      }
      const seen = new Set();
      for (const email of emails) {
        const clean = String(email ?? '').trim().toLowerCase();
        if (!isValidEmail(clean)) return `صيغة البريد الإلكتروني (${email}) غير صحيحة.`;
        if (seen.has(clean)) return `البريد الإلكتروني (${clean}) مكرر.`;
        seen.add(clean);
      }
      return '';
    }

    case 'notify_user_ids': {
      const status = String(form.status || 'active');
      if (status === 'paused' || status === 'cancelled') return '';
      const channels = Array.isArray(form.channels) ? form.channels : [];
      if (channels.length === 0) return '';

      const userIds = Array.isArray(form.notify_user_ids) ? form.notify_user_ids.filter(Boolean) : [];
      const emails = Array.isArray(form.notify_emails)
        ? form.notify_emails.filter((e) => String(e ?? '').trim() !== '')
        : [];

      if (userIds.length === 0 && emails.length === 0) {
        return 'يجب تحديد مستلم واحد على الأقل (مستخدم بالنظام أو بريد إلكتروني إضافي) لتلقي التنبيهات.';
      }
      return '';
    }

    case 'notes': {
      const val = String(form.notes ?? '');
      if (val.length > VALIDATION_LIMITS.maxNotesLength) {
        return `الملاحظات يجب ألا تتجاوز ${VALIDATION_LIMITS.maxNotesLength} حرفاً.`;
      }
      return '';
    }

    default:
      return '';
  }
}

export const SUBSCRIPTION_FORM_FIELDS = [
  'name',
  'category',
  'provider_name',
  'domain_or_identifier',
  'management_url',
  'account_email',
  'amount',
  'currency',
  'billing_cycle',
  'custom_cycle_days',
  'grace_period_days',
  'start_date',
  'next_expiry_date',
  'channels',
  'reminder_days_before',
  'notify_emails',
  'notify_user_ids',
  'notes',
];

export function validateSubscriptionForm(form = {}) {
  const errors = {};
  for (const field of SUBSCRIPTION_FORM_FIELDS) {
    const msg = validateSubscriptionField(field, form);
    if (msg) {
      errors[field] = msg;
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRenewField(field, form = {}, currentExpiryDate = null) {
  switch (field) {
    case 'new_expiry_date': {
      if (!form.new_expiry_date) return '';
      if (!isValidDateYmd(form.new_expiry_date)) {
        return 'صيغة تاريخ الانتهاء الجديد يجب أن تكون YYYY-MM-DD.';
      }
      if (currentExpiryDate && isValidDateYmd(currentExpiryDate) && form.new_expiry_date <= currentExpiryDate) {
        return `تاريخ الانتهاء الجديد يجب أن يكون بعد تاريخ الانتهاء الحالي (${currentExpiryDate}).`;
      }
      return '';
    }

    case 'amount_paid': {
      if (form.amount_paid === null || form.amount_paid === undefined || form.amount_paid === '') {
        return '';
      }
      const raw = String(form.amount_paid).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        return 'المبلغ المدفوع يجب أن يكون رقماً غير سالب بحد أقصى خانتين عشريتين.';
      }
      const num = Number(raw);
      if (num < 0 || num > VALIDATION_LIMITS.maxAmount) {
        return 'المبلغ المدفوع خارج النطاق المسموح.';
      }
      return '';
    }

    case 'custom_cycle_days': {
      if (form.billing_cycle !== 'custom_days') return '';
      const raw = String(form.custom_cycle_days ?? '').trim();
      if (!raw || !/^\d+$/.test(raw)) return 'يرجى تحديد عدد أيام الدورة المخصصة.';
      const num = Number(raw);
      if (num < 1 || num > VALIDATION_LIMITS.maxCustomCycleDays) {
        return `عدد الأيام يجب أن يكون بين 1 و ${VALIDATION_LIMITS.maxCustomCycleDays}.`;
      }
      return '';
    }

    case 'invoice_reference': {
      const val = String(form.invoice_reference ?? '');
      if (val.length > 191) return 'رقم الفاتورة يجب ألا يتجاوز 191 حرفاً.';
      return '';
    }

    case 'notes': {
      const val = String(form.notes ?? '');
      if (val.length > VALIDATION_LIMITS.maxNotesLength) {
        return `الملاحظات يجب ألا تتجاوز ${VALIDATION_LIMITS.maxNotesLength} حرفاً.`;
      }
      return '';
    }

    default:
      return '';
  }
}

export function validateRenewForm(form = {}, currentExpiryDate = null) {
  const fields = ['new_expiry_date', 'amount_paid', 'custom_cycle_days', 'invoice_reference', 'notes'];
  const errors = {};
  for (const f of fields) {
    const msg = validateRenewField(f, form, currentExpiryDate);
    if (msg) errors[f] = msg;
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalize Laravel 422 validation errors (including array dot keys like notify_emails.0).
 */
export function normalizeServerErrors(serverErrors = {}) {
  const mapped = {};
  if (!serverErrors || typeof serverErrors !== 'object') return mapped;

  for (const [rawKey, messages] of Object.entries(serverErrors)) {
    const baseKey = rawKey.split('.')[0];
    const firstMsg = Array.isArray(messages) ? messages[0] : String(messages || '');
    if (firstMsg && !mapped[baseKey]) {
      mapped[baseKey] = firstMsg;
    }
  }
  return mapped;
}
