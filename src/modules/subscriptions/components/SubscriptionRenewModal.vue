<template>
  <Teleport to="body">
    <div v-if="show && subscription" class="sub-modal-overlay" dir="rtl" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="renew-modal-card">
        <header class="modal-header">
          <div class="header-title">
            <span class="header-icon">🔄</span>
            <div>
              <h3>تجديد اشتراك: {{ subscription.name }}</h3>
              <p>{{ subscription.provider_name }} • تاريخ الانتهاء الحالي: {{ subscription.next_expiry_date }}</p>
            </div>
          </div>
          <button type="button" class="close-btn" aria-label="إغلاق" @click="$emit('close')">✕</button>
        </header>

        <form @submit.prevent="handleSubmit" class="modal-body" novalidate>
          <div v-if="serverBanner" class="server-error-banner">
            ⚠️ {{ serverBanner }}
          </div>

          <div class="current-summary-box">
            <div>
              <span class="label">الوضع الحالي:</span>
              <strong>{{ formatRemainingLabel(subscription.days_remaining) }}</strong>
            </div>
            <div>
              <span class="label">التكلفة المعتادة:</span>
              <strong>{{ formatMoney(subscription.amount, subscription.currency) }}</strong>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">دورة التجديد</label>
              <select v-model="form.billing_cycle" class="form-select" @change="recomputeExpiry">
                <option v-for="cycle in billingCycleOptions" :key="cycle.value" :value="cycle.value">
                  {{ cycle.label }}
                </option>
              </select>
            </div>

            <div v-if="form.billing_cycle === 'custom_days'" class="form-group">
              <label class="form-label required">عدد أيام الدورة المخصصة</label>
              <input
                v-model="form.custom_cycle_days"
                type="number"
                min="1"
                max="3650"
                class="form-input"
                :class="{ 'is-invalid': hasError('custom_cycle_days') }"
                @input="recomputeExpiry"
                @blur="touchField('custom_cycle_days', form, subscription.next_expiry_date)"
              />
              <span v-if="hasError('custom_cycle_days')" class="error-text">{{ getError('custom_cycle_days') }}</span>
            </div>

            <div class="form-group">
              <label class="form-label required">تاريخ الانتهاء الجديد</label>
              <input
                v-model="form.new_expiry_date"
                type="date"
                class="form-input"
                :class="{ 'is-invalid': hasError('new_expiry_date') }"
                @change="touchField('new_expiry_date', form, subscription.next_expiry_date)"
              />
              <span v-if="hasError('new_expiry_date')" class="error-text">{{ getError('new_expiry_date') }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">المبلغ المدفوع</label>
              <input
                v-model="form.amount_paid"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                :class="{ 'is-invalid': hasError('amount_paid') }"
                @blur="touchField('amount_paid', form, subscription.next_expiry_date)"
              />
              <span v-if="hasError('amount_paid')" class="error-text">{{ getError('amount_paid') }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">رقم الفاتورة / المرجع</label>
              <input
                v-model="form.invoice_reference"
                type="text"
                maxlength="191"
                class="form-input"
                placeholder="مثال: INV-2026-1042"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">ملاحظات التجديد</label>
              <textarea
                v-model="form.notes"
                rows="2"
                maxlength="2000"
                class="form-textarea"
                placeholder="أي ملاحظات تخص الدفع أو الترقية..."
              ></textarea>
            </div>
          </div>

          <footer class="modal-footer">
            <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
            <button type="submit" class="save-btn" :disabled="renewing">
              {{ renewing ? 'جارٍ تسجيل التجديد...' : 'تأكيد التجديد وتصفير التذكيرات ✓' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import {
  computeNextExpiryPreview,
  formatMoney,
  formatRemainingLabel,
} from '../constants/subscriptionOptions.js';
import { validateRenewField, validateRenewForm } from '../validation/subscriptionValidator.js';
import { useFormValidation } from '../composables/useFormValidation.js';

const props = defineProps({
  show: { type: Boolean, default: false },
  subscription: { type: Object, default: null },
  meta: { type: Object, default: () => ({}) },
  renewing: { type: Boolean, default: false },
  onRenew: { type: Function, required: true },
});

const emit = defineEmits(['close']);

const form = reactive({
  billing_cycle: 'annual',
  custom_cycle_days: null,
  new_expiry_date: '',
  amount_paid: '',
  currency: 'USD',
  invoice_reference: '',
  notes: '',
});

const billingCycleOptions = computed(() =>
  props.meta?.billing_cycles?.length
    ? props.meta.billing_cycles
    : [
        { value: 'monthly', label: 'شهري' },
        { value: 'quarterly', label: 'ربع سنوي (كل 3 أشهر)' },
        { value: 'semi_annual', label: 'نصف سنوي (كل 6 أشهر)' },
        { value: 'annual', label: 'سنوي' },
        { value: 'biennial', label: 'كل سنتين' },
        { value: 'custom_days', label: 'مخصص (عدد أيام محدد)' },
      ]
);

const {
  serverBanner,
  touchField,
  validateAll,
  applyServerErrors,
  resetValidation,
  hasError,
  getError,
} = useFormValidation({
  fields: ['new_expiry_date', 'amount_paid', 'custom_cycle_days', 'invoice_reference', 'notes'],
  validateFieldFn: validateRenewField,
  validateFormFn: validateRenewForm,
});

const recomputeExpiry = () => {
  if (!props.subscription) return;
  const today = new Date().toISOString().slice(0, 10);
  let candidate = computeNextExpiryPreview(
    props.subscription.next_expiry_date,
    form.billing_cycle,
    form.custom_cycle_days
  );
  if (!candidate || candidate <= today) {
    candidate = computeNextExpiryPreview(today, form.billing_cycle, form.custom_cycle_days);
  }
  form.new_expiry_date = candidate;
};

watch(
  () => [props.show, props.subscription],
  ([visible, sub]) => {
    if (visible && sub) {
      resetValidation();
      form.billing_cycle = sub.billing_cycle || 'annual';
      form.custom_cycle_days = sub.custom_cycle_days ?? null;
      form.amount_paid = sub.amount ?? 0;
      form.currency = sub.currency || 'USD';
      form.invoice_reference = '';
      form.notes = '';
      recomputeExpiry();
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  if (!props.subscription) return;
  if (!validateAll(form, props.subscription.next_expiry_date)) return;

  const result = await props.onRenew(props.subscription.id, {
    billing_cycle: form.billing_cycle,
    custom_cycle_days: form.billing_cycle === 'custom_days' ? Number(form.custom_cycle_days) : null,
    new_expiry_date: form.new_expiry_date || null,
    amount_paid: form.amount_paid !== '' ? Number(form.amount_paid) : null,
    currency: form.currency,
    invoice_reference: form.invoice_reference.trim() || null,
    notes: form.notes.trim() || null,
  });

  if (result?.ok) {
    emit('close');
  } else if (result) {
    applyServerErrors(result.errors, result.message);
  }
};
</script>

<style scoped>
.sub-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(6px);
  z-index: 1210;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.renew-modal-card {
  background: #0f172a;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 1.15rem;
  width: 100%;
  max-width: 40rem;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.35rem;
  background: rgba(30, 41, 59, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-title h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #f8fafc;
}

.header-title p {
  margin: 0.15rem 0 0 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.current-summary-box {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.84rem;
}

.current-summary-box .label {
  color: #94a3b8;
  margin-left: 0.35rem;
}

.current-summary-box strong {
  color: #34d399;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
}

.form-label.required::after {
  content: ' *';
  color: #f43f5e;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.625rem;
  padding: 0.55rem 0.75rem;
  color: #f8fafc;
  font-size: 0.85rem;
}

.form-input.is-invalid {
  border-color: #f43f5e;
}

.error-text {
  color: #fda4af;
  font-size: 0.75rem;
  font-weight: 600;
}

.server-error-banner {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 0.7rem 0.9rem;
  border-radius: 0.65rem;
  font-size: 0.82rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 0.55rem 1.1rem;
  border-radius: 0.625rem;
  font-weight: 700;
  cursor: pointer;
}

.save-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 0.55rem 1.25rem;
  border-radius: 0.625rem;
  font-weight: 800;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
