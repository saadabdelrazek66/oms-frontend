<template>
  <section class="manager-dashboard" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">{{ currentDate }} | لوحة القيادة الإدارية 👑</span>
        <h2>مرحباً بك يا مدير، {{ currentUserName }}</h2>
        <p>إليك النظرة الشاملة لأداء الشركة، حالات الخطط، وفريق العمل.</p>
      </div>
    </div>

    <!-- حالة تحميل الداشبورد الرئيسية -->
    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تجميع بيانات الشركة...
    </div>

    <div v-else-if="dashboardData" class="dashboard-content">
      
      <!-- 1. النظرة العامة للمشاريع -->
      <div class="stats-section mb-4">
        <h3 class="section-title">🏢 النظرة العامة للمشاريع</h3>
        <div class="stats-grid">
          <article class="stat-card primary-card">
            <div class="stat-info"><small>إجمالي المشاريع</small><strong>{{ dashboardData.overview.projects.total }}</strong></div>
            <div class="stat-icon">📁</div>
          </article>
          <article class="stat-card blue-card">
            <div class="stat-info"><small>جاري التنفيذ</small><strong>{{ dashboardData.overview.projects.active }}</strong></div>
            <div class="stat-icon pulse-blue">⚙️</div>
          </article>
          <article class="stat-card green-card">
            <div class="stat-info"><small>مشاريع مكتملة</small><strong>{{ dashboardData.overview.projects.completed }}</strong></div>
            <div class="stat-icon">✅</div>
          </article>
          <article class="stat-card gray-card">
            <div class="stat-info"><small>مشاريع متوقفة</small><strong>{{ dashboardData.overview.projects.stopped }}</strong></div>
            <div class="stat-icon">⏸️</div>
          </article>
        </div>
      </div>

      <!-- 2. إحصائيات حالات خطط المحتوى -->
      <div class="stats-section mb-4">
        <h3 class="section-title">📝 مسار وحالات خطط المحتوى</h3>
        <div class="stats-grid grid-6">
          <article class="stat-card outline-card">
            <div class="stat-info"><small>إجمالي الخطط</small><strong>{{ dashboardData.plan_stats.total }}</strong></div>
            <div class="stat-icon">📑</div>
          </article>
          <article class="stat-card gray-card">
            <div class="stat-info"><small>معلقة / قيد التجهيز</small><strong>{{ dashboardData.plan_stats.pending }}</strong></div>
            <div class="stat-icon">✍️</div>
          </article>
          <article class="stat-card orange-card">
            <div class="stat-info"><small>قيد المراجعة</small><strong>{{ dashboardData.plan_stats.under_review }}</strong></div>
            <div class="stat-icon">🔎</div>
          </article>
          <article class="stat-card purple-card">
            <div class="stat-info"><small>تمت المراجعة</small><strong>{{ dashboardData.plan_stats.reviewed }}</strong></div>
            <div class="stat-icon">👁️</div>
          </article>
          <article class="stat-card green-card">
            <div class="stat-info"><small>مكتملة ومغلقة</small><strong>{{ dashboardData.plan_stats.completed }}</strong></div>
            <div class="stat-icon">🎯</div>
          </article>
          <article class="stat-card red-card">
            <div class="stat-info"><small>مرفوضة</small><strong>{{ dashboardData.plan_stats.rejected }}</strong></div>
            <div class="stat-icon">🛑</div>
          </article>
        </div>
      </div>

      <!-- 3. العمليات التشغيلية (مهام ومنشورات) -->
      <div class="stats-section mb-4">
        <h3 class="section-title">⚡ العمليات التشغيلية ومؤشرات التأخير</h3>
        <div class="stats-grid grid-5">
          <article class="stat-card outline-card">
            <div class="stat-info"><small>إجمالي المهام</small><strong>{{ dashboardData.global_stats.tasks.total }}</strong></div>
            <div class="stat-icon text-blue">📋</div>
          </article>
          <article class="stat-card" :class="dashboardData.global_stats.tasks.overdue > 0 ? 'red-card pulse-danger' : 'green-card'">
            <div class="stat-info"><small>مهام متأخرة</small><strong>{{ dashboardData.global_stats.tasks.overdue }}</strong></div>
            <div class="stat-icon">🚨</div>
          </article>
          <div class="vertical-divider"></div>
          <article class="stat-card outline-card">
            <div class="stat-info"><small>إجمالي المنشورات</small><strong>{{ dashboardData.global_stats.posts.total }}</strong></div>
            <div class="stat-icon text-purple">📱</div>
          </article>
          <article class="stat-card" :class="dashboardData.global_stats.posts.overdue > 0 ? 'red-card pulse-danger' : 'green-card'">
            <div class="stat-info"><small>منشورات متأخرة</small><strong>{{ dashboardData.global_stats.posts.overdue }}</strong></div>
            <div class="stat-icon">⏳</div>
          </article>
          <article class="stat-card dark-red-card" title="منشورات تم رفضها في المراجعة">
            <div class="stat-info"><small>منشورات مرفوضة</small><strong>{{ dashboardData.global_stats.posts.rejected }}</strong></div>
            <div class="stat-icon">❌</div>
          </article>
        </div>
      </div>

      <!-- 4. الرسوم البيانية -->
      <div class="charts-grid mb-4">
        <!-- مؤشر صحة النظام -->
        <div class="glass-card chart-card text-center">
          <h3 class="card-title">🩺 صحة النظام (System Health)</h3>
          <div class="circular-progress-wrapper mt-4">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <!-- 🔴 تم إضافة fill="none" هنا مباشرة لمنع ظهور الدائرة السوداء -->
              <path class="circle-bg" fill="none" stroke="rgba(137, 153, 226, 0.1)" stroke-width="2.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="kpi-circle" fill="none" stroke-width="2.5" stroke-linecap="round" :class="systemHealthColor" :stroke-dasharray="`${systemHealthRate}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" class="percentage">{{ systemHealthRate }}%</text>
            </svg>
          </div>
          <p class="muted text-sm mt-2">نسبة الإنجاز الكلي لجميع المهام والمنشورات.</p>
        </div>

        <!-- معدل الحرق (الإنجاز الفعلي) -->
        <div class="glass-card chart-card">
          <h3 class="card-title">🔥 معدل الحرق (الإنجاز الفعلي)</h3>
          <div class="progress-bars-container mt-4">
            
            <div class="progress-item mb-4" style="width: 100%;">
              <div class="progress-labels" style="display: flex; justify-content: space-between; width: 100%;">
                <span>مهام المشاريع</span>
                <strong>{{ tasksCompletionRate }}%</strong>
              </div>
              <!-- 🔴 تم إضافة width: 100% لضمان ظهور الشريط بشكل سليم -->
              <div class="progress-bar-bg" style="width: 100%; height: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; margin: 8px 0;">
                <div class="progress-bar-fill bg-blue" :style="{ width: tasksCompletionRate + '%', height: '100%', borderRadius: '5px', transition: 'width 0.8s ease' }"></div>
              </div>
              <small class="muted">{{ dashboardData.global_stats.tasks.completed }} من أصل {{ dashboardData.global_stats.tasks.total }} مكتمل</small>
            </div>

            <div class="progress-item" style="width: 100%;">
              <div class="progress-labels" style="display: flex; justify-content: space-between; width: 100%;">
                <span>محتوى الخطط</span>
                <strong>{{ postsCompletionRate }}%</strong>
              </div>
              <div class="progress-bar-bg" style="width: 100%; height: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; margin: 8px 0;">
                <div class="progress-bar-fill bg-purple" :style="{ width: postsCompletionRate + '%', height: '100%', borderRadius: '5px', transition: 'width 0.8s ease' }"></div>
              </div>
              <small class="muted">{{ dashboardData.global_stats.posts.completed }} من أصل {{ dashboardData.global_stats.posts.total }} مسلم</small>
            </div>

          </div>
        </div>
      </div>

      <!-- 5. مصفوفة أداء الفريق (Leaderboard with Deep Metrics) -->
      <div class="glass-card mb-4 table-container relative-container">
        
        <div v-if="loadingLeaderboard" class="inner-loading-overlay">
          <span class="spinner"></span>
        </div>

        <div class="card-header border-bottom pb-3 mb-3">
          <h3 class="card-title">👥 لوحة أداء وتأخيرات الفريق التفصيلية</h3>
          <span class="badge bg-amber">مرتبة من الأكثر تأخيراً</span>
        </div>
        
        <div class="table-responsive">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">#</th>
                <th style="min-width: 150px;">الموظف</th>
                <th>إجمالي المُسند</th>
                <th>قيد العمل ⏳</th>
                <th>مكتمل ✅</th>
                <th>متأخر 🚨</th>
                <th>الحالة والتقييم</th>
                <th>إجراء سريع</th>
              </tr>
            </thead>
            <tbody v-if="leaderboardData && leaderboardData.data.length > 0">
              <tr v-for="(user, index) in leaderboardData.data" :key="user.id" :class="getRowClass(user.health_status)">
                <td class="text-center" style="font-weight: 700; color: #8792be; width: 50px; vertical-align: middle;">{{ ((leaderboardData.current_page - 1) * (leaderboardData.per_page || 10)) + index + 1 }}</td>
                
                <!-- الموظف -->
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ getInitials(user.name) }}</div>
                    <div class="user-info"><strong>{{ user.name }}</strong></div>
                  </div>
                </td>
                
                <!-- إجمالي المُسند -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-white big-num">{{ user.metrics.total.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.total.overall > 0">
                      <span v-if="user.metrics.total.tasks > 0" class="sub-badge blue">📋 {{ user.metrics.total.tasks }} مهام</span>
                      <span v-if="user.metrics.total.exec_posts > 0" class="sub-badge purple">🖌️ {{ user.metrics.total.exec_posts }} تنفيذ</span>
                      <span v-if="user.metrics.total.rev_posts > 0" class="sub-badge gray">👁️ {{ user.metrics.total.rev_posts }} مراجعة</span>
                    </div>
                  </div>
                </td>
                
                <!-- قيد العمل -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-orange big-num">{{ user.metrics.pending.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.pending.overall > 0">
                      <span v-if="user.metrics.pending.tasks > 0" class="sub-item">📋 {{ user.metrics.pending.tasks }}</span>
                      <span v-if="user.metrics.pending.exec_posts > 0" class="sub-item">🖌️ {{ user.metrics.pending.exec_posts }}</span>
                      <span v-if="user.metrics.pending.rev_posts > 0" class="sub-item">👁️ {{ user.metrics.pending.rev_posts }}</span>
                    </div>
                  </div>
                </td>

                <!-- مكتمل -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-green big-num">{{ user.metrics.completed.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.completed.overall > 0">
                      <span v-if="user.metrics.completed.tasks > 0" class="sub-item">📋 {{ user.metrics.completed.tasks }}</span>
                      <span v-if="user.metrics.completed.exec_posts > 0" class="sub-item">🖌️ {{ user.metrics.completed.exec_posts }}</span>
                      <span v-if="user.metrics.completed.rev_posts > 0" class="sub-item">👁️ {{ user.metrics.completed.rev_posts }}</span>
                    </div>
                  </div>
                </td>

                <!-- متأخر -->
                <td>
                  <div class="metric-cell">
                    <strong :class="user.metrics.overdue.overall > 0 ? 'text-red pulse-text big-num' : 'text-gray big-num'">{{ user.metrics.overdue.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.overdue.overall > 0">
                      <span v-if="user.metrics.overdue.tasks > 0" class="sub-item text-red">📋 {{ user.metrics.overdue.tasks }}</span>
                      <span v-if="user.metrics.overdue.exec_posts > 0" class="sub-item text-red">🖌️ {{ user.metrics.overdue.exec_posts }}</span>
                      <span v-if="user.metrics.overdue.rev_posts > 0" class="sub-item text-red">👁️ {{ user.metrics.overdue.rev_posts }}</span>
                    </div>
                  </div>
                </td>
                
                <!-- الحالة -->
                <td>
                  <div class="health-cell">
                    <span :class="['health-badge', user.health_status]">
                      {{ getHealthLabel(user.health_status) }}
                    </span>
                    <small class="muted mt-1 text-center d-block">خطر: {{ user.overdue_rate }}%</small>
                  </div>
                </td>
                
                <!-- إجراء سريع -->
                <td>
                  <div style="display: flex; gap: 8px; justify-content: center;">
                    <button @click="sendWhatsAppWarning(user)" class="quick-action-btn warn-btn" :disabled="user.metrics.overdue.overall === 0" title="إرسال تنبيه بالمتأخرات">
                      ⚠️ تنبيه
                    </button>
                    <button @click="sendGeneralMessage(user)" class="quick-action-btn msg-btn" title="بدء محادثة واتساب">
                      💬 رسالة
                    </button>
                  </div>
                </td>
                
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="8" class="text-center py-4 muted">لا يوجد موظفين مسند إليهم أعمال في هذه الصفحة.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- أزرار التنقل (Pagination Controls) -->
        <div v-if="leaderboardData && leaderboardData.last_page > 1" class="pagination-controls mt-4">
          <button class="page-btn" :disabled="leaderboardData.current_page === 1" @click="fetchLeaderboard(leaderboardData.current_page - 1)">
            السابق
          </button>
          <span class="page-info">
            صفحة <strong>{{ leaderboardData.current_page }}</strong> من <strong>{{ leaderboardData.last_page }}</strong>
          </span>
          <button class="page-btn" :disabled="leaderboardData.current_page === leaderboardData.last_page" @click="fetchLeaderboard(leaderboardData.current_page + 1)">
            التالي
          </button>
        </div>

      </div>

    </div>
  </section>

    

</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../axios';

const loading = ref(true);
const loadingLeaderboard = ref(true);
const dashboardData = ref(null);
const leaderboardData = ref({ data: [], current_page: 1, last_page: 1 });

const currentUserName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name ? user.name.split(' ')[0] : 'أيها المدير';
  } catch (e) {
    return 'أيها المدير';
  }
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

// الحسابات الذكية
const tasksCompletionRate = computed(() => {
  if (!dashboardData.value || dashboardData.value.global_stats.tasks.total === 0) return 0;
  return Math.round((dashboardData.value.global_stats.tasks.completed / dashboardData.value.global_stats.tasks.total) * 100);
});
const postsCompletionRate = computed(() => {
  if (!dashboardData.value || dashboardData.value.global_stats.posts.total === 0) return 0;
  return Math.round((dashboardData.value.global_stats.posts.completed / dashboardData.value.global_stats.posts.total) * 100);
});
const systemHealthRate = computed(() => {
  if (!dashboardData.value) return 0;
  const total = dashboardData.value.global_stats.tasks.total + dashboardData.value.global_stats.posts.total;
  if (total === 0) return 100;
  const completed = dashboardData.value.global_stats.tasks.completed + dashboardData.value.global_stats.posts.completed;
  return Math.round((completed / total) * 100);
});
const systemHealthColor = computed(() => {
  if (systemHealthRate.value >= 75) return 'stroke-green';
  if (systemHealthRate.value >= 40) return 'stroke-yellow';
  return 'stroke-red';
});

// دوال مساعدة
const getInitials = (name) => name ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
const getHealthLabel = (status) => {
  if (status === 'safe') return '✅ سليم';
  if (status === 'warning') return '⚠️ حذر';
  return '🚨 خطر';
};
const getRowClass = (status) => {
  if (status === 'warning') return 'row-warning';
  if (status === 'danger') return 'row-danger';
  return '';
};

// واتساب


const sendGeneralMessage = (user) => {
  const message = `مرحباً ${user.name}،\n`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

const sendWhatsAppWarning = (user) => {
  if (user.metrics.overdue.overall === 0) return;
  
  let message = `مرحباً ${user.name}،\n\nيرجى الانتباه، لديك أعمال متأخرة عن موعد التسليم في النظام:\n`;
  if (user.metrics.overdue.tasks > 0) message += `- مهام مشاريع: ${user.metrics.overdue.tasks} متأخرة\n`;
  if (user.metrics.overdue.exec_posts > 0) message += `- منشورات خطط (كتنفيذ): ${user.metrics.overdue.exec_posts} متأخرة\n`;
  if (user.metrics.overdue.rev_posts > 0) message += `- منشورات خطط (كمراجعة): ${user.metrics.overdue.rev_posts} متأخرة\n`;
  
  message += `\nيرجى سرعة الإنجاز. بالتوفيق!`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard/manager');
    dashboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const fetchLeaderboard = async (page = 1) => {
  loadingLeaderboard.value = true;
  try {
    const response = await api.get(`/dashboard/manager/leaderboard?page=${page}`);
    leaderboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  } finally {
    loadingLeaderboard.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
  fetchLeaderboard();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
.manager-dashboard { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; }
.page-topline { margin-bottom: 25px; }
.eyebrow { color: #f59e0b; font-size: 13px; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 4px 12px; border-radius: 8px; display: inline-block; margin-bottom: 8px; }
.page-topline h2 { margin: 5px 0; font-size: 32px; font-weight: 800; color: #fff; }
.page-topline p { color: #9ba3c4; font-size: 14px; margin: 0; }

.state-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #7d89b6; font-size: 16px; }
.spinner { display: inline-block; border: 3px solid rgba(245, 158, 11, 0.25); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
.spinner.large { width: 40px; height: 40px; margin-bottom: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Stats Grids */
.mb-3 { margin-bottom: 15px; } .mb-4 { margin-bottom: 30px; } .mt-2 { margin-top: 10px; } .mt-4 { margin-top: 20px; }
.pb-3 { padding-bottom: 15px; } .d-block { display: block; }
.border-bottom { border-bottom: 1px solid rgba(137, 153, 226, 0.1); }
.section-title { font-size: 18px; color: #fff; font-weight: 800; margin-bottom: 15px; border-bottom: 1px solid rgba(137, 153, 226, 0.1); padding-bottom: 10px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; align-items: center; }
.grid-5 { grid-template-columns: 1fr 1fr auto 1fr 1fr 1fr; }
.grid-6 { grid-template-columns: repeat(6, 1fr); }

.stat-card { display: flex; align-items: center; justify-content: space-between; padding: 22px 20px; border-radius: 14px; background: rgba(10, 15, 44, 0.75); border: 1px solid rgba(137, 153, 226, 0.15); transition: transform 0.2s, box-shadow 0.2s; height: 100%; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.stat-info { display: flex; flex-direction: column; text-align: right; }
.stat-info small { color: #818cb9; font-size: 12px; margin-bottom: 5px; font-weight: 600; }
.stat-info strong { font-size: 26px; color: #fff; line-height: 1; font-weight: 800; }
.stat-icon { width: 45px; height: 45px; display: grid; place-items: center; font-size: 22px; background: rgba(255,255,255,0.05); border-radius: 12px; }

.primary-card { border-bottom: 3px solid #f59e0b; background: linear-gradient(180deg, rgba(10, 15, 44, 0.75) 0%, rgba(245, 158, 11, 0.05) 100%); }
.blue-card { border-bottom: 3px solid #3b82f6; }
.gray-card { border-bottom: 3px solid #64748b; opacity: 0.85; }
.orange-card { border-bottom: 3px solid #f97316; }
.purple-card { border-bottom: 3px solid #a855f7; }
.green-card { border-bottom: 3px solid #10b981; }
.red-card { border-bottom: 3px solid #ef4444; background: rgba(239, 68, 68, 0.08); }
.dark-red-card { border-bottom: 3px solid #991b1b; background: rgba(153, 27, 27, 0.15); }
.outline-card { border: 1px dashed rgba(137, 153, 226, 0.3); background: rgba(6, 11, 37, 0.4); }

.text-blue { color: #60a5fa; } .text-purple { color: #c084fc; } .text-green { color: #34d399; } .text-red { color: #f87171; } .text-orange { color: #f59e0b; } .text-white { color: #fff; } .text-gray { color: #94a3b8; }
.bg-amber { background: rgba(245, 158, 11, 0.15); color: #fcd34d; padding: 4px 10px; border-radius: 8px; font-size: 11px; }
.vertical-divider { width: 1px; height: 60px; background: rgba(137, 153, 226, 0.2); margin: 0 10px; }

.pulse-text { animation: pulse-text-red 2s infinite; }
@keyframes pulse-text-red { 0%, 100% { color: #f87171; text-shadow: none; } 50% { color: #ff9bad; text-shadow: 0 0 8px rgba(239,68,68,0.6); } }

/* Charts Grid */
.charts-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
.glass-card { background: rgba(15, 22, 61, 0.65); border: 1px solid rgba(137, 153, 226, 0.15); border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { margin: 0; font-size: 18px; color: #fff; font-weight: 700; }
.muted { color: #818cb9; } .text-sm { font-size: 12px; } .text-center { text-align: center; }

/* Table Styles & Micro Layout */
.relative-container { position: relative; }
.inner-loading-overlay { position: absolute; inset: 0; background: rgba(10, 15, 44, 0.6); backdrop-filter: blur(3px); display: grid; place-items: center; border-radius: 16px; z-index: 10; }
.table-responsive { overflow-x: auto; }
.leaderboard-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.leaderboard-table th { text-align: right; padding: 12px 15px; color: #818cb9; border-bottom: 1px solid rgba(137, 153, 226, 0.15); font-weight: 700; white-space: nowrap; }
.leaderboard-table td { padding: 15px; border-bottom: 1px solid rgba(137, 153, 226, 0.05); vertical-align: middle; }
.leaderboard-table tr:hover td { background: rgba(255,255,255,0.02); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 35px; height: 35px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: grid; place-items: center; font-size: 11px; font-weight: bold; color: #fff; }
.user-info strong { color: #fff; font-size: 14px; display: block; }

/* Micro Layout Classes */
.metric-cell { display: flex; flex-direction: column; gap: 4px; }
.big-num { font-size: 20px; line-height: 1; font-weight: 800; }
.sub-metrics { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.sub-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; white-space: nowrap; }
.sub-badge.blue { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
.sub-badge.purple { background: rgba(168, 85, 247, 0.15); color: #d8b4fe; }
.sub-badge.gray { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }
.sub-item { font-size: 10px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

.health-cell { display: flex; flex-direction: column; align-items: center; }
.health-badge { padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; width: 100%; text-align: center; }
.health-badge.safe { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.health-badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.health-badge.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

.row-warning td:first-child { border-right: 3px solid #f59e0b; }
.row-danger td:first-child { border-right: 3px solid #ef4444; background: rgba(239, 68, 68, 0.03); }

.wa-btn { background: #25d366; color: #000; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-family: 'Cairo'; cursor: pointer; transition: 0.2s; font-size: 12px; display: flex; align-items: center; gap: 5px; }
.wa-btn:hover:not(:disabled) { background: #22c55e; transform: scale(1.05); }
.wa-btn:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; opacity: 0.7; }

/* SVG Donut Chart */
.circular-progress-wrapper { width: 130px; margin: 0 auto; }
.circular-chart { display: block; max-width: 100%; max-height: 250px; }
.kpi-circle { animation: progress 1s ease-out forwards; }
.stroke-green { stroke: #10b981; } .stroke-yellow { stroke: #f59e0b; } .stroke-red { stroke: #ef4444; }
.percentage { fill: #fff; font-family: 'Cairo', sans-serif; font-size: 9px; font-weight: 800; text-anchor: middle; }
@keyframes progress { 0% { stroke-dasharray: 0 100; } }

/* Progress Bars */
.progress-bars-container { display: flex; flex-direction: column; justify-content: center; height: 100%; }
.bg-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bg-purple { background: linear-gradient(90deg, #9333ea, #c084fc); }

/* Pagination Controls */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid rgba(137, 153, 226, 0.1); padding-top: 20px; }
.page-btn { background: rgba(137, 153, 226, 0.1); color: #8fc9ff; border: 1px solid rgba(137, 153, 226, 0.2); padding: 6px 16px; border-radius: 8px; font-family: 'Cairo'; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.page-btn:hover:not(:disabled) { background: #3b82f6; color: #fff; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: #aab5da; font-size: 13px; }
.page-info strong { color: #fff; }

@media (max-width: 1200px) {
  .grid-5 { grid-template-columns: 1fr 1fr; }
  .grid-6 { grid-template-columns: repeat(3, 1fr); }
  .vertical-divider { display: none; }
  .charts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .grid-5, .grid-6 { grid-template-columns: 1fr 1fr; }
}

.quick-action-btn { border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-family: 'Cairo'; cursor: pointer; transition: 0.2s; font-size: 11px; display: flex; align-items: center; gap: 5px; }
.quick-action-btn.warn-btn { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.quick-action-btn.warn-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); transform: scale(1.05); }
.quick-action-btn.warn-btn:disabled { background: rgba(148, 163, 184, 0.1); color: #94a3b8; cursor: not-allowed; opacity: 0.5; }
.quick-action-btn.msg-btn { background: rgba(37, 211, 102, 0.15); color: #25d366; }
.quick-action-btn.msg-btn:hover { background: rgba(37, 211, 102, 0.25); transform: scale(1.05); }

</style>