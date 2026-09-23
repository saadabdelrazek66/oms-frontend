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
        <div 
          v-for="(plan, index) in plans" 
          :key="plan.id" 
          class="board-card"
          role="button"
          tabindex="0"
          @click="goToBoard(plan.id)"
          @keydown.enter.prevent="goToBoard(plan.id)"
          @keydown.space.prevent="goToBoard(plan.id)"
          :title="plan.name || parsePlan(plan).displayTitle"
        >
          <!-- خط التوهج العلوي التفاعلي -->
          <div class="card-glow-bar"></div>

          <!-- رأس الكارت: بيانات العميل ورقم الخطة والشارة إذا لزم الأمر -->
          <div class="bc-header">
            <div class="bc-client-block">
              <ClientAvatar
                :logo-url="plan.client?.logo_url"
                :name="plan.client?.name"
                size="34"
                rounded="9px"
                class="bc-avatar"
              />
              <div class="bc-client-info">
                <span class="bc-client-label">العميل</span>
                <span class="bc-client-name" :title="plan.client?.name">
                  {{ plan.client?.name || 'عميل غير محدد' }}
                </span>
              </div>
            </div>
            
            <div class="bc-header-badges">
              <!-- شارة نوع الخطة تظهر فقط إذا كان العنوان لا يحتوي عليها (لتجنب أي تكرار) -->
              <span 
                class="plan-type-pill" 
                v-if="plan.plan_type && !parsePlan(plan).displayTitle.includes(plan.plan_type)"
              >
                {{ plan.plan_type }}
              </span>
              <span class="plan-id-pill">#{{ ((currentPage - 1) * perPage) + index + 1 }}</span>
            </div>
          </div>

          <!-- جسم الكارت: اسم الخطة المنقى تماماً من التكرار + شريط الفترة المنظم -->
          <div class="bc-body">
            <div class="plan-name-box">
              <span class="plan-name-tag">اسم الخطة</span>
              <h3 class="plan-name-title" :title="plan.name || parsePlan(plan).displayTitle">
                {{ parsePlan(plan).displayTitle }}
              </h3>
            </div>

            <!-- فترة الخطة المنظمة في سطر مستقل بدقة وبدون تشويه النصوص أو تداخل الاتجاهات -->
            <div class="plan-date-row" v-if="parsePlan(plan).startDate && parsePlan(plan).endDate">
              <div class="date-chip">
                <span class="chip-icon">📅</span>
                <span class="chip-dates" dir="ltr">
                  {{ formatDisplayDate(parsePlan(plan).startDate) }} ⭢ {{ formatDisplayDate(parsePlan(plan).endDate) }}
                </span>
              </div>
              <span class="duration-chip" v-if="parsePlan(plan).duration">
                {{ parsePlan(plan).duration }}
              </span>
            </div>
          </div>

          <!-- أسفل الكارت: زر الدخول التفاعلي المحسن -->
          <div class="bc-footer">
            <button 
              type="button" 
              class="open-board-btn" 
              @click.stop="goToBoard(plan.id)"
              tabindex="-1"
            >
              <div class="btn-content">
                <span class="btn-icon">⚡</span>
                <span class="btn-text">فتح لوحة المحتوى (Spreadsheet)</span>
              </div>
              <span class="btn-arrow">←</span>
            </button>
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
import { useRouter } from 'vue-router';
import api from '../axios';
import ClientAvatar from '@/components/ClientAvatar.vue';

const router = useRouter();

const plans = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const lastPage = ref(1);
const totalPlans = ref(0);
const perPage = ref(10);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

// دالة ذكية لتنسيق التاريخ وحمايته من مشاكل الـ RTL
const formatDisplayDate = (s) => {
  if (!s) return '';
  if (typeof s === 'string' && s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD -> DD-MM-YYYY
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return s;
    }
  }
  return s;
};

// دالة حساب مدة الخطة بدقة
const calculateDuration = (startStr, endStr) => {
  try {
    const parseDateObj = (s) => {
      if (!s) return null;
      if (typeof s === 'string' && s.includes('-')) {
        const parts = s.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (parts[2].length === 4) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };

    const d1 = parseDateObj(startStr);
    const d2 = parseDateObj(endStr);
    if (!d1 || !d2) return '';

    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 0) {
      if (diffDays === 1) return 'يوم واحد';
      if (diffDays === 2) return 'يومان';
      if (diffDays >= 3 && diffDays <= 10) return `${diffDays} أيام`;
      return `${diffDays} يوماً`;
    }
  } catch (e) {}
  return '';
};

