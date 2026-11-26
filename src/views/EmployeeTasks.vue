<template>
  <section class="tasks-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">تسليمات الخطط</span>
        <h2>منشوراتي المطلوبة</h2>
      </div>
      
      <!-- قائمة الموظفين (تظهر للمدير فقط) -->
      <div v-if="isManager" class="manager-controls">
        <label for="userSelect">الموظف:</label>
        <select id="userSelect" v-model="selectedUserId" class="custom-select">
          <option value="">-- مهامي --</option>
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
          <small>الإجمالي</small>
          <strong>{{ totalTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon purple" aria-hidden="true">✓</span>
        <div>
          <small>مُسلّمة</small>
          <strong>{{ deliveredTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon orange" aria-hidden="true">⏳</span>
        <div>
          <small>قيد التسليم</small>
          <strong>{{ pendingTasks }}</strong>
        </div>
      </div>
    </div>

    <!-- شريط سعة اليوم المضغوط (مرجع سريع مرتبط بخطة اليوم) -->
    <div class="compact-capacity-strip" v-if="dailyWorkload">
      <div class="cap-left">
        <span class="cap-icon">⚡</span>
        <span class="cap-label">ساعات اليوم:</span>
        <span class="hours-badge" :class="getWorkloadBadgeClass(dailyWorkload.total_hours, dailyWorkload.max_daily_capacity || 8)">
          {{ dailyWorkload.total_hours }} / {{ dailyWorkload.max_daily_capacity || 8 }} س
        </span>
        <div class="mini-progress-track">
          <div
            class="workload-progress-fill"
            :class="getWorkloadFillClass(dailyWorkload.total_hours, dailyWorkload.max_daily_capacity || 8)"
            :style="{ width: `${computeCapacityPercent(dailyWorkload.total_hours, dailyWorkload.max_daily_capacity || 8)}%` }"
          ></div>
        </div>
        <span v-if="dailyWorkload.is_overloaded" class="cap-status danger">⚠️ مضغوط</span>
        <span v-else class="cap-status ok">متبقٍ {{ dailyWorkload.remaining_hours }} س</span>
      </div>

      <router-link v-if="can('workload.view')" :to="todayBoardLink" class="compact-today-link">
        ⏱️ إدارة ساعات اليوم ↗
      </router-link>
    </div>

    <!-- شريط البحث والفلاتر -->
    <div class="filters-panel">
      <div class="filters-primary-row">
        <div class="filter-group filter-search">
          <label for="taskSearch">بحث سريع</label>
          <div class="search-input-wrap">
            <input
              id="taskSearch"
              v-model="searchQuery"
              type="search"
              class="custom-select small-select search-input"
              placeholder="ابحث بالخطة، النوع، أو المنصة..."
            />
          </div>
        </div>

        <div class="filter-group">
          <label>خطة المحتوى</label>
          <select v-model="planFilter" class="custom-select small-select">
            <option value="">جميع الخطط</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name || plan.title || 'خطة ' + plan.id }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>التسليم</label>
          <select v-model="deliveryFilter" class="custom-select small-select">
            <option value="">الكل</option>
            <option value="pending">لم يُسلم</option>
            <option value="delivered">مُسلم</option>
          </select>
        </div>

        <div class="filter-group">
          <label>اعتماد المدير</label>
          <select v-model="managerReviewFilter" class="custom-select small-select">
            <option value="">الكل</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="معتمد">معتمد</option>
            <option value="مرفوض">مرفوض</option>
          </select>
        </div>

        <div class="filter-actions-group">
          <button
            type="button"
            class="filter-toggle-btn"
            :class="{ active: showAdvancedFilters || activeAdvancedCount > 0 }"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            <span>⚙️ فلاتر إضافية</span>
            <span v-if="activeAdvancedCount > 0" class="filter-count-pill">{{ activeAdvancedCount }}</span>
            <span class="chevron">{{ showAdvancedFilters ? '▲' : '▼' }}</span>
          </button>

          <button
            v-if="hasActiveFilters"
            type="button"
            class="filter-reset-btn"
            @click="resetFilters"
            title="مسح كافة الفلاتر"
          >
            ✕ مسح
          </button>
        </div>
      </div>

      <div v-show="showAdvancedFilters" class="filters-advanced-row">
        <div class="filter-group">
          <label>نوع المنشور</label>
          <select v-model="postTypeFilter" class="custom-select small-select">
            <option value="">الكل</option>
            <option value="تصميم">تصميم</option>
            <option value="فيديو">فيديو</option>
            <option value="مقال">مقال</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <div class="filter-group">
          <label>حالة القسم</label>
          <select v-model="reviewFilter" class="custom-select small-select">
            <option value="">الكل</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="معتمد">معتمد</option>
            <option value="مرفوض">مرفوض</option>
          </select>
        </div>
        <div class="filter-group">
          <label>حالة النشر</label>
          <select v-model="publishStatusFilter" class="custom-select small-select">
            <option value="">الكل</option>
            <option value="تم النشر">تم النشر</option>
            <option value="لم يتم">لم يتم</option>
          </select>
        </div>
        <div class="filter-group">
          <label>الديدلاين (من)</label>
          <input type="date" v-model="deadlineFromFilter" class="custom-select small-select" />
        </div>
        <div class="filter-group">
          <label>الديدلاين (إلى)</label>
          <input type="date" v-model="deadlineToFilter" class="custom-select small-select" />
        </div>
      </div>
    </div>

    <div class="tasks-card">
      <div class="card-heading">
        <h3>جدول التسليمات <span>{{ totalTasks }}</span></h3>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول التسليمات قابل للتمرير أفقيًا">
        <table class="tasks-table" :aria-busy="isLoading">
          <thead>
            <tr>
              <th scope="col" style="width: 50px; text-align: center;">#</th>
              <th scope="col">النوع والمنصة</th>
              <th scope="col">دوري والأطراف</th>
              <th scope="col">الديدلاين</th>
              <th scope="col" class="text-center">التسليم</th>
              <th scope="col" class="text-center">القسم</th>
              <th scope="col" class="text-center">المدير</th>
              <th scope="col">إجراء</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" class="state-cell">
                <span class="spinner" aria-hidden="true"></span>
                جارٍ التحميل...
              </td>
            </tr>
            <tr v-else-if="tasks.length === 0">
              <td colspan="8" class="state-cell">
                <span v-if="hasActiveFilters">لا توجد نتائج مطابقة للفلاتر الحالية.</span>
                <span v-else>لا توجد منشورات مطلوبة حالياً.</span>
                <button v-if="hasActiveFilters" type="button" class="inline-reset-link" @click="resetFilters">
                  مسح الفلاتر
                </button>
              </td>
            </tr>
            <tr v-for="(task, index) in tasks" v-else :key="task.id">
              <td class="text-center row-num-cell" style="font-weight: 700; color: #8792be; width: 50px; vertical-align: middle;">{{ ((currentPage - 1) * perPage) + index + 1 }}</td>
              
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
                    <div class="smart-badges-container">
                      <span v-if="task.is_urgent" class="smart-badge badge-urgent-glow" title="منشور عاجل ذو أولوية قصوى">🔥 عاجل</span>
                      <span v-if="task.is_displaced" class="smart-badge badge-displaced-glow" :title="task.displaced_reason || 'تم الترحيل بقرار إداري لإفساح المجال لمنشور طارئ'">🔄 مُرحّل رسمياً</span>
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

              <!-- 3. الديدلاين وساعات العمل -->
              <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span :class="['status-badge', getDeadlineTheme(task.deadline, task.delivered_at)]">
                    🕒 {{ formatDate(task.deadline) }}
                  </span>
                  <div class="task-hours-strip">
                    <span class="hours-tag" :title="`إجمالي ساعات المنشور: ${task.total_estimated_hours || 2} س`">
                      ⏱️ <strong>{{ task.allocated_hours_today ?? task.total_estimated_hours ?? 2 }}</strong> س اليوم
                    </span>
                    <span v-if="task.is_partially_shifted" class="smart-badge badge-partial-glow" :title="`تم تشفيت ${task.shifted_hours_to_future} ساعة من هذا المنشور للغد`">
                      🔄 مشفت {{ task.shifted_hours_to_future }}س
                    </span>
                    <span v-if="task.is_shifted_to_today" class="smart-badge badge-incoming-glow" :title="`ساعات قادمة من ${task.shifted_from_date}`">
                      📥 من {{ task.shifted_from_date }}
                    </span>
                  </div>
                  <small v-if="task.is_displaced && task.original_deadline" style="color: #a78bfa; font-size: 10px; font-weight: bold;" :title="task.displaced_reason || 'تم الترحيل بقرار إداري'">
                    السابق: {{ formatDate(task.original_deadline) }}
                  </small>
                </div>
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
                  <router-link :to="{ path: `/plan-board/${task.content_plan_id}`, query: { postId: task.id } }" class="primary-btn small-btn" title="فتح المنشور للتسليم أو المراجعة">
                    <span aria-hidden="true">📊</span> فتح المنشور
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
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import api from '../axios';
import { usePermissions } from '@/composables/usePermissions';
import {
  getInitials,
  safeJoinList as safeJoin,
  formatArabicShortDateTime as formatDate,
  computeCapacityPercent,
  getWorkloadBadgeClass,
  getWorkloadFillClass,
} from '@/utils/workloadHelper';

const { can } = usePermissions();

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
const perPage = ref(10);
const searchQuery = ref('');
const showAdvancedFilters = ref(false);
const deliveryFilter = ref('');
const reviewFilter = ref('');
const managerReviewFilter = ref('');
const publishStatusFilter = ref('');
const postTypeFilter = ref('');
const deadlineFromFilter = ref('');
const deadlineToFilter = ref('');
const planFilter = ref('');

const plans = ref([]);

const activeAdvancedCount = computed(() =>
  [
    postTypeFilter.value,
    reviewFilter.value,
    publishStatusFilter.value,
    deadlineFromFilter.value,
    deadlineToFilter.value,
  ].filter(Boolean).length
);

const hasActiveFilters = computed(() =>
  Boolean(
    searchQuery.value.trim() ||
    planFilter.value ||
    deliveryFilter.value ||
    managerReviewFilter.value ||
    activeAdvancedCount.value > 0
  )
);

const totalTasks = computed(() => totalItems.value);
const deliveredTasks = computed(() => tasks.value.filter(t => t.delivered_at).length);
const pendingTasks = computed(() => tasks.value.filter(t => !t.delivered_at).length);

const resetFilters = () => {
  searchQuery.value = '';
  planFilter.value = '';
  deliveryFilter.value = '';
  managerReviewFilter.value = '';
  postTypeFilter.value = '';
  reviewFilter.value = '';
  publishStatusFilter.value = '';
  deadlineFromFilter.value = '';
  deadlineToFilter.value = '';
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
      search: searchQuery.value.trim(),
      delivery_status: deliveryFilter.value,
      review_status: reviewFilter.value,
      manager_review_status: managerReviewFilter.value,
      actual_publish_status: publishStatusFilter.value,
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
    perPage.value = response.data.tasks.per_page || 10;
    
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
    const response = await api.get('/users/options');
    users.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const fetchPlans = async () => {
  try {
    const response = await api.get('/content-plans/options');
    plans.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
  }
};

const dailyWorkload = ref(null);

const todayBoardLink = computed(() => ({
  path: '/today-board',
  query: selectedUserId.value ? { user_id: selectedUserId.value } : {},
}));

const fetchWorkload = async () => {
  try {
    const params = {};
    if (selectedUserId.value) params.user_id = selectedUserId.value;
    const res = await api.get('/workload/daily-capacity', { params });
    if (res.data?.success) {
      dailyWorkload.value = res.data.data;
    }
  } catch (err) {
    console.error('Error fetching workload:', err);
  }
};

let searchDebounceTimer = null;

watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchTasks();
  }, 300);
});

