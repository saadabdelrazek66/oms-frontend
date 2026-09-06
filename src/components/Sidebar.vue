<template>
  <aside class="sidebar" dir="rtl" aria-label="القائمة الجانبية">
    <div class="brand">
      <div class="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <path
            d="M18 39c0-14 9-25 22-25s22 11 22 25c0 8-3 14-8 18 0 7 4 9 8 12-7 2-12-1-16-7-3 7-8 9-15 7 4-4 7-7 7-12-6-4-10-10-10-18Z"
          />
          <circle cx="33" cy="36" r="3" />
          <circle cx="47" cy="36" r="3" />
          <path d="M34 45c4 3 8 3 12 0" />
        </svg>
      </div>
      <div class="brand-copy">
        <strong>OCTO<span>SPACE</span></strong>
        <small>مساحة فريقك الذكية</small>
      </div>
      <button class="close-btn" type="button" aria-label="إغلاق القائمة" @click="$emit('close')">
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <div class="profile-card">
      <div class="avatar">{{ role === 'manager' ? 'م' : 'و' }}</div>
      <div class="profile-copy">
        <strong>{{ role === 'manager' ? 'مساحة المدير' : 'مساحة الموظف' }}</strong>
        <span><i aria-hidden="true"></i> متصل الآن</span>
      </div>
      <span class="role-badge">{{ role === 'manager' ? 'مدير' : 'موظف' }}</span>
    </div>

    <p class="section-label">القائمة الرئيسية</p>
    <nav class="nav-list" aria-label="التنقل الرئيسي">
      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/dashboard">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
        <span>الرئيسية</span><em>⌘</em>
      </router-link>

      <router-link v-if="role === 'employee'" class="nav-item" to="/employee/dashboard">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13a8 8 0 1 1 16 0v5H4z" />
          <path d="M4 13h3m10 0h3M12 5v3" />
        </svg>
        <span>الرئيسية</span><em>⌘</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/departments">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="16" y="3" width="6" height="6" rx="1"></rect>
          <rect x="2" y="15" width="6" height="6" rx="1"></rect>
          <rect x="16" y="15" width="6" height="6" rx="1"></rect>
          <polyline points="5 15 5 6 16 6"></polyline>
          <line x1="5" y1="9" x2="16" y2="9"></line>
        </svg>
        <span>إدارة الأقسام</span><em>D</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/users">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>إدارة المستخدمين</span><em>U</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/clients">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <span>العملاء والشركات</span><em>C</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/content-plans">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>الخطط</span><em>P</em>
      </router-link>

      <router-link v-if="role === 'employee'" class="nav-item" to="/content-plans">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>الخطط</span><em>P</em>
      </router-link>

      <router-link v-if="role === 'manager' || role === 'employee'" class="nav-item" to="/plan-contents">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>قائمة خطط المحتوى</span><em>L</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/app/client-vault">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <span>خزنة العملاء</span><em>C</em>
      </router-link>
    </nav>

    <p class="section-label workspace-label">مساحتك</p>
    <div class="quick-links">
      <a href="#" @click.prevent><span class="quick-icon purple">✦</span> نشاط الفريق</a>
      <a href="#" @click.prevent><span class="quick-icon teal">◷</span> الإشعارات <b>3</b></a>
      <a href="#" @click.prevent><span class="quick-icon orange">?</span> المساعدة والدعم</a>
    </div>

    <div class="sidebar-bottom">
      <div class="ocean-tip">
        <span aria-hidden="true">✧</span>
        <div>
          <strong>نصيحة اليوم</strong>
          <p>أنجز مهامك بتركيز، خطوة واحدة في كل مرة.</p>
        </div>
      </div>
      <button class="logout-btn" type="button" @click="logout">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
        </svg>
        تسجيل الخروج
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// نقرأ الدور من نفس المكان المستخدم في صفحة تسجيل الدخول.
const role = ref(localStorage.getItem('role') || 'employee')
const router = useRouter()

defineEmits(['close'])

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  router.push('/login')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}

.sidebar {
  width: 100%;
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: max(27px, env(safe-area-inset-top)) 18px max(20px, env(safe-area-inset-bottom));
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  color: #e9ebff;
  background: linear-gradient(180deg, #11163d 0%, #0c1231 68%, #0b102b 100%);
  border-left: 1px solid rgba(145, 160, 231, 0.16);
  font-family: 'Cairo', sans-serif;
}

.sidebar::before,
.sidebar::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
}

.sidebar::before {
  width: 240px;
  height: 240px;
  left: -155px;
  top: 80px;
  background: #7448db;
  opacity: .13;
  filter: blur(40px);
}

.sidebar::after {
  width: 180px;
  height: 180px;
  right: -130px;
  bottom: 20px;
  background: #43d9cf;
  opacity: .08;
  filter: blur(35px);
}

.brand,
.profile-card,
.nav-list,
.quick-links,
.sidebar-bottom,
.section-label {
  position: relative;
  z-index: 1;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 0 8px;
}

