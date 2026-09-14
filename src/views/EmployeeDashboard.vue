<template>
  <section class="employee-dashboard" dir="rtl">
    <!-- الترويسة الترحيبية -->
    <div class="page-topline">
      <div>
        <span class="eyebrow">{{ currentDate }}</span>
        <h2>مرحباً بك، {{ currentUserName }} 👋</h2>
        <p>إليك نظرة عامة على أدائك ومهامك العاجلة لهذا اليوم.</p>
      </div>
    </div>

    <!-- حالة التحميل -->
    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تحميل مساحة العمل...
    </div>

    <div v-else-if="dashboardData" class="dashboard-content">
      
      <!-- ========================================== -->
      <!-- 1. إحصائيات مهام المشاريع (Tasks Stats)      -->
      <!-- ========================================== -->
      <div class="stats-section mb-4">
        <h3 class="section-title">📊 إحصائيات مهام المشاريع</h3>
        <div class="stats-grid">
          <article class="stat-card blue-card">
            <div class="stat-info">
              <small>إجمالي المهام الموكلة</small>
              <strong>{{ dashboardData.stats.tasks.total }}</strong>
            </div>
            <div class="stat-icon">🎯</div>
          </article>
          
          <article class="stat-card green-card">
            <div class="stat-info">
              <small>المهام المكتملة</small>
              <strong>{{ dashboardData.stats.tasks.completed }}</strong>
            </div>
            <div class="stat-icon">✅</div>
          </article>
          
          <article class="stat-card orange-card">
            <div class="stat-info">
              <small>قيد العمل والمراجعة</small>
              <strong>{{ dashboardData.stats.tasks.pending }}</strong>
            </div>
            <div class="stat-icon">⏳</div>
          </article>
          
          <article class="stat-card" :class="dashboardData.stats.tasks.overdue > 0 ? 'red-card pulse-danger' : 'gray-card'">
            <div class="stat-info">
              <small>المهام المتأخرة</small>
              <strong>{{ dashboardData.stats.tasks.overdue }}</strong>
            </div>
            <div class="stat-icon">🚨</div>
          </article>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- 2. إحصائيات منشورات الخطط (Posts Stats)    -->
      <!-- ========================================== -->
      <div class="stats-section mb-4">
        <h3 class="section-title">📝 إحصائيات محتوى الخطط</h3>
        <div class="stats-grid">
          <article class="stat-card purple-card">
            <div class="stat-info">
              <small>إجمالي المنشورات الموكلة</small>
              <strong>{{ dashboardData.stats.posts.total }}</strong>
            </div>
            <div class="stat-icon">🎯</div>
          </article>
          
          <article class="stat-card green-card">
            <div class="stat-info">
              <small>المنشورات المسلمة</small>
              <strong>{{ dashboardData.stats.posts.completed }}</strong>
            </div>
            <div class="stat-icon">✅</div>
          </article>
          
          <article class="stat-card orange-card">
            <div class="stat-info">
              <small>قيد التنفيذ والمراجعة</small>
              <strong>{{ dashboardData.stats.posts.pending }}</strong>
            </div>
            <div class="stat-icon">⏳</div>
          </article>
          
          <article class="stat-card" :class="dashboardData.stats.posts.overdue > 0 ? 'red-card pulse-danger' : 'gray-card'">
            <div class="stat-info">
              <small>المنشورات المتأخرة</small>
              <strong>{{ dashboardData.stats.posts.overdue }}</strong>
            </div>
            <div class="stat-icon">🚨</div>
          </article>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- 3. الشبكة الرئيسية (Main Grid)               -->
      <!-- ========================================== -->
      <div class="main-grid mt-4">
        
        <!-- قسم الـ KPI (مؤشر الأداء) -->
        <div class="glass-card kpi-section">
          <h3 class="card-title">📈 أداء الشهر الحالي</h3>
          <div class="circular-progress-wrapper">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                :stroke-dasharray="`${dashboardData.kpi.completion_rate}, 100`"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage">{{ dashboardData.kpi.completion_rate }}%</text>
            </svg>
          </div>
          <p class="kpi-desc text-center mt-3">
            لقد أنجزت <strong class="text-green">{{ dashboardData.kpi.completion_rate }}%</strong> من المهام المطلوبة منك هذا الشهر.
            <br>
            <span class="muted text-sm">(إجمالي مهام الشهر: {{ dashboardData.kpi.total_this_month }})</span>
          </p>
        </div>

        <!-- قسم المهام العاجلة -->
        <div class="glass-card priorities-section">
          <div class="card-header">
            <div class="d-flex align-items-center gap-2">
              <h3 class="card-title">⚡ مهام المشاريع العاجلة</h3>
              <span class="badge">{{ dashboardData.priorities.upcoming_tasks.length }} مهام</span>
            </div>
            <!-- زر الذهاب لصفحة المشاريع إذا كان يمتلك مهام -->
            <router-link v-if="dashboardData.stats.tasks.total > 0" to="/projects" class="view-all-link">
              عرض كل المشاريع ↗
            </router-link>
          </div>
          <div class="items-list">
            <div v-if="dashboardData.priorities.upcoming_tasks.length === 0" class="muted text-center py-4">لا توجد مهام عاجلة حالياً. عمل رائع! 🎉</div>
            
            <div v-for="task in dashboardData.priorities.upcoming_tasks" :key="task.id" 
                 class="priority-item" 
                 :class="getDeadlineStatus(task.created_at, task.due_date, task.status).class + '-border'">
              
              <div class="item-header">
                <strong>{{ task.title }}</strong>
                <span class="project-tag">{{ task.project?.name }}</span>
              </div>
              
              <div class="item-footer mt-2">
                <div class="sla-indicator">
                  <span class="sla-msg" :class="getDeadlineStatus(task.created_at, task.due_date, task.status).class + '-text'">
                    🕒 {{ getDeadlineStatus(task.created_at, task.due_date, task.status).message }}
                  </span>
                  <div class="sla-progress-bg">
                    <div class="sla-progress-fill" :class="getDeadlineStatus(task.created_at, task.due_date, task.status).class + '-bg'" :style="{ width: getDeadlineStatus(task.created_at, task.due_date, task.status).percentage + '%' }"></div>
                  </div>
                </div>
                <router-link :to="`/projects/${task.project_id}`" class="action-link">الذهاب للمشروع ↗</router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- قسم محتوى الخطط العاجلة -->
        <div class="glass-card priorities-section">
          <div class="card-header">
            <div class="d-flex align-items-center gap-2">
              <h3 class="card-title">📝 منشورات مطلوبة للخطط</h3>
              <span class="badge">{{ dashboardData.priorities.upcoming_posts.length }} منشورات</span>
            </div>
            <!-- زر الذهاب لصفحة مهام الخطط إذا كان يمتلك خطط/مهام -->
            <router-link v-if="dashboardData.stats.posts.total > 0 || dashboardData.stats.total_plans > 0" to="/my-tasks" class="view-all-link">
              عرض كل المهام ↗
            </router-link>
          </div>
          <div class="items-list">
            <div v-if="dashboardData.priorities.upcoming_posts.length === 0" class="muted text-center py-4">لا يوجد محتوى متأخر. أنت في السليم! 🟢</div>
            
            <div v-for="post in dashboardData.priorities.upcoming_posts" :key="post.id" 
                 class="priority-item" 
                 :class="getDeadlineStatus(post.created_at, post.deadline, 'pending').class + '-border'">
              
              <div class="item-header">
                <strong>{{ post.post_type || 'منشور' }} - {{ post.publishing_platform ? parsePlatforms(post.publishing_platform) : 'لم تحدد المنصة' }}</strong>
                <span class="project-tag client-tag">{{ post.plan?.client?.name }}</span>
              </div>
              <p class="post-desc muted mt-1">{{ post.detailed_idea || 'لا يوجد تفاصيل إضافية...' }}</p>
              
              <div class="item-footer mt-2">
                <div class="sla-indicator">
                  <span class="sla-msg" :class="getDeadlineStatus(post.created_at, post.deadline, 'pending').class + '-text'">
                    🕒 {{ getDeadlineStatus(post.created_at, post.deadline, 'pending').message }}
                  </span>
                  <div class="sla-progress-bg">
                    <div class="sla-progress-fill" :class="getDeadlineStatus(post.created_at, post.deadline, 'pending').class + '-bg'" :style="{ width: getDeadlineStatus(post.created_at, post.deadline, 'pending').percentage + '%' }"></div>
                  </div>
                </div>
                <router-link :to="`/plan-board/${post.content_plan_id}`" class="action-link">الذهاب للوحة ↗</router-link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../axios';

