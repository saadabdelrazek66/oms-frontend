<template>
  <aside class="sidebar" dir="rtl" aria-label="القائمة الجانبية">
    <!-- خلفية التأثيرات الضوئية المعزولة عن التمرير -->
    <div class="sidebar-glow-bg" aria-hidden="true">
      <div class="glow-orb glow-top"></div>
      <div class="glow-orb glow-bottom"></div>
    </div>

    <!-- الحاوية الداخلية المرنة لحل مشكلة الفراغ والتمرير -->
    <div class="sidebar-inner">
      <!-- الشعار وهوية النظام -->
      <div class="brand">
        <router-link to="/" class="brand-link" title="Octo Media">
          <div class="brand-icon" aria-hidden="true">
            <img src="/logo.png" alt="Octo Media" class="brand-logo-img" />
          </div>
          <div class="brand-copy">
            <strong>OCTO<span>SPACE</span></strong>
            <small>مساحة فريقك الذكية</small>
          </div>
        </router-link>
        <button class="close-btn" type="button" aria-label="إغلاق القائمة" @click="$emit('close')">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <!-- بطاقة المستخدم وحالته المحدثة -->
      <div class="profile-card">
        <div class="avatar" aria-hidden="true">{{ userInitial }}</div>
        <div class="profile-copy">
          <strong>{{ userName }}</strong>
          <span><i aria-hidden="true"></i> متصل الآن</span>
        </div>
        <span class="role-badge" :class="role === 'manager' ? 'badge-manager' : 'badge-employee'">
          {{ role === 'manager' ? 'مدير' : 'موظف' }}
        </span>
      </div>

      <!-- التنقل المقسم لمجموعات وظيفية ذكية واحترافية -->
      <nav class="sidebar-nav-groups" aria-label="التنقل الرئيسي">

        <!-- ================= 1. مجموعة العمل اليومي ================= -->
        <div class="nav-group">
          <div class="nav-group-header">
            <span class="group-dot dot-cyan"></span>
            <span class="group-title">العمل اليومي</span>
          </div>

          <div class="nav-group-items">
            <!-- الرئيسية (مدير) -->
            <router-link v-if="role === 'manager'" class="nav-item" to="/manager/dashboard">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <span class="nav-label">الرئيسية</span>
              <em class="nav-shortcut">⌘</em>
            </router-link>

            <!-- الرئيسية (موظف) -->
            <router-link v-if="role === 'employee'" class="nav-item" to="/employee/dashboard">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <span class="nav-label">الرئيسية</span>
              <em class="nav-shortcut">⌘</em>
            </router-link>

            <!-- مساحة العمل / مهامي -->
            <router-link to="/my-tasks" class="nav-item">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </span>
              <span class="nav-label">مساحة العمل (مهامي)</span>
            </router-link>

            <!-- المهام السريعة -->
            <router-link to="/quick-tasks" class="nav-item">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span class="nav-label">المهام السريعة</span>
              <em class="nav-shortcut">Q</em>
            </router-link>
          </div>
        </div>

        <div class="nav-divider"></div>

        <!-- ================= 2. مجموعة المشاريع وخطط المحتوى ================= -->
        <div class="nav-group">
          <div class="nav-group-header">
            <span class="group-dot dot-purple"></span>
            <span class="group-title">المشاريع والمحتوى</span>
          </div>

          <div class="nav-group-items">
            <!-- المشاريع -->
            <router-link class="nav-item" to="/projects">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span class="nav-label">المشاريع</span>
              <em class="nav-shortcut">P</em>
            </router-link>

            <!-- خطط المحتوى (للمدير و Account Manager) -->
            <router-link
              v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')"
              class="nav-item"
              to="/content-plans"
            >
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                </svg>
              </span>
              <span class="nav-label">خطط المحتوى</span>
              <span class="nav-badge-pill">إدارة</span>
            </router-link>

            <!-- جداول خطط المحتوى (شيت المنشورات) -->
            <router-link class="nav-item" to="/plan-contents">
              <span class="nav-icon-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M3 15h18"></path>
                  <path d="M9 3v18"></path>
                  <path d="M15 3v18"></path>
                </svg>
              </span>
              <span class="nav-label">جداول المنشورات</span>
              <em class="nav-shortcut">L</em>
            </router-link>
          </div>
        </div>

        <!-- ================= 3. مجموعة العملاء والأصول ================= -->
        <template v-if="canManageAccounts(currentUser) || role === 'manager'">
          <div class="nav-divider"></div>
          <div class="nav-group">
            <div class="nav-group-header">
              <span class="group-dot dot-blue"></span>
              <span class="group-title">العملاء والأصول</span>
            </div>

            <div class="nav-group-items">
              <!-- العملاء والشركات -->
              <router-link v-if="canManageAccounts(currentUser)" class="nav-item" to="/manager/clients">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span class="nav-label">العملاء والشركات</span>
                <em class="nav-shortcut">C</em>
              </router-link>

              <!-- خزنة العملاء -->
              <router-link v-if="role === 'manager'" class="nav-item" to="/app/client-vault">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <circle cx="12" cy="11" r="2"></circle>
                    <line x1="12" y1="13" x2="12" y2="16"></line>
                  </svg>
                </span>
                <span class="nav-label">خزنة العملاء</span>
                <span class="nav-badge-pill vault-pill">آمن</span>
              </router-link>
            </div>
          </div>
        </template>

        <!-- ================= 4. مجموعة الفريق والمنظومة (للمدير فقط) ================= -->
        <template v-if="role === 'manager'">
          <div class="nav-divider"></div>
          <div class="nav-group">
            <div class="nav-group-header">
              <span class="group-dot dot-indigo"></span>
              <span class="group-title">الفريق والمنظومة</span>
            </div>

            <div class="nav-group-items">
              <!-- إدارة الأقسام -->
              <router-link class="nav-item" to="/manager/departments">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </span>
                <span class="nav-label">إدارة الأقسام</span>
                <em class="nav-shortcut">D</em>
              </router-link>

              <!-- إدارة المستخدمين -->
              <router-link class="nav-item" to="/manager/users">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </span>
                <span class="nav-label">إدارة المستخدمين</span>
                <em class="nav-shortcut">U</em>
              </router-link>
            </div>
          </div>
        </template>

        <!-- ================= 5. مجموعة النظام والمحفوظات (للمدير فقط) ================= -->
        <template v-if="role === 'manager'">
          <div class="nav-divider"></div>
          <div class="nav-group">
            <div class="nav-group-header">
              <span class="group-dot dot-amber"></span>
              <span class="group-title">النظام والمحفوظات</span>
            </div>

            <div class="nav-group-items">
              <!-- سجل النظام -->
              <router-link class="nav-item" to="/system-logs">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </span>
                <span class="nav-label">سجل النظام والنشاطات</span>
              </router-link>

              <!-- سلة المهملات -->
              <router-link class="nav-item trash-item" to="/trash">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </span>
                <span class="nav-label">سلة المهملات</span>
                <em class="nav-shortcut">T</em>
              </router-link>

              <!-- إعدادات النظام -->
              <router-link class="nav-item" to="/settings">
                <span class="nav-icon-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span class="nav-label">إعدادات النظام</span>
                <em class="nav-shortcut">S</em>
              </router-link>
            </div>
          </div>
        </template>
      </nav>

      <!-- نصيحة اليوم وبطاقة الإلهام في الأسفل -->
      <div class="sidebar-bottom">
        <div class="ocean-tip">
          <span aria-hidden="true" class="tip-star">✧</span>
          <div class="tip-body">
            <strong>نصيحة اليوم</strong>
            <p>أنجز مهامك بتركيز، خطوة واحدة في كل مرة تصنع فارقاً كبيراً.</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { canManageAccounts } from '@/utils/permissions'

