<template>
  <Teleport to="body">
    <div v-if="modelValue && canManage" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="closeModal">
        <div ref="modalContentRef" class="modal-content manager-modal-content" role="dialog">
          <button class="modal-close" type="button" @click="closeModal">×</button>
          <div class="modal-icon">◈</div>
          <span class="eyebrow">مساحة التخطيط</span>
          <h3>{{ isEditing ? 'تعديل الخطة' : 'إنشاء خطة جديدة' }}</h3>

          <div v-if="modalErrors.length > 0" class="modal-validation-banner" role="alert">
            <div class="banner-title">
              <span class="warning-icon">⚠️</span>
              <strong>يرجى تصحيح الأخطاء التالية لحفظ الخطة:</strong>
            </div>
            <ul class="banner-errors-list">
              <li v-for="(err, index) in modalErrors" :key="index">{{ err }}</li>
            </ul>
          </div>

          <form class="plan-form" @submit.prevent="savePlan">
            <div class="form-grid">
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.client_id }">
                <label>العميل المستهدف <span class="text-red">*</span></label>
                <select v-model="form.client_id" required @change="clearFieldError('client_id')">
                  <option value="" disabled>اختر العميل...</option>
                  <option v-for="client in allClients" :key="client.id" :value="client.id">{{ client.name }}</option>
                </select>
                <span v-if="fieldErrors.client_id" class="field-error-msg">{{ fieldErrors.client_id }}</span>
              </div>

              <div class="form-group" :class="{ 'has-field-error': fieldErrors.plan_type }">
                <label>نوع الخطة <span class="text-red">*</span></label>
                <select v-model="form.plan_type" required @change="onPlanTypeChange">
                  <option value="" disabled>اختر نوع الخطة...</option>
                  <option v-for="cat in planCategories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                  <option
                    v-if="form.plan_type && !planCategories.some((c) => c.name === form.plan_type)"
                    :value="form.plan_type"
                  >
                    {{ form.plan_type }}
                  </option>
                </select>
                <span v-if="fieldErrors.plan_type" class="field-error-msg">{{ fieldErrors.plan_type }}</span>
              </div>
            </div>

            <!-- عناصر ومخرجات الخطة وساعات العمل -->
            <div v-if="form.plan_type" class="plan-scope-section">
              <div class="scope-header">
                <div class="scope-title">
                  <span class="scope-icon">📦</span>
                  <div>
                    <h4>عناصر ومخرجات الخطة وساعات العمل (Scope &amp; Deliverables)</h4>
                    <p>حدد مخرجات هذه الخطة لحساب إجمالي ساعات العمل المتوقعة من المنفذين تلقائياً</p>
                  </div>
                </div>
                <div v-if="form.items.length > 0" class="scope-stats">
                  <span class="stat-badge count-badge">
                    <strong>{{ totalPlanItemsCount }}</strong> مخرجات
                  </span>
                  <span class="stat-badge hours-badge">
                    ⏱️ <strong>{{ formatHours(totalPlanEstimatedHours) }}</strong> ساعة عمل
                  </span>
                </div>
              </div>

              <div v-if="availableCategoryItems.length > 0" class="quick-add-bar">
                <div class="quick-add-topline">
                  <span class="quick-add-label">عناصر معيارية مقترحة لهذا النوع:</span>
                  <div class="quick-add-actions">
                    <button
                      type="button"
                      class="quick-batch-btn"
                      title="إضافة كافة العناصر المعيارية لهذا النوع بنقرة واحدة"
                      @click="fillAllCategoryItems"
                    >
                      ⚡ إضافة الكل
                    </button>
                    <button
                      v-if="form.items.length > 0"
                      type="button"
                      class="quick-batch-btn clear-btn"
                      title="مسح كافة العناصر المحددة"
                      @click="form.items = []"
                    >
                      🗑️ مسح
                    </button>
                  </div>
                </div>

                <div class="quick-chips-wrapper">
                  <button
                    v-for="item in availableCategoryItems"
                    :key="item.id"
                    type="button"
                    class="quick-item-chip"
                    :class="{ 'chip-selected': isItemInPlan(item.name) }"
                    :title="'ساعات الوحدة: ' + item.estimated_hours + ' ساعة'"
                    @click="addOrIncrementItem(item)"
                  >
                    <span class="chip-plus">＋</span>
                    <span class="chip-name">{{ item.name }}</span>
                    <span class="chip-hours">({{ item.estimated_hours }}س)</span>
                    <span v-if="getItemCountInPlan(item.name) > 0" class="chip-count-tag">
                      {{ getItemCountInPlan(item.name) }}
                    </span>
                  </button>
                </div>
              </div>

              <div v-if="form.items.length > 0" class="scope-items-table-wrapper">
                <table class="scope-items-table">
                  <thead>
                    <tr>
                      <th>اسم المخرج / العنصر</th>
                      <th style="width: 140px; text-align: center">العدد</th>
                      <th style="width: 120px; text-align: center">ساعات الوحدة</th>
                      <th style="width: 110px; text-align: center">الإجمالي</th>
                      <th style="width: 45px; text-align: center">إزالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in form.items" :key="index">
                      <td>
                        <input
                          v-model="item.item_name"
                          type="text"
                          class="scope-input"
                          placeholder="اسم المخرج..."
                          required
                        />
                      </td>
                      <td>
                        <div class="qty-stepper">
                          <button type="button" class="stepper-btn" @click="decrementQty(item)">−</button>
                          <input
                            v-model.number="item.quantity"
                            type="number"
                            min="1"
                            class="stepper-input"
                            @change="onItemQtyChange(item)"
                          />
                          <button type="button" class="stepper-btn" @click="incrementQty(item)">＋</button>
                        </div>
                      </td>
                      <td>
                        <div class="unit-hours-box">
                          <input
                            v-model.number="item.hours_per_unit"
                            type="number"
                            step="0.5"
                            min="0"
                            class="scope-input hours-field"
                            @change="onItemHoursChange(item)"
                          />
                          <span class="unit-text">ساعة</span>
                        </div>
                      </td>
                      <td style="text-align: center">
                        <span class="item-total-hours">
                          {{ formatHours((item.quantity || 1) * (item.hours_per_unit || 0)) }} س
                        </span>
                      </td>
                      <td style="text-align: center">
                        <button
                          type="button"
                          class="remove-scope-btn"
                          title="حذف هذا العنصر"
                          @click="form.items.splice(index, 1)"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="total-label">
                        <strong>المجموع الكلي لساعات العمل التقديرية (المنفذين):</strong>
                      </td>
                      <td colspan="2" class="total-value">
                        <strong>⏱️ {{ formatHours(totalPlanEstimatedHours) }} ساعة</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div v-else class="empty-scope-notice">
                <span>💡</span> لم يتم تحديد أي مخرجات حتى الآن. يمكنك النقر على العناصر المقترحة أعلاه لإضافتها فوراً أو إضافة مخرج يدوي.
              </div>

              <div class="add-custom-item-row">
                <button type="button" class="btn-subtle add-custom-btn" @click="addCustomItem">
                  <span>＋</span> إضافة مخرج مخصص آخر
                </button>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.start_date }">
                <label>تاريخ بداية الخطة <span class="text-red">*</span></label>
                <input v-model="form.start_date" type="date" required @input="clearFieldError('start_date')" />
                <span v-if="fieldErrors.start_date" class="field-error-msg">{{ fieldErrors.start_date }}</span>
              </div>
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.end_date }">
                <label>تاريخ نهاية الخطة <span class="text-red">*</span></label>
                <input v-model="form.end_date" type="date" required @input="clearFieldError('end_date')" />
                <span v-if="fieldErrors.end_date" class="field-error-msg">{{ fieldErrors.end_date }}</span>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.planned_delivery_date }">
                <label>التسليم النهائي <span class="text-red">*</span></label>
                <input
                  v-model="form.planned_delivery_date"
                  type="datetime-local"
                  required
                  @input="clearFieldError('planned_delivery_date')"
                />
                <span v-if="fieldErrors.planned_delivery_date" class="field-error-msg">
                  {{ fieldErrors.planned_delivery_date }}
                </span>
              </div>
              <div class="form-group toggle-group">
                <label>مراجعة داخلية؟</label>
                <label class="toggle-switch">
                  <input v-model="form.requires_review" type="checkbox" @change="onRequiresReviewChange" />
                  <span class="slider"></span>
                </label>
                <span class="toggle-label">{{ form.requires_review ? 'نعم' : 'لا' }}</span>
              </div>
            </div>

            <div v-if="form.requires_review" class="form-grid">
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.planned_initial_delivery_date }">
                <label>موعد التسليم الابتدائي</label>
                <input
                  v-model="form.planned_initial_delivery_date"
                  type="datetime-local"
                  @input="clearFieldError('planned_initial_delivery_date')"
                />
                <span v-if="fieldErrors.planned_initial_delivery_date" class="field-error-msg">
                  {{ fieldErrors.planned_initial_delivery_date }}
                </span>
              </div>
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.planned_review_date }">
                <label>موعد إنهاء المراجعة <span class="text-red">*</span></label>
                <input
                  v-model="form.planned_review_date"
                  type="datetime-local"
                  required
                  @input="clearFieldError('planned_review_date')"
                />
                <span v-if="fieldErrors.planned_review_date" class="field-error-msg">
                  {{ fieldErrors.planned_review_date }}
                </span>
              </div>
            </div>

            <div class="separator"></div>

            <div class="section-title" style="display: flex; justify-content: space-between; align-items: center">
              <div><span>🔗</span> الروابط المرجعية (Reference Links)</div>
              <button type="button" class="add-link-btn" @click="addReferenceLink">＋ إضافة رابط</button>
            </div>
            <div class="reference-links-container">
              <div v-for="(link, index) in form.reference_links" :key="index" class="link-input-group">
                <input
                  v-model="form.reference_links[index]"
                  type="url"
                  placeholder="أدخل رابط المرجع (مثال: Google Drive, Notion, etc...)"
                  required
                />
                <button
                  type="button"
                  class="remove-link-btn"
                  title="حذف الرابط"
                  @click="form.reference_links.splice(index, 1)"
                >
                  🗑️
                </button>
              </div>
              <p v-if="form.reference_links.length === 0" class="muted text-center" style="font-size: 10px; margin-top: 10px">
                لا توجد روابط مرجعية (اختياري)
              </p>
            </div>

            <div class="separator"></div>

            <div class="section-title" style="display: flex; justify-content: space-between; align-items: center">
              <div><span>⚙️</span> إعدادات الحقول الإلزامية للمنشورات (Brief Settings)</div>
            </div>
            <p style="font-size: 11px; color: #8792be; margin-bottom: 20px; margin-top: 5px; padding-right: 5px">
              حدد الحقول التي يجب على مسؤول الخطة تعبئتها إلزامياً قبل أن يتمكن من إرسال التكليف للمصمم/المنفذ. (بشكل افتراضي جميع الحقول مطلوبة).
            </p>
            <div class="brief-settings-container" style="margin-bottom: 10px">
              <div
                class="checkbox-list"
                style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; padding: 5px"
              >
                <label v-for="(label, key) in availableBriefFields" :key="key" class="custom-cb">
                  <input v-model="form.required_brief_fields" type="checkbox" :value="key" />
                  <span class="cb-text">{{ label }}</span>
                </label>
              </div>
            </div>

            <div class="separator"></div>

            <div class="section-title"><span>⌁</span> توزيع المهام</div>
            <div class="form-grid-3 users-grid">
              <div class="form-group" :class="{ 'has-field-error': fieldErrors.responsible_ids }">
                <label>المسؤول <span class="text-red">*</span></label>
                <div class="checkbox-list">
                  <label v-for="u in allUsers" :key="'resp_' + u.id" class="custom-cb">
                    <input v-model="form.responsible_ids" type="checkbox" :value="u.id" @change="clearFieldError('responsible_ids')" />
                    <span class="cb-text">{{ u.name }}</span>
                  </label>
                </div>
                <span v-if="fieldErrors.responsible_ids" class="field-error-msg">{{ fieldErrors.responsible_ids }}</span>
              </div>

              <div
                v-if="form.requires_review"
                class="form-group"
                :class="{ 'has-field-error': fieldErrors.reviewer_ids }"
              >
                <label>المراجع <span class="text-red">*</span></label>
                <div class="checkbox-list">
                  <label v-for="u in allUsers" :key="'rev_' + u.id" class="custom-cb">
                    <input v-model="form.reviewer_ids" type="checkbox" :value="u.id" @change="clearFieldError('reviewer_ids')" />
                    <span class="cb-text">{{ u.name }}</span>
                  </label>
                </div>
                <span v-if="fieldErrors.reviewer_ids" class="field-error-msg">{{ fieldErrors.reviewer_ids }}</span>
              </div>

              <div
                class="form-group"
                :style="form.requires_review ? '' : 'grid-column: span 2;'"
                :class="{ 'has-field-error': fieldErrors.executor_ids }"
              >
                <label>المنفذ <span class="text-red">*</span></label>
                <div class="checkbox-list" :style="form.requires_review ? '' : 'display:grid; grid-template-columns:1fr 1fr;'">
                  <label v-for="u in allUsers" :key="'exec_' + u.id" class="custom-cb">
                    <input v-model="form.executor_ids" type="checkbox" :value="u.id" @change="clearFieldError('executor_ids')" />
                    <span class="cb-text">{{ u.name }}</span>
                  </label>
                </div>
                <span v-if="fieldErrors.executor_ids" class="field-error-msg">{{ fieldErrors.executor_ids }}</span>
              </div>
            </div>

            <div v-if="modalErrors.length > 0" class="bottom-error-note">
              <span>⚠️ لا يمكن حفظ الخطة: يرجى مراجعة وتصحيح الأخطاء الموضحة أعلاه.</span>
            </div>

            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="saving">
                {{ saving ? 'جارٍ الحفظ...' : 'حفظ الخطة' }}
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
import alertService from '@/services/alertService'
import { contentPlansApi } from '../api/contentPlansApi'
import {
  availableBriefFields,
  formatHours,
  toDatetimeLocal,
  translateValidationError,
  validateManagerPlanForm,
} from '../utils/planHelpers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editingPlan: { type: Object, default: null },
  canManage: { type: Boolean, default: false },
  allClients: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  planCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'saved', 'categories-loaded'])

