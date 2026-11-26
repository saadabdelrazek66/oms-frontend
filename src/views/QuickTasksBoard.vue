<template>
  <section class="quick-tasks-page" dir="rtl">
    <!-- الهيدر وأزرار الإجراءات -->
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة العمل / المهام السريعة</span>
        <h2>المهام السريعة</h2>
        <p>تابع، استمع، وأنجز مهام فريقك السريعة والتوجيهات الصوتية بكل سهولة.</p>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
        <button
          v-permission="'archive.view'"
          type="button"
          class="primary-btn"
          style="background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(129, 140, 248, 0.38); color: #c7d2fe"
          title="فتح أرشيف المهام السريعة"
          @click="openArchive('quick_tasks')"
        >
          <span>🗄️</span>
          أرشيف المهام
        </button>
        <button v-permission="'quick_tasks.create'" class="primary-btn" type="button" @click="openCreateModal">
          <span aria-hidden="true">＋</span>
          إضافة مهمة جديدة
        </button>
      </div>
    </div>

    <!-- شبكة الإحصائيات -->
    <QuickTaskStatsBar
      :total="tasks.length"
      :active-count="activeTasksCount"
      :completed-count="completedTasksCount"
    />

    <!-- كارت التحكم وفلترة وعرض المهام -->
    <div class="tasks-card">
      <div class="card-heading">
        <div>
          <h3>
            كل المهام <span>{{ filteredTasks.length }}</span>
          </h3>
          <p>قائمة المهام والتوجيهات الصوتية الحالية</p>
        </div>
        <div class="live-state" role="status"><i aria-hidden="true"></i> محدث الآن</div>
      </div>

      <div class="filters-section" :class="{ 'two-cols': !isManagerUser }" role="search" aria-label="تصفية المهام السريعة">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            v-model="filters.search"
            type="search"
            placeholder="ابحث بالعنوان أو الوصف أو اسم المنفذ..."
            aria-label="البحث عن مهمة"
          />
        </div>
        <select v-model="filters.status" aria-label="تصفية حسب الحالة">
          <option value="">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="in_progress">جاري التنفيذ</option>
          <option value="under_review">قيد المراجعة</option>
          <option value="rejected">مرفوضة (تحتاج تعديل)</option>
          <option value="completed">مكتملة</option>
        </select>
        <select v-if="isManagerUser" v-model="filters.assignee" aria-label="تصفية حسب المنفذ">
          <option value="">كل المنفذين</option>
          <option v-for="user in usersList" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
      </div>

      <div class="tasks-body">
        <div v-if="isLoading" class="tasks-loading">
          <span class="spinner" aria-hidden="true"></span>
          <span>جارٍ تحميل المهام...</span>
        </div>

        <div v-else-if="filteredTasks.length > 0" class="tasks-grid-wrapper">
          <TransitionGroup
            name="task-list"
            tag="div"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6"
          >
            <QuickTaskCard
              v-for="task in filteredTasks"
              :key="task.id"
              :task="task"
              :can-modify="canModifyTask(task)"
              :current-time="currentTime"
              @open="openTaskDetails"
              @shift="openShiftQuickTask"
              @edit="openEditModal"
              @archive="archiveQuickTask"
              @delete="confirmDeleteTask"
            />
          </TransitionGroup>
        </div>

        <div v-else class="tasks-empty-state">
          <div class="empty-icon-box">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>لا توجد مهام سريعة!</h3>
          <p>لم يتم العثور على أي مهام تطابق الفلاتر المحددة حاليًا.</p>
          <button
            v-if="filters.status || filters.assignee || filters.search"
            class="clear-filter-btn"
            type="button"
            @click="clearFilters"
          >
            مسح الفلاتر
          </button>
        </div>
      </div>
    </div>

    <!-- نافذة إضافة مهمة سريعة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isManagerUser && showCreateModal"
          class="quick-tasks-modal-root fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md"
          @click.self="showCreateModal = false"
        >
          <div class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a]">
            <CreateQuickTask
              :users="usersList"
              @taskCreated="onTaskCreated"
              @cancel="showCreateModal = false"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- نافذة تفاصيل ومتابعة المهمة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showDetailsModal && selectedTask"
          class="quick-tasks-modal-root fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md"
          @click.self="closeDetailsModal"
        >
          <div class="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] bg-[#10163a] border border-[#8999e2]/20 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)]">
            <button
              type="button"
              class="absolute top-6 left-6 z-50 text-[#8390be] hover:text-[#f1f4ff] hover:bg-[#1c265c] rounded-full w-10 h-10 flex items-center justify-center transition-colors font-bold text-xl border border-transparent hover:border-[#8999e2]/30"
              @click="closeDetailsModal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <QuickTaskDetails
              :task="selectedTask"
              :current-user="currentUser"
              :users="usersList"
              @taskUpdated="onTaskUpdated"
              @editTask="openEditModal"
              @deleteTask="confirmDeleteTask"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- نافذة تعديل مهمة سريعة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showEditModal && taskToEdit"
          class="quick-tasks-modal-root fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md"
          @click.self="showEditModal = false"
        >
          <div class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a]">
            <EditQuickTask
              :task="taskToEdit"
              :users="usersList"
              @taskUpdated="onTaskEdited"
              @cancel="showEditModal = false"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- مودال تنبيهات الواتساب -->
    <WhatsAppNotificationModal
      v-model:is-open="showWaModal"
      :event="waModalEvent"
      :task="waModalTask"
      :users="usersList"
    />

    <!-- مودال تشفيت ساعات المهمة -->
    <QuickTaskShiftModal
      v-model="showShiftModal"
      :task="shiftTask"
      @shifted="fetchTasks"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/axios'
