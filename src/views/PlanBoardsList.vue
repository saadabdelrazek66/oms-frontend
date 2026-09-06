<template>
  <section class="boards-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / مصنع المحتوى</span>
        <h2>محتويات الخطط (Content Boards)</h2>
        <p>اختر الخطة للبدء في صياغة المحتوى، توزيع المهام، ومتابعة النشر.</p>
      </div>
    </div>

    <div v-if="loading" class="state-cell"><span class="spinner"></span> جارٍ تحميل خطط المحتوى...</div>
    <div v-else-if="plans.length === 0" class="state-cell">لا توجد خطط متاحة حالياً. قم بإنشاء خطة جديدة أولاً.</div>

    <div v-else class="boards-grid">
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
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../axios';

const plans = ref([]);
const loading = ref(true);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fetchPlans = async () => {
  loading.value = true;
  try {
    const response = await api.get('/content-plans');
    plans.value = response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching plans:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPlans);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.boards-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; }
.page-topline { margin-bottom: 30px; }
.eyebrow { color: #76e8de; font-size: 10px; font-weight: 700; letter-spacing: 0.7px; }
.page-topline h2 { margin: 7px 0 3px; font-size: 28px; }
.page-topline p { margin: 0; color: #818cb9; font-size: 12px; }

.boards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.board-card { background: rgba(15, 22, 61, 0.65); border: 1px solid rgba(137, 153, 226, 0.15); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: 0.2s; }
.board-card:hover { transform: translateY(-3px); border-color: rgba(125, 232, 220, 0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

.bc-header { display: flex; align-items: center; gap: 12px; padding: 20px; background: rgba(10, 16, 47, 0.35); border-bottom: 1px solid rgba(137, 153, 226, 0.1); }
.bc-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(145deg, #80e8df, #ac84fa); color: #12183f; display: grid; place-items: center; font-weight: bold; font-size: 12px; }
.bc-title h3 { margin: 0; font-size: 15px; color: #fff; }
.bc-title span { font-size: 10px; color: #7de8dc; background: rgba(89, 220, 207, 0.11); padding: 2px 7px; border-radius: 6px; }

.bc-body { padding: 20px; flex-grow: 1; }
.date-row small { display: block; color: #7782b0; font-size: 10px; margin-bottom: 4px; }
.date-row strong { font-size: 13px; color: #d9ddf5; }
.muted { color: #5a648c !important; }

.bc-footer { padding: 15px 20px; border-top: 1px dashed rgba(137, 153, 226, 0.1); }
.open-board-btn { width: 100%; display: flex; align-items: center; justify-content: center; min-height: 40px; border-radius: 10px; background: linear-gradient(110deg, #7de8dc, #b28aff); color: #12183f; text-decoration: none; font-size: 12px; font-weight: 800; transition: 0.2s; }
.open-board-btn:hover { filter: brightness(1.1); }

.state-cell { padding: 50px; text-align: center; color: #7d89b6; font-size: 14px; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(125, 232, 220, 0.25); border-top-color: #7de8dc; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-left: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>