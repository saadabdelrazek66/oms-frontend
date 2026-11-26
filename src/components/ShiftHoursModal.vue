<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content shift-modal" dir="rtl">
          <button class="modal-close" type="button" @click="emit('close')">&times;</button>

          <div class="shift-modal-header">
            <span class="shift-icon-box">⏱️</span>
            <div>
              <h3>ترحيل ساعات العمل</h3>
            </div>
          </div>

          <div v-if="item" class="task-summary-box">
            <span class="type-badge">{{ item.type_label }}</span>
            <strong class="target-title">{{ item.title }}</strong>
            <div class="target-hours-info">
              <span>ساعات اليوم: <strong>{{ item.allocated_hours_today }} س</strong></span>
              <span>إجمالي الساعات: <strong>{{ item.total_estimated_hours }} س</strong></span>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="shift-form">
            <div class="form-group">
              <label>عدد الساعات المراد ترحيلها: <span class="hours-val">{{ form.hours }} ساعة</span></label>
              <div class="hours-stepper-wrap">
                <button
                  type="button"
                  class="stepper-btn"
                  @click="decrementHours"
                  :disabled="form.hours <= 0.5"
                >-</button>
                <input
                  type="number"
                  v-model.number="form.hours"
                  step="0.5"
                  min="0.5"
                  :max="item?.allocated_hours_today || 8"
                  class="stepper-val-input"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  @click="incrementHours"
                  :disabled="form.hours >= (item?.allocated_hours_today || 8)"
                >+</button>
              </div>
              <div class="quick-hours-presets">
                <button
                  type="button"
                  class="preset-btn"
                  @click="form.hours = 0.5"
                  :disabled="(item?.allocated_hours_today || 0) < 0.5"
                >نصف ساعة</button>
                <button
                  type="button"
                  class="preset-btn"
                  @click="form.hours = 1.0"
                  :disabled="(item?.allocated_hours_today || 0) < 1.0"
                >ساعة واحدة</button>
                <button
                  type="button"
                  class="preset-btn"
                  @click="form.hours = 2.0"
                  :disabled="(item?.allocated_hours_today || 0) < 2.0"
                >ساعتان</button>
                <button
                  type="button"
                  class="preset-btn"
                  @click="form.hours = (item?.allocated_hours_today || 1.0)"
                >كامل ساعات اليوم</button>
              </div>
            </div>

            <div class="form-group">
              <label>التاريخ المراد الترحيل إليه:</label>
              <input type="date" v-model="form.to_date" required class="date-input" />
            </div>

            <div class="form-group">
              <label>سبب الترحيل (اختياري):</label>
              <input
                type="text"
                v-model="form.reason"
                placeholder="مثال: ضغط عمل، أولوية لمهمة طارئة..."
                class="text-input"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="emit('close')">إلغاء</button>
              <button type="submit" class="submit-btn" :disabled="submitting">
                {{ submitting ? 'جارٍ الترحيل...' : 'تأكيد ترحيل الساعات ⏱️' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, default: null },
  defaultToDate: { type: String, default: '' },
  submitting: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'submit']);

const form = ref({
  hours: 1.0,
  to_date: '',
  reason: '',
});

watch(
  () => [props.visible, props.item, props.defaultToDate],
  ([isOpen]) => {
    if (isOpen && props.item) {
      form.value = {
        hours: Math.min(1.0, props.item.allocated_hours_today || 1.0),
        to_date: props.defaultToDate || '',
        reason: '',
      };
    }
  },
  { immediate: true }
);

const incrementHours = () => {
  const max = props.item?.allocated_hours_today || 8;
  if (form.value.hours + 0.5 <= max) {
    form.value.hours = Math.round((form.value.hours + 0.5) * 10) / 10;
  }
};

const decrementHours = () => {
  if (form.value.hours - 0.5 >= 0.5) {
    form.value.hours = Math.round((form.value.hours - 0.5) * 10) / 10;
  }
};

const handleSubmit = () => {
  emit('submit', {
    hours: Number(form.value.hours),
    to_date: form.value.to_date,
    reason: form.value.reason,
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(4, 7, 27, 0.85);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal-content.shift-modal {
  width: 100%;
  max-width: 480px;
  background: linear-gradient(145deg, #161e56, #0c133a);
  border: 1px solid rgba(146, 160, 233, 0.24);
  border-radius: 24px;
  padding: 26px 28px;
  color: #eef0ff;
  font-family: 'Cairo', sans-serif;
  position: relative;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.65);
}

.modal-close {
  position: absolute;
  top: 16px;
  left: 20px;
  background: transparent;
  border: none;
  color: #8c9ac9;
  font-size: 26px;
  cursor: pointer;
}

.shift-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.shift-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.2), rgba(99, 102, 241, 0.2));
  display: grid;
  place-items: center;
  font-size: 22px;
  border: 1px solid rgba(125, 232, 220, 0.35);
}

.shift-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.task-summary-box {
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 18px;
}

.task-summary-box .type-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.task-summary-box .target-title {
  display: block;
  font-size: 13px;
  color: #ffffff;
  margin-bottom: 6px;
}

.target-hours-info {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #8da0d2;
}

.target-hours-info strong {
  color: #7de8dc;
}

.shift-form .form-group {
  margin-bottom: 16px;
}

.shift-form label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #c5d2ff;
  margin-bottom: 8px;
}

.shift-form .hours-val {
  color: #7de8dc;
}

.hours-stepper-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  margin-bottom: 8px;
}

.stepper-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(125, 232, 220, 0.15);
  border: 1px solid rgba(125, 232, 220, 0.35);
  color: #7de8dc;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-val-input {
  flex: 1;
  height: 40px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  outline: none;
}

.quick-hours-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #a7b6ff;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
}

.preset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shift-form .date-input,
.shift-form .text-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #8da0d2;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #fff;
  border-radius: 12px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .modal-content.shift-modal {
    padding: 20px 18px;
    border-radius: 18px;
  }
  .target-hours-info {
    flex-wrap: wrap;
    gap: 8px;
  }
  .modal-actions {
    flex-direction: column-reverse;
  }
  .cancel-btn,
  .submit-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
