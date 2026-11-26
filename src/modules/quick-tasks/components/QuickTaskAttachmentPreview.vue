<template>
  <div v-if="category === 'image'">
    <a
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="block group relative overflow-hidden rounded-xl"
      :class="imageBorderClass"
    >
      <img
        :src="url"
        :alt="alt"
        :class="imgHeightClass"
        class="w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span
        v-if="compactOverlay"
        class="absolute bottom-1 right-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white"
      >
        معاينة الصورة 🔍
      </span>
      <div
        v-else
        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1"
      >
        <span>فتح الصورة بالحجم الكامل 🔍</span>
      </div>
    </a>
  </div>

  <AudioVoicePlayer
    v-else-if="category === 'audio'"
    :src="url"
    :variant="audioVariant"
    :theme="audioTheme"
  />

  <div v-else>
    <a :href="url" target="_blank" download class="generic-file-bubble-link">
      <div class="file-bubble-icon" :class="category">
        <span class="text-xs uppercase font-extrabold">{{ getFileExt(name || url) }}</span>
      </div>
      <div class="flex-1 min-w-0 text-right">
        <strong class="text-xs text-[#f1f4ff] truncate block">{{ name || getFileNameFromUrl(url) }}</strong>
        <small class="text-[10px]" :class="subtitleColorClass">{{ size || 'انقر للتحميل / المعاينة' }}</small>
      </div>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" :class="iconColorClass">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue'
import { getAttachmentCategory, getFileExt, getFileNameFromUrl } from '../utils/quickTaskHelpers'

const props = defineProps({
  url: { type: String, required: true },
  type: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: '' },
  alt: { type: String, default: 'مرفق المهمة' },
  audioVariant: { type: String, default: 'bubble' },
  audioTheme: { type: String, default: 'purple' },
  compactOverlay: { type: Boolean, default: true },
  imageBorderClass: { type: String, default: 'border border-[#b28aff]/30' },
  imgHeightClass: { type: String, default: 'max-h-48' },
  subtitleColorClass: { type: String, default: 'text-[#7de8dc]' },
  iconColorClass: { type: String, default: 'text-[#7de8dc]' },
})

const category = computed(() => getAttachmentCategory(props.url, props.type))
</script>
