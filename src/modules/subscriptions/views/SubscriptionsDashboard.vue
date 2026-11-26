<template>
  <div class="subscriptions-dashboard" dir="rtl">
    <!-- الترويسة الرئيسية -->
    <header class="dash-header-card">
      <div class="header-main">
        <div class="header-icon">💳</div>
        <div>
          <h1 class="header-title">إدارة اشتراكات الشركة والتنبيهات الاستباقية</h1>
          <p class="header-subtitle">
            مراقبة مواعيد تجديد الدومينات والاستضافة والشهادات والخدمات السحابية مع تنبيهات متعددة المراحل عبر البريد والمتصفح والنظام.
          </p>
        </div>
      </div>

      <div class="header-actions">
        <span v-if="isBrowserGranted" class="browser-status-pill granted" title="إشعارات سطح المكتب مفعلة">
          🔔 المتصفح مفعل
        </span>
        <button
          type="button"
          class="btn-secondary-action"
          :disabled="isLoading"
          @click="fetchSubscriptions"
        >
          <span :class="{ 'spin-icon': isLoading }">🔄</span>
          <span>تحديث</span>
        </button>
        <button
          v-if="can('subscriptions.create')"
          type="button"
          class="btn-primary-action"
          @click="openCreateModal"
        >
          <span>➕</span>
          <span>إضافة اشتراك جديد</span>
        </button>
      </div>
    </header>

    <!-- شريط تفعيل إشعارات المتصفح -->
    <BrowserPermissionBanner />

    <!-- شريط مؤشرات الأداء والتكاليف (KPIs) -->
    <section class="kpi-grid" aria-label="مؤشرات الاشتراكات">
      <button
        type="button"
        class="kpi-card"
        :class="{ active: !filters.urgency && !filters.status }"
        @click="applyUrgencyShortcut('')"
      >
        <div class="kpi-top">
          <span class="kpi-label">الاشتراكات المراقبة</span>
          <span class="kpi-icon">📊</span>
        </div>
        <strong class="kpi-value">{{ summary.active_monitored_count }}</strong>
        <small class="kpi-foot">إجمالي السجلات: {{ summary.total_count }}</small>
      </button>

      <button
        type="button"
        class="kpi-card kpi-critical"
        :class="{ active: filters.urgency === 'critical' }"
        @click="applyUrgencyShortcut('critical')"
      >
        <div class="kpi-top">
          <span class="kpi-label">حرجة (خلال 7 أيام)</span>
          <span class="kpi-icon">⚠️</span>
        </div>
        <strong class="kpi-value">{{ summary.expiring_7_days_count }}</strong>
        <small class="kpi-foot">تتطلب إجراء تجديد فوري</small>
      </button>

      <button
        type="button"
        class="kpi-card kpi-warning"
        :class="{ active: filters.urgency === 'warning' }"
        @click="applyUrgencyShortcut('warning')"
      >
        <div class="kpi-top">
          <span class="kpi-label">تنبيه قريب (30 يوماً)</span>
          <span class="kpi-icon">⏰</span>
        </div>
        <strong class="kpi-value">{{ summary.expiring_30_days_count }}</strong>
        <small class="kpi-foot">اشتراكات تستحق التجهيز قريباً</small>
      </button>

      <button
        type="button"
        class="kpi-card kpi-overdue"
        :class="{ active: filters.urgency === 'overdue' }"
        @click="applyUrgencyShortcut('overdue')"
      >
        <div class="kpi-top">
          <span class="kpi-label">منتهية / متأخرة</span>
          <span class="kpi-icon">🚨</span>
        </div>
        <strong class="kpi-value">{{ summary.expired_count }}</strong>
        <small class="kpi-foot">داخل فترة السماح أو منتهية</small>
      </button>

      <div class="kpi-card kpi-costs">
        <div class="kpi-top">
          <span class="kpi-label">المصروف التقديري المتكرر</span>
          <span class="kpi-icon">💰</span>
        </div>
        <div v-if="summary.costs_by_currency?.length" class="costs-list">
          <div v-for="c in summary.costs_by_currency" :key="c.currency" class="cost-line">
            <span class="cost-currency">{{ c.currency }}</span>
            <span class="cost-val">{{ formatMoney(c.monthly_equivalent, c.currency) }}<small>/شهر</small></span>
          </div>
        </div>
        <strong v-else class="kpi-value">—</strong>
        <small class="kpi-foot">محسوب حسب دورة كل اشتراك دون خلط العملات</small>
      </div>
    </section>

    <!-- شريط البحث والفلترة المتقدم -->
    <section class="filters-bar-card">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="filters.search"
          type="text"
          class="filter-input"
          placeholder="ابحث باسم الاشتراك، المزود، النطاق (Domain)، أو البريد..."
          @input="onSearchInput"
        />
        <button
          v-if="filters.search"
          type="button"
          class="clear-btn"
          @click="clearSearch"
        >
          ✕
        </button>
      </div>

      <select v-model="filters.category" class="filter-select" @change="onFilterChange">
        <option value="">كل التصنيفات</option>
        <option v-for="cat in meta.categories" :key="cat.value" :value="cat.value">
          {{ cat.icon }} {{ cat.label }}
        </option>
      </select>

      <select v-model="filters.status" class="filter-select" @change="onFilterChange">
        <option value="">كل الحالات</option>
        <option v-for="st in meta.statuses" :key="st.value" :value="st.value">
          {{ st.label }}
        </option>
      </select>

      <select v-model="filters.urgency" class="filter-select" @change="onFilterChange">
        <option value="">كل مستويات الاستعجال</option>
        <option v-for="urg in meta.urgency_levels" :key="urg.value" :value="urg.value">
          {{ urg.label }}
        </option>
      </select>

      <select v-model="sortOption" class="filter-select" @change="onSortChange">
        <option value="next_expiry_date:asc">الأقرب انتهاءً أولاً</option>
        <option value="next_expiry_date:desc">الأبعد انتهاءً أولاً</option>
        <option value="amount:desc">الأعلى تكلفة</option>
        <option value="created_at:desc">الأحدث إضافة</option>
        <option value="name:asc">الاسم (أ - ي)</option>
      </select>

      <button v-if="hasActiveFilters" type="button" class="btn-reset-filters" @click="handleResetFilters">
        إعادة ضبط
      </button>
    </section>

    <!-- شاشة التحميل -->
    <div v-if="isLoading && items.length === 0" class="loading-state-box">
      <div class="spinner-lg"></div>
      <p>جارٍ تحميل اشتراكات الشركة...</p>
    </div>

    <!-- حالة الفراغ -->
    <div v-else-if="items.length === 0" class="empty-state-box">
      <div class="empty-emoji">💳</div>
      <h3>{{ hasActiveFilters ? 'لا توجد اشتراكات تطابق الفلاتر الحالية' : 'لم تتم إضافة أي اشتراكات بعد' }}</h3>
      <p>
        {{
          hasActiveFilters
            ? 'جرّب تعديل كلمات البحث أو إعادة ضبط الفلاتر.'
            : 'ابدأ بتسجيل الدومينات والاستضافة والاشتراكات المهمة لتفعيل التنبيهات المبكرة عبر البريد والمتصفح والنظام.'
        }}
      </p>
      <div class="empty-actions">
        <button v-if="hasActiveFilters" type="button" class="btn-secondary-action" @click="handleResetFilters">
          إعادة ضبط الفلاتر
        </button>
        <button v-if="can('subscriptions.create')" type="button" class="btn-primary-action" @click="openCreateModal">
          ➕ إضافة أول اشتراك
        </button>
      </div>
    </div>

    <!-- العرض المتجاوب: جدول للديسكتوب + كروت للموبايل -->
    <template v-else>
      <!-- 1. جدول سطح المكتب -->
      <div class="desktop-table-card">
        <table class="subscriptions-table">
          <thead>
            <tr>
              <th>الاشتراك والمزود</th>
              <th>التصنيف</th>
              <th>التكلفة والدورة</th>
              <th>موعد الانتهاء والعد التنازلي</th>
              <th>قنوات وجدول التذكير</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sub in items"
              :key="sub.id"
              :class="`row-urgency-${sub.urgency}`"
            >
              <td>
                <div class="cell-primary">
                  <button type="button" class="sub-name-link" @click="openDetails(sub.id)">
                    {{ sub.name }}
                  </button>
                  <div class="sub-meta-line">
                    <span>{{ sub.provider_name }}</span>
                    <span v-if="sub.domain_or_identifier" class="domain-chip">{{ sub.domain_or_identifier }}</span>
                    <a
                      v-if="sub.management_url"
                      :href="sub.management_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="ext-link"
                      title="فتح لوحة تحكم المزود"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </td>

              <td>
                <span class="cat-pill">{{ sub.category_icon }} {{ sub.category_label }}</span>
              </td>

              <td>
                <div class="cost-cell">
                  <strong>{{ formatMoney(sub.amount, sub.currency) }}</strong>
                  <small>{{ sub.billing_cycle_label }}</small>
                </div>
              </td>

              <td>
                <div class="countdown-cell">
                  <div class="countdown-top">
                    <span class="remaining-badge" :class="`urgency-${sub.urgency}`">
                      {{ formatRemainingLabel(sub.days_remaining) }}
                    </span>
                    <span class="date-label">{{ sub.next_expiry_date }}</span>
                  </div>
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :class="`urgency-${sub.urgency}`"
                      :style="{ width: computeCycleProgress(sub) + '%' }"
                    ></div>
                  </div>
                  <small v-if="sub.auto_renew" class="auto-renew-note">🔁 تجديد تلقائي لدى المزود</small>
                </div>
              </td>

              <td>
                <div class="channels-cell">
                  <div class="ch-icons-row">
                    <span v-for="ch in sub.channels" :key="ch" class="ch-mini-badge" :title="ch">
                      {{ channelIcon(ch) }}
                    </span>
                  </div>
                  <small>{{ sub.reminder_days_before?.length || 0 }} مراحل تذكير</small>
                </div>
              </td>

              <td>
                <span class="status-pill" :class="`st-${sub.status}`">
                  {{ sub.status_label }}
                </span>
              </td>

              <td>
                <div class="row-actions">
                  <button
                    v-if="can('subscriptions.renew')"
                    type="button"
                    class="icon-action-btn renew"
                    title="تجديد الاشتراك"
                    @click="openRenewModal(sub)"
                  >
                    🔄
                  </button>
                  <button
                    v-if="can('subscriptions.test_alert')"
                    type="button"
                    class="icon-action-btn test"
                    title="إرسال تنبيه تجريبي"
                    :disabled="isTestingAlert"
                    @click="handleTestAlert(sub)"
                  >
                    🧪
                  </button>
                  <button
                    type="button"
                    class="icon-action-btn view"
                    title="التفاصيل وسجل التنبيهات"
                    @click="openDetails(sub.id)"
                  >
                    👁️
                  </button>
                  <button
                    v-if="can('subscriptions.edit')"
                    type="button"
                    class="icon-action-btn edit"
                    title="تعديل"
                    @click="openEditModal(sub)"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="can('subscriptions.delete')"
                    type="button"
                    class="icon-action-btn delete"
                    title="حذف"
                    @click="handleDelete(sub)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. كروت الموبايل والتابلت -->
      <div class="mobile-cards-grid">
        <article
          v-for="sub in items"
          :key="`mob-${sub.id}`"
          class="sub-mobile-card"
          :class="`card-urgency-${sub.urgency}`"
        >
          <div class="mob-top">
            <span class="cat-pill">{{ sub.category_icon }} {{ sub.category_label }}</span>
            <span class="remaining-badge" :class="`urgency-${sub.urgency}`">
              {{ formatRemainingLabel(sub.days_remaining) }}
            </span>
          </div>

          <h3 class="mob-title" @click="openDetails(sub.id)">{{ sub.name }}</h3>
          <p class="mob-provider">
            {{ sub.provider_name }}
            <span v-if="sub.domain_or_identifier"> • {{ sub.domain_or_identifier }}</span>
          </p>

          <div class="progress-track">
            <div
              class="progress-fill"
              :class="`urgency-${sub.urgency}`"
              :style="{ width: computeCycleProgress(sub) + '%' }"
            ></div>
          </div>

          <div class="mob-meta-grid">
            <div>
              <small>التكلفة</small>
              <strong>{{ formatMoney(sub.amount, sub.currency) }}</strong>
            </div>
            <div>
              <small>تاريخ الانتهاء</small>
              <strong>{{ sub.next_expiry_date }}</strong>
            </div>
            <div>
              <small>القنوات</small>
              <strong>{{ sub.channels.map(channelIcon).join(' ') }}</strong>
            </div>
          </div>

          <div class="mob-actions">
            <button v-if="can('subscriptions.renew')" type="button" class="mob-btn renew" @click="openRenewModal(sub)">
              🔄 تجديد
            </button>
            <button v-if="can('subscriptions.test_alert')" type="button" class="mob-btn test" @click="handleTestAlert(sub)">
              🧪 اختبار
            </button>
            <button type="button" class="mob-btn view" @click="openDetails(sub.id)">
              التفاصيل
            </button>
            <button v-if="can('subscriptions.edit')" type="button" class="mob-btn edit" @click="openEditModal(sub)">
              ✏️
            </button>
            <button v-if="can('subscriptions.delete')" type="button" class="mob-btn delete" @click="handleDelete(sub)">
              🗑️
            </button>
          </div>
        </article>
      </div>

      <!-- الترقيم (Pagination) -->
      <nav v-if="pagination.last_page > 1" class="pagination-bar" aria-label="تصفح الصفحات">
        <button
          type="button"
          class="page-btn"
          :disabled="pagination.current_page <= 1"
          @click="goToPage(pagination.current_page - 1)"
        >
          السابق
        </button>
        <span class="page-info">
          صفحة {{ pagination.current_page }} من {{ pagination.last_page }} (إجمالي {{ pagination.total }})
        </span>
        <button
          type="button"
          class="page-btn"
          :disabled="pagination.current_page >= pagination.last_page"
          @click="goToPage(pagination.current_page + 1)"
        >
          التالي
        </button>
      </nav>
    </template>

    <!-- نافذة الإنشاء / التعديل -->
    <SubscriptionFormModal
      :show="showFormModal"
      :subscription="editingSubscription"
      :meta="meta"
      :submitting="isSubmitting"
      :on-save="handleSaveSubscription"
      @close="showFormModal = false"
    />

    <!-- نافذة التجديد السريع -->
    <SubscriptionRenewModal
      :show="showRenewModal"
      :subscription="renewingSubscription"
      :meta="meta"
      :renewing="isRenewing"
      :on-renew="renewSubscription"
      @close="showRenewModal = false"
    />

    <!-- لوحة التفاصيل وسجل التنبيهات والتجديدات -->
    <SubscriptionDetailsDrawer
      :show="showDetailsDrawer"
      :subscription="activeSubscription"
      :logs="logs"
      :meta="meta"
      :loading="isLoadingDetails"
      :testing-alert="isTestingAlert"
      :can-edit="can('subscriptions.edit')"
      :can-renew="can('subscriptions.renew')"
      :can-test-alert="can('subscriptions.test_alert')"
      @close="showDetailsDrawer = false"
      @edit="openEditFromDrawer"
      @renew="openRenewFromDrawer"
      @test-alert="handleTestAlert"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { confirm } from '@/services/alertService';
