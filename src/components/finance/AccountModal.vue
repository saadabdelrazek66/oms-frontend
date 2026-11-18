<template>
  <Teleport to="body">
    <div v-if="show" class="finance-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="finance-modal-card">
      <div class="modal-header">
        <div class="header-title">
          <span class="icon">🏦</span>
          <h3>{{ isEditing ? 'تعديل بيانات الحساب / الخزينة' : 'إضافة خزينة أو حساب بنكي جديد' }}</h3>
        </div>
        <button class="close-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <div class="form-grid">
          <!-- اسم الحساب -->
          <div class="form-group full-width">
            <label class="form-label required">اسم الحساب / الخزينة</label>
            <input
              v-model="form.name"
              type="text"
              required
              maxlength="150"
              class="form-input"
              placeholder="مثال: الخزينة الرئيسية، بنك CIB، محفظة الشركة..."
            />
          </div>

          <!-- نوع الحساب -->
          <div class="form-group">
            <label class="form-label required">نوع الحساب</label>
            <select v-model="form.type" required class="form-select">
              <option value="cash">خزينة نقدية (كاش)</option>
              <option value="bank">حساب بنكي</option>
              <option value="wallet">محفظة إلكترونية (فودافون كاش / إنستاباي)</option>
              <option value="pos">نقطة بيع / بوابة دفع</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <!-- العملة -->
          <div class="form-group">
            <label class="form-label required">العملة</label>
            <select v-model="form.currency" required class="form-select">
              <option value="EGP">جنيه مصري (EGP)</option>
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
              <option value="AED">درهم إماراتي (AED)</option>
              <option value="EUR">يورو (EUR)</option>
            </select>
          </div>

          <!-- اسم البنك (إذا كان بنك) -->
          <div v-if="form.type === 'bank'" class="form-group">
            <label class="form-label">اسم البنك</label>
            <input
              v-model="form.bank_name"
              type="text"
              maxlength="100"
              class="form-input"
              placeholder="مثال: البنك التجاري الدولي، الأهلي..."
            />
          </div>

          <!-- رقم الحساب / الآيبان -->
          <div v-if="form.type !== 'cash'" class="form-group">
            <label class="form-label">رقم الحساب / الآيبان / رقم المحفظة</label>
            <input
              v-model="form.account_number"
              type="text"
              maxlength="100"
              class="form-input"
              placeholder="مثال: EG12000... أو رقم هاتف المحفظة"
            />
          </div>

          <!-- الرصيد الافتتاحي (فقط عند الإنشاء) -->
          <div v-if="!isEditing" class="form-group">
            <label class="form-label">الرصيد الافتتاحي</label>
            <input
              v-model="form.opening_balance"
              type="number"
              step="0.01"
              min="0"
              class="form-input"
              placeholder="0.00"
            />
            <small class="field-hint">الرصيد المالي الحالي الموجود بالخزينة أو الحساب</small>
          </div>

          <!-- الحالة (نشط / معطل) -->
          <div class="form-group">
            <label class="form-label">الحالة</label>
            <select v-model="form.is_active" class="form-select">
              <option :value="true">نشط ومتاح للمعاملات</option>
              <option :value="false">معطل / مجمد مؤقتاً</option>
            </select>
          </div>

          <!-- الوصف -->
          <div class="form-group full-width">
            <label class="form-label">وصف / ملاحظات</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="form-textarea"
              placeholder="أي ملاحظات تخص الحساب أو الشخص المسؤول عنه..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
          <button type="submit" class="save-btn" :disabled="submitting">
            <span v-if="submitting" class="spinner"></span>
            <span v-else>{{ isEditing ? 'حفظ التعديلات 💾' : 'إنشاء الحساب 🏦' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  account: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.account && !!props.account.id)
const submitting = ref(false)

const form = reactive({
  name: '',
  type: 'bank',
  bank_name: '',
  account_number: '',
  currency: 'EGP',
  opening_balance: 0,
  is_active: true,
  description: '',
})

const initForm = () => {
  if (props.account) {
    form.name = props.account.name || ''
    form.type = props.account.type || 'bank'
    form.bank_name = props.account.bank_name || ''
    form.account_number = props.account.account_number || ''
    form.currency = props.account.currency || 'EGP'
    form.opening_balance = props.account.opening_balance || 0
    form.is_active = props.account.is_active !== false
    form.description = props.account.description || ''
  } else {
    form.name = ''
    form.type = 'bank'
    form.bank_name = ''
    form.account_number = ''
    form.currency = 'EGP'
    form.opening_balance = 0
    form.is_active = true
    form.description = ''
  }
}

watch(() => props.show, (val) => {
  if (val) initForm()
})

const submitForm = async () => {
  submitting.value = true
  try {
    let res
    if (isEditing.value) {
      res = await api.put(`/finance/accounts/${props.account.id}`, form)
      alertService.toast('✅ تم تحديث بيانات الحساب بنجاح', 'success')
    } else {
      res = await api.post('/finance/accounts', form)
      alertService.toast('✅ تم إنشاء الحساب المالي بنجاح', 'success')
    }

    emit('saved', res.data?.data)
    emit('close')
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ الحساب'
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
  max-width: 580px;
  background: linear-gradient(160deg, #111a47 0%, #0c1236 100%);
  border: 1px solid rgba(135, 155, 230, 0.22);
  border-radius: 18px;
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
  background: rgba(14, 22, 60, 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 17px;
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
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-label.required::after {
  content: " *";
  color: #f43f5e;
}

.form-input, .form-select, .form-textarea {
  background: rgba(8, 14, 40, 0.65);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  color: #f1f5f9;
  font-size: 14px;
  outline: none;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #00f2fe;
}

.field-hint {
  color: #64748b;
  font-size: 11px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(135, 155, 230, 0.15);
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

.save-btn {
  padding: 10px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00f2fe, #4facfe);
  border: none;
  color: #0c1236;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(12, 18, 54, 0.3);
  border-radius: 50%;
  border-top-color: #0c1236;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
