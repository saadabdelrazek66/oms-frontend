import { ref, computed } from 'vue';

const permissionState = ref(
  typeof window !== 'undefined' && 'Notification' in window
    ? window.Notification.permission
    : 'unsupported'
);

/**
 * Reusable Browser Web Notifications composable.
 * Handles capability detection, permission prompts, and interactive desktop notifications.
 */
export function useBrowserNotifications() {
  const isSupported = computed(() => typeof window !== 'undefined' && 'Notification' in window);

  const isGranted = computed(() => isSupported.value && permissionState.value === 'granted');
  const isDenied = computed(() => isSupported.value && permissionState.value === 'denied');
  const needsPrompt = computed(() => isSupported.value && permissionState.value === 'default');

  const syncPermission = () => {
    if (!isSupported.value) {
      permissionState.value = 'unsupported';
      return 'unsupported';
    }
    permissionState.value = window.Notification.permission;
    return permissionState.value;
  };

  const requestPermission = async () => {
    if (!isSupported.value) {
      permissionState.value = 'unsupported';
      return 'unsupported';
    }

    try {
      const result = await window.Notification.requestPermission();
      permissionState.value = result;

      if (result === 'granted') {
        showBrowserNotification({
          title: 'تم تفعيل إشعارات المتصفح بنجاح 🔔',
          body: 'ستصلك تنبيهات تجديد الاشتراكات والتنبيهات العاجلة مباشرة على سطح المكتب.',
          tag: 'subscriptions-permission-granted',
        });
      }

      return result;
    } catch (err) {
      console.warn('[BrowserNotifications] Failed requesting permission:', err);
      return syncPermission();
    }
  };

  /**
   * Show a native browser desktop notification when permission is granted.
   */
  const showBrowserNotification = ({
    title,
    body = '',
    icon = '/logo.png',
    tag = undefined,
    url = null,
    requireInteraction = false,
    onNavigate = null,
  }) => {
    if (!isSupported.value) return null;
    syncPermission();

    if (permissionState.value !== 'granted') {
      return null;
    }

    try {
      const notif = new window.Notification(title, {
        body,
        icon,
        tag,
        dir: 'rtl',
        lang: 'ar',
        requireInteraction: Boolean(requireInteraction),
      });

      notif.onclick = (event) => {
        event.preventDefault();
        try {
          window.focus();
        } catch (e) {}

        if (typeof onNavigate === 'function' && url) {
          onNavigate(url);
        } else if (url) {
          window.location.href = url;
        }

        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('[BrowserNotifications] Could not display notification:', err);
      return null;
    }
  };

  return {
    isSupported,
    permission: permissionState,
    isGranted,
    isDenied,
    needsPrompt,
    syncPermission,
    requestPermission,
    showBrowserNotification,
  };
}