import alertService from '@/services/alertService'
import { useAuthStore } from '@/stores/authStore'
import CreateQuickTask from '@/components/CreateQuickTask.vue'
import EditQuickTask from '@/components/EditQuickTask.vue'
import QuickTaskDetails from '@/views/QuickTaskDetails.vue'
import WhatsAppNotificationModal from '@/components/WhatsAppNotificationModal.vue'
import QuickTaskStatsBar from '@/modules/quick-tasks/components/QuickTaskStatsBar.vue'
import QuickTaskCard from '@/modules/quick-tasks/components/QuickTaskCard.vue'
import QuickTaskShiftModal from '@/modules/quick-tasks/components/QuickTaskShiftModal.vue'
import { getWhatsAppPayload } from '@/utils/quickTaskWhatsApp'
import { useNotificationTemplates } from '@/composables/useNotificationTemplates'
import { useQuickArchive } from '@/modules/archive/composables/useQuickArchive'

const { fetchTemplates: fetchNotificationTemplates } = useNotificationTemplates()
const { archiveItem: quickArchive, openArchive } = useQuickArchive()
const authStore = useAuthStore()

const props = defineProps({
  users: { type: Array, default: () => [] },
  isAdminOrManager: { type: Boolean, default: true },
})

const emit = defineEmits(['openCreateModal', 'viewTimeline', 'taskCreated', 'taskUpdated', 'taskDeleted'])

const route = useRoute()
const tasks = ref([])
const isLoading = ref(true)
const internalUsers = ref([])
const currentUser = computed(() => authStore.user || {})

const isManagerUser = computed(() => {
  const roleStr = String(authStore.role || currentUser.value?.role || '').toLowerCase()
  return roleStr === 'manager' || roleStr === 'admin'
})

const canModifyTask = (task) => {
  if (!task || !isManagerUser.value) return false
  const currentUserId = Number(currentUser.value?.id)
  const taskAssigneeId = Number(task.assigned_to || task.assignee_id || task.assignee?.id)
  if (currentUserId && taskAssigneeId && currentUserId === taskAssigneeId) return false
  return true
}

const usersList = computed(() => (props.users?.length ? props.users : internalUsers.value))

const showCreateModal = ref(false)
const showDetailsModal = ref(false)
const showEditModal = ref(false)
const taskToEdit = ref(null)
const selectedTask = ref(null)

const showShiftModal = ref(false)
const shiftTask = ref(null)

const openShiftQuickTask = (task) => {
  if (task.status === 'completed') {
    alertService.warning('لا يمكن ترحيل مهمة مكتملة بالفعل.')
    return
  }
  const available = Number(task.available_shift_hours ?? task.estimated_hours ?? 1)
  if (available <= 0) {
    alertService.info('لا توجد ساعات متبقية متاحة للترحيل لهذه المهمة.')
    return
  }
  shiftTask.value = task
  showShiftModal.value = true
}

const archiveQuickTask = (task) => {
  quickArchive({
    moduleKey: 'quick_tasks',
    id: task.id,
    title: task.title || `مهمة سريعة #${task.id}`,
    defaultReason: 'أرشفة يدوية من المهام السريعة',
    onSuccess: (archivedId) => {
      tasks.value = tasks.value.filter((t) => t.id !== archivedId)
      if (selectedTask.value?.id === archivedId) {
        selectedTask.value = null
      }
    },
  })
}

const showWaModal = ref(false)
const waModalEvent = ref('created')
const waModalTask = ref(null)

const triggerWhatsApp = (event, task) => {
  if (!task) return
  const p = getWhatsAppPayload(event, task)
  if (p?.disabled) return
  waModalTask.value = task
  waModalEvent.value = event
  showWaModal.value = true
}

const openCreateModal = () => {
  if (!isManagerUser.value) return
  showCreateModal.value = true
  emit('openCreateModal')
}

