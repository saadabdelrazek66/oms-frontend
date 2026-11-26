<template>
  <Teleport to="body">
    <div v-if="modelValue" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="closeModal">
        <div class="modal-content" role="dialog" style="width: min(500px, 100%) !important">
          <button class="modal-close" type="button" @click="closeModal">×</button>
          <div
            class="modal-icon"
            style="background: linear-gradient(145deg, #78e4d8, #65b5ff); color: #12183f; display: flex; align-items: center; justify-content: center"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
          <span class="eyebrow" style="color: #65b5ff">استنساخ سريع</span>
          <h3>تحديد تواريخ الشهر الجديد</h3>
          <p>سيتم نسخ العميل، نوع الخطة، الروابط، وفريق العمل كما هم من الخطة الأصلية.</p>

          <form class="plan-form mt-2" @submit.prevent="submitDuplicate">
            <div class="form-grid">
              <div class="form-group">
                <label>تاريخ بداية الخطة</label>
                <input v-model="duplicateForm.start_date" type="date" required />
              </div>
              <div class="form-group">
                <label>تاريخ نهاية الخطة</label>
                <input v-model="duplicateForm.end_date" type="date" required />
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>التسليم النهائي</label>
                <input v-model="duplicateForm.planned_delivery_date" type="datetime-local" required />
              </div>
            </div>
            <div v-if="plan?.requires_review" class="form-grid">
              <div class="form-group">
                <label>موعد التسليم الابتدائي</label>
                <input v-model="duplicateForm.planned_initial_delivery_date" type="datetime-local" />
              </div>
              <div class="form-group">
                <label>موعد إنهاء المراجعة</label>
                <input v-model="duplicateForm.planned_review_date" type="datetime-local" required />
              </div>
            </div>
            <div class="modal-actions" style="margin-top: 20px">
              <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
              <button
                type="submit"
                class="primary-btn"
                style="background: linear-gradient(110deg, #78e4d8, #65b5ff)"
                :disabled="submitting"
              >
                {{ submitting ? 'جارٍ الاستنساخ...' : 'تأكيد واستنساخ 🚀' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import alertService from '@/services/alertService'
import { contentPlansApi } from '../api/contentPlansApi'
import { parseDateSafe, toDatetimeLocal } from '../utils/planHelpers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plan: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'duplicated'])

const submitting = ref(false)
const duplicateForm = reactive({
  start_date: '',
  end_date: '',
  planned_delivery_date: '',
  planned_review_date: '',
  planned_initial_delivery_date: '',
})

const toDateString = (d) => {
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().split('T')[0]
}

watch(
  [() => props.modelValue, () => props.plan],
  ([open, plan]) => {
    if (!open || !plan) return
    if (plan.start_date && plan.end_date && plan.planned_delivery_date) {
      const oldStart = new Date(plan.start_date)
      const oldEnd = new Date(plan.end_date)
      const oldReview = plan.planned_review_date ? new Date(plan.planned_review_date) : null
      const oldInitialDelivery = plan.planned_initial_delivery_date
        ? new Date(plan.planned_initial_delivery_date)
        : null
      const oldDelivery = new Date(plan.planned_delivery_date)

      const durationMs = oldEnd.getTime() - oldStart.getTime()
      const reviewGapMs = oldReview ? oldReview.getTime() - oldStart.getTime() : 0
      const initialDeliveryGapMs = oldInitialDelivery
        ? oldInitialDelivery.getTime() - oldStart.getTime()
        : 0
      const deliveryGapMs = oldDelivery.getTime() - oldStart.getTime()

      const now = new Date()
      let newStart = new Date(oldStart)
      newStart.setMonth(newStart.getMonth() + 1)

      if (newStart < now) {
        const targetDay = oldStart.getDate()
        newStart = new Date()
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
        newStart.setDate(targetDay)
        if (newStart < now) newStart.setMonth(newStart.getMonth() + 1)
      }

      duplicateForm.start_date = toDateString(newStart)
      duplicateForm.end_date = toDateString(new Date(newStart.getTime() + durationMs))
      duplicateForm.planned_review_date = oldReview
        ? toDatetimeLocal(new Date(newStart.getTime() + reviewGapMs))
        : ''
      duplicateForm.planned_initial_delivery_date = oldInitialDelivery
        ? toDatetimeLocal(new Date(newStart.getTime() + initialDeliveryGapMs))
        : ''
      duplicateForm.planned_delivery_date = toDatetimeLocal(
        new Date(newStart.getTime() + deliveryGapMs),
      )
    } else {
      Object.assign(duplicateForm, {
        start_date: '',
        end_date: '',
        planned_delivery_date: '',
        planned_review_date: '',
        planned_initial_delivery_date: '',
      })
    }
  },
  { immediate: true },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const submitDuplicate = async () => {
  const start = parseDateSafe(duplicateForm.start_date)
  const end = parseDateSafe(duplicateForm.end_date)
  const delivery = parseDateSafe(duplicateForm.planned_delivery_date)
  const review = parseDateSafe(duplicateForm.planned_review_date)
  const initial = parseDateSafe(duplicateForm.planned_initial_delivery_date)

  if (start && end && end < start) {
    alertService.smartToast('تاريخ نهاية الخطة يجب أن يكون مساوياً أو بعد تاريخ البداية')
    return
  }
  if (start && delivery && delivery >= start) {
    alertService.smartToast('التسليم النهائي يجب أن يتم قبل تاريخ بداية الخطة')
    return
  }
  if (props.plan?.requires_review) {
    if (delivery && review && review >= delivery) {
      alertService.smartToast('موعد إنهاء المراجعة يجب أن يسبق موعد التسليم النهائي')
      return
    }
    if (review && initial && initial >= review) {
      alertService.smartToast('موعد التسليم الابتدائي يجب أن يسبق موعد المراجعة')
      return
    }
  } else if (delivery && initial && initial >= delivery) {
    alertService.smartToast('موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...duplicateForm,
      planned_initial_delivery_date: duplicateForm.planned_initial_delivery_date || null,
      planned_review_date: duplicateForm.planned_review_date || null,
    }
    const response = await contentPlansApi.duplicate(props.plan.id, payload)
    closeModal()
    alertService.smartToast('تم استنساخ الخطة بنجاح 🚀')
    emit('duplicated', response.data?.data || null)
  } catch (error) {
    console.error('فشل الاستنساخ:', error)
    alertService.smartToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة الاستنساخ')
  } finally {
    submitting.value = false
  }
}
</script>
