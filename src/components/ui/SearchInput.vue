<template>
  <div class="oms-search-box">
    <span class="oms-search-icon" aria-hidden="true">🔍</span>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      @keyup.enter="triggerImmediate"
    />
    <button
      v-if="modelValue"
      type="button"
      class="oms-clear-search"
      aria-label="مسح البحث"
      @click="onClear"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
import { useDebounce } from '@/composables/useDebounce';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'ابحث...' },
  delay: { type: Number, default: 320 },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'search', 'clear']);

const { debounced, cancel } = useDebounce((val) => {
  emit('search', String(val || '').trim());
}, props.delay);

function onInput(e) {
  const val = e.target.value;
  emit('update:modelValue', val);
  debounced(val);
}

function triggerImmediate() {
  cancel();
  emit('search', String(props.modelValue || '').trim());
}

function onClear() {
  cancel();
  emit('update:modelValue', '');
  emit('clear');
  emit('search', '');
}
</script>

<style scoped>
.oms-search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 0 12px;
  flex: 1;
  min-width: 220px;
}

.oms-search-icon {
  flex-shrink: 0;
}

.oms-search-box input {
  width: 100%;
  border: none;
  background: transparent;
  color: #f8fafc;
  padding: 10px 8px;
  font-size: 0.9rem;
  outline: none;
}

.oms-clear-search {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.oms-clear-search:hover {
  color: #f8fafc;
}
</style>
