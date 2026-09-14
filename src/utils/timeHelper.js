/**
 * نظام تتبع وقت الاستحقاق الذكي (Smart SLA Tracker)
 *
 * @param {String} createdAt - تاريخ إنشاء المهمة/الخطة
 * @param {String} dueDate - تاريخ الاستحقاق (الديدلاين)
 * @param {String} status - الحالة الحالية للعنصر
 * @returns {Object} - كائن يحتوي على (اللون، النسبة المئوية، الرسالة الذكية)
 */
export const getDeadlineStatus = (createdAt, dueDate, status) => {
  // 1. التعامل مع العناصر المكتملة أولاً
  const completedStatuses = ['completed', 'مكتمل', 'مكتملة', 'تم النشر', 'published']

  if (completedStatuses.includes(status)) {
    return {
      class: 'dl-completed', // تم التسليم
      percentage: 100,
      message: 'تم التسليم بنجاح ✅',
      isOverdue: false,
    }
  }

  // 2. التعامل مع العناصر التي ليس لها موعد محدد
  if (!dueDate) {
    return {
      class: 'dl-no-date',
      percentage: 0,
      message: 'بدون موعد تسليم',
      isOverdue: false,
    }
  }

  // 3. الحسابات الزمنية
  const start = new Date(createdAt).getTime()
  // نجعل الديدلاين ينتهي بنهاية اليوم (الساعة 23:59:59) ليكون الحساب دقيقاً
  const end = new Date(dueDate).setHours(23, 59, 59, 999)
  const now = new Date().getTime()

  // إجمالي الوقت المتاح للمهمة
  const totalDuration = end - start > 0 ? end - start : 1
  // الوقت المنقضي حتى الآن
  const elapsed = now - start

  // حساب النسبة المئوية للوقت المنقضي
  let percentage = (elapsed / totalDuration) * 100
  if (percentage < 0) percentage = 0 // حماية إذا كان تاريخ الإنشاء في المستقبل

  // الفارق الزمني (بالموجب يعني لسه في وقت، بالسالب يعني متأخر)
  const timeDiff = end - now
  const daysDiff = Math.ceil(Math.abs(timeDiff) / (1000 * 60 * 60 * 24))

  let message = ''
  let colorClass = ''
  let isOverdue = false

  // 4. توزيع الألوان والرسائل بناءً على النسبة والوقت
  if (timeDiff < 0) {
    // ---- حالة التأخير (تجاوز 100%) ----
    isOverdue = true
    percentage = 100 // تثبيت الشريط عند 100%

    if (daysDiff <= 2) {
      colorClass = 'dl-late' // تأخير بسيط (أحمر عادي)
      message = `متأخر (منذ ${daysDiff} يوم) ⚠️`
    } else {
      colorClass = 'dl-critical' // تأخير حرج (أحمر داكن / نابض)
      message = `تأخير حرج! (${daysDiff} أيام) 🚨`
    }
  } else {
    // ---- حالة الأمان (لم يتجاوز الوقت) ----
    isOverdue = false

    if (percentage < 50) {
      colorClass = 'dl-safe' // أخضر (في السليم)
      message = `متبقي ${daysDiff} يوم 🟢`
    } else if (percentage < 75) {
      colorClass = 'dl-warning' // أصفر (انتباه)
      message = `متبقي ${daysDiff} يوم 🟡`
    } else if (percentage < 90) {
      colorClass = 'dl-danger' // برتقالي (اقترب جداً)
      message = `اقترب الموعد! متبقي ${daysDiff} يوم 🟠`
    } else {
      colorClass = 'dl-urgent' // أحمر (اللحظات الأخيرة)
      message = `عاجل جداً! يسلم اليوم أو غداً 🔴`
    }
  }

  return {
    class: colorClass,
    percentage: Math.min(percentage, 100), // ضمان ألا تتجاوز النسبة 100 في الـ UI
    message,
    isOverdue,
  }
}
