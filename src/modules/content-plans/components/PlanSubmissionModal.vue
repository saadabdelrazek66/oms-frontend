<template>
  <Teleport to="body">
    <div v-if="modelValue" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="closeModal">
        <div class="modal-content delivery-modal" role="dialog" style="width: min(520px, 100%) !important">
          <button class="modal-close" type="button" @click="closeModal">×</button>

          <div
            class="modal-icon"
            :style="{
              background:
                submissionType === 'review'
                  ? 'linear-gradient(145deg, #38bdf8, #6366f1)'
                  : 'linear-gradient(145deg, #34d399, #059669)',
              color: '#fff',
            }"
          >
            {{ submissionType === 'review' ? '📤' : '🚀' }}
          </div>

          <span class="eyebrow" :style="{ color: submissionType === 'review' ? '#60a5fa' : '#34d399' }">
            {{ submissionType === 'review' ? 'المراجعة الداخلية' : 'التسليم النهائي' }}
          </span>

          <h3 :style="{ color: submissionType === 'review' ? '#93c5fd' : '#6ee7b7' }">
            {{ submissionType === 'review' ? 'تسليم الخطة للمراجعة' : 'تأكيد التسليم النهائي' }}
          </h3>

          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; line-height: 1.5">
            خطة العميل: <strong style="color: #f1f5f9">{{ plan?.client?.name || 'غير محدد' }}</strong>
            <span v-if="plan?.name" style="margin-right: 6px; color: #cbd5e1">({{ plan.name }})</span>
          </p>

          <form class="plan-form mt-4" @submit.prevent="confirmSubmit">
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
                <label style="margin-bottom: 0; font-weight: 600; color: #e2e8f0">
                  {{ submissionType === 'review' ? 'رابط الخطة للمراجعة (link)' : 'رابط الخطة النهائي (link)' }}
                  <span style="color: #f87171; font-weight: bold; margin-right: 4px">*</span>
                </label>
                <a
                  v-if="currentLink && validation.valid"
                  :href="formatExternalUrl(currentLink)"
                  target="_blank"
                  rel="noopener noreferrer"
                  :style="{
                    fontSize: '12px',
                    color: submissionType === 'review' ? '#60a5fa' : '#34d399',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }"
                  title="اختبار وفتح الرابط"
                >
                  <span>تجربة الرابط</span> ↗
                </a>
              </div>

              <input
                ref="linkInputRef"
                :value="currentLink"
                type="text"
                dir="ltr"
                placeholder="https://drive.google.com/file/d/... أو https://docs.google.com/..."
                :class="[
                  'w-full px-3 py-2 text-sm rounded-lg transition-colors',
                  validation.touched && !validation.valid
                    ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500 input-invalid'
                    : validation.touched && validation.valid
                      ? 'border-emerald-500 ring-1 ring-emerald-500 focus:border-emerald-500 focus:ring-emerald-500 input-valid'
                      : '',
                ]"
                @input="onLinkInput($event.target.value)"
                @blur="onLinkBlur"
              />

              <span
                v-if="validation.touched && !validation.valid"
                class="text-sm text-red-500 mt-1 block font-medium"
                style="color: #ef4444 !important"
              >
                {{ validation.message }}
              </span>
              <span
                v-else-if="validation.touched && validation.valid"
                class="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium"
                style="color: #34d399 !important"
              >
                <span>✓</span>
                {{ submissionType === 'review' ? 'رابط الملف سليم وجاهز للتسليم' : 'رابط الملف سليم وجاهز للتسليم للعميل' }}
              </span>
              <small v-else style="display: block; font-size: 11px; color: #94a3b8; margin-top: 4px">
                يجب إدخال رابط ملف مباشر على Google Drive أو Google Docs/Sheets (وليس رابط مجلد).
              </small>
            </div>

            <div class="form-group" style="margin-top: 14px">
              <label style="margin-bottom: 6px; font-weight: 600; color: #e2e8f0; display: block">
                ملاحظات التسليم (اختياري)
              </label>
              <textarea
                v-model="notes"
                rows="3"
                placeholder="أدخل أي ملاحظات ترغب بإرفاقها مع الخطة والتسليم..."
                class="w-full px-3 py-2 text-sm rounded-lg"
                style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); color: #f8fafc; resize: vertical"
              ></textarea>
            </div>

            <div class="modal-actions" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px">
              <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
              <button
                type="submit"
                class="primary-btn"
                :disabled="submitting || !validation.valid"
                :class="{ 'opacity-50 cursor-not-allowed': !validation.valid || submitting }"
                :style="submissionType === 'final' ? 'background: linear-gradient(135deg, #10b981, #059669);' : ''"
              >
                {{
                  submitting
                    ? 'جارٍ الإرسال...'
                    : submissionType === 'review'
                      ? 'تسليم للمراجعة 🚀'
                      : 'تأكيد التسليم النهائي ✅'
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import alertService from '@/services/alertService'
import { formatExternalUrl, validateDriveLink } from '@/utils/driveValidation'
import { contentPlansApi } from '../api/contentPlansApi'
import { isPlanClientApproved } from '../utils/planHelpers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  submissionType: { type: String, default: 'review' },
})

