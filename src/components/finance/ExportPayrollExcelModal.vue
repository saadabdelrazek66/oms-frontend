<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
      >
        <div class="payroll-export-card">
          <!-- شريط الرأس -->
          <div class="modal-header">
            <div class="header-icon-box">
              <span class="header-icon">📑</span>
            </div>
            <div class="header-text">
              <h3>تصدير كشف مسير الرواتب والمستحقات (Excel)</h3>
              <p>شيت إكسل رسمي ومعتمد متضمناً تفاصيل رواتب الموظفين ومستحقات المهام والعمولات</p>
            </div>
            <button type="button" class="close-btn" aria-label="إغلاق" @click="emit('close')">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <!-- شريط بيانات الشهر المالي -->
            <div class="month-banner">
              <div class="banner-right">
                <span class="banner-icon">🗓️</span>
                <div>
                  <div class="banner-title">شهر الاستحقاق المالي: <strong>{{ month }}</strong></div>
                  <div class="banner-sub">
                    إجمالي موظفي المنظومة: <strong>{{ totalEmployeesCount }}</strong> • 
                    تم الصرف لـ: <strong class="text-green">{{ paidEmployeesCount }}</strong> • 
                    بانتظار الصرف: <strong class="text-amber">{{ unpaidEmployeesCount }}</strong>
                  </div>
                </div>
              </div>
              <div class="banner-total">
                <span class="total-lbl">الرواتب المنصرفة</span>
                <strong class="total-val">{{ Number(totalPaidAmount).toLocaleString() }} <small>ج.م</small></strong>
              </div>
            </div>

            <!-- الاختيار الرئيسي: المسددين فقط أم الكل -->
            <div class="form-section">
              <label class="section-title">
                <span>🎯</span>
                <span>نطاق الموظفين المشمولين في الكشف</span>
              </label>

              <div class="scope-cards-grid">
                <!-- خيار 1: المسددين فقط -->
                <div
                  class="scope-option-card"
                  :class="{ selected: selectedScope === 'paid_only' }"
                  @click="selectedScope = 'paid_only'"
                >
                  <div class="card-radio-indicator">
                    <span class="radio-dot" v-if="selectedScope === 'paid_only'"></span>
                  </div>
                  <div class="card-content">
                    <div class="card-top-row">
                      <span class="scope-icon green-icon">🟢</span>
                      <h4 class="scope-title">الموظفين الذين تم الصرف لهم فقط (المسددين)</h4>
                      <span class="scope-badge green-badge">موصى به للمالية</span>
                    </div>
                    <div class="scope-meta">
                      <span class="meta-tag">
                        <strong>{{ paidEmployeesCount }}</strong> موظف مشمول
                      </span>
                      <span class="meta-tag">
                        إجمالي: <strong>{{ Number(totalPaidAmount).toLocaleString() }} ج.م</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- خيار 2: الكل (الشامل) -->
                <div
                  class="scope-option-card"
                  :class="{ selected: selectedScope === 'all' }"
                  @click="selectedScope = 'all'"
                >
                  <div class="card-radio-indicator">
                    <span class="radio-dot" v-if="selectedScope === 'all'"></span>
                  </div>
                  <div class="card-content">
                    <div class="card-top-row">
                      <span class="scope-icon blue-icon">🌐</span>
                      <h4 class="scope-title">كافة الموظفين والمستحقين (التقرير الشامل)</h4>
                      <span class="scope-badge blue-badge">كشف عام</span>
                    </div>
                    <div class="scope-meta">
                      <span class="meta-tag">
                        <strong>{{ totalEmployeesCount }}</strong> موظف إجمالي
                      </span>
                      <span class="meta-tag">
                        مسدد: {{ paidEmployeesCount }} • بانتظار الصرف: {{ unpaidEmployeesCount }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- خيارات الأوراق الإضافية الملحقة -->
            <div class="form-section">
              <label class="section-title">
                <span>📑</span>
                <span>أوراق العمل المرفقة بالمصنف (Excel Sheets)</span>
              </label>

              <div class="extra-sheets-grid">
                <label class="sheet-checkbox-card" :class="{ checked: includeFreelancers }">
                  <input type="checkbox" v-model="includeFreelancers" />
                  <div class="chk-text">
                    <strong>ورقة مستحقات الفريلانسرز بالتاسك</strong>
                  </div>
                </label>

                <label class="sheet-checkbox-card" :class="{ checked: includeCommissions }">
                  <input type="checkbox" v-model="includeCommissions" />
                  <div class="chk-text">
                    <strong>ورقة عمولات المبيعات والأرباح</strong>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- شريط التذييل والإجراءات -->
          <div class="modal-footer">
            <button
              type="button"
              class="cancel-btn"
              :disabled="exporting"
              @click="emit('close')"
            >
              إلغاء
            </button>
            <button
              type="button"
              class="export-submit-btn"
              :disabled="exporting"
              @click="handleExport"
            >
              <span v-if="exporting" class="spinner"></span>
              <span v-else class="btn-icon">📊</span>
              <span>{{ exporting ? 'جارٍ توليد وتصدير الملف...' : 'تصدير كشف مسير الرواتب (Excel)' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  month: { type: String, default: () => new Date().toISOString().slice(0, 7) },
  summary: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close'])

const selectedScope = ref('paid_only') // 'paid_only' (المسددين فقط) أو 'all' (الكل)
const includeFreelancers = ref(true)
const includeCommissions = ref(true)
const exporting = ref(false)

const totalEmployeesCount = computed(() => {
  return props.summary?.total_employees_count || 0
})

const paidEmployeesCount = computed(() => {
  return props.summary?.paid_count || 0
})

const unpaidEmployeesCount = computed(() => {
  return props.summary?.unpaid_count || 0
})

const totalPaidAmount = computed(() => {
  return props.summary?.total_paid_amount ?? props.summary?.total_paid ?? 0
})

const handleExport = async () => {
  exporting.value = true
  try {
    const targetMonth = props.month || new Date().toISOString().slice(0, 7)
    const params = new URLSearchParams({
      month: targetMonth,
      scope: selectedScope.value,
      include_freelancers: includeFreelancers.value ? '1' : '0',
      include_commissions: includeCommissions.value ? '1' : '0',
    })

    const response = await api.get(`/finance/salaries/export-excel?${params.toString()}`, {
      responseType: 'blob',
    })

    const isPaidOnly = selectedScope.value === 'paid_only'
    const defaultName = isPaidOnly
      ? `كشف_رواتب_المسددين_فقط_${targetMonth.replace(/-/g, '_')}.xlsx`
      : `كشف_مسير_الرواتب_الشامل_${targetMonth.replace(/-/g, '_')}.xlsx`

    let fileName = defaultName
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

    const scopeTitle = isPaidOnly ? 'الموظفين المسددين فقط' : 'كافة الموظفين'
    alertService.toast(`✅ تم تصدير مسير رواتب شهر ${targetMonth} (${scopeTitle}) بنجاح!`, 'success')
    emit('close')
  } catch (err) {
    console.error('Payroll Excel Export Error:', err)
    alertService.error('فشل تصدير كشف مسير الرواتب، يرجى المحاولة مرة أخرى.')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  direction: rtl;
}

.payroll-export-card {
  width: 100%;
  max-width: 660px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(18px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* شريط الرأس */
.modal-header {
  padding: 18px 24px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}

.header-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35));
  border: 1px solid rgba(16, 185, 129, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon {
  font-size: 22px;
}

.header-text {
  flex: 1;
}

.header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}

.header-text p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

/* الجسم الداخلي */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* بنر الشهر */
.month-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-icon {
  font-size: 24px;
}

.banner-title {
  font-size: 13.5px;
  color: #e2e8f0;
}

.banner-title strong {
  color: #38bdf8;
}

.banner-sub {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.text-green {
  color: #34d399;
}

.text-amber {
  color: #fbbf24;
}

.banner-total {
  text-align: left;
  display: flex;
  flex-direction: column;
}

.total-lbl {
  font-size: 10.5px;
  color: #94a3b8;
  text-transform: uppercase;
}

.total-val {
  font-size: 16px;
  color: #10b981;
  font-weight: 800;
}

.total-val small {
  font-size: 11px;
  color: #a7f3d0;
  font-weight: 600;
}

/* الأقسام */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
}

/* كروت خيارات النطاق */
.scope-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scope-option-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.scope-option-card:hover {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.scope-option-card.selected {
  background: rgba(16, 185, 129, 0.08);
  border-color: #10b981;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3), 0 4px 14px rgba(16, 185, 129, 0.15);
}

.card-radio-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.scope-option-card.selected .card-radio-indicator {
  border-color: #10b981;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
}

.card-content {
  flex: 1;
}

.card-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scope-icon {
  font-size: 14px;
}

.scope-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #f1f5f9;
}

.scope-badge {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 6px;
  font-weight: 700;
}

.green-badge {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.blue-badge {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.scope-desc {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #94a3b8;
}

.scope-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.meta-tag {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  padding: 2px 8px;
  border-radius: 6px;
  color: #cbd5e1;
}

.meta-tag strong {
  color: #f8fafc;
}

/* الأوراق الإضافية */
.extra-sheets-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 600px) {
  .extra-sheets-grid {
    grid-template-columns: 1fr;
  }
}

.sheet-checkbox-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sheet-checkbox-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(255, 255, 255, 0.15);
}

.sheet-checkbox-card.checked {
  background: rgba(56, 189, 248, 0.06);
  border-color: rgba(56, 189, 248, 0.3);
}

.sheet-checkbox-card input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 3px;
  accent-color: #38bdf8;
  cursor: pointer;
}

.chk-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chk-text strong {
  font-size: 12px;
  color: #e2e8f0;
}

.chk-text span {
  font-size: 10.5px;
  color: #94a3b8;
}

/* مميزات */
.features-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.feat-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
  margin-left: 12px;
}

/* التذييل */
.modal-footer {
  padding: 14px 24px;
  background: #1e293b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.export-submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 9px 22px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: all 0.2s;
}

.export-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.export-submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
