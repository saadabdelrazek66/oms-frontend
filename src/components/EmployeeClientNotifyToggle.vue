<template>
  <div 
    class="notify-toggle-wrapper"
    :class="{ 'compact-mode': compact, 'is-active': modelValue, 'is-loading': loading }"
    dir="rtl"
    :title="modelValue ? 'الزر متاح حالياً للموظف المسئول' : 'الزر مخفي عن الموظف ومتاح للمدير فقط'"
  >
    <div class="toggle-content">
      <div class="toggle-label-group">
        <span class="notify-icon" aria-hidden="true">📲</span>
        <span class="toggle-label">إتاحة زر إخطار العميل للموظف</span>
      </div>

      <div class="toggle-action-row">
        <!-- Status indicator badge -->
        <span 
          class="notify-status-pill"
          :class="modelValue ? 'active' : 'inactive'"
        >
          <span class="status-dot"></span>
          {{ modelValue ? 'مُتاح للموظف' : 'للمدير فقط' }}
        </span>

        <!-- Headless/Tailwind-style Toggle Switch -->
        <button
          type="button"
          class="switch-btn"
          role="switch"
          :aria-checked="modelValue"
          aria-label="إتاحة زر إخطار العميل للموظف المسئول"
          :disabled="loading"
          @click.stop="togglePermission"
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

const togglePermission = async () => {
  if (loading.value) return;

  loading.value = true;
  try {
    const response = await api.patch(`/content-plans/${props.planId}/toggle-client-notify-permission`);
    
    const newState = response.data?.data?.allow_client_notify_by_employee !== undefined 
      ? Boolean(response.data.data.allow_client_notify_by_employee) 
      : !props.modelValue;

    emit('update:modelValue', newState);
    emit('change', newState);

    const message = response.data?.message || (newState ? 'تم إتاحة زر إخطار العميل للموظف المسئول 🟢' : 'تم قصر الزر على المدير فقط 🔒');
    alertService.toast(message, 'success');
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'تعذر تغيير الصلاحية، يرجى المحاولة لاحقاً.';
    alertService.toast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.notify-toggle-wrapper {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
  user-select: none;
}

.notify-toggle-wrapper:hover {
  border-color: rgba(96, 165, 250, 0.4);
  background: rgba(15, 23, 42, 0.8);
}

.notify-toggle-wrapper.is-active {
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.75));
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
}

.toggle-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.toggle-label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notify-icon {
  font-size: 13px;
  line-height: 1;
}

.toggle-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
}

.toggle-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Status Pill */
.notify-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.notify-status-pill.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.notify-status-pill.inactive {
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

.notify-status-pill.active .status-dot {
  box-shadow: 0 0 6px #3b82f6;
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35);
}

/* Switch Track */
.switch-track {
  width: 40px;
  height: 22px;
  background-color: #334155;
  border-radius: 9999px;
  position: relative;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.switch-track.track-checked {
  background-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

/* Switch Thumb (RTL aware) */
.switch-thumb {
  width: 16px;
  height: 16px;
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
  transform: translateX(-18px);
}

/* Thumb Spinner */
.thumb-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Compact Mode */
.notify-toggle-wrapper.compact-mode {
  padding: 3px 8px;
  border-radius: 6px;
}

.notify-toggle-wrapper.compact-mode .toggle-label {
  font-size: 10px;
}

.notify-toggle-wrapper.compact-mode .notify-icon {
  font-size: 11px;
}

.notify-toggle-wrapper.compact-mode .toggle-action-row {
  gap: 6px;
}

.notify-toggle-wrapper.compact-mode .notify-status-pill {
  padding: 1px 5px;
  font-size: 9px;
  border-radius: 4px;
}

.notify-toggle-wrapper.compact-mode .status-dot {
  width: 5px;
  height: 5px;
}

.notify-toggle-wrapper.compact-mode .switch-track {
  width: 28px;
  height: 15px;
}

.notify-toggle-wrapper.compact-mode .switch-thumb {
  width: 11px;
  height: 11px;
  right: 2px;
}

.notify-toggle-wrapper.compact-mode .switch-thumb.thumb-checked {
  transform: translateX(-13px);
}
</style>
