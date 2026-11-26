<template>
  <div class="quick-task-details" dir="rtl">
    <!-- القسم الأيمن: تفاصيل المهمة الأساسية -->
    <div class="main-column">
      <div class="task-details-header">
        <div class="header-topline">
          <span class="eyebrow">مساحة المهام / تفاصيل التوجيه</span>
          <div class="flex items-center gap-2">
            <div v-if="canModify" class="flex items-center gap-1.5 ml-2">
              <button type="button" class="action-header-btn edit" title="تعديل المهمة" @click="$emit('editTask', task)">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>تعديل</span>
              </button>
              <button type="button" class="action-header-btn delete" title="حذف المهمة" @click="$emit('deleteTask', task)">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>حذف</span>
              </button>
            </div>

            <span class="status-badge" :class="task.status">
              <i class="status-dot"></i>
              {{ getStatusText(task.status) }}
            </span>
          </div>
        </div>

        <h2 class="task-title">{{ task.title || 'توجيه سريع بدون عنوان' }}</h2>

        <div class="meta-strip">
          <div class="meta-item">
            <UserAvatar :name="task.creator_name || 'م'" :size="32" class="meta-avatar creator" />
            <div class="meta-info">
              <span class="meta-label">بواسطة</span>
              <strong class="meta-value">{{ task.creator_name || 'غير محدد' }}</strong>
            </div>
          </div>

          <div class="meta-divider"></div>

          <div class="meta-item">
            <UserAvatar :name="task.assignee_name || 'م'" :size="32" class="meta-avatar assignee" />
            <div class="meta-info">
              <span class="meta-label">المُكلَّف بالتنفيذ</span>
              <strong class="meta-value">{{ task.assignee_name || 'غير محدد' }}</strong>
            </div>
          </div>

          <div v-if="task.deadline" class="meta-divider"></div>

          <div v-if="task.deadline" class="meta-item deadline-item">
            <div class="meta-icon deadline">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="meta-info">
              <span class="meta-label">الموعد النهائي</span>
              <strong class="meta-value deadline-val">{{ formatDeadline(task.deadline) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- التفاصيل النصية -->
      <div v-if="task.description" class="section-card text-details-card">
        <div class="section-header">
          <div class="section-icon teal">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h4>التفاصيل والتعليمات</h4>
        </div>
        <p class="task-description-text" v-html="linkifyText(task.description)"></p>
      </div>

      <!-- المرفقات والتوجيه الصوتي الأساسي -->
      <div v-if="task.voice_record_url || task.attachment_url" class="space-y-4">
        <div v-if="task.voice_record_url" class="section-card voice-details-card">
          <div class="section-header">
            <div class="section-icon purple">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <div class="section-header-text">
              <h4>التوجيه الصوتي الأساسي</h4>
              <small>استمع إلى التسجيل الصوتي المرفق من صاحب المهمة</small>
            </div>
          </div>
          <div class="audio-wrap mt-2">
            <AudioVoicePlayer :src="task.voice_record_url" variant="full" theme="purple" />
          </div>
        </div>

        <div v-if="task.attachment_url" class="section-card voice-details-card">
          <div class="section-header">
            <div class="section-icon teal">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </div>
            <div class="section-header-text">
              <h4>المرفق الأساسي للمهمة</h4>
              <small>ملف مرفق مع تعليمات وتفاصيل التكليف</small>
            </div>
          </div>
          <div class="mt-2">
            <QuickTaskAttachmentPreview
              :url="task.attachment_url"
              :type="task.attachment_type"
              :name="task.attachment_name"
              :size="task.attachment_size"
              audio-variant="full"
              audio-theme="teal"
              :compact-overlay="false"
              image-border-class="border border-[#8999e2]/25 max-w-sm"
              img-height-class="max-h-56"
              class="mt-1"
            />
          </div>
        </div>
      </div>

      <!-- بطاقة إرشادية -->
      <div class="info-guide-card">
        <div class="flex items-center gap-3">
          <div class="info-guide-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#f1f4ff] mb-0.5">دردشة التوجيه والمتابعة المباشرة</h5>
            <p class="text-[11px] text-[#8390be] m-0 leading-relaxed">
              يمكنك متابعة كافة التحديثات، والملاحظات، والتسجيلات الصوتية، واتخاذ الإجراءات في شريط المحادثة التفاعلي على اليسار.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- القسم الأيسر: الشريط الزمني التفاعلي وصندوق الإجراءات -->
    <div class="side-column">
      <div class="chat-timeline-wrapper">
        <div class="chat-header">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <div class="chat-header-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="chat-title">سجل المتابعة والمناقشة المباشرة</h3>
                <small class="chat-sub">شريط زمني تفاعلي بين المدير والموظف</small>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="chat-counter-badge">{{ sortedLogs.length + 1 }} رسائل</span>
            </div>
          </div>
        </div>

        <QuickTaskFeedbackTimeline
          ref="timelineRef"
          :task="task"
          :logs="sortedLogs"
          :current-user="resolvedCurrentUser"
        />

        <QuickTaskComposer
          :task="task"
          :is-assignee="isAssignee"
          :can-review="canReview"
          @submitted="handleSubmitted"
          @reviewed="handleReviewed"
        />
      </div>
    </div>

    <WhatsAppNotificationModal
      v-model:is-open="showWaModal"
      :event="waModalEvent"
      :task="waModalTask"
      :users="users"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import WhatsAppNotificationModal from '@/components/WhatsAppNotificationModal.vue'
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { getWhatsAppPayload } from '@/utils/quickTaskWhatsApp'
import { useNotificationTemplates } from '@/composables/useNotificationTemplates'
import QuickTaskAttachmentPreview from '@/modules/quick-tasks/components/QuickTaskAttachmentPreview.vue'
import QuickTaskFeedbackTimeline from '@/modules/quick-tasks/components/QuickTaskFeedbackTimeline.vue'
import QuickTaskComposer from '@/modules/quick-tasks/components/QuickTaskComposer.vue'
import {
  formatDeadline,
  getStatusText,
  linkifyText,
  parseLogTimestamp,
} from '@/modules/quick-tasks/utils/quickTaskHelpers'

const { fetchTemplates: fetchNotificationTemplates } = useNotificationTemplates()
const authStore = useAuthStore()

const props = defineProps({
  task: { type: Object, required: true },
  currentUser: { type: Object, required: true },
  users: { type: Array, default: () => [] },
})

const emit = defineEmits(['taskUpdated', 'editTask', 'deleteTask'])

const timelineRef = ref(null)
const showWaModal = ref(false)
const waModalEvent = ref('submitted')
const waModalTask = ref(null)

const resolvedCurrentUser = computed(() =>
  props.currentUser?.id ? props.currentUser : authStore.user || {},
)

const userRole = computed(() => {
  const role = resolvedCurrentUser.value?.role || authStore.role
  const roleStr = typeof role === 'object' && role?.value ? role.value : String(role || '')
  return roleStr.toLowerCase()
})

const isManagerUser = computed(() => userRole.value === 'manager' || userRole.value === 'admin')
const isEmployeeUser = computed(() => !isManagerUser.value)

const isAssignee = computed(() => {
  if (isEmployeeUser.value) return true

  const currentUserId = Number(resolvedCurrentUser.value?.id)
  const taskAssigneeId = Number(
    props.task?.assigned_to || props.task?.assignee_id || props.task?.assignee?.id,
  )
  if (currentUserId && taskAssigneeId && currentUserId === taskAssigneeId) return true

  const myName = (resolvedCurrentUser.value?.name || '').trim().toLowerCase()
  const assigneeName = (
    props.task?.assignee_name ||
    props.task?.assignee?.name ||
    ''
  )
    .trim()
    .toLowerCase()
  return Boolean(myName && assigneeName && myName === assigneeName)
})

const canModify = computed(() => !isEmployeeUser.value && !isAssignee.value && isManagerUser.value)
const canReview = computed(() => !isEmployeeUser.value && !isAssignee.value && isManagerUser.value)

const sortedLogs = computed(() => {
  const list = props.task?.feedback_logs || props.task?.feedbackLogs || props.task?.logs
  if (!Array.isArray(list)) return []

  return [...list].sort((a, b) => {
    const tA = parseLogTimestamp(a.created_at || a.created_date || a.timestamp)
    const tB = parseLogTimestamp(b.created_at || b.created_date || b.timestamp)
    if (tA !== null && tB !== null && tA !== tB) return tA - tB

    const idA = Number(a.id)
    const idB = Number(b.id)
    if (!isNaN(idA) && !isNaN(idB) && idA !== idB) return idA - idB
    return 0
  })
})

const triggerWhatsApp = (event, task) => {
  if (!task) return
  const p = getWhatsAppPayload(event, task)
  if (p?.disabled) return
  waModalTask.value = task
  waModalEvent.value = event
  showWaModal.value = true
}

const handleSubmitted = (mergedTask) => {
  emit('taskUpdated', mergedTask)
  timelineRef.value?.scrollToBottom(true)
  triggerWhatsApp('submitted', mergedTask)
}

const handleReviewed = ({ decisionStatus, task: mergedTask }) => {
  emit('taskUpdated', mergedTask)
  timelineRef.value?.scrollToBottom(true)
  triggerWhatsApp(decisionStatus === 'completed' ? 'approved' : 'rejected', mergedTask)
}

onMounted(() => {
  fetchNotificationTemplates(true)
})
</script>

<style src="@/modules/quick-tasks/styles/quick-task-details.css"></style>
