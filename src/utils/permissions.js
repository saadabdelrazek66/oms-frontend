/**
 * نظام الصلاحيات المتقدم (RBAC Permission Engine)
 */

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const isObjectRole = (role) => typeof role === 'object' && role !== null && 'value' in role;

/**
 * فحص ما إذا كان المستخدم مديراً
 */
export const isManager = (user = null) => {
  const u = user || getCurrentUser();
  if (!u) return false;
  const role = isObjectRole(u.role) ? u.role.value : u.role;
  return role === 'manager';
};

/**
 * فحص ما إذا كان المستخدم يملك صلاحية معينة
 * @param {string} permissionCode كود الصلاحية مثل 'clients.delete'
 * @param {object|null} user كائن المستخدم (اختياري)
 * @returns {boolean}
 */
export const can = (permissionCode, user = null) => {
  const u = user || getCurrentUser();
  if (!u) return false;

  // المدير يمتلك كل الصلاحيات دائماً
  if (isManager(u)) return true;

  const permissions = Array.isArray(u.permission_codes) ? u.permission_codes : [];
  return permissions.includes(permissionCode);
};

/**
 * فحص ما إذا كان المستخدم يملك أي صلاحية من قائمة
 * @param {string[]} permissionCodes مصفوفة أكواد الصلاحيات
 * @param {object|null} user 
 * @returns {boolean}
 */
export const canAny = (permissionCodes = [], user = null) => {
  const u = user || getCurrentUser();
  if (!u) return false;
  if (isManager(u)) return true;

  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) return true;
  const permissions = Array.isArray(u.permission_codes) ? u.permission_codes : [];
  return permissionCodes.some((code) => permissions.includes(code));
};

/**
 * فحص ما إذا كان المستخدم يملك جميع الصلاحيات في القائمة
 * @param {string[]} permissionCodes مصفوفة أكواد الصلاحيات
 * @param {object|null} user 
 * @returns {boolean}
 */
export const canAll = (permissionCodes = [], user = null) => {
  const u = user || getCurrentUser();
  if (!u) return false;
  if (isManager(u)) return true;

  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) return true;
  const permissions = Array.isArray(u.permission_codes) ? u.permission_codes : [];
  return permissionCodes.every((code) => permissions.includes(code));
};

// ==========================================
// 🛡️ دوال التوافق للخلف (Backward Compatibility)
// ==========================================

export const isJobTitle = (user, jobTitle) => {
  return user && user.job_title === jobTitle;
};

export const canEditDesigns = (user) => {
  return can('posts.edit_media', user);
};

export const canManageAds = (user) => {
  return can('posts.edit_ads', user);
};

export const canManageAccounts = (user) => {
  return can('clients.view', user) || can('plans.view', user);
};

export const canManagePlans = (user) => {
  return can('plans.view', user);
};

export const isDeveloper = (user) => {
  if (isManager(user)) return true;
  return isJobTitle(user, 'Developer');
};