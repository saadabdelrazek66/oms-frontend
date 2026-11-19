<template>
  <Teleport to="body">
    <div v-if="show" class="finance-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="finance-modal-card">
        <div class="modal-header">
          <div class="header-title">
            <span class="icon">🏷️</span>
            <h3>{{ isEditing ? 'تعديل القسم المالي' : 'إضافة تصنيف أو قسم مالي جديد' }}</h3>
          </div>
          <button class="close-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">✕</button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="modal-body">
            <div class="form-grid">
              <!-- اسم القسم -->
              <div class="form-group">
                <label class="form-label required">اسم القسم</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  maxlength="100"
                  class="form-input"
                  placeholder="مثال: إيجار المقر، إعلانات ممولة..."
                />
              </div>

              <!-- نوع القسم (إيراد أو مصروف) -->
              <div class="form-group">
                <label class="form-label required">نوع القسم</label>
                <select v-model="form.type" :disabled="isEditing && form.is_system" required class="form-select">
                  <option value="expense">مصروفات / نفقات</option>
                  <option value="income">إيرادات / مقبوضات</option>
                </select>
              </div>

              <!-- طبيعة المصروف (فقط إذا كان مصروف) -->
              <div v-if="form.type === 'expense'" class="form-group">
                <label class="form-label required">طبيعة المصروف</label>
                <select v-model="form.cost_type" class="form-select">
                  <option value="variable">مصروف متغير (قيمة حرة)</option>
                  <option value="fixed">مصروف ثابت (قيمة محددة دورياً)</option>
                </select>
              </div>

              <!-- القيمة الثابتة للمصروف (فقط إذا كان مصروف ثابت) -->
              <div v-if="form.type === 'expense' && form.cost_type === 'fixed'" class="form-group">
                <div class="form-label-row">
                  <label class="form-label required">القيمة الشهرية الثابتة</label>
                  <span class="fixed-badge-hint">🔒 مقفولة بالصرف</span>
                </div>
                <div class="input-with-currency">
                  <input
                    v-model="form.fixed_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999999.99"
                    required
                    class="form-input fixed-amount-input"
                    placeholder="مثال: 5000"
                  />
                  <span class="currency-tag">ج.م</span>
                </div>
              </div>

              <!-- الحالة -->
              <div class="form-group">
                <label class="form-label">الحالة</label>
                <select v-model="form.is_active" class="form-select">
                  <option :value="true">مفعل ومتاح للاختيار</option>
                  <option :value="false">معطل</option>
                </select>
              </div>

              <!-- اللون التمييزي -->
              <div class="form-group">
                <label class="form-label">اللون التمييزي</label>
                <div class="color-picker-wrap">
                  <input v-model="form.color" type="color" class="color-input" />
                  <input v-model="form.color" type="text" class="form-input color-text" placeholder="#38bdf8" />
                </div>
              </div>

              <!-- الأيقونة -->
              <div class="form-group full-width">
                <label class="form-label">الأيقونة (Emoji)</label>
                <div class="icon-selector-row">
                  <input
                    v-model="form.icon"
                    type="text"
                    maxlength="10"
                    class="form-input icon-input"
                    placeholder="📁"
                  />
                  <div class="quick-icons">
                    <span v-for="ic in quickIcons" :key="ic" @click="form.icon = ic">{{ ic }}</span>
                  </div>
                </div>
              </div>

              <!-- الوصف -->
              <div class="form-group full-width">
                <label class="form-label">وصف القسم (اختياري)</label>
                <textarea
                  v-model="form.description"
                  rows="2"
                  class="form-textarea"
                  placeholder="وصف مختصر لاستخدام هذا القسم وما يندرج تحته..."
                ></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
            <button type="submit" class="save-btn" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span v-else>{{ isEditing ? 'حفظ التعديلات 💾' : 'إضافة القسم 🏷️' }}</span>
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
  category: { type: Object, default: null },
  defaultType: { type: String, default: 'expense' },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.category && !!props.category.id)
const submitting = ref(false)

const quickIcons = ['💰', '💼', '💳', '💻', '💡', '🏢', '📢', '☕', '🚗', '📜', '🏷️', '🎯']

const form = reactive({
  name: '',
  type: 'expense',
  cost_type: 'variable',
  fixed_amount: '',
  icon: '📁',
  color: '#38bdf8',
  is_active: true,
  description: '',
  is_system: false,
})