// المعالج الذكي لمنع تكرار البيانات وإعادة هيكلة اسم الخطة وتفاصيلها بأفضل صورة
const parsePlan = (plan) => {
  if (!plan) return { displayTitle: 'خطة غير محددة', startDate: '', endDate: '', duration: '' };

  const rawName = (plan.name || plan.title || plan.plan_name || '').trim();
  const clientName = (plan.client?.name || '').trim();
  const planType = (plan.plan_type || '').trim();

  // 1. استخراج التواريخ من الحقول أو من نص الخطة إذا كانت مدمجة
  let startDate = plan.start_date || '';
  let endDate = plan.end_date || '';

  if ((!startDate || !endDate) && rawName) {
    const dateMatch = rawName.match(/من\s+([0-9\-\/]+)\s+إلى\s+([0-9\-\/]+)/i);
    if (dateMatch) {
      startDate = startDate || dateMatch[1];
      endDate = endDate || dateMatch[2];
    }
  }

  // 2. تنقية العنوان: إزالة التواريخ واسم العميل لتفادي التكرار القبيح
  let cleanTitle = rawName;

  if (cleanTitle) {
    // إزالة جزء التواريخ بين الأقواس: (من 09-09-2026 إلى 30-09-2026)
    cleanTitle = cleanTitle.replace(/\s*\([^)]*من[^)]*إلى[^)]*\)\s*$/i, '').trim();
    cleanTitle = cleanTitle.replace(/\s*\(من\s+.*?\s+إلى\s+.*?\)/i, '').trim();
    cleanTitle = cleanTitle.replace(/\s*\([0-9\-\/\sإلىمن]+\)\s*$/i, '').trim();

    // إزالة اسم العميل من بداية العنوان إن وُجد مكرراً: "بيان - "
    if (clientName && cleanTitle.startsWith(clientName)) {
      cleanTitle = cleanTitle.slice(clientName.length).replace(/^[\s\-–—]+/, '').trim();
    }
  }

  // تحديد العنوان النهائي النظيف
  let displayTitle = cleanTitle;
  if (!displayTitle || (planType && displayTitle === planType)) {
    displayTitle = planType ? `خطة ${planType}` : (clientName ? `خطة ${clientName}` : `خطة #${plan.id}`);
  } else if (!displayTitle.startsWith('خطة') && !displayTitle.startsWith('حملة')) {
    displayTitle = `خطة ${displayTitle}`;
  }

  // 3. حساب المدة
  const duration = (startDate && endDate) ? calculateDuration(startDate, endDate) : '';

  return {
    displayTitle,
    startDate,
    endDate,
    duration,
    rawName
  };
};

const goToBoard = (planId) => {
  if (!planId) return;
  router.push(`/plan-board/${planId}`);
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
      perPage.value = resData.per_page || 10;
    } else if (resData?.data && Array.isArray(resData.data.data)) {
      plans.value = resData.data.data;
      currentPage.value = resData.data.current_page || page;
      lastPage.value = resData.data.last_page || 1;
      totalPlans.value = resData.data.total ?? resData.data.data.length;
      perPage.value = resData.data.per_page || 10;
    } else if (Array.isArray(resData)) {
      plans.value = resData;
      currentPage.value = 1;
      lastPage.value = 1;
      totalPlans.value = resData.length;
      perPage.value = resData.length || 10;
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

.boards-page { 
  min-height: 100%; 
  color: #edf0ff; 
  font-family: 'Cairo', sans-serif; 
  padding-bottom: 30px; 
}

.page-topline { 
  margin-bottom: 24px; 
}
.eyebrow { 
  color: #76e8de; 
  font-size: 11px; 
  font-weight: 700; 
  letter-spacing: 0.6px; 
}
.page-topline h2 { 
  margin: 6px 0 3px; 
  font-size: 26px; 
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}
.page-topline p { 
  margin: 0; 
  color: #8896c8; 
  font-size: 12.5px; 
}

/* شبكة الكروت المدمجة */
.boards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 16px; 
  transition: opacity 0.2s ease;
}
.boards-grid.is-fetching {
  opacity: 0.5;
  pointer-events: none;
}

/* تصميم الكارت الاحترافي والتفاعلي بالكامل */
.board-card { 
  position: relative;
  background: linear-gradient(145deg, rgba(17, 24, 66, 0.72) 0%, rgba(10, 15, 45, 0.88) 100%);
  border: 1px solid rgba(137, 153, 226, 0.14); 
  border-radius: 14px; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column; 
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
  cursor: pointer;
  user-select: none;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  outline: none;
}

.board-card:focus-visible {
  border-color: #7de8dc;
  box-shadow: 0 0 0 3px rgba(125, 232, 220, 0.3);
}

.board-card:hover { 
  transform: translateY(-4px); 
  border-color: rgba(125, 232, 220, 0.45); 
  box-shadow: 0 12px 32px -6px rgba(0, 0, 0, 0.5), 0 0 20px -2px rgba(125, 232, 220, 0.18); 
}

/* خط التوهج العلوي */
.card-glow-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #7de8dc 0%, #b28aff 100%);
  opacity: 0.35;
  transition: opacity 0.25s ease, height 0.25s ease, box-shadow 0.25s ease;
  z-index: 2;
}