.brand-icon {
  width: 43px;
  height: 43px;
  flex: 0 0 43px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(140deg, #b865fc, #5d42d8);
  box-shadow: 0 9px 20px rgba(125, 70, 225, .3);
}

.brand-icon svg {
  width: 35px;
  height: 35px;
  fill: #f4a7ff;
  stroke: #251b5d;
  stroke-width: 2.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brand-copy {
  min-width: 0;
}

.brand strong {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  letter-spacing: .8px;
  font-size: 15px;
}

.brand strong span {
  color: #bd83ff;
}

.brand small {
  display: block;
  overflow: hidden;
  color: #7f89b8;
  font-size: 9px;
  margin-top: 1px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.close-btn {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: none;
  place-items: center;
  margin-right: auto;
  padding: 0;
  color: #8993bf;
  border: 0;
  border-radius: 10px;
  background: transparent;
  font-size: 27px;
  line-height: 1;
  cursor: pointer;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin: 39px 0 32px;
  padding: 12px 11px;
  border: 1px solid rgba(143, 157, 226, .14);
  border-radius: 15px;
  background: rgba(34, 41, 92, .52);
}

.avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #241a56;
  background: linear-gradient(145deg, #88ece1, #a884ff);
  font-weight: 800;
}

.profile-copy {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.profile-copy strong {
  display: block;
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.profile-copy span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7580ae;
  font-size: 9px;
  margin-top: 3px;
}

.profile-copy i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #6ce6d9;
  box-shadow: 0 0 7px #6ce6d9;
}

.role-badge {
  flex: 0 0 auto;
  padding: 3px 7px;
  border-radius: 6px;
  color: #bc92ff;
  background: rgba(174, 116, 255, .12);
  font-size: 9px;
}

.section-label {
  color: #6874a9;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .7px;
  margin: 0 12px 10px;
}

.workspace-label {
  margin-top: 32px;
}

.nav-list,
.quick-links {
  display: grid;
  gap: 6px;
}

.nav-item,
.quick-links a {
  min-width: 0;
  display: flex;
  align-items: center;
  text-decoration: none;
}

.nav-item {
  gap: 12px;
  min-height: 46px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #9da6cd;
  font-size: 12px;
  transition: color .2s ease, background-color .2s ease, border-color .2s ease;
}

.nav-item svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item em {
  flex: 0 0 auto;
  margin-right: auto;
  color: #6773a7;
  font-style: normal;
  font-size: 10px;
}

.nav-item:hover {
  color: #e9ebff;
  background: rgba(122, 140, 224, .1);
}

.nav-item.router-link-exact-active {
  color: #89ede2;
  border-color: rgba(121, 232, 222, .16);
  background: linear-gradient(90deg, rgba(85, 216, 205, .15), rgba(133, 111, 241, .1));
  box-shadow: inset -3px 0 #72e6db;
}

.nav-item.router-link-exact-active svg {
  filter: drop-shadow(0 0 5px rgba(114, 230, 219, .55));
}

.quick-links {
  gap: 5px;
}

.quick-links a {
  gap: 11px;
  min-height: 44px;
  padding: 0 13px;
  color: #939dc4;
  font-size: 11px;
  border-radius: 10px;
  transition: color .2s ease, background-color .2s ease;
}

.quick-links a:hover {
  color: #fff;
  background: rgba(122, 140, 224, .08);
}

.quick-icon {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  font-size: 13px;
}

.purple { color: #ce9aff; background: rgba(178, 112, 255, .13); }
.teal { color: #78e7df; background: rgba(79, 222, 209, .13); }
.orange { color: #ffc783; background: rgba(255, 185, 89, .13); }

.quick-links b {
  min-width: 17px;
  flex: 0 0 auto;
  margin-right: auto;
  padding: 1px 3px;
  text-align: center;
  color: #1b2252;
  background: #79e6db;
  border-radius: 9px;
  font-size: 9px;
}

.sidebar-bottom {
  margin-top: auto;
  padding-top: 24px;
}

.ocean-tip {
  display: flex;
  gap: 9px;
  padding: 12px 11px;
  border: 1px solid rgba(130, 145, 220, .12);
  border-radius: 13px;
  background: rgba(25, 32, 78, .62);
}

.ocean-tip > span {
  flex: 0 0 auto;
  color: #c38aff;
  font-size: 17px;
}

.ocean-tip > div {
  min-width: 0;
}

.ocean-tip strong {
  display: block;
  color: #c5cbea;
  font-size: 10px;
}

.ocean-tip p {
  margin: 3px 0 0;
  color: #7883b0;
  font-size: 9px;
  line-height: 1.6;
}

.logout-btn {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 10px 12px;
  border: 0;
  border-top: 1px solid rgba(144, 157, 220, .12);
  color: #8893bd;
  background: transparent;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease;
}

.logout-btn:hover {
  color: #ff9daf;
}

.logout-btn svg {
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.close-btn:focus-visible,
.nav-item:focus-visible,
.quick-links a:focus-visible,
.logout-btn:focus-visible {
  outline: 2px solid #79e6db;
  outline-offset: 2px;
}

@media (max-width: 760px) {
  .close-btn {
    display: grid;
  }
}

@media (max-height: 680px) and (max-width: 760px) {
  .sidebar {
    padding-top: max(16px, env(safe-area-inset-top));
  }

  .profile-card {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .workspace-label {
    margin-top: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .quick-links a,
  .logout-btn {
    transition: none;
  }
}
</style>
