<template>
  <section class="users-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة الإدارة / الفريق</span>
        <h2>إدارة المستخدمين</h2>
        <p>تحكم في أعضاء فريقك وصلاحيات الوصول وتوزيع الأقسام من مكان واحد.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()">
        <span aria-hidden="true">＋</span>
        إضافة مستخدم جديد
      </button>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon teal" aria-hidden="true">♙</div>
        <div class="stat-content"><span>إجمالي المستخدمين</span><strong>{{ pagination.total }}</strong></div>
        <small>عضو في المساحة</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon purple" aria-hidden="true">♟</div>
        <div class="stat-content"><span>المديرون</span><strong>{{ managerCount }}</strong></div>
        <small>صلاحيات كاملة</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon orange" aria-hidden="true">⌁</div>
        <div class="stat-content"><span>موظفو الفريق</span><strong>{{ employeeCount }}</strong></div>
        <small>حساب نشط</small>
      </article>
    </div>

    <div class="users-card">
      <div class="card-heading">
        <div>
          <h3>كل المستخدمين <span>{{ pagination.total }}</span></h3>
          <p>قائمة أعضاء فريقك الحالية</p>
        </div>
        <div class="live-state" role="status"><i aria-hidden="true"></i> محدث الآن</div>
      </div>

      <div class="filters-section" role="search" aria-label="تصفية المستخدمين">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input v-model="filters.search" type="search" placeholder="ابحث بالاسم أو البريد الإلكتروني..." aria-label="البحث عن مستخدم" />
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
              <th scope="col">المستخدم</th>
              <th scope="col">الأقسام (الأساسي والفرعية)</th>
              <th scope="col">رقم الهاتف</th>
              <th scope="col">الدور</th>
              <th scope="col">نظام العمل</th>
              <th scope="col">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="state-cell"><span class="spinner" aria-hidden="true"></span> جارٍ تحميل البيانات...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="6" class="state-cell empty">لا توجد بيانات مطابقة للفلاتر الحالية</td>
            </tr>
            <tr v-for="user in users" v-else :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="table-avatar" aria-hidden="true">{{ getInitials(user.name) }}</div>
                  <div class="user-copy">
                    <strong>{{ user.name }}</strong>
                    <span><a :href="'mailto:' + user.email" class="email-link" title="إرسال بريد إلكتروني">{{ user.email }}</a></span>
                  </div>
                </div>
              </td>
              <td>
                <div class="dept-wrapper">
                  <span class="primary-dept">{{ getPrimaryDepartmentName(user) }}</span>
                  <div v-if="getAdditionalDepartments(user).length" class="sub-depts">
                    <span v-for="dept in getAdditionalDepartments(user)" :key="dept.id" class="badge sub-dept" :title="'قسم فرعي: ' + dept.name">{{ dept.name }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="user.phone" class="phone-wrapper">
                  <span dir="ltr">{{ user.phone }}</span>
                  <div class="contact-actions">
                    <a :href="getWaLink(user.phone)" target="_blank" rel="noopener noreferrer" title="مراسلة واتساب" aria-label="مراسلة المستخدم عبر واتساب" class="contact-btn wa">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </a>
                    <a :href="'tel:' + user.phone" title="اتصال هاتفي" aria-label="الاتصال بالمستخدم" class="contact-btn call">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </a>
                  </div>
                </div>
                <span v-else class="muted-cell">—</span>
              </td>
              <td><span :class="['badge', user.role === 'manager' ? 'manager' : 'employee']"><i aria-hidden="true"></i>{{ user.role === 'manager' ? 'مدير' : 'موظف' }}</span></td>
              <td><span :class="['badge', getWorkTypeInfo(user.work_type).class]">{{ getWorkTypeInfo(user.work_type).text }}</span></td>
              <td>
                <div class="actions-cell">
                  <button class="action edit" type="button" title="تعديل" aria-label="تعديل بيانات المستخدم" @click="openModal(user)"><span aria-hidden="true">✎</span></button>
                  <button class="action delete" type="button" title="حذف" aria-label="حذف المستخدم" @click="deleteUser(user.id)"><span aria-hidden="true">⌫</span></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.last_page > 1" class="pagination" aria-label="التنقل بين الصفحات">
        <button type="button" :disabled="pagination.current_page === 1" @click="fetchUsers(pagination.current_page - 1)">السابق</button>
        <span>صفحة <b>{{ pagination.current_page }}</b> من {{ pagination.last_page }}</span>
        <button type="button" :disabled="pagination.current_page === pagination.last_page" @click="fetchUsers(pagination.current_page + 1)">التالي</button>
      </div>
    </div>

    <!-- Modal إضافة وتعديل -->
    <div v-if="showModal" class="modal-overlay" role="presentation" @click.self="closeModal">
      <div ref="modalContent" class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" @keydown.esc="closeModal">
        <button ref="modalCloseButton" class="modal-close" type="button" aria-label="إغلاق النافذة" @click="closeModal"><span aria-hidden="true">×</span></button>
        <div class="modal-icon" aria-hidden="true">♙</div>
        <span class="eyebrow">بيانات الفريق</span>
        <h3 id="modal-title">{{ isEditing ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد' }}</h3>
        <p>{{ isEditing ? 'حدّث البيانات التي تريد تعديلها.' : 'أضف عضوًا جديدًا إلى مساحتك الرقمية.' }}</p>

        <form class="user-form" @submit.prevent="saveUser">
          <div class="form-group full"><label for="user-name">الاسم بالكامل</label><input id="user-name" v-model="form.name" type="text" placeholder="مثال: أحمد محمد" required /></div>
          <div class="form-group full"><label for="user-email">البريد الإلكتروني</label><input id="user-email" v-model="form.email" type="email" placeholder="name@company.com" required /></div>
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
              <label v-for="dept in departmentsList" :key="dept.id" class="custom-cb" :class="{ disabled: dept.id === form.primary_department_id }">
                <input type="checkbox" :value="dept.id" v-model="form.additional_department_ids" :disabled="dept.id === form.primary_department_id" />
                <span class="cb-text">{{ dept.name }}</span>
              </label>
            </div>
            <p v-if="departmentsList.length === 0" class="muted-cell no-departments">لا توجد أقسام مسجلة حالياً.</p>
          </div>
          <div class="form-group full"><label for="user-password">كلمة المرور</label><input id="user-password" v-model="form.password" type="password" :required="!isEditing" :placeholder="isEditing ? 'اتركه فارغًا للاحتفاظ بالحالية' : 'أدخل كلمة مرور قوية'" /></div>
          <div class="form-group full"><label for="user-phone">رقم الهاتف</label><input id="user-phone" v-model="form.phone" type="text" placeholder="01xxxxxxxx" required /></div>
          <div class="form-group"><label for="user-role">الصلاحية</label><select id="user-role" v-model="form.role" required><option value="manager">مدير</option><option value="employee">موظف</option></select></div>
          <div class="form-group"><label for="user-work-type">نظام العمل</label><select id="user-work-type" v-model="form.work_type" required><option value="remote">عن بعد</option><option value="onsite">من الشركة</option><option value="per_task">بالتاسك</option><option value="commission">بالعمولة</option></select></div>
          <div class="modal-actions"><button type="button" class="secondary-btn" @click="closeModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ البيانات' }}</button></div>
        </form>
      </div>
    </div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message" role="status" aria-live="polite">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import api from '../axios'

const users = ref([])
const departmentsList = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const toastMessage = ref('')
const modalCloseButton = ref(null)
let filterTimer = null
let toastTimer = null

const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const filters = reactive({ search: '', role: '', work_type: '' })
const form = reactive({ name: '', email: '', password: '', phone: '', role: 'employee', work_type: 'onsite', primary_department_id: '', additional_department_ids: [] })

watch(filters, () => {
  window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => fetchUsers(1), 450)
}, { deep: true })

const managerCount = computed(() => users.value.filter(user => user.role === 'manager').length)
const employeeCount = computed(() => users.value.filter(user => user.role === 'employee').length)

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase()

const showToast = (message) => {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 3000)
}

const getPrimaryDepartmentName = (user) => {
  if (!user.departments || user.departments.length === 0) return '—'
  const primary = user.departments.find(dept => dept.pivot?.is_primary)
  return primary ? primary.name : '—'
}

const getAdditionalDepartments = (user) => {
  if (!user.departments || user.departments.length === 0) return []
  return user.departments.filter(dept => !dept.pivot?.is_primary)
}

const handlePrimaryDeptChange = () => {
  if (form.primary_department_id) {
    form.additional_department_ids = form.additional_department_ids.filter(id => id !== form.primary_department_id)
  }
}

const getWaLink = (phone) => {
  if (!phone) return '#'
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('01') && cleaned.length === 11) cleaned = '2' + cleaned
  return `https://wa.me/${cleaned}`
}

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
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    showToast(error.response?.data?.message || 'تعذر تحميل المستخدمين')
  } finally {
    loading.value = false
  }
}