const initForm = () => {
  if (props.category) {
    form.name = props.category.name || ''
    form.type = props.category.type || 'expense'
    form.cost_type = props.category.cost_type || (props.category.slug === 'office_rent' ? 'fixed' : 'variable')
    form.fixed_amount = (props.category.fixed_amount !== null && props.category.fixed_amount !== undefined && props.category.fixed_amount !== '')
      ? props.category.fixed_amount
      : ''
    form.icon = props.category.icon || '📁'
    form.color = props.category.color || '#38bdf8'
    form.is_active = props.category.is_active !== false
    form.description = props.category.description || ''
    form.is_system = props.category.is_system || false
  } else {
    form.name = ''
    form.type = props.defaultType || 'expense'
    form.cost_type = 'variable'
    form.fixed_amount = ''
    form.icon = '📁'
    form.color = '#38bdf8'
    form.is_active = true
    form.description = ''
    form.is_system = false
  }
}

watch(() => props.show, (val) => {
  if (val) initForm()
})

const submitForm = async () => {
  if (form.type === 'expense' && form.cost_type === 'fixed') {
    if (!form.fixed_amount || Number(form.fixed_amount) <= 0) {
      alertService.toast('❌ يرجى إدخال قيمة مالية ثابتة وصحيحة للمصروف أكبر من صفر', 'error')
      return
    }
  }

  submitting.value = true
  try {
    const payload = {
      ...form,
      cost_type: form.type === 'expense' ? (form.cost_type || 'variable') : 'variable',
      fixed_amount: (form.type === 'expense' && form.cost_type === 'fixed' && form.fixed_amount !== '')
        ? Number(form.fixed_amount)
        : null,
    }

    let res
    if (isEditing.value) {
      res = await api.put(`/finance/categories/${props.category.id}`, payload)
      alertService.toast('✅ تم تحديث بيانات القسم بنجاح', 'success')
    } else {
      res = await api.post('/finance/categories', payload)
      alertService.toast('✅ تم إنشاء القسم المالي بنجاح', 'success')
    }

    emit('saved', res.data?.data)
    emit('close')
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ القسم'
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
  background: rgba(3, 7, 24, 0.82);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  direction: rtl;
}

.finance-modal-card {
  width: min(580px, 95vw);
  max-height: 90vh;
  background: linear-gradient(165deg, #10183b 0%, #0a0f29 100%);
  border: 1px solid rgba(135, 155, 230, 0.24);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.16);
  background: rgba(14, 22, 60, 0.55);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 16px;
  font-weight: 800;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(244, 63, 94, 0.2);
  color: #f43f5e;
  border-color: rgba(244, 63, 94, 0.4);
}

.modal-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(135, 155, 230, 0.28) rgba(14, 22, 60, 0.2);
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(14, 22, 60, 0.2);
  border-radius: 8px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(135, 155, 230, 0.28);
  border-radius: 8px;
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
  font-size: 12.5px;
  font-weight: 600;
  color: #cbd5e1;
}

.form-label.required::after {
  content: " *";
  color: #f43f5e;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.fixed-badge-hint {
  font-size: 10px;
  color: #38bdf8;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
}

.form-input, .form-select, .form-textarea {
  background: rgba(8, 14, 40, 0.65);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-radius: 10px;
  padding: 9px 12px;
  color: #f1f5f9;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15);
}

.input-with-currency {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.fixed-amount-input {
  width: 100%;
  padding-left: 45px !important;
  font-weight: 700;
  font-size: 14px;
  color: #38bdf8;
}

.currency-tag {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
}

.icon-selector-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-input {
  width: 50px;
  text-align: center;
  font-size: 18px;
  padding: 6px;
  flex-shrink: 0;
}

.quick-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.quick-icons span {
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  transition: transform 0.15s, background 0.15s;
}

.quick-icons span:hover {
  transform: scale(1.2);
  background: rgba(56, 189, 248, 0.2);
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  padding: 0;
}

.color-text {
  flex: 1;
}

.modal-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  border-top: 1px solid rgba(135, 155, 230, 0.15);
  background: rgba(14, 22, 60, 0.4);
}

.cancel-btn {
  padding: 9px 18px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.save-btn {
  padding: 9px 22px;
  border-radius: 9px;
  background: linear-gradient(135deg, #00f2fe, #4facfe);
  border: none;
  color: #0c1236;
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(12, 18, 54, 0.3);
  border-radius: 50%;
  border-top-color: #0c1236;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
