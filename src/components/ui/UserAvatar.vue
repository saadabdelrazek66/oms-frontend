<template>
  <span
    class="user-avatar-badge"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.round(Number(size) * 0.42))}px`,
      borderRadius: rounded,
      background: avatarUrl ? 'transparent' : gradientBg,
    }"
    :title="name"
    aria-hidden="true"
  >
    <img v-if="avatarUrl" :src="avatarUrl" :alt="name" class="avatar-img" />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { getInitials } from '@/utils/formatters';

const props = defineProps({
  name: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  size: { type: [Number, String], default: 32 },
  rounded: { type: String, default: '50%' },
});

const PALETTES = [
  'linear-gradient(135deg, #0284c7, #4f46e5)',
  'linear-gradient(135deg, #059669, #0d9488)',
  'linear-gradient(135deg, #7c3aed, #db2777)',
  'linear-gradient(135deg, #d97706, #ea580c)',
  'linear-gradient(135deg, #2563eb, #06b6d4)',
];

const initials = computed(() => getInitials(props.name, '؟'));

const gradientBg = computed(() => {
  const str = String(props.name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
});
</script>

<style scoped>
.user-avatar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
