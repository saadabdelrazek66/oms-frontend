<template>
  <section class="plans-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / خطط المحتوى</span>
        <h2>{{ canManagePlans ? 'إدارة خطط المحتوى' : 'الخطط المسندة إليّ' }}</h2>
        <p>تابع مراحل العمل، دورات المراجعة، ومواعيد التسليم من مكان واحد.</p>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
        <button
          v-permission="'archive.view'"
          type="button"
          class="secondary-btn"
          title="فتح أرشيف خطط المحتوى"
          @click="openArchive('content_plans')"
        >
          <span>🗄️</span> أرشيف الخطط
        </button>
        <button
          v-permission="'plans.create'"
          class="primary-btn"
          type="button"
          @click="openManagerModal()"
        >
          <span>＋</span> إنشاء خطة جديدة
        </button>
      </div>
    </div>

    <div class="summary-strip">
      <div>
        <span class="summary-icon teal">◈</span>
        <div><small>إجمالي الخطط</small><strong>{{ plans.length }}</strong></div>
      </div>
      <div>
        <span class="summary-icon purple">◌</span>
        <div><small>قيد المراجعة</small><strong>{{ underReviewCount }}</strong></div>
      </div>
      <div>
        <span class="summary-icon orange">◷</span>
        <div><small>مرفوضة / متأخرة</small><strong>{{ delayedCount }}</strong></div>
      </div>
      <div class="sync-status"><i></i> بيانات محدثة من مساحة العمل</div>
    </div>

    <PlanFiltersBar
      :filters="filters"
      :show-advanced="showAdvancedFilters"
      :loading="loading"
      :has-active-filters="hasActiveFilters"
      :can-filter-by-employee="canManagePlans"
      :all-clients="allClients"
      :all-users="allUsers"
      :plan-categories="planCategories"
      :legacy-plan-types="legacyPlanTypes"
      @toggle-advanced="showAdvancedFilters = !showAdvancedFilters"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <div class="plans-card">
      <div class="card-heading">
        <div class="heading-title-group">
          <h3>الخطط الحالية <span>{{ plans.length }}</span></h3>
          <p>متابعة دورات الإنتاج، المراجعة، ومواعيد التسليم</p>
        </div>
      </div>

      <div class="cards-view-container">
        <div v-if="loading" class="state-cell">
          <span class="spinner"></span> جارٍ تحميل خطط المحتوى...
        </div>
        <div v-else-if="plans.length === 0" class="state-cell">
          لا توجد خطط مسجلة حاليًا تطابق الفلاتر المحددة.
        </div>
        <div v-else class="plans-grid">
          <PlanCard
            v-for="plan in plans"
            :key="plan.id"
            :plan="plan"
            :is-manager="isManager"
            :is-targeted="String(route.query.plan_id) === String(plan.id)"
            :is-delayed="isPlanDelayed(plan)"
            :is-expanded="expandedCardId === plan.id"
            :open-stage="openPlanStages[plan.id] || 0"
            :can-open-spreadsheet="canOpenSpreadsheet(plan)"
            :can-submit-for-review="isUserResponsible(plan) || isUserExecutor(plan)"
            :is-reviewer="isUserReviewer(plan)"
            :is-responsible="isUserResponsible(plan)"
            :can-notify-client="canNotifyClient(plan)"
            :action-loading="actionLoading"
            :current-time="currentTime"
            :all-clients="allClients"
            @toggle-expand="toggleCardAccordion"
            @toggle-stage="toggleStage"
            @smart-notify="smartNotify"
            @duplicate="openDuplicateModal"
            @edit="openManagerModal"
            @archive="archivePlan"
            @delete="deletePlan"
            @submit-review="openSubmissionModal($event, 'review')"
            @approve="approvePlan"
            @reject="openRejectModal"
            @open-rejections="openRejectionsModal"
            @notify-client="openClientNotificationModal"
            @notify-client-groups="openClientGroupNotifyModal"
            @notify-direct-group="notifyClientGroup"
            @toggle-client-approval="handleClientApproval"
            @open-followups="openFollowUpsModal"
            @final-delivery="submitFinalDelivery"
            @open-history="historyPlan = $event"
            @open-references="referencesPlan = $event"
            @open-details="detailsPlan = $event"
          />
        </div>
      </div>
    </div>

    <AppPagination
      :current-page="pagination.current_page"
      :last-page="pagination.last_page"
      :total="pagination.total"
      item-label="خطة"
      :disabled="loading"
      @change="changePage"
    />

    <PlanFormModal
      v-model="showManagerModal"
      :editing-plan="editingPlan"
      :can-manage="canManagePlans"
      :all-clients="allClients"
      :all-users="allUsers"
      :plan-categories="planCategories"
      @saved="handlePlanSaved"
      @categories-loaded="planCategories = $event"
    />

    <PlanDuplicateModal
      v-model="showDuplicateModal"
      :plan="planToDuplicate"
      @duplicated="handleDuplicated"
    />

    <PlanFollowUpsModal
      v-model="showFollowUpsModal"
      :plan="selectedFollowUpPlan"
      :is-manager="isManager"
      @updated="handleFollowUpUpdated"
      @view-image="openImageViewer"
    />

    <PlanDetailsModal
      :plan="detailsPlan"
      :is-manager="isManager"
      @close="detailsPlan = null"
    />

    <PlanSubmissionModal
      v-model="showPlanSubmissionModal"
      :plan="submissionPlan"
      :submission-type="submissionType"
      @submitted-review="handleSubmittedReview"
      @submitted-final="handleSubmittedFinal"
    />

    <PlanNotifyModals
      :show-creation-success="showCreationSuccessModal"
      :is-duplicate-success="isDuplicateSuccessModal"
      :created-plan="createdPlan"
      :wa-prompt="waPrompt"
      :show-delivery-success="showDeliverySuccessModal"
      :delivered-plan="deliveredPlan"
      :client-notify-plan="selectedNotifyPlan"
      :group-notify-plan="selectedGroupNotifyPlan"
      :group-notify-type="groupNotifyType"
      :all-clients="allClients"
      :managers-list="getManagersList()"
      :generate-wa-link="generateWaLink"
      :get-client-review-message="getClientReviewMessage"
      :get-client-delivery-message="getClientDeliveryMessage"
      :get-client-contact-wa-link="getClientContactWaLink"
      :notify-client-group="notifyClientGroup"
      @close-creation="closeCreationModal"
      @close-wa-prompt="closeWaPrompt"
      @close-delivery="closeDeliveryModal"
      @close-client-notify="selectedNotifyPlan = null"
      @close-group-notify="selectedGroupNotifyPlan = null"
      @open-group-notify="openClientGroupNotifyModal"
    />

    <PlanReviewAndViewModals
      :show-reject="showRejectModal"
      :rejecting="actionLoading.startsWith('reject-')"
      :show-rejections="showRejectionsModal"
      :rejections="selectedRejections"
      :history-plan="historyPlan"
      :references-plan="referencesPlan"
      :viewer-image-url="viewerImageUrl"
      @close-reject="closeRejectModal"
      @submit-reject="submitRejectPlan"
      @close-rejections="closeRejectionsModal"
      @close-history="historyPlan = null"
      @close-references="referencesPlan = null"
      @close-viewer="viewerImageUrl = ''"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import alertService from '@/services/alertService'
