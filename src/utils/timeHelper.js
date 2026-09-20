/**
 * دالة مساعدة لتنسيق المدة الزمنية بدقة (أيام، ساعات، دقائق) باللغة العربية
 * @param {Number} diffMs - الفارق الزمني بالميللي ثانية
 * @returns {String} - نص منسق مثل "13 يوم و 4 ساعات و 20 دقيقة"
 */
export const formatDurationArabic = (diffMs) => {
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  if (totalMinutes < 1) {
    return 'أقل من دقيقة';
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];

  if (days > 0) {
    if (days === 1) parts.push('1 يوم');
    else if (days === 2) parts.push('2 يوم');
    else if (days >= 3 && days <= 10) parts.push(`${days} أيام`);
    else parts.push(`${days} يوم`);
  }

  if (hours > 0) {
    if (hours === 1) parts.push('1 ساعة');
    else if (hours === 2) parts.push('2 ساعة');
    else if (hours >= 3 && hours <= 10) parts.push(`${hours} ساعات`);
    else parts.push(`${hours} ساعة`);
  }

  if (minutes > 0) {
    if (minutes === 1) parts.push('1 دقيقة');
    else if (minutes === 2) parts.push('2 دقيقة');
    else if (minutes >= 3 && minutes <= 10) parts.push(`${minutes} دقائق`);
    else parts.push(`${minutes} دقيقة`);
  }

  return parts.join(' و ');
};

/**
 * نظام تتبع وقت الاستحقاق الذكي (Smart SLA Tracker)
 *
 * @param {String} createdAt - تاريخ إنشاء المهمة/الخطة
 * @param {String} dueDate - تاريخ الاستحقاق (الديدلاين)
 * @param {String} status - الحالة الحالية للعنصر
 * @param {Number|Date|Ref} currentTimestamp - وقت اختياري للتحديث التفاعلي الحي
 * @returns {Object} - كائن يحتوي على (اللون، النسبة المئوية، الرسالة الذكية، الفروقات الزمنية)
 */
export const getDeadlineStatus = (createdAt, dueDate, status, currentTimestamp = null) => {
  // 1. التعامل مع العناصر المكتملة أولاً
  const completedStatuses = ['completed', 'مكتمل', 'مكتملة', 'تم النشر', 'published'];

  if (completedStatuses.includes(status)) {
    return {
      class: 'dl-completed', // تم التسليم
      percentage: 100,
      message: 'تم التسليم بنجاح ✅',
      isOverdue: false,
    };
  }

  // 2. التعامل مع العناصر التي ليس لها موعد محدد
  if (!dueDate) {
    return {
      class: 'dl-no-date',
      percentage: 0,
      message: 'بدون موعد تسليم',
      isOverdue: false,
    };
  }

  // 3. الحسابات الزمنية وتجهيز التواريخ
  const cleanCreatedAt = createdAt ? String(createdAt).replace(' ', 'T') : null;
  const cleanDueDate = dueDate ? String(dueDate).replace(' ', 'T') : null;

  const rawStartTime = cleanCreatedAt ? new Date(cleanCreatedAt).getTime() : NaN;
  const hasTime = cleanDueDate && cleanDueDate.includes(':');

  let end;
  if (hasTime) {
    end = new Date(cleanDueDate).getTime();
  } else {
    const d = new Date(cleanDueDate);
    d.setHours(23, 59, 59, 999);
    end = d.getTime();
  }

  // حماية ضد التواريخ غير الصالحة
  if (isNaN(end)) {
    return {
      class: 'dl-no-date',
      percentage: 0,
      message: 'تاريخ غير محدد',
      isOverdue: false,
    };
  }

  let now;
  if (currentTimestamp) {
    if (typeof currentTimestamp === 'object' && 'value' in currentTimestamp) {
      now = Number(currentTimestamp.value);
    } else {
      now = new Date(currentTimestamp).getTime();
    }
  } else {
    now = Date.now();
  }
  if (isNaN(now)) now = Date.now();

  const start = isNaN(rawStartTime) ? end - 24 * 60 * 60 * 1000 : rawStartTime;

  // إجمالي الوقت المتاح للمهمة
  const totalDuration = end - start > 0 ? end - start : 1;
  // الوقت المنقضي حتى الآن
  const elapsed = now - start;

  // حساب النسبة المئوية للوقت المنقضي
  let percentage = (elapsed / totalDuration) * 100;
  if (percentage < 0) percentage = 0; // حماية إذا كان تاريخ الإنشاء في المستقبل

  // الفارق الزمني (بالموجب يعني لسه في وقت، بالسالب يعني متأخر)
  const timeDiff = end - now;
  const isOverdue = timeDiff < 0;
  const absDiff = Math.abs(timeDiff);

  const totalMinutes = Math.floor(absDiff / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const durationText = formatDurationArabic(absDiff);

  let message = '';
  let colorClass = '';

  // 4. توزيع الألوان والرسائل بناءً على النسبة والوقت
  if (isOverdue) {
    // ---- حالة التأخير (تجاوز 100%) ----
    percentage = 100; // تثبيت الشريط عند 100%

    if (days < 2) {
      colorClass = 'dl-late'; // تأخير بسيط (أحمر عادي)
      message = `متأخر (${durationText}) ⚠️`;
    } else {
      colorClass = 'dl-critical'; // تأخير حرج (أحمر داكن / نابض)
      message = `تأخير حرج! (${durationText}) 🚨`;
    }
  } else {
    // ---- حالة الأمان (لم يتجاوز الوقت) ----
    if (percentage < 50) {
      colorClass = 'dl-safe'; // أخضر (في السليم)
      message = `متبقي ${durationText} 🟢`;
    } else if (percentage < 75) {
      colorClass = 'dl-warning'; // أصفر (انتباه)
      message = `متبقي ${durationText} 🟡`;
    } else if (percentage < 90) {
      colorClass = 'dl-danger'; // برتقالي (اقترب جداً)
      message = `اقترب الموعد! متبقي ${durationText} 🟠`;
    } else {
      colorClass = 'dl-urgent'; // أحمر (اللحظات الأخيرة)
      message = `عاجل جداً! متبقي ${durationText} 🔴`;
    }
  }

  return {
    class: colorClass,
    percentage: Math.min(percentage, 100), // ضمان ألا تتجاوز النسبة 100 في الـ UI
    message,
    isOverdue,
    days,
    hours,
    minutes,
    durationText,
  };
};