watch(selectedUserId, () => {
  currentPage.value = 1;
  fetchTasks();
  fetchWorkload();
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
  fetchWorkload();
});

onBeforeUnmount(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
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

/* شريط سعة اليوم المضغوط */
.compact-capacity-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: rgba(15, 23, 61, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.18);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 18px;
}

.cap-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.cap-icon {
  font-size: 16px;
}

.cap-label {
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
}

.mini-progress-track {
  width: 110px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.cap-status {
  font-size: 12px;
  font-weight: 700;
}

.cap-status.danger { color: #f87171; }
.cap-status.ok { color: #7de8dc; }

.compact-today-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.3);
  color: #7de8dc;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 0.15s, background 0.15s;
}

.compact-today-link:hover {
  background: rgba(125, 232, 220, 0.22);
  transform: translateY(-1px);
}

.hours-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
}
.hours-badge.badge-green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.hours-badge.badge-orange {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.hours-badge.badge-red {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.workload-progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease, background-color 0.4s ease;
}
.fill-green {
  background: linear-gradient(90deg, #10b981, #34d399);
}
.fill-orange {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.fill-red {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
.badge-urgent-glow {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #ff8b9f !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  font-weight: 800;
}
.badge-displaced-glow {
  background: rgba(147, 51, 234, 0.2) !important;
  color: #d8b4fe !important;
  border: 1px solid rgba(168, 85, 247, 0.4) !important;
  font-weight: 700;
}

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

.row-num-cell {
  text-align: center !important;
  font-weight: 700;
  color: #8792be !important;
  width: 50px;
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

/* ستايلات البحث والفلاتر والباجينيشن (Pagination) */
.filters-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
  background: rgba(15, 22, 61, .65);
  padding: 15px 18px;
  border-radius: 14px;
  border: 1px solid rgba(137, 153, 226, .13);
}

.filters-primary-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) repeat(3, minmax(150px, 1fr)) auto;
  gap: 12px;
  align-items: end;
}

.filters-advanced-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(137, 153, 226, .12);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  color: #c7cde8;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.search-input {
  cursor: text;
}

.filter-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-toggle-btn {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid rgba(145, 160, 230, .24);
  background: rgba(6, 11, 37, .48);
  color: #dce2ff;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color .15s, background .15s;
}

.filter-toggle-btn:hover,
.filter-toggle-btn.active {
  border-color: rgba(125, 232, 220, .45);
  background: rgba(125, 232, 220, .1);
  color: #7de8dc;
}

.filter-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #7de8dc;
  color: #0e1435;
  font-size: 11px;
  font-weight: 800;
}