import AppPagination from '@/components/ui/AppPagination.vue'
import { getDeadlineStatus } from '@/utils/timeHelper'
import { useQuickArchive } from '@/modules/archive/composables/useQuickArchive'
import { contentPlansApi } from '@/modules/content-plans/api/contentPlansApi'
import { useContentPlansNotifications } from '@/modules/content-plans/composables/useContentPlansNotifications'
import {
  enrichPlan,
  enrichPlans,
  getActiveStageNumber,
  getReviewHistories,
  isPlanClientApproved,
} from '@/modules/content-plans/utils/planHelpers'
import PlanFiltersBar from '@/modules/content-plans/components/PlanFiltersBar.vue'
import PlanCard from '@/modules/content-plans/components/PlanCard.vue'
import PlanFormModal from '@/modules/content-plans/components/PlanFormModal.vue'
import PlanDuplicateModal from '@/modules/content-plans/components/PlanDuplicateModal.vue'
import PlanFollowUpsModal from '@/modules/content-plans/components/PlanFollowUpsModal.vue'
import PlanDetailsModal from '@/modules/content-plans/components/PlanDetailsModal.vue'
import PlanSubmissionModal from '@/modules/content-plans/components/PlanSubmissionModal.vue'
import PlanNotifyModals from '@/modules/content-plans/components/PlanNotifyModals.vue'
import PlanReviewAndViewModals from '@/modules/content-plans/components/PlanReviewAndViewModals.vue'