const isEditing = computed(() => Boolean(props.editingPlan))
const saving = ref(false)
const modalErrors = ref([])
const fieldErrors = reactive({})
const modalContentRef = ref(null)
const previousPlanType = ref('')

const form = reactive({
  client_id: '',
  plan_type: '',
  start_date: '',
  end_date: '',
  requires_review: true,
  planned_delivery_date: '',
  planned_review_date: '',
  planned_initial_delivery_date: '',
  final_link: '',
  notes: '',
  reference_links: [],
  responsible_ids: [],
  reviewer_ids: [],
  executor_ids: [],
  required_brief_fields: Object.keys(availableBriefFields),
  items: [],
})

const clearFieldError = (fieldName) => {
  if (fieldErrors[fieldName]) delete fieldErrors[fieldName]
}

const clearAllErrors = () => {
  modalErrors.value = []
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

const resetForm = () => {
  previousPlanType.value = ''
  Object.assign(form, {
    client_id: '',
    plan_type: '',
    start_date: '',
    end_date: '',
    requires_review: true,
    planned_delivery_date: '',
    planned_review_date: '',
    planned_initial_delivery_date: '',
    final_link: '',
    notes: '',
    reference_links: [],
    responsible_ids: [],
    reviewer_ids: [],
    executor_ids: [],
    required_brief_fields: Object.keys(availableBriefFields),
    items: [],
  })
}

watch(
  [() => props.modelValue, () => props.editingPlan],
  ([open, plan]) => {
    if (!open) return
    clearAllErrors()

    if (!props.planCategories?.length) {
      contentPlansApi
        .fetchPlanCategories()
        .then((res) => emit('categories-loaded', res.data?.data || res.data || []))
        .catch((err) => console.error('Error fetching plan categories in modal:', err))
    }

    if (plan) {
      previousPlanType.value = plan.plan_type || ''
      Object.assign(form, {
        client_id: plan.client_id,
        plan_type: plan.plan_type,
        start_date: plan.start_date ? plan.start_date.split('T')[0].split(' ')[0] : '',
        end_date: plan.end_date ? plan.end_date.split('T')[0].split(' ')[0] : '',
        requires_review: Boolean(plan.requires_review),
        planned_delivery_date: toDatetimeLocal(plan.planned_delivery_date),
        planned_review_date: toDatetimeLocal(plan.planned_review_date),
        planned_initial_delivery_date: toDatetimeLocal(plan.planned_initial_delivery_date),
        final_link: plan.final_link || '',
        notes: plan.notes || '',
        reference_links: Array.isArray(plan.reference_links) ? [...plan.reference_links] : [],
        responsible_ids: (plan.users || [])
          .filter((u) => u.pivot?.task_role === 'responsible')
          .map((u) => u.id),
        reviewer_ids: (plan.users || [])
          .filter((u) => u.pivot?.task_role === 'reviewer')
          .map((u) => u.id),
        executor_ids: (plan.users || [])
          .filter((u) => u.pivot?.task_role === 'executor')
          .map((u) => u.id),
        required_brief_fields:
          plan.required_brief_fields === null
            ? Object.keys(availableBriefFields)
            : Array.isArray(plan.required_brief_fields)
              ? [...plan.required_brief_fields]
              : [],
        items: (plan.items || []).map((i) => ({
          plan_item_estimate_id: i.plan_item_estimate_id || null,
          item_name: i.item_name,
          quantity: i.quantity || 1,
          hours_per_unit: Number(i.hours_per_unit) || 0,
          total_hours: Number(i.total_hours) || 0,
          unit: i.unit || 'hour',
        })),
      })
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

const closeModal = () => {
  clearAllErrors()
  previousPlanType.value = ''
  emit('update:modelValue', false)
}

const onRequiresReviewChange = () => {
  if (!form.requires_review) {
    clearFieldError('planned_review_date')
    clearFieldError('planned_initial_delivery_date')
    clearFieldError('reviewer_ids')
    form.planned_review_date = ''
    form.planned_initial_delivery_date = ''
    form.reviewer_ids = []
  }
}

const onPlanTypeChange = (event) => {
  clearFieldError('plan_type')
  const selectedType = event?.target ? event.target.value : form.plan_type
  if (previousPlanType.value && previousPlanType.value !== selectedType && form.items?.length) {
    form.items = []
    alertService.smartToast('⚠️ تم تفريغ عناصر ومخرجات النوع السابق لتحديد مخرجات النوع الجديد')
  }
  form.plan_type = selectedType
  previousPlanType.value = selectedType || ''
}

const selectedCategory = computed(() =>
  form.plan_type ? (props.planCategories || []).find((c) => c.name === form.plan_type) || null : null,
)
const availableCategoryItems = computed(() => selectedCategory.value?.items || [])

const totalPlanItemsCount = computed(() =>
  (form.items || []).reduce((acc, cur) => acc + (Number(cur.quantity) || 1), 0),
)

const totalPlanEstimatedHours = computed(() => {
  const sum = (form.items || []).reduce((acc, cur) => {
    const qty = Math.max(1, Number(cur.quantity) || 1)
    const h = Math.max(0, Number(cur.hours_per_unit) || 0)
    return acc + qty * h
  }, 0)
  return Number(sum.toFixed(2))
})

const isItemInPlan = (itemName) => (form.items || []).some((i) => i.item_name === itemName)
const getItemCountInPlan = (itemName) => {
  const item = (form.items || []).find((i) => i.item_name === itemName)
  return item ? Number(item.quantity) || 0 : 0
}

const pushCategoryItem = (catItem) => {
  const qty = 1
  const hours = Number(catItem.estimated_hours) || 0
  form.items.push({
    plan_item_estimate_id: catItem.id,
    item_name: catItem.name,
    quantity: qty,
    hours_per_unit: hours,
    total_hours: qty * hours,
    unit: catItem.unit || 'hour',
  })
}

const addOrIncrementItem = (catItem) => {
  const existing = form.items.find((i) => i.item_name === catItem.name)
  if (existing) {
    existing.quantity = (Number(existing.quantity) || 1) + 1
    existing.total_hours = existing.quantity * (Number(existing.hours_per_unit) || 0)
  } else {
    pushCategoryItem(catItem)
  }
}

const fillAllCategoryItems = () => {
  availableCategoryItems.value.forEach((catItem) => {
    if (!form.items.some((i) => i.item_name === catItem.name)) pushCategoryItem(catItem)
  })
}

const addCustomItem = () => {
  form.items.push({
    plan_item_estimate_id: null,
    item_name: '',
    quantity: 1,
    hours_per_unit: 1.0,
    total_hours: 1.0,
    unit: 'hour',
  })
}

const syncItemHours = (item) => {
  item.total_hours = (Number(item.quantity) || 1) * (Number(item.hours_per_unit) || 0)
}
const incrementQty = (item) => {
  item.quantity = (Number(item.quantity) || 0) + 1
  syncItemHours(item)
}
const decrementQty = (item) => {
  if ((Number(item.quantity) || 1) > 1) {
    item.quantity = Number(item.quantity) - 1
    syncItemHours(item)
  }
}
const onItemQtyChange = (item) => {
  if (!item.quantity || item.quantity < 1) item.quantity = 1
  syncItemHours(item)
}
const onItemHoursChange = (item) => {
  if (item.hours_per_unit < 0) item.hours_per_unit = 0
  syncItemHours(item)
}

const addReferenceLink = () => {
  if (form.reference_links.length >= 15) {
    alertService.smartToast('الحد الأقصى هو 15 رابط.')
    return
  }
  form.reference_links.push('')
}

const savePlan = async () => {
  if (!props.canManage) {
    alertService.smartToast('عذراً، لا تمتلك الصلاحية لحفظ الخطط')
    return
  }

  const validation = validateManagerPlanForm(form)
  if (!validation.isValid) {
    modalErrors.value = validation.errors
    Object.assign(fieldErrors, validation.fieldErrors)
    alertService.error(validation.errors[0] || 'يرجى مراجعة وتصحيح البيانات المدخلة في الخطة')
    nextTick(() => modalContentRef.value?.scrollTo({ top: 0, behavior: 'smooth' }))
    return
  }

  clearAllErrors()
  saving.value = true
  if (!form.requires_review) {
    form.planned_review_date = ''
    form.planned_initial_delivery_date = ''
    form.reviewer_ids = []
  }
  form.reference_links = form.reference_links.filter((link) => link.trim() !== '')

  const payload = {
    ...form,
    items: (form.items || [])
      .filter((i) => (i.item_name || '').trim() !== '')
      .map((i) => ({
        plan_item_estimate_id: i.plan_item_estimate_id || null,
        item_name: i.item_name.trim(),
        quantity: Math.max(1, Number(i.quantity) || 1),
        hours_per_unit: Math.max(0, Number(i.hours_per_unit) || 0),
        total_hours:
          Math.max(1, Number(i.quantity) || 1) * Math.max(0, Number(i.hours_per_unit) || 0),
        unit: i.unit || 'hour',
      })),
    planned_initial_delivery_date: form.planned_initial_delivery_date || null,
    planned_review_date: form.planned_review_date || null,
  }

  try {
    if (isEditing.value) {
      await contentPlansApi.update(props.editingPlan.id, payload)
      closeModal()
      alertService.smartToast('تم التحديث بنجاح')
      emit('saved', { isEditing: true, plan: null })
    } else {
      const response = await contentPlansApi.create(payload)
      closeModal()
      alertService.smartToast('تم الإنشاء بنجاح')
      emit('saved', { isEditing: false, plan: response.data?.data || null })
    }
  } catch (error) {
    console.error('فشل حفظ الخطة:', error)
    const errorList = []
    const serverFieldErrors = {}

    if (error.response?.data?.errors) {
      Object.entries(error.response.data.errors).forEach(([field, msgs]) => {
        const msgArray = Array.isArray(msgs) ? msgs : [msgs]
        msgArray.forEach((m) => {
          const translated = translateValidationError(field, m)
          errorList.push(translated)
          if (!serverFieldErrors[field]) serverFieldErrors[field] = translated
        })
      })
    }

    if (errorList.length === 0) {
      errorList.push(
        error.response?.data?.message ||
          'حدث خطأ أثناء حفظ الخطة. يرجى مراجعة البيانات والمحاولة مجدداً.',
      )
    }

    modalErrors.value = errorList
    Object.assign(fieldErrors, serverFieldErrors)
    alertService.error(errorList[0] || 'تعذر حفظ الخطة بسبب أخطاء في المدخلات')
    nextTick(() => modalContentRef.value?.scrollTo({ top: 0, behavior: 'smooth' }))
  } finally {
    saving.value = false
  }
}
</script>
