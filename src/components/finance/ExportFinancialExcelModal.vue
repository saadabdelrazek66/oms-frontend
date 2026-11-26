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
import { downloadBlobResponse, formatLocalDate } from '@/modules/finance/utils/financeHelpers'

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
    startDate.value = formatLocalDate(new Date(y, m, 1))
    endDate.value = formatLocalDate(new Date(y, m + 1, 0))
  } else if (type === 'last_month') {
    startDate.value = formatLocalDate(new Date(y, m - 1, 1))
    endDate.value = formatLocalDate(new Date(y, m, 0))
  } else if (type === 'this_quarter') {
    const q = Math.floor(m / 3)
    startDate.value = formatLocalDate(new Date(y, q * 3, 1))
    endDate.value = formatLocalDate(new Date(y, (q + 1) * 3, 0))
  } else if (type === 'this_year') {
    startDate.value = formatLocalDate(new Date(y, 0, 1))
    endDate.value = formatLocalDate(new Date(y, 11, 31))
  }
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

    const fallbackName = `تقرير_الأداء_المالي_والأرباح_${startDate.value.replace(/-/g, '')}_${endDate.value.replace(/-/g, '')}.xlsx`
    downloadBlobResponse(response, fallbackName)

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

<style scoped src="@/modules/finance/styles/export-financial-excel-modal.css"></style>
