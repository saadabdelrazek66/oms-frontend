/**
 * دوال التحقق من صحة روابط جوجل درايف ومستندات جوجل للخطط والبوستات
 * متطابقة تماماً مع متطلبات الـ Backend لضمان عدم إدخال روابط مجلدات أو روابط عشوائية
 */

/**
 * التحقق من صحة رابط تسليم الخطة (للمراجعة أو التسليم النهائي)
 * @param {string} url 
 * @returns {{ valid: boolean, message: string }}
 */
export const validateDriveLink = (url) => {
  if (!url || !String(url).trim()) {
    return { valid: false, message: 'هذا الحقل مطلوب لإتمام التسليم.' };
  }
  
  const lowerUrl = String(url).trim().toLowerCase();
  
  // 1. التأكد من أن الرابط ليس مجلد
  if (lowerUrl.includes('/folders/')) {
    return { valid: false, message: 'لا يمكن إرفاق رابط "مجلد". يجب إدخال رابط "الملف" مباشرة.' };
  }

  // 2. التأكد من أنه رابط ملف درايف أو دوكس صالح
  const validPaths = [
    'drive.google.com/file/d/',
    'drive.google.com/open?id=',
    'docs.google.com/document/d/',
    'docs.google.com/spreadsheets/d/',
    'docs.google.com/presentation/d/'
  ];
  
  const isValidFile = validPaths.some(path => lowerUrl.includes(path));
  
  if (!isValidFile) {
    return { valid: false, message: 'يجب أن يكون الرابط لملف صحيح على Google Drive أو Docs/Sheets.' };
  }

  return { valid: true, message: '' };
};

/**
 * التحقق من صحة رابط تسليم البوست في الـ Spreadsheet (سواء في الخلية أو المودال)
 * @param {string} url 
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePostDriveLink = (url) => {
  if (!url || !String(url).trim()) {
    return { valid: false, message: 'رابط البوست مطلوب.' };
  }
  
  const lowerUrl = String(url).trim().toLowerCase();
  
  // منع روابط المجلدات
  if (lowerUrl.includes('/folders/')) {
    return { valid: false, message: 'يجب إدخال رابط "ملف" البوست وليس رابط المجلد.' };
  }

  // السماح فقط بروابط ملفات درايف أو مستندات جوجل
  const validPaths = [
    'drive.google.com/file/d/',
    'drive.google.com/open?id=',
    'docs.google.com/document/d/',
    'docs.google.com/spreadsheets/d/',
    'docs.google.com/presentation/d/'
  ];
  
  const isValidFile = validPaths.some(path => lowerUrl.includes(path));
  
  if (!isValidFile) {
    return { valid: false, message: 'يجب أن يكون الرابط لملف صحيح على Google Drive/Docs.' };
  }

  return { valid: true, message: '' };
};
