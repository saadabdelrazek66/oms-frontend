<template>
  <div 
    class="audio-voice-player"
    :class="[
      `variant-${variant}`,
      `theme-${theme}`,
      { 'is-playing': isPlaying, 'is-loading': isLoading }
    ]"
    @click.stop
    dir="ltr"
  >
    <!-- عنصر الصوت الخفي -->
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @waiting="isLoading = true"
      @playing="isLoading = false"
      @error="onError"
    ></audio>

    <!-- زر التشغيل / الإيقاف المؤقت الفاخر -->
    <button
      type="button"
      @click="togglePlay"
      class="player-play-btn"
      :title="isPlaying ? 'إيقاف مؤقت' : 'تشغيل التسجيل الصوتي'"
      :aria-label="isPlaying ? 'إيقاف مؤقت' : 'تشغيل التسجيل الصوتي'"
    >
      <!-- حالة التحميل -->
      <span v-if="isLoading" class="player-spinner"></span>

      <!-- أيقونة الإيقاف المؤقت -->
      <svg v-else-if="isPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
      </svg>

      <!-- أيقونة التشغيل -->
      <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="translate-x-0.5">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l11-6.86a1 1 0 0 0 0-1.68l-11-6.86A1 1 0 0 0 8 5.14z"></path>
      </svg>
    </button>

    <!-- منطقة الموجات الصوتية التفاعلية مع شريط التقدم -->
    <div class="player-body">
      <!-- شريط الموجات الصوتية القابل للنقر والسحب -->
      <div 
        ref="waveformRef"
        class="player-waveform-track"
        @click="onWaveformClick"
        @mousedown="startDragging"
        title="انقر في أي مكان للتخطي أو التقديم"
      >
        <div 
          v-for="(height, idx) in waveformBars" 
          :key="idx" 
          class="waveform-bar"
          :class="{
            'is-passed': (idx / waveformBars.length) <= progressRatio,
            'is-current': isPlaying && Math.abs((idx / waveformBars.length) - progressRatio) < 0.05
          }"
          :style="{ height: `${height}%` }"
        ></div>
      </div>

      <!-- الوقت والتحكم في السرعة -->
      <div class="player-footer">
        <!-- الوقت الحالي / المتبقي -->
        <span class="player-time font-mono">
          {{ isPlaying || currentTime > 0 ? formatTime(currentTime) : (duration > 0 ? formatTime(duration) : '0:00') }}
          <span v-if="duration > 0 && !isPlaying && currentTime === 0" class="player-total-time">/ {{ formatTime(duration) }}</span>
        </span>

        <!-- زر السرعة 1x, 1.5x, 2x -->
        <button
          v-if="variant !== 'compact'"
          type="button"
          @click="togglePlaybackSpeed"
          class="player-speed-pill font-mono"
          :title="`سرعة التشغيل: ${playbackRate}x`"
        >
          {{ playbackRate }}x
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  variant: {
    type: String, // 'card' | 'bubble' | 'full' | 'compact'
    default: 'card'
  },
  theme: {
    type: String, // 'teal' | 'purple' | 'amber'
    default: 'teal'
  }
});

const audioRef = ref(null);
const waveformRef = ref(null);
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playbackRate = ref(1);
const isDragging = ref(false);

// معرف فريد للمشغل لمنع تشغيل أكثر من صوت بنفس الوقت
const playerId = 'audio_' + Math.random().toString(36).substring(2, 9);

// مصفوفة ارتفاعات الموجات الصوتية الجمالية (24 عمود)
const waveformBars = [
  30, 45, 75, 50, 90, 60, 40, 85, 100, 65,
  45, 80, 55, 70, 95, 40, 60, 80, 50, 35,
  65, 50, 35, 25
];

const progressRatio = computed(() => {
  if (!duration.value || duration.value === 0) return 0;
  return Math.min(1, Math.max(0, currentTime.value / duration.value));
});

const formatTime = (secs) => {
  if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const onLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0;
  }
};

const onTimeUpdate = () => {
  if (audioRef.value && !isDragging.value) {
    currentTime.value = audioRef.value.currentTime || 0;
    if (!duration.value && audioRef.value.duration) {
      duration.value = audioRef.value.duration;
    }
  }
};

const onPlay = () => {
  isPlaying.value = true;
  isLoading.value = false;
  // إيقاف أي مشغل صوتي آخر في الصفحة لتجنب تداخل الأصوات
  window.dispatchEvent(new CustomEvent('oms-pause-other-audios', { detail: playerId }));
};

const onPause = () => {
  isPlaying.value = false;
};

const onEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  if (audioRef.value) {
    audioRef.value.currentTime = 0;
  }
};

const onError = () => {
  isLoading.value = false;
  isPlaying.value = false;
};

const togglePlay = () => {
  if (!audioRef.value) return;

  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play().catch(err => {
      console.warn('Audio playback error:', err);
      isPlaying.value = false;
    });
  }
};

const togglePlaybackSpeed = () => {
  if (!audioRef.value) return;
  const rates = [1, 1.5, 2];
  const nextIdx = (rates.indexOf(playbackRate.value) + 1) % rates.length;
  playbackRate.value = rates[nextIdx];
  audioRef.value.playbackRate = playbackRate.value;
};

