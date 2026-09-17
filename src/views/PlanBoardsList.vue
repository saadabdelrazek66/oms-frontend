<template>
  <section class="boards-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / مصنع المحتوى</span>
        <h2>محتويات الخطط (Content Boards)</h2>
        <p>اختر الخطة للبدء في صياغة المحتوى، توزيع المهام، ومتابعة النشر.</p>
      </div>
    </div>

    <!-- حالة التحميل الأولي -->
    <div v-if="loading && plans.length === 0" class="state-cell">
      <span class="spinner"></span> جارٍ تحميل خطط المحتوى...
    </div>

    <!-- حالة عدم وجود خطط -->
    <div v-else-if="!plans || plans.length === 0" class="state-cell">
      لا توجد خطط متاحة حالياً. قم بإنشاء خطة جديدة أولاً.
    </div>

    <!-- شبكة الخطط وعناصر التحكم بالصفحات -->
    <div v-else>
      <div class="boards-grid" :class="{ 'is-fetching': loading }">
        <div v-for="plan in plans" :key="plan.id" class="board-card">
          <div class="bc-header">
            <div class="bc-avatar">{{ getInitials(plan.client?.name || '?') }}</div>
            <div class="bc-title">
              <h3>{{ plan.client?.name || 'عميل محذوف' }}</h3>
              <span>{{ plan.plan_type }}</span>
            </div>
          </div>
          <div class="bc-body">
            <div class="date-row" v-if="plan.start_date && plan.end_date">
              <small>فترة الخطة المحددة:</small>
              <strong dir="ltr">{{ formatDate(plan.start_date) }} ⭢ {{ formatDate(plan.end_date) }}</strong>
            </div>
            <div class="date-row" v-else>
              <small>فترة الخطة:</small>
              <strong class="muted">لم يتم تحديد التواريخ</strong>
            </div>
          </div>
          <div class="bc-footer">
            <router-link :to="`/plan-board/${plan.id}`" class="primary-btn open-board-btn">
              فتح لوحة المحتوى (Spreadsheet) 🚀
            </router-link>
          </div>
        </div>
      </div>

      <!-- أزرار التصفح (Pagination Controls) -->
      <div class="pagination-wrapper" v-if="plans && plans.length > 0">
        <button
          type="button"
          class="page-btn prev-btn"
          :disabled="currentPage === 1 || loading"
          @click="fetchPlans(currentPage - 1)"
          aria-label="الصفحة السابقة"
        >
          <span>→</span> السابق
        </button>

        <div class="page-indicator">
          <span>صفحة</span>
          <strong>{{ currentPage }}</strong>
          <span>من</span>
          <strong>{{ lastPage }}</strong>
          <span v-if="totalPlans" class="total-count">({{ totalPlans }} خطة)</span>
        </div>

        <button
          type="button"
          class="page-btn next-btn"
          :disabled="currentPage === lastPage || loading"
          @click="fetchPlans(currentPage + 1)"
          aria-label="الصفحة التالية"
        >
          التالي <span>←</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../axios';