.board-card:hover .card-glow-bar {
  opacity: 1;
  height: 3px;
  box-shadow: 0 0 12px rgba(125, 232, 220, 0.7);
}

/* رأس الكارت */
.bc-header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  gap: 10px; 
  padding: 12px 14px; 
  background: rgba(8, 13, 38, 0.35); 
  border-bottom: 1px solid rgba(137, 153, 226, 0.08); 
}

.bc-client-block {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.bc-avatar { 
  width: 34px; 
  height: 34px; 
  min-width: 34px;
  border-radius: 9px; 
  background: linear-gradient(135deg, #7de8dc, #b28aff); 
  color: #0d1338; 
  display: grid; 
  place-items: center; 
  font-weight: 800; 
  font-size: 11px; 
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(125, 232, 220, 0.25);
}

.bc-client-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bc-client-label {
  font-size: 9.5px;
  color: #7986b8;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 2px;
}

.bc-client-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #e4e8fc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.bc-header-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.plan-type-pill { 
  font-size: 10px; 
  font-weight: 700;
  color: #7de8dc; 
  background: rgba(125, 232, 220, 0.08); 
  border: 1px solid rgba(125, 232, 220, 0.2);
  padding: 2px 7px; 
  border-radius: 6px; 
  white-space: nowrap;
}

.plan-id-pill {
  font-size: 10px;
  font-weight: 800;
  color: #8b99cf;
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.18);
  padding: 2px 7px;
  border-radius: 6px;
}

/* جسم الكارت: اسم الخطة المنقى والتواريخ */
.bc-body { 
  padding: 12px 14px; 
  flex-grow: 1; 
  display: flex;
  flex-direction: column; 
  justify-content: center;
  gap: 8px;
}

.plan-name-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plan-name-tag {
  font-size: 9.5px;
  font-weight: 700;
  color: #7986b8;
  letter-spacing: 0.3px;
}

.plan-name-title { 
  margin: 0; 
  font-size: 14.5px; 
  font-weight: 800; 
  color: #ffffff; 
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  transition: color 0.2s ease;
}

.board-card:hover .plan-name-title {
  color: #7de8dc;
}

/* شريط التواريخ المنظم */
.plan-date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(125, 232, 220, 0.06);
  border: 1px solid rgba(125, 232, 220, 0.18);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #c9d5f7;
}

.chip-icon {
  font-size: 11px;
}

.chip-dates {
  font-weight: 600;
  letter-spacing: 0.2px;
}

.duration-chip {
  font-size: 10px;
  font-weight: 700;
  color: #b28aff;
  background: rgba(178, 138, 255, 0.1);
  border: 1px solid rgba(178, 138, 255, 0.22);
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

/* أسفل الكارت: زر الدخول المحسن */
.bc-footer { 
  padding: 10px 14px 12px; 
  border-top: 1px solid rgba(137, 153, 226, 0.08); 
  background: rgba(8, 13, 38, 0.2);
}

.open-board-btn { 
  width: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  height: 35px; 
  padding: 0 12px;
  border-radius: 9px; 
  background: rgba(125, 232, 220, 0.07); 
  border: 1px solid rgba(125, 232, 220, 0.22);
  color: #8cefe5; 
  font-family: 'Cairo', sans-serif;
  font-size: 11.5px; 
  font-weight: 700; 
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
  outline: none;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  font-size: 12px;
}

.btn-arrow {
  font-size: 13px;
  font-weight: bold;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* التفاعل عند تحويم الكارت أو الزر */
.board-card:hover .open-board-btn,
.open-board-btn:hover { 
  background: linear-gradient(110deg, #7de8dc 0%, #b28aff 100%); 
  color: #0a1033; 
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.32);
}

.board-card:hover .btn-arrow,
.open-board-btn:hover .btn-arrow {
  transform: translateX(-4px);
}

/* حالة التحميل وعدم وجود بيانات */
.state-cell { 
  padding: 60px 20px; 
  text-align: center; 
  color: #7d89b6; 
  font-size: 13.5px; 
  background: rgba(15, 22, 61, 0.4);
  border: 1px dashed rgba(137, 153, 226, 0.15);
  border-radius: 14px;
}
.spinner { 
  display: inline-block; 
  width: 18px; 
  height: 18px; 
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
  margin-top: 30px;
  padding: 12px 18px;
  background: rgba(15, 22, 61, 0.45);
  border: 1px solid rgba(137, 153, 226, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: rgba(125, 232, 220, 0.1);
  border: 1px solid rgba(125, 232, 220, 0.25);
  border-radius: 9px;
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
  font-size: 12.5px;
  color: #cbd5f7;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 16, 47, 0.6);
  padding: 5px 14px;
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
  .boards-grid {
    grid-template-columns: 1fr;
  }
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