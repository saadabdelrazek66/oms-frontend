import { reactive } from 'vue';

// حالة نافذة التأكيد
const confirmState = reactive({
  isOpen: false,
  title: '',
  message: '',
  type: 'danger', // 'danger' | 'warning' | 'info' | 'success'
  confirmText: 'تأكيد',
  cancelText: 'إلغاء',
  isDestructive: false,
  resolve: null
});

// حالة نافذة التنبيه العام
const alertState = reactive({
  isOpen: false,
  title: '',
  message: '',
  type: 'info', // 'info' | 'success' | 'warning' | 'error'
  okText: 'حسناً',
  resolve: null
});

// قائمة الإشعارات السريعة العائمة
const toasts = reactive([]);

let toastCounter = 0;

/**
 * فتح نافذة تأكيد تفاعلية فاخرة
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
export const confirm = (options = {}) => {
  return new Promise((resolve) => {
    confirmState.title = options.title || 'تأكيد الإجراء';
    confirmState.message = options.message || 'هل أنت متأكد من الاستمرار في هذه العملية؟';
    confirmState.type = options.type || (options.isDestructive ? 'danger' : 'warning');
    confirmState.confirmText = options.confirmText || (confirmState.type === 'danger' ? 'نعم، احذف' : 'تأكيد');
    confirmState.cancelText = options.cancelText || 'إلغاء';
    confirmState.isDestructive = options.isDestructive ?? (confirmState.type === 'danger');
    confirmState.resolve = resolve;
    confirmState.isOpen = true;
  });
};

/**
 * إغلاق نافذة التأكيد مع إرجاع النتيجة
 * @param {boolean} result
 */
export const resolveConfirm = (result) => {
  if (confirmState.resolve) {
    confirmState.resolve(result);
  }
  confirmState.isOpen = false;
  confirmState.resolve = null;
};

/**
 * فتح نافذة تنبيه بديلة لـ window.alert
 * @param {Object} options
 * @returns {Promise<void>}
 */
export const alert = (options = {}) => {
  return new Promise((resolve) => {
    if (typeof options === 'string') {
      options = { message: options };
    }
    const msg = options.message || '';
    let autoType = 'info';
    let autoTitle = 'تنبيه';

    if (msg.includes('خطأ') || msg.includes('فشل') || msg.includes('تعذر') || msg.includes('غير صالح') || msg.includes('غير مسموح') || msg.includes('غير مصرح')) {
      autoType = 'error';
      autoTitle = 'تنبيه خطأ';
    } else if (msg.includes('نجاح') || msg.includes('تم ') || msg.includes('بنجاح')) {
      autoType = 'success';
      autoTitle = 'عملية ناجحة';
    } else if (msg.includes('تحذير') || msg.includes('لا يمكن') || msg.includes('يرجى') || msg.includes('تأكد')) {
      autoType = 'warning';
      autoTitle = 'تنبيه هام';
    }

    alertState.title = options.title || autoTitle;
    alertState.message = msg;
    alertState.type = options.type || autoType;
    alertState.okText = options.okText || 'حسناً، فهمت';
    alertState.resolve = resolve;
    alertState.isOpen = true;
  });
};

/**
 * إغلاق نافذة التنبيه
 */
export const resolveAlert = () => {
  if (alertState.resolve) {
    alertState.resolve();
  }
  alertState.isOpen = false;
  alertState.resolve = null;
};

/**
 * إضافة إشعار عائم (Toast)
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} duration
 */
export const toast = (message, type = 'info', duration = 3500) => {
  if (!message) return;

  let msg = message;
  let toastType = type;
  let toastDuration = duration;

  // دعم التمرير ككائن { message, type, duration } أو كسلسلة نصية
  if (typeof message === 'object' && message !== null) {
    msg = message.message || message.text || message.msg || '';
    toastType = message.type || type || 'info';
    toastDuration = message.duration || duration || 3500;
  }

  if (!msg) return;

  const id = ++toastCounter;
  
  // تحويل الأنماط الشائعة
  let mappedType = toastType;
  if (toastType === 'danger') mappedType = 'error';

  const toastItem = reactive({
    id,
    message: msg,
    type: mappedType,
    duration: toastDuration,
    remaining: toastDuration,
    timer: null,
    isPaused: false
  });

  const startTimer = () => {
    const interval = 50;
    toastItem.timer = setInterval(() => {
      if (!toastItem.isPaused) {
        toastItem.remaining -= interval;
        if (toastItem.remaining <= 0) {
          dismissToast(id);
        }
      }
    }, interval);
  };

  startTimer();
  toasts.push(toastItem);

  // حد أقصى 5 إشعارات في وقت واحد لتجنب تكدس الشاشة
  if (toasts.length > 5) {
    dismissToast(toasts[0].id);
  }

  return id;
};

export const dismissToast = (id) => {
  const index = toasts.findIndex((t) => t.id === id);
  if (index !== -1) {
    if (toasts[index].timer) clearInterval(toasts[index].timer);
    toasts.splice(index, 1);
  }
};

export const pauseToast = (id) => {
  const item = toasts.find((t) => t.id === id);
  if (item) item.isPaused = true;
};

export const resumeToast = (id) => {
  const item = toasts.find((t) => t.id === id);
  if (item) item.isPaused = false;
};

// دوال سريعة للإشعارات
export const success = (message, duration = 3500) => toast(message, 'success', duration);
export const error = (message, duration = 4500) => toast(message, 'error', duration);
export const warning = (message, duration = 4000) => toast(message, 'warning', duration);
export const info = (message, duration = 3500) => toast(message, 'info', duration);

/**
 * إشعار ذكي يكتشف النوع تلقائياً من نص الرسالة إن لم يُحدد نوع صريح
 */
export const smartToast = (message, explicitType = null, duration = 3500) => {
  if (!message) return;
  if (explicitType && explicitType !== 'info') {
    return toast(message, explicitType, duration);
  }
  const msg = typeof message === 'string' ? message : String(message?.message || '');
  if (/خطأ|تعذر|فشل|عذراً|غير مصرح|لا تملك|لا تمتلك|رفض/.test(msg)) {
    return error(message, duration);
  }
  if (/تنبيه|الحد الأقصى|⚠️|تحذير/.test(msg)) {
    return warning(message, duration);
  }
  if (/تم|نجاح|بنجاح|✅|🚀/.test(msg)) {
    return success(message, duration);
  }
  return toast(message, explicitType || 'info', duration);
};

// تصدير الحالة الموحدة
export const alertStateStore = {
  confirmState,
  alertState,
  toasts
};

const alertService = {
  confirm,
  alert,
  toast,
  smartToast,
  success,
  error,
  warning,
  info,
  dismissToast,
  pauseToast,
  resumeToast,
  resolveConfirm,
  resolveAlert,
  state: alertStateStore
};

export default alertService;