const plans = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const lastPage = ref(1);
const totalPlans = ref(0);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fetchPlans = async (page = 1) => {
  if (page < 1) return;
  loading.value = true;
  try {
    const response = await api.get(`/plans/boards?page=${page}`);
    
    // دعم الاستجابة المباشرة (Paginated Object) أو المغلفة داخل data
    const resData = response.data;
    if (resData && Array.isArray(resData.data)) {
      plans.value = resData.data;
      currentPage.value = resData.current_page || page;
      lastPage.value = resData.last_page || 1;
      totalPlans.value = resData.total ?? resData.data.length;
    } else if (resData?.data && Array.isArray(resData.data.data)) {
      plans.value = resData.data.data;
      currentPage.value = resData.data.current_page || page;
      lastPage.value = resData.data.last_page || 1;
      totalPlans.value = resData.data.total ?? resData.data.data.length;
    } else if (Array.isArray(resData)) {
      plans.value = resData;
      currentPage.value = 1;
      lastPage.value = 1;
      totalPlans.value = resData.length;
    } else {
      plans.value = [];
    }

    // التمرير السلس لأعلى القائمة عند الانتقال لصفحة أخرى
    if (page !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
    plans.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchPlans(1));
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.boards-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; }
.page-topline { margin-bottom: 30px; }
.eyebrow { color: #76e8de; font-size: 10px; font-weight: 700; letter-spacing: 0.7px; }
.page-topline h2 { margin: 7px 0 3px; font-size: 28px; }
.page-topline p { margin: 0; color: #818cb9; font-size: 12px; }

.boards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
  gap: 20px; 
  transition: opacity 0.2s ease;
}
.boards-grid.is-fetching {
  opacity: 0.55;
  pointer-events: none;
}

.board-card { 
  background: rgba(15, 22, 61, 0.65); 
  border: 1px solid rgba(137, 153, 226, 0.15); 
  border-radius: 16px; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column; 
  transition: 0.2s; 
  content-visibility: auto; 
  contain-intrinsic-size: 170px; 
}
.board-card:hover { 
  transform: translateY(-3px); 
  border-color: rgba(125, 232, 220, 0.4); 
  box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
}

.bc-header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  padding: 20px; 
  background: rgba(10, 16, 47, 0.35); 
  border-bottom: 1px solid rgba(137, 153, 226, 0.1); 
}
.bc-avatar { 
  width: 40px; 
  height: 40px; 
  border-radius: 10px; 
  background: linear-gradient(145deg, #80e8df, #ac84fa); 
  color: #12183f; 
  display: grid; 
  place-items: center; 
  font-weight: bold; 
  font-size: 12px; 
}
.bc-title h3 { margin: 0; font-size: 15px; color: #fff; }
.bc-title span { font-size: 10px; color: #7de8dc; background: rgba(89, 220, 207, 0.11); padding: 2px 7px; border-radius: 6px; }

.bc-body { padding: 20px; flex-grow: 1; }
.date-row small { display: block; color: #7782b0; font-size: 10px; margin-bottom: 4px; }
.date-row strong { font-size: 13px; color: #d9ddf5; }
.muted { color: #5a648c !important; }

.bc-footer { padding: 15px 20px; border-top: 1px dashed rgba(137, 153, 226, 0.1); }
.open-board-btn { 
  width: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  min-height: 40px; 
  border-radius: 10px; 
  background: linear-gradient(110deg, #7de8dc, #b28aff); 
  color: #12183f; 
  text-decoration: none; 
  font-size: 12px; 
  font-weight: 800; 
  transition: 0.2s; 
}
.open-board-btn:hover { filter: brightness(1.1); }

.state-cell { padding: 50px; text-align: center; color: #7d89b6; font-size: 14px; }
.spinner { 
  display: inline-block; 
  width: 20px; 
  height: 20px; 
  border: 2px solid rgba(125, 232, 220, 0.25); 
  border-top-color: #7de8dc; 
  border-radius: 50%; 
  animation: spin 0.7s linear infinite; 
  vertical-align: middle; 
  margin-left: 8px; 
}
@keyframes spin { to { transform: rotate(360deg); } }

/* أزرار التصفح (Pagination Styles) */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 35px;
  padding: 14px 20px;
  background: rgba(15, 22, 61, 0.45);
  border: 1px solid rgba(137, 153, 226, 0.15);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: rgba(125, 232, 220, 0.1);
  border: 1px solid rgba(125, 232, 220, 0.25);
  border-radius: 10px;
  color: #7de8dc;
  font-family: 'Cairo', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  color: #12183f;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(125, 232, 220, 0.3);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: rgba(137, 153, 226, 0.1);
  color: #7c87b5;
  background: transparent;
  transform: none;
  box-shadow: none;
}

.page-indicator {
  font-size: 13px;
  color: #cbd5f7;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 16, 47, 0.6);
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid rgba(137, 153, 226, 0.12);
}

.page-indicator strong {
  color: #7de8dc;
  font-weight: 800;
}

.total-count {
  font-size: 11px;
  color: #7c87b5;
  margin-right: 4px;
}

@media (max-width: 600px) {
  .pagination-wrapper {
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
  }
  .page-indicator {
    order: -1;
    width: 100%;
    justify-content: center;
  }
  .page-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>