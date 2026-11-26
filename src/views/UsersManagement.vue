<template>
  <section class="users-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة الإدارة / الفريق</span>
        <h2>إدارة المستخدمين</h2>
        <p>تحكم في أعضاء فريقك وصلاحيات الوصول وتوزيع الأقسام من مكان واحد.</p>
      </div>
      <button v-if="isManager() || can('users.create')" class="primary-btn" type="button" @click="openModal()">
        <span aria-hidden="true">＋</span>
        إضافة مستخدم جديد
      </button>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon teal" aria-hidden="true">♙</div>
        <div class="stat-content">
          <span>إجمالي المستخدمين</span><strong>{{ pagination.total }}</strong>
        </div>
        <small>عضو في المساحة</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon purple" aria-hidden="true">♟</div>
        <div class="stat-content">
          <span>المديرون</span><strong>{{ managerCount }}</strong>
        </div>
        <small>صلاحيات كاملة</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon orange" aria-hidden="true">⌁</div>
        <div class="stat-content">
          <span>موظفو الفريق</span><strong>{{ employeeCount }}</strong>
        </div>
        <small>حساب نشط</small>
      </article>
    </div>

    <div class="users-card">
      <div class="card-heading">
        <div>
          <h3>
            كل المستخدمين <span>{{ pagination.total }}</span>
          </h3>
          <p>قائمة أعضاء فريقك الحالية</p>
        </div>
        <div class="live-state" role="status"><i aria-hidden="true"></i> محدث الآن</div>
      </div>

      <div class="filters-section" role="search" aria-label="تصفية المستخدمين">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            v-model="filters.search"
            type="search"
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            aria-label="البحث عن مستخدم"
          />
        </div>
        <select v-model="filters.role" aria-label="تصفية حسب الدور">
          <option value="">كل الأدوار</option>
          <option value="manager">مدير</option>
          <option value="employee">موظف</option>
        </select>
        <select v-model="filters.work_type" aria-label="تصفية حسب نظام العمل">
          <option value="">كل أنظمة العمل</option>
          <option value="remote">عن بعد</option>
          <option value="onsite">من الشركة</option>
          <option value="per_task">بالتاسك</option>
          <option value="commission">بالعمولة</option>
        </select>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول المستخدمين قابل للتمرير أفقيًا">
        <table class="users-table" :aria-busy="loading">
          <thead>
            <tr>
              <th scope="col" style="width: 50px; text-align: center">#</th>
              <th scope="col">المستخدم</th>
              <th scope="col">الأقسام (الأساسي والفرعية)</th>
              <th scope="col">مواعيد وأيام العمل</th>
              <th scope="col">رقم الهاتف</th>
              <th scope="col">الدور</th>
              <th scope="col">نظام العمل</th>
              <th scope="col">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="state-cell">
                <span class="spinner" aria-hidden="true"></span> جارٍ تحميل البيانات...
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="8" class="state-cell empty">لا توجد بيانات مطابقة للفلاتر الحالية</td>
            </tr>
            <tr v-for="(user, index) in users" v-else :key="user.id">
              <td class="row-num-cell">
                {{ (pagination.current_page - 1) * (pagination.per_page || 10) + index + 1 }}
              </td>
              <td>
                <div
                  class="user-cell clickable-user-cell"
                  title="انقر لعرض الملف الوظيفي وبيانات الموظف"
                  @click="openViewModal(user)"
                >
                  <UserAvatar :name="user.name" :size="40" class="table-avatar" />
                  <div class="user-copy">
                    <strong>{{ user.name }}</strong>
                    <span v-if="user.job_title" class="user-job-title">{{ user.job_title }}</span>
                    <span>
                      <a
                        :href="'mailto:' + user.email"
                        class="email-link"
                        title="إرسال بريد إلكتروني"
                        @click.stop
                      >
                        {{ user.email }}
                      </a>
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div class="dept-wrapper">
                  <span class="primary-dept">{{ getPrimaryDepartmentName(user) }}</span>
                  <div v-if="getAdditionalDepartments(user).length" class="sub-depts">
                    <span
                      v-for="dept in getAdditionalDepartments(user)"
                      :key="dept.id"
                      class="badge sub-dept"
                      :title="'قسم فرعي: ' + dept.name"
                    >
                      {{ dept.name }}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div class="schedule-cell">
                  <span v-if="user.work_start_day && user.work_end_day" class="days-chip">
                    📅 {{ formatDaysRange(user.work_start_day, user.work_end_day) }}
                  </span>
                  <span class="hours-chip">⏱️ {{ user.daily_work_hours || 8 }} س/يوم</span>
                  <small v-if="user.work_start_time && user.work_end_time" class="time-range-text">
                    {{ formatTimeLabel(user.work_start_time) }} - {{ formatTimeLabel(user.work_end_time) }}
                  </small>
                </div>
              </td>
              <td>
                <div v-if="user.phone" class="phone-wrapper">
                  <span dir="ltr">{{ user.phone }}</span>
                  <div class="contact-actions">
                    <a
                      :href="buildWhatsAppUrl(user.phone) || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="مراسلة واتساب"
                      aria-label="مراسلة المستخدم عبر واتساب"
                      class="contact-btn wa"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </a>
                    <a
                      :href="'tel:' + user.phone"
                      title="اتصال هاتفي"
                      aria-label="الاتصال بالمستخدم"
                      class="contact-btn call"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </a>
                  </div>
                </div>
                <span v-else class="muted-cell">—</span>
              </td>
              <td>
                <span :class="['badge', user.role === 'manager' ? 'manager' : 'employee']">
                  <i aria-hidden="true"></i>{{ user.role === 'manager' ? 'مدير' : 'موظف' }}
                </span>
              </td>
              <td>
                <span :class="['badge', getWorkTypeInfo(user.work_type).class]">
                  {{ getWorkTypeInfo(user.work_type).text }}
                </span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="action view"
                    type="button"
                    title="عرض بيانات الموظف والراتب"
                    aria-label="عرض بيانات الموظف"
                    @click="openViewModal(user)"
                  >
                    <span aria-hidden="true">👁️</span>
                  </button>
                  <button
                    v-if="user.role !== 'manager'"
                    class="action permissions-btn"
                    type="button"
                    title="إدارة الصلاحيات"
                    aria-label="إدارة صلاحيات المستخدم"
                    @click="openPermissionsModal(user)"
                  >
                    <span aria-hidden="true">🔐</span>
                  </button>
                  <button
                    v-if="isManager() || can('users.edit')"
                    class="action edit"
                    type="button"
                    title="تعديل"
                    aria-label="تعديل بيانات المستخدم"
                    @click="openModal(user)"
                  >
                    <span aria-hidden="true">✎</span>
                  </button>
                  <button
                    v-if="isManager() || can('users.delete')"
                    class="action delete"
                    type="button"
                    title="حذف"
                    aria-label="حذف المستخدم"
                    @click="deleteUser(user.id)"
                  >
                    <span aria-hidden="true">🗑️</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        :total="pagination.total"
        item-label="مستخدم"
        :disabled="loading"
        @change="fetchUsers"
      />
    </div>

    <UserFormModal
      v-model="showModal"
      :editing-user="editingUser"
      :departments-list="departmentsList"
      @saved="handleUserSaved"
    />

    <UserProfileModal
      :user="selectedUserForView"
      @close="closeViewModal"
      @edit="editFromViewModal"
    />

    <UserPermissionsModal
      :show="showPermissionsModal"
      :user="selectedUserForPermissions"
      @close="showPermissionsModal = false"
      @updated="handlePermissionsUpdated"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import { can, isManager } from '@/utils/permissions'
