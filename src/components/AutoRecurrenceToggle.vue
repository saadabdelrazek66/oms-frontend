<template>
  <div 
    class="recurrence-toggle-wrapper"
    :class="{ 'compact-mode': compact, 'is-active': modelValue, 'is-loading': loading }"
    dir="rtl"
  >
    <div class="toggle-content">
      <div class="toggle-label-group">
        <span class="recurrence-icon" aria-hidden="true">🔁</span>
        <span class="toggle-label">تفعيل التكرار التلقائي للشهر القادم</span>
      </div>

      <div class="toggle-action-row">
        <!-- Status indicator badge -->
        <span 
          class="recurrence-status-pill"
          :class="modelValue ? 'active' : 'inactive'"
        >
          <span class="status-dot"></span>
          {{ modelValue ? 'مُفعل' : 'مُتوقف' }}
        </span>

        <!-- Headless/Tailwind-style Toggle Switch -->
        <button
          type="button"
          class="switch-btn"
          role="switch"
          :aria-checked="modelValue"
          aria-label="تفعيل التكرار التلقائي للشهر القادم"
          :disabled="loading"
          @click="toggleRecurrence"
        >
          <span class="switch-track" :class="{ 'track-checked': modelValue }">
            <span class="switch-thumb" :class="{ 'thumb-checked': modelValue }">
              <span v-if="loading" class="thumb-spinner" aria-hidden="true"></span>
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../axios';
import alertService from '../services/alertService';

const props = defineProps({
  planId: {
    type: [Number, String],
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const loading = ref(false);

const toggleRecurrence = async () => {
  if (loading.value) return;

  loading.value = true;
  try {
    const response = await api.patch(`/content-plans/${props.planId}/toggle-recurrence`);
    
    // استخراج القيمة الجديدة من رد السيرفر response.data.data.is_recurring
    const newState = response.data?.data?.is_recurring !== undefined 
      ? Boolean(response.data.data.is_recurring) 
      : !props.modelValue;

    emit('update:modelValue', newState);
    emit('change', newState);

    // عرض رسالة النجاح في إشعار Toast
    const message = response.data?.message || (newState ? 'تم تفعيل التكرار التلقائي للشهر القادم 🟢' : 'تم إيقاف التكرار التلقائي 🔴');
    alertService.toast(message, 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'تعذر تغيير حالة التكرار التلقائي، يرجى المحاولة لاحقاً.';
    alertService.toast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.recurrence-toggle-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(14, 21, 62, 0.55);
  border: 1px solid rgba(137, 153, 226, 0.18);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
  user-select: none;
}

.recurrence-toggle-wrapper:hover {
  border-color: rgba(125, 232, 220, 0.35);
  background: rgba(14, 21, 62, 0.75);
}

.recurrence-toggle-wrapper.is-active {
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(14, 21, 62, 0.7));
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
}

.toggle-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
}

.toggle-label-group {
  display: flex;
  align-items: center;
  gap: 7px;
}

.recurrence-icon {
  font-size: 14px;
  line-height: 1;
}

.toggle-label {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  white-space: nowrap;
}

.toggle-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Status Pill */
.recurrence-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.recurrence-status-pill.active {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.recurrence-status-pill.inactive {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.recurrence-status-pill.active .status-dot {
  box-shadow: 0 0 6px #10b981;
}

/* Switch Button */
.switch-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  outline: none;
}

.switch-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.switch-btn:focus-visible .switch-track {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35);
}

/* Switch Track */
.switch-track {
  width: 44px;
  height: 24px;
  background-color: #334155;
  border-radius: 9999px;
  position: relative;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.switch-track.track-checked {
  background-color: #10b981;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

/* Switch Thumb (RTL aware: starts on right, moves to left) */
.switch-thumb {
  width: 18px;
  height: 18px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  right: 3px;
  display: grid;
  place-items: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

.switch-thumb.thumb-checked {
  transform: translateX(-20px);
}

/* Thumb Spinner */
.thumb-spinner {
  width: 11px;
  height: 11px;
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Compact Mode */
.recurrence-toggle-wrapper.compact-mode {
  padding: 5px 10px;
  border-radius: 8px;
}

.recurrence-toggle-wrapper.compact-mode .toggle-label {
  font-size: 11px;
}

.recurrence-toggle-wrapper.compact-mode .switch-track {
  width: 38px;
  height: 20px;
}

.recurrence-toggle-wrapper.compact-mode .switch-thumb {
  width: 15px;
  height: 15px;
  right: 2.5px;
}

.recurrence-toggle-wrapper.compact-mode .switch-thumb.thumb-checked {
  transform: translateX(-18px);
}
</style>
