<template>
  <section class="tasks-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة العمل / مهامي الشخصية</span>
        <h2>لوحة المهام</h2>
        <p>تابع مهامك الحالية، حالة المراجعة، ومواعيد التسليم المطلوبة لضمان سير العمل.</p>
      </div>
      
      <!-- قائمة الموظفين (تظهر للمدير فقط) -->
      <div v-if="isManager" class="manager-controls">
        <label for="userSelect">عرض مهام الموظف:</label>
        <select id="userSelect" v-model="selectedUserId" class="custom-select">
          <option value="">-- مهامي الشخصية --</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- شريط الإحصائيات -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-icon teal" aria-hidden="true">◈</span>
        <div>
          <small>إجمالي المهام</small>
          <strong>{{ totalTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon purple" aria-hidden="true">✓</span>
        <div>
          <small>المهام المُسلمة</small>
          <strong>{{ deliveredTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon orange" aria-hidden="true">⏳</span>
        <div>
          <small>قيد التنفيذ (المتبقي)</small>
          <strong>{{ pendingTasks }}</strong>
        </div>
      </div>
    </div>

    <!-- شريط الفلاتر -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>خطة المحتوى:</label>
        <select v-model="planFilter" class="custom-select small-select">
          <option value="">جميع الخطط</option>
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">
            {{ plan.name || plan.title || 'خطة ' + plan.id }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>نوع المنشور:</label>
        <select v-model="postTypeFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="تصميم">تصميم</option>
          <option value="فيديو">فيديو</option>
          <option value="مقال">مقال</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة النشر:</label>
        <select v-model="publishStatusFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="تم النشر">تم النشر</option>
          <option value="لم يتم">لم يتم</option>
        </select>
      </div>
      <div class="filter-group">
        <label>موقف التسليم:</label>
        <select v-model="deliveryFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="مسلم">مُسلم</option>
          <option value="لم يسلم">لم يُسلم</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة القسم:</label>
        <select v-model="reviewFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="قيد الانتظار">قيد الانتظار</option>
          <option value="معتمد">معتمد</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>
      <div class="filter-group">
        <label>اعتماد المدير:</label>
        <select v-model="managerReviewFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="قيد الانتظار">قيد الانتظار</option>
          <option value="معتمد">معتمد</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>
      <div class="filter-group">
        <label>الديدلاين (من):</label>
        <input type="date" v-model="deadlineFromFilter" class="custom-select small-select" />
      </div>
      <div class="filter-group">
        <label>الديدلاين (إلى):</label>
        <input type="date" v-model="deadlineToFilter" class="custom-select small-select" />
      </div>
    </div>

    <div class="tasks-card">
      <div class="card-heading">
        <div>
          <h3>جدول المهام <span>{{ totalTasks }}</span></h3>
          <p>عرض تفصيلي للمهام المطلوبة وحالة مراجعتها</p>
        </div>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول المهام قابل للتمرير أفقيًا">
        <table class="tasks-table" :aria-busy="isLoading">
          <thead>
            <tr>
              <th scope="col">النوع والمنصة</th>
              <th scope="col">دوري والأطراف</th>
              <th scope="col">الديدلاين</th>
              <th scope="col" class="text-center">موقف التسليم</th>
              <th scope="col" class="text-center">حالة القسم</th>
              <th scope="col" class="text-center">اعتماد المدير</th>
              <th scope="col">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7" class="state-cell">
                <span class="spinner" aria-hidden="true"></span>
                جارٍ تحميل المهام...
              </td>
            </tr>
            <tr v-else-if="tasks.length === 0">
              <td colspan="7" class="state-cell">🎉 لا توجد مهام مطلوبة حاليًا. استمتع بوقتك!</td>
            </tr>
            <tr v-for="task in tasks" v-else :key="task.id">
              
              <!-- 1. النوع والمنصة -->
              <td>
                <div class="task-cell">
                  <div class="task-avatar" aria-hidden="true">{{ getInitials(task.post_type || 'مهمة') }}</div>
                  <div class="task-info">
                    <strong>{{ task.post_type || 'غير محدد' }}</strong>
                    <small v-if="task.plan_name" class="plan-name-label">📁 {{ task.plan_name }}</small>
                    <p class="desc-text" v-if="task.publishing_platform">
                      {{ safeJoin(task.publishing_platform) }}
                    </p>
                    <div class="smart-badges-container" v-if="task.smart_badges && task.smart_badges.length">
                      <span v-for="badge in task.smart_badges" :key="badge.text" class="smart-badge" :style="{ backgroundColor: badge.color }">
                        {{ badge.text }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- 2. دوري في المهمة والأطراف (العمود الجديد) -->
              <td>
                <div class="role-context">
                  <!-- إذا كان الموظف المعروض هو المنفذ -->
                  <template v-if="task.designer_id == targetUserId">
                    <span class="status-badge role-designer">🎨 المنفذ</span>
                    <div class="parties-info">
                      <small>المراجعون:</small>
                      <span>{{ task.reviewer_names ? safeJoin(task.reviewer_names) : 'لا يوجد مراجعين' }}</span>
                    </div>
                    <div class="parties-info" v-if="task.execution_started_at">
                      <small>تم التكليف:</small>
                      <span style="color: #7de8dc;">{{ formatDate(task.execution_started_at) }}</span>
                    </div>
                  </template>
                  
                  <!-- إذا كان الموظف المعروض هو المراجع -->
                  <template v-else>
                    <span class="status-badge role-reviewer">🧐 المراجع</span>
                    <div class="parties-info">
                      <small>المنفذ:</small>
                      <span style="color: #c994ff;">{{ task.designer_name }}</span>
                    </div>
                  </template>
                </div>
              </td>

              <!-- 3. الديدلاين -->
              <td>
                <span :class="['status-badge', getDeadlineTheme(task.deadline, task.delivered_at)]">
                  🕒 {{ formatDate(task.deadline) }}
                </span>
              </td>

              <!-- 4. موقف التسليم -->
              <td class="text-center">
                <span v-if="task.delivered_at" class="status-badge badge-teal">
                  ✅ مُسلم
                  <small style="display:block; font-size: 10px; margin-top: 3px;">{{ formatDate(task.delivered_at) }}</small>
                </span>
                <span v-else class="status-badge badge-pending">
                  ⏳ لم يُسلم
                </span>
              </td>

              <!-- 5. حالة القسم -->
              <td class="text-center">
                <span :class="['status-badge', getStatusTheme(task.review_status)]">
                  {{ task.review_status || 'قيد الانتظار' }}
                </span>
              </td>

              <!-- 6. اعتماد المدير -->
              <td class="text-center">
                <span :class="['status-badge', getStatusTheme(task.manager_review_status)]">
                  {{ task.manager_review_status || 'قيد الانتظار' }}
                </span>
              </td>

              <!-- 7. الإجراءات -->
              <td>
                <div class="actions-cell">
                  <router-link :to="`/plan-board/${task.content_plan_id}`" class="primary-btn small-btn" title="الذهاب للخطة">
                    <span aria-hidden="true">🔗</span> عرض الخطة
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="lastPage > 1" class="pagination-controls">
        <button class="secondary-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">السابق</button>
        <span class="page-info">صفحة {{ currentPage }} من {{ lastPage }}</span>
        <button class="secondary-btn" :disabled="currentPage === lastPage" @click="changePage(currentPage + 1)">التالي</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import api from '../axios';

const tasks = ref([]);
const users = ref([]);
const selectedUserId = ref('');
const isManager = ref(false);
const targetUserId = ref(null); // المتغير الجديد لحفظ الـ ID للموظف المعروض
const isLoading = ref(true);

// Pagination & Filters Variables
const currentPage = ref(1);
const lastPage = ref(1);
const totalItems = ref(0);
const deliveryFilter = ref('');
const reviewFilter = ref('');
const managerReviewFilter = ref('');
const publishStatusFilter = ref('');
const postTypeFilter = ref('');
const deadlineFromFilter = ref('');
const deadlineToFilter = ref('');
const planFilter = ref('');

const plans = ref([]);

const totalTasks = computed(() => totalItems.value);
const deliveredTasks = computed(() => tasks.value.filter(t => t.delivered_at).length); // يتم حساب المعروض أو يمكن تعديل الباك إند ليرجعها
const pendingTasks = computed(() => tasks.value.filter(t => !t.delivered_at).length);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

// دالة آمنة لتحويل المصفوفات أو نصوص JSON إلى نص مقروء
const safeJoin = (arr, sep = '، ') => {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.join(sep);
  if (typeof arr === 'string') {
    try {
      const parsed = JSON.parse(arr);
      if (Array.isArray(parsed)) return parsed.join(sep);
    } catch (e) {
      return arr;
    }
  }
  return String(arr);
};

const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleString('ar-EG', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

const getDeadlineTheme = (deadline, deliveredAt) => {
  if (deliveredAt) return 'badge-teal'; 
  if (!deadline) return 'badge-pending';
  
  const now = new Date();
  const taskDate = new Date(deadline);
  const diffHours = (taskDate - now) / (1000 * 60 * 60);

  if (diffHours < 0) return 'badge-danger'; 
  if (diffHours < 24) return 'badge-warning'; 
  return 'badge-teal'; 
};

const getStatusTheme = (status) => {
  if (status === 'معتمد') return 'badge-teal';
  if (status === 'مرفوض') return 'badge-danger';
  return 'badge-pending';
};

const fetchTasks = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      delivery_status: deliveryFilter.value,
      review_status: reviewFilter.value,
      manager_review_status: managerReviewFilter.value,
      publish_status: publishStatusFilter.value,
      post_type: postTypeFilter.value,
      deadline_from: deadlineFromFilter.value,
      deadline_to: deadlineToFilter.value,
      content_plan_id: planFilter.value
    };
    if (selectedUserId.value) params.user_id = selectedUserId.value;
    
    const response = await api.get('/user-tasks', { params });
    
    tasks.value = response.data.tasks.data;
    currentPage.value = response.data.tasks.current_page;
    lastPage.value = response.data.tasks.last_page;
    totalItems.value = response.data.tasks.total;
    
    isManager.value = response.data.is_manager;
    targetUserId.value = response.data.target_user_id; // حفظ الـ ID لمعرفة دور الموظف
    
    if (isManager.value && users.value.length === 0) {
      fetchUsers();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    users.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const fetchPlans = async () => {
  try {
    const response = await api.get('/content-plans');
    plans.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
  }
};

watch(selectedUserId, () => {
  currentPage.value = 1;
  fetchTasks();
});

watch([
  deliveryFilter, reviewFilter, managerReviewFilter, 
  publishStatusFilter, postTypeFilter, deadlineFromFilter, 
  deadlineToFilter, planFilter
], () => {
  currentPage.value = 1;
  fetchTasks();
});

const changePage = (page) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page;
    fetchTasks();
  }
};

onMounted(() => {
  fetchTasks();
  fetchPlans();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}

.tasks-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}

.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 25px;
}

.page-intro { min-width: 0; }

.eyebrow {
  display: inline-block;
  color: #76e8de;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: .35px;
}

.page-topline h2 {
  margin: 8px 0 5px;
  color: #f5f6ff;
  font-size: clamp(26px, 2.5vw, 32px);
  line-height: 1.25;
  font-weight: 800;
}

.page-topline p {
  max-width: 680px;
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
}

.manager-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.manager-controls label {
  color: #c7cde8;
  font-size: 13px;
  font-weight: 600;
}

.custom-select {
  width: 100%;
  border: 1px solid rgba(145, 160, 230, .2);
  border-radius: 10px;
  outline: 0;
  color: #eef0ff;
  background: rgba(6, 11, 37, .46);
  font: inherit;
  font-size: 14px;
  min-height: 48px;
  padding: 0 13px;
  cursor: pointer;
}

.custom-select:focus {
  border-color: #76e8de;
  box-shadow: 0 0 0 3px rgba(118, 232, 222, .1);
}

.custom-select option {
  background: #171d52;
  color: #fff;
}

.primary-btn {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 19px;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .2s ease, filter .2s ease;
  border: 0;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  box-shadow: 0 9px 22px rgba(111, 222, 211, .13);
  text-decoration: none;
}

.primary-btn.small-btn {
  min-height: 38px;
  font-size: 13px;
  padding: 0 14px;
}

.primary-btn span {
  font-size: 18px;
  line-height: 0;
}

.primary-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 15px;
  background: rgba(137, 153, 226, .13);
}

.summary-strip > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(21, 29, 73, .68);
}

.summary-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 19px;
}

.teal { color: #7de8dc; background: rgba(93, 222, 209, .12); }
.purple { color: #c994ff; background: rgba(180, 112, 255, .12); }
.orange { color: #ffd166; background: rgba(255, 209, 102, .12); }

.summary-strip small, .summary-strip strong { display: block; }
.summary-strip small { color: #929dc8; font-size: 12px; line-height: 1.5; }
.summary-strip strong { margin-top: 2px; color: #eef0ff; font-size: 24px; line-height: 1.2; }

.tasks-card {
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 18px;
  background: rgba(15, 22, 61, .65);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 18px;
}

.card-heading h3 {
  margin: 0;
  color: #f0f2ff;
  font-size: 18px;
  line-height: 1.4;
}

.card-heading h3 span {
  display: inline-block;
  margin-right: 7px;
  padding: 3px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, .11);
  font-size: 12px;
  vertical-align: middle;
}

.card-heading p { margin: 5px 0 0; color: #8691bf; font-size: 12px; line-height: 1.6; }

.table-responsive {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}

.tasks-table {
  width: 100%;
  min-width: 960px; /* تم زيادة العرض لاستيعاب العمود الجديد */
  border-collapse: collapse;
  text-align: right;
}

.tasks-table th, .tasks-table td {
  padding: 15px 20px;
  border-top: 1px solid rgba(138, 152, 222, .09);
  vertical-align: middle;
}

.tasks-table th {
  color: #8792be;
  background: rgba(10, 16, 47, .35);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  white-space: nowrap;
}

.tasks-table td {
  color: #d9ddf5;
  font-size: 14px;
  line-height: 1.6;
}

.text-center { text-align: center; }

.task-cell {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 170px;
}

.task-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 13px;
  font-weight: 800;
}

.task-info strong {
  display: block;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
}

.desc-text {
  margin: 0;
  color: #929dc8;
  font-size: 12px;
  line-height: 1.6;
}

/* تنسيقات عمود الأدوار والأطراف */
.role-context {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-width: 180px;
}

.role-designer {
  background: rgba(180, 112, 255, 0.15) !important;
  color: #c994ff !important;
  border-color: rgba(180, 112, 255, 0.2) !important;
}

.role-reviewer {
  background: rgba(93, 222, 209, 0.15) !important;
  color: #7de8dc !important;
  border-color: rgba(93, 222, 209, 0.2) !important;
}

.parties-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.parties-info small {
  color: #8490bd;
  font-weight: 600;
}

.parties-info span {
  color: #eef0ff;
}

.status-badge {
  display: inline-block;
  padding: 6px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-teal {
  color: #7de8dc;
  background: rgba(93, 222, 209, .12);
  border-color: rgba(93, 222, 209, .2);
}

.badge-pending {
  color: #a3add1;
  background: rgba(163, 173, 209, .12);
  border-color: rgba(163, 173, 209, .2);
}

.badge-danger {
  color: #ff94ab;
  background: rgba(255, 103, 139, .12);
  border-color: rgba(255, 103, 139, .2);
}

.badge-warning {
  color: #ffd166;
  background: rgba(255, 209, 102, .12);
  border-color: rgba(255, 209, 102, .2);
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.state-cell {
  height: 160px;
  color: #8e99c3 !important;
  text-align: center !important;
  font-size: 14px !important;
}

.spinner {
  width: 18px;
  height: 18px;
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
  border: 2px solid rgba(125, 232, 220, .25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ستايلات الفلاتر والباجينيشن (Pagination) */
.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  background: rgba(15, 22, 61, .65);
  padding: 15px 20px;
  border-radius: 12px;
  border: 1px solid rgba(137, 153, 226, .13);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  color: #c7cde8;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.small-select {
  min-height: 38px;
  padding: 0 10px;
  font-size: 13px;
  width: 100%;
}

/* تنسيق حقل التاريخ بشكل خاص داخل الثيم المظلم */
input[type="date"].custom-select::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.6;
}
input[type="date"].custom-select::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid rgba(138, 152, 222, .09);
}

.pagination-controls .secondary-btn {
  background: rgba(10, 16, 47, .45);
  color: #eef0ff;
  border: 1px solid rgba(137, 153, 226, .2);
  padding: 8px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-controls .secondary-btn:hover:not(:disabled) {
  background: rgba(118, 232, 222, .1);
  border-color: #7de8dc;
}

.pagination-controls .secondary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #9aa4cf;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 980px) {
  .summary-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item:last-child { grid-column: 1 / -1; }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
}

.plan-name-label {
  display: block;
  color: #a7b6ff;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  margin-bottom: 4px;
}

.smart-badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.smart-badge {
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
</style>