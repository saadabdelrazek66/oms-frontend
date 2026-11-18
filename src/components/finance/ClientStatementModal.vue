<template>
  <Teleport to="body">
    <div v-if="show" class="finance-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="finance-modal-card large-modal">
      <div class="modal-header">
        <div class="header-title">
          <span class="icon">📑</span>
          <h3>كشف الحساب المالي للعميل</h3>
          <span v-if="clientData" class="client-pill">{{ clientData.name }}</span>
        </div>
        <button class="close-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <span class="spinner"></span>
          <span>جارٍ استدعاء السجل المالي وكشف الحساب...</span>
        </div>

        <template v-else-if="statement">
          <!-- بطاقات المؤشرات المالية للعميل -->
          <div class="statement-metrics-grid">
            <div class="metric-card gold">
              <span class="metric-icon">💎</span>
              <div class="metric-info">
                <small>إجمالي ما دفعه العميل (LTV)</small>
                <strong>{{ Number(metrics.total_paid_lifetime || 0).toLocaleString() }} <small>ج.م</small></strong>
              </div>
            </div>

            <div class="metric-card teal">
              <span class="metric-icon">🔄</span>
              <div class="metric-info">
                <small>عقود شهرية مستمرة (Retainers)</small>
                <strong>{{ Number(metrics.total_retainers || 0).toLocaleString() }} <small>ج.م</small></strong>
              </div>
            </div>

            <div class="metric-card purple">
              <span class="metric-icon">🎯</span>
              <div class="metric-info">
                <small>دفعات مشاريع (Milestones)</small>
                <strong>{{ Number(metrics.total_project_milestones || 0).toLocaleString() }} <small>ج.م</small></strong>
              </div>
            </div>

            <div class="metric-card green">
              <span class="metric-icon">📅</span>
              <div class="metric-info">
                <small>المدفوع خلال هذا الشهر</small>
                <strong>{{ Number(metrics.total_paid_current_month || 0).toLocaleString() }} <small>ج.م</small></strong>
              </div>
            </div>
          </div>

          <!-- تفاصيل دفعات المشاريع إن وُجدت -->
          <div v-if="projectsBreakdown && projectsBreakdown.length > 0" class="projects-section">
            <h4 class="section-title">💼 توزيع المقبوضات حسب المشاريع</h4>
            <div class="projects-grid">
              <div v-for="proj in projectsBreakdown" :key="proj.project_id" class="project-stat-box">
                <div class="proj-head">
                  <strong>{{ proj.project_name }}</strong>
                  <span class="proj-status">{{ proj.project_status }}</span>
                </div>
                <div class="proj-body">
                  <span>المسدد: <strong>{{ Number(proj.total_paid).toLocaleString() }} ج.م</strong></span>
                  <small>{{ proj.payments_count }} دفعات</small>
                </div>
              </div>
            </div>
          </div>

          <!-- جدول سجل المعاملات التاريخية للعميل -->
          <div class="statement-table-wrapper">
            <div class="table-head-bar">
              <h4>📋 سجل المعاملات والدفعات ({{ transactions.length }})</h4>
              <span v-if="metrics.last_payment_date" class="last-payment-tag">
                آخر دفعة: {{ metrics.last_payment_date }}
              </span>
            </div>

            <div class="table-responsive">
              <table class="statement-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>رقم المعاملة</th>
                    <th>التاريخ</th>
                    <th>طبيعة الإيراد</th>
                    <th>طريقة الدفع والخزينة</th>
                    <th>المبلغ</th>
                    <th>المرجع / ملاحظات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="transactions.length === 0">
                    <td colspan="8" class="empty-cell">لا توجد معاملات مالية مسجلة لهذا العميل حتى الآن</td>
                  </tr>
                  <tr v-for="(trx, idx) in transactions" :key="trx.id">
                    <td>{{ idx + 1 }}</td>
                    <td class="mono-code">{{ trx.transaction_number }}</td>
                    <td>{{ trx.transaction_date }}</td>
                    <td>
                      <span class="nature-badge" :class="trx.revenue_nature">
                        {{ trx.revenue_nature_label || trx.revenue_nature || 'إيراد' }}
                      </span>
                    </td>
                    <td>
                      <div class="pay-cell">
                        <strong>{{ trx.payment_method_label || trx.payment_method }}</strong>
                        <small>{{ trx.account?.name }}</small>
                      </div>
                    </td>
                    <td class="amount-cell text-income">
                      +{{ Number(trx.amount).toLocaleString() }} {{ trx.currency }}
                    </td>
                    <td>
                      <div class="notes-cell">
                        <span v-if="trx.reference_number" class="ref-tag">#{{ trx.reference_number }}</span>
                        <span>{{ trx.notes || '-' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-pill" :class="trx.status === 'completed' ? 'pill-completed' : 'pill-voided'">
                        {{ trx.status === 'completed' ? 'مكتملة' : 'ملغاة' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button type="button" class="print-btn" @click="printStatement">طباعة كشف الحساب 🖨️</button>
        <button type="button" class="cancel-btn" @click="$emit('close')">إغلاق</button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import api from '@/axios'

const props = defineProps({
  show: { type: Boolean, default: false },
  clientId: { type: [Number, String], default: null },
})

defineEmits(['close'])

const loading = ref(true)
const statement = ref(null)

const clientData = computed(() => statement.value?.client || null)
const metrics = computed(() => statement.value?.metrics || {})
const projectsBreakdown = computed(() => statement.value?.projects_breakdown || [])
const transactions = computed(() => statement.value?.transactions || [])

const fetchStatement = async () => {
  if (!props.clientId) return
  loading.value = true
  try {
    const res = await api.get(`/finance/clients/${props.clientId}/statement`)
    statement.value = res.data?.data || null
  } catch (err) {
    console.error('Error fetching client statement:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (val) => {
  if (val && props.clientId) {
    fetchStatement()
  } else {
    statement.value = null
  }
})

watch(() => props.clientId, () => {
  if (props.show && props.clientId) fetchStatement()
})

const printStatement = () => {
  window.print()
}
</script>

<style scoped>
.finance-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999 !important;
  background: rgba(3, 7, 24, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  direction: rtl;
}

.finance-modal-card {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(160deg, #111a47 0%, #0c1236 100%);
  border: 1px solid rgba(135, 155, 230, 0.22);
  border-radius: 18px;
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
  background: rgba(14, 22, 60, 0.5);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 18px;
  font-weight: 800;
}

.client-pill {
  padding: 4px 12px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #94a3b8;
}

.statement-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 16px;
  border-radius: 14px;
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric-icon {
  font-size: 24px;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-info small {
  font-size: 11px;
  color: #94a3b8;
}

.metric-info strong {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
}

.metric-card.gold strong { color: #f59e0b; }
.metric-card.teal strong { color: #00f2fe; }
.metric-card.purple strong { color: #c084fc; }
.metric-card.green strong { color: #10b981; }

.projects-section {
  background: rgba(6, 11, 35, 0.35);
  border-radius: 12px;
  border: 1px solid rgba(135, 155, 230, 0.12);
  padding: 14px 18px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  color: #cbd5e1;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.project-stat-box {
  background: rgba(14, 22, 60, 0.4);
  border: 1px solid rgba(135, 155, 230, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
}

.proj-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.proj-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.proj-body {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #38bdf8;
}

.statement-table-wrapper {
  background: rgba(8, 14, 40, 0.45);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 14px;
  overflow: hidden;
}

.table-head-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.12);
}

.table-head-bar h4 {
  margin: 0;
  font-size: 14px;
  color: #f1f5f9;
}

.last-payment-tag {
  font-size: 12px;
  color: #64748b;
}

.table-responsive {
  overflow-x: auto;
}

.statement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: right;
}

.statement-table th {
  background: rgba(14, 22, 60, 0.7);
  padding: 12px 14px;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
}

.statement-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.08);
  color: #cbd5e1;
}

.empty-cell {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
}

.mono-code {
  font-family: monospace;
  color: #38bdf8;
  font-weight: 700;
}

.nature-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
}

.pay-cell {
  display: flex;
  flex-direction: column;
}

.pay-cell small {
  color: #64748b;
  font-size: 11px;
}

.amount-cell {
  font-weight: 800;
}

.text-income {
  color: #10b981;
}

.ref-tag {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: 4px;
}

.status-pill {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.pill-completed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.pill-voided {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid rgba(135, 155, 230, 0.15);
  background: rgba(14, 22, 60, 0.4);
}

.print-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  cursor: pointer;
  font-size: 13px;
}

.cancel-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 13px;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-radius: 50%;
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
