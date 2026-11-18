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

      <form @submit.prevent="submitForm" class="modal-body">
        <div class="form-grid">
          <!-- اسم القسم -->
          <div class="form-group full-width">
            <label class="form-label required">اسم القسم</label>
            <input
              v-model="form.name"
              type="text"
              required
              maxlength="100"
              class="form-input"
              placeholder="مثال: الإعلانات الممولة، صيانة ومعدات..."
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

          <!-- الأيقونة -->
          <div class="form-group">
            <label class="form-label">الأيقونة (Emoji)</label>
            <div class="icon-selector">
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

          <!-- اللون التمييزي -->
          <div class="form-group">
            <label class="form-label">اللون التمييزي</label>
            <div class="color-picker-wrap">
              <input v-model="form.color" type="color" class="color-input" />
              <input v-model="form.color" type="text" class="form-input color-text" placeholder="#38bdf8" />
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
    form.icon = props.category.icon || '📁'
    form.color = props.category.color || '#38bdf8'
    form.is_active = props.category.is_active !== false
    form.description = props.category.description || ''
    form.is_system = props.category.is_system || false
  } else {
    form.name = ''
    form.type = props.defaultType || 'expense'
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
  submitting.value = true
  try {
    let res
    if (isEditing.value) {
      res = await api.put(`/finance/categories/${props.category.id}`, form)
      alertService.toast('✅ تم تحديث بيانات القسم بنجاح', 'success')
    } else {
      res = await api.post('/finance/categories', form)
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

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.icon-input {
  text-align: center;
  font-size: 18px;
}

.quick-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-icons span {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  transition: transform 0.15s;
}

.quick-icons span:hover {
  transform: scale(1.25);
  background: rgba(56, 189, 248, 0.2);
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
}

.color-text {
  flex: 1;
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
