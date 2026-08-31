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
      <div>
        <strong>OCTO<span>SPACE</span></strong>
        <small>مساحة فريقك الذكية</small>
      </div>
      <button class="close-btn" type="button" aria-label="إغلاق القائمة" @click="$emit('close')">
        ×
      </button>
    </div>

    <div class="profile-card">
      <div class="avatar">{{ role === 'manager' ? 'م' : 'و' }}</div>
      <div class="profile-copy">
        <strong>{{ role === 'manager' ? 'مساحة المدير' : 'مساحة الموظف' }}</strong>
        <span><i></i> متصل الآن</span>
      </div>
      <span class="role-badge">{{ role === 'manager' ? 'مدير' : 'موظف' }}</span>
    </div>

    <p class="section-label">القائمة الرئيسية</p>
    <nav class="nav-list">
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

      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/users">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>إدارة المستخدمين</span><em>U</em>
      </router-link>

      <router-link v-if="role === 'manager'" class="nav-item" to="/manager/content-plans">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>الخطط</span><em>P</em>
      </router-link>

      <router-link v-if="role === 'employee'" class="nav-item" to="/employee/content-plans">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>الخطط</span><em>P</em>
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
        <span>✧</span>
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
  width: 286px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 27px 18px 20px;
  position: relative;
  overflow: hidden;
  color: #e9ebff;
  background: linear-gradient(180deg, #11163d 0%, #0c1231 68%, #0b102b 100%);
  border-left: 1px solid rgba(145, 160, 231, 0.16);
  font-family: 'Cairo', sans-serif;
}
.sidebar::before {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  left: -155px;
  top: 80px;
  border-radius: 50%;
  background: #7448db;
  opacity: 0.13;
  filter: blur(40px);
  pointer-events: none;
}
.sidebar::after {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  right: -130px;
  bottom: 20px;
  border-radius: 50%;
  background: #43d9cf;
  opacity: 0.08;
  filter: blur(35px);
  pointer-events: none;
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
  padding: 0 8px;
}
.brand-icon {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(140deg, #b865fc, #5d42d8);
  box-shadow: 0 9px 20px rgba(125, 70, 225, 0.3);
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
.brand strong {
  display: block;
  letter-spacing: 0.8px;
  font-size: 15px;
}
.brand strong span {
  color: #bd83ff;
}
.brand small {
  display: block;
  color: #7f89b8;
  font-size: 9px;
  margin-top: 1px;
}
.close-btn {
  display: none;
  margin-right: auto;
  color: #8993bf;
  border: 0;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 39px 0 32px;
  padding: 12px 11px;
  border: 1px solid rgba(143, 157, 226, 0.14);
  border-radius: 15px;
  background: rgba(34, 41, 92, 0.52);
}
.avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #241a56;
  background: linear-gradient(145deg, #88ece1, #a884ff);
  font-weight: 800;
}
.profile-copy {
  flex: 1;
}
.profile-copy strong {
  display: block;
  font-size: 11px;
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
  border-radius: 50%;
  background: #6ce6d9;
  box-shadow: 0 0 7px #6ce6d9;
}
.role-badge {
  padding: 3px 7px;
  border-radius: 6px;
  color: #bc92ff;
  background: rgba(174, 116, 255, 0.12);
  font-size: 9px;
}
.section-label {
  color: #6874a9;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
  margin: 0 12px 10px;
}
.workspace-label {
  margin-top: 32px;
}
.nav-list {
  display: grid;
  gap: 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #9da6cd;
  font-size: 12px;
  text-decoration: none;
  transition: 0.2s ease;
}
.nav-item svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nav-item em {
  margin-right: auto;
  color: #6773a7;
  font-style: normal;
  font-size: 10px;
}
.nav-item:hover {
  color: #e9ebff;
  background: rgba(122, 140, 224, 0.1);
}
.nav-item.router-link-exact-active {
  color: #89ede2;
  border-color: rgba(121, 232, 222, 0.16);
  background: linear-gradient(90deg, rgba(85, 216, 205, 0.15), rgba(133, 111, 241, 0.1));
  box-shadow: inset -3px 0 #72e6db;
}
.nav-item.router-link-exact-active svg {
  filter: drop-shadow(0 0 5px rgba(114, 230, 219, 0.55));
}
.quick-links {
  display: grid;
  gap: 5px;
}
.quick-links a {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 39px;
  padding: 0 13px;
  color: #939dc4;
  font-size: 11px;
  text-decoration: none;
  border-radius: 10px;
  transition: 0.2s;
}
.quick-links a:hover {
  color: #fff;
  background: rgba(122, 140, 224, 0.08);
}
.quick-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  font-size: 13px;
}
.purple {
  color: #ce9aff;
  background: rgba(178, 112, 255, 0.13);
}
.teal {
  color: #78e7df;
  background: rgba(79, 222, 209, 0.13);
}
.orange {
  color: #ffc783;
  background: rgba(255, 185, 89, 0.13);
}
.quick-links b {
  min-width: 17px;
  margin-right: auto;
  text-align: center;
  color: #1b2252;
  background: #79e6db;
  border-radius: 9px;
  font-size: 9px;
}
.sidebar-bottom {
  margin-top: auto;
}
.ocean-tip {
  display: flex;
  gap: 9px;
  padding: 12px 11px;
  border: 1px solid rgba(130, 145, 220, 0.12);
  border-radius: 13px;
  background: rgba(25, 32, 78, 0.62);
}
.ocean-tip > span {
  color: #c38aff;
  font-size: 17px;
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
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 12px;
  border: 0;
  border-top: 1px solid rgba(144, 157, 220, 0.12);
  color: #8893bd;
  background: transparent;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.logout-btn:hover {
  color: #ff9daf;
}
.logout-btn svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (max-width: 760px) {
  .sidebar {
    width: min(286px, 88vw);
    box-shadow: 20px 0 50px rgba(0, 0, 0, 0.35);
  }
  .close-btn {
    display: block;
  }
}
</style>
