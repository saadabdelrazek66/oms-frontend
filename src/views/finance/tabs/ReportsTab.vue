<template>
  <div class="tab-content-pane">
    <div class="reports-control-bar">
      <div class="period-quick-buttons">
        <button :class="{ active: reportPeriodType === 'this_month' }" @click="setReportPeriod('this_month')">هذا الشهر</button>
        <button :class="{ active: reportPeriodType === 'last_month' }" @click="setReportPeriod('last_month')">الشهر الماضي</button>
        <button :class="{ active: reportPeriodType === 'this_year' }" @click="setReportPeriod('this_year')">هذا العام</button>
        <button :class="{ active: reportPeriodType === 'custom' }" @click="reportPeriodType = 'custom'">مخصص</button>
      </div>

      <div v-if="reportPeriodType === 'custom'" class="custom-dates">
        <input v-model="reportStartDate" type="date" class="filter-input" />
        <span>إلى</span>
        <input v-model="reportEndDate" type="date" class="filter-input" />
        <button class="apply-btn" @click="fetchProfitAndLoss">تطبيق</button>
      </div>

      <div class="reports-actions">
        <button
          type="button"
          class="excel-export-action-btn"
          title="تصدير شيت إكسل محاسبي للأرباح والمصروفات وتوزيع الشركاء"
          @click="$emit('open-excel-export', { startDate: reportStartDate, endDate: reportEndDate })"
        >
          <span class="btn-icon">📊</span>
          <span>تصدير شيت الأرباح للشركاء (Excel)</span>
        </button>
      </div>
    </div>

    <!-- بطاقات نتائج الأرباح والخسائر P&L -->
    <div class="pnl-summary-cards">
      <div class="pnl-card green">
        <span class="pnl-icon">📥</span>
        <div>
          <small>إجمالي الإيرادات</small>
          <strong>{{ Number(pnlReport.summary?.total_income || 0).toLocaleString() }} ج.م</strong>
        </div>
      </div>

      <div class="pnl-card red">
        <span class="pnl-icon">📤</span>
        <div>
          <small>إجمالي المصروفات</small>
          <strong>{{ Number(pnlReport.summary?.total_expense || 0).toLocaleString() }} ج.م</strong>
        </div>
      </div>

      <div class="pnl-card cyan">
        <span class="pnl-icon">⚖️</span>
        <div>
          <small>صافي الربح / الخسارة</small>
          <strong :class="Number(pnlReport.summary?.net_profit || 0) >= 0 ? 'text-income' : 'text-expense'">
            {{ Number(pnlReport.summary?.net_profit || 0).toLocaleString() }} ج.م
          </strong>
        </div>
      </div>

      <div class="pnl-card purple">
        <span class="pnl-icon">📈</span>
        <div>
          <small>هامش الربح (Profit Margin)</small>
          <strong>{{ pnlReport.summary?.profit_margin_percentage || 0 }}%</strong>
        </div>
      </div>
    </div>

    <!-- توزيع الأقسام المرئي -->
    <div class="breakdown-columns">
      <!-- توزيع المصروفات -->
      <div class="breakdown-card">
        <h4>📊 تحليل المصروفات حسب الأقسام</h4>
        <div v-if="!pnlReport.expense_breakdown || pnlReport.expense_breakdown.length === 0" class="empty-state">
          لا توجد مصروفات مسجلة في هذه الفترة
        </div>
        <div v-else class="breakdown-list">
          <div v-for="item in pnlReport.expense_breakdown" :key="item.category_id" class="breakdown-item">
            <div class="item-head">
              <span class="item-name">{{ item.icon }} {{ item.category_name }}</span>
              <div class="item-stat">
                <strong class="item-amount">{{ Number(item.total).toLocaleString() }} ج.م</strong>
                <span class="item-percentage text-expense font-mono">({{ getItemPercentage(item, pnlReport.summary?.total_expense) }}%)</span>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div
                class="progress-fill"
                :style="{
                  width: Math.min(100, Math.max(0, Number(getItemPercentage(item, pnlReport.summary?.total_expense)))) + '%',
                  backgroundColor: item.color || '#f43f5e'
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- توزيع الإيرادات -->
      <div class="breakdown-card">
        <h4>📊 تحليل الإيرادات والمقبوضات حسب الأقسام</h4>
        <div v-if="!pnlReport.income_breakdown || pnlReport.income_breakdown.length === 0" class="empty-state">
          لا توجد إيرادات مسجلة في هذه الفترة
        </div>
        <div v-else class="breakdown-list">
          <div v-for="item in pnlReport.income_breakdown" :key="item.category_id" class="breakdown-item">
            <div class="item-head">
              <span class="item-name">{{ item.icon }} {{ item.category_name }}</span>
              <div class="item-stat">
                <strong class="item-amount">{{ Number(item.total).toLocaleString() }} ج.م</strong>
                <span class="item-percentage text-income font-mono">({{ getItemPercentage(item, pnlReport.summary?.total_income) }}%)</span>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div
                class="progress-fill"
                :style="{
                  width: Math.min(100, Math.max(0, Number(getItemPercentage(item, pnlReport.summary?.total_income)))) + '%',
                  backgroundColor: item.color || '#10b981'
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/axios'

