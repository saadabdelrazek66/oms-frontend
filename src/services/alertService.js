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
    alertState.title = options.title || 'تنبيه';
    alertState.message = options.message || '';
    alertState.type = options.type || 'info';
    alertState.okText = options.okText || 'حسناً';
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
  const id = ++toastCounter;
  
  // تحويل الأنماط الشائعة
  let mappedType = type;
  if (type === 'danger') mappedType = 'error';

  const toastItem = reactive({
    id,
    message,
    type: mappedType,
    duration,
    remaining: duration,
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
