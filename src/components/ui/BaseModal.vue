<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="oms-modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="onBackdropClick"
    >
      <div class="oms-modal-card base-modal-panel" :style="{ maxWidth }">
        <div v-if="!hideHeader" class="base-modal-head">
          <div class="base-modal-titles">
            <h3 v-if="title">{{ title }}</h3>
            <p v-if="subtitle" class="base-modal-sub">{{ subtitle }}</p>
            <slot name="header-extra" />
          </div>
          <button
            v-if="showClose"
            type="button"
            class="base-modal-close"
            aria-label="إغلاق"
            @click="close"
          >
            ✕
          </button>
        </div>

        <div class="base-modal-body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="base-modal-foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  maxWidth: { type: String, default: '520px' },
  closeOnBackdrop: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const onBackdropClick = () => {
  if (props.closeOnBackdrop) close();
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      document.body.classList.add('modal-is-open');
    } else {
      document.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('modal-is-open');
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.classList.remove('modal-is-open');
});
</script>

<style scoped>
.base-modal-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.base-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.base-modal-titles h3 {
  margin: 0;
  font-size: 1.04rem;
  font-weight: 700;
  color: #f8fafc;
}

.base-modal-sub {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #94a3b8;
}

.base-modal-close {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.base-modal-close:hover {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.base-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
</style>
