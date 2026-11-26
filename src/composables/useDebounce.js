import { onBeforeUnmount } from 'vue';

/**
 * Composable لتأخير تنفيذ الدوال (Search / Filters) مع تنظيف المؤقت تلقائياً عند الخروج من الصفحة
 */
export function useDebounce(fn, delay = 320) {
  let timer = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const debounced = (...args) => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  onBeforeUnmount(cancel);

  return {
    debounced,
    cancel,
  };
}

export default useDebounce;
