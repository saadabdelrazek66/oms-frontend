import { ref, computed } from 'vue';
import api from '../axios';
import { useSystemSettings } from './useSystemSettings';
import { formatWhatsAppPhone, buildWhatsAppUrl } from '@/utils/whatsapp';

const CACHE_KEY = 'oms_notification_templates_cache';

const loadCachedTemplates = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
};

// حالة موحدة مشتركة عبر كامل واجهات النظام مع دعم التخزين المؤقت المحلي
const templatesMap = ref(loadCachedTemplates());
const isTemplatesLoaded = ref(Object.keys(templatesMap.value).length > 0);
const isLoadingTemplates = ref(false);

export function useNotificationTemplates() {
  const { settings } = useSystemSettings();

  /**
   * جلب خريطة القوالب النشطة من السيرفر وتخزينها محلياً
   */
  const fetchTemplates = async (force = false) => {
    if (isLoadingTemplates.value) return;

    isLoadingTemplates.value = true;
    try {
      const res = await api.get('/notification-templates/active');
      if (res.data && res.data.templates) {
        templatesMap.value = res.data.templates;
        isTemplatesLoaded.value = true;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.data.templates));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not load active notification templates:', e);
    } finally {
      isLoadingTemplates.value = false;
    }
  };

  /**
   * استرجاع قالب محدد
   */
  const getTemplate = (key) => {
    return templatesMap.value[key] || null;
  };

  /**
   * تحديث قالب محدد في الحالة المشتركة فورياً
   */
  const setTemplate = (key, templateData) => {
    if (!key || !templateData) return;
    templatesMap.value = {
      ...templatesMap.value,
      [key]: {
        ...(templatesMap.value[key] || {}),
        ...templateData,
      },
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(templatesMap.value));
    } catch (e) {}
  };

  /**
   * معالجة نص القالب واستبدال المتغيرات محلياً وفورياً
   * @param {string} key مفتاح القالب
   * @param {Object} data مصفوفة المتغيرات
   * @param {string|Function} fallback بديل في حال عدم توفر القالب
   * @param {boolean} withFooter إضافة تذييل الواتساب
   */
  const renderTemplate = (key, data = {}, fallback = '', withFooter = true) => {
    const tpl = templatesMap.value[key];

    // إذا لم يتوفر القالب بعد، يتم استخدام النص البديل
    if (!tpl) {
      return typeof fallback === 'function' ? fallback(data) : fallback;
    }

    // إذا كان القالب معطلاً من الإدارة
    if (tpl.is_enabled === false) {
      return '';
    }

    const rawBody = tpl.effective_body || tpl.template_body || tpl.default_body || '';
    if (!rawBody) {
      return typeof fallback === 'function' ? fallback(data) : fallback;
    }

    // استبدال المتغيرات {placeholder_key}
    let rendered = rawBody.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, pKey) => {
      return data[pKey] !== undefined && data[pKey] !== null ? String(data[pKey]) : '';
    });

    // إضافة تذييل الواتساب الموحد إذا تم طلبه وكان مفعل في إعدادات النظام
    if (withFooter) {
      const footerEnabled = settings.value?.whatsapp_custom_footer_enabled;
      const footerText = settings.value?.whatsapp_custom_footer;
      if (footerEnabled && footerText && footerText.trim()) {
        rendered = rendered.trim() + '\n\n' + footerText.trim();
      }
    }

    return rendered.trim();
  };

  /**
   * معالجة عنوان القالب
   */
  const renderTitle = (key, data = {}, fallbackTitle = '') => {
    const tpl = templatesMap.value[key];
    if (!tpl || !tpl.is_enabled) {
      return fallbackTitle;
    }

    const rawTitle = tpl.effective_title || tpl.title_template || tpl.default_title;
    if (!rawTitle) return fallbackTitle;

    return rawTitle.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, pKey) => {
      return data[pKey] !== undefined && data[pKey] !== null ? String(data[pKey]) : '';
    }).trim();
  };

  /**
   * طلب المعالجة المباشرة من السيرفر (للرسائل المعقدة)
   */
  const renderServer = async (key, data = {}, withFooter = true) => {
    try {
      const res = await api.post('/notification-templates/render', {
        key,
        data,
        with_footer: withFooter,
      });
      return res.data?.rendered || '';
    } catch (e) {
      console.error(`Failed to render template [${key}] on server:`, e);
      return renderTemplate(key, data, '', withFooter);
    }
  };

  const formatPhone = formatWhatsAppPhone;

  const getWhatsAppLink = (phone, message = '') => buildWhatsAppUrl(phone, message);

  return {
    templatesMap,
    isTemplatesLoaded,
    fetchTemplates,
    getTemplate,
    setTemplate,
    renderTemplate,
    renderTitle,
    renderServer,
    formatPhone,
    getWhatsAppLink,
  };
}