const seekToRatio = (ratio) => {
  if (!audioRef.value || !duration.value) return;
  const newTime = ratio * duration.value;
  currentTime.value = newTime;
  audioRef.value.currentTime = newTime;
};

const onWaveformClick = (event) => {
  if (!waveformRef.value || !duration.value) return;
  const rect = waveformRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const ratio = Math.min(1, Math.max(0, clickX / rect.width));
  seekToRatio(ratio);
};

// دعم السحب على شريط الصوت
const startDragging = (e) => {
  isDragging.value = true;
  onWaveformClick(e);

  const onMouseMove = (moveEvent) => {
    if (!isDragging.value || !waveformRef.value) return;
    const rect = waveformRef.value.getBoundingClientRect();
    const currentX = moveEvent.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, currentX / rect.width));
    seekToRatio(ratio);
  };

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

// الاستماع للحدث المخصص لإيقاف المشغلات الأخرى
const handlePauseOther = (e) => {
  if (e.detail !== playerId && isPlaying.value && audioRef.value) {
    audioRef.value.pause();
  }
};

onMounted(() => {
  window.addEventListener('oms-pause-other-audios', handlePauseOther);
});

onUnmounted(() => {
  window.removeEventListener('oms-pause-other-audios', handlePauseOther);
  if (audioRef.value) {
    audioRef.value.pause();
  }
});

// مراقبة تغير الرابط لتحديث المشغل
watch(() => props.src, () => {
  isPlaying.value = false;
  currentTime.value = 0;
  duration.value = 0;
  if (audioRef.value) {
    audioRef.value.load();
  }
});
</script>

<style scoped>
.audio-voice-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(10, 16, 47, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(137, 153, 226, 0.16);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 18px rgba(3, 6, 23, 0.25);
  user-select: none;
}

.audio-voice-player:hover {
  border-color: rgba(125, 232, 220, 0.35);
  box-shadow: 0 6px 24px rgba(3, 6, 23, 0.38);
}

.audio-voice-player.is-playing {
  border-color: rgba(125, 232, 220, 0.5);
  box-shadow: 0 0 20px rgba(125, 232, 220, 0.18), 0 8px 25px rgba(0, 0, 0, 0.4);
}

/* زر التشغيل */
.player-play-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

/* سمة التركواز (الافتراضية) */
.theme-teal .player-play-btn {
  background: linear-gradient(135deg, #7de8dc 0%, #20bd9b 100%);
  color: #0b1131;
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.35);
}
.theme-teal .player-play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(125, 232, 220, 0.55);
}

/* سمة البنفسجي */
.theme-purple .player-play-btn {
  background: linear-gradient(135deg, #b28aff 0%, #7e57c2 100%);
  color: #0b1131;
  box-shadow: 0 4px 14px rgba(178, 138, 255, 0.35);
}
.theme-purple .player-play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(178, 138, 255, 0.55);
}

/* منطقة الموجات والتوقيت */
.player-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* مسار الموجات الصوتية */
.player-waveform-track {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 2.5px;
  cursor: pointer;
  padding: 2px 0;
}

/* عمود الموجة الصوتية */
.waveform-bar {
  flex: 1;
  min-width: 2px;
  border-radius: 3px;
  background: rgba(137, 153, 226, 0.28);
  transition: height 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}

.player-waveform-track:hover .waveform-bar {
  background: rgba(137, 153, 226, 0.45);
}

/* الأعمدة التي تم اجتيازها */
.theme-teal .waveform-bar.is-passed {
  background: #7de8dc;
  box-shadow: 0 0 6px rgba(125, 232, 220, 0.5);
}

.theme-purple .waveform-bar.is-passed {
  background: #b28aff;
  box-shadow: 0 0 6px rgba(178, 138, 255, 0.5);
}

/* العمود النشط أثناء التشغيل (حركة خفيفة) */
.waveform-bar.is-current {
  transform: scaleY(1.2);
  filter: brightness(1.3);
}

/* فوتر المشغل (الوقت + السرعة) */
.player-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1;
}

.player-time {
  font-size: 11px;
  font-weight: 700;
  color: #9cb0eb;
  letter-spacing: 0.5px;
}

.player-total-time {
  opacity: 0.6;
  margin-left: 2px;
}

.player-speed-pill {
  background: rgba(137, 153, 226, 0.12);
  border: 1px solid rgba(137, 153, 226, 0.22);
  color: #7de8dc;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.player-speed-pill:hover {
  background: rgba(125, 232, 220, 0.2);
  border-color: rgba(125, 232, 220, 0.4);
  color: #ffffff;
}

/* سبينر التحميل */
.player-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(11, 17, 49, 0.3);
  border-top-color: #0b1131;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* تنويعات الحجم */
.variant-bubble {
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(8, 13, 40, 0.5);
  border-color: rgba(137, 153, 226, 0.12);
}

.variant-bubble .player-play-btn {
  width: 34px;
  height: 34px;
  border-radius: 11px;
}

.variant-full {
  padding: 14px 18px;
  border-radius: 20px;
}

.variant-full .player-play-btn {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}
</style>