let cachedUsers = null
let cachedPlanCategories = null
let cachedClients = null

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { archiveItem: quickArchive, openArchive } = useQuickArchive()

const user = computed(() => authStore.user || {})
const isManager = computed(() => authStore.isManager || user.value?.role === 'manager')
const canManagePlans = computed(() => isManager.value || user.value?.job_title === 'Account Manager')

const plans = ref([])
const allUsers = ref([])
const allClients = ref([])
const planCategories = ref([])
const loading = ref(true)
const actionLoading = ref('')
const showAdvancedFilters = ref(false)
const currentTime = ref(Date.now())
let countdownInterval = null

const {
  fetchNotificationTemplates,
  getManagersList,
  generateWaLink,
  getClientDeliveryMessage,
  getClientReviewMessage,
  getClientContactWaLink,
  notifyClientGroup,
} = useContentPlansNotifications(allUsers)

const showToast = (message, type = 'info') => alertService.smartToast(message, type)

const queryStatus = route.query.status ? String(route.query.status) : ''
const initialStatus = queryStatus === 'in_review' ? 'under_review' : queryStatus
if (initialStatus) showAdvancedFilters.value = true

const filters = reactive({
  search: '',
  client_id: '',
  plan_type: '',
  status: initialStatus,
  employee_id: '',
  start_date: '',
  end_date: '',
  delivery_from: '',
  delivery_to: '',
  review_from: '',
  review_to: '',
  is_overdue: false,
  requires_review: false,
  plan_id: route.query.plan_id ? String(route.query.plan_id) : '',
})

const pagination = reactive({ current_page: 1, last_page: 1, total: 0, per_page: 10 })

const hasActiveFilters = computed(() =>
  Object.values(filters).some((val) => val !== '' && val !== false),
)

const legacyPlanTypes = computed(() => {
  const known = new Set((planCategories.value || []).map((c) => c.name))
  const legacy = new Set()
  plans.value.forEach((p) => {
    if (p.plan_type && !known.has(p.plan_type)) legacy.add(p.plan_type)
  })
  return Array.from(legacy)
})

const underReviewCount = computed(
  () => plans.value.filter((plan) => plan.status === 'under_review').length,
)

const delayedCount = computed(
  () => plans.value.filter((plan) => isPlanDelayed(plan)).length,
)

const isPlanDelayed = (plan) =>
  plan.status === 'rejected' ||
  getDeadlineStatus(
    plan.created_at || plan.start_date,
    plan.planned_delivery_date,
    plan.status,
    currentTime.value,
  ).isOverdue

const isUserRole = (plan, taskRole) => {
  if (!plan?.users) return false
  const uid = Number(user.value?.id)
  return plan.users.some((u) => Number(u.id) === uid && u.pivot?.task_role === taskRole)
}
const isUserResponsible = (plan) => canManagePlans.value || isUserRole(plan, 'responsible')
const isUserReviewer = (plan) => isManager.value || isUserRole(plan, 'reviewer')
const isUserExecutor = (plan) => canManagePlans.value || isUserRole(plan, 'executor')

const canOpenSpreadsheet = (plan) => {
  if (isManager.value) return true
  if (!plan) return false
  if (!plan.requires_review) return true
  return ['reviewed', 'completed'].includes(plan.status)
}

