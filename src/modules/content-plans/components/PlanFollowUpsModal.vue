<template>
  <Teleport to="body">
    <div v-if="modelValue && plan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content followups-modal" role="dialog" style="width: min(650px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('update:modelValue', false)">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #8fc9ff, #65b5ff); color: #12183f">
            💬
          </div>
          <span class="eyebrow" style="color: #65b5ff">سجل المتابعة</span>
          <h3>متابعة العميل: {{ plan?.client?.name }}</h3>

          <form
            class="plan-form mt-2"
            style="background: rgba(6, 11, 37, 0.3); padding: 15px; border-radius: 12px; border: 1px solid rgba(145, 160, 230, 0.1)"
            @submit.prevent="saveFollowUp"
          >
            <div class="form-group mb-2">
              <label>{{ editingFollowUpId ? 'تعديل التحديث' : 'إضافة تحديث جديد' }}</label>
              <textarea v-model="followUpForm.content" rows="3" required></textarea>
            </div>

            <div class="form-group mb-0 flex-upload-group">
              <label class="upload-btn">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  hidden
                  @change="handleImageUpload"
                />
                <span>📷 إرفاق صورة (اختياري)</span>
              </label>

              <div v-if="imagePreview" class="image-preview-wrapper">
                <img :src="imagePreview" alt="preview" class="image-preview" />
                <button type="button" class="remove-image-btn" title="إلغاء الصورة" @click="clearImage">🗑️</button>
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 15px">
              <button v-if="editingFollowUpId" type="button" class="secondary-btn" @click="cancelEdit">
                إلغاء التعديل
              </button>
              <button
                type="submit"
                class="primary-btn"
                style="background: linear-gradient(110deg, #8fc9ff, #65b5ff)"
                :disabled="saving"
              >
                {{ saving ? 'جارٍ...' : editingFollowUpId ? 'حفظ التعديل' : 'إضافة التحديث' }}
              </button>
            </div>
          </form>

          <hr class="separator" />
          <div class="history-timeline">
            <div v-if="followUps.length === 0" class="muted text-center">لا توجد متابعات مسجلة حتى الآن.</div>
            <div v-for="followUp in followUps" :key="followUp.id" class="timeline-item">
              <div class="tl-dot" style="background: #65b5ff"></div>
              <div class="tl-content fu-content">
                <div class="tl-header">
                  <strong>{{ followUp.user?.name || 'مجهول' }}</strong>
                  <span class="tl-date" dir="ltr">{{ formatDate(followUp.created_at) }}</span>
                </div>
                <div class="fu-text">{{ followUp.content }}</div>

                <div
                  v-if="followUp.image_path || followUp.image_url"
                  class="fu-image-container"
                  @click="$emit('view-image', getFollowUpImageUrl(followUp))"
                >
                  <img :src="getFollowUpImageUrl(followUp)" alt="مرفق" class="fu-thumbnail" />
                  <div class="zoom-overlay"><span>🔍</span></div>
                </div>

                <div v-if="isManager" class="fu-actions">
                  <button type="button" class="fu-btn edit-fu" @click="editFollowUp(followUp)">✎ تعديل</button>
                  <button type="button" class="fu-btn delete-fu" @click="deleteFollowUp(followUp.id)">🗑️ حذف</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import alertService from '@/services/alertService'
import { contentPlansApi } from '../api/contentPlansApi'
import { formatDate, getFollowUpImageUrl, getFollowUps } from '../utils/planHelpers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  isManager: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'updated', 'view-image'])

const saving = ref(false)
const editingFollowUpId = ref(null)
const fileInput = ref(null)
const imagePreview = ref(null)
const followUpForm = reactive({ content: '', image: null })

const followUps = computed(() => getFollowUps(props.plan))

const clearImage = () => {
  followUpForm.image = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const cancelEdit = () => {
  editingFollowUpId.value = null
  followUpForm.content = ''
  clearImage()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) cancelEdit()
  },
)

const handleImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alertService.smartToast('حجم الصورة يجب أن لا يتعدى 5 ميجابايت')
    return
  }
  followUpForm.image = file
  imagePreview.value = URL.createObjectURL(file)
}

const editFollowUp = (item) => {
  editingFollowUpId.value = item.id
  followUpForm.content = item.content
  followUpForm.image = null
  imagePreview.value = getFollowUpImageUrl(item) || null
}

const saveFollowUp = async () => {
  if (!followUpForm.content.trim() || !props.plan) return
  saving.value = true
  const formData = new FormData()
  formData.append('content', followUpForm.content)
  if (followUpForm.image) formData.append('image', followUpForm.image)

  try {
    if (editingFollowUpId.value) {
      formData.append('_method', 'PUT')
      await contentPlansApi.updateFollowUp(editingFollowUpId.value, formData)
      alertService.smartToast('تم التعديل')
    } else {
      await contentPlansApi.addFollowUp(props.plan.id, formData)
      alertService.smartToast('تمت الإضافة')
    }
    cancelEdit()
    emit('updated', props.plan.id)
  } catch (error) {
    alertService.smartToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ')
  } finally {
    saving.value = false
  }
}

const deleteFollowUp = async (id) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف المتابعة',
    message: 'هل أنت متأكد من رغبتك في حذف هذا التحديث من سجل المتابعة نهائياً؟',
    confirmText: 'نعم، احذف 🗑️',
    cancelText: 'إلغاء',
    type: 'danger',
  })
  if (!confirmed) return
  try {
    await contentPlansApi.deleteFollowUp(id)
    alertService.smartToast('تم حذف المتابعة بنجاح')
    emit('updated', props.plan?.id)
  } catch (error) {
    alertService.smartToast(error.response?.data?.message || 'حدث خطأ أثناء حذف المتابعة')
  }
}
</script>