// استيراد المحرك الذكي لتلوين التواريخ
import { getDeadlineStatus } from '../utils/timeHelper';

const loading = ref(true);
const dashboardData = ref(null);

const currentUserName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name ? user.name.split(' ')[0] : 'زميلي العزيز'; // أخذ الاسم الأول فقط
  } catch (e) {
    return 'زميلي العزيز';
  }
});

const currentDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('ar-EG', options);
});

const parsePlatforms = (platformData) => {
  if (Array.isArray(platformData)) return platformData.join(', ');
  try {
    const parsed = JSON.parse(platformData);
    if (Array.isArray(parsed)) return parsed.join(', ');
  } catch (e) {
    return platformData;
  }
  return platformData;
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard/employee');
    dashboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
.employee-dashboard { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; }
.page-topline { margin-bottom: 25px; }
.eyebrow { color: #7de8dc; font-size: 13px; font-weight: 700; }
.page-topline h2 { margin: 5px 0; font-size: 32px; font-weight: 800; color: #fff; }
.page-topline p { color: #9ba3c4; font-size: 14px; margin: 0; }

.state-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #7d89b6; font-size: 16px; }
.spinner { display: inline-block; border: 3px solid rgba(125, 232, 220, 0.25); border-top-color: #7de8dc; border-radius: 50%; animation: spin 1s linear infinite; }
.spinner.large { width: 40px; height: 40px; margin-bottom: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 1. Stats Grid */
.mb-4 { margin-bottom: 25px; }
.section-title { font-size: 16px; color: #eef0ff; font-weight: 700; margin-bottom: 12px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }

/* تطابق مع شكل الكروت في الصورة image_09b5a9.png */
.stat-card { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; /* الأيقونة على اليسار والنص على اليمين */
  padding: 20px; 
  border-radius: 12px; 
  background: rgba(10, 15, 44, 0.7); /* لون داكن كما في الصورة */
  border: 1px solid rgba(137, 153, 226, 0.15); 
  transition: transform 0.2s, box-shadow 0.2s; 
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
.stat-info { display: flex; flex-direction: column; text-align: right; }
.stat-info small { color: #818cb9; font-size: 12px; margin-bottom: 5px; font-weight: 600; }
.stat-info strong { font-size: 26px; color: #fff; line-height: 1; font-weight: 800; }

.stat-icon { 
  width: 45px; 
  height: 45px; 
  display: grid; 
  place-items: center; 
  font-size: 24px; 
  background: rgba(255,255,255,0.03); 
  border-radius: 10px; 
}

/* ألوان السفلية (Bottom Border) للكروت */
.blue-card { border-bottom: 3px solid #60a5fa; }
.green-card { border-bottom: 3px solid #34d399; }
.orange-card { border-bottom: 3px solid #fbbf24; }
.purple-card { border-bottom: 3px solid #c084fc; }
.red-card { border-bottom: 3px solid #ef4444; background: rgba(239, 68, 68, 0.05); }
.gray-card { border-bottom: 3px solid #64748b; opacity: 0.8; }

.pulse-danger { animation: pulse-border 2s infinite; }
@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

/* 2. Main Grid */
.main-grid { display: grid; grid-template-columns: 300px 1fr 1fr; gap: 20px; align-items: start; }
.glass-card { background: rgba(15, 22, 61, 0.65); border: 1px solid rgba(137, 153, 226, 0.15); border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.d-flex { display: flex; }
.align-items-center { align-items: center; }
.gap-2 { gap: 8px; }
.card-title { margin: 0; font-size: 18px; color: #fff; }
.badge { background: rgba(137, 153, 226, 0.15); color: #8fc9ff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; }

/* View All Link */
.view-all-link {
  font-size: 12px;
  color: #7de8dc;
  text-decoration: none;
  font-weight: 600;
  transition: 0.2s;
  background: rgba(125, 232, 220, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(125, 232, 220, 0.1);
}
.view-all-link:hover {
  background: rgba(125, 232, 220, 0.15);
  color: #fff;
}

/* SVG Circular Progress */
.kpi-section { display: flex; flex-direction: column; align-items: center; }
.circular-progress-wrapper { width: 150px; margin: 20px auto; }
.circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 250px; }
.circle-bg { fill: none; stroke: rgba(137, 153, 226, 0.1); stroke-width: 2.5; }
.circle { fill: none; stroke: #34d399; stroke-width: 2.5; stroke-linecap: round; animation: progress 1s ease-out forwards; }
.percentage { fill: #fff; font-family: 'Cairo', sans-serif; font-size: 8px; font-weight: 800; text-anchor: middle; }
@keyframes progress { 0% { stroke-dasharray: 0 100; } }
.kpi-desc { font-size: 13px; color: #aab5da; line-height: 1.6; }

/* Priority Lists */
.items-list { display: flex; flex-direction: column; gap: 12px; }
.priority-item { background: rgba(6, 11, 37, 0.4); padding: 15px; border-radius: 12px; border: 1px solid rgba(137, 153, 226, 0.1); transition: 0.2s; }
.priority-item:hover { transform: translateX(-5px); background: rgba(10, 16, 47, 0.6); }

.item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.item-header strong { font-size: 14px; color: #eef0ff; line-height: 1.4; }
.project-tag { font-size: 10px; padding: 3px 8px; background: rgba(143, 201, 255, 0.15); color: #8fc9ff; border-radius: 6px; white-space: nowrap; }
.client-tag { background: rgba(192, 132, 252, 0.15); color: #c084fc; }
.post-desc { font-size: 11px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }

.item-footer { display: flex; justify-content: space-between; align-items: flex-end; }
.action-link { font-size: 11px; color: #7de8dc; text-decoration: none; font-weight: bold; background: rgba(125, 232, 220, 0.1); padding: 4px 10px; border-radius: 6px; transition: 0.2s; }
.action-link:hover { background: rgba(125, 232, 220, 0.2); }

/* SLA Smart Colors */
.sla-indicator { display: flex; flex-direction: column; gap: 3px; min-width: 140px; }
.sla-msg { font-size: 11px; font-weight: bold; }
.sla-progress-bg { height: 4px; background: rgba(0, 0, 0, 0.3); border-radius: 2px; width: 100%; overflow: hidden; }
.sla-progress-fill { height: 100%; border-radius: 2px; }

.dl-completed-border { border-right: 4px solid #25d366 !important; }
.dl-safe-border { border-right: 4px solid #25d366 !important; }
.dl-warning-border { border-right: 4px solid #f59e0b !important; }
.dl-danger-border { border-right: 4px solid #f97316 !important; }
.dl-urgent-border { border-right: 4px solid #ef4444 !important; }
.dl-late-border { border-right: 4px solid #dc2626 !important; }
.dl-critical-border { border-right: 4px solid #991b1b !important; animation: pulse-critical 2s infinite; }

.dl-completed-text, .dl-safe-text { color: #34d399 !important; }
.dl-warning-text { color: #fbbf24 !important; }
.dl-danger-text { color: #fb923c !important; }
.dl-urgent-text, .dl-late-text, .dl-critical-text { color: #f87171 !important; }

.dl-completed-bg, .dl-safe-bg { background: #34d399 !important; }
.dl-warning-bg { background: #fbbf24 !important; }
.dl-danger-bg { background: #fb923c !important; }
.dl-urgent-bg, .dl-late-bg, .dl-critical-bg { background: #f87171 !important; }

.text-green { color: #34d399; }
.muted { color: #64748b; }
.text-sm { font-size: 11px; }
.text-center { text-align: center; }
.mt-3 { margin-top: 15px; }
.mt-4 { margin-top: 25px; }
.py-4 { padding-top: 20px; padding-bottom: 20px; }

@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr 1fr; }
  .kpi-section { grid-column: 1 / -1; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 30px; text-align: right; }
  .circular-progress-wrapper { margin: 0; width: 120px; }
  .kpi-desc { text-align: right !important; margin-top: 0; }
}

@media (max-width: 768px) {
  .main-grid { grid-template-columns: 1fr; }
  .kpi-section { grid-template-columns: 1fr; text-align: center; gap: 15px; }
  .kpi-desc { text-align: center !important; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .page-topline h2 { font-size: 24px; }
  .card-header { flex-direction: column; align-items: flex-start; }
}
</style>