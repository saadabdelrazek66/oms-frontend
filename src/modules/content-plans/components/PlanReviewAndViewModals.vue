<template>
  <!-- 1. نافذة رفض الخطة وطلب تعديل -->
  <Teleport to="body">
    <div v-if="showReject" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-reject')">
        <div class="modal-content reject-modal" role="dialog" style="width: min(500px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-reject')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b)">❌</div>
          <span class="eyebrow" style="color: #ff9bad">إجراء مراجعة</span>
          <h3 style="color: #ff9bad">رفض الخطة وطلب تعديل</h3>
          <form class="plan-form" @submit.prevent="submitReject">
            <div class="form-group">
              <label>ملاحظات الرفض (إجبارية)</label>
              <textarea v-model="rejectNotes" rows="5" required></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="$emit('close-reject')">إلغاء</button>
              <button
                type="submit"
                class="primary-btn"
                style="background: linear-gradient(110deg, #ff8fa4, #ff678b)"
                :disabled="rejecting"
              >
                {{ rejecting ? 'جارٍ الرفض...' : 'تأكيد الرفض' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 2. سجل أسباب الرفض -->
  <Teleport to="body">
    <div v-if="showRejections" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-rejections')">
        <div class="modal-content history-modal" style="width: min(500px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-rejections')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b)">❌</div>
          <h3>سجل أسباب الرفض</h3>
          <div class="history-timeline">
            <div v-for="(rejection, index) in rejections" :key="index" class="timeline-item">
              <div class="tl-dot tl-red"></div>
              <div class="tl-content">
                <div class="tl-header">
                  <strong>المراجع: {{ rejection.reviewer?.name || 'مجهول' }}</strong>
                  <span class="tl-date" dir="ltr">{{ formatDate(rejection.created_at) }}</span>
                </div>
                <div class="tl-action text-red">الرفض رقم {{ rejections.length - index }}</div>
                <div class="tl-notes">{{ rejection.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 3. السجل الكامل للحركات -->
  <Teleport to="body">
    <div v-if="historyPlan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-history')">
        <div class="modal-content history-modal" style="width: min(520px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-history')">×</button>
          <div class="modal-icon">📋</div>
          <h3>السجل الكامل للحركات</h3>
          <div class="history-timeline">
            <div v-for="(history, index) in getReviewHistories(historyPlan)" :key="index" class="timeline-item">
              <div
                class="tl-dot"
                :class="history.action === 'approved' ? 'tl-green' : history.action === 'submitted' ? 'tl-blue' : 'tl-red'"
              ></div>
              <div class="tl-content">
                <div class="tl-header">
                  <strong>
                    <template v-if="history.action === 'submitted'">
                      🚀 المنفذ: {{ history.reviewer?.name || history.user?.name || 'الموظف' }}
                    </template>
                    <template v-else>
                      🔍 المراجع: {{ history.reviewer?.name || history.user?.name || 'مجهول' }}
                    </template>
                  </strong>
                  <span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span>
                </div>
                <div
                  class="tl-action"
                  :class="history.action === 'approved' ? 'text-green' : history.action === 'submitted' ? 'text-blue' : 'text-red'"
                >
                  <template v-if="history.action === 'submitted'">
                    🚀 قام {{ history.reviewer?.name || history.user?.name || 'الموظف' }} بتسليم الخطة للمراجعة
                  </template>
                  <template v-else-if="history.action === 'approved'">✅ وافق على الخطة واعتمدها</template>
                  <template v-else>❌ رفض الخطة وطلب تعديلات</template>
                </div>
                <div v-if="history.notes" class="tl-notes">{{ history.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 4. نافذة المراجع المساعدة -->
  <Teleport to="body">
    <div v-if="referencesPlan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-references')">
        <div class="modal-content references-modal" role="dialog" style="width: min(450px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-references')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #76e8de, #4facfe); color: #12183f">
            🔗
          </div>
          <span class="eyebrow" style="color: #4facfe">مراجع العمل</span>
          <h3>الروابط المساعدة للإنجاز</h3>
          <p>الروابط المرفقة كمرجع ومصدر لإعداد هذه الخطة.</p>
          <div class="ref-links-list mt-3">
            <a
              v-for="(link, index) in referencesPlan.reference_links"
              :key="index"
              :href="link"
              target="_blank"
              rel="noopener noreferrer"
              class="ref-link-item"
            >
              <span class="link-number">{{ index + 1 }}</span>
              <span class="link-url">{{ link }}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
          <div class="modal-actions" style="justify-content: center; margin-top: 20px">
            <button type="button" class="secondary-btn" @click="$emit('close-references')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 5. Image Preview Lightbox -->
  <Teleport to="body">
    <div v-if="viewerImageUrl" class="plans-modal-root">
      <div
        class="image-viewer-overlay"
        role="dialog"
        aria-modal="true"
        style="position: fixed !important; inset: 0 !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(3, 6, 23, 0.94) !important; backdrop-filter: blur(14px) !important"
        @click.self="$emit('close-viewer')"
      >
        <button
          class="viewer-close"
          type="button"
          aria-label="إغلاق معاينة الصورة"
          style="position: absolute !important; top: 24px !important; right: 28px !important; z-index: 1000000 !important"
          @click="$emit('close-viewer')"
        >
          ×
        </button>
        <img
          :src="viewerImageUrl"
          alt="معاينة الصورة"
          class="viewer-image"
          style="max-width: 90vw !important; max-height: 88vh !important; object-fit: contain !important; z-index: 999999 !important; position: relative !important"
          @error="onViewerError"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import alertService from '@/services/alertService'
import { formatDate, getReviewHistories } from '../utils/planHelpers'

const props = defineProps({
  showReject: { type: Boolean, default: false },
  rejecting: { type: Boolean, default: false },
  showRejections: { type: Boolean, default: false },
  rejections: { type: Array, default: () => [] },
  historyPlan: { type: Object, default: null },
  referencesPlan: { type: Object, default: null },
  viewerImageUrl: { type: String, default: '' },
})

const emit = defineEmits([
  'close-reject',
  'submit-reject',
  'close-rejections',
  'close-history',
  'close-references',
  'close-viewer',
])

const rejectNotes = ref('')

watch(
  () => props.showReject,
  (open) => {
    if (open) rejectNotes.value = ''
  },
)

const submitReject = () => {
  emit('submit-reject', rejectNotes.value)
}

const onViewerError = () => {
  alertService.smartToast('تعذر عرض الصورة، يرجى التأكد من مسار الملف')
}
</script>
