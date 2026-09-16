/**
 * دالة أساسية للتحقق مما إذا كان المستخدم مديراً
 * المدير يمتلك صلاحيات مطلقة ويتخطى كل القيود
 */
export const isManager = (user) => {
    return user && user.role === 'manager';
};

/**
 * دالة للتحقق من وظيفة معينة
 */
export const isJobTitle = (user, jobTitle) => {
    return user && user.job_title === jobTitle;
};

// ==========================================
// 🛡️ مجموعات الصلاحيات (Permission Groups)
// ==========================================

/**
 * صلاحية تعديل التصميمات والفيديوهات (للمصممين والمونتير والمدير)
 */
export const canEditDesigns = (user) => {
    if (isManager(user)) return true;
    return isJobTitle(user, 'Graphic Designer') || isJobTitle(user, 'Video Editor');
};

/**
 * صلاحية إدارة الحملات الإعلانية وتعديل ميزانية التمويل
 */
export const canManageAds = (user) => {
    if (isManager(user)) return true;
    return isJobTitle(user, 'Media Buyer');
};

/**
 * صلاحية التواصل مع العملاء ومتابعة الحسابات
 */
export const canManageAccounts = (user) => {
    if (isManager(user)) return true;
    return isJobTitle(user, 'Account Manager') || isJobTitle(user, 'Sales');
};

/**
 * صلاحية إدارة وإنشاء خطط المحتوى (للمدير أو Account Manager)
 */
export const canManagePlans = (user) => {
    if (isManager(user)) return true;
    return isJobTitle(user, 'Account Manager');
};

/**
 * صلاحية المطورين (للوصول لبيانات الـ API أو الأكواد لو لزم الأمر)
 */
export const isDeveloper = (user) => {
    if (isManager(user)) return true;
    return isJobTitle(user, 'Developer');
};