const canNotifyClient = (plan) => {
  if (!plan || !['reviewed', 'completed'].includes(plan.status)) return false
  if (isManager.value) return true
  return isUserResponsible(plan) && Boolean(plan.allow_client_notify_by_employee)
}

// Accordion state
const expandedCardId = ref(null)
const openPlanStages = ref({})

const toggleCardAccordion = (planId) => {
  if (expandedCardId.value === planId) {
    expandedCardId.value = null
  } else {
    expandedCardId.value = planId
    if (!openPlanStages.value[planId]) {
      const plan = plans.value.find((p) => p.id === planId)
      if (plan) openPlanStages.value = { ...openPlanStages.value, [planId]: getActiveStageNumber(plan) }
    }
  }
}

const toggleStage = (plan, stageNum) => {
  if (!plan) return
  const isOpen = openPlanStages.value[plan.id] === stageNum
  openPlanStages.value = { ...openPlanStages.value, [plan.id]: isOpen ? 0 : stageNum }
}

const checkAndFocusTargetPlan = () => {
  if (!route.query.plan_id || !plans.value.length) return
  const targetId = Number(route.query.plan_id)
  const targetPlan = plans.value.find((p) => p.id === targetId)
  if (!targetPlan) return

  expandedCardId.value = targetPlan.id
  let stageToOpen = 1
  if (['under_review', 'rejected'].includes(targetPlan.status)) stageToOpen = 2
  else if (targetPlan.status === 'reviewed') stageToOpen = 3
  else if (targetPlan.status === 'completed') stageToOpen = 4
  openPlanStages.value = { ...openPlanStages.value, [targetPlan.id]: stageToOpen }

  nextTick(() => {
    document.getElementById(`plan-card-${targetPlan.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// Fetchers
const fetchPlans = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.current_page)
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== '' && filters[key] !== false) {
        params.append(key, typeof filters[key] === 'boolean' ? 1 : filters[key])
      }
    })

    const response = await contentPlansApi.list(params.toString())
    if (response.data && response.data.data !== undefined && response.data.current_page) {
      const list = response.data.data
      enrichPlans(list)
      plans.value = list
      pagination.current_page = response.data.current_page
      pagination.last_page = response.data.last_page
      pagination.total = response.data.total
      pagination.per_page = response.data.per_page || 10
    } else {
      const list = response.data.data || response.data || []
      enrichPlans(list)
      plans.value = list
      pagination.last_page = 1
      pagination.total = plans.value.length
    }
    checkAndFocusTargetPlan()
  } catch {
    showToast('تعذر تحميل الخطط')
  } finally {
    loading.value = false
  }
}

const fetchResources = async () => {
  if (cachedUsers && allUsers.value.length === 0) allUsers.value = cachedUsers
  if (cachedPlanCategories && planCategories.value.length === 0) planCategories.value = cachedPlanCategories
  if (cachedClients && allClients.value.length === 0) allClients.value = cachedClients

  const promises = []
  if (!cachedUsers) {
    promises.push(
      contentPlansApi.fetchUsers().then((res) => {
        cachedUsers = res.data.data || res.data || []
        allUsers.value = cachedUsers
      }).catch((err) => console.error('Error fetching users:', err)),
    )
  }
  if (!cachedPlanCategories) {
    promises.push(
      contentPlansApi.fetchPlanCategories().then((res) => {
        cachedPlanCategories = res.data?.data || res.data || []
        planCategories.value = cachedPlanCategories
      }).catch((err) => console.error('Error fetching plan categories:', err)),
    )
  }
  if (canManagePlans.value && !cachedClients) {
    promises.push(
      contentPlansApi.fetchClients().then((res) => {
        cachedClients = res.data.data || res.data || []
        allClients.value = cachedClients
      }).catch((err) => console.error('Error fetching clients:', err)),
    )
  }
  if (promises.length > 0) await Promise.allSettled(promises)
}

const applyFilters = () => {
  pagination.current_page = 1
  fetchPlans()
}
const resetFilters = () => {
  Object.keys(filters).forEach((k) => {
    filters[k] = typeof filters[k] === 'boolean' ? false : ''
  })
  if (route.query.plan_id || route.query.status) router.replace({ query: {} })
  applyFilters()
}
const changePage = (page) => {
  if (page < 1 || page > pagination.last_page) return
  pagination.current_page = page
  fetchPlans()
}

// Modal states
const showManagerModal = ref(false)
const editingPlan = ref(null)
const showDuplicateModal = ref(false)
const planToDuplicate = ref(null)
const showFollowUpsModal = ref(false)
const selectedFollowUpPlan = ref(null)
const detailsPlan = ref(null)
const showPlanSubmissionModal = ref(false)
const submissionPlan = ref(null)
const submissionType = ref('review')
const showCreationSuccessModal = ref(false)
const isDuplicateSuccessModal = ref(false)
const createdPlan = ref(null)
const showDeliverySuccessModal = ref(false)
const deliveredPlan = ref(null)
const selectedNotifyPlan = ref(null)
const selectedGroupNotifyPlan = ref(null)
const groupNotifyType = ref('review_done')
const waPrompt = reactive({ show: false, title: '', desc: '', link: '', recipients: [] })
const showRejectModal = ref(false)
const rejectPlanId = ref(null)
const showRejectionsModal = ref(false)
const selectedRejections = ref([])
const historyPlan = ref(null)
const referencesPlan = ref(null)
const viewerImageUrl = ref('')

const triggerWaPrompt = (title, desc, type, plan, specificUser = null) => {
  const link = generateWaLink(type, plan, specificUser)
  if (!link) {
    showToast('رقم الهاتف غير مسجل أو غير صالح للشخص المستهدف.')
    return
  }
  Object.assign(waPrompt, { show: true, title, desc, link, recipients: [] })
}
const closeWaPrompt = () => Object.assign(waPrompt, { show: false, link: '', recipients: [] })

const smartNotify = (plan) => {
  fetchNotificationTemplates(true)
  if (plan.status === 'pending' || plan.status === 'rejected') {
    triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المسؤول عن الخطة بضرورة الإنجاز.', 'plan_delayed', plan)
  } else if (plan.status === 'under_review') {
    triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المراجع الداخلي لإنهاء المراجعة.', 'plan_delayed', plan)
  } else if (plan.status === 'reviewed') {
    triggerWaPrompt('الخطة جاهزة', 'تنبيه المسؤول لتسليم الخطة للعميل.', 'plan_approved', plan)
  } else {
    showToast('الخطة مكتملة.')
  }
}

// Actions
const openManagerModal = (plan = null) => {
  if (!canManagePlans.value) {
    showToast('عذراً، لا تمتلك الصلاحية لإنشاء أو تعديل الخطط')
    return
  }
  editingPlan.value = plan
  showManagerModal.value = true
}

const handlePlanSaved = async ({ isEditing, plan }) => {
  await fetchPlans()
  if (!isEditing && plan?.id) {
    const found = plans.value.find((p) => p.id === plan.id)
    createdPlan.value = found ? enrichPlan(found) : enrichPlan(plan)
    isDuplicateSuccessModal.value = false
    showCreationSuccessModal.value = true
  }
}

const openDuplicateModal = (plan) => {
  if (!isManager.value) {
    showToast('عذراً، صلاحية استنساخ الخطط مخصصة للمدير فقط')
    return
  }
  planToDuplicate.value = plan
  showDuplicateModal.value = true
}

const handleDuplicated = async (newPlan) => {
  await fetchPlans()
  if (newPlan?.id) {
    const found = plans.value.find((p) => p.id === newPlan.id)
    createdPlan.value = found ? enrichPlan(found) : enrichPlan(newPlan)
    isDuplicateSuccessModal.value = true
    showCreationSuccessModal.value = true
  }
}

const closeCreationModal = () => {
  showCreationSuccessModal.value = false
  createdPlan.value = null
  isDuplicateSuccessModal.value = false
}

const openFollowUpsModal = (plan) => {
  selectedFollowUpPlan.value = plan
  showFollowUpsModal.value = true
}

const handleFollowUpUpdated = async (planId) => {
  await fetchPlans()
  if (planId) selectedFollowUpPlan.value = plans.value.find((p) => p.id === planId) || null
}

const openSubmissionModal = (plan, type = 'review') => {
  submissionPlan.value = plan
  submissionType.value = type
  showPlanSubmissionModal.value = true
}

const handleSubmittedReview = async (plan) => {
  await fetchPlans()
  triggerWaPrompt('تم التسليم بنجاح', 'هل تريد إرسال تنبيه للمراجع لكي يبدأ الآن؟', 'review_needed', plan)
}

const handleSubmittedFinal = async (plan) => {
  await fetchPlans()
  deliveredPlan.value = plans.value.find((p) => p.id === plan.id) || plan
  showDeliverySuccessModal.value = true
}

const closeDeliveryModal = () => {
  showDeliverySuccessModal.value = false
  deliveredPlan.value = null
}

const approvePlan = async (plan) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد اعتماد الخطة',
    message: `هل أنت متأكد من اعتماد خطة "${plan?.client?.name || ''}" لتصبح جاهزة للعميل؟`,
    confirmText: 'نعم، اعتمد الخطة ✅',
    cancelText: 'إلغاء',
    type: 'success',
  })
  if (!confirmed) return
  actionLoading.value = `approve-${plan.id}`
  try {
    await contentPlansApi.approve(plan.id)
    showToast('تم اعتماد الخطة بنجاح ✅')
    await fetchPlans()
    triggerWaPrompt('تمت الموافقة بنجاح', 'أبلغ المسؤول الآن بأن الخطة جاهزة لتُسلم للعميل.', 'plan_approved', plan)
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الاعتماد')
  } finally {
    actionLoading.value = ''
  }
}

const openRejectModal = (plan) => {
  rejectPlanId.value = plan.id
  showRejectModal.value = true
}
const closeRejectModal = () => {
  showRejectModal.value = false
  rejectPlanId.value = null
}
const submitRejectPlan = async (notes) => {
  const planId = rejectPlanId.value
  const planToReject = plans.value.find((p) => p.id === planId)
  actionLoading.value = `reject-${planId}`
  try {
    await contentPlansApi.reject(planId, notes)
    showToast('تم رفض الخطة')
    closeRejectModal()
    await fetchPlans()
    triggerWaPrompt(
      'تم تسجيل الرفض',
      'أبلغ المسؤول الآن بضرورة الدخول لقراءة ملاحظاتك وتعديلها.',
      'plan_rejected',
      planToReject,
    )
  } finally {
    actionLoading.value = ''
  }
}

const openRejectionsModal = (plan) => {
  selectedRejections.value = getReviewHistories(plan).filter((h) => h.action === 'rejected')
  showRejectionsModal.value = true
}
const closeRejectionsModal = () => {
  showRejectionsModal.value = false
  selectedRejections.value = []
}

const handleClientApproval = async (plan) => {
  if (!plan) return
  if (!isManager.value && !isUserResponsible(plan)) {
    showToast('عذراً، لا تمتلك الصلاحية لتسجيل اعتماد العميل على هذه الخطة')
    return
  }
  if (plan.status === 'completed') {
    showToast('الخطة مكتملة ومسلمة نهائياً بالفعل')
    return
  }
  const isCurrentlyApproved = isPlanClientApproved(plan)
  if (isCurrentlyApproved) {
    const confirmed = await alertService.confirm({
      title: 'إلغاء اعتماد العميل',
      message: 'هل أنت متأكد من رغبتك في إلغاء اعتماد العميل لهذه الخطة؟ سيؤدي ذلك لإعادة قفل المرحلة الرابعة (التسليم النهائي).',
      confirmText: 'نعم، إلغاء الاعتماد',
      cancelText: 'تراجع',
      type: 'warning',
    })
    if (!confirmed) return
  }

  actionLoading.value = `client-approval-${plan.id}`
  try {
    const response = await contentPlansApi.toggleClientApproval(plan.id)
    const isApprovedNow = !isCurrentlyApproved
    plan.client_approved_at = isApprovedNow ? new Date().toISOString() : null
    plan.is_client_approved = isApprovedNow
    if (plan._stageStates) {
      delete plan._stageStates[3]
      delete plan._stageStates[4]
    }
    showToast(
      response.data?.message ||
        (isApprovedNow
          ? 'تم تسجيل اعتماد العميل بنجاح وتم فتح مرحلة التسليم النهائي ✅'
          : 'تم إلغاء اعتماد العميل'),
    )
    if (isApprovedNow) openPlanStages.value = { ...openPlanStages.value, [plan.id]: 4 }
    await fetchPlans()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة تحديث اعتماد العميل')
  } finally {
    actionLoading.value = ''
  }
}

const submitFinalDelivery = (plan) => {
  if (!isPlanClientApproved(plan)) {
    showToast('عذراً، المرحلة الرابعة غير مفعلة، يلزم اعتماد الخطة من العميل في المرحلة الثالثة أولاً')
    return
  }
  openSubmissionModal(plan, 'final')
}

const archivePlan = (plan) => {
  quickArchive({
    moduleKey: 'content_plans',
    id: plan.id,
    title: plan.name || (plan.client?.name ? `خطة ${plan.client.name}` : `خطة #${plan.id}`),
    defaultReason: 'أرشفة يدوية من صفحة خطط المحتوى',
    onSuccess: (archivedId) => {
      plans.value = plans.value.filter((p) => p.id !== archivedId)
    },
  })
}

const deletePlan = async (id) => {
  if (!isManager.value) {
    showToast('عذراً، صلاحية حذف الخطط مخصصة للمدير فقط')
    return
  }
  const planToDelete = plans.value.find((p) => p.id === id)
  const planName = planToDelete?.client?.name ? `خطة عميل "${planToDelete.client.name}"` : 'هذه الخطة'
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف الخطة',
    message: `هل أنت متأكد من رغبتك في حذف ${planName} نهائياً؟ سيتم حذف جميع المنشورات والمتابعات التابعة لها.`,
    confirmText: 'نعم، احذف الخطة 🗑️',
    cancelText: 'إلغاء',
    type: 'danger',
  })
  if (!confirmed) return
  try {
    await contentPlansApi.remove(id)
    showToast('تم حذف الخطة بنجاح 🗑️')
    await fetchPlans()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}

