<template>
  <div
    class="executive-task-card group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer select-none overflow-hidden"
    @click="$emit('open', task)"
  >
    <div
      class="absolute top-0 inset-x-0 h-[2.5px] transition-all duration-300 opacity-90 group-hover:opacity-100"
      :class="statusMeta.accentBar"
    ></div>

    <div class="card-ambient-glow" :class="statusMeta.glow"></div>

    <div class="relative z-10 flex-1 flex flex-col">
      <!-- شريط الرأس -->
      <div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/60">
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60">
            #{{ task.id }}
          </span>

          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all"
            :class="statusMeta.badge"
          >
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="statusMeta.dot"></span>
            <span>{{ statusMeta.text }}</span>
          </span>

          <span
            v-if="task.is_urgent"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"
            title="مهمة عاجلة ذات أولوية قصوى"
          >
            🔥 عاجلة
          </span>
        </div>

        <div
          v-if="canModify"
          class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
          @click.stop
        >
          <button
            type="button"
            :disabled="task.status === 'completed'"
            :class="[
              'w-7 h-7 rounded-lg border flex items-center justify-center transition-all',
              task.status === 'completed'
                ? 'opacity-30 cursor-not-allowed bg-slate-800/40 border-slate-700/40 text-slate-500'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border-slate-700/60 shadow-xs cursor-pointer',
            ]"
            :title="task.status === 'completed' ? 'لا يمكن تشفيت مهمة مكتملة' : 'تشفيت ساعات المهمة'"
            @click.stop="task.status !== 'completed' && $emit('shift', task)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            v-permission="'quick_tasks.edit'"
            type="button"
            class="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="تعديل المهمة"
            @click.stop="$emit('edit', task)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            v-permission="'archive.manage'"
            type="button"
            class="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/35 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="نقل المهمة إلى الأرشيف"
            @click.stop="$emit('archive', task)"
          >
            🗄️
          </button>

          <button
            v-permission="'quick_tasks.delete'"
            type="button"
            class="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="حذف المهمة"
            @click.stop="$emit('delete', task)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- العنوان والوصف -->
      <div class="mb-3">
        <h4
          class="text-[15px] sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2"
          :title="task.title"
        >
          {{ task.title || 'توجيه سريع' }}
        </h4>

        <p
          v-if="task.description"
          class="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1.5 font-normal"
          :title="task.description"
        >
          {{ task.description }}
        </p>
      </div>

      <!-- مشغل الصوت -->
      <div v-if="task.voice_record_url" class="my-2" @click.stop>
        <AudioVoicePlayer :src="task.voice_record_url" variant="card" theme="teal" class="task-card-player" />
      </div>

      <!-- شارات البيانات -->
      <div class="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
        <span
          v-if="task.deadline"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors shrink-0"
          :class="getCountdownBadgeStyle(task.deadline, currentTime)"
          :title="`الموعد النهائي: ${task.deadline}`"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ getCountdown(task.deadline, currentTime).text }}</span>
        </span>

        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] font-medium shrink-0"
          :title="`الساعات المقدرة: ${task.estimated_hours || 1} ساعة`"
        >
          <svg class="w-3 h-3 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ task.estimated_hours || 1 }} س</span>
        </span>

        <button
          v-if="(task.is_displaced || task.is_partially_shifted) && task.status !== 'completed'"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
          :title="(task.displaced_reason || 'ساعات مُرحّلة ليوم آخر') + ' — اضغط للعرض والاسترجاع في خطة اليوم'"
          @click.stop="
            $router.push({
              path: '/today-board',
              query: {
                ...(task.assigned_to ? { user_id: task.assigned_to } : {}),
                ...(task.shifted_to_dates?.[0]?.date ? { date: task.shifted_to_dates[0].date } : {}),
              },
            })
          "
        >
          <span>⏱️ مرحّل {{ task.shifted_hours_to_future ? `${task.shifted_hours_to_future}س` : '' }} ↗</span>
        </button>

        <span
          v-if="task.task_cost"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0"
          :title="`أتعاب المهمة: ${Number(task.task_cost).toLocaleString()} ج.م`"
        >
          <svg class="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ Number(task.task_cost).toLocaleString() }} ج.م</span>
        </span>

        <a
          v-if="task.attachment_url"
          :href="task.attachment_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-500/20 text-[11px] font-medium transition-colors max-w-[130px] shrink-0"
          :title="`مرفق: ${task.attachment_name || 'ملف مرفق'}`"
          @click.stop
        >
          <svg class="w-3 h-3 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span class="truncate">{{ task.attachment_name || 'مرفق' }}</span>
        </a>

        <span
          v-if="task.feedback_logs && task.feedback_logs.length > 0"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-medium shrink-0"
          :title="`${task.feedback_logs.length} ملاحظات وردود`"
        >
          <svg class="w-3 h-3 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{{ task.feedback_logs.length }}</span>
        </span>
      </div>
    </div>

    <!-- الفوتر -->
    <div class="relative z-10 mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0" :title="`المكلف: ${task.assignee_name || 'غير محدد'}`">
        <UserAvatar :name="task.assignee_name || 'م'" :size="28" class="shrink-0" />
        <div class="flex flex-col min-w-0">
          <span class="text-[10px] text-slate-400 font-medium leading-tight">المكلف</span>
          <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors leading-tight">
            {{ task.assignee_name || 'غير محدد' }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0">
        <span>التفاصيل</span>
        <svg class="w-3.5 h-3.5 rtl:rotate-180 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { getCountdown, getCountdownBadgeStyle, getStatusColor } from '../utils/quickTaskHelpers'

const props = defineProps({
  task: { type: Object, required: true },
  canModify: { type: Boolean, default: false },
  currentTime: { type: Number, required: true },
})

defineEmits(['open', 'shift', 'edit', 'archive', 'delete'])

const statusMeta = computed(() => getStatusColor(props.task.status))
</script>
