<template>
  <div class="global-alerts-provider-root" dir="rtl">
    <!-- ========================================================================= -->
    <!-- 1. مودال التأكيد التفاعلي الفاخر (Confirm Modal - Style of QuickTasksBoard) -->
    <!-- ========================================================================= -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="confirmState.isOpen"
          class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[#080d26]/85 backdrop-blur-md"
          @click.self="handleConfirm(false)"
        >
          <div
            class="relative w-full max-w-md rounded-[2rem] bg-[#10163a] p-6 sm:p-7 text-center text-[#f1f4ff] border transition-all"
            :class="getConfirmBorderAndShadow(confirmState.type)"
            dir="rtl"
          >
            <!-- أيقونة التنبيه المتوهجة -->
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-transform duration-300 transform hover:scale-105"
              :class="getConfirmIconStyles(confirmState.type)"
            >
              <!-- نوع الخطر / الحذف -->
              <svg
                v-if="confirmState.type === 'danger'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>

              <!-- نوع التحذير -->
              <svg
                v-else-if="confirmState.type === 'warning'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>

              <!-- نوع المعلومة -->
              <svg
                v-else-if="confirmState.type === 'info'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path>
              </svg>

              <!-- نوع النجاح / الاعتماد -->
              <svg
                v-else
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <!-- العنوان والرسالة -->
            <h3 class="text-xl font-black text-[#f1f4ff] mb-2">{{ confirmState.title }}</h3>
            <p class="text-[#8390be] text-sm leading-relaxed mb-6 whitespace-pre-line">
              {{ confirmState.message }}
            </p>

            <!-- الأزرار -->
            <div class="flex items-center justify-center gap-3">
              <button
                type="button"
                @click="handleConfirm(false)"
                class="px-5 py-2.5 rounded-xl bg-[#141b48]/70 hover:bg-[#1c265c] text-[#8390be] hover:text-[#f1f4ff] font-bold text-sm border border-[#8999e2]/20 transition-all cursor-pointer"
              >
                {{ confirmState.cancelText }}
              </button>
              <button
                type="button"
                @click="handleConfirm(true)"
                class="px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                :class="getConfirmBtnStyles(confirmState.type)"
              >
                <span>{{ confirmState.confirmText }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ========================================================================= -->
    <!-- 2. مودال التنبيه الفردي البديل لـ window.alert (Alert Modal) -->
    <!-- ========================================================================= -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="alertState.isOpen"
          class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[#080d26]/85 backdrop-blur-md"
          @click.self="handleAlertClose"
        >
          <div
            class="relative w-full max-w-md rounded-[2rem] bg-[#10163a] p-6 sm:p-7 text-center text-[#f1f4ff] border transition-all"
            :class="getConfirmBorderAndShadow(alertState.type)"
            dir="rtl"
          >
            <!-- أيقونة التنبيه -->
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
              :class="getConfirmIconStyles(alertState.type)"
            >
              <svg
                v-if="alertState.type === 'error' || alertState.type === 'danger'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6"></path>
              </svg>
              <svg
                v-else-if="alertState.type === 'warning'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <svg
                v-else-if="alertState.type === 'success'"
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg
                v-else
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path>
              </svg>
            </div>

            <h3 class="text-xl font-black text-[#f1f4ff] mb-2">{{ alertState.title }}</h3>
            <p class="text-[#8390be] text-sm leading-relaxed mb-6 whitespace-pre-line">
              {{ alertState.message }}
            </p>

            <div class="flex items-center justify-center">
              <button
                type="button"
                @click="handleAlertClose"
                class="px-8 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer active:scale-95"
                :class="getConfirmBtnStyles(alertState.type)"
              >
                {{ alertState.okText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ========================================================================= -->
    <!-- 3. باقة الإشعارات التوست العائمة الفاخرة (Floating Toasts Stack) -->
    <!-- ========================================================================= -->
    <Teleport to="body">
      <div
        class="fixed top-6 left-6 z-[100001] flex flex-col gap-3 pointer-events-none max-w-sm w-[calc(100vw-3rem)] sm:w-96"
        dir="rtl"
      >
        <TransitionGroup name="toast-slide">
          <div
            v-for="item in toasts"
            :key="item.id"
            class="pointer-events-auto relative overflow-hidden rounded-2xl p-4 bg-[#10163a]/95 backdrop-blur-xl border text-[#f1f4ff] transition-all flex items-start gap-3.5 group shadow-lg"
            :class="getToastCardStyles(item.type)"
            @mouseenter="pauseToast(item.id)"
            @mouseleave="resumeToast(item.id)"
          >
            <!-- أيقونة التوست -->
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
              :class="getToastIconStyles(item.type)"
            >
              <svg v-if="item.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7"></path></svg>
              <svg v-else-if="item.type === 'error'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6"></path></svg>
              <svg v-else-if="item.type === 'warning'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path></svg>
            </div>

            <!-- نص الرسالة -->
            <div class="flex-1 min-w-0 pr-1">
              <p class="text-xs sm:text-sm font-bold leading-relaxed text-[#f1f4ff] break-words">
                {{ item.message }}
              </p>
            </div>

            <!-- زر إغلاق الإشعار -->
            <button
              type="button"
              @click="dismissToast(item.id)"
              class="text-[#8390be] hover:text-[#f1f4ff] p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              title="إغلاق"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <!-- شريط تقدم الوقت المتناقص في أسفل التوست -->
            <div
              class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden"
            >
              <div
                class="h-full transition-all duration-75 ease-linear"
                :class="getToastProgressColor(item.type)"
                :style="{ width: `${Math.max(0, (item.remaining / item.duration) * 100)}%` }"
              ></div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import {
  alertStateStore,
  resolveConfirm,
  resolveAlert,
  dismissToast,
  pauseToast,
  resumeToast
} from '../services/alertService';

const { confirmState, alertState, toasts } = alertStateStore;

const handleConfirm = (result) => {
  resolveConfirm(result);
};

const handleAlertClose = () => {
  resolveAlert();
};

// التعامل مع أزرار لوحة المفاتيح
const handleKeyDown = (e) => {
  if (confirmState.isOpen) {
    if (e.key === 'Escape') {
      handleConfirm(false);
    } else if (e.key === 'Enter') {
      handleConfirm(true);
    }
  } else if (alertState.isOpen) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      handleAlertClose();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// دوال تنسيق كروت ومودالات التأكيد
const getConfirmBorderAndShadow = (type) => {
  switch (type) {
    case 'danger':
    case 'error':
      return 'border-[#ff4757]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,71,87,0.15)]';
    case 'warning':
      return 'border-[#ffa502]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,165,2,0.15)]';
    case 'info':
      return 'border-[#3b82f6]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(59,130,246,0.15)]';
    case 'success':
      return 'border-[#7de8dc]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(125,232,220,0.15)]';
    default:
      return 'border-[#8999e2]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)]';
  }
};

const getConfirmIconStyles = (type) => {
  switch (type) {
    case 'danger':
    case 'error':
      return 'bg-[#ff4757]/15 border-[#ff4757]/30 text-[#ff4757] shadow-[0_0_20px_rgba(255,71,87,0.2)]';
    case 'warning':
      return 'bg-[#ffa502]/15 border-[#ffa502]/30 text-[#ffa502] shadow-[0_0_20px_rgba(255,165,2,0.2)]';
    case 'info':
      return 'bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)]';
    case 'success':
      return 'bg-[#7de8dc]/15 border-[#7de8dc]/30 text-[#7de8dc] shadow-[0_0_20px_rgba(125,232,220,0.2)]';
    default:
      return 'bg-[#8999e2]/15 border-[#8999e2]/30 text-[#8999e2]';
  }
};

const getConfirmBtnStyles = (type) => {
  switch (type) {
    case 'danger':
    case 'error':
      return 'bg-gradient-to-r from-[#ff4757] to-[#ff6b7b] hover:brightness-110 text-white shadow-[0_4px_15px_rgba(255,71,87,0.3)]';
    case 'warning':
      return 'bg-gradient-to-r from-[#ffa502] to-[#ff7f50] hover:brightness-110 text-white shadow-[0_4px_15px_rgba(255,165,2,0.3)]';
    case 'info':
      return 'bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] hover:brightness-110 text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]';
    case 'success':
      return 'bg-gradient-to-r from-[#7de8dc] to-[#2ed573] hover:brightness-110 text-[#0b1131] shadow-[0_4px_15px_rgba(125,232,220,0.3)]';
    default:
      return 'bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white';
  }
};

// دوال تنسيق التوستات
const getToastCardStyles = (type) => {
  switch (type) {
    case 'success':
      return 'border-[#7de8dc]/40 shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(125,232,220,0.15)]';
    case 'error':
    case 'danger':
      return 'border-[#ff4757]/40 shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(255,71,87,0.15)]';
    case 'warning':
      return 'border-[#ffa502]/40 shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(255,165,2,0.15)]';
    case 'info':
    default:
      return 'border-[#38bdf8]/40 shadow-[0_12px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(56,189,248,0.15)]';
  }
};

const getToastIconStyles = (type) => {
  switch (type) {
    case 'success':
      return 'bg-[#7de8dc]/15 border-[#7de8dc]/30 text-[#7de8dc] shadow-[0_0_12px_rgba(125,232,220,0.25)]';
    case 'error':
    case 'danger':
      return 'bg-[#ff4757]/15 border-[#ff4757]/30 text-[#ff4757] shadow-[0_0_12px_rgba(255,71,87,0.25)]';
    case 'warning':
      return 'bg-[#ffa502]/15 border-[#ffa502]/30 text-[#ffa502] shadow-[0_0_12px_rgba(255,165,2,0.25)]';
    case 'info':
    default:
      return 'bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)]';
  }
};

const getToastProgressColor = (type) => {
  switch (type) {
    case 'success':
      return 'bg-gradient-to-r from-[#7de8dc] to-[#2ed573]';
    case 'error':
    case 'danger':
      return 'bg-gradient-to-r from-[#ff4757] to-[#ff6b7b]';
    case 'warning':
      return 'bg-gradient-to-r from-[#ffa502] to-[#ff7f50]';
    case 'info':
    default:
      return 'bg-gradient-to-r from-[#38bdf8] to-[#3b82f6]';
  }
};
</script>

<style scoped>
/* Modal Fade Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.92) translateY(15px);
}

/* Toast Slide Animation */
.toast-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-leave-active {
  transition: all 0.25s ease-in;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.9);
}
.toast-slide-move {
  transition: transform 0.3s ease;
}
</style>