const openClientNotificationModal = (plan) => {
  selectedNotifyPlan.value = plan
  fetchNotificationTemplates(true)
}

const openClientGroupNotifyModal = (plan, type = 'review_done') => {
  selectedGroupNotifyPlan.value = plan
  groupNotifyType.value = type
  fetchNotificationTemplates(true)
}

const openImageViewer = (url) => {
  if (!url) {
    showToast('لا توجد صورة للمعاينة')
    return
  }
  viewerImageUrl.value = url
}

const handleViewerKeyDown = (e) => {
  if (e.key === 'Escape' && viewerImageUrl.value) {
    viewerImageUrl.value = ''
    e.stopPropagation()
  }
}

watch(
  () => route.query.status,
  (newStatus) => {
    if (newStatus !== undefined) {
      const s = newStatus === 'in_review' ? 'under_review' : String(newStatus || '')
      filters.status = s
      if (s) showAdvancedFilters.value = true
      applyFilters()
    }
  },
)

watch(
  () => route.query.plan_id,
  (newId) => {
    if (newId) {
      filters.plan_id = String(newId)
      applyFilters()
    }
  },
)

watch(showManagerModal, (open) => document.body.classList.toggle('modal-is-open', open))

onMounted(() => {
  fetchPlans()
  fetchResources()
  fetchNotificationTemplates(true)
  countdownInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 30000)
  window.addEventListener('keydown', handleViewerKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleViewerKeyDown)
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  document.body.classList.remove('modal-is-open')
})
</script>

<style src="@/modules/content-plans/styles/content-plans.css"></style>
