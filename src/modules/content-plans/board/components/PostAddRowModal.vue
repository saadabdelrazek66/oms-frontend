<template>
  <Teleport to="body">
    <div v-if="modelValue" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content" style="width: min(400px, 100%)">
          <h3>إضافة منشور إضافي</h3>
          <p>حدد تاريخ اليوم الذي تريد إضافة صف جديد فيه.</p>
          <form @submit.prevent="addNewRow">
            <div class="form-group mt-3">
              <label>تاريخ المنشور</label>
              <VueDatePicker
                v-model="newRowDate"
                :enable-time-picker="false"
                auto-apply
                model-type="yyyy-MM-dd"
                format="yyyy-MM-dd"
                :min-date="minDate"
                :max-date="maxDate"
                placeholder="اختر تاريخ المنشور"
                required
              />
            </div>

            <div
              class="form-group"
              style="margin-top: 20px; background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.3)"
            >
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0; font-size: 13px; color: #ef4444; font-weight: bold">
                <input v-model="newRowIsUrgent" type="checkbox" style="width: 18px; height: 18px; accent-color: #ef4444" />
                🚨 تعيين كمنشور عاجل ذو أولوية قصوى
              </label>
              <p style="margin: 5px 0 0 28px; font-size: 10px; color: #666">
                سيظهر المنشور مميزاً باللون الأحمر لتنبيه فريق العمل.
              </p>
            </div>

            <div class="modal-actions mt-4">
              <button type="button" class="secondary-btn" @click="$emit('update:modelValue', false)">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="adding || !newRowDate">إضافة الصف</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  planId: { type: [String, Number], required: true },
  minDate: { type: Date, default: null },
  maxDate: { type: Date, default: null },
})

const emit = defineEmits(['update:modelValue', 'created'])

const newRowDate = ref('')
const newRowIsUrgent = ref(false)
const adding = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      newRowDate.value = ''
      newRowIsUrgent.value = false
    }
  },
)

const addNewRow = async () => {
  if (!newRowDate.value) return
  adding.value = true
  try {
    const res = await api.post(`/content-plans/${props.planId}/posts`, {
      target_date: newRowDate.value,
      is_urgent: newRowIsUrgent.value,
    })
    const newPost = res.data.data
    newPost.ad_platform = []
    newPost.reviewer_ids = []
    const isUrgent = newRowIsUrgent.value
    emit('update:modelValue', false)
    emit('created', { post: newPost, isUrgent })
    if (isUrgent) {
      alertService.smartToast('تمت إضافة المنشور العاجل وإعادة جدولة الفائض تلقائياً للأيام التالية 🚀', 'success')
    } else {
      alertService.smartToast('تمت إضافة المنشور للجدول.')
    }
  } catch {
    alertService.smartToast('خطأ في إضافة المنشور.')
  } finally {
    adding.value = false
  }
}
</script>
