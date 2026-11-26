import { ref, computed } from 'vue';

/**
 * Composable موحد لإدارة التصفح (Laravel Paginator Compatibility)
 */
export function usePagination(initialPerPage = 15) {
  const currentPage = ref(1);
  const lastPage = ref(1);
  const total = ref(0);
  const perPage = ref(initialPerPage);

  const hasPrev = computed(() => currentPage.value > 1);
  const hasNext = computed(() => currentPage.value < lastPage.value);

  function setFromLaravel(paginator) {
    if (!paginator || typeof paginator !== 'object') return;
    const meta = paginator.meta || paginator;
    currentPage.value = Number(meta.current_page || 1);
    lastPage.value = Math.max(1, Number(meta.last_page || 1));
    total.value = Number(meta.total || 0);
    if (meta.per_page) {
      perPage.value = Number(meta.per_page);
    }
  }

  function goToPage(page, onChange) {
    const target = Math.min(Math.max(1, Number(page) || 1), lastPage.value);
    if (target === currentPage.value) return;
    currentPage.value = target;
    if (typeof onChange === 'function') {
      onChange(target);
    }
  }

  function prevPage(onChange) {
    if (hasPrev.value) {
      goToPage(currentPage.value - 1, onChange);
    }
  }

  function nextPage(onChange) {
    if (hasNext.value) {
      goToPage(currentPage.value + 1, onChange);
    }
  }

  function resetPage() {
    currentPage.value = 1;
  }

  return {
    currentPage,
    lastPage,
    total,
    perPage,
    hasPrev,
    hasNext,
    setFromLaravel,
    goToPage,
    prevPage,
    nextPage,
    resetPage,
  };
}

export default usePagination;