const getWorkTypeInfo = (type) => {
  switch (type) {
    case 'remote': return { text: 'عن بعد', class: 'remote' }
    case 'onsite': return { text: 'من الشركة', class: 'onsite' }
    case 'per_task': return { text: 'بالتاسك', class: 'per-task' }
    case 'commission': return { text: 'بالعمولة', class: 'commission' }
    default: return { text: 'غير محدد', class: 'default' }
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

const resetForm = () => Object.assign(form, { name: '', email: '', password: '', phone: '', role: 'employee', work_type: 'onsite', primary_department_id: '', additional_department_ids: [] })

const openModal = (user = null) => {
  isEditing.value = Boolean(user)
  editId.value = user?.id || null

  if (user) {
    const primaryDeptId = user.departments?.find(dept => dept.pivot?.is_primary)?.id || ''
    const additionalDeptIds = user.departments?.filter(dept => !dept.pivot?.is_primary).map(dept => dept.id) || []
    Object.assign(form, {
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone,
      role: user.role,
      work_type: user.work_type,
      primary_department_id: primaryDeptId,
      additional_department_ids: additionalDeptIds,
    })
  } else {
    resetForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const saveUser = async () => {
  saving.value = true
  try {
    if (isEditing.value) await api.put(`/users/${editId.value}`, form)
    else await api.post('/users', form)
    const successMessage = isEditing.value ? 'تم تحديث بيانات المستخدم' : 'تم إنشاء المستخدم بنجاح'
    closeModal()
    showToast(successMessage)
    await fetchUsers(pagination.value.current_page)
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (id) => {
  if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائيًا؟')) return
  try {
    await api.delete(`/users/${id}`)
    showToast('تم حذف المستخدم بنجاح')
    await fetchUsers(pagination.value.current_page)
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}

watch(showModal, async (open) => {
  document.body.classList.toggle('modal-is-open', open)
  if (open) {
    await nextTick()
    modalCloseButton.value?.focus({ preventScroll: true })
  }
})

onMounted(() => {
  fetchUsers()
  fetchDepartmentsList()
})

onBeforeUnmount(() => {
  window.clearTimeout(filterTimer)
  window.clearTimeout(toastTimer)
  document.body.classList.remove('modal-is-open')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; font-family: 'Cairo', sans-serif; }
:global(body.modal-is-open) { overflow: hidden; }

.users-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; }
.page-intro { min-width: 0; }
.page-topline { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.eyebrow { display: inline-block; color: #76e8de; font-size: 12px; line-height: 1.5; font-weight: 700; letter-spacing: .35px; }
.page-topline h2 { margin: 8px 0 5px; color: #f5f6ff; font-size: clamp(26px, 2.5vw, 32px); line-height: 1.25; font-weight: 800; }
.page-topline p, .modal-content > p { margin: 0; color: #9aa4cf; font-size: 14px; line-height: 1.7; }

.primary-btn, .secondary-btn { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 19px; border-radius: 11px; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform .2s ease, filter .2s ease, background-color .2s ease, border-color .2s ease; }
.primary-btn { flex: 0 0 auto; border: 0; color: #12183f; background: linear-gradient(110deg, #7de8dc, #b28aff); box-shadow: 0 9px 22px rgba(111,222,211,.13); }
.primary-btn span { font-size: 22px; line-height: 0; }
.primary-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.primary-btn:disabled { opacity: .6; cursor: wait; }

.stats-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; margin-bottom: 18px; }
.stat-card { min-width: 0; min-height: 108px; display: flex; align-items: center; gap: 13px; padding: 18px; position: relative; overflow: hidden; border: 1px solid rgba(137,153,226,.13); border-radius: 16px; background: rgba(21,29,73,.65); }
.stat-card::after { content: ''; position: absolute; width: 100px; height: 100px; left: -55px; bottom: -65px; border-radius: 50%; background: #72e6da; opacity: .08; filter: blur(10px); }
.stat-content { min-width: 0; }
.stat-card span, .stat-card small { display: block; color: #929dc8; font-size: 13px; line-height: 1.5; }
.stat-card strong { display: block; margin-top: 3px; color: #f3f4ff; font-size: 27px; line-height: 1.2; }
.stat-card small { margin-right: auto; align-self: flex-end; color: #7e8ab9; font-size: 11px; white-space: nowrap; }
.stat-icon { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; border-radius: 12px; font-size: 22px; }
.teal { color: #7de8dc; background: rgba(93,222,209,.12); }
.purple { color: #c994ff; background: rgba(180,112,255,.12); }
.orange { color: #ffc480; background: rgba(255,186,86,.12); }

.users-card { overflow: hidden; border: 1px solid rgba(137,153,226,.13); border-radius: 18px; background: rgba(15,22,61,.65); box-shadow: 0 18px 45px rgba(2,6,25,.12); }
.card-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 24px 18px; }
.card-heading h3 { margin: 0; color: #f0f2ff; font-size: 19px; line-height: 1.4; }
.card-heading h3 span { display: inline-block; margin-right: 7px; padding: 3px 8px; border-radius: 7px; color: #7de8dc; background: rgba(89,220,207,.11); font-size: 12px; vertical-align: middle; }
.card-heading p { margin: 5px 0 0; color: #8691bf; font-size: 13px; line-height: 1.6; }
.live-state { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; color: #8995c2; font-size: 12px; white-space: nowrap; }
.live-state i { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: #6fe2d7; box-shadow: 0 0 8px #6fe2d7; }

.filters-section { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; padding: 0 24px 20px; }
.search-wrap { display: flex; align-items: center; min-height: 48px; padding: 0 13px; border: 1px solid rgba(138,152,222,.18); border-radius: 10px; background: rgba(7,13,42,.44); }
.search-wrap svg { width: 18px; height: 18px; flex: 0 0 18px; margin-left: 9px; fill: none; stroke: #7f8bb8; stroke-width: 1.7; stroke-linecap: round; }
.search-wrap input, .filters-section select { width: 100%; min-width: 0; border: 0; outline: 0; color: #dfe3fa; background: transparent; font: inherit; font-size: 14px; line-height: 1.5; }
.filters-section select { min-height: 48px; padding: 0 12px; border: 1px solid rgba(138,152,222,.18); border-radius: 10px; background-color: rgba(7,13,42,.44); }
.filters-section option, .user-form option { color: #e7e9ff; background: #161c4d; }

.table-responsive { overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; }
.users-table { width: 100%; min-width: 980px; border-collapse: collapse; text-align: right; }
.users-table th, .users-table td { padding: 16px 22px; border-top: 1px solid rgba(138,152,222,.09); vertical-align: top; }
.users-table th { color: #8792be; background: rgba(10,16,47,.35); font-size: 13px; line-height: 1.5; font-weight: 700; white-space: nowrap; }
.users-table td { color: #d9ddf5; font-size: 14px; line-height: 1.6; }
.user-cell { display: flex; align-items: center; gap: 11px; min-width: 220px; }
.table-avatar { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: 10px; color: #242057; background: linear-gradient(145deg, #80e8df, #ad84fa); font-size: 13px; font-weight: 800; }
.user-copy { min-width: 0; }
.user-cell strong, .user-cell span { display: block; }
.user-cell strong { overflow: hidden; margin-bottom: 3px; color: #fff; font-size: 14px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.email-link { display: block; overflow: hidden; color: #76e8de; text-decoration: none; font-size: 13px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.email-link:hover { color: #b28aff; text-decoration: underline; }

.phone-wrapper { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; white-space: nowrap; }
.contact-actions { display: flex; gap: 7px; }
.contact-btn { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; transition: transform .2s ease, filter .2s ease; }
.contact-btn svg { width: 16px; height: 16px; }
.contact-btn.wa { color: #25d366; background: rgba(37,211,102,.15); }
.contact-btn.call { color: #3b82f6; background: rgba(59,130,246,.15); }
.contact-btn:hover { transform: translateY(-2px); filter: brightness(1.2); }

.dept-wrapper { display: flex; flex-direction: column; gap: 7px; min-width: 170px; }
.primary-dept { color: #d9ddf5; font-size: 14px; font-weight: 700; }
.sub-depts { display: flex; flex-wrap: wrap; gap: 5px; }
.sub-dept { background: rgba(145,160,230,.1) !important; color: #aeb7dc !important; border: 1px solid rgba(145,160,230,.15); font-weight: 400 !important; }
.muted-cell { color: #8995c1; font-size: 13px; direction: ltr; text-align: right; }
.badge { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 7px; font-size: 13px; font-weight: 600; white-space: nowrap; }
.badge i { width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%; }
.badge.manager { color: #d09aff; background: rgba(186,121,255,.11); }
.badge.manager i { background: #c288ff; }
.badge.employee { color: #78e3d8; background: rgba(90,220,207,.1); }
.badge.employee i { background: #71e3d7; }
.badge.remote { color: #ffc783; background: rgba(255,185,89,.1); }
.badge.onsite { color: #98a3d2; background: rgba(133,149,218,.1); }
.badge.per-task { color: #ffc480; background: rgba(255,196,128,.1); }
.badge.commission { color: #c994ff; background: rgba(180,112,255,.1); }
.badge.default { color: #9aa5d0; background: rgba(145,160,230,.1); }
.actions-cell { display: flex; gap: 8px; }
.action { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: transparent; font-size: 18px; cursor: pointer; transition: transform .2s ease, filter .2s ease; }
.action.edit { color: #78e4da; background: rgba(92,220,208,.08); }
.action.delete { color: #ff94ab; background: rgba(255,103,139,.08); }
.action:hover { transform: translateY(-1px); filter: brightness(1.3); }
.state-cell { height: 160px; color: #8e99c3 !important; text-align: center !important; font-size: 14px !important; }
.empty { color: #8e99c3 !important; }
.spinner { width: 18px; height: 18px; display: inline-block; margin-left: 8px; vertical-align: middle; border: 2px solid rgba(125,232,220,.25); border-top-color: #7de8dc; border-radius: 50%; animation: spin .7s linear infinite; }
.pagination { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 17px; padding: 20px; color: #8995c2; font-size: 13px; }
.pagination button { min-height: 42px; padding: 0 15px; border: 1px solid rgba(138,152,222,.18); border-radius: 8px; color: #b8c1e2; background: rgba(9,15,45,.5); font: inherit; cursor: pointer; }
.pagination button:disabled { opacity: .35; cursor: not-allowed; }
.pagination b { color: #7de8dc; }

.modal-overlay { position: fixed; inset: 82px 0 0; z-index: 100; display: grid; place-items: start center; padding: 20px; overflow-y: auto; background: rgba(4,7,27,.78); backdrop-filter: blur(7px); }
.modal-content { width: min(540px, 100%); max-height: calc(100vh - 122px); overflow-y: auto; position: relative; padding: 30px; border: 1px solid rgba(146,160,233,.2); border-radius: 20px; color: #e9ebff; background: linear-gradient(145deg, #171d52, #0d143a); box-shadow: 0 25px 70px rgba(0,0,0,.4); }
.modal-close { position: absolute; top: 10px; left: 12px; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 10px; color: #a3add1; background: transparent; font-size: 28px; line-height: 1; cursor: pointer; }
.modal-icon { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 14px; border-radius: 13px; color: #202057; background: linear-gradient(145deg, #80e8df, #b486fb); font-size: 24px; }
.modal-content h3 { margin: 8px 0 4px; color: #f3f4ff; font-size: 24px; line-height: 1.35; }
.user-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 25px; }
.form-group { min-width: 0; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { display: block; margin-bottom: 8px; color: #c7cde8; font-size: 14px; line-height: 1.5; font-weight: 600; }
.form-group label small { color: #8490bd; font-size: 12px; font-weight: 400; }
.form-group input, .form-group select { width: 100%; min-height: 48px; padding: 0 13px; border: 1px solid rgba(145,160,230,.2); border-radius: 10px; outline: 0; color: #eef0ff; background: rgba(6,11,37,.46); font: inherit; font-size: 14px; line-height: 1.6; }
.form-group input::placeholder { color: #7783ad; opacity: 1; }
.form-group input:focus, .form-group select:focus { border-color: #76e8de; box-shadow: 0 0 0 3px rgba(118,232,222,.1); }
.checkbox-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; margin-top: 5px; padding: 13px; border: 1px solid rgba(145,160,230,.15); border-radius: 10px; background: rgba(6,11,37,.25); }
.custom-cb { min-width: 0; display: flex; align-items: center; gap: 9px; min-height: 38px; cursor: pointer; }
.custom-cb.disabled { opacity: .4; cursor: not-allowed; }
.custom-cb input[type='checkbox'] { width: 18px; height: 18px; flex: 0 0 18px; margin: 0; accent-color: #76e8de; cursor: inherit; }
.custom-cb .cb-text { overflow: hidden; color: #d9ddf5; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.no-departments { margin: 8px 0 0; direction: rtl; }
.modal-actions { display: flex; justify-content: flex-start; gap: 10px; grid-column: 1 / -1; margin-top: 8px; }
.secondary-btn { border: 1px solid rgba(143,157,226,.24); color: #b8c1e2; background: transparent; }
.secondary-btn:hover { border-color: rgba(143,157,226,.45); background: rgba(122,140,224,.08); }

.toast-message { position: fixed; left: max(20px, env(safe-area-inset-left)); bottom: max(20px, env(safe-area-inset-bottom)); z-index: 200; max-width: min(420px, calc(100vw - 40px)); padding: 14px 18px; border: 1px solid rgba(116,232,220,.22); border-radius: 10px; color: #c8faf5; background: #182552; box-shadow: 0 12px 30px rgba(0,0,0,.25); font-size: 14px; line-height: 1.6; }

.modal-close:focus-visible, .primary-btn:focus-visible, .secondary-btn:focus-visible, .action:focus-visible, .contact-btn:focus-visible, .pagination button:focus-visible, .table-responsive:focus-visible, .form-group input:focus-visible, .form-group select:focus-visible, .custom-cb input:focus-visible { outline: 2px solid #79e6db; outline-offset: 2px; }
.toast-enter-active, .toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 980px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat-card:last-child { grid-column: 1 / -1; }
  .filters-section { grid-template-columns: 1.5fr 1fr 1fr; }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .page-topline h2 { font-size: clamp(25px, 8vw, 30px); }
  .page-topline p { font-size: 14px; }
  .primary-btn { width: 100%; }
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card:last-child { grid-column: auto; }
  .stat-card { min-height: 92px; }
  .card-heading { align-items: flex-start; flex-direction: column; padding: 20px 18px 17px; }
  .live-state { align-self: flex-start; }
  .filters-section { grid-template-columns: 1fr; padding: 0 15px 19px; }
  .users-table th, .users-table td { padding-right: 15px; padding-left: 15px; }
  .modal-overlay { inset: 70px 0 0; padding: 12px; }
  .modal-content { max-height: calc(100dvh - 82px); padding: 25px 18px 20px; border-radius: 16px; }
  .modal-content h3 { font-size: 22px; }
  .user-form { grid-template-columns: 1fr; }
  .form-group.full { grid-column: auto; }
  .checkbox-grid { grid-template-columns: 1fr; }
  .modal-actions { grid-column: auto; flex-direction: column-reverse; }
  .modal-actions .primary-btn, .modal-actions .secondary-btn { width: 100%; }
}

@media (max-width: 390px) {
  .stat-card { padding: 15px; }
  .stat-card span { font-size: 12px; }
  .stat-card small { font-size: 10px; }
  .users-table th, .users-table td { padding-right: 13px; padding-left: 13px; }
  .modal-content { padding-inline: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn, .secondary-btn, .action, .contact-btn, .toast-enter-active, .toast-leave-active { transition: none; }
  .spinner { animation-duration: 1.5s; }
}
</style>