import { usePermissions } from '@/composables/usePermissions';
import { useSubscriptions } from '../composables/useSubscriptions.js';
import { useBrowserNotifications } from '../composables/useBrowserNotifications.js';
import { formatMoney, formatRemainingLabel } from '../constants/subscriptionOptions.js';
import BrowserPermissionBanner from '../components/BrowserPermissionBanner.vue';
import SubscriptionFormModal from '../components/SubscriptionFormModal.vue';
import SubscriptionRenewModal from '../components/SubscriptionRenewModal.vue';
import SubscriptionDetailsDrawer from '../components/SubscriptionDetailsDrawer.vue';

const route = useRoute();
const router = useRouter();
const { can } = usePermissions();
const { isGranted: isBrowserGranted } = useBrowserNotifications();

const {
  items,
  pagination,
  summary,
  meta,
  activeSubscription,
  logs,
  filters,
  isLoading,
  isLoadingDetails,
  isSubmitting,
  isRenewing,
  isTestingAlert,
  fetchMeta,
  fetchSubscriptions,
  fetchDetails,
  createSubscription,
  updateSubscription,
  renewSubscription,
  testSubscriptionAlert,
  deleteSubscription,
  resetFilters,
} = useSubscriptions();

const showFormModal = ref(false);
const editingSubscription = ref(null);
const showRenewModal = ref(false);
const renewingSubscription = ref(null);
const showDetailsDrawer = ref(false);
const sortOption = ref('next_expiry_date:asc');

