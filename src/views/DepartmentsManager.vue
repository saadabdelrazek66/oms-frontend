<template>
  <section class="deps-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة الإدارة / الهيكل التنظيمي</span>
        <h2>إدارة الأقسام</h2>
        <p>قم بتنظيم فرق العمل، إنشاء أقسام جديدة، ومتابعة توزيع الموظفين.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()">
        <span aria-hidden="true">＋</span>
        إضافة قسم جديد
      </button>
    </div>

    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-icon teal" aria-hidden="true">◈</span>
        <div>
          <small>إجمالي الأقسام</small>
          <strong>{{ departments.length }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon purple" aria-hidden="true">⌁</span>
        <div>
          <small>إجمالي الموظفين الموزعين</small>
          <strong>{{ totalAssignedUsers }}</strong>
        </div>
      </div>
      <div class="sync-status" role="status">
        <i aria-hidden="true"></i>
        بيانات محدثة لحظياً
      </div>
    </div>

    <div class="deps-card">
      <div class="card-heading">
        <div>
          <h3>الأقسام وفرق العمل <span>{{ departments.length }}</span></h3>
          <p>عرض تفصيلي للهيكل التنظيمي للشركة</p>
        </div>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول الأقسام قابل للتمرير أفقيًا">
        <table class="deps-table" :aria-busy="loading">
          <thead>
            <tr>
              <th scope="col">اسم القسم</th>
              <th scope="col">الوصف / المهام</th>
              <th scope="col" class="text-center">عدد الموظفين</th>
              <th scope="col">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="state-cell">
                <span class="spinner" aria-hidden="true"></span>
                جارٍ تحميل الأقسام...
              </td>
            </tr>
            <tr v-else-if="departments.length === 0">
              <td colspan="4" class="state-cell">لا توجد أقسام مسجلة حاليًا</td>
            </tr>
            <tr v-for="dept in departments" v-else :key="dept.id">
              <td>
                <div class="dept-cell">
                  <div class="dept-avatar" aria-hidden="true">{{ getInitials(dept.name) }}</div>
                  <strong>{{ dept.name }}</strong>
                </div>
              </td>
              <td>
                <p class="desc-text" :title="dept.description || 'لا يوجد وصف'">
                  {{ dept.description || 'لا يوجد وصف' }}
                </p>
              </td>
              <td class="text-center">
                <span class="count-badge">{{ dept.users_count || 0 }} موظف</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="action edit"
                    type="button"
                    aria-label="تعديل القسم"
                    title="تعديل"
                    @click="openModal(dept)"
                  >
                    <span aria-hidden="true">✎</span>
                  </button>
                  <button
                    class="action delete"
                    type="button"
                    aria-label="حذف القسم"
                    title="حذف"
                    @click="deleteDepartment(dept.id)"
                  >
                    <span aria-hidden="true">⌫</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal الإضافة والتعديل -->
    <div
      v-if="showModal"
      class="modal-overlay"
      role="presentation"
      @click.self="closeModal"
    >
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
        <div class="modal-icon" aria-hidden="true">◈</div>
        <span class="eyebrow">الهيكل التنظيمي</span>
        <h3 id="modal-title">{{ isEditing ? 'تعديل القسم' : 'إنشاء قسم جديد' }}</h3>
        <p>أدخل اسم القسم ووصفاً مختصراً لمهامه.</p>

        <form class="dept-form" @submit.prevent="saveDepartment">
          <div class="form-group">
            <label for="department-name">اسم القسم <span class="required">*</span></label>
            <input
              id="department-name"
              v-model="form.name"
              type="text"
              placeholder="مثال: قسم التسويق والمبيعات"
              required
            />
          </div>
          <div class="form-group">
            <label for="department-description">وصف القسم <small>(اختياري)</small></label>
            <textarea
              id="department-description"
              v-model="form.description"
              rows="4"
              placeholder="اكتب وصفاً لمهام ومسؤوليات هذا القسم..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="saving">
              {{ saving ? 'جارٍ الحفظ...' : 'حفظ القسم' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toastMessage" class="toast-message" role="status" aria-live="polite">
        {{ toastMessage }}
      </div>
    </transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import api from '../axios'

const departments = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const toastMessage = ref('')
const modalCloseButton = ref(null)
const modalContent = ref(null)
let toastTimer

const form = reactive({
  name: '',
  description: '',
})

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase()

const showToast = (message) => {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 3200)
}

// حساب إجمالي الموظفين في كل الأقسام
const totalAssignedUsers = computed(() => {
  return departments.value.reduce((total, dept) => total + (dept.users_count || 0), 0)
})

const fetchDepartments = async () => {
  loading.value = true
  try {
    const response = await api.get('/departments')
    departments.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching departments:', error)
    showToast(error.response?.data?.message || 'تعذر تحميل الأقسام')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, { name: '', description: '' })
}

const openModal = (dept = null) => {
  isEditing.value = Boolean(dept)
  editId.value = dept?.id || null

  if (dept) {
    Object.assign(form, {
      name: dept.name,
      description: dept.description || '',
    })
  } else {
    resetForm()
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveDepartment = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      await api.put(`/departments/${editId.value}`, form)
      showToast('تم تحديث القسم بنجاح')
    } else {
      await api.post('/departments', form)
      showToast('تم إنشاء القسم بنجاح')
    }
    closeModal()
    await fetchDepartments()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ')
  } finally {
    saving.value = false
  }
}

const deleteDepartment = async (id) => {
  if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم إزالته من ملفات الموظفين المرتبطين به.')) return

  try {
    await api.delete(`/departments/${id}`)
    showToast('تم حذف القسم بنجاح')
    await fetchDepartments()
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
  fetchDepartments()
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  document.body.classList.remove('modal-is-open')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: 'Cairo', sans-serif;
}

:global(body.modal-is-open) {
  overflow: hidden;
}

.deps-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}

.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 25px;
}

