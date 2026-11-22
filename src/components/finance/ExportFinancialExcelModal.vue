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
        <div class="export-modal-card">
          <!-- شريط الرأس -->
          <div class="modal-header">
            <div class="header-icon-box">
              <span class="header-icon">📊</span>
            </div>
            <div class="header-text">
              <h3>تصدير تقرير الأرباح والمصروفات (Excel)</h3>
              <p>شيت إكسل رسمي وشيك موجه للشركاء متضمناً الملخص وسجل القيود وتوزيع الأرباح</p>
            </div>
            <button type="button" class="close-btn" aria-label="إغلاق" @click="emit('close')">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <!-- 1. اختيار الفترة الزمنية -->
            <div class="form-section">
              <label class="section-title">
                <span>📅</span>
                <span>الفترة المحاسبية للتقرير</span>
              </label>

              <div class="period-pills">
                <button
                  type="button"
                  class="period-pill"
                  :class="{ active: periodType === 'this_month' }"
                  @click="selectPeriod('this_month')"
                >
                  هذا الشهر
                </button>
                <button
                  type="button"
                  class="period-pill"
                  :class="{ active: periodType === 'last_month' }"
                  @click="selectPeriod('last_month')"
                >
                  الشهر الماضي
                </button>
                <button
                  type="button"
                  class="period-pill"
                  :class="{ active: periodType === 'this_quarter' }"
                  @click="selectPeriod('this_quarter')"
                >
                  الربع الحالي
                </button>
                <button
                  type="button"
                  class="period-pill"
                  :class="{ active: periodType === 'this_year' }"
                  @click="selectPeriod('this_year')"
                >
                  العام الحالي
                </button>
                <button
                  type="button"
                  class="period-pill"
                  :class="{ active: periodType === 'custom' }"
                  @click="periodType = 'custom'"
                >
                  فترة مخصصة
                </button>
              </div>

              <div class="date-range-row">
                <div class="form-group">
                  <label>من تاريخ:</label>
                  <input
                    v-model="startDate"
                    type="date"
                    class="form-input"
                    :disabled="periodType !== 'custom'"
                  />
                </div>
                <div class="form-group">
                  <label>إلى تاريخ:</label>
                  <input
                    v-model="endDate"
                    type="date"
                    class="form-input"
                    :disabled="periodType !== 'custom'"
                  />
                </div>
              </div>
            </div>

            <!-- 2. جدول تخصيص الشركاء والأرباح -->
            <div class="form-section">
              <div class="section-header-row">
                <label class="section-title">
                  <span>🤝</span>
                  <span>جدول احتساب وتوزيع الأرباح على الشركاء</span>
                </label>
                <button
                  type="button"
                  class="add-partner-btn"
                  @click="addPartner"
                >
                  + إضافة شريك
                </button>
              </div>

              <p class="section-hint">
                يتم ربط نسب الشركاء بصافي الأرباح بمعادلات إكسل تفاعلية تتيح إعادة الاحتساب في الملف مباشرة.
              </p>

              <div class="partners-table-wrapper">
                <table class="partners-table">
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">م</th>
                      <th>اسم الشريك / المساهم</th>
                      <th style="width: 130px;">نسبة الحصة (%)</th>
                      <th>ملاحظات الاعتماد</th>
                      <th style="width: 45px; text-align: center;">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(partner, index) in partners" :key="index">
                      <td style="text-align: center; color: #94a3b8; font-weight: 700;">
                        {{ index + 1 }}
                      </td>
                      <td>
                        <input
                          v-model="partner.name"
                          type="text"
                          class="table-input"
                          placeholder="مثال: الشريك الأول"
                        />
                      </td>
                      <td>
                        <div class="percent-input-wrap">
                          <input
                            v-model.number="partner.percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            class="table-input percent"
                          />
                          <span class="unit">%</span>
                        </div>
                      </td>
                      <td>
                        <input
                          v-model="partner.notes"
                          type="text"
                          class="table-input"
                          placeholder="حصة الأرباح المعتمدة"
                        />
                      </td>
                      <td style="text-align: center;">
                        <button
                          type="button"
                          class="delete-partner-btn"
                          title="حذف هذا الشريك"
                          :disabled="partners.length <= 1"
                          @click="removePartner(index)"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- شريط حالة مجموع النسب -->
              <div class="total-percentage-bar" :class="totalPercentageClass">
                <div class="bar-info">
                  <span>إجمالي نسب الشركاء:</span>
                  <strong>{{ totalPercentage }}%</strong>
                </div>
                <span v-if="totalPercentage === 100" class="status-msg success">
                  ✅ النسب متوازنة ومطابقة لـ 100%
                </span>
                <span v-else class="status-msg warning">
                  ⚠️ مجموع النسب الحالي لا يساوي 100% (يمكن للشركاء تعديلها لاحقاً في الإكسل)
                </span>
              </div>
            </div>
          </div>

          <!-- شريط الإجراءات السفلي -->
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
              class="export-btn"
              :disabled="exporting || !startDate || !endDate"
              @click="handleExport"
            >
              <span v-if="exporting" class="spinner"></span>
              <span v-else class="icon">📥</span>
              <span>{{ exporting ? 'جارٍ بناء وتصدير الشيت...' : 'تصدير شيت الإكسل (XLSX)' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  initialStartDate: { type: String, default: null },
  initialEndDate: { type: String, default: null },
})

