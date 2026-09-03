<template>
  <header class="navbar" dir="rtl">
    <div class="nav-main">
      <button
        class="menu-btn"
        type="button"
        aria-label="فتح القائمة الجانبية"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        @click="$emit('toggle-sidebar')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <div class="page-heading">
        <span class="wave-mark" aria-hidden="true">⌁</span>
        <div class="heading-copy">
          <span class="breadcrumb">مساحتك الرقمية</span>
          <h1>{{ pageTitle }}</h1>
        </div>
      </div>
    </div>

    <div class="nav-actions">
      <button class="icon-btn notification-btn" type="button" aria-label="الإشعارات">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        <span class="notification-dot" aria-label="3 إشعارات جديدة">3</span>
      </button>
      <span class="divider" aria-hidden="true"></span>
      <div class="user-info">
        <div class="user-avatar" aria-hidden="true">{{ role === 'manager' ? 'م' : 'و' }}</div>
        <div class="user-copy">
          <strong>{{ role === 'manager' ? ' المدير' : ' الموظف' }}</strong>
          <span><i aria-hidden="true"></i> متصل الآن</span>
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../axios'

defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle-sidebar'])

const router = useRouter()
const route = useRoute()
const role = localStorage.getItem('role') || 'employee'
const isLoggingOut = ref(false)

const pageTitle = computed(() => {
  if (route.path.includes('dashboard')) return 'نظرة عامة'
  return 'لوحة التحكم'
})

const logout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    await api.post('/logout')
  } catch (error) {
    console.error('حدث خطأ أثناء تسجيل الخروج', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    router.push('/')
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}

.navbar {
  min-height: 82px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px clamp(18px, 3vw, 38px);
  color: #edf0ff;
  background: rgba(15, 20, 57, .82);
  border-bottom: 1px solid rgba(149, 163, 230, .14);
  box-shadow: 0 10px 28px rgba(5, 8, 30, .13);
  backdrop-filter: blur(16px);
  font-family: 'Cairo', sans-serif;
}

.nav-main,
.nav-actions,
.page-heading,
.user-info,
.user-copy,
.notification-btn {
  display: flex;
  align-items: center;
}

.nav-main {
  min-width: 0;
  gap: 21px;
}

.menu-btn,
.icon-btn {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: #8f9ac9;
  background: transparent;
  cursor: pointer;
}

.menu-btn {
  display: none;
}

.menu-btn svg,
.icon-btn svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.menu-btn:hover,
.icon-btn:hover {
  color: #7de8de;
  background: rgba(122, 140, 224, .08);
}

.page-heading {
  min-width: 0;
  gap: 12px;
}

.wave-mark {
  width: 39px;
  height: 39px;
  flex: 0 0 39px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(123, 231, 221, .2);
  border-radius: 12px;
  color: #7de8de;
  background: rgba(85, 213, 201, .1);
  font-size: 29px;
  line-height: 1;
  transform: rotate(-10deg);
}

.heading-copy {
  min-width: 0;
}

.breadcrumb {
  display: block;
  overflow: hidden;
  color: #7782b5;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.page-heading h1 {
  overflow: hidden;
  margin: 2px 0 0;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-actions {
  min-width: 0;
  gap: 17px;
}

.notification-btn {
  position: relative;
  padding: 0;
}

.notification-dot {
  position: absolute;
  top: 0;
  right: -1px;
  min-width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  padding: 0 3px;
  border: 2px solid #10163e;
  border-radius: 50%;
  color: #141943;
  background: #79e6db;
  font-size: 8px;
  font-weight: 800;
}

.divider {
  width: 1px;
  height: 30px;
  flex: 0 0 1px;
  background: rgba(144, 157, 220, .18);
}

.user-info {
  min-width: 0;
  gap: 10px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(126, 232, 220, .5);
  border-radius: 50%;
  color: #201955;
  background: linear-gradient(145deg, #8aede1, #ab87ff);
  font-size: 14px;
  font-weight: 800;
}

.user-copy {
  min-width: 0;
  display: block;
}

.user-copy strong {
  display: block;
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-copy span {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  color: #7782b4;
  font-size: 9px;
  white-space: nowrap;
}

.user-copy i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #71e5d9;
  box-shadow: 0 0 7px #71e5d9;
}

.logout-btn {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 9px 13px;
  border: 1px solid rgba(255, 141, 164, .18);
  border-radius: 10px;
  color: #ff9daf;
  background: rgba(255, 108, 140, .07);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: color .2s ease, border-color .2s ease, background-color .2s ease, transform .2s ease;
}

.logout-btn svg {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.logout-btn:hover:not(:disabled) {
  color: #fff;
  border-color: rgba(255, 141, 164, .45);
  background: rgba(255, 108, 140, .16);
  transform: translateY(-1px);
}

.logout-btn:disabled {
  opacity: .55;
  cursor: wait;
}

.menu-btn:focus-visible,
.icon-btn:focus-visible,
.logout-btn:focus-visible {
  outline: 2px solid #79e6db;
  outline-offset: 2px;
}

@media (max-width: 900px) {
  .navbar {
    gap: 12px;
  }

  .nav-actions {
    gap: 10px;
  }

  .logout-btn {
    padding-inline: 10px;
  }
}

@media (max-width: 760px) {
  .navbar {
    min-height: 70px;
    padding: 11px max(16px, env(safe-area-inset-right)) 11px max(16px, env(safe-area-inset-left));
  }

  .menu-btn {
    display: grid;
  }

  .wave-mark,
  .breadcrumb,
  .user-copy,
  .divider {
    display: none;
  }

  .nav-main {
    gap: 10px;
  }

  .page-heading h1 {
    font-size: 16px;
  }

  .nav-actions {
    gap: 3px;
  }

  .logout-btn {
    padding: 0;
    border: 0;
    background: transparent;
  }

  .logout-btn span {
    display: none;
  }

  .logout-btn svg {
    width: 20px;
    height: 20px;
    flex-basis: 20px;
  }
}

@media (max-width: 360px) {
  .navbar {
    padding-inline: 12px;
  }

  .menu-btn,
  .icon-btn,
  .logout-btn {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
    flex-basis: 34px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logout-btn {
    transition: none;
  }
}
</style>
