<template>
  <div ref="chatContainerRef" class="chat-thread-container custom-scrollbar">
    <!-- رسالة البداية: إنشاء التكليف -->
    <div
      class="chat-bubble-row"
      :class="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name }) ? 'chat-me' : 'chat-other'"
    >
      <UserAvatar
        :name="task.creator_name || 'م'"
        :size="32"
        class="chat-bubble-avatar"
        :class="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name }) ? 'me' : 'other'"
      />

      <div class="chat-bubble-card">
        <div class="chat-bubble-top">
          <div class="flex items-center gap-2 flex-wrap">
            <strong class="chat-sender-name">{{ task.creator_name || 'صاحب التوجيه' }}</strong>
            <span
              v-if="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name })"
              class="chat-self-badge"
            >
              أنت
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#8999e2]/15 text-[#a8b5f0] border border-[#8999e2]/25">
              إنشاء التوجيه والتكليف 🎯
            </span>
          </div>
          <span class="chat-bubble-time" dir="auto">{{ formatTaskCreatedTime(task) }}</span>
        </div>

        <div v-if="task.description" class="chat-bubble-content" v-html="linkifyText(task.description)"></div>

        <div v-if="task.voice_record_url" class="chat-bubble-audio-box">
          <div class="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#b28aff]">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            </svg>
            <span>التوجيه الصوتي الأصلي</span>
          </div>
          <AudioVoicePlayer :src="task.voice_record_url" variant="bubble" theme="purple" />
        </div>

        <div v-if="task.attachment_url" class="chat-bubble-audio-box mt-2">
          <div class="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#b28aff]">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            <span>الملف المرفق مع المهمة</span>
          </div>
          <QuickTaskAttachmentPreview
            :url="task.attachment_url"
            :type="task.attachment_type"
            :name="task.attachment_name"
            :size="task.attachment_size"
            audio-theme="purple"
          />
        </div>
      </div>
    </div>

    <!-- قائمة الردود والمتابعات -->
    <div
      v-for="log in logs"
      :key="log.id"
      class="chat-bubble-row"
      :class="isMyMessage(log) ? 'chat-me' : 'chat-other'"
    >
      <UserAvatar
        :name="log.reviewer_name || 'م'"
        :size="32"
        class="chat-bubble-avatar"
        :class="isMyMessage(log) ? 'me' : 'other'"
      />

      <div class="chat-bubble-card">
        <div class="chat-bubble-top">
          <div class="flex items-center gap-2 flex-wrap">
            <strong class="chat-sender-name">{{ log.reviewer_name || 'مستخدم' }}</strong>
            <span v-if="isMyMessage(log)" class="chat-self-badge">أنت</span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold"
              :class="getStatusBadgeInfo(log.status_changed_to).badgeClass"
            >
              {{ getStatusBadgeInfo(log.status_changed_to).label }}
            </span>
          </div>
          <span class="chat-bubble-time" dir="auto">{{ formatLogTime(log) }}</span>
        </div>

        <div v-if="log.feedback_text" class="chat-bubble-content" v-html="linkifyText(log.feedback_text)"></div>

        <div v-if="log.voice_record_url" class="chat-bubble-audio-box">
          <div
            class="flex items-center gap-1.5 mb-2 text-xs font-bold"
            :class="isMyMessage(log) ? 'text-[#7de8dc]' : 'text-[#b28aff]'"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            </svg>
            <span>تسجيل صوتي مرفق</span>
          </div>
          <AudioVoicePlayer
            :src="log.voice_record_url"
            variant="bubble"
            :theme="isMyMessage(log) ? 'teal' : 'purple'"
          />
        </div>

        <div v-if="log.attachment_url" class="chat-bubble-audio-box mt-2">
          <div
            class="flex items-center gap-1.5 mb-2 text-xs font-bold"
            :class="isMyMessage(log) ? 'text-[#7de8dc]' : 'text-[#b28aff]'"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            <span>ملف مرفق مع المتابعة</span>
          </div>
          <QuickTaskAttachmentPreview
            :url="log.attachment_url"
            :type="log.attachment_type"
            :name="log.attachment_name"
            :size="log.attachment_size"
            alt="مرفق المتابعة"
            :audio-theme="isMyMessage(log) ? 'teal' : 'purple'"
            image-border-class="border border-white/10"
            :subtitle-color-class="isMyMessage(log) ? 'text-[#7de8dc]' : 'text-[#b28aff]'"
            icon-color-class="text-current"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import QuickTaskAttachmentPreview from './QuickTaskAttachmentPreview.vue'
import {
  formatLogTime,
  formatTaskCreatedTime,
  getStatusBadgeInfo,
  linkifyText,
} from '../utils/quickTaskHelpers'

const props = defineProps({
  task: { type: Object, required: true },
  logs: { type: Array, default: () => [] },
  currentUser: { type: Object, default: () => ({}) },
})

const chatContainerRef = ref(null)

const isMyMessage = (log) => {
  if (!log) return false
  const myId = Number(props.currentUser?.id)
  const logReviewerId = Number(log.reviewer_id)
  if (myId && logReviewerId) return myId === logReviewerId
  if (log.reviewer_name && props.currentUser?.name) {
    return log.reviewer_name.trim().toLowerCase() === props.currentUser.name.trim().toLowerCase()
  }
  return false
}

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTo({
        top: chatContainerRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  })
}

onMounted(() => scrollToBottom(false))

watch(
  () => props.logs,
  () => scrollToBottom(true),
  { deep: true },
)

defineExpose({ scrollToBottom })
</script>