let searchDebounceTimer = null;

const hasActiveFilters = computed(() =>
  Boolean(filters.search || filters.category || filters.status || filters.urgency)
);

const channelIcon = (ch) => {
  switch (ch) {
    case 'email': return '📧';
    case 'browser': return '🔔';
    case 'system': return '💬';
    default: return '📣';
  }
};

const computeCycleProgress = (sub) => {
  if (!sub.start_date || !sub.next_expiry_date) return 50;
  const start = new Date(sub.start_date).getTime();
  const end = new Date(sub.next_expiry_date).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  const ratio = ((now - start) / (end - start)) * 100;
  return Math.max(4, Math.min(100, Math.round(ratio)));
};

const onSearchInput = () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    filters.page = 1;
    fetchSubscriptions();
  }, 350);
};

const clearSearch = () => {
  filters.search = '';
  filters.page = 1;
  fetchSubscriptions();
};

const onFilterChange = () => {
  filters.page = 1;
  fetchSubscriptions();
};

const onSortChange = () => {
  const [by, dir] = sortOption.value.split(':');
  filters.sort_by = by;
  filters.sort_dir = dir;
  filters.page = 1;
  fetchSubscriptions();
};

const applyUrgencyShortcut = (urgency) => {
  filters.urgency = filters.urgency === urgency ? '' : urgency;
  filters.page = 1;
  fetchSubscriptions();
};

