import { ref } from 'vue';
import { useAlert } from './useAlert';

/**
 * Composable للنسخ الآمن إلى الحافظة مع إشعار فوري موحد
 */
export function useClipboard() {
  const { success, error } = useAlert();
  const copied = ref(false);

  async function copy(text, successMessage = 'تم النسخ إلى الحافظة', errorMessage = 'تعذر النسخ إلى الحافظة') {
    if (text === null || text === undefined || text === '') return false;
    const value = String(text);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      copied.value = true;
      if (successMessage) success(successMessage);
      setTimeout(() => {
        copied.value = false;
      }, 1500);
      return true;
    } catch {
      if (errorMessage) error(errorMessage);
      return false;
    }
  }

  return {
    copied,
    copy,
  };
}

export default useClipboard;
