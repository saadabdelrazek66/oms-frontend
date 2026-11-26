<template>
  <Teleport to="body">
    <div v-if="rejectPost" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-reject')">
        <div class="modal-content" style="width: min(400px, 100%)">
          <h3 style="color: #cc0000">رفض المنشور ({{ reviewTitle }}) ❌</h3>
          <p>يرجى توضيح سبب الرفض أو التعديلات المطلوبة للمنفذ.</p>
          <form @submit.prevent="submitReject">
            <div class="form-group">
              <label>سبب الرفض والتعديلات المطلوبة</label>
              <textarea
                v-model="rejectReason"
                rows="4"
                required
                placeholder="مثال: يرجى تعديل الألوان لتناسب الهوية..."
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="$emit('close-reject')">إلغاء</button>
              <button type="submit" class="primary-btn reject-submit-btn" :disabled="submittingReject">
                إرسال الرفض
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="historyArray" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-history')">
        <div class="modal-content" style="width: min(500px, 100%)">
          <h3>📜 سجل الرفض والتعديلات ({{ historyTitle }})</h3>
          <div class="history-list">
            <div v-for="(record, idx) in historyArray" :key="idx" class="history-item">
              <div class="history-meta">
                <strong>بواسطة: {{ record.reviewer_name }}</strong>
                <span dir="ltr">{{ new Date(record.date).toLocaleString('ar-EG') }}</span>
              </div>
              <p class="history-reason">{{ record.reason }}</p>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="$emit('close-history')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showWa && waPayload" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-wa')">
        <div class="modal-content wa-card" style="max-width: 450px; border-radius: 16px; overflow: hidden; padding: 0">
          <div style="background: #25d366; color: white; padding: 20px; text-align: center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" style="margin-bottom: 10px">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z" />
            </svg>
            <h3 style="margin: 0; font-size: 20px">إرسال إشعار واتساب</h3>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9">تم إعداد الرسالة تلقائياً. راجعها قبل الإرسال.</p>
          </div>

          <div style="padding: 20px">
            <div class="form-group">
              <textarea
                v-model="editableWaMessage"
                rows="5"
                dir="auto"
                style="border: 1px solid #ddd; border-radius: 8px; font-size: 14px; padding: 12px; width: 100%; box-sizing: border-box; background: #f9f9f9; resize: vertical"
              ></textarea>
            </div>

            <div class="mt-4">
              <label style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 8px; display: block">
                الخيارات المتاحة (اضغط للإرسال):
              </label>
              <div style="display: flex; flex-direction: column; gap: 10px">
                <button
                  v-for="(rec, idx) in waPayload.recipients"
                  :key="idx"
                  class="wa-btn primary"
                  @click="sendWhatsApp(rec.phone, editableWaMessage)"
                >
                  <span style="font-size: 16px">💬</span> إرسال لـ {{ rec.name }} ({{ rec.role }})
                </button>

                <button
                  v-if="waPayload.manager_phone && !isManager"
                  class="wa-btn secondary"
                  @click="sendWhatsApp(waPayload.manager_phone, `*نسخة للمدير للعلم:*\n\n${editableWaMessage}`)"
                >
                  <span style="font-size: 16px">📋</span> إرسال نسخة للمدير
                </button>
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 25px; display: flex; justify-content: center">
              <button
                type="button"
                class="secondary-btn"
                style="width: 100%; padding: 10px; border-radius: 8px"
                @click="$emit('close-wa')"
              >
                إغلاق / تجاهل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  rejectPost: { type: Object, default: null },
  reviewType: { type: String, default: '' },
  reviewTitle: { type: String, default: '' },
  historyArray: { type: Array, default: null },
  historyTitle: { type: String, default: '' },
  showWa: { type: Boolean, default: false },
  waPayload: { type: Object, default: null },
  isManager: { type: Boolean, default: false },
  formatWaPhone: { type: Function, required: true },
})

const emit = defineEmits(['close-reject', 'close-history', 'close-wa', 'wa-payload'])

const rejectReason = ref('')
const submittingReject = ref(false)
const editableWaMessage = ref('')

watch(
  () => props.rejectPost,
  (val) => {
    if (val) rejectReason.value = ''
  },
)

watch(
  () => props.waPayload,
  (val) => {
    editableWaMessage.value = val?.message || ''
  },
  { immediate: true },
)

const submitReject = async () => {
  if (!rejectReason.value || !props.rejectPost) return
  submittingReject.value = true
  try {
    const res = await api.post(`/plan-posts/${props.rejectPost.id}/review`, {
      review_type: props.reviewType,
      status: 'مرفوض',
      reason: rejectReason.value,
    })

    props.rejectPost.review_status = res.data.data.review_status
    props.rejectPost.manager_review_status = res.data.data.manager_review_status
    if (props.reviewType === 'manager') {
      props.rejectPost.manager_rejection_history = res.data.data.manager_rejection_history
    } else {
      props.rejectPost.rejection_history = res.data.data.rejection_history
    }

    alertService.smartToast('تم إرسال الرفض 🔴')
    emit('close-reject')
    if (res.data?.whatsapp_payload) emit('wa-payload', res.data.whatsapp_payload)
  } catch (error) {
    alertService.smartToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ')
  } finally {
    submittingReject.value = false
  }
}

const sendWhatsApp = (phone, customMessage) => {
  if (!phone) {
    alertService.smartToast('رقم الهاتف غير متوفر')
    return
  }
  const text = encodeURIComponent(customMessage || editableWaMessage.value)
  const cleanPhone = props.formatWaPhone(phone)
  window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank')
}
</script>