const openEditModal = (task) => {
  taskToEdit.value = task
  showEditModal.value = true
}

const onTaskEdited = (updatedTask) => {
  showEditModal.value = false
  taskToEdit.value = null
  if (updatedTask) {
    const idx = tasks.value.findIndex((t) => t.id === updatedTask.id)
    if (idx !== -1) tasks.value[idx] = updatedTask
    if (selectedTask.value?.id === updatedTask.id) Object.assign(selectedTask.value, updatedTask)
  } else {
    fetchTasks()
  }
  emit('taskUpdated', updatedTask)
}

const confirmDeleteTask = async (task) => {
  if (!task) return
  const isConfirmed = await alertService.confirm({
    title: 'تأكيد حذف المهمة السريعة',
    message: `هل أنت متأكد من رغبتك في حذف مهمة "${task.title || 'توجيه سريع'}"؟ سيتم حذف جميع التسجيلات الصوتية والملاحظات نهائياً ولا يمكن التراجع.`,
    confirmText: 'نعم، احذف المهمة',
    cancelText: 'إلغاء',
    type: 'danger',
  })
  if (!isConfirmed) return

  try {
    const deletedId = task.id
    await api.delete(`/quick-tasks/${deletedId}`)
    tasks.value = tasks.value.filter((t) => t.id !== deletedId)
    if (selectedTask.value?.id === deletedId) closeDetailsModal()
    emit('taskDeleted', deletedId)
    alertService.success('تم حذف المهمة بنجاح 🗑️')
  } catch (error) {
    console.error('Error deleting task:', error)
    alertService.error(error.response?.data?.message || 'تعذر حذف المهمة.')
  }
}

const openTaskDetails = (task) => {
  selectedTask.value = task
  showDetailsModal.value = true
  emit('viewTimeline', task)
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedTask.value = null
}

const onTaskCreated = (newTask) => {
  showCreateModal.value = false
  if (newTask) {
    tasks.value.unshift(newTask)
    triggerWhatsApp('created', newTask)
  } else {
    fetchTasks()
  }
  emit('taskCreated', newTask)
}

const onTaskUpdated = (updatedTask) => {
  if (updatedTask && selectedTask.value) {
    Object.assign(selectedTask.value, updatedTask)
    const idx = tasks.value.findIndex((t) => t.id === updatedTask.id)
    if (idx !== -1) tasks.value[idx] = updatedTask
  } else {
    fetchTasks()
  }
  emit('taskUpdated', updatedTask)
}

const filters = ref({ search: '', status: '', assignee: '' })
const clearFilters = () => {
  filters.value = { search: '', status: '', assignee: '' }
}

const activeTasksCount = computed(
  () =>
    tasks.value.filter((t) => ['in_progress', 'pending', 'under_review'].includes(t.status)).length,
)
const completedTasksCount = computed(
  () => tasks.value.filter((t) => t.status === 'completed').length,
)

const currentTime = ref(Date.now())
let timerInterval = null

const checkUrlForTask = () => {
  const targetId = Number(route.query?.task_id)
  if (targetId && tasks.value.length > 0) {
    const task = tasks.value.find((t) => t.id === targetId)
    if (task) openTaskDetails(task)
  }
}

watch(() => route.query?.task_id, checkUrlForTask)

const fetchTasks = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/quick-tasks')
    const payload = response.data?.data
    if (Array.isArray(payload)) tasks.value = payload
    else if (payload && Array.isArray(payload.data)) tasks.value = payload.data
    else if (Array.isArray(response.data)) tasks.value = response.data
    else tasks.value = []
  } catch (error) {
    console.warn('Could not fetch quick tasks from backend:', error)
    tasks.value = []
  } finally {
    isLoading.value = false
    checkUrlForTask()
  }
}

const fetchUsers = async () => {
  try {
    const res = await api.get('/users/options')
    internalUsers.value = res.data?.data || res.data || []
  } catch (e) {
    console.error('Error fetching users:', e)
  }
}

const filteredTasks = computed(() =>
  tasks.value.filter((task) => {
    const matchStatus = filters.value.status ? task.status === filters.value.status : true
    const matchAssignee = filters.value.assignee ? task.assigned_to === filters.value.assignee : true
    const searchLower = filters.value.search ? filters.value.search.trim().toLowerCase() : ''
    const matchSearch = searchLower
      ? Boolean(
          task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.assignee_name?.toLowerCase().includes(searchLower),
        )
      : true
    return matchStatus && matchAssignee && matchSearch
  }),
)

onMounted(() => {
  fetchNotificationTemplates(true)
  fetchTasks()
  fetchUsers()
  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 60000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style src="@/modules/quick-tasks/styles/quick-tasks-board.css"></style>
