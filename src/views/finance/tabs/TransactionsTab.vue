<template>
  <div class="tab-content-pane">
    <!-- شريط المؤشرات المالية السريعة للنتائج المفلترة -->
    <div class="summary-strip">
      <div class="summary-card-item">
        <span class="summary-icon green">📈</span>
        <div>
          <small>إجمالي الإيرادات (المفلترة)</small>
          <strong>{{ Number(transactionsSummary.total_income || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon red">📉</span>
        <div>
          <small>إجمالي المصروفات (المفلترة)</small>
          <strong>{{ Number(transactionsSummary.total_expense || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon cyan">💎</span>
        <div>
          <small>صافي حركة المعاملات</small>
          <strong :class="Number(transactionsSummary.net_profit || 0) >= 0 ? 'text-income' : 'text-expense'">
            {{ Number(transactionsSummary.net_profit || 0).toLocaleString() }} <small>ج.م</small>
          </strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon gold">🏦</span>
        <div>
          <small>{{ transactionsSummary.selected_account_name ? `رصيد (${transactionsSummary.selected_account_name})` : 'إجمالي السيولة المتاحة بالخزائن' }}</small>
          <strong>{{ Number(transactionsSummary.liquidity || totalAvailableLiquidity || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>
    </div>

    <!-- شريط أدوات البحث والتصفية -->
    <div class="filter-card">
      <div class="filter-grid">
        <!-- البحث النصي -->
        <div class="filter-item search-item">
          <span class="search-icon">🔍</span>
          <input
            v-model="filters.search"
            type="text"
            class="filter-input search-input"
            placeholder="بحث برقم المعاملة، البيان، المستفيد، الملاحظات..."
            @input="debounceFetchTransactions"
          />
        </div>

        <!-- نوع المعاملة -->
        <div class="filter-item">
          <select v-model="filters.type" class="filter-select" @change="onFilterChange">
            <option value="">كل المعاملات (إيراد + مصروف)</option>
            <option value="income">إيرادات ومقبوضات فقط</option>
            <option value="expense">مصروفات ومدفوعات فقط</option>
          </select>
        </div>

        <!-- القسم -->
        <div class="filter-item">
          <select v-model="filters.category_id" class="filter-select" @change="onFilterChange">
            <option value="">جميع الأقسام والتصنيفات</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- الخزينة / الحساب -->
        <div class="filter-item">
          <select v-model="filters.account_id" class="filter-select" @change="onFilterChange">
            <option value="">جميع الخزائن والحسابات</option>
            <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
              {{ acc.name }}
            </option>
          </select>
        </div>

        <!-- من تاريخ -->
        <div class="filter-item date-item">
          <input
            v-model="filters.start_date"
            type="date"
            class="filter-input"
            title="من تاريخ"
            @change="onFilterChange"
          />
        </div>

        <!-- إلى تاريخ -->
        <div class="filter-item date-item">
          <input
            v-model="filters.end_date"
            type="date"
            class="filter-input"
            title="إلى تاريخ"
            @change="onFilterChange"
          />
        </div>

        <!-- فترات سريعة لتسهيل الفلترة -->
        <div class="filter-quick-periods">
          <button
            type="button"
            class="quick-period-btn"
            :class="{ active: isCurrentPeriod('this_month') }"
            @click="setTransactionsPeriod('this_month')"
            title="معاملات الشهر الحالي"
          >
            هذا الشهر
          </button>
          <button
            type="button"
            class="quick-period-btn"
            :class="{ active: isCurrentPeriod('last_month') }"
            @click="setTransactionsPeriod('last_month')"
            title="معاملات الشهر السابق"
          >
            الشهر السابق
          </button>
          <button
            type="button"
            class="quick-period-btn"
            :class="{ active: isCurrentPeriod('all') }"
            @click="setTransactionsPeriod('all')"
            title="كافة المعاملات دون التقيد بتاريخ"
          >
            كل الفترات
          </button>
        </div>

        <!-- زر إعادة التعيين -->
        <button type="button" class="reset-filter-btn" title="تصفير الفلاتر إلى الافتراضي" @click="resetFilters">
          ↺ تصفير
        </button>
      </div>
    </div>

    <!-- جدول المعاملات المالية -->
    <div class="finance-table-card">
      <div class="card-heading">
        <div>
          <h3>سجل القيود والمعاملات <span>({{ pagination.total || transactions.length }})</span></h3>
          <p>كافة المعاملات المالية الموثقة والمثبتة في الخزائن</p>
        </div>
        <div class="heading-actions">
          <button
            type="button"
            class="excel-export-action-btn"
            title="تصدير شيت إكسل محاسبي للأرباح والمصروفات موجه للشركاء"
            @click="$emit('open-excel-export', { startDate: filters.start_date, endDate: filters.end_date })"
          >
            <span class="btn-icon">📊</span>
            <span>تصدير شيت الأرباح (Excel)</span>
          </button>
          <button class="refresh-btn" type="button" @click="fetchTransactions(1)" title="تحديث">
            🔄 تحديث
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="finance-table" :aria-busy="loadingTransactions">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">#</th>
              <th>رقم المعاملة</th>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>القسم والتصنيف</th>
              <th>البيان / المستفيد</th>
              <th>طريقة الدفع والخزينة</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>المرفق</th>
              <th style="text-align: center;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingTransactions">
              <td colspan="11" class="state-cell">
                <span class="spinner"></span> جارٍ تحميل المعاملات المالية...
              </td>
            </tr>
            <tr v-else-if="transactions.length === 0">
              <td colspan="11" class="state-cell">لا توجد معاملات مطابقة لمعايير البحث</td>
            </tr>
            <tr
              v-for="(trx, index) in transactions"
              v-else
              :key="trx.id"
              :class="{ 'row-voided': trx.status === 'voided' }"
            >
              <td style="text-align: center;">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
              <td>
                <span class="trx-code">{{ trx.transaction_number }}</span>
                <small v-if="trx.reference_number" class="trx-ref">#{{ trx.reference_number }}</small>
              </td>
              <td class="date-cell">{{ trx.transaction_date }}</td>
              <td>
                <span class="type-pill" :class="trx.type === 'income' ? 'type-income' : 'type-expense'">
                  {{ trx.type === 'income' ? 'إيراد +' : 'مصروف -' }}
                </span>
              </td>
              <td>
                <div class="cat-badge-cell" :style="{ borderColor: trx.category?.color || '#94a3b8' }">
                  <span class="cat-icon">{{ trx.category?.icon || '📁' }}</span>
                  <span>{{ trx.category?.name || 'غير مصنف' }}</span>
                </div>
              </td>
              <td>
                <div class="entity-cell">
                  <strong>{{ trx.entity_display_name || trx.beneficiary_name || 'غير محدد' }}</strong>
                  <small v-if="trx.salary_month" class="badge-sub">راتب: {{ trx.salary_month }}</small>
                  <small v-else-if="trx.revenue_nature_label" class="badge-sub">{{ trx.revenue_nature_label }}</small>
                </div>
              </td>
              <td>
                <div class="account-cell">
                  <strong>{{ trx.payment_method_label || trx.payment_method }}</strong>
                  <small>{{ trx.account?.name || 'غير محدد' }}</small>
                </div>
              </td>
              <td class="amount-cell" :class="trx.type === 'income' ? 'text-income' : 'text-expense'">
                {{ trx.type === 'income' ? '+' : '-' }}{{ Number(trx.amount).toLocaleString() }} <small>{{ trx.currency }}</small>
              </td>
              <td>
                <span class="status-pill" :class="trx.status === 'completed' ? 'pill-completed' : 'pill-voided'">
                  {{ trx.status === 'completed' ? 'مكتملة' : 'ملغاة 🚫' }}
                </span>
              </td>
              <td>
                <button
                  v-if="trx.attachment_url"
                  type="button"
                  class="attachment-preview-btn"
                  title="معاينة إيصال وسكرين شوت التحويل"
                  @click="$emit('open-attachment', trx)"
                >
                  <span class="attachment-btn-icon">📎</span>
                  <span class="attachment-btn-label">عرض المرفق</span>
                </button>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <div class="actions-cell">
                  <!-- عرض وتنزيل سند الراتب الرسمي لمصروفات الرواتب فقط -->
                  <button
                    v-if="trx.type === 'expense' && (trx.salary_month || trx.category?.slug === 'salaries')"
                    class="action-btn payslip-action-btn"
                    type="button"
                    title="عرض وتنزيل سند صرف الراتب الرسمي (PDF / طباعة)"
                    @click="$emit('open-payslip', trx.id)"
                  >
                    🧾
                  </button>

                  <!-- عرض وتنزيل سند قبض إيراد العميل المعتمد (PDF / واتساب) -->
                  <button
                    v-else-if="trx.type === 'income'"
                    class="action-btn receipt-action-btn"
                    type="button"
                    title="عرض وتنزيل سند قبض إيراد العميل المعتمد (PDF / طباعة)"
                    @click="$emit('open-receipt', trx.id)"
                  >
                    🧾
                  </button>

                  <!-- تعديل -->
                  <button
                    v-if="can('finance.edit') && trx.status !== 'voided'"
                    class="action-btn edit-btn"
                    type="button"
                    title="تعديل المعاملة"
                    @click="$emit('open-edit', trx)"
                  >
                    ✎
                  </button>

                  <!-- إبطال / إلغاء -->
                  <button
                    v-if="can('finance.void') && trx.status !== 'voided'"
                    class="action-btn void-btn"
                    type="button"
                    title="إلغاء المعاملة وعكس الرصيد"
                    @click="$emit('open-void', trx)"
                  >
                    🚫
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- أزرار التصفح والصفحات -->
      <div v-if="pagination.total_pages > 1" class="pagination-bar">
        <span>الصفحة {{ pagination.current_page }} من {{ pagination.total_pages }}</span>
        <div class="pagination-buttons">
          <button
            :disabled="pagination.current_page <= 1"
            class="page-btn"
            @click="changePage(pagination.current_page - 1)"
          >
            السابق
          </button>
          <button
            :disabled="pagination.current_page >= pagination.total_pages"
            class="page-btn"
            @click="changePage(pagination.current_page + 1)"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/axios'
import { can } from '@/utils/permissions'

defineProps({
  accounts: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  totalAvailableLiquidity: {
    type: Number,
    default: 0
  }
})

defineEmits([
  'open-excel-export',
  'open-payslip',
  'open-receipt',
  'open-edit',
  'open-void',
  'open-attachment'
])

const formatLocalDate = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getDefaultStartDate = () => {
  const now = new Date()
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

const getDefaultEndDate = () => {
  const now = new Date()
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

const loadingTransactions = ref(false)
const transactions = ref([])

const filters = reactive({
  search: '',
  type: '',
  category_id: '',
  account_id: '',
  start_date: getDefaultStartDate(),
  end_date: getDefaultEndDate(),
})

const pagination = reactive({
  current_page: 1,
  per_page: 25,
  total: 0,
  total_pages: 1,
})

const transactionsSummary = reactive({
  total_income: '0.00',
  total_expense: '0.00',
  net_profit: '0.00',
  liquidity: '0.00',
  selected_account_name: null,
  completed_count: 0,
  total_count: 0,
})

let debounceTimer = null
const debounceFetchTransactions = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.current_page = 1
    fetchTransactions(1)
  }, 350)
}

const onFilterChange = () => {
  pagination.current_page = 1
  fetchTransactions(1)
}

const setTransactionsPeriod = (period) => {
  const now = new Date()
  if (period === 'this_month') {
    filters.start_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    filters.end_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  } else if (period === 'last_month') {
    filters.start_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    filters.end_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (period === 'all') {
    filters.start_date = ''
    filters.end_date = ''
  }
  onFilterChange()
}

const isCurrentPeriod = (period) => {
  const now = new Date()
  const thisMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const thisMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const lastMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))

  if (period === 'this_month') {
    return filters.start_date === thisMonthStart && filters.end_date === thisMonthEnd
  }
  if (period === 'last_month') {
    return filters.start_date === lastMonthStart && filters.end_date === lastMonthEnd
  }
  if (period === 'all') {
    return !filters.start_date && !filters.end_date
  }
  return false
}

const fetchTransactions = async (page = 1) => {
  loadingTransactions.value = true
  const pageNum = (typeof page === 'number' && page >= 1) ? Math.floor(page) : 1
  try {
    const params = {
      page: pageNum,
      per_page: pagination.per_page,
    }

    if (filters.search && filters.search.trim()) params.search = filters.search.trim()
    if (filters.type) params.type = filters.type
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.account_id) params.account_id = filters.account_id
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date

    const res = await api.get('/finance/transactions', { params })
    const data = res.data?.data
    transactions.value = data?.data || []
    pagination.current_page = data?.current_page || 1
    pagination.per_page = data?.per_page || 25
    pagination.total = data?.total || 0
    pagination.total_pages = data?.last_page || 1

    if (data?.summary) {
      transactionsSummary.total_income = data.summary.total_income || '0.00'
      transactionsSummary.total_expense = data.summary.total_expense || '0.00'
      transactionsSummary.net_profit = data.summary.net_profit ?? data.summary.net_flow ?? '0.00'
      transactionsSummary.liquidity = data.summary.liquidity || '0.00'
      transactionsSummary.selected_account_name = data.summary.selected_account_name || null
      transactionsSummary.completed_count = data.summary.completed_count || 0
      transactionsSummary.total_count = data.summary.total_count || 0
    }
  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    loadingTransactions.value = false
  }
}

const changePage = (newPage) => {
  pagination.current_page = newPage
  fetchTransactions(newPage)
}

const resetFilters = () => {
  filters.search = ''
  filters.type = ''
  filters.category_id = ''
  filters.account_id = ''
  filters.start_date = getDefaultStartDate()
  filters.end_date = getDefaultEndDate()
  pagination.current_page = 1
  fetchTransactions(1)
}

onMounted(() => {
  fetchTransactions(1)
})

defineExpose({
  fetchTransactions,
  filters,
  pagination,
  transactionsSummary
})
</script>

<style scoped>
/* شريط المؤشرات المالية */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card-item {
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.16);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.25s ease;
}

.summary-card-item:hover {
  transform: translateY(-2px);
  border-color: rgba(135, 155, 230, 0.35);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
}

.summary-icon.green {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.summary-icon.red {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.summary-icon.cyan {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.summary-icon.gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.summary-card-item small {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.summary-card-item strong {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.summary-card-item strong small {
  display: inline;
  font-size: 12px;
  color: #94a3b8;
}

.text-income {
  color: #10b981;
}

.text-expense {
  color: #f43f5e;
}

.text-muted {
  color: #64748b;
}

/* شريط الفلاتر */
.filter-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.filter-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  position: relative;
}

.search-item {
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #64748b;
  font-size: 14px;
  pointer-events: none;
}

.filter-input,
.filter-select {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-radius: 8px;
  padding: 8px 14px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.search-input {
  width: 100%;
  padding-right: 36px;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.date-item input {
  min-width: 135px;
}

.filter-quick-periods {
  display: flex;
  gap: 6px;
  align-items: center;
}

.quick-period-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-period-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.quick-period-btn.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.reset-filter-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.reset-filter-btn:hover {
  color: #ffffff;
  border-color: #38bdf8;
}

/* بطاقة وجدول المعاملات */
.finance-table-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 16px;
  overflow: hidden;
}

.card-heading {
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(135, 155, 230, 0.1);
  flex-wrap: wrap;
  gap: 12px;
}

.card-heading h3 {
  margin: 0;
  font-size: 17px;
  color: #ffffff;
}

.card-heading h3 span {
  color: #38bdf8;
  font-size: 14px;
}

.card-heading p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.excel-export-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.22));
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.excel-export-action-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  border-color: #10b981;
}

.excel-export-action-btn .btn-icon {
  font-size: 14px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 13px;
}

.finance-table th {
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-weight: 700;
  border-bottom: 1px solid rgba(135, 155, 230, 0.12);
  white-space: nowrap;
}

.finance-table td {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.08);
  color: #e2e8f0;
}

.finance-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.row-voided td {
  opacity: 0.5;
  text-decoration: line-through;
}

.row-voided td:last-child {
  text-decoration: none;
}

.state-cell {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-radius: 50%;
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.trx-code {
  font-family: monospace;
  font-weight: 700;
  color: #38bdf8;
  display: block;
}

.trx-ref {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
  display: block;
}

.date-cell {
  white-space: nowrap;
  font-size: 12px;
}

.type-pill {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.type-income {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.type-expense {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.cat-badge-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(135, 155, 230, 0.15);
  font-size: 12px;
}

.cat-icon {
  font-size: 13px;
}

.entity-cell strong {
  display: block;
  font-size: 13px;
  color: #f1f5f9;
}

.badge-sub {
  display: inline-block;
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 3px;
}

.account-cell strong {
  display: block;
  font-size: 12px;
  color: #cbd5e1;
}

.account-cell small {
  font-size: 11px;
  color: #64748b;
}

.amount-cell {
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
}

.status-pill {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.pill-completed {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.pill-voided {
  background: rgba(244, 63, 94, 0.12);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.25);
}

.attachment-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.attachment-preview-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  color: #ffffff;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 13px;
  transition: all 0.2s;
}

.payslip-action-btn:hover,
.receipt-action-btn:hover {
  background: rgba(16, 185, 129, 0.2);
}

.edit-btn {
  color: #38bdf8;
}

.edit-btn:hover {
  background: rgba(56, 189, 248, 0.2);
}

.void-btn {
  color: #f43f5e;
}

.void-btn:hover {
  background: rgba(244, 63, 94, 0.2);
}

.pagination-bar {
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(135, 155, 230, 0.1);
  font-size: 12px;
  color: #94a3b8;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}

.page-btn {
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .summary-strip {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .filter-grid {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-item, .filter-input, .filter-select {
    width: 100%;
  }
}
</style>
