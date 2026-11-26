<template>
  <div class="chat-action-composer">
    <!-- 1. حالة اكتمال المهمة -->
    <div v-if="task.status === 'completed'" class="composer-status-banner completed">
      <div class="banner-icon completed">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <div>
        <strong class="block text-sm font-bold text-[#7de8dc]">تم اعتماد المهمة واكتمالها بنجاح 🎉</strong>
        <span class="text-xs text-[#8390be]">جميع الردود والملاحظات محفوظة في سجل المتابعة أعلاه.</span>
      </div>
    </div>

    <!-- 2. الموظف المنفذ بانتظار مراجعة الإدارة -->
    <div v-else-if="isAssignee && task.status === 'under_review'" class="composer-status-banner waiting">
      <div class="banner-icon waiting">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div>
        <strong class="block text-sm font-bold text-[#ffc107]">تم تسليم المهمة وهي قيد مراجعة الإدارة حالياً ⏳</strong>
        <span class="text-xs text-[#8390be]">بانتظار قرار المدير بالاعتماد أو طلب تعديل، ستصلك الإشعارات فور المراجعة.</span>
      </div>
    </div>

    <!-- 3 و 4. صندوق التسليم للموظف أو قرار المراجعة للمدير (موحد بدون تكرار) -->
    <div v-else-if="activeMode" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="status-live-dot"
            :class="activeMode === 'submit' ? 'pulse-teal' : 'pulse-amber'"
          ></span>
          <span
            class="text-xs font-bold"
            :class="activeMode === 'submit' ? 'text-[#7de8dc]' : 'text-[#ffc107]'"
          >
            {{
              activeMode === 'submit'
                ? 'صندوق التسليم والمتابعة (الموظف)'
                : 'قرار المراجعة والاعتماد (الإدارة)'
            }}
          </span>
        </div>
        <span class="text-[11px] text-[#8390be]">
          {{
            activeMode === 'submit'
              ? 'أرسل تقريرك للمدير للاعتماد'
              : 'اختر اعتماد المهمة أو طلب تعديلها'
          }}
        </span>
      </div>

      <!-- حقل النص -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-[#f1f4ff] flex items-center gap-1.5">
            <span>{{ activeMode === 'submit' ? 'ملاحظات وروابط الإنجاز' : 'ملاحظات وتوجيهات الإدارة' }}</span>
            <template v-if="activeMode === 'submit'">
              <span class="text-[#ff4757] font-bold text-sm">*</span>
              <span class="text-[10px] text-[#ff4757] bg-[#ff4757]/10 px-1.5 py-0.5 rounded border border-[#ff4757]/20 font-semibold">
                إجباري
              </span>
            </template>
            <span
              v-else
              class="text-[10px] text-[#ffc107] bg-[#ffc107]/10 px-1.5 py-0.5 rounded border border-[#ffc107]/20 font-medium"
            >
              مطلوبة عند الرفض والتعديل
            </span>
          </label>
          <span class="text-[11px] text-[#7de8dc] flex items-center gap-1 font-medium">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>الروابط قابلة للنقر تلقائياً</span>
          </span>
        </div>
        <textarea
          v-model="messageText"
          rows="3"
          :placeholder="
            activeMode === 'submit'
              ? 'اكتب شرح ما تم إنجازه، مع إضافة الروابط (Drive، Figma، موقع المعاينة...) (مطلوب)...'
              : 'اكتب ملاحظاتك وتوجيهاتك للموظف، روابط المعاينة، أو أسباب طلب التعديل...'
          "
          class="composer-textarea"
          :class="{ 'has-error': submitError && !messageText.trim() }"
        ></textarea>
      </div>

      <!-- مشغل وتسجيل الصوت والمرفقات الموحد -->
      <div class="recording-dock space-y-2.5">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-if="!isRecording && !feedbackAudioUrl"
            type="button"
            class="btn-composer-mic"
            @click="startRecording"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-[#ff4757]">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            <span>{{ activeMode === 'submit' ? 'تسجيل صوتي بالمايك' : 'تسجيل توجيه صوتي بالمايك' }}</span>
          </button>

          <button
            v-if="!attachedFile"
            type="button"
            class="btn-composer-upload"
            title="إرفاق ملف (مستند، صورة، ملف مضغوط، صوت، فيديو... حتى 25 ميجابايت)"
            @click="triggerFileInput"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            <span>إرفاق ملف من الجهاز</span>
          </button>

          <input
            ref="feedbackFileInput"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.mp3,.wav,.ogg,.m4a,.webm,.mp4,.mov,.zip,.rar,.7z,.psd,.ai,.fig"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>

        <div v-if="isRecording" class="recording-live-bar">
          <div class="flex items-center gap-2.5">
            <span class="recording-ping-dot"></span>
            <span class="text-xs font-bold text-[#ff6b7b]">جاري التسجيل...</span>
            <span class="rec-timer-badge">{{ formattedDuration }}</span>

            <div class="sound-wave-meter" :title="`مستوى الصوت: ${audioLevel}%`">
              <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.22)}px` }"></span>
              <span class="wave-bar" :style="{ height: `${Math.max(6, audioLevel * 0.28)}px` }"></span>
              <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.18)}px` }"></span>
            </div>

            <span v-if="isSilentMic" class="mic-silent-pill">⚠️ المايك لا يلتقط صوتاً</span>
          </div>

          <button type="button" class="btn-rec-stop" @click="stopRecording">
            <span>إيقاف وحفظ</span>
          </button>
        </div>

        <div v-if="feedbackAudioUrl && !isRecording" class="recording-preview-card">
          <div class="flex items-center justify-between text-xs text-[#7de8dc] font-bold mb-1.5">
            <div class="flex items-center gap-1.5">
              <span class="file-preview-pill">{{ activeMode === 'submit' ? 'تسجيل صوتي' : 'توجيه صوتي' }}</span>
              <span>تسجيل صوتي جاهز ✓</span>
            </div>
            <button type="button" class="text-[#ff6b7b] hover:underline font-bold text-xs cursor-pointer shrink-0" @click="clearVoiceRecording">
              حذف التسجيل
            </button>
          </div>
          <AudioVoicePlayer :src="feedbackAudioUrl" variant="bubble" theme="teal" />
        </div>

        <div v-if="attachedFile" class="recording-preview-card">
          <div class="flex items-center justify-between text-xs text-[#7de8dc] font-bold mb-1.5">
            <div class="flex items-center gap-1.5 truncate">
              <span class="file-preview-pill">{{ getFileBadgeLabel(attachedFileType) }}</span>
              <span class="truncate max-w-[220px]">{{ attachedFileName }}</span>
              <span class="text-[10px] text-[#8390be]">({{ attachedFileSize }})</span>
            </div>
            <button type="button" class="text-[#ff6b7b] hover:underline font-bold text-xs cursor-pointer shrink-0" @click="clearAttachedFile">
              حذف الملف
            </button>
          </div>

          <div v-if="attachedFileType === 'image' && attachedFilePreviewUrl" class="file-preview-img-box">
            <img :src="attachedFilePreviewUrl" alt="معاينة الملف" class="max-h-32 rounded-lg border border-[#7de8dc]/30 object-contain mx-auto" />
          </div>
          <AudioVoicePlayer v-else-if="attachedFileType === 'audio' && attachedFilePreviewUrl" :src="attachedFilePreviewUrl" variant="bubble" theme="teal" />
          <div v-else class="file-preview-generic-box">
            <div class="flex items-center gap-2.5 p-2 bg-[#0a102f]/80 rounded-lg border border-[#8999e2]/20">
              <div class="file-type-icon-box" :class="attachedFileType">
                <span class="text-xs uppercase font-extrabold">{{ getFileExt(attachedFileName) }}</span>
              </div>
              <div class="flex-1 min-w-0 text-right">
                <strong class="text-xs text-[#f1f4ff] truncate block">{{ attachedFileName }}</strong>
                <small class="text-[10px] text-[#8390be]">
                  {{ attachedFileSize }} • {{ activeMode === 'submit' ? 'جاهز للتسليم' : 'جاهز للإرسال' }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="submitError" class="text-xs text-[#ff6b7b] font-bold mt-1">{{ submitError }}</p>

      <!-- زر تسليم المهمة (للموظف) -->
      <button
        v-if="activeMode === 'submit'"
        type="button"
        :disabled="isSubmitting"
        class="btn-submit-action"
        @click="submitTaskAction"
      >
        <span v-if="isSubmitting" class="spinner-sm dark"></span>
        <template v-else>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>تسليم للمراجعة 🚀</span>
        </template>
      </button>

      <!-- زرا قرار المراجعة (للمدير) -->
      <div v-else class="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          :disabled="isSubmitting"
          class="btn-decision-approve"
          @click="reviewTaskAction('completed')"
        >
          <span v-if="isSubmitting" class="spinner-sm dark"></span>
          <template v-else>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>اعتماد ✅</span>
          </template>
        </button>

        <button
          type="button"
          :disabled="isSubmitting"
          class="btn-decision-reject"
          @click="reviewTaskAction('rejected')"
        >
          <span v-if="isSubmitting" class="spinner-sm dark"></span>
          <template v-else>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>رفض للتعديل ❌</span>
          </template>
        </button>
      </div>
    </div>

    <!-- 5. الإدارة بانتظار تسليم الموظف -->
    <div v-else-if="canReview" class="composer-status-banner waiting">
      <div class="banner-icon waiting">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div>
        <strong class="block text-sm font-bold text-[#7de8dc]">المهمة قيد التنفيذ لدى المُكلَّف ⏳</strong>
        <span class="text-xs text-[#8390be]">بانتظار تسليم الموظف ({{ task.assignee_name || 'المُكلَّف' }}) للإنجاز والمراجعة.</span>
      </div>
    </div>

    <!-- 6. حالة المشاهدين -->
    <div v-else class="composer-status-banner waiting">
      <div class="banner-icon waiting">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div>
        <strong class="block text-sm font-bold text-[#7de8dc]">حالة المهمة: {{ getStatusText(task.status) }}</strong>
        <span class="text-xs text-[#8390be]">سجل المتابعة متاح للمشاهدة فقط.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/axios'
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue'
import { useVoiceAttachmentRecorder } from '../composables/useVoiceAttachmentRecorder'
import { getAudioExtension, getFileBadgeLabel, getFileExt, getStatusText } from '../utils/quickTaskHelpers'

const props = defineProps({
  task: { type: Object, required: true },
  isAssignee: { type: Boolean, default: false },
  canReview: { type: Boolean, default: false },
})

const emit = defineEmits(['submitted', 'reviewed'])

const isSubmitting = ref(false)
const submitError = ref('')
const messageText = ref('')

const {
  isRecording,
  audioBlob,
  feedbackAudioUrl,
  formattedDuration,
  audioLevel,
  isSilentMic,
  attachedFile,
  attachedFileName,
  attachedFileType,
  attachedFileSize,
  attachedFilePreviewUrl,
  feedbackFileInput,
  startRecording,
  stopRecording,
  clearVoiceRecording,
  triggerFileInput,
  handleFileUpload,
  clearAttachedFile,
  clearAll,
} = useVoiceAttachmentRecorder(submitError)

const activeMode = computed(() => {
  if (props.isAssignee && ['pending', 'in_progress', 'rejected'].includes(props.task?.status)) {
    return 'submit'
  }
  if (props.canReview && props.task?.status === 'under_review') {
    return 'review'
  }
  return null
})

watch(messageText, (newVal) => {
  if (newVal?.trim() && submitError.value) submitError.value = ''
})

const buildSubmissionFormData = (extraFields = {}, fallbackVoiceName = 'feedback_voice') => {
  const formData = new FormData()
  for (const [k, v] of Object.entries(extraFields)) {
    formData.append(k, v)
  }
  if (messageText.value?.trim()) {
    formData.append('feedback_text', messageText.value.trim())
  }
  if (audioBlob.value) {
    if (audioBlob.value.name) {
      formData.append('voice_record', audioBlob.value, audioBlob.value.name)
    } else {
      const ext = getAudioExtension(audioBlob.value.type)
      formData.append('voice_record', audioBlob.value, `${fallbackVoiceName}.${ext}`)
    }
  }
  if (attachedFile.value) {
    formData.append('attachment_file', attachedFile.value, attachedFile.value.name)
  }
  return formData
}

const submitTaskAction = async () => {
  if (isSubmitting.value) return
  if (!messageText.value?.trim()) {
    submitError.value = 'يرجى كتابة ملاحظات ما تم إنجازه أو روابط التسليم (الحقل إجباري).'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  try {
    const formData = buildSubmissionFormData({}, 'submission_voice')
    const res = await api.post(`/quick-tasks/${props.task.id}/submit`, formData)
    const mergedTask = { ...props.task, ...(res.data?.data || res.data || {}) }
    messageText.value = ''
    clearAll()
    emit('submitted', mergedTask)
  } catch (err) {
    console.error('Submit task error:', err)
    submitError.value = err.response?.data?.message || 'تعذر تسليم المهمة، يرجى المحاولة مرة أخرى.'
  } finally {
    isSubmitting.value = false
  }
}

const reviewTaskAction = async (decisionStatus) => {
  if (isSubmitting.value) return
  if (
    decisionStatus === 'rejected' &&
    !messageText.value?.trim() &&
    !audioBlob.value &&
    !attachedFile.value
  ) {
    submitError.value = 'يرجى كتابة أسباب طلب التعديل وملاحظاتك للموظف أو تسجيل توجيه صوتي أو إرفاق ملف.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  try {
    const formData = buildSubmissionFormData({ status_changed_to: decisionStatus }, 'review_voice')
    const res = await api.post(`/quick-tasks/${props.task.id}/review`, formData)
    const mergedTask = { ...props.task, ...(res.data?.data || res.data || {}) }
    messageText.value = ''
    clearAll()
    emit('reviewed', { decisionStatus, task: mergedTask })
  } catch (err) {
    console.error('Review task error:', err)
    submitError.value = err.response?.data?.message || 'تعذر حفظ القرار، يرجى المحاولة مرة أخرى.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