const handleResetFilters = () => {
  resetFilters();
  sortOption.value = 'next_expiry_date:asc';
  fetchSubscriptions();
};

const goToPage = (page) => {
  filters.page = page;
  fetchSubscriptions();
};

const openCreateModal = () => {
  editingSubscription.value = null;
  showFormModal.value = true;
};

const openEditModal = (sub) => {
  editingSubscription.value = { ...sub };
  showFormModal.value = true;
};

const handleSaveSubscription = async (payload) => {
  if (editingSubscription.value?.id) {
    return updateSubscription(editingSubscription.value.id, payload);
  }
  return createSubscription(payload);
};

const openRenewModal = (sub) => {
  renewingSubscription.value = { ...sub };
  showRenewModal.value = true;
};

const openDetails = async (id) => {
  showDetailsDrawer.value = true;
  await fetchDetails(id);
};

const openEditFromDrawer = (sub) => {
  showDetailsDrawer.value = false;
  openEditModal(sub);
};

const openRenewFromDrawer = (sub) => {
  showDetailsDrawer.value = false;
  openRenewModal(sub);
};

const handleTestAlert = async (sub) => {
  await testSubscriptionAlert(sub.id);
};

const handleDelete = async (sub) => {
  const confirmed = await confirm({
    title: 'حذف الاشتراك',
    message: `هل أنت متأكد من رغبتك في حذف اشتراك "${sub.name}"؟ لن يتم إرسال أي تذكيرات تخصه بعد الحذف.`,
    type: 'danger',
    confirmText: 'نعم، احذف الاشتراك',
    cancelText: 'إلغاء',
  });

  if (confirmed) {
    await deleteSubscription(sub.id);
  }
};

