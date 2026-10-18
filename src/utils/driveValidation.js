/**
 * دوال التحقق من صحة روابط جوجل درايف ومستندات جوجل للخطط والبوستات
 * متطابقة تماماً مع متطلبات الـ Backend لضمان عدم إدخال روابط مجلدات أو روابط عشوائية
 */

import { useSystemSettings } from '../composables/useSystemSettings';

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

  // فحص ما إذا كان الفحص الصارم لروابط درايف معطلاً في الإعدادات
  try {
    const { strictDriveValidation } = useSystemSettings();
    if (strictDriveValidation && !strictDriveValidation.value) {
      if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
        return { valid: true, message: '' };
      }
      return { valid: false, message: 'يرجى إدخال رابط URL صحيح.' };
    }
  } catch (e) {}
  
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
 * التحقق مما إذا كان نوع المنشور يسمح بروابط المجلدات (كاروسيل أو صور متعددة)
 * @param {string|object} postTypeOrPost
 * @returns {boolean}
 */
export const isFolderAllowedForPostType = (postTypeOrPost) => {
  if (!postTypeOrPost) return false;

  let type = postTypeOrPost;
  if (typeof postTypeOrPost === 'object') {
    type = postTypeOrPost.post_type || postTypeOrPost.type || '';
  }

  if (!type || typeof type !== 'string') return false;

  const normalized = type.trim().toLowerCase();

  return (
    normalized.includes('carousel') ||
    normalized.includes('كاروسيل') ||
    normalized.includes('multi-image') ||
    normalized.includes('multi image') ||
    normalized.includes('multi_image') ||
    normalized.includes('multiimage') ||
    normalized.includes('صور متعددة') ||
    normalized.includes('صور متعدده') ||
    normalized.includes('متعدد الصور') ||
    normalized.includes('متعددة الصور') ||
    normalized.includes('بوست متعدد') ||
    normalized.includes('منشور متعدد') ||
    normalized.includes('متعدد') ||
    normalized.includes('multi') ||
    normalized.includes('ألبوم') ||
    normalized.includes('البوم') ||
    normalized.includes('album') ||
    normalized.includes('سلايد') ||
    normalized.includes('slide')
  );
};

/**
 * التحقق من صحة رابط تسليم البوست في الـ Spreadsheet (سواء في الخلية أو المودال)
 * إذا كان نوع المنشور كاروسيل أو multi-image يُسمح بوضع رابط مجلد درايف أو ملف
 * وفي باقي الحالات يُسمح فقط بروابط الملفات
 * @param {string} url 
 * @param {string|object} postTypeOrPost 
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePostDriveLink = (url, postTypeOrPost = '') => {
  if (!url || !String(url).trim()) {
    return { valid: false, message: 'رابط البوست مطلوب.' };
  }
  
  const lowerUrl = String(url).trim().toLowerCase();

  // فحص ما إذا كان الفحص الصارم لروابط درايف معطلاً في الإعدادات
  try {
    const { strictDriveValidation } = useSystemSettings();
    if (strictDriveValidation && !strictDriveValidation.value) {
      if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
        return { valid: true, message: '' };
      }
      return { valid: false, message: 'يرجى إدخال رابط URL صحيح.' };
    }
  } catch (e) {}

  const folderAllowed = isFolderAllowedForPostType(postTypeOrPost);

  // مسارات ملفات درايف أو مستندات جوجل الصالحة
  const validFilePaths = [
    'drive.google.com/file/d/',
    'drive.google.com/open?id=',
    'docs.google.com/document/d/',
    'docs.google.com/spreadsheets/d/',
    'docs.google.com/presentation/d/'
  ];
  
  const isValidFile = validFilePaths.some(path => lowerUrl.includes(path));

  // التحقق من صحة رابط مجلد جوجل درايف
  const isDriveFolder = (lowerUrl.includes('drive.google.com') && lowerUrl.includes('/folders/'))
                     || (lowerUrl.includes('drive.google.com/open?id=') && !lowerUrl.includes('/file/d/'));

  // إذا كان نوع المنشور كاروسيل أو صور متعددة: يُسمح برابط مجلد أو ملف
  if (folderAllowed) {
    if (!isValidFile && !isDriveFolder) {
      return { valid: false, message: 'يجب أن يكون الرابط لملف أو مجلد صحيح على Google Drive / Docs.' };
    }
    return { valid: true, message: '' };
  }

  // في باقي الحالات: منع روابط المجلدات ويجب أن يكون ملف عادي فقط
  if (lowerUrl.includes('/folders/')) {
    return { valid: false, message: 'يجب إدخال رابط "ملف" البوست وليس رابط المجلد (روابط المجلدات مسموحة فقط لمنشورات الكاروسيل والصور المتعددة).' };
  }

  if (!isValidFile) {
    return { valid: false, message: 'يجب أن يكون الرابط لملف صحيح على Google Drive/Docs.' };
  }

  return { valid: true, message: '' };
};

/**
 * التحقق من صحة رابط مجلد الأرشفة والتسليم النهائي للبوست (يجب أن يكون رابط مجلد على جوجل درايف)
 * @param {string} url 
 * @returns {{ valid: boolean, message: string }}
 */
export const validateDriveFolderLink = (url) => {
  if (!url || !String(url).trim()) {
    return { valid: false, message: 'رابط مجلد الأرشفة مطلوب.' };
  }
  
  const lowerUrl = String(url).trim().toLowerCase();
  
  // يجب أن يكون رابط مجلد على جوجل درايف
  const isDriveFolder = (lowerUrl.includes('drive.google.com') && lowerUrl.includes('/folders/'))
                     || (lowerUrl.includes('drive.google.com/open?id=') && !lowerUrl.includes('/file/d/'));
  
  if (!isDriveFolder) {
    return { valid: false, message: 'يجب أن يكون الرابط عبارة عن رابط "مجلد" (Folder) صحيح على Google Drive لأرشفة المنشور.' };
  }
  
  return { valid: true, message: '' };
};