const emit = defineEmits(['close'])

const periodType = ref('this_month')
const startDate = ref('')
const endDate = ref('')
const exporting = ref(false)

const partners = ref([
  { name: 'الشريك الأول', percentage: 50.0, notes: 'حصة الأرباح المعتمدة' },
  { name: 'الشريك الثاني', percentage: 50.0, notes: 'حصة الأرباح المعتمدة' },
])

const totalPercentage = computed(() => {
  const sum = partners.value.reduce((acc, p) => acc + (Number(p.percentage) || 0), 0)
  return Math.round(sum * 100) / 100
})

const totalPercentageClass = computed(() => {
  return totalPercentage.value === 100 ? 'balanced' : 'unbalanced'
})

// إعداد التواريخ بناءً على الفترة
const selectPeriod = (type) => {
  periodType.value = type
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (type === 'this_month') {
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
  } else if (type === 'last_month') {
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
  } else if (type === 'this_quarter') {
    const q = Math.floor(m / 3)
    const start = new Date(y, q * 3, 1)
    const end = new Date(y, (q + 1) * 3, 0)
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
  } else if (type === 'this_year') {
    const start = new Date(y, 0, 1)
    const end = new Date(y, 11, 31)
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
  }
}

const formatDate = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addPartner = () => {
  const count = partners.value.length + 1
  partners.value.push({
    name: `شريك ${count}`,
    percentage: 0,
    notes: 'حصة أرباح',
  })
}

const removePartner = (index) => {
  if (partners.value.length > 1) {
    partners.value.splice(index, 1)
  }
}

// تنفيذ التصدير والتنزيل
const handleExport = async () => {
  if (!startDate.value || !endDate.value) {
    alertService.error('يرجى تحديد بداية ونهاية الفترة المالية.')
    return
  }

  exporting.value = true
  try {
    const payload = {
      start_date: startDate.value,
      end_date: endDate.value,
      partners: partners.value.map(p => ({
        name: p.name?.trim() || 'شريك',
        percentage: Number(p.percentage) || 0,
        notes: p.notes?.trim() || '',
      })),
    }

    const response = await api.post('/finance/reports/export-excel', payload, {
      responseType: 'blob',
    })

    // استخراج اسم الملف
    let fileName = `تقرير_الأداء_المالي_والأرباح_${startDate.value.replace(/-/g, '')}_${endDate.value.replace(/-/g, '')}.xlsx`
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

    // تنزيل الملف في المتصفح
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

    alertService.toast('✅ تم تصدير ملف الإكسل المالي بنجاح!', 'success')
    emit('close')
  } catch (err) {
    console.error('Excel Export Error:', err)
    alertService.error('فشل تصدير ملف الإكسل، يرجى مراجعة الصلاحيات والاتصال بالخادم.')
  } finally {
    exporting.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.initialStartDate && props.initialEndDate) {
        startDate.value = props.initialStartDate
        endDate.value = props.initialEndDate
        periodType.value = 'custom'
      } else {
        selectPeriod('this_month')
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999999;
  background: rgba(3, 7, 24, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  direction: rtl;
}

.export-modal-card {
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 18px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.12);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.96) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* شريط الرأس */
.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 22px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.header-icon-box {
  width: 44px;
  height: 44px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.header-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* جسم المودال */
.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  background: #131d31;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 12px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.section-header-row .section-title {
  margin-bottom: 0;
}

.section-hint {
  font-size: 11.5px;
  color: #94a3b8;
  margin: 4px 0 12px;
}

.add-partner-btn {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.add-partner-btn:hover {
  background: #38bdf8;
  color: #0f172a;
}

/* أزرار الفترات */
.period-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.period-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.period-pill:hover {
  border-color: #38bdf8;
  color: #ffffff;
}

.period-pill.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
}

.date-range-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  display: block;
  font-size: 11.5px;
  color: #94a3b8;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  color: #ffffff;
  font-size: 12.5px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* جدول الشركاء */
.partners-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 10px;
}

.partners-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.partners-table th {
  background: #1e293b;
  color: #cbd5e1;
  padding: 8px 10px;
  font-weight: 700;
  text-align: right;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.partners-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background: #0f172a;
}

.table-input {
  width: 100%;
  background: #182235;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  padding: 5px 8px;
  font-size: 12px;
}

.table-input:focus {
  outline: none;
  border-color: #38bdf8;
}

.percent-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.table-input.percent {
  text-align: center;
  font-weight: 700;
  color: #38bdf8;
}

.unit {
  color: #94a3b8;
  font-weight: 700;
}

.delete-partner-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.2s;
}

.delete-partner-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.delete-partner-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* شريط إجمالي النسب */
.total-percentage-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 7px;
  font-size: 12px;
}

.total-percentage-bar.balanced {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
}

.total-percentage-bar.unbalanced {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-info strong {
  font-size: 13px;
}

/* كبسولات الميزات */
.features-badge-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.feat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  color: #cbd5e1;
}

.feat-icon {
  font-size: 14px;
}

/* شريط التذييل */
.modal-footer {
  padding: 14px 22px;
  background: #1e293b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
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

.export-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 8px 20px;
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

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.export-btn:disabled {
  opacity: 0.5;
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
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