.filter-toggle-btn .chevron {
  font-size: 10px;
  opacity: .75;
}

.filter-reset-btn {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 107, 139, .3);
  background: rgba(255, 107, 139, .1);
  color: #ff94ab;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.filter-reset-btn:hover {
  background: rgba(255, 107, 139, .18);
}

.inline-reset-link {
  margin-right: 8px;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid rgba(125, 232, 220, .35);
  background: rgba(125, 232, 220, .1);
  color: #7de8dc;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
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
  .filters-primary-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-search { grid-column: 1 / -1; }
  .filter-actions-group { grid-column: 1 / -1; justify-content: flex-start; }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .summary-strip { grid-template-columns: 1fr; }
  .summary-item:last-child { grid-column: auto; }
  .filters-primary-row { grid-template-columns: 1fr; }
  .compact-capacity-strip { flex-direction: column; align-items: stretch; }
  .compact-today-link { justify-content: center; }
  .card-heading { flex-direction: column; align-items: flex-start; gap: 12px; }
  .manager-controls { width: 100%; }
  .actions-cell .primary-btn { width: auto; }
  .pagination-controls { flex-wrap: wrap; gap: 10px; }
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

/* --- شارات ساعات المهمة المجدولة --- */
.task-hours-strip {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.hours-tag {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 7px;
  border-radius: 6px;
}

.badge-partial-glow {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #fbbf24 !important;
  border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

.badge-incoming-glow {
  background: rgba(99, 102, 241, 0.2) !important;
  color: #a5b4fc !important;
  border: 1px solid rgba(99, 102, 241, 0.4) !important;
}
</style>