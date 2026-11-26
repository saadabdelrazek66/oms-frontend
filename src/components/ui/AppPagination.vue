<template>
  <div v-if="shouldShow" class="app-pagination" dir="rtl">
    <button
      type="button"
      class="app-page-btn"
      :disabled="disabled || currentPage <= 1"
      aria-label="الصفحة السابقة"
      @click="$emit('change', currentPage - 1)"
    >
      <span>→</span>
      <span>السابق</span>
    </button>

    <div class="app-page-info">
      <span>صفحة</span>
      <strong>{{ currentPage }}</strong>
      <span>من</span>
      <strong>{{ lastPage }}</strong>
      <span v-if="total > 0" class="app-page-total">({{ total }} {{ itemLabel }})</span>
    </div>

    <button
      type="button"
      class="app-page-btn"
      :disabled="disabled || currentPage >= lastPage"
      aria-label="الصفحة التالية"
      @click="$emit('change', currentPage + 1)"
    >
      <span>التالي</span>
      <span>←</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, required: true },
  lastPage: { type: Number, required: true },
  total: { type: Number, default: 0 },
  itemLabel: { type: String, default: 'عنصر' },
  disabled: { type: Boolean, default: false },
  hideSinglePage: { type: Boolean, default: true },
});

defineEmits(['change']);

const shouldShow = computed(() => {
  if (!props.hideSinglePage) return true;
  return props.lastPage > 1;
});
</script>

<style scoped>
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  flex-wrap: wrap;
}

.app-page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.72);
  color: #e2e8f0;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.app-page-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.45);
}

.app-page-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.app-page-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: #94a3b8;
}

.app-page-info strong {
  color: #f8fafc;
}

.app-page-total {
  color: #7dd3fc;
  margin-right: 4px;
}
</style>