defineEmits(['open-excel-export'])

const reportPeriodType = ref('this_month')
const reportStartDate = ref('')
const reportEndDate = ref('')
const pnlReport = ref({ summary: {}, expense_breakdown: [], income_breakdown: [] })
const loading = ref(false)

const formatLocalDate = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const setReportPeriod = (type) => {
  reportPeriodType.value = type
  const now = new Date()
  if (type === 'this_month') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    reportEndDate.value = formatLocalDate(now)
  } else if (type === 'last_month') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    reportEndDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (type === 'this_year') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), 0, 1))
    reportEndDate.value = formatLocalDate(now)
  }
  fetchProfitAndLoss()
}

const fetchProfitAndLoss = async () => {
  loading.value = true
  try {
    const res = await api.get('/finance/reports/profit-and-loss', {
      params: {
        start_date: reportStartDate.value,
        end_date: reportEndDate.value,
      }
    })
    pnlReport.value = res.data?.data || { summary: {}, expense_breakdown: [], income_breakdown: [] }
  } catch (err) {
    console.error('Error fetching P&L report:', err)
  } finally {
    loading.value = false
  }
}

const getItemPercentage = (item, totalGroup) => {
  if (item && item.percentage !== undefined && item.percentage !== null && !isNaN(item.percentage)) {
    const val = Number(item.percentage)
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
  }
  const total = Number(totalGroup || 0)
  const itemTotal = Number(item?.total || 0)
  if (total > 0 && itemTotal > 0) {
    const val = (itemTotal / total) * 100
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
  }
  return '0.0'
}

onMounted(() => {
  setReportPeriod('this_month')
})

defineExpose({
  fetchProfitAndLoss,
  setReportPeriod,
  reportStartDate,
  reportEndDate
})
</script>

<style scoped>
.reports-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 14px;
  flex-wrap: wrap;
}

.period-quick-buttons {
  display: flex;
  gap: 8px;
}

.period-quick-buttons button {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-quick-buttons button.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.custom-dates {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-radius: 8px;
  padding: 7px 12px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
}

.filter-input:focus {
  border-color: #38bdf8;
}

.apply-btn {
  padding: 8px 14px;
  border-radius: 8px;
  background: #38bdf8;
  border: none;
  color: #0c1236;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  background: #0ea5e9;
}

.reports-actions {
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

.pnl-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pnl-card {
  padding: 18px 22px;
  border-radius: 16px;
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.pnl-card.green {
  border-color: rgba(16, 185, 129, 0.25);
}

.pnl-card.red {
  border-color: rgba(244, 63, 94, 0.25);
}

.pnl-card.cyan {
  border-color: rgba(56, 189, 248, 0.25);
}

.pnl-card.purple {
  border-color: rgba(168, 85, 247, 0.25);
}

.pnl-icon {
  font-size: 24px;
}

.pnl-card small {
  font-size: 11px;
  color: #94a3b8;
  display: block;
}

.pnl-card strong {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.text-income {
  color: #10b981;
}

.text-expense {
  color: #f43f5e;
}

.font-mono {
  font-family: monospace;
}

.breakdown-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 800px) {
  .breakdown-columns {
    grid-template-columns: 1fr;
  }
}

.breakdown-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 16px;
  padding: 18px 22px;
}

.breakdown-card h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #ffffff;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.item-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-amount {
  color: #f1f5f9;
  font-weight: 700;
}

.item-percentage {
  font-weight: 800;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.3px;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 0;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 640px) {
  .period-quick-buttons {
    flex-wrap: wrap;
    width: 100%;
  }
  .period-quick-buttons button {
    flex: 1;
    min-width: 70px;
    text-align: center;
  }
}
</style>
