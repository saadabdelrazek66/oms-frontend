/**
 * أدوات مساعدة وتجهيز رسائل وإشعارات الواتساب للمهام السريعة مع دعم القوالب الديناميكية
 */
import { useNotificationTemplates } from '../composables/useNotificationTemplates';

/**
 * تحويل رقم الهاتف إلى الصيغة الدولية القياسية بدون أي رموز أو أصفار بادئة
 * @param {string|number} rawPhone 
 * @returns {string}
 */
export const formatWhatsAppPhone = (rawPhone) => {
  if (!rawPhone) return '';
  const { formatPhone } = useNotificationTemplates();
  const formatted = formatPhone(rawPhone);
  if (formatted) return formatted;

  let cleaned = String(rawPhone).replace(/\D/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
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
};

/**
 * تنسيق الديدلاين باللغة العربية لعرضه بشكل لطيف داخل رسالة الواتساب
 * @param {string|Date} val 
 * @returns {string}
 */
export const formatDeadlineForMessage = (val) => {
  if (!val) return 'غير محدد';
  try {
    const str = String(val).trim();
    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/);
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    if (match) {
      const y = match[1];
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      const h24 = parseInt(match[4], 10);
      const min = match[5];
      const ampm = h24 >= 12 ? 'م' : 'ص';
      const h12 = h24 % 12 || 12;
      return `${d} ${months[m]} ${y} الساعة ${String(h12).padStart(2, '0')}:${min} ${ampm}`;
    }

    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {}
  
  return String(val);
};

/**
 * توليد تفاصيل ورسالة الواتساب ديناميكياً من قوالب النظام بناءً على نوع الحدث
 * @param {'created'|'submitted'|'approved'|'rejected'} event 
 * @param {Object} task 
 * @returns {Object} { event, disabled, phone, recipientName, recipientRole, message, title }
 */
export const getWhatsAppPayload = (event, task = {}) => {
  const { renderTemplate, renderTitle, getTemplate } = useNotificationTemplates();

  const taskTitle = task.title || 'توجيه سريع';
  const deadlineStr = formatDeadlineForMessage(task.deadline);
  const assigneeName = task.assignee_name || task.assignee?.name || 'الموظف';
  const creatorName = task.creator_name || task.creator?.name || 'المدير';
  const reviewerName = task.reviewer_name || task.feedbackLogs?.[0]?.reviewer?.name || creatorName;
  const rejectionNotes = task.rejection_notes || task.feedback_text || task.feedbackLogs?.[0]?.feedback_text || '';

  const templateData = {
    // الوسوم الأساسية
    task_title: taskTitle,
    deadline: deadlineStr,
    assignee_name: assigneeName,
    creator_name: creatorName,
    reviewer_name: reviewerName,
    rejection_notes: rejectionNotes,
    rejection_reason: rejectionNotes,
    feedback_text: rejectionNotes,
    // أسماء بديلة شائعة لتوافق كامل
    employee_name: assigneeName,
    user_name: assigneeName,
    manager_name: creatorName,
  };

  const eventMap = {
    created: {
      key: 'quick_task_created',
      role: 'الموظف المُكلَّف',
      recipientName: assigneeName,
      phone: task.assignee_phone || task.assignee?.phone || '',
      defaultTitle: 'مهمة سريعة جديدة ⚡',
      fallback: `مرحباً ${assigneeName} 👋،\nتم إسناد مهمة سريعة جديدة لك بعنوان: *${taskTitle}*.\n⏰ *الديدلاين:* ${deadlineStr}\nيرجى الدخول للنظام لمراجعتها.`
    },
    submitted: {
      key: 'quick_task_submitted',
      role: 'المدير / المشرف',
      recipientName: creatorName,
      phone: task.creator_phone || task.creator?.phone || '',
      defaultTitle: 'تسليم مهمة سريعة للمراجعة 🚀',
      fallback: `مرحباً ${creatorName} 👋،\nقام ${assigneeName} للتو بتسليم المهمة السريعة: *${taskTitle}* للمراجعة.\nيرجى الدخول للنظام لاعتمادها.`
    },
    approved: {
      key: 'quick_task_approved',
      role: 'الموظف المنفذ',
      recipientName: assigneeName,
      phone: task.assignee_phone || task.assignee?.phone || '',
      defaultTitle: 'اعتماد مهمة سريعة ✅',
      fallback: `عاش يا ${assigneeName} 👏،\nتم اعتماد وتسلم المهمة السريعة: *${taskTitle}* بنجاح.\nشكراً لمجهودك!`
    },
    rejected: {
      key: 'quick_task_rejected',
      role: 'الموظف المنفذ',
      recipientName: assigneeName,
      phone: task.assignee_phone || task.assignee?.phone || '',
      defaultTitle: 'ملاحظات على المهمة السريعة ⚠️',
      fallback: `مرحباً ${assigneeName} ⚠️،\nتم ترك ملاحظات ورفض المهمة السريعة: *${taskTitle}*.\nيرجى الدخول للنظام والاستماع للملاحظات للتعديل.`
    }
  };

  const cfg = eventMap[event];
  if (!cfg) {
    return {
      event,
      disabled: false,
      title: 'تنبيه عبر واتساب',
      recipientRole: 'المستلم',
      recipientName: assigneeName,
      phone: task.assignee_phone || '',
      message: `مرحباً بك، لديك تحديث جديد بخصوص المهمة السريعة: ${taskTitle}.`
    };
  }

  // فحص ما إذا كان القالب معطلاً من إعدادات الإدارة
  const tpl = getTemplate(cfg.key);
  if (tpl && tpl.is_enabled === false) {
    return {
      event,
      disabled: true,
      title: '',
      recipientRole: cfg.role,
      recipientName: cfg.recipientName,
      phone: cfg.phone,
      message: ''
    };
  }

  const title = renderTitle(cfg.key, templateData, cfg.defaultTitle);
  const message = renderTemplate(cfg.key, templateData, cfg.fallback, true);

  return {
    event,
    disabled: false,
    title,
    recipientRole: cfg.role,
    recipientName: cfg.recipientName,
    phone: cfg.phone,
    message
  };
};