const checkHighlightQuery = async () => {
  const highlightId = Number(route.query?.highlight);
  if (highlightId > 0) {
    await openDetails(highlightId);
    router.replace({ query: { ...route.query, highlight: undefined } });
  }
};

watch(
  () => route.query?.highlight,
  (val) => {
    if (Number(val) > 0) {
      checkHighlightQuery();
    }
  }
);

onMounted(async () => {
  await Promise.all([fetchMeta(), fetchSubscriptions()]);
  await checkHighlightQuery();
});
</script>

<style scoped>
.subscriptions-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  padding-bottom: 4rem;
  color: #f1f5f9;
}

/* Header */
.dash-header-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.9rem;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.65rem;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #f8fafc;
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 44rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.browser-status-pill.granted {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  padding: 0.42rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.btn-primary-action {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 0.58rem 1.15rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32);
}

.btn-secondary-action {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  padding: 0.55rem 0.95rem;
  border-radius: 0.7rem;
  font-size: 0.84rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.9rem;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.kpi-card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.95rem;
  padding: 0.95rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: right;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.22);
}

.kpi-card.active {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.kpi-card.kpi-costs {
  cursor: default;
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-label {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 900;
  color: #f8fafc;
}

.kpi-critical .kpi-value { color: #fb923c; }
.kpi-warning .kpi-value { color: #fbbf24; }
.kpi-overdue .kpi-value { color: #f87171; }

.kpi-foot {
  color: #64748b;
  font-size: 0.72rem;
}

.costs-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cost-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
}

.cost-currency {
  color: #38bdf8;
  font-weight: 700;
}

.cost-val {
  color: #34d399;
  font-weight: 800;
}

.cost-val small {
  color: #94a3b8;
  font-weight: 400;
  margin-right: 0.15rem;
}

/* Filters */
.filters-bar-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.95rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  padding: 0.52rem 2.2rem 0.52rem 2rem;
  color: #f8fafc;
  font-size: 0.84rem;
}

.clear-btn {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.filter-select {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  padding: 0.52rem 0.75rem;
  color: #e2e8f0;
  font-size: 0.82rem;
}

.btn-reset-filters {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.5rem 0.85rem;
  border-radius: 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

/* Loading & Empty */
.loading-state-box,
.empty-state-box {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 3.5rem 1.5rem;
  text-align: center;
  color: #94a3b8;
}

.spinner-lg {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto 0.85rem auto;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-emoji {
  font-size: 2.75rem;
  margin-bottom: 0.5rem;
}

.empty-state-box h3 {
  margin: 0 0 0.35rem 0;
  color: #f8fafc;
}

.empty-actions {
  margin-top: 1.1rem;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

/* Desktop Table */
.desktop-table-card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow-x: auto;
}

.subscriptions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
}

.subscriptions-table th {
  padding: 0.9rem 1rem;
  text-align: right;
  font-size: 0.78rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.subscriptions-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.subscriptions-table tr:hover td {
  background: rgba(255, 255, 255, 0.025);
}

.sub-name-link {
  background: none;
  border: none;
  padding: 0;
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  text-align: right;
}

.sub-name-link:hover {
  color: #34d399;
}

.sub-meta-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.25rem;
  font-size: 0.76rem;
  color: #94a3b8;
}

.domain-chip {
  background: rgba(56, 189, 248, 0.12);
  color: #7dd3fc;
  padding: 0.1rem 0.45rem;
  border-radius: 0.35rem;
  direction: ltr;
}

.ext-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 700;
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.76rem;
  color: #e2e8f0;
  white-space: nowrap;
}

.cost-cell strong {
  display: block;
  color: #34d399;
  font-size: 0.88rem;
}

.cost-cell small {
  color: #94a3b8;
  font-size: 0.74rem;
}

.countdown-cell {
  min-width: 190px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.countdown-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.remaining-badge {
  font-size: 0.73rem;
  font-weight: 800;
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
}

.remaining-badge.urgency-normal { background: rgba(16, 185, 129, 0.16); color: #34d399; }
.remaining-badge.urgency-warning { background: rgba(245, 158, 11, 0.18); color: #fbbf24; }
.remaining-badge.urgency-critical { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
.remaining-badge.urgency-overdue { background: rgba(239, 68, 68, 0.22); color: #f87171; }

.date-label {
  font-size: 0.76rem;
  color: #cbd5e1;
  direction: ltr;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-fill.urgency-normal { background: #10b981; }
.progress-fill.urgency-warning { background: #f59e0b; }
.progress-fill.urgency-critical { background: #f97316; }
.progress-fill.urgency-overdue { background: #ef4444; }

.auto-renew-note {
  font-size: 0.7rem;
  color: #7dd3fc;
}

.channels-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ch-icons-row {
  display: flex;
  gap: 0.25rem;
}

.ch-mini-badge {
  background: rgba(255, 255, 255, 0.07);
  padding: 0.15rem 0.35rem;
  border-radius: 0.35rem;
  font-size: 0.8rem;
}

.channels-cell small {
  color: #94a3b8;
  font-size: 0.72rem;
}

.status-pill {
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.status-pill.st-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.status-pill.st-expiring_soon { background: rgba(245, 158, 11, 0.16); color: #fbbf24; }
.status-pill.st-expired { background: rgba(239, 68, 68, 0.18); color: #f87171; }
.status-pill.st-paused { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
.status-pill.st-cancelled { background: rgba(100, 116, 139, 0.2); color: #94a3b8; }

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.icon-action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.09);
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.icon-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.14);
}

.icon-action-btn.renew:hover { border-color: #10b981; }
.icon-action-btn.test:hover { border-color: #38bdf8; }
.icon-action-btn.delete:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.18); }

/* Mobile Cards */
.mobile-cards-grid {
  display: none;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

@media (max-width: 992px) {
  .desktop-table-card {
    display: none;
  }
  .mobile-cards-grid {
    display: grid;
  }
}

.sub-mobile-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.sub-mobile-card.card-urgency-overdue { border-color: rgba(239, 68, 68, 0.4); }
.sub-mobile-card.card-urgency-critical { border-color: rgba(249, 115, 22, 0.4); }

.mob-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.mob-title {
  margin: 0;
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
}

.mob-provider {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
}

.mob-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.55);
  padding: 0.65rem;
  border-radius: 0.65rem;
}

.mob-meta-grid small {
  display: block;
  color: #94a3b8;
  font-size: 0.7rem;
}

.mob-meta-grid strong {
  color: #f1f5f9;
  font-size: 0.8rem;
}

.mob-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.mob-btn {
  flex: 1;
  min-width: 60px;
  padding: 0.45rem 0.6rem;
  border-radius: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.mob-btn.renew {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

/* Pagination */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 0.5rem;
}

.page-btn {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  padding: 0.45rem 0.95rem;
  border-radius: 0.6rem;
  font-weight: 700;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.82rem;
  color: #94a3b8;
}
</style>