.page-intro {
  min-width: 0;
}

.eyebrow {
  display: inline-block;
  color: #76e8de;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: .35px;
}

.page-topline h2 {
  margin: 8px 0 5px;
  color: #f5f6ff;
  font-size: clamp(26px, 2.5vw, 32px);
  line-height: 1.25;
  font-weight: 800;
}

.page-topline p {
  max-width: 680px;
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
}

.primary-btn,
.secondary-btn {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 19px;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .2s ease, filter .2s ease, background-color .2s ease, border-color .2s ease;
}

.primary-btn {
  flex: 0 0 auto;
  border: 0;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  box-shadow: 0 9px 22px rgba(111, 222, 211, .13);
}

.primary-btn span {
  font-size: 22px;
  line-height: 0;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.primary-btn:disabled {
  opacity: .6;
  cursor: wait;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 15px;
  background: rgba(137, 153, 226, .13);
}

.summary-strip > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(21, 29, 73, .68);
}

.summary-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 19px;
}

.teal {
  color: #7de8dc;
  background: rgba(93, 222, 209, .12);
}

.purple {
  color: #c994ff;
  background: rgba(180, 112, 255, .12);
}

.summary-strip small,
.summary-strip strong {
  display: block;
}

.summary-strip small {
  color: #929dc8;
  font-size: 12px;
  line-height: 1.5;
}

.summary-strip strong {
  margin-top: 2px;
  color: #eef0ff;
  font-size: 24px;
  line-height: 1.2;
}

.sync-status {
  justify-content: center;
  color: #8995c2;
  font-size: 12px;
  line-height: 1.5;
}

.sync-status i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #72e5d9;
  box-shadow: 0 0 8px #72e5d9;
}

.deps-card {
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 18px;
  background: rgba(15, 22, 61, .65);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 18px;
}

.card-heading h3 {
  margin: 0;
  color: #f0f2ff;
  font-size: 18px;
  line-height: 1.4;
}

.card-heading h3 span {
  display: inline-block;
  margin-right: 7px;
  padding: 3px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, .11);
  font-size: 12px;
  vertical-align: middle;
}

.card-heading p {
  margin: 5px 0 0;
  color: #8691bf;
  font-size: 12px;
  line-height: 1.6;
}

.table-responsive {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}

.deps-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  text-align: right;
}

.deps-table th,
.deps-table td {
  padding: 15px 20px;
  border-top: 1px solid rgba(138, 152, 222, .09);
  vertical-align: middle;
}

.deps-table th {
  color: #8792be;
  background: rgba(10, 16, 47, .35);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  white-space: nowrap;
}

.deps-table td {
  color: #d9ddf5;
  font-size: 14px;
  line-height: 1.6;
}

.text-center {
  text-align: center;
}

.dept-cell {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 190px;
}

.dept-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 13px;
  font-weight: 800;
}

