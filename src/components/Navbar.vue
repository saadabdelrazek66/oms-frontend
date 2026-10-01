<template>
  <header class="navbar" dir="rtl">
    <div class="nav-main">
      <button
        class="menu-btn"
        type="button"
        :aria-label="sidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'"
        :title="sidebarOpen ? 'إغلاق القائمة الجانبية' : 'فتح القائمة الجانبية'"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        @click="$emit('toggle-sidebar')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <router-link to="/" class="navbar-brand-link" title="Octo Space">
        <img src="/logo.png" alt="Octo Media" class="navbar-logo-img" />
      </router-link>

      <div class="page-heading">
        <div class="heading-copy">
          <span class="breadcrumb">مساحتك الرقمية</span>
          <h1>{{ pageTitle }}</h1>
        </div>
      </div>
    </div>

    <div class="nav-actions">
      <!-- زر وقائمة الإشعارات المعتمدة -->
      <div class="notification-wrapper" ref="notificationWrapperRef">
        <button
          class="icon-btn notification-btn"
          type="button"
          :aria-label="unreadCount > 0 ? `الإشعارات (${unreadCount} غير مقروء)` : 'الإشعارات'"
          :title="unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'الإشعارات'"
          :aria-expanded="isDropdownOpen"
          @click.stop="toggleDropdown"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          <span v-if="unreadCount > 0" class="notification-dot" :aria-label="`${unreadCount} إشعارات جديدة`">
            {{ unreadCount > 99 ? '+99' : unreadCount }}
          </span>
        </button>

        <!-- القائمة المنسدلة للإشعارات -->
        <Transition name="dropdown-fade">
          <div v-if="isDropdownOpen" class="notification-dropdown" dir="rtl" @click.stop>
            <div class="dropdown-header">
              <div class="dropdown-title-row">
                <span class="dropdown-title">الإشعارات</span>
                <span v-if="unreadCount > 0" class="unread-pill">{{ unreadCount }} جديدة</span>
              </div>
              <button
                type="button"
                class="mark-all-btn"
                :disabled="unreadCount === 0 || isMarkingAllAsRead"
                @click="markAllAsRead"
              >
                {{ isMarkingAllAsRead ? 'جارٍ التحديث...' : 'تحديد الكل كمقروء' }}
              </button>
            </div>

            <div class="dropdown-body custom-scrollbar">
              <div v-if="isLoading && notifications.length === 0" class="dropdown-loading">
                <span class="spinner-sm"></span>
                <span>جارٍ جلب الإشعارات...</span>
              </div>

              <div v-else-if="notifications.length === 0" class="dropdown-empty">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                <span>لا توجد إشعارات حالياً</span>
              </div>

              <div v-else class="notifications-list">
                <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="notification-item"
                  :class="{ unread: !item.read_at, clickable: Boolean(item.data?.url) }"
                  @click="handleNotificationClick(item, router)"
                >
                  <span class="item-dot" :class="{ unread: !item.read_at }"></span>
                  <div class="item-content">
                    <div class="item-top">
                      <strong class="item-title">{{ item.data?.title || 'إشعار من النظام' }}</strong>
                      <span class="item-time">{{ formatTimeAgo(item.created_at) }}</span>
                    </div>
                    <p v-if="item.data?.body || item.data?.message" class="item-body">
                      {{ item.data?.body || item.data?.message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <span class="divider" aria-hidden="true"></span>
      
      <!-- منطقة بيانات المستخدم المحدثة -->
      <div class="user-info">
        <div class="user-avatar" aria-hidden="true">{{ userInitial }}</div>
        <div class="user-copy">
          <strong>{{ userName }}</strong>
          <span>
            <i aria-hidden="true"></i> 
            {{ role === 'manager' ? 'مدير' : 'موظف' }} • متصل
          </span>
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
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../axios'
import { disconnectEcho } from '../echo'
import { useNotifications, formatTimeAgo } from '../composables/useNotifications'

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

// ريفرنس عنصر غلاف الإشعارات للتعامل مع النقر الخارجي
const notificationWrapperRef = ref(null)

// استخدام Composable الخاص بالإشعارات والربط اللحظي
const {
  notifications,
  unreadCount,
  isLoading,
  isDropdownOpen,
  isMarkingAllAsRead,
  fetchUnreadCount,
  fetchNotifications,
  initRealtimeListener,
  handleNotificationClick,
  markAllAsRead,
  toggleDropdown,
  closeDropdown,
} = useNotifications()

const handleClickOutside = (event) => {
  if (notificationWrapperRef.value && !notificationWrapperRef.value.contains(event.target)) {
    closeDropdown()
  }
}

// متغيرات حالة المستخدم
const userName = ref('جاري التحميل...')
const userInitial = ref('')

const pageTitle = computed(() => {
  if (route.path.includes('dashboard')) return 'نظرة عامة'
  return 'لوحة التحكم'
})

// استخراج بيانات المستخدم وتحميل الإشعارات والاستماع اللحظي
onMounted(() => {
  // جلب عداد وقائمة الإشعارات وتهيئة الاستماع اللحظي عبر Laravel Echo
  fetchUnreadCount()
  fetchNotifications()
  initRealtimeListener()

  // مراقبة النقر خارج القائمة المنسدلة لإغلاقها
  document.addEventListener('click', handleClickOutside)

  const storedUser = localStorage.getItem('user')
  
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser)
      if (userObj && userObj.name) {
        const firstName = userObj.name.split(' ')[0]
        userName.value = firstName
        userInitial.value = firstName.charAt(0).toUpperCase()
      }
    } catch (e) {
      console.error('خطأ في قراءة بيانات المستخدم:', e)
      setFallbackUser()
    }
  } else {
    setFallbackUser()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// دالة مساعدة لتعيين القيم الافتراضية
const setFallbackUser = () => {
  userName.value = role === 'manager' ? 'المدير' : 'الموظف'
  userInitial.value = role === 'manager' ? 'م' : 'و'
}

const logout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    await api.post('/logout')
  } catch (error) {
    console.error('حدث خطأ أثناء تسجيل الخروج', error)
  } finally {
    disconnectEcho()
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    localStorage.removeItem('user_id')
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
  display: grid;
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

.navbar-brand-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.navbar-brand-link:hover {
  transform: scale(1.06);
}

.navbar-logo-img {
  height: 42px;
  width: auto;
  max-width: 60px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 10px rgba(123, 231, 221, 0.3));
}

.page-heading {
  min-width: 0;
  gap: 12px;
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

.notification-wrapper {
  position: relative;
  display: flex;
  align-items: center;
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

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  width: min(360px, calc(100vw - 28px));
  max-height: 480px;
  background: rgba(14, 19, 54, 0.96);
  border: 1px solid rgba(149, 163, 230, 0.18);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(4, 7, 27, 0.55), 0 0 20px rgba(125, 232, 220, 0.08);
  backdrop-filter: blur(16px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: inherit;
  color: #edf0ff;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(149, 163, 230, 0.12);
  background: rgba(10, 15, 44, 0.6);
}

.dropdown-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-title {
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
}

.unread-pill {
  font-size: 10px;
  font-weight: 700;
  color: #12183f;
  background: #7de8dc;
  padding: 2px 7px;
  border-radius: 10px;
}

.mark-all-btn {
  background: transparent;
  border: 0;
  color: #7de8dc;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.mark-all-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.12);
  color: #a4f4eb;
}

.mark-all-btn:disabled {
  color: #6a749d;
  cursor: not-allowed;
  opacity: 0.6;
}

.dropdown-body {
  overflow-y: auto;
  max-height: 380px;
  overscroll-behavior: contain;
}

.dropdown-loading,
.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 38px 20px;
  color: #818cb9;
  font-size: 13px;
  text-align: center;
}

.dropdown-empty svg {
  color: #626d97;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(149, 163, 230, 0.08);
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(122, 140, 224, 0.08);
}

.notification-item.unread {
  background: rgba(125, 232, 220, 0.05);
}

.notification-item.unread:hover {
  background: rgba(125, 232, 220, 0.1);
}

.item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: transparent;
}

.item-dot.unread {
  background: #7de8dc;
  box-shadow: 0 0 8px rgba(125, 232, 220, 0.8);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.item-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #f1f4ff;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 10px;
  color: #7986b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-body {
  margin: 0;
  font-size: 11.5px;
  color: #9cb0eb;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(125, 232, 220, 0.25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
  font-size: 16px; /* كبرنا الخط قليلاً ليناسب الحرف */
  font-weight: 800;
}

.user-copy {
  min-width: 0;
  display: block;
}

.user-copy strong {
  display: block;
  overflow: hidden;
  font-size: 13px; /* كبرنا الخط قليلاً ليبرز الاسم */
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

@media (max-width: 1024px) {
  .navbar {
    gap: 12px;
    padding: 12px clamp(14px, 2.5vw, 24px);
  }

  .nav-actions {
    gap: 8px;
  }

  .breadcrumb {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-btn {
    padding-inline: 10px;
  }
}

@media (max-width: 768px) {
  .navbar {
    min-height: 66px;
    padding: 10px max(14px, env(safe-area-inset-right)) 10px max(14px, env(safe-area-inset-left));
  }

  .breadcrumb,
  .user-copy,
  .divider {
    display: none;
  }

  .navbar-logo-img {
    height: 34px;
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