const role = ref(localStorage.getItem('role') || 'employee')
const router = useRouter()

// كائن المستخدم الحالي لتحديد الصلاحيات
const currentUser = ref(null)
try {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  }
} catch (e) {
  console.error('خطأ في قراءة بيانات المستخدم:', e)
}
if (!currentUser.value && role.value) {
  currentUser.value = { role: role.value }
}
const user = currentUser

// متغيرات حالة المستخدم
const userName = ref('جاري التحميل...')
const userInitial = ref('')

// استخراج بيانات المستخدم عند تحميل المكون
onMounted(() => {
  const storedUser = localStorage.getItem('user')

  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser)
      currentUser.value = userObj
      if (userObj && userObj.name) {
        // أخذ الاسم الأول فقط
        const firstName = userObj.name.split(' ')[0]
        userName.value = firstName
        // أخذ أول حرف للأفاتار
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

// دالة مساعدة لتعيين القيم الافتراضية
const setFallbackUser = () => {
  userName.value = role.value === 'manager' ? 'مساحة المدير' : 'مساحة الموظف'
  userInitial.value = role.value === 'manager' ? 'م' : 'و'
}

defineEmits(['close'])

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('user')
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
  height: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(145, 160, 231, 0.25) transparent;
  color: #e9ebff;
  background: linear-gradient(180deg, #11163d 0%, #0c1231 68%, #0b102b 100%);
  border-left: 1px solid rgba(145, 160, 231, 0.16);
  font-family: 'Cairo', sans-serif;
}

.sidebar::-webkit-scrollbar {
  width: 5px;
}
.sidebar::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(145, 160, 231, 0.22);
  border-radius: 10px;
}
.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(125, 232, 220, 0.45);
}

.sidebar-glow-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.glow-top {
  width: 240px;
  height: 240px;
  left: -155px;
  top: 80px;
  background: #7448db;
  opacity: 0.13;
  filter: blur(40px);
}

.glow-bottom {
  width: 180px;
  height: 180px;
  right: -130px;
  bottom: 20px;
  background: #43d9cf;
  opacity: 0.08;
  filter: blur(35px);
}

.sidebar-inner {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: max(20px, env(safe-area-inset-top)) 14px max(20px, env(safe-area-inset-bottom));
  position: relative;
  z-index: 1;
}

.brand,
.profile-card,
.sidebar-nav-groups,
.sidebar-bottom {
  position: relative;
  z-index: 1;
}

/* ================= رأس السايدبار والشعار ================= */
.brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 11px;
  min-width: 0;
  padding: 0 6px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  flex: 1 1 auto;
}

.brand-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(145, 160, 231, 0.18);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  padding: 4px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
  backdrop-filter: blur(10px);
}

.brand-link:hover .brand-icon {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(125, 232, 220, 0.4);
  box-shadow: 0 8px 24px rgba(125, 232, 220, 0.25);
}

.brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(125, 232, 220, 0.25));
}

.brand-copy {
  min-width: 0;
}

.brand strong {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  letter-spacing: 1.1px;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
}

.brand strong span {
  color: #7de8dc;
}

