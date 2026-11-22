<template>
  <div class="tab-content-pane">
    <!-- شريط المؤشرات المالية للعملاء -->
    <div class="summary-strip">
      <div class="summary-card-item">
        <span class="summary-icon gold">💎</span>
        <div>
          <small>إجمالي مقبوضات العملاء (LTV)</small>
          <strong>{{ Number(clientsMetrics.overall_lifetime_revenue || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon green">📅</span>
        <div>
          <small>مقبوضات الشهر الحالي من العملاء</small>
          <strong>{{ Number(clientsMetrics.overall_revenue_this_month || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon cyan">👥</span>
        <div>
          <small>العملاء المسددين (نشطين)</small>
          <strong>{{ clientsMetrics.active_paying_clients_count || 0 }} <small>/ {{ clientsMetrics.total_clients_count || clientsSummary.length }} عميل</small></strong>
        </div>
      </div>

      <div class="summary-card-item">
        <span class="summary-icon purple">📊</span>
        <div>
          <small>متوسط دخل العميل المسدد (Avg LTV)</small>
          <strong>{{ Number(clientsMetrics.average_client_ltv || 0).toLocaleString() }} <small>ج.م</small></strong>
        </div>
      </div>
    </div>

    <!-- شريط البحث والتصفية للعملاء -->
    <div class="filter-card">
      <div class="filter-grid">
        <div class="filter-item search-item">
          <span class="search-icon">🔍</span>
          <input
            v-model="clientFilterSearch"
            type="text"
            class="filter-input search-input"
            placeholder="بحث باسم العميل أو الشركة..."
          />
        </div>

        <div class="filter-item">
          <select v-model="clientFilterStatus" class="filter-select">
            <option value="all">كل العملاء المسجلين</option>
            <option value="paid_this_month">سددوا خلال هذا الشهر فقط ✅</option>
            <option value="has_history">عملاء لديهم معاملات سابقة 💼</option>
            <option value="no_history">عملاء بدون معاملات حتى الآن 🆕</option>
          </select>
        </div>

        <button
          v-if="clientFilterSearch || clientFilterStatus !== 'all'"
          type="button"
          class="reset-filter-btn"
          @click="clientFilterSearch = ''; clientFilterStatus = 'all'"
        >
          ↺ تصفير
        </button>
      </div>
    </div>

    <!-- الجدول المعاد هيكلته بالكامل -->
    <div class="finance-table-card">
      <div class="card-heading">
        <div>
          <h3>سجل مقبوضات العملاء وترتيب القيمة الكلية <span>({{ filteredClientsSummary.length }})</span></h3>
          <p>إجمالي ما دخل للشركة من كل عميل وسجل الدفعات المتكامل مع خيارات القبض السريع</p>
        </div>
        <button class="refresh-btn" type="button" @click="fetchClientsSummary">🔄 تحديث</button>
      </div>

      <div class="table-responsive">
        <table class="finance-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">الترتيب</th>
              <th>العميل / الشركة</th>
              <th>إجمالي ما دفعه العميل (LTV)</th>
              <th>مقبوضات هذا الشهر</th>
              <th>تفصيل الإيراد (عقود vs مشاريع)</th>
              <th>عدد المعاملات</th>
              <th>آخر دفعة مسددة</th>
              <th style="text-align: center;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingClients">
              <td colspan="8" class="state-cell"><span class="spinner"></span> جارٍ تحميل بيانات العملاء...</td>
            </tr>
            <tr v-else-if="filteredClientsSummary.length === 0">
              <td colspan="8" class="state-cell">لا توجد بيانات عملاء مطابقة للبحث</td>
            </tr>
            <tr v-for="cl in filteredClientsSummary" v-else :key="cl.client_id">
              <td style="text-align: center;">
                <span class="rank-badge" :class="'rank-' + (cl.rank <= 3 ? cl.rank : 'default')">#{{ cl.rank }}</span>
              </td>
              <td>
                <div class="client-identity-cell">
                  <div class="client-logo-box">
                    <img v-if="cl.logo_url" :src="cl.logo_url" :alt="cl.client_name" class="client-logo-img" />
                    <span v-else class="client-logo-fallback">{{ cl.client_name.charAt(0) }}</span>
                  </div>
                  <div class="client-info-wrap">
                    <strong>{{ cl.client_name }}</strong>
                    <span v-if="cl.has_paid_this_month" class="badge-sub text-income">سدد هذا الشهر ✅</span>
                    <span v-else-if="cl.payments_count > 0" class="badge-sub text-warning">بانتظار سداد الشهر ⏳</span>
                    <span v-else class="badge-sub text-muted">عميل جديد 🆕</span>
                  </div>
                </div>
              </td>
              <td class="amount-cell text-income">
                {{ Number(cl.total_paid_lifetime || cl.lifetime_value || 0).toLocaleString() }} <small>ج.م</small>
                <small v-if="Number(cl.total_paid_this_year || 0) > 0" class="sub-amount-hint">هذا العام: {{ Number(cl.total_paid_this_year).toLocaleString() }} ج.م</small>
              </td>
              <td>
                <strong v-if="Number(cl.total_paid_this_month || 0) > 0" class="text-income">
                  +{{ Number(cl.total_paid_this_month).toLocaleString() }} ج.م
                </strong>
                <span v-else class="text-muted">0.00 ج.م</span>
              </td>
              <td>
                <div class="split-nature-box">
                  <span v-if="Number(cl.retainers_total || 0) > 0" class="nature-pill pill-retainer">
                    عقود: {{ Number(cl.retainers_total).toLocaleString() }}
                  </span>
                  <span v-if="Number(cl.milestones_total || 0) > 0" class="nature-pill pill-milestone">
                    مشاريع: {{ Number(cl.milestones_total).toLocaleString() }}
                  </span>
                  <span v-if="Number(cl.retainers_total || 0) === 0 && Number(cl.milestones_total || 0) === 0" class="text-muted">-</span>
                </div>
              </td>
              <td>
                <span class="count-badge">
                  <strong>{{ cl.payments_count || cl.transactions_count || 0 }}</strong> دفعة
                </span>
              </td>
              <td>
                <div v-if="cl.last_payment_date" class="last-payment-box">
                  <div class="last-payment-head-row">
                    <strong>{{ cl.last_payment_date }}</strong>
                    <button
                      v-if="cl.last_payment_transaction_id"
                      type="button"
                      class="receipt-mini-badge-btn"
                      title="عرض وتنزيل سند قبض آخر دفعة (PDF / طباعة)"
                      @click="$emit('open-receipt', cl.last_payment_transaction_id)"
                    >
                      🧾 السند
                    </button>
                  </div>
                  <small v-if="cl.last_payment_amount">
                    {{ Number(cl.last_payment_amount).toLocaleString() }} ج.م ({{ cl.last_payment_method || 'مسدد' }})
                  </small>
                </div>
                <span v-else class="text-muted">لا يوجد سداد سابق</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    v-if="can('finance.create')"
                    class="quick-pay-btn"
                    type="button"
                    title="تسجيل دفعة جديدة لهذا العميل"
                    @click="$emit('open-income-modal', cl)"
                  >
                    <span>＋</span> قبض دفعة
                  </button>
                  <button
                    class="view-statement-btn"
                    type="button"
                    title="كشف حساب تفصيلي"
                    @click="$emit('open-statement', cl.client_id)"
                  >
                    📑 كشف الحساب
                  </button>
                  <button
                    class="quick-excel-statement-btn"
                    type="button"
                    title="تصدير كشف حساب العميل مباشرة كملف Excel"
                    :disabled="exportingClientStatementId === cl.client_id"
                    @click="exportClientStatementDirect(cl)"
                  >
                    <span v-if="exportingClientStatementId === cl.client_id" class="mini-spinner"></span>
                    <span v-else>📊</span>
                    <span>Excel</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/axios'
import { can } from '@/utils/permissions'
import alertService from '@/services/alertService'

defineEmits(['open-income-modal', 'open-statement', 'open-receipt'])

const clientsSummary = ref([])
const clientsMetrics = ref({})
const loadingClients = ref(false)
const clientFilterSearch = ref('')
const clientFilterStatus = ref('all')
const exportingClientStatementId = ref(null)

const filteredClientsSummary = computed(() => {
  return clientsSummary.value.filter(cl => {
    if (clientFilterSearch.value) {
      const q = clientFilterSearch.value.trim().toLowerCase()
      if (!cl.client_name?.toLowerCase().includes(q)) return false
    }
    if (clientFilterStatus.value === 'paid_this_month') {
      return cl.has_paid_this_month
    } else if (clientFilterStatus.value === 'has_history') {
      return (Number(cl.payments_count || cl.transactions_count || 0)) > 0
    } else if (clientFilterStatus.value === 'no_history') {
      return (Number(cl.payments_count || cl.transactions_count || 0)) === 0
    }
    return true
  })
})

const fetchClientsSummary = async () => {
  loadingClients.value = true
  try {
    const res = await api.get('/finance/clients/summary')
    const data = res.data?.data
    if (data && data.clients) {
      clientsSummary.value = data.clients || []
      clientsMetrics.value = data.metrics || {}
    } else if (Array.isArray(data)) {
      clientsSummary.value = data
      clientsMetrics.value = {}
    }
  } catch (err) {
    console.error('Error fetching clients summary:', err)
  } finally {
    loadingClients.value = false
  }
}

const exportClientStatementDirect = async (cl) => {
  const cId = cl?.client_id || cl?.id
  if (!cId) return
  exportingClientStatementId.value = cId
  try {
    const response = await api.get(`/finance/clients/${cId}/statement/export-excel`, {
      responseType: 'blob',
    })

    const cleanName = (cl.client_name || cl.name || 'العميل').replace(/[\\/:*?"<>|\s]+/g, '_')
    let fileName = `كشف_حساب_${cleanName}_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.xlsx`
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        try {
          fileName = decodeURIComponent(match[1].replace(/['"]/g, ''))
        } catch {
          fileName = match[1].replace(/['"]/g, '')
        }
      }
    }

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    alertService.toast(`✅ تم تصدير كشف حساب (${cl.client_name || cl.name || 'العميل'}) كملف Excel بنجاح!`, 'success')
  } catch (err) {
    console.error('Direct client statement export error:', err)
    alertService.error('فشل تصدير كشف حساب العميل كملف Excel، يرجى المحاولة لاحقاً.')
  } finally {
    exportingClientStatementId.value = null
  }
}

onMounted(() => {
  fetchClientsSummary()
})

defineExpose({
  fetchClientsSummary
})
</script>

<style scoped>
/* شريط المؤشرات */
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

.summary-icon.cyan {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.summary-icon.gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.summary-icon.purple {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
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

/* بطاقة الفلاتر */
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
  min-width: 260px;
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

/* بطاقة وجدول البيانات */
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

/* تفاصيل حسابات العملاء */
.rank-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
  display: inline-block;
}

.rank-1 { background: rgba(245, 158, 11, 0.25); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
.rank-2 { background: rgba(192, 132, 252, 0.25); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4); }
.rank-3 { background: rgba(56, 189, 248, 0.25); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
.rank-default { background: rgba(255, 255, 255, 0.06); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); }

.client-identity-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-logo-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(14, 22, 60, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.2);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.client-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.client-logo-fallback {
  color: #38bdf8;
  font-weight: 800;
  font-size: 14px;
}

.client-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-info-wrap strong {
  color: #f1f5f9;
  font-size: 14px;
}

.badge-sub {
  font-size: 11px;
}

.text-income { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-muted { color: #64748b; }

.amount-cell {
  font-weight: 700;
  font-size: 14px;
}

.sub-amount-hint {
  display: block;
  font-size: 11px;
  color: #64748b;
  font-weight: normal;
  margin-top: 2px;
}

.split-nature-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nature-pill {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  width: fit-content;
}

.pill-retainer {
  background: rgba(0, 242, 254, 0.12);
  color: #00f2fe;
  border: 1px solid rgba(0, 242, 254, 0.25);
}

.pill-milestone {
  background: rgba(192, 132, 252, 0.12);
  color: #c084fc;
  border: 1px solid rgba(192, 132, 252, 0.25);
}

.count-badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.last-payment-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.last-payment-head-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.last-payment-box strong {
  color: #f1f5f9;
  font-size: 12px;
}

.last-payment-box small {
  color: #64748b;
  font-size: 10px;
}

.receipt-mini-badge-btn {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  border-radius: 4px;
  font-size: 10px;
  padding: 1px 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.receipt-mini-badge-btn:hover {
  background: rgba(56, 189, 248, 0.22);
  color: #ffffff;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.quick-pay-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  transition: all 0.2s;
}

.quick-pay-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.view-statement-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.view-statement-btn:hover {
  background: rgba(56, 189, 248, 0.2);
}

.quick-excel-statement-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25));
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-excel-statement-btn:hover:not(:disabled) {
  background: #10b981;
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.quick-excel-statement-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.mini-spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.7s linear infinite;
}
</style>