import { buildWhatsAppUrl } from '@/utils/whatsapp'
import { useDebounce } from '@/composables/useDebounce'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import UserPermissionsModal from '@/components/UserPermissionsModal.vue'
import UserFormModal from '@/modules/users/components/UserFormModal.vue'
import UserProfileModal from '@/modules/users/components/UserProfileModal.vue'
import {
  formatDaysRange,
  formatTimeLabel,
  getAdditionalDepartments,
  getPrimaryDepartmentName,
  getWorkTypeInfo,
} from '@/modules/users/utils/userSchedules'

const users = ref([])
const departmentsList = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingUser = ref(null)
const selectedUserForView = ref(null)
const showPermissionsModal = ref(false)
const selectedUserForPermissions = ref(null)

const pagination = ref({ current_page: 1, last_page: 1, total: 0, per_page: 10 })
const filters = reactive({ search: '', role: '', work_type: '' })

const showToast = (message) => alertService.smartToast(message)

const managerCount = computed(() => users.value.filter((user) => user.role === 'manager').length)
const employeeCount = computed(() => users.value.filter((user) => user.role === 'employee').length)

const fetchUsers = async (page = 1) => {
  loading.value = true
  try {
    const activeParams = { page }
    if (filters.search) activeParams.search = filters.search
    if (filters.role) activeParams.role = filters.role
    if (filters.work_type) activeParams.work_type = filters.work_type

    const response = await api.get('/users', { params: activeParams })
    users.value = response.data.data || []
    const meta = response.data.meta || response.data
    pagination.value = {
      current_page: meta.current_page || page,
      last_page: meta.last_page || 1,
      total: meta.total || 0,
      per_page: meta.per_page || response.data.per_page || 10,
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    showToast(error.response?.data?.message || 'تعذر تحميل المستخدمين')
  } finally {
    loading.value = false
  }
}

const fetchDepartmentsList = async () => {
  try {
    const response = await api.get('/departments/list-all')
    departmentsList.value = response.data || []
  } catch (error) {
    console.error('Error fetching departments list:', error)
  }
}

const { debounced: debouncedFetchUsers } = useDebounce(() => fetchUsers(1), 450)
watch(filters, () => debouncedFetchUsers(), { deep: true })

const openModal = (user = null) => {
  editingUser.value = user
  showModal.value = true
}

const openViewModal = (user) => {
  selectedUserForView.value = user
}

const closeViewModal = () => {
  selectedUserForView.value = null
}

const editFromViewModal = (user) => {
  closeViewModal()
  openModal(user)
}

const openPermissionsModal = (user) => {
  selectedUserForPermissions.value = user
  showPermissionsModal.value = true
}

const handlePermissionsUpdated = () => {
  fetchUsers(pagination.value.current_page)
}

const handleUserSaved = async (wasEditing) => {
  showToast(wasEditing ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح')
  await fetchUsers(pagination.value.current_page)
}

const deleteUser = async (id) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف المستخدم',
    message:
      'هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائيًا؟ لن يتمكن من تسجيل الدخول إلى النظام بعد الآن.',
    type: 'danger',
    confirmText: 'نعم، احذف المستخدم',
    cancelText: 'إلغاء',
  })
  if (!confirmed) return

  try {
    await api.delete(`/users/${id}`)
    showToast('تم حذف المستخدم بنجاح')
    await fetchUsers(pagination.value.current_page)
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}

watch([showModal, selectedUserForView], ([mOpen, vOpen]) => {
  document.body.classList.toggle('modal-is-open', mOpen || Boolean(vOpen))
})

onMounted(() => {
  fetchUsers()
  fetchDepartmentsList()
})

onBeforeUnmount(() => {
  document.body.classList.remove('modal-is-open')
})
</script>

<style src="@/modules/users/styles/users-shared.css"></style>
