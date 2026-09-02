<template>
  <header class="navbar" dir="rtl">
    <div class="nav-main">
      <button class="menu-btn" type="button" aria-label="فتح القائمة الجانبية" @click="$emit('toggle-sidebar')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <div class="page-heading">
        <span class="wave-mark" aria-hidden="true">⌁</span>
        <div>
          <span class="breadcrumb">مساحتك الرقمية</span>
          <h1>{{ pageTitle }}</h1>
        </div>
      </div>
    </div>

    <div class="nav-actions">
      <button class="icon-btn notification-btn" type="button" aria-label="الإشعارات">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        <span class="notification-dot">3</span>
      </button>
      <span class="divider" aria-hidden="true"></span>
      <div class="user-info">
        <div class="user-avatar">{{ role === 'manager' ? 'م' : 'و' }}</div>
        <div class="user-copy">
          <strong>{{ role === 'manager' ? ' المدير' : ' الموظف' }}</strong>
          <span><i></i> متصل الآن</span>
        </div>
      </div>
      <button class="logout-btn" type="button" :disabled="isLoggingOut" @click="logout">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>
        <span>{{ isLoggingOut ? 'جارٍ الخروج...' : 'تسجيل الخروج' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../axios';

defineEmits(['toggle-sidebar']);

const router = useRouter();
const route = useRoute();
const role = localStorage.getItem('role');
const isLoggingOut = ref(false);

const pageTitle = computed(() => {
  if (route.path.includes('dashboard')) return 'نظرة عامة';
  return 'لوحة التحكم';
});

const logout = async () => {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await api.post('/logout');
  } catch (error) {
    console.error('حدث خطأ أثناء تسجيل الخروج', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.navbar { min-height: 82px; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px clamp(18px, 3vw, 38px); color: #edf0ff; background: rgba(15, 20, 57, .82); border-bottom: 1px solid rgba(149,163,230,.14); box-shadow: 0 10px 28px rgba(5, 8, 30, .13); backdrop-filter: blur(16px); font-family: 'Cairo', sans-serif; }
.nav-main, .nav-actions, .page-heading, .user-info, .user-copy, .notification-btn { display: flex; align-items: center; }.nav-main { gap: 21px; }.menu-btn, .icon-btn { display: grid; place-items: center; border: 0; color: #8f9ac9; background: transparent; cursor: pointer; }.menu-btn { display: none; }.menu-btn svg, .icon-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }.menu-btn:hover, .icon-btn:hover { color: #7de8de; }
.page-heading { gap: 12px; }.wave-mark { width: 39px; height: 39px; display: grid; place-items: center; border: 1px solid rgba(123,231,221,.2); border-radius: 12px; color: #7de8de; background: rgba(85,213,201,.1); font-size: 29px; line-height: 1; transform: rotate(-10deg); }.breadcrumb { display: block; color: #7782b5; font-size: 10px; }.page-heading h1 { margin: 2px 0 0; font-size: 18px; font-weight: 700; }
.nav-actions { gap: 17px; }.notification-btn { position: relative; padding: 8px; }.notification-dot { position: absolute; top: 1px; right: -1px; min-width: 16px; height: 16px; display: grid; place-items: center; padding: 0 3px; border: 2px solid #10163e; border-radius: 50%; color: #141943; background: #79e6db; font-size: 8px; font-weight: 800; }.divider { width: 1px; height: 30px; background: rgba(144,157,220,.18); }.user-info { gap: 10px; }.user-avatar { width: 38px; height: 38px; display: grid; place-items: center; border: 2px solid rgba(126,232,220,.5); border-radius: 50%; color: #201955; background: linear-gradient(145deg, #8aede1, #ab87ff); font-size: 14px; font-weight: 800; }.user-copy strong { display: block; font-size: 11px; }.user-copy span { display: flex; align-items: center; gap: 5px; margin-top: 2px; color: #7782b4; font-size: 9px; }.user-copy i { width: 6px; height: 6px; border-radius: 50%; background: #71e5d9; box-shadow: 0 0 7px #71e5d9; }.logout-btn { display: flex; align-items: center; gap: 8px; padding: 9px 13px; border: 1px solid rgba(255,141,164,.18); border-radius: 10px; color: #ff9daf; background: rgba(255,108,140,.07); font: inherit; font-size: 10px; cursor: pointer; transition: .2s; }.logout-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }.logout-btn:hover:not(:disabled) { color: #fff; border-color: rgba(255,141,164,.45); background: rgba(255,108,140,.16); transform: translateY(-1px); }.logout-btn:disabled { opacity: .55; cursor: wait; }
@media (max-width: 700px) { .navbar { min-height: 70px; padding: 11px 16px; }.menu-btn { display: grid; }.wave-mark, .breadcrumb, .user-copy, .divider { display: none; }.page-heading h1 { font-size: 16px; }.nav-actions { gap: 9px; }.logout-btn { padding: 8px; border: 0; background: transparent; }.logout-btn span { display: none; }.logout-btn svg { width: 20px; height: 20px; } }
</style>
