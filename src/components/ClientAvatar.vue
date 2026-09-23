<template>
  <div
    class="client-avatar-box"
    :class="[customClass]"
    :style="boxStyle"
    :title="name || 'شعار العميل'"
  >
    <!-- صورة اللوجو إذا توفرت الرابط ولم يحدث خطأ -->
    <img
      v-if="logoUrl && !hasError"
      :src="logoUrl"
      :alt="name || 'شعار العميل'"
      class="client-avatar-image"
      loading="lazy"
      @error="onImageError"
    />

    <!-- اللوجو الافتراضي (Fallback) في حالة عدم وجود لوجو أو فشل التحميل -->
    <div v-else class="client-avatar-fallback" aria-hidden="true">
      <svg
        class="corporate-fallback-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  logoUrl: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: [Number, String],
    default: 40,
  },
  rounded: {
    type: String,
    default: '11px',
  },
  customClass: {
    type: String,
    default: '',
  },
})

const hasError = ref(false)

watch(
  () => props.logoUrl,
  () => {
    hasError.value = false
  },
)

const onImageError = () => {
  hasError.value = true
}

const boxStyle = computed(() => {
  const style = {}
  
  // ضبط الحجم سواء تم تمريره كرقم 40 أو كنص '40' أو '40px'
  const rawSize = props.size !== null && props.size !== undefined && props.size !== '' 
    ? String(props.size).trim() 
    : '40px'
  const sizeVal = /^\d+(\.\d+)?$/.test(rawSize) ? `${rawSize}px` : rawSize

  style.width = sizeVal
  style.height = sizeVal
  style.minWidth = sizeVal
  style.maxWidth = sizeVal
  style.flex = `0 0 ${sizeVal}`

  // ضبط استدارة الحواف
  if (props.rounded) {
    if (props.rounded === 'full') {
      style.borderRadius = '50%'
    } else {
      const rawRounded = String(props.rounded).trim()
      style.borderRadius = /^\d+(\.\d+)?$/.test(rawRounded) ? `${rawRounded}px` : rawRounded
    }
  }

  return style
})
</script>

<style scoped>
.client-avatar-box {
  width: 40px;
  height: 40px;
  min-width: 40px;
  max-width: 40px;
  flex: 0 0 40px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 11px;
  background: rgba(14, 20, 56, 0.85);
  border: 1px solid rgba(137, 153, 226, 0.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  vertical-align: middle;
  user-select: none;
  box-sizing: border-box;
}

.client-avatar-box:hover {
  border-color: rgba(125, 232, 220, 0.45);
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.2);
}

.client-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.client-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(23, 31, 77, 0.95), rgba(12, 17, 46, 0.95));
  color: #7de8dc;
  padding: 20%;
  box-sizing: border-box;
}

.corporate-fallback-icon {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  stroke: #7de8dc;
  filter: drop-shadow(0 0 5px rgba(125, 232, 220, 0.35));
  transition: transform 0.2s ease;
}

.client-avatar-box:hover .corporate-fallback-icon {
  transform: scale(1.08);
}
</style>
