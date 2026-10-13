<template>
  <div class="today-board-container" dir="rtl">
    <!-- هالات الإضاءة الخلفية للجماليات الفاخرة -->
    <div class="ambient-glow glow-cyan" aria-hidden="true"></div>
    <div class="ambient-glow glow-purple" aria-hidden="true"></div>

    <!-- ================= شريط الرأس الاستعراضي ================= -->
    <header class="board-header">
      <div class="header-main">
        <div class="title-group">
          <div class="eyebrow-wrap">
            <span class="live-pulse" aria-hidden="true"></span>
            <span class="eyebrow-text">لوحة اليوم التفاعلية • Daily Timeline Stream</span>
          </div>
          <h1 class="page-title">
            لوحة اليوم
            <span class="date-chip">{{ boardData.date_formatted || 'اليوم' }}</span>
          </h1>
          <p class="page-subtitle">
            عرض استعراضي زمني أفقي لمهام وساعات العمل مع التتبع اللحظي لحالات التشفيت والإنجاز.
          </p>
        </div>

        <!-- أزرار الإجراءات السريعة -->
        <div class="header-actions">
          <button 
            type="button" 
            class="refresh-btn" 
            @click="fetchBoardData" 
            :disabled="isLoading"
            title="تحديث البيانات"
          >
            <span class="spin-icon" :class="{ spinning: isLoading }">🔄</span>
            <span>تحديث</span>
          </button>
        </div>
      </div>

      <!-- ================= شريط فلترة واختيار الموظف (للمدير فقط) ================= -->
      <div v-if="isManagerUser && employees.length > 0" class="employee-selector-strip">
        <div class="strip-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>استعراض جدول الموظف:</span>
        </div>

        <div class="employee-pills-scroll">
          <button
            v-for="emp in employees"
            :key="emp.id"
            type="button"
            class="emp-pill"
            :class="{ active: selectedUserId === emp.id }"
            @click="selectEmployee(emp.id)"
          >
            <span class="emp-avatar">{{ getInitials(emp.name) }}</span>
            <div class="emp-meta">
              <strong>{{ emp.name }}</strong>
              <small>{{ emp.job_title || 'عضو فريق' }}</small>
            </div>
            <span v-if="selectedUserId === emp.id" class="active-dot"></span>
          </button>
        </div>

        <!-- منتقي التاريخ -->
        <div class="date-picker-wrap">
          <label for="board-date-input" class="sr-only">اختر التاريخ</label>
          <input 
            id="board-date-input" 
            type="date" 
            v-model="selectedDate" 
            class="board-date-input" 
            @change="fetchBoardData" 
          />
        </div>
      </div>

      <!-- بطاقة الموظف في حال لم يكن مديراً -->
      <div v-else class="employee-welcome-banner">
        <div class="welcome-avatar">{{ getInitials(currentUser.name || 'أنا') }}</div>
        <div class="welcome-info">
          <h3>مرحباً، {{ currentUser.name || 'عزيزي الموظف' }} 👋</h3>
          <p>إليك توزيع ساعاتك التشغيلية ومسار مهامك لليوم. ركّز على مهمة تلو الأخرى لتحقيق أقصى إنتاجية.</p>
        </div>
        <div class="date-picker-wrap">
          <input 
            type="date" 
            v-model="selectedDate" 
            class="board-date-input" 
            @change="fetchBoardData" 
          />
        </div>
      </div>

      <!-- ================= شريط مؤشرات الطاقة وساعات اليوم ================= -->
      <div class="capacity-overview-card">
        <div class="gauge-left">
          <div class="gauge-title-box">
            <span class="gauge-icon">⏱️</span>
            <div>
              <strong>سعة ساعات العمل اليومية</strong>
              <p>
                الحد اليومي المعتمد: {{ stats.max_daily_capacity || 8 }} ساعات
                <span v-if="boardData.user?.work_start_day && boardData.user?.work_end_day" class="work-days-badge">
                  • 📅 أيام العمل: {{ formatDaysRange(boardData.user.work_start_day, boardData.user.work_end_day) }}
                </span>
                <span v-if="boardData.user?.work_start_time && boardData.user?.work_end_time" class="work-hours-badge">
                  • ⏰ الدوام: {{ formatTime(boardData.user.work_start_time) }} - {{ formatTime(boardData.user.work_end_time) }}
                </span>
              </p>
            </div>
          </div>
          
          <div class="gauge-meter-wrapper">
            <div class="meter-bar-track">
              <div 
                class="meter-bar-fill" 
                :class="{ 'is-overload': stats.is_overloaded }"
                :style="{ width: `${Math.min(100, stats.capacity_percentage || 0)}%` }"
              ></div>
            </div>
            <div class="meter-labels">
              <span>{{ stats.total_hours_today || 0 }} ساعة مخصصة اليوم</span>
              <span class="percent-tag" :class="{ 'tag-danger': stats.is_overloaded }">
                <template v-if="stats.is_overloaded">
                  ⚠️ {{ stats.capacity_percentage || 0 }}% (ضغط عمل: يتجاوز السعة بـ {{ stats.overload_hours || Math.max(0, +(stats.total_hours_today - (stats.max_daily_capacity || 8)).toFixed(1)) }} س)
                </template>
                <template v-else>
                  {{ stats.capacity_percentage || 0 }}% من السعة
                </template>
              </span>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <span class="m-val highlight">{{ stats.total_tasks_count || 0 }}</span>
            <span class="m-lbl">إجمالي المهام</span>
          </div>
          <div class="metric-box">
            <span class="m-val green">{{ stats.completed_tasks_count || 0 }}</span>
            <span class="m-lbl">المنجز منها</span>
          </div>
          <div class="metric-box">
            <span class="m-val yellow">{{ stats.in_progress_tasks_count || 0 }}</span>
            <span class="m-lbl">جاري العمل</span>
          </div>
          <div class="metric-box">
            <span class="m-val purple">{{ stats.remaining_hours || 0 }} س</span>
            <span class="m-lbl">الساعات المتبقية</span>
          </div>
        </div>
      </div>

      <!-- تنبيه يوم العطلة الرسمية للموظف -->
      <div v-if="stats.is_working_day_today === false" class="weekend-alert-strip">
        <span class="weekend-icon">🌴</span>
        <div class="weekend-copy">
          <strong>تنبيه: هذا اليوم يعتبر عطلة أسبوعية للموظف.</strong>
          <span>أيام العمل المعتمدة له هي {{ formatDaysRange(boardData.user?.work_start_day, boardData.user?.work_end_day) }}. أي مهام مسجلة اليوم تقع خارج أوقات العمل الرسمية.</span>
        </div>
      </div>
    </header>

    <!-- ================= مركز تنبيهات التشفيت (Shift Alerts Center) ================= -->
    <section class="shifts-alert-section" aria-label="تنبيهات التشفيت">
      <div v-if="shiftsAlerts.length > 0" class="shifts-alerts-container">
        <div class="section-badge">
          <span class="badge-icon">⚠️</span>
          <span>مركز تنبيهات التشفيتات لهذا اليوم ({{ shiftsAlerts.length }})</span>
        </div>

        <div class="alerts-grid">
          <article 
            v-for="alert in shiftsAlerts" 
            :key="alert.id" 
            class="shift-alert-card"
            :class="`alert-${alert.type}`"
          >
            <div class="alert-icon-box">
              <span v-if="alert.type === 'shifted_in'">📥</span>
              <span v-else>📤</span>
            </div>
            <div class="alert-body">
              <div class="alert-topline">
                <span class="alert-type-tag">
                  {{ alert.type === 'shifted_in' ? 'ساعات مرحلة إلى اليوم' : 'ساعات مشفتة إلى الغد' }}
                </span>
                <span class="alert-hours-tag">{{ alert.hours }} ساعة</span>
              </div>
              <h4 class="alert-title">{{ alert.title }}</h4>
              <p class="alert-reason">
                <span class="lbl">السبب:</span> {{ alert.reason }}
                <span v-if="alert.from_date" class="from-date">(مرحلة من: {{ alert.from_date }})</span>
              </p>
            </div>
            <div class="alert-action">
              <button 
                type="button" 
                class="restore-btn"
                @click="restoreShift(alert)"
                :title="'استرجاع الساعات المشفتة ليومها الأساسي'"
              >
                ↩️ استرجاع الساعات
              </button>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="balanced-state-chip">
        <span class="check-icon">✨</span>
        <span>توزيع الساعات لليوم متزن وطبيعي، ولم يطرأ أي ترحيل أو تشفيت حتى الآن.</span>
      </div>
    </section>

    <!-- ================= الشريط الزمني الاستعراضي الأفقي (Presentation Timeline) ================= -->
    <main class="timeline-presentation-area">
      <div class="timeline-header-bar">
        <div class="track-info">
          <h3>
            <span class="timeline-dot"></span>
            مسار اليوم الزمني (Roadmap Flow)
          </h3>
          <p>شريط المحطات التقديرية مرتبة زمنياً من الصباح وحتى نهاية اليوم.</p>
        </div>

        <!-- أزرار التمرير الأفقي للأجهزة والشاشات -->
        <div class="track-scroll-controls">
          <button 
            type="button" 
            class="scroll-nav-btn" 
            @click="scrollTimeline('right')" 
            title="السابق (يمين)"
          >
            ➔
          </button>
          <span class="steps-counter">
            {{ timelineItems.length > 0 ? `${timelineItems.length} محطات` : '0 مهام' }}
          </span>
          <button 
            type="button" 
            class="scroll-nav-btn" 
            @click="scrollTimeline('left')" 
            title="التالي (يسار)"
          >
            ←
          </button>
        </div>
      </div>

      <!-- حالة التحميل -->
      <div v-if="isLoading" class="timeline-loading">
        <div class="futuristic-spinner"></div>
        <span>جارٍ تجهيز شريط مهام اليوم الاستعراضي...</span>
      </div>

      <!-- حالة عدم وجود مهام -->
      <div v-else-if="timelineItems.length === 0" class="empty-timeline-state">
        <div class="empty-artwork">🎉</div>
        <h3>لا توجد مهام مجدولة لهذا اليوم!</h3>
        <p>لا توجد ساعات عمل مسجلة للموظف المختار في تاريخ {{ boardData.date_formatted }}.</p>
        <button v-if="isManagerUser" type="button" class="btn-create-task" @click="$router.push('/quick-tasks?action=new')">
          ＋ إضافة مهمة سريعة جديدة
        </button>
      </div>

      <!-- مسار الشريط الزمني الأفقي الفاخر -->
      <div v-else class="timeline-track-outer">
        <!-- خط التوصيل النيوني المشع الممتد أفقياً -->
        <div class="timeline-rail-line" aria-hidden="true">
          <div class="rail-glow-pulse"></div>
        </div>

        <div ref="timelineScrollContainer" class="timeline-scroll-container">
          <div class="timeline-cards-row">
            <article 
              v-for="(item, idx) in timelineItems" 
              :key="item.unique_key"
              class="timeline-card"
              :class="[
                `type-${item.task_type}`,
                `status-${item.status}`,
                { 'is-completed': item.is_completed, 'is-current-active': item.is_current_slot }
              ]"
            >
              <!-- عقدة المحطة في الخط الزمني (Milestone Node) -->
              <div class="milestone-node">
                <span class="node-number">{{ idx + 1 }}</span>
                <span class="node-time">{{ item.start_time_label }}</span>
              </div>

              <!-- شريط الرأس في كرت المهمة -->
              <div class="card-head">
                <div class="type-priority-group">
                  <span class="type-pill" :class="item.task_type">
                    <span v-if="item.task_type === 'plan_post'">🎨 منشور خطة</span>
                    <span v-else-if="item.task_type === 'task'">📁 مهمة مشروع</span>
                    <span v-else>⚡ مهمة سريعة</span>
                  </span>

                  <span v-if="item.is_urgent" class="urgent-pill">🚨 عاجلة</span>
                  <span v-if="item.post_type" class="post-format-pill">{{ item.post_type }}</span>
                </div>

                <!-- شارة التوقيت التقديري -->
                <div class="time-slot-tag" :title="`المدة المقدرة: ${item.duration_label}`">
                  <span class="clock-icon">🕐</span>
                  <span>{{ item.time_slot_label }}</span>
                </div>
              </div>

              <!-- جسم الكرت: العنوان، العميل، والوصف -->
              <div class="card-body">
                <!-- مؤشر نبض إذا كانت هذه المهمة جارية الآن -->
                <div v-if="item.is_current_slot" class="current-active-banner">
                  <span class="radar-dot"></span>
                  <span>جاري تنفيذها في هذا الوقت</span>
                </div>

                <h4 class="task-title" :title="item.title">
                  {{ item.title }}
                </h4>

                <p v-if="item.subtitle" class="task-subtitle">
                  <span class="sub-icon">🏢</span>
                  <span>{{ item.subtitle }}</span>
                </p>

                <p v-if="item.description" class="task-desc">
                  {{ item.description }}
                </p>

                <!-- مشغل الصوت للتسجيلات الصوتية في المهام السريعة -->
                <div v-if="item.voice_record_url" class="voice-player-container" @click.stop>
                  <AudioVoicePlayer 
                    :src="item.voice_record_url" 
                    variant="card" 
                    theme="teal" 
                  />
                </div>

                <!-- شارات الساعات والتشفيت الدقيقة -->
                <div class="hours-alloc-strip">
                  <div class="alloc-metric">
                    <span class="lbl">مخصص اليوم:</span>
                    <strong class="val-today">{{ item.allocated_hours_today }} س</strong>
                    <small class="val-total">(من {{ item.total_estimated_hours }} س)</small>
                  </div>

                  <!-- بادجات حالة التشفيت على الكرت -->
                  <div v-if="item.is_shifted_to_today" class="shift-tag shifted-in">
                    <span>⚠️ مرحلة من: {{ item.shifted_from_date || 'أمس' }}</span>
                  </div>
                  <div v-if="item.is_partially_shifted" class="shift-tag shifted-out">
                    <span>⏱️ شُفت {{ item.shifted_hours_to_future }} س للغد</span>
                  </div>
                </div>
              </div>

              <!-- أسفل الكرت: الحالة والأزرار السريعة -->
              <div class="card-footer">
                <div class="status-indicator-box">
                  <span class="status-badge" :class="item.status">
                    <span class="status-dot"></span>
                    {{ getStatusLabel(item.status, item.is_completed) }}
                  </span>
                </div>

                <div class="card-actions-group">
                  <!-- زر التشفيت بالساعات -->
                  <button 
                    type="button" 
                    class="btn-action-shift"
                    :class="{ 'btn-disabled': item.is_completed }"
                    :disabled="item.is_completed"
                    @click="!item.is_completed && openShiftModal(item)"
                    :title="item.is_completed ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات من هذه المهمة إلى يوم آخر'"
                  >
                    ⏱️ تشفيت
                  </button>

                  <!-- زر استرجاع الساعات إذا كانت مشفتة -->
                  <button 
                    v-if="item.is_shifted_to_today || item.is_partially_shifted"
                    type="button" 
                    class="btn-action-restore"
                    @click="restoreItemShift(item)"
                    title="استرجاع الساعات المشفتة"
                  >
                    ↩️
                  </button>

                  <!-- زر تفاصيل المهمة -->
                  <button 
                    type="button" 
                    class="btn-action-view"
                    @click="viewTaskDetails(item)"
                    :title="getViewButtonTitle(item)"
                  >
                    🔍
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>

    <!-- ================= مودال تشفيت الساعات بالساعات ================= -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showShiftModal" class="modal-overlay" @click.self="showShiftModal = false">
          <div class="modal-content shift-modal">
            <button class="modal-close" type="button" @click="showShiftModal = false">&times;</button>
            
            <div class="shift-modal-header">
              <span class="shift-icon-box">⏱️</span>
              <div>
                <h3>تشفيت ساعات العمل</h3>
                <p>حدد عدد الساعات المراد اقتطاعها وترحيلها ليوم عمل لاحق بدقة.</p>
              </div>
            </div>

            <div v-if="targetShiftItem" class="task-summary-box">
              <span class="type-badge">{{ targetShiftItem.type_label }}</span>
              <strong class="target-title">{{ targetShiftItem.title }}</strong>
              <div class="target-hours-info">
                <span>ساعات اليوم: <strong>{{ targetShiftItem.allocated_hours_today }} س</strong></span>
                <span>إجمالي الساعات: <strong>{{ targetShiftItem.total_estimated_hours }} س</strong></span>
              </div>
            </div>

            <form @submit.prevent="submitShiftHours" class="shift-form">
              <div class="form-group">
                <label>عدد الساعات المراد تشفيتها: <span class="hours-val">{{ shiftForm.hours }} ساعة</span></label>
                <div class="hours-stepper-wrap">
                  <button type="button" class="stepper-btn" @click="decrementShiftHours" :disabled="shiftForm.hours <= 0.5">-</button>
                  <input type="number" v-model.number="shiftForm.hours" step="0.5" min="0.5" :max="targetShiftItem?.allocated_hours_today || 8" class="stepper-val-input" />
                  <button type="button" class="stepper-btn" @click="incrementShiftHours" :disabled="shiftForm.hours >= (targetShiftItem?.allocated_hours_today || 8)">+</button>
                </div>
                <div class="quick-hours-presets">
                  <button type="button" class="preset-btn" @click="shiftForm.hours = 0.5" :disabled="(targetShiftItem?.allocated_hours_today || 0) < 0.5">نصف ساعة</button>
                  <button type="button" class="preset-btn" @click="shiftForm.hours = 1.0" :disabled="(targetShiftItem?.allocated_hours_today || 0) < 1.0">ساعة واحدة</button>
                  <button type="button" class="preset-btn" @click="shiftForm.hours = 2.0" :disabled="(targetShiftItem?.allocated_hours_today || 0) < 2.0">ساعتان</button>
                  <button type="button" class="preset-btn" @click="shiftForm.hours = (targetShiftItem?.allocated_hours_today || 1.0)">كامل ساعات اليوم</button>
                </div>
              </div>

              <div class="form-group">
                <label>التاريخ المراد التشفيت إليه:</label>
                <input type="date" v-model="shiftForm.to_date" required class="date-input" />
              </div>

              <div class="form-group">
                <label>سبب التشفيت (اختياري):</label>
                <input type="text" v-model="shiftForm.reason" placeholder="مثال: ضغط عمل، أولوية لمهمة طارئة..." class="text-input" />
              </div>

              <div class="modal-actions">
                <button type="button" class="cancel-btn" @click="showShiftModal = false">إلغاء</button>
                <button type="submit" class="submit-btn" :disabled="isSubmittingShift">
                  {{ isSubmittingShift ? 'جارٍ التشفيت...' : 'تأكيد تشفيت الساعات ⏱️' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/axios';
import alertService from '@/services/alertService';
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue';

const route = useRoute();
const router = useRouter();

// بيانات المستخدم الحالي
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'));
const isManagerUser = computed(() => {
  const role = localStorage.getItem('role') || currentUser.value?.role;
  const roleStr = typeof role === 'object' && role?.value ? role.value : String(role || '');
  return roleStr.toLowerCase() === 'manager' || roleStr.toLowerCase() === 'admin';
});

// حالات التحميل والبيانات
const isLoading = ref(true);
const selectedUserId = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const boardData = ref({
  user: null,
  employees_list: [],
  date: '',
  date_formatted: '',
  stats: {},
  shifts_alerts: [],
  timeline_items: []
});

const employees = computed(() => boardData.value.employees_list || []);
const stats = computed(() => boardData.value.stats || {});
const shiftsAlerts = computed(() => boardData.value.shifts_alerts || []);
const timelineItems = computed(() => boardData.value.timeline_items || []);

// مرجع عنصر التمرير الأفقي
const timelineScrollContainer = ref(null);

// مودال التشفيت
const showShiftModal = ref(false);
const isSubmittingShift = ref(false);
const targetShiftItem = ref(null);
const shiftForm = ref({
  hours: 1.0,
  to_date: '',
  reason: ''
});

// دوال جلب البيانات
const fetchBoardData = async () => {
  isLoading.value = true;
  try {
    const params = {
      date: selectedDate.value
    };
    if (selectedUserId.value && isManagerUser.value) {
      params.user_id = selectedUserId.value;
    }

    const res = await api.get('/workload/today-board', { params });
    if (res.data?.success && res.data?.data) {
      boardData.value = res.data.data;
      if (res.data.data.user && !selectedUserId.value) {
        selectedUserId.value = res.data.data.user.id;
      }
    }
  } catch (error) {
    console.error('Error fetching today board:', error);
    alertService.error('تعذر جلب بيانات لوحة اليوم.');
  } finally {
    isLoading.value = false;
  }
};

const selectEmployee = (empId) => {
  selectedUserId.value = empId;
  fetchBoardData();
};

// التحكم في شريط التمرير الأفقي
const scrollTimeline = (direction) => {
  if (!timelineScrollContainer.value) return;
  const container = timelineScrollContainer.value;
  const scrollAmount = 360;
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
};

const dayLabelsMap = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة'
};

const formatDaysRange = (start, end) => {
  if (!start || !end) return '';
  const s = dayLabelsMap[String(start).toLowerCase()] || start;
  const e = dayLabelsMap[String(end).toLowerCase()] || end;
  return `من ${s} إلى ${e}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.slice(0, 5).split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

// مودال التشفيت
const openShiftModal = (item) => {
  if (item.is_completed) {
    alertService.warning('لا يمكن تشفيت مهمة مكتملة بالفعل.');
    return;
  }
  targetShiftItem.value = item;
  
  // استخدام يوم العمل التالي المعتمد للموظف تلقائياً
  const nextTargetDate = stats.value?.next_working_day || boardData.value?.user?.next_working_day || (() => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  shiftForm.value = {
    hours: Math.min(1.0, item.allocated_hours_today || 1.0),
    to_date: nextTargetDate,
    reason: ''
  };
  showShiftModal.value = true;
};

const incrementShiftHours = () => {
  const max = targetShiftItem.value?.allocated_hours_today || 8;
  if (shiftForm.value.hours + 0.5 <= max) {
    shiftForm.value.hours = Math.round((shiftForm.value.hours + 0.5) * 10) / 10;
  }
};

const decrementShiftHours = () => {
  if (shiftForm.value.hours - 0.5 >= 0.5) {
    shiftForm.value.hours = Math.round((shiftForm.value.hours - 0.5) * 10) / 10;
  }
};

const submitShiftHours = async () => {
  if (!targetShiftItem.value) return;
  const item = targetShiftItem.value;
  const userId = selectedUserId.value || currentUser.value?.id;

  isSubmittingShift.value = true;
  try {
    const res = await api.post('/workload/shift-hours', {
      user_id: userId,
      task_type: item.task_type,
      task_id: item.id,
      hours: Number(shiftForm.value.hours),
      from_date: selectedDate.value,
      to_date: shiftForm.value.to_date,
      reason: shiftForm.value.reason || 'تشفيت من لوحة اليوم'
    });

    if (res.data?.status) {
      alertService.success(res.data.message || 'تم تشفيت الساعات بنجاح! ⏱️');
      showShiftModal.value = false;
      fetchBoardData();
    }
  } catch (error) {
    console.error('Error shifting hours:', error);
    alertService.error(error.response?.data?.message || 'حدث خطأ أثناء تشفيت الساعات.');
  } finally {
    isSubmittingShift.value = false;
  }
};

// استرجاع الساعات المشفتة
const restoreShift = async (alert) => {
  const isConfirmed = await alertService.confirm({
    title: 'تأكيد استرجاع الساعات',
    message: `هل تريد إلغاء التشفيت وإعادة ${alert.hours} ساعة إلى موعدها الأساسي؟`,
    confirmText: 'نعم، استرجع الساعات',
    type: 'primary'
  });

  if (!isConfirmed) return;

  try {
    const targetDate = alert.type === 'shifted_in' ? selectedDate.value : selectedDate.value;
    const res = await api.post('/workload/restore-shifted-hours', {
      user_id: selectedUserId.value || currentUser.value?.id,
      task_type: alert.task_type,
      task_id: alert.task_id,
      target_date: targetDate
    });

    if (res.data?.status) {
      alertService.success(res.data.message || 'تم استرجاع الساعات بنجاح! ↩️');
      fetchBoardData();
    }
  } catch (err) {
    console.error('Error restoring shift:', err);
    alertService.error(err.response?.data?.message || 'تعذر استرجاع الساعات المشفتة.');
  }
};

const restoreItemShift = (item) => {
  restoreShift({
    type: item.is_shifted_to_today ? 'shifted_in' : 'shifted_out',
    task_type: item.task_type,
    task_id: item.id,
    hours: item.allocated_hours_today,
  });
};

const viewTaskDetails = (item) => {
  if (item.task_type === 'plan_post') {
    if (item.content_plan_id) {
      router.push({ path: `/plan-board/${item.content_plan_id}`, query: { postId: item.id } });
    } else {
      router.push({ path: '/plan-contents' });
    }
  } else if (item.task_type === 'quick_task') {
    router.push({ path: '/quick-tasks', query: { task_id: item.id } });
  } else if (item.task_type === 'task') {
    if (item.project_id) {
      router.push({ path: `/projects/${item.project_id}`, query: { task_id: item.id } });
    } else {
      router.push({ path: '/projects' });
    }
  }
};

const getViewButtonTitle = (item) => {
  if (item.task_type === 'plan_post') return 'فتح تفاصيل المنشور في شيت الخطة 📊';
  if (item.task_type === 'quick_task') return 'عرض المهمة في لوحة المهام السريعة ⚡';
  if (item.task_type === 'task') return 'عرض تفاصيل مهمة المشروع 📁';
  return 'فتح تفاصيل المهمة كاملة';
};

// دوال مساعدة
const getInitials = (name) => {
  if (!name) return 'OMS';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('');
};

const getStatusLabel = (status, isCompleted) => {
  if (isCompleted || status === 'completed') return 'منجزة ومكتملة ✅';
  if (status === 'in_progress') return 'جاري التنفيذ ⏳';
  if (status === 'under_review') return 'قيد المراجعة 👁️';
  if (status === 'rejected') return 'مرفوضة / بحاجة لتعديل ⚠️';
  return 'قيد الانتظار ⏱️';
};

onMounted(() => {
  if (route.query.user_id && isManagerUser.value) {
    selectedUserId.value = Number(route.query.user_id);
  }
  fetchBoardData();
});
</script>

<style scoped>
.today-board-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 24px 32px 60px;
  background: radial-gradient(circle at 15% 10%, #111a4c 0%, #080d29 55%, #05081b 100%);
  color: #eef2ff;
  overflow-x: hidden;
}

/* هالات الإضاءة الخلفية */
.ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  opacity: 0.18;
  z-index: 0;
}
.glow-cyan {
  top: -100px;
  right: -50px;
  background: #7de8dc;
}
.glow-purple {
  top: 300px;
  left: -100px;
  background: #a855f7;
}

/* ================= الهيدر الرئيسي ================= */
.board-header {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.eyebrow-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(125, 232, 220, 0.1);
  border: 1px solid rgba(125, 232, 220, 0.25);
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 8px;
}

.live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7de8dc;
  box-shadow: 0 0 10px #7de8dc;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(125, 232, 220, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(125, 232, 220, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(125, 232, 220, 0); }
}

.eyebrow-text {
  font-size: 11px;
  font-weight: 800;
  color: #7de8dc;
  letter-spacing: 0.5px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 900;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-chip {
  font-size: 13px;
  font-weight: 700;
  background: rgba(137, 153, 226, 0.15);
  border: 1px solid rgba(137, 153, 226, 0.3);
  color: #c5d2ff;
  padding: 4px 12px;
  border-radius: 12px;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #8f9fcb;
  max-width: 650px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(18, 27, 72, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #c5d2ff;
  border-radius: 14px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(30, 42, 105, 0.85);
  color: #7de8dc;
}

.spin-icon.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ================= شريط فلترة الموظف ================= */
.employee-selector-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(16, 24, 68, 0.65);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 18px;
  padding: 12px 18px;
  backdrop-filter: blur(12px);
  flex-wrap: wrap;
}

.strip-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #7de8dc;
  white-space: nowrap;
}

.employee-pills-scroll {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 2px;
}

.emp-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(22, 32, 88, 0.5);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 14px;
  padding: 6px 14px 6px 10px;
  color: #c5d2ff;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.emp-pill:hover {
  background: rgba(36, 50, 130, 0.6);
  border-color: rgba(125, 232, 220, 0.4);
}

.emp-pill.active {
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.2), rgba(99, 102, 241, 0.25));
  border-color: #7de8dc;
  color: #ffffff;
  box-shadow: 0 0 16px rgba(125, 232, 220, 0.2);
}

.emp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #14205c, #0a1138);
  border: 1px solid rgba(137, 153, 226, 0.3);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  color: #7de8dc;
}

.emp-meta {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.emp-meta strong {
  font-size: 12px;
  font-weight: 800;
}

.emp-meta small {
  font-size: 10px;
  color: #8fa0cf;
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7de8dc;
}

.date-picker-wrap {
  margin-right: auto;
}

.board-date-input {
  background: rgba(10, 16, 48, 0.75);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  outline: none;
}

.employee-welcome-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(20, 29, 82, 0.65), rgba(11, 17, 52, 0.75));
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 18px;
  padding: 14px 20px;
  backdrop-filter: blur(12px);
  flex-wrap: wrap;
}

.welcome-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7de8dc, #6366f1);
  color: #060b24;
  font-weight: 900;
  display: grid;
  place-items: center;
  font-size: 16px;
}

.welcome-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.welcome-info p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8da0d2;
}

/* ================= شريط مؤشرات الطاقة ================= */
.capacity-overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(145deg, rgba(19, 29, 80, 0.75), rgba(9, 15, 46, 0.85));
  border: 1px solid rgba(137, 153, 226, 0.22);
  border-radius: 20px;
  padding: 18px 24px;
  backdrop-filter: blur(16px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35);
  flex-wrap: wrap;
}

.gauge-left {
  flex: 1;
  min-width: 280px;
}

.gauge-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.gauge-icon {
  font-size: 24px;
}

.gauge-title-box strong {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
}

.gauge-title-box p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8ca0d5;
}

.work-days-badge, .work-hours-badge {
  display: inline-block;
  margin-right: 4px;
  color: #7de8dc;
  font-weight: 700;
  font-size: 11px;
}

.weekend-alert-strip {
  margin-top: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.08));
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fde68a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.weekend-alert-strip .weekend-icon {
  font-size: 22px;
}

.weekend-alert-strip .weekend-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weekend-alert-strip .weekend-copy strong {
  font-size: 13px;
  color: #fbbf24;
}

.weekend-alert-strip .weekend-copy span {
  font-size: 11.5px;
  color: #fef3c7;
}

.gauge-meter-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meter-bar-track {
  width: 100%;
  height: 10px;
  border-radius: 8px;
  background: rgba(6, 11, 38, 0.8);
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, 0.15);
}

.meter-bar-fill {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, #10b981, #7de8dc);
  box-shadow: 0 0 12px rgba(125, 232, 220, 0.5);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.meter-bar-fill.is-overload {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #a4b4e6;
}

.percent-tag {
  color: #7de8dc;
  font-weight: 800;
}

.percent-tag.tag-danger {
  color: #ef4444;
}

.metrics-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.metric-box {
  background: rgba(7, 13, 42, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 14px;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 85px;
}

.m-val {
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
}

.m-val.highlight { color: #7de8dc; }
.m-val.green { color: #34d399; }
.m-val.yellow { color: #fbbf24; }
.m-val.purple { color: #c084fc; }

.m-lbl {
  font-size: 10px;
  font-weight: 700;
  color: #8c9ecf;
  margin-top: 2px;
}

/* ================= مركز تنبيهات التشفيت ================= */
.shifts-alert-section {
  position: relative;
  z-index: 10;
  margin-bottom: 30px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 12px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}

.shift-alert-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(18, 25, 72, 0.7);
  border-radius: 16px;
  padding: 14px 18px;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}

.shift-alert-card.alert-shifted_in {
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(18, 25, 72, 0.7));
}

.shift-alert-card.alert-shifted_out {
  border: 1px solid rgba(168, 85, 247, 0.35);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(18, 25, 72, 0.7));
}

.alert-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(6, 11, 38, 0.7);
  display: grid;
  place-items: center;
  font-size: 20px;
  flex-shrink: 0;
}

.alert-body {
  flex: 1;
}

.alert-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.alert-type-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.alert-hours-tag {
  font-size: 11px;
  font-weight: 900;
  color: #7de8dc;
}

.alert-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
}

.alert-reason {
  margin: 0;
  font-size: 11px;
  color: #9cb0e5;
}

.alert-reason .lbl {
  color: #8090bf;
}

.restore-btn {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #c084fc;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.restore-btn:hover {
  background: rgba(168, 85, 247, 0.3);
  transform: translateY(-1px);
}

.balanced-state-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

/* ================= الشريط الزمني الأفقي ================= */
.timeline-presentation-area {
  position: relative;
  z-index: 10;
}

.timeline-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.track-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7de8dc;
  box-shadow: 0 0 10px #7de8dc;
}

.track-info p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8fa0cf;
}

.track-scroll-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scroll-nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(18, 28, 77, 0.8);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #7de8dc;
  font-size: 15px;
  font-weight: 900;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scroll-nav-btn:hover {
  background: rgba(35, 50, 130, 0.9);
  transform: scale(1.05);
}

.steps-counter {
  font-size: 12px;
  font-weight: 800;
  color: #a4b4e6;
  padding: 0 6px;
}

.timeline-loading,
.empty-timeline-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: rgba(13, 20, 56, 0.5);
  border: 1px dashed rgba(137, 153, 226, 0.2);
  border-radius: 24px;
}

.futuristic-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(125, 232, 220, 0.15);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.empty-artwork {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-timeline-state h3 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #ffffff;
}

.empty-timeline-state p {
  margin: 0 0 18px;
  font-size: 13px;
  color: #8da0d2;
}

.btn-create-task {
  background: linear-gradient(135deg, #7de8dc, #10b981);
  color: #060b24;
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

/* ================= مسار الكروت الأفقي ================= */
.timeline-track-outer {
  position: relative;
  padding-top: 15px;
}

/* الخط النيوني المشع الممتد أفقياً - يمر في منتصف دوائر المحطات بالضبط */
.timeline-rail-line {
  position: absolute;
  top: 55px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(125, 232, 220, 0.25), rgba(99, 102, 241, 0.55), rgba(168, 85, 247, 0.25));
  border-radius: 4px;
  z-index: 1;
}

.rail-glow-pulse {
  position: absolute;
  inset: 0;
  box-shadow: 0 0 14px rgba(125, 232, 220, 0.4);
}

.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 42px 14px 26px; /* مساحة علوية كافية تمنع أي قص أو تآكل للأرقام والدوائر */
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(125, 232, 220, 0.3) transparent;
}

.timeline-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(125, 232, 220, 0.35);
  border-radius: 10px;
}

.timeline-cards-row {
  display: flex;
  gap: 26px;
  min-width: max-content;
  position: relative;
  z-index: 2;
}

/* كرت المحطة في الشريط الزمني */
.timeline-card {
  position: relative;
  width: 340px;
  background: linear-gradient(155deg, rgba(19, 28, 77, 0.85), rgba(9, 15, 48, 0.95));
  border: 1px solid rgba(137, 153, 226, 0.22);
  border-radius: 22px;
  padding: 24px 20px 18px;
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-card:hover {
  transform: translateY(-6px);
  border-color: rgba(125, 232, 220, 0.55);
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.65), 0 0 25px rgba(125, 232, 220, 0.15);
}

.timeline-card.is-current-active {
  border-color: #7de8dc;
  box-shadow: 0 0 35px rgba(125, 232, 220, 0.25);
}

.timeline-card.is-completed {
  border-color: rgba(16, 185, 129, 0.4);
}

/* عقدة المحطة على الخط - بدون أي قص أو تداخل */
.milestone-node {
  position: absolute;
  top: -24px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 5;
}

.node-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #070d2b;
  border: 2.5px solid #7de8dc;
  color: #7de8dc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Segoe UI", sans-serif;
  font-size: 14px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 16px rgba(125, 232, 220, 0.65), inset 0 0 6px rgba(125, 232, 220, 0.25);
  flex-shrink: 0;
}

.timeline-card.is-completed .node-number {
  border-color: #10b981;
  color: #10b981;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.65), inset 0 0 6px rgba(16, 185, 129, 0.25);
}

.node-time {
  font-size: 11px;
  font-weight: 800;
  color: #d1dcff;
  background: rgba(8, 14, 43, 0.95);
  border: 1px solid rgba(137, 153, 226, 0.3);
  padding: 3px 10px;
  border-radius: 9px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}

/* رأس الكرت */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.type-priority-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
}

.type-pill.plan_post { color: #a78bfa; background: rgba(167, 139, 250, 0.14); }
.type-pill.task { color: #60a5fa; background: rgba(96, 165, 250, 0.14); }
.type-pill.quick_task { color: #7de8dc; background: rgba(125, 232, 220, 0.14); }

.urgent-pill {
  font-size: 9px;
  font-weight: 900;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 2px 6px;
  border-radius: 6px;
}

.post-format-pill {
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
  padding: 2px 6px;
  border-radius: 6px;
}

.time-slot-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 800;
  color: #8da0d2;
  background: rgba(6, 11, 38, 0.5);
  padding: 3px 8px;
  border-radius: 8px;
  border: 1px solid rgba(137, 153, 226, 0.12);
}

/* جسم الكرت */
.card-body {
  margin-bottom: 14px;
}

.current-active-banner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(125, 232, 220, 0.14);
  border: 1px solid rgba(125, 232, 220, 0.35);
  color: #7de8dc;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7de8dc;
  box-shadow: 0 0 6px #7de8dc;
  animation: pulse-ring 1.5s infinite;
}

.task-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-subtitle {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  color: #8fa0cf;
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-desc {
  margin: 0 0 10px;
  font-size: 11px;
  color: #7d8cb9;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.voice-player-container {
  margin-bottom: 10px;
}

.hours-alloc-strip {
  background: rgba(6, 11, 38, 0.55);
  border: 1px solid rgba(137, 153, 226, 0.14);
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alloc-metric {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.alloc-metric .lbl {
  color: #8997c6;
}

.val-today {
  color: #7de8dc;
  font-weight: 800;
}

.val-total {
  color: #6977a4;
  font-size: 10px;
}

.shift-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.shift-tag.shifted-in {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.shift-tag.shifted-out {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

/* أسفل الكرت */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(137, 153, 226, 0.12);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #c5d2ff;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
}

.status-badge.completed .status-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-badge.in_progress .status-dot { background: #7de8dc; box-shadow: 0 0 6px #7de8dc; }
.status-badge.rejected .status-dot { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

.card-actions-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-shift {
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.28);
  color: #7de8dc;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-shift:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.25);
}

.btn-action-shift:disabled,
.btn-action-shift.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
  border-color: rgba(137, 153, 226, 0.15);
  color: #6977a4;
  background: rgba(22, 32, 88, 0.4);
}

.btn-action-restore,
.btn-action-view {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(22, 32, 88, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #c5d2ff;
  display: grid;
  place-items: center;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action-restore:hover {
  background: rgba(168, 85, 247, 0.25);
  color: #c084fc;
}

.btn-action-view:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #818cf8;
}

/* ================= المودال ================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(4, 7, 27, 0.85);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 16px;
}

.modal-content.shift-modal {
  width: 100%;
  max-width: 480px;
  background: linear-gradient(145deg, #161e56, #0c133a);
  border: 1px solid rgba(146, 160, 233, 0.24);
  border-radius: 24px;
  padding: 26px 28px;
  color: #eef0ff;
  position: relative;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.65);
}

.modal-close {
  position: absolute;
  top: 16px;
  left: 20px;
  background: transparent;
  border: none;
  color: #8c9ac9;
  font-size: 26px;
  cursor: pointer;
}

.shift-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.shift-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.2), rgba(99, 102, 241, 0.2));
  display: grid;
  place-items: center;
  font-size: 22px;
  border: 1px solid rgba(125, 232, 220, 0.35);
}

.shift-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.shift-modal-header p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8da0d2;
}

.task-summary-box {
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 18px;
}

.task-summary-box .type-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.task-summary-box .target-title {
  display: block;
  font-size: 13px;
  color: #ffffff;
  margin-bottom: 6px;
}

.target-hours-info {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #8da0d2;
}

.target-hours-info strong {
  color: #7de8dc;
}

.shift-form .form-group {
  margin-bottom: 16px;
}

.shift-form label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #c5d2ff;
  margin-bottom: 8px;
}

.shift-form .hours-val {
  color: #7de8dc;
}

.hours-stepper-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  margin-bottom: 8px;
}

.stepper-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(125, 232, 220, 0.15);
  border: 1px solid rgba(125, 232, 220, 0.35);
  color: #7de8dc;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-val-input {
  flex: 1;
  height: 40px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  outline: none;
}

.quick-hours-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #a7b6ff;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
}

.preset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shift-form .date-input,
.shift-form .text-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  background: rgba(6, 11, 38, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #8da0d2;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #fff;
  border-radius: 12px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .today-board-container {
    padding: 16px 14px 40px;
  }
  .page-title {
    font-size: 22px;
  }
  .timeline-card {
    width: 290px;
  }
}
</style>
