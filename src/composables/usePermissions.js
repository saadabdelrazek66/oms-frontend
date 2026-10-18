import { ref, computed } from 'vue';
import { can, canAny, canAll, isManager, getCurrentUser } from '../utils/permissions';

export function usePermissions() {
  const user = ref(getCurrentUser());

  const refreshUser = () => {
    user.value = getCurrentUser();
  };

  const hasPermission = (code) => can(code, user.value);
  const hasAnyPermission = (codes) => canAny(codes, user.value);
  const hasAllPermissions = (codes) => canAll(codes, user.value);
  const isUserManager = computed(() => isManager(user.value));

  return {
    user,
    refreshUser,
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    isManager: isUserManager,
  };
}