const emit = defineEmits(['update:modelValue', 'submitted-review', 'submitted-final'])

const submitting = ref(false)
const linkInputRef = ref(null)
const planLink = ref('')
const finalPlanLink = ref('')
const notes = ref('')
const validation = reactive({ valid: false, message: '', touched: false })

const currentLink = computed(() =>
  props.submissionType === 'review' ? planLink.value : finalPlanLink.value,
)

const validateLink = (val = currentLink.value) => {
  const result = validateDriveLink(val)
  validation.valid = result.valid
  validation.message = result.message
  return result
}

watch(
  [() => props.modelValue, () => props.plan, () => props.submissionType],
  ([open, plan, type]) => {
    if (!open || !plan) return
    notes.value = plan.notes || ''
    if (type === 'review') {
      planLink.value = plan.plan_link || plan.final_link || ''
      finalPlanLink.value = ''
      const res = validateDriveLink(planLink.value)
      validation.valid = res.valid
      validation.message = res.message
      validation.touched = Boolean(planLink.value.trim())
    } else {
      finalPlanLink.value = plan.final_plan_link || plan.final_link || plan.plan_link || ''
      planLink.value = ''
      const res = validateDriveLink(finalPlanLink.value)
      validation.valid = res.valid
      validation.message = res.message
      validation.touched = Boolean(finalPlanLink.value.trim())
    }
    nextTick(() => linkInputRef.value?.focus())
  },
  { immediate: true },
)

const closeModal = () => {
  notes.value = ''
  validation.touched = false
  validation.message = ''
  emit('update:modelValue', false)
}

const onLinkInput = (val) => {
  if (props.submissionType === 'review') planLink.value = val
  else finalPlanLink.value = val
  validation.touched = true
  validateLink(val)
}

const onLinkBlur = () => {
  validation.touched = true
  const raw = currentLink.value.trim()
  if (raw && !/^https?:\/\//i.test(raw)) {
    const fixed = `https://${raw}`
    if (props.submissionType === 'review') planLink.value = fixed
    else finalPlanLink.value = fixed
  }
  validateLink()
}

const handleBackendError = (error, defaultMsg) => {
  if (error.response?.status === 422) {
    const resData = error.response.data || {}
    const errors = resData.errors || {}
    if (errors.client_setup || resData.client_setup) {
      const msg = Array.isArray(errors.client_setup)
        ? errors.client_setup[0]
        : errors.client_setup || resData.client_setup
      alertService.error(msg)
      return
    }
    const linkErr = errors.link || errors.plan_link || errors.final_plan_link
    if (linkErr) {
      const msg = Array.isArray(linkErr) ? linkErr[0] : linkErr
      validation.valid = false
      validation.message = msg
      validation.touched = true
      alertService.error(msg)
      return
    }
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]) {
      alertService.error(Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey])
      return
    }
    if (resData.message) {
      alertService.error(resData.message)
      return
    }
  }
  alertService.error(error.response?.data?.message || defaultMsg)
}

const confirmSubmit = async () => {
  validation.touched = true
  const res = validateLink()
  if (!res.valid || !props.plan) return

  let link = currentLink.value.trim()
  if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`

  if (props.submissionType === 'final' && !isPlanClientApproved(props.plan)) {
    alertService.smartToast('عذراً، يلزم اعتماد العميل أولاً لإتمام التسليم النهائي')
    return
  }

  submitting.value = true
  try {
    if (props.submissionType === 'review') {
      await contentPlansApi.submitReview(props.plan.id, { link, notes: notes.value })
      props.plan.plan_link = link
      props.plan.final_link = link
      props.plan.notes = notes.value
      props.plan.status = 'under_review'
      closeModal()
      alertService.smartToast('تم التسليم للمراجعة بنجاح ✅')
      emit('submitted-review', props.plan)
    } else {
      await contentPlansApi.finalDelivery(props.plan.id, { link, notes: notes.value })
      props.plan.final_plan_link = link
      props.plan.final_link = link
      props.plan.notes = notes.value
      props.plan.status = 'completed'
      closeModal()
      alertService.smartToast('تم التسليم للعميل بنجاح ✅')
      emit('submitted-final', props.plan)
    }
  } catch (error) {
    handleBackendError(
      error,
      props.submissionType === 'review' ? 'حدث خطأ أثناء التسليم للمراجعة' : 'حدث خطأ أثناء التسليم',
    )
  } finally {
    submitting.value = false
  }
}
</script>
