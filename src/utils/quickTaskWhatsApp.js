/**
 * أدوات مساعدة وتجهيز رسائل وإشعارات الواتساب للمهام السريعة
 */

/**
 * تحويل رقم الهاتف إلى الصيغة الدولية القياسية بدون أي رموز أو أصفار بادئة
 * @param {string|number} rawPhone 
 * @returns {string}
 */
export const formatWhatsAppPhone = (rawPhone) => {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/\D/g, ''); // الاحتفاظ بالأرقام فقط
  if (!cleaned) return '';

  // إزالة الأصفار الدولية 00 في البداية
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // معالجة الأرقام المصرية الشائعة:
  // إذا كان يبدأ بـ 01 وطوله 11 رقم -> نحذف الصفر ونضيف كود مصر 20 (أي 201...)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned;
  }
  // إذا كان يبدأ بـ 1 وطوله 10 أرقام (بدون الصفر) -> نضيف 20
  else if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }
  // معالجة الأرقام السعودية:
  else if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  }
  // إزالة أي أصفار بادئة أخرى لضمان الصيغة الدولية
  else if (cleaned.startsWith('0')) {
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
 * توليد تفاصيل ورسالة الواتساب بناءً على نوع الحدث
 * @param {'created'|'submitted'|'approved'|'rejected'} event 
 * @param {Object} task 
 * @returns {Object} { phone, recipientName, recipientRole, message, title }
 */
export const getWhatsAppPayload = (event, task = {}) => {
  const taskTitle = task.title || 'توجيه سريع';
  const deadlineStr = formatDeadlineForMessage(task.deadline);
  const assigneeName = task.assignee_name || task.assignee?.name || 'الموظف';
  const creatorName = task.creator_name || task.creator?.name || 'المدير';

  switch (event) {
    case 'created':
      return {
        event: 'created',
        title: 'تنبيه عبر واتساب',
        recipientRole: 'الموظف المُكلَّف',
        recipientName: assigneeName,
        phone: task.assignee_phone || task.assignee?.phone || '',
        message: `مرحباً ${assigneeName} 👋، تم إسناد مهمة سريعة جديدة لك بعنوان: ${taskTitle}.\nالديدلاين: ${deadlineStr}.\nيرجى الدخول للنظام لمراجعتها.`
      };

    case 'submitted':
      return {
        event: 'submitted',
        title: 'تنبيه عبر واتساب',
        recipientRole: 'المدير / المشرف',
        recipientName: creatorName,
        phone: task.creator_phone || task.creator?.phone || '',
        message: `مرحباً ${creatorName} 👋، قام ${assigneeName} للتو بتسليم المهمة السريعة: ${taskTitle} للمراجعة.\nيرجى الدخول للنظام لاعتمادها.`
      };

    case 'approved':
      return {
        event: 'approved',
        title: 'تنبيه عبر واتساب',
        recipientRole: 'الموظف المنفذ',
        recipientName: assigneeName,
        phone: task.assignee_phone || task.assignee?.phone || '',
        message: `عاش يا ${assigneeName} 👏، تم اعتماد وتسلم المهمة السريعة: ${taskTitle} بنجاح. شكراً لمجهودك!`
      };

    case 'rejected':
      return {
        event: 'rejected',
        title: 'تنبيه عبر واتساب',
        recipientRole: 'الموظف المنفذ',
        recipientName: assigneeName,
        phone: task.assignee_phone || task.assignee?.phone || '',
        message: `مرحباً ${assigneeName} ⚠️، تم ترك ملاحظات ورفض المهمة السريعة: ${taskTitle}.\nيرجى الدخول للنظام والاستماع للملاحظات للتعديل.`
      };

    default:
      return {
        event,
        title: 'تنبيه عبر واتساب',
        recipientRole: 'المستلم',
        recipientName: assigneeName,
        phone: task.assignee_phone || '',
        message: `مرحباً بك، لديك تحديث جديد بخصوص المهمة السريعة: ${taskTitle}.`
      };
  }
};
