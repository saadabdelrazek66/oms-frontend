<template>
  <Teleport to="body">
    <div v-if="modelValue" class="users-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="closeModal">
        <div
          ref="modalContent"
          class="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabindex="-1"
          @keydown.esc="closeModal"
        >
          <button
            ref="modalCloseButton"
            class="modal-close"
            type="button"
            aria-label="إغلاق النافذة"
            @click="closeModal"
          >
            <span aria-hidden="true">×</span>
          </button>
          <div class="modal-icon" aria-hidden="true">♙</div>
          <span class="eyebrow">بيانات الفريق</span>
          <h3 id="modal-title">{{ isEditing ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد' }}</h3>
          <p>{{ isEditing ? 'حدّث البيانات التي تريد تعديلها.' : 'أضف عضوًا جديدًا إلى مساحتك الرقمية.' }}</p>

          <form class="user-form" @submit.prevent="saveUser">
            <div class="form-group full">
              <label for="user-name">الاسم بالكامل <span class="text-red">*</span></label>
              <input id="user-name" v-model="form.name" type="text" placeholder="مثال: أحمد محمد" required />
            </div>

            <div :class="form.role === 'employee' ? 'form-group' : 'form-group full'">
              <label for="user-role">الصلاحية / الدور <span class="text-red">*</span></label>
              <select id="user-role" v-model="form.role" required @change="handleRoleChange">
                <option value="employee">موظف</option>
                <option value="manager">مدير</option>
              </select>
              <small v-if="form.role === 'manager'" class="role-hint">
                ⚡ حساب المدير يتمتع بصلاحيات إدارية شاملة ولا يتطلب مسمى وظيفي.
              </small>
            </div>

            <div v-if="form.role === 'employee'" class="form-group">
              <label for="user-job-title">المسمى الوظيفي <span class="text-red">*</span></label>
              <select id="user-job-title" v-model="form.job_title" :required="form.role === 'employee'">
                <option value="" disabled>اختر المسمى الوظيفي...</option>
                <option v-for="title in jobTitles" :key="title" :value="title">{{ title }}</option>
                <option v-if="form.job_title && !jobTitles.includes(form.job_title)" :value="form.job_title">
                  {{ form.job_title }}
                </option>
              </select>
            </div>

            <div class="form-group full">
              <label for="user-email">البريد الإلكتروني <span class="text-red">*</span></label>
              <input id="user-email" v-model="form.email" type="email" placeholder="name@company.com" required />
            </div>

            <div class="form-group full">
              <label for="primary-dept">القسم الأساسي <small>(اختياري)</small></label>
              <select id="primary-dept" v-model="form.primary_department_id" @change="handlePrimaryDeptChange">
                <option value="">بدون قسم أساسي</option>
                <option v-for="dept in departmentsList" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
              </select>
            </div>

            <div class="form-group full">
              <label>الأقسام الفرعية / الإضافية <small>(يمكنك تحديد أكثر من قسم)</small></label>
              <div class="checkbox-grid">
                <label
                  v-for="dept in departmentsList"
                  :key="dept.id"
                  class="custom-cb"
                  :class="{ disabled: dept.id === form.primary_department_id }"
                >
                  <input
                    v-model="form.additional_department_ids"
                    type="checkbox"
                    :value="dept.id"
                    :disabled="dept.id === form.primary_department_id"
                  />
                  <span class="cb-text">{{ dept.name }}</span>
                </label>
              </div>
              <p v-if="departmentsList.length === 0" class="muted-cell no-departments">
                لا توجد أقسام مسجلة حالياً.
              </p>
            </div>

            <div class="form-group full">
              <label for="user-password">
                كلمة المرور <span v-if="!isEditing" class="text-red">*</span>
              </label>
              <div class="password-input-wrap">
                <input
                  id="user-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  :required="!isEditing"
                  :placeholder="isEditing ? 'اتركه فارغًا للاحتفاظ بالحالية' : 'أدخل كلمة مرور قوية'"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  :aria-label="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                  :title="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                  @click="showPassword = !showPassword"
                >
                  <svg
                    v-if="!showPassword"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.7M6.1 6.8C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.3 4-.8"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group full">
              <label for="user-phone">رقم الهاتف <span class="text-red">*</span></label>
              <input id="user-phone" v-model="form.phone" type="text" placeholder="01xxxxxxxx" required />
            </div>

            <div class="form-group full">
              <label for="user-work-type">نظام العمل <span class="text-red">*</span></label>
              <select id="user-work-type" v-model="form.work_type" required>
                <option value="remote">عن بعد</option>
                <option value="onsite">من الشركة</option>
                <option value="per_task">بالتاسك</option>
                <option value="commission">بالعمولة</option>
              </select>
            </div>

            <!-- الراتب والمستحقات المالية الديناميكية بحسب نظام العمل -->
            <div class="form-group-card full salary-card-wrap">
              <template v-if="form.work_type === 'onsite' || form.work_type === 'remote'">
                <div class="card-mini-header">
                  <span class="header-icon">💰</span>
                  <div>
                    <strong>الراتب الأساسي / الشهري</strong>
                    <p>نظام الراتب الثابت للموظفين بدوام شهري (من الشركة أو عن بعد).</p>
                  </div>
                </div>

                <div class="form-group full">
                  <div class="form-label-row">
                    <label for="user-salary">
                      قيمة الراتب الشهري <small class="text-hint">(اختياري - من 1,000 إلى 1,000,000 ج.م)</small>
                    </label>
                  </div>
                  <div class="salary-input-container">
                    <span class="salary-currency-tag">ج.م</span>
                    <input
                      id="user-salary"
                      v-model="form.salary"
                      type="text"
                      inputmode="decimal"
                      placeholder="1000.00"
                      class="salary-input-field"
                      :class="{ 'field-error': salaryError }"
                      @input="onSalaryInput"
                      @blur="formatSalaryOnBlur"
                    />
                  </div>
                  <div v-if="salaryError" class="salary-error-msg" role="alert">⚠️ {{ salaryError }}</div>
                  <div v-else-if="salaryPreview" class="salary-preview-badge">
                    💵 المبلغ المعتمد: <strong>{{ salaryPreview }}</strong>
                  </div>
                </div>
              </template>

              <template v-else-if="form.work_type === 'per_task'">
                <div class="card-mini-header">
                  <span class="header-icon">⚡</span>
                  <div>
                    <strong>مستحقات العمل بالتاسك (Per-Task)</strong>
                    <p>يتم احتساب مستحقات الموظف بناءً على عدد المهام المكتملة والمعتمدة.</p>
                  </div>
                </div>

                <div class="form-group full">
                  <div class="form-label-row">
                    <label for="user-task-rate">
                      سعر المهمة الافتراضي للموظف <span class="text-red">*</span>
                      <small class="text-hint">(يُطبَّق آلياً عند تكليفه بأي مهمة)</small>
                    </label>
                  </div>
                  <div class="salary-input-container">
                    <span class="salary-currency-tag">ج.م / مهمة</span>
                    <input
                      id="user-task-rate"
                      v-model="form.default_task_rate"
                      type="text"
                      inputmode="decimal"
                      placeholder="250.00"
                      class="salary-input-field"
                      required
                    />
                  </div>
                  <small class="text-hint" style="margin-top: 6px; display: block; color: #94a3b8">
                    💡 يمكن للمدير تعديل سعر أي مهمة بشكل فردي واستثنائي عند تكليف الموظف بها في المشاريع.
                  </small>
                </div>
              </template>

              <template v-else-if="form.work_type === 'commission'">
                <div class="card-mini-header">
                  <span class="header-icon">🎯</span>
                  <div>
                    <strong>مستحقات العمل بالعمولة (Commissions)</strong>
                    <p>حساب العمولة آلياً بناءً على إيرادات وعقود العملاء المحصلة.</p>
                  </div>
                </div>

                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
                  <div class="form-group">
                    <label class="form-label required">طريقة احتساب العمولة</label>
                    <select v-model="form.commission_type" class="form-select">
                      <option value="percentage">نسبة مئوية من إيراد التعاقد (%)</option>
                      <option value="fixed">مبلغ مقطوع ثابت لكل عميل (ج.م)</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label required">
                      {{ form.commission_type === 'percentage' ? 'نسبة العمولة (%)' : 'قيمة العمولة الثابتة (ج.م)' }}
                    </label>
                    <div class="salary-input-container">
                      <span class="salary-currency-tag">{{ form.commission_type === 'percentage' ? '%' : 'ج.م' }}</span>
                      <input
                        v-model="form.commission_rate"
                        type="text"
                        inputmode="decimal"
                        :placeholder="form.commission_type === 'percentage' ? '10' : '1500'"
                        class="salary-input-field"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="form-group full" style="margin-top: 10px">
                  <label for="user-commission-base-salary">
                    راتب أساسي إضافي <small class="text-hint">(اختياري - في حالة وجود راتب شهري ثابت بجانب العمولة)</small>
                  </label>
                  <div class="salary-input-container">
                    <span class="salary-currency-tag">ج.م</span>
                    <input
                      id="user-commission-base-salary"
                      v-model="form.salary"
                      type="text"
                      inputmode="decimal"
                      placeholder="0.00"
                      class="salary-input-field"
                    />
                  </div>
                </div>
              </template>
            </div>

            <!-- مواعيد وأيام العمل اليومية -->
            <div class="form-group-card full">
              <div class="card-mini-header">
                <span class="header-icon">⏰</span>
                <div>
                  <strong>مواعيد وأيام العمل</strong>
                  <p>حدد أيام وساعات العمل اليومية ليتم احتساب سعة وأيام الدوام تلقائياً للموظف.</p>
                </div>
              </div>

              <div class="time-pickers-row">
                <div class="form-group">
                  <label for="work-start-day">بداية أسبوع العمل (من يوم) <span class="text-red">*</span></label>
                  <select id="work-start-day" v-model="form.work_start_day" required @change="recalculateWorkingDays">
                    <option v-for="d in availableDays" :key="d.key" :value="d.key">{{ d.label }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="work-end-day">نهاية أسبوع العمل (إلى يوم) <span class="text-red">*</span></label>
                  <select id="work-end-day" v-model="form.work_end_day" required @change="recalculateWorkingDays">
                    <option v-for="d in availableDays" :key="d.key" :value="d.key">{{ d.label }}</option>
                  </select>
                </div>
              </div>

              <div class="time-pickers-row">
                <div class="form-group">
                  <label for="work-start-time">بداية الدوام (من) <span class="text-red">*</span></label>
                  <input id="work-start-time" v-model="form.work_start_time" type="time" required @input="recalculateDailyHours" />
                </div>

                <div class="form-group">
                  <label for="work-end-time">نهاية الدوام (إلى) <span class="text-red">*</span></label>
                  <input id="work-end-time" v-model="form.work_end_time" type="time" required @input="recalculateDailyHours" />
                </div>
              </div>

              <div class="calculated-hours-strip">
                <div class="calc-main">
                  <span class="calc-label">💡 إجمالي ساعات العمل اليومية المستنتجة:</span>
                  <span class="calc-badge">
                    <strong>{{ form.daily_work_hours || 8 }}</strong> ساعة / يوم
                  </span>
                </div>
                <div class="calc-main">
                  <span class="calc-label">📅 أيام العمل المعتمدة ({{ (form.working_days || []).length }} أيام/أسبوع):</span>
                  <span class="calc-days-tags">
                    <span v-for="dayKey in form.working_days" :key="dayKey" class="day-tag">
                      {{ getDayLabel(dayKey) }}
                    </span>
                  </span>
                </div>
                <small class="calc-hint">
                  يتم احتساب الساعات وأيام العمل أسبوعياً كسعة تشغيلية معتمدة (من
                  {{ getDayLabel(form.work_start_day) }} إلى {{ getDayLabel(form.work_end_day) }}، ومن
                  {{ formatTimeLabel(form.work_start_time) }} إلى {{ formatTimeLabel(form.work_end_time) }}).
                </small>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="saving">
                {{ saving ? 'جارٍ الحفظ...' : 'حفظ البيانات' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import {
  availableDays,
  cleanAndNormalizeSalary,
  formatTimeLabel,
  getDayLabel,
  jobTitles,
} from '../utils/userSchedules'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editingUser: { type: Object, default: null },
  departmentsList: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const isEditing = computed(() => Boolean(props.editingUser))
const saving = ref(false)
const showPassword = ref(false)
const modalCloseButton = ref(null)
const salaryError = ref('')

const form = reactive({
  name: '',
  job_title: '',
  email: '',
  password: '',
  phone: '',
  role: 'employee',
  salary: '',
  default_task_rate: '',
  commission_type: 'percentage',
  commission_rate: '',
  work_type: 'onsite',
  work_start_day: 'saturday',
  work_end_day: 'thursday',
  working_days: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  work_start_time: '09:00',
  work_end_time: '17:00',
  daily_work_hours: 8,
  primary_department_id: '',
  additional_department_ids: [],
})

const showToast = (msg) => alertService.smartToast(msg)

const resetForm = () => {
  salaryError.value = ''
  Object.assign(form, {
    name: '',
    job_title: '',
    email: '',
    password: '',
    phone: '',
    role: 'employee',
    salary: '',
    default_task_rate: '',
    commission_type: 'percentage',
    commission_rate: '',
    work_type: 'onsite',
    work_start_day: 'saturday',
    work_end_day: 'thursday',
    working_days: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    work_start_time: '09:00',
    work_end_time: '17:00',
    daily_work_hours: 8,
    primary_department_id: '',
    additional_department_ids: [],
  })
}

const recalculateWorkingDays = () => {
  const daysKeys = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const startIdx = daysKeys.indexOf(form.work_start_day)
  const endIdx = daysKeys.indexOf(form.work_end_day)
  if (startIdx === -1 || endIdx === -1) {
    form.working_days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
    return
  }

  const result = []
  let curr = startIdx
  while (true) {
    result.push(daysKeys[curr])
    if (curr === endIdx) break
    curr = (curr + 1) % 7
  }
  form.working_days = result
}

const recalculateDailyHours = () => {
  if (!form.work_start_time || !form.work_end_time) {
    form.daily_work_hours = 8
    return
  }
  const [startH, startM] = form.work_start_time.split(':').map(Number)
  const [endH, endM] = form.work_end_time.split(':').map(Number)

  const startTotalMins = startH * 60 + (startM || 0)
  const endTotalMins = endH * 60 + (endM || 0)

  let diffMins = endTotalMins - startTotalMins
  if (diffMins <= 0) {
    diffMins = 1440 - startTotalMins + endTotalMins
  }
  form.daily_work_hours = Math.round((diffMins / 60) * 10) / 10
}

watch(
  [() => props.modelValue, () => props.editingUser],
  async ([open, user]) => {
    if (!open) return
    showPassword.value = false
    salaryError.value = ''

    if (user) {
      const primaryDeptId = user.departments?.find((dept) => dept.pivot?.is_primary)?.id || ''
      const additionalDeptIds =
        user.departments?.filter((dept) => !dept.pivot?.is_primary).map((dept) => dept.id) || []

      let matchedTitle = ''
      if (user.role === 'employee' && user.job_title) {
        const found = jobTitles.find((t) => t.toLowerCase() === user.job_title.trim().toLowerCase())
        matchedTitle = found || user.job_title
      }

      Object.assign(form, {
        name: user.name,
        job_title: matchedTitle,
        email: user.email,
        password: '',
        phone: user.phone,
        role: user.role,
        salary:
          user.salary !== null && user.salary !== undefined && user.salary !== ''
            ? Number(user.salary).toFixed(2)
            : '',
        default_task_rate:
          user.default_task_rate !== null &&
          user.default_task_rate !== undefined &&
          user.default_task_rate !== ''
            ? Number(user.default_task_rate).toFixed(2)
            : '',
        commission_type: user.commission_type || 'percentage',
        commission_rate:
          user.commission_rate !== null &&
          user.commission_rate !== undefined &&
          user.commission_rate !== ''
            ? Number(user.commission_rate).toFixed(2)
            : '',
        work_type: user.work_type,
        work_start_day: user.work_start_day || 'saturday',
        work_end_day: user.work_end_day || 'thursday',
        working_days:
          Array.isArray(user.working_days) && user.working_days.length
            ? user.working_days
            : ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        work_start_time: user.work_start_time ? user.work_start_time.slice(0, 5) : '09:00',
        work_end_time: user.work_end_time ? user.work_end_time.slice(0, 5) : '17:00',
        daily_work_hours: Number(user.daily_work_hours || 8),
        primary_department_id: primaryDeptId,
        additional_department_ids: additionalDeptIds,
      })
      recalculateDailyHours()
      recalculateWorkingDays()
    } else {
      resetForm()
    }

    await nextTick()
    modalCloseButton.value?.focus({ preventScroll: true })
  },
  { immediate: true },
)

const closeModal = () => {
  showPassword.value = false
  resetForm()
  emit('update:modelValue', false)
}

const onSalaryInput = () => {
  if (!form.salary) {
    salaryError.value = ''
    return
  }

  const raw = form.salary
  const normalized = cleanAndNormalizeSalary(raw)
  if (raw !== normalized) form.salary = normalized

  if (normalized.includes('-')) {
    salaryError.value = 'لا يمكن إدخال راتب بقيمة سالبة.'
    return
  }
  if (/^\d+\.$/.test(normalized)) {
    salaryError.value = ''
    return
  }
  if (!/^\d*(\.\d*)?$/.test(normalized)) {
    salaryError.value = 'يرجى إدخال أرقام صحيحة أو عشرية صالحة فقط.'
    return
  }
  if (normalized.includes('.')) {
    const parts = normalized.split('.')
    if (parts.length > 2) {
      salaryError.value = 'صيغة الرقم غير صحيحة (تكرار العلامة العشرية).'
      return
    }
    if (parts[1] && parts[1].length > 2) {
      salaryError.value = 'الحد الأقصى للمنازل العشرية هو خانتان فقط (قروش).'
      return
    }
  }

  const num = parseFloat(normalized)
  if (isNaN(num)) {
    salaryError.value = 'القيمة المدخلة غير صالحة.'
    return
  }
  if (num > 1000000) {
    salaryError.value = 'الحد الأقصى المسموح به للراتب هو 1,000,000 ج.م.'
    return
  }
  salaryError.value = ''
}

const formatSalaryOnBlur = () => {
  if (!form.salary) {
    salaryError.value = ''
    return
  }
  const normalized = cleanAndNormalizeSalary(form.salary)
  if (!normalized) {
    form.salary = ''
    salaryError.value = ''
    return
  }
  const num = parseFloat(normalized)
  if (isNaN(num)) {
    salaryError.value = 'القيمة المدخلة غير صالحة.'
    return
  }
  if (num < 1000) {
    salaryError.value = 'الحد الأدنى لقيمة الراتب هو 1,000 ج.م.'
    return
  }
  if (num > 1000000) {
    salaryError.value = 'الحد الأقصى المسموح به للراتب هو 1,000,000 ج.م.'
    return
  }
  salaryError.value = ''
  form.salary = num.toFixed(2)
}

const salaryPreview = computed(() => {
  if (!form.salary || salaryError.value) return ''
  const cleaned = cleanAndNormalizeSalary(form.salary)
  if (!cleaned) return ''
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 1000 || num > 1000000) return ''
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`
})

const handleRoleChange = () => {
  if (form.role === 'manager') form.job_title = ''
}

watch(
  () => form.role,
  (newRole) => {
    if (newRole === 'manager') form.job_title = ''
  },
)

const handlePrimaryDeptChange = () => {
  if (form.primary_department_id) {
    form.additional_department_ids = form.additional_department_ids.filter(
      (id) => id !== form.primary_department_id,
    )
  }
}

const saveUser = async () => {
  if (salaryError.value) {
    showToast(salaryError.value)
    return
  }

  let finalSalary = null
  let finalDefaultTaskRate = null
  let finalCommissionType = null
  let finalCommissionRate = null

  if (form.work_type === 'onsite' || form.work_type === 'remote') {
    if (form.salary !== '' && form.salary !== null && form.salary !== undefined) {
      const cleaned = cleanAndNormalizeSalary(form.salary)
      if (cleaned !== '') {
        const num = parseFloat(cleaned)
        if (isNaN(num) || num < 1000 || num > 1000000) {
          salaryError.value =
            num < 1000
              ? 'الحد الأدنى لقيمة الراتب هو 1,000 ج.م.'
              : 'الحد الأقصى المسموح به للراتب هو 1,000,000 ج.م.'
          showToast(salaryError.value)
          return
        }
        finalSalary = num.toFixed(2)
      }
    }
  } else if (form.work_type === 'per_task') {
    if (form.default_task_rate !== '' && form.default_task_rate !== null && form.default_task_rate !== undefined) {
      const cleaned = cleanAndNormalizeSalary(form.default_task_rate)
      if (cleaned !== '') {
        const num = parseFloat(cleaned)
        if (isNaN(num) || num < 0) {
          showToast('يرجى إدخال سعر مهمة افتراضي صالح')
          return
        }
        finalDefaultTaskRate = num.toFixed(2)
      }
    }
  } else if (form.work_type === 'commission') {
    finalCommissionType = form.commission_type || 'percentage'
    if (form.commission_rate !== '' && form.commission_rate !== null && form.commission_rate !== undefined) {
      const cleaned = cleanAndNormalizeSalary(form.commission_rate)
      if (cleaned !== '') {
        const num = parseFloat(cleaned)
        if (isNaN(num) || num < 0) {
          showToast('يرجى إدخال قيمة أو نسبة عمولة صالحة')
          return
        }
        finalCommissionRate = num.toFixed(2)
      }
    }
    if (form.salary !== '' && form.salary !== null && form.salary !== undefined) {
      const cleaned = cleanAndNormalizeSalary(form.salary)
      if (cleaned !== '') {
        const num = parseFloat(cleaned)
        if (!isNaN(num) && num > 0) finalSalary = num.toFixed(2)
      }
    }
  }

  saving.value = true
  try {
    const payload = { ...form }
    if (payload.role === 'manager') payload.job_title = ''
    payload.daily_work_hours = Number(form.daily_work_hours || 8)
    payload.salary = finalSalary
    payload.default_task_rate = finalDefaultTaskRate
    payload.commission_type = finalCommissionType
    payload.commission_rate = finalCommissionRate

    if (isEditing.value) await api.put(`/users/${props.editingUser.id}`, payload)
    else await api.post('/users', payload)

    const wasEditing = isEditing.value
    closeModal()
    emit('saved', wasEditing)
  } catch (error) {
    const errorsObj = error.response?.data?.errors
    let errorMessage = error.response?.data?.message || 'حدث خطأ أثناء الحفظ'
    if (errorsObj && typeof errorsObj === 'object') {
      const allErrors = Object.values(errorsObj).flat()
      if (allErrors.length) errorMessage = allErrors.join(' | ')
    }
    showToast(errorMessage)
  } finally {
    saving.value = false
  }
}
</script>
