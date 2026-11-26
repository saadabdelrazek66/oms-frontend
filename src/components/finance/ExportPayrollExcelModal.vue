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
import { downloadBlobResponse } from '@/modules/finance/utils/financeHelpers'

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

    downloadBlobResponse(response, defaultName)

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

<style scoped src="@/modules/finance/styles/export-payroll-excel-modal.css"></style>
