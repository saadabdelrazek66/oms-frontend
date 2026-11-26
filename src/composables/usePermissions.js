import { computed } from 'vue';
import { can, canAny, canAll } from '../utils/permissions';
import { useAuthStore } from '../stores/authStore';

export function usePermissions() {
  const authStore = useAuthStore();
  const user = computed(() => authStore.user);

  const refreshUser = () => {
    authStore.syncFromStorage();
  };

  const hasPermission = (code) => can(code, user.value);
  const hasAnyPermission = (codes) => canAny(codes, user.value);
  const hasAllPermissions = (codes) => canAll(codes, user.value);
  const isUserManager = computed(() => authStore.isManager);

  return {
    user,
    refreshUser,
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    isManager: isUserManager,
  };
}