.dept-cell strong {
  overflow: hidden;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desc-text {
  max-width: 360px;
  overflow: hidden;
  margin: 0;
  color: #929dc8;
  font-size: 13px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-badge {
  display: inline-block;
  padding: 6px 11px;
  border: 1px solid rgba(93, 222, 209, .2);
  border-radius: 8px;
  color: #7de8dc;
  background: rgba(93, 222, 209, .12);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.action {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  transition: filter .2s ease, transform .2s ease;
}

.action.edit {
  color: #78e4da;
  background: rgba(92, 220, 208, .08);
}

.action.delete {
  color: #ff94ab;
  background: rgba(255, 103, 139, .08);
}

.action:hover {
  filter: brightness(1.3);
  transform: translateY(-1px);
}

.state-cell {
  height: 160px;
  color: #8e99c3 !important;
  text-align: center !important;
  font-size: 14px !important;
}

.spinner {
  width: 18px;
  height: 18px;
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
  border: 2px solid rgba(125, 232, 220, .25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.modal-overlay {
  position: fixed;
  inset: 82px 0 0;
  z-index: 100;
  display: grid;
  place-items: start center;
  padding: 20px;
  overflow-y: auto;
  background: rgba(4, 7, 27, .78);
  backdrop-filter: blur(7px);
}

.modal-content {
  width: min(550px, 100%);
  max-height: calc(100vh - 122px);
  overflow-y: auto;
  position: relative;
  padding: 30px;
  border: 1px solid rgba(146, 160, 233, .2);
  border-radius: 20px;
  background: linear-gradient(145deg, #171d52, #0d143a);
  box-shadow: 0 25px 70px rgba(0, 0, 0, .4);
}

.modal-close {
  position: absolute;
  top: 10px;
  left: 12px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: #a3add1;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.modal-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 13px;
  color: #202057;
  background: linear-gradient(145deg, #80e8df, #b486fb);
  font-size: 24px;
}

.modal-content h3 {
  margin: 8px 0 4px;
  color: #f3f4ff;
  font-size: 24px;
  line-height: 1.35;
}

.modal-content > p {
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
}

.dept-form {
  margin-top: 25px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #c7cde8;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
}

.form-group label small {
  color: #8490bd;
  font-size: 12px;
  font-weight: 400;
}

.form-group input,
.form-group textarea {
  width: 100%;
  border: 1px solid rgba(145, 160, 230, .2);
  border-radius: 10px;
  outline: 0;
  color: #eef0ff;
  background: rgba(6, 11, 37, .46);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.form-group input {
  min-height: 48px;
  padding: 0 13px;
}

.form-group textarea {
  min-height: 118px;
  padding: 11px 13px;
  resize: vertical;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #6f7aa8;
  opacity: 1;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #76e8de;
  box-shadow: 0 0 0 3px rgba(118, 232, 222, .1);
}

.required {
  margin-right: 3px;
  color: #ff9bad;
}

.modal-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 24px;
}

.secondary-btn {
  border: 1px solid rgba(143, 157, 226, .24);
  color: #b8c1e2;
  background: transparent;
}

.secondary-btn:hover {
  border-color: rgba(143, 157, 226, .45);
  background: rgba(122, 140, 224, .08);
}

.modal-close:focus-visible,
.primary-btn:focus-visible,
.secondary-btn:focus-visible,
.action:focus-visible,
.table-responsive:focus-visible,
.form-group input:focus-visible,
.form-group textarea:focus-visible {
  outline: 2px solid #79e6db;
  outline-offset: 2px;
}

.toast-message {
  position: fixed;
  left: max(20px, env(safe-area-inset-left));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 200;
  max-width: min(420px, calc(100vw - 40px));
  padding: 14px 18px;
  border: 1px solid rgba(116, 232, 220, .22);
  border-radius: 10px;
  color: #c8faf5;
  background: #182552;
  box-shadow: 0 12px 30px rgba(0, 0, 0, .25);
  font-size: 14px;
  line-height: 1.6;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 980px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sync-status {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .page-topline {
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
  }

  .page-topline h2 {
    font-size: clamp(25px, 8vw, 30px);
  }

  .page-topline p {
    font-size: 14px;
  }

  .primary-btn {
    width: 100%;
  }

  .summary-strip {
    grid-template-columns: 1fr;
  }

  .sync-status {
    grid-column: auto;
    justify-content: flex-start;
  }

  .card-heading {
    padding: 20px 18px 16px;
  }

  .modal-overlay {
    inset: 70px 0 0;
    align-items: start;
    padding: 12px;
  }

  .modal-content {
    max-height: calc(100dvh - 82px);
    padding: 25px 18px 20px;
    border-radius: 16px;
  }

  .modal-content h3 {
    font-size: 22px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .primary-btn,
  .modal-actions .secondary-btn {
    width: 100%;
  }
}

@media (max-width: 390px) {
  .summary-strip > div {
    padding: 14px;
  }

  .summary-strip small {
    font-size: 11px;
  }

  .deps-table th,
  .deps-table td {
    padding-inline: 14px;
  }

  .modal-content {
    padding-inline: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn,
  .secondary-btn,
  .action,
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }

  .spinner {
    animation-duration: 1.5s;
  }
}
</style>
