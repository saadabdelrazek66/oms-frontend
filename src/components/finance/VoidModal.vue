<template>
  <Teleport to="body">
    <div v-if="show && transaction" class="finance-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="finance-modal-card">
      <div class="modal-header">
        <div class="header-title">
          <span class="warning-icon">⚠️</span>
          <h3>إلغاء وإبطال المعاملة المالية</h3>
        </div>
        <button class="close-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="submitVoid" class="modal-body">
        <div class="void-summary-card">
          <div class="summary-row">
            <span class="lbl">رقم المعاملة:</span>
            <strong class="val-mono">{{ transaction.transaction_number }}</strong>
          </div>
          <div class="summary-row">
            <span class="lbl">المبلغ:</span>
            <strong class="val-amount" :class="transaction.type === 'income' ? 'text-income' : 'text-expense'">
              {{ transaction.type === 'income' ? '+' : '-' }}{{ Number(transaction.amount).toLocaleString() }} {{ transaction.currency }}
            </strong>
          </div>
          <div class="summary-row">
            <span class="lbl">البيان / المستفيد:</span>
            <span>{{ transaction.entity_display_name || transaction.beneficiary_name || 'غير محدد' }}</span>
          </div>
          <div class="summary-row">
            <span class="lbl">الخزينة المخصومة / المودع بها:</span>
            <span>{{ transaction.account?.name || 'غير محدد' }}</span>
          </div>
        </div>

        <div class="notice-banner">
          <span class="info-icon">ℹ️</span>
          <p>
            عند إلغاء هذه العملية، سيتم <strong>عكس أثرها المالي فورياً على رصيد الخزينة</strong> مع الاحتفاظ بالمعاملة في السجلات التدقيقية موثقة باسمك وتاريخ الإلغاء.
          </p>
        </div>

        <div class="form-group">
          <label class="form-label required">سبب الإلغاء أو الإبطال (مطلوب لأغراض الرقابة المالية)</label>
          <textarea
            v-model="voidReason"
            rows="3"
            required
            minlength="5"
            maxlength="500"
            class="form-textarea"
            placeholder="اكتب سبب الإلغاء بالتفصيل (مثال: خطأ في إدخال المبلغ، تكرار السداد، إلغاء التعاقد...)"
          ></textarea>
          <small class="char-count">{{ voidReason.length }} / 500 حرف (الحد الأدنى 5 أحرف)</small>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="$emit('close')">تراجع</button>
          <button
            type="submit"
            class="confirm-void-btn"
            :disabled="submitting || voidReason.trim().length < 5"
          >
            <span v-if="submitting" class="spinner"></span>
            <span v-else>تأكيد إلغاء المعاملة وعكس الرصيد 🚫</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  transaction: { type: Object, default: null },
})

const emit = defineEmits(['close', 'voided'])

const voidReason = ref('')
const submitting = ref(false)

watch(() => props.show, (val) => {
  if (val) voidReason.value = ''
})

const submitVoid = async () => {
  if (!props.transaction || voidReason.value.trim().length < 5) return

  submitting.value = true
  try {
    const res = await api.post(`/finance/transactions/${props.transaction.id}/void`, {
      void_reason: voidReason.value.trim()
    })

    alertService.toast('✅ تم إلغاء المعاملة وعكس أثرها المالي بنجاح', 'success')

    emit('voided', res.data?.data)
    emit('close')
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء إلغاء المعاملة'
    alertService.toast(`❌ ${msg}`, 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.finance-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999 !important;
  background: rgba(3, 7, 24, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  direction: rtl;
}

.finance-modal-card {
  width: 100%;
  max-width: 520px;
  background: linear-gradient(160deg, #161e4a 0%, #0d1233 100%);
  border: 1px solid rgba(244, 63, 94, 0.35);
  border-radius: 18px;
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(244, 63, 94, 0.2);
  background: rgba(244, 63, 94, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  font-size: 20px;
}

.header-title h3 {
  margin: 0;
  color: #f43f5e;
  font-size: 16px;
  font-weight: 800;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.void-summary-card {
  background: rgba(6, 11, 35, 0.45);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #cbd5e1;
}

.summary-row .lbl {
  color: #94a3b8;
}

.val-mono {
  font-family: monospace;
  color: #38bdf8;
}

.val-amount {
  font-weight: 700;
}

.text-income { color: #10b981; }
.text-expense { color: #f43f5e; }

.notice-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
}

.notice-banner p {
  margin: 0;
  font-size: 12px;
  color: #bae6fd;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.form-label.required::after {
  content: " *";
  color: #f43f5e;
}

.form-textarea {
  background: rgba(8, 14, 40, 0.65);
  border: 1px solid rgba(135, 155, 230, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  resize: vertical;
}

.form-textarea:focus {
  border-color: #f43f5e;
}

.char-count {
  font-size: 11px;
  color: #64748b;
  text-align: left;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(135, 155, 230, 0.12);
}

.cancel-btn {
  padding: 10px 18px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 13px;
}

.confirm-void-btn {
  padding: 10px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f43f5e, #be123c);
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(244, 63, 94, 0.35);
  transition: all 0.2s;
}

.confirm-void-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(244, 63, 94, 0.5);
  transform: translateY(-1px);
}

.confirm-void-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