.brand small {
  display: block;
  overflow: hidden;
  color: #8f9ac9;
  font-size: 9.5px;
  margin-top: 1px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.close-btn {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: none;
  place-items: center;
  margin-right: auto;
  padding: 0;
  color: #8993bf;
  border: 0;
  border-radius: 10px;
  background: transparent;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

/* ================= بطاقة المستخدم ================= */
.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin: 18px 0 16px;
  padding: 10px 12px;
  border: 1px solid rgba(143, 157, 226, 0.14);
  border-radius: 14px;
  background: rgba(34, 41, 92, 0.48);
  backdrop-filter: blur(8px);
}

.avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #12183f;
  background: linear-gradient(135deg, #7de8dc, #b28aff);
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(125, 232, 220, 0.22);
}

.profile-copy {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.profile-copy strong {
  display: block;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 700;
  color: #f1f4ff;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.profile-copy span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7b88bc;
  font-size: 9px;
  margin-top: 2px;
}

.profile-copy i {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.role-badge {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
}

.role-badge.badge-manager {
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
}

.role-badge.badge-employee {
  color: #bc92ff;
  background: rgba(174, 116, 255, 0.12);
  border: 1px solid rgba(174, 116, 255, 0.25);
}

/* ================= المجموعات الوظيفية للتنقل ================= */
.sidebar-nav-groups {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px 4px;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-cyan {
  background: #7de8dc;
  box-shadow: 0 0 7px rgba(125, 232, 220, 0.7);
}

.dot-purple {
  background: #b28aff;
  box-shadow: 0 0 7px rgba(178, 138, 255, 0.7);
}

.dot-blue {
  background: #60a5fa;
  box-shadow: 0 0 7px rgba(96, 165, 250, 0.7);
}

.dot-indigo {
  background: #818cf8;
  box-shadow: 0 0 7px rgba(129, 140, 248, 0.7);
}

.dot-amber {
  background: #fbbf24;
  box-shadow: 0 0 7px rgba(251, 191, 36, 0.7);
}

.group-title {
  font-size: 10.5px;
  font-weight: 800;
  color: #7c8bbd;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.nav-divider {
  height: 1px;
  margin: 8px 6px;
  background: linear-gradient(90deg, transparent, rgba(145, 160, 231, 0.16) 20%, rgba(125, 232, 220, 0.16) 80%, transparent);
}

.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* ================= عنصر التنقل (Nav Item) ================= */
.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 42px;
  padding: 0 10px;
  border-radius: 11px;
  border: 1px solid transparent;
  color: #9aa8d6;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

.nav-item:hover {
  color: #ffffff;
  background: rgba(125, 232, 220, 0.08);
  border-color: rgba(125, 232, 220, 0.18);
  transform: translateX(-3px);
}

.nav-item.router-link-active,
.nav-item.router-link-exact-active {
  color: #7de8dc;
  font-weight: 700;
  background: linear-gradient(90deg, rgba(125, 232, 220, 0.14) 0%, rgba(99, 102, 241, 0.1) 100%);
  border-color: rgba(125, 232, 220, 0.28);
  box-shadow: inset -3px 0 0 #7de8dc, 0 4px 14px rgba(125, 232, 220, 0.06);
}

/* صندوق الأيقونة الموحد والأنيق */
.nav-icon-box {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(137, 153, 226, 0.12);
  color: inherit;
  transition: all 0.22s ease;
}

.nav-icon-box svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.nav-item:hover .nav-icon-box {
  background: rgba(125, 232, 220, 0.14);
  border-color: rgba(125, 232, 220, 0.35);
  color: #7de8dc;
}

.nav-item:hover .nav-icon-box svg {
  transform: scale(1.08);
}

.nav-item.router-link-active .nav-icon-box,
.nav-item.router-link-exact-active .nav-icon-box {
  background: rgba(125, 232, 220, 0.2);
  border-color: #7de8dc;
  color: #7de8dc;
  box-shadow: 0 0 10px rgba(125, 232, 220, 0.25);
}

.nav-item.router-link-active .nav-icon-box svg,
.nav-item.router-link-exact-active .nav-icon-box svg {
  filter: drop-shadow(0 0 5px rgba(125, 232, 220, 0.6));
}

.nav-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-shortcut {
  flex: 0 0 auto;
  margin-right: auto;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.15);
  color: #7b8ab8;
  font-style: normal;
  font-size: 9.5px;
  font-weight: 700;
  font-family: inherit;
  line-height: 1.3;
}

.nav-badge-pill {
  flex: 0 0 auto;
  margin-right: auto;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.25);
}

.nav-badge-pill.vault-pill {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

/* تأثير خاص لسلة المهملات */
.trash-item:hover {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
  color: #fca5a5;
}

.trash-item:hover .nav-icon-box {
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

/* ================= أسفل السايدبار ================= */
.sidebar-bottom {
  margin-top: auto;
  padding-top: 20px;
}

.ocean-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid rgba(130, 145, 220, 0.14);
  border-radius: 13px;
  background: rgba(25, 32, 78, 0.55);
  backdrop-filter: blur(8px);
}

.tip-star {
  flex: 0 0 auto;
  color: #b28aff;
  font-size: 16px;
  line-height: 1.2;
}

.tip-body {
  min-width: 0;
}

.tip-body strong {
  display: block;
  color: #cdd6f8;
  font-size: 10px;
  font-weight: 700;
}

.tip-body p {
  margin: 3px 0 0;
  color: #7b88bc;
  font-size: 9px;
  line-height: 1.5;
}

.close-btn:focus-visible,
.nav-item:focus-visible {
  outline: 2px solid #7de8dc;
  outline-offset: 2px;
}

@media (max-width: 1024px) {
  .close-btn {
    display: grid;
  }
}

@media (max-height: 680px) and (max-width: 1024px) {
  .sidebar-inner {
    padding-top: max(14px, env(safe-area-inset-top));
  }

  .profile-card {
    margin-top: 12px;
    margin-bottom: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item {
    transition: none;
  }
}
</style>
