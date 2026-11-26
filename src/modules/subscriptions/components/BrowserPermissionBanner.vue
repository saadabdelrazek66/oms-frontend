<template>
  <div v-if="shouldShow" class="browser-permission-banner" :class="isDenied ? 'is-denied' : 'is-prompt'" dir="rtl">
    <div class="banner-content">
      <div class="banner-icon">{{ isDenied ? '🔕' : '🔔' }}</div>
      <div class="banner-text">
        <strong v-if="isDenied">إشعارات المتصفح محظورة حالياً في إعدادات متصفحك</strong>
        <strong v-else>فعّل إشعارات المتصفح الفورية لعدم تفويت أي موعد تجديد</strong>
        <p v-if="isDenied">
          لاستلام تنبيهات سطح المكتب عند اقتراب انتهاء الدومينات أو الاستضافة، يرجى السماح بالإشعارات من أيقونة القفل بجانب رابط الموقع ثم إعادة تحميل الصفحة.
        </p>
        <p v-else>
          عند التفعيل، ستصلك تنبيهات عاجلة على شاشة جهازك فور صدور أي تذكير من النظام حتى أثناء تصفح تبويبات أخرى.
        </p>
      </div>
    </div>

    <div class="banner-actions">
      <button
        v-if="!isDenied"
        type="button"
        class="btn-enable-browser"
        :disabled="requesting"
        @click="handleEnable"
      >
        {{ requesting ? 'جارٍ التفعيل...' : 'تفعيل إشعارات المتصفح الآن' }}
      </button>
      <button
        type="button"
        class="btn-dismiss-banner"
        aria-label="إخفاء التنبيه"
        @click="dismissBanner"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBrowserNotifications } from '../composables/useBrowserNotifications';

const { isSupported, needsPrompt, isDenied, requestPermission } = useBrowserNotifications();

const DISMISS_KEY = 'oms_subscriptions_browser_banner_dismissed';
const dismissed = ref(typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1');
const requesting = ref(false);

const shouldShow = computed(() => isSupported.value && !dismissed.value && (needsPrompt.value || isDenied.value));

const handleEnable = async () => {
  requesting.value = true;
  try {
    await requestPermission();
  } finally {
    requesting.value = false;
  }
};

const dismissBanner = () => {
  dismissed.value = true;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(DISMISS_KEY, '1');
  }
};
</script>

<style scoped>
.browser-permission-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1.25rem;
  border-radius: 0.875rem;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.14), rgba(16, 185, 129, 0.08));
}

.browser-permission-banner.is-denied {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08));
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  flex: 1;
  min-width: 240px;
}

.banner-icon {
  font-size: 1.5rem;
  line-height: 1;
  margin-top: 0.15rem;
}

.banner-text strong {
  display: block;
  color: #f8fafc;
  font-size: 0.92rem;
  margin-bottom: 0.2rem;
}

.banner-text p {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.8rem;
  line-height: 1.45;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-enable-browser {
  background: linear-gradient(135deg, #0ea5e9, #10b981);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.btn-enable-browser:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-enable-browser:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-dismiss-banner {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn-dismiss-banner:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.12);
}
</style>
