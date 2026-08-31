<template>
  <section class="deps-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة الإدارة / الهيكل التنظيمي</span>
        <h2>إدارة الأقسام</h2>
        <p>قم بتنظيم فرق العمل، إنشاء أقسام جديدة، ومتابعة توزيع الموظفين.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()"><span>＋</span> إضافة قسم جديد</button>
    </div>

    <div class="summary-strip">
      <div><span class="summary-icon teal">◈</span><div><small>إجمالي الأقسام</small><strong>{{ departments.length }}</strong></div></div>
      <div><span class="summary-icon purple">⌁</span><div><small>إجمالي الموظفين الموزعين</small><strong>{{ totalAssignedUsers }}</strong></div></div>
      <div class="sync-status"><i></i> بيانات محدثة لحظياً</div>
    </div>

    <div class="deps-card">
      <div class="card-heading">
        <div><h3>الأقسام وفرق العمل <span>{{ departments.length }}</span></h3><p>عرض تفصيلي للهيكل التنظيمي للشركة</p></div>
      </div>

      <div class="table-responsive">
        <table class="deps-table">
          <thead>
            <tr>
              <th>اسم القسم</th>
              <th>الوصف / المهام</th>
              <th class="text-center">عدد الموظفين</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="state-cell"><span class="spinner"></span> جارٍ تحميل الأقسام...</td></tr>
            <tr v-else-if="departments.length === 0"><td colspan="4" class="state-cell">لا توجد أقسام مسجلة حاليًا</td></tr>
            <tr v-for="dept in departments" v-else :key="dept.id">
              <td>
                <div class="dept-cell">
                  <div class="dept-avatar">{{ getInitials(dept.name) }}</div>
                  <strong>{{ dept.name }}</strong>
                </div>
              </td>
              <td><p class="desc-text" :title="dept.description">{{ dept.description || 'لا يوجد وصف' }}</p></td>
              <td class="text-center"><span class="count-badge">{{ dept.users_count || 0 }} موظف</span></td>
              <td>
                <div class="actions-cell">
                  <button class="action edit" type="button" title="تعديل" @click="openModal(dept)">✎</button>
                  <button class="action delete" type="button" title="حذف" @click="deleteDepartment(dept.id)">⌫</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal الإضافة والتعديل -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" aria-label="إغلاق" @click="closeModal">×</button>
        <div class="modal-icon">◈</div><span class="eyebrow">الهيكل التنظيمي</span>
        <h3 id="modal-title">{{ isEditing ? 'تعديل القسم' : 'إنشاء قسم جديد' }}</h3>
        <p>أدخل اسم القسم ووصفاً مختصراً لمهامه.</p>
        
        <form class="dept-form" @submit.prevent="saveDepartment">
          <div class="form-group">
            <label>اسم القسم <span class="required">*</span></label>
            <input v-model="form.name" type="text" placeholder="مثال: قسم التسويق والمبيعات" required />
          </div>
          <div class="form-group">
            <label>وصف القسم <small>(اختياري)</small></label>
            <textarea v-model="form.description" rows="4" placeholder="اكتب وصفاً لمهام ومسؤوليات هذا القسم..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ القسم' }}</button>
          </div>
        </form>
      </div>
    </div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../axios';

const departments = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const toastMessage = ref('');

const form = reactive({
  name: '',
  description: ''
});

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 3200); };

// حساب إجمالي الموظفين في كل الأقسام
const totalAssignedUsers = computed(() => {
  return departments.value.reduce((total, dept) => total + (dept.users_count || 0), 0);
});

const fetchDepartments = async () => {
  loading.value = true;
  try {
    const response = await api.get('/departments');
    departments.value = response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    showToast(error.response?.data?.message || 'تعذر تحميل الأقسام');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, { name: '', description: '' });
};

const openModal = (dept = null) => {
  isEditing.value = Boolean(dept);
  editId.value = dept?.id || null;
  if (dept) {
    Object.assign(form, {
      name: dept.name,
      description: dept.description || ''
    });
  } else {
    resetForm();
  }
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveDepartment = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/departments/${editId.value}`, form);
      showToast('تم تحديث القسم بنجاح');
    } else {
      await api.post('/departments', form);
      showToast('تم إنشاء القسم بنجاح');
    }
    closeModal();
    await fetchDepartments();
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
  } finally {
    saving.value = false;
  }
};

const deleteDepartment = async (id) => {
  if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم إزالته من ملفات الموظفين المرتبطين به.')) return;
  try {
    await api.delete(`/departments/${id}`);
    showToast('تم حذف القسم بنجاح');
    await fetchDepartments();
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف');
  }
};

onMounted(() => {
  fetchDepartments();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; font-family: 'Cairo', sans-serif; }
.deps-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; }
.page-topline { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 25px; }
.eyebrow { color: #76e8de; font-size: 10px; font-weight: 700; letter-spacing: .7px; }
.page-topline h2 { margin: 7px 0 3px; font-size: 28px; }
.page-topline p { margin: 0; color: #818cb9; font-size: 12px; }
.primary-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 43px; padding: 0 17px; border: 0; border-radius: 11px; color: #12183f; background: linear-gradient(110deg, #7de8dc, #b28aff); font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 9px 22px rgba(111, 222, 211, .13); transition: .2s; }
.primary-btn span { font-size: 20px; line-height: 0; }
.primary-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.primary-btn:disabled { opacity: .6; cursor: wait; }

.summary-strip { display: grid; grid-template-columns: 1fr 1fr 1.7fr; gap: 1px; overflow: hidden; margin-bottom: 18px; border: 1px solid rgba(137, 153, 226, .13); border-radius: 15px; background: rgba(137, 153, 226, .13); }
.summary-strip > div { display: flex; align-items: center; gap: 10px; padding: 13px 17px; background: rgba(21, 29, 73, .68); }
.summary-icon { width: 31px; height: 31px; display: grid; place-items: center; border-radius: 9px; font-size: 16px; }
.teal { color: #7de8dc; background: rgba(93, 222, 209, .12); }
.purple { color: #c994ff; background: rgba(180, 112, 255, .12); }
.summary-strip small, .summary-strip strong { display: block; }
.summary-strip small { color: #7c87b5; font-size: 9px; }
.summary-strip strong { color: #eef0ff; font-size: 20px; }
.sync-status { justify-content: center; color: #7480ae; font-size: 9px; }
.sync-status i { width: 6px; height: 6px; border-radius: 50%; background: #72e5d9; box-shadow: 0 0 8px #72e5d9; }

.deps-card { overflow: hidden; border: 1px solid rgba(137, 153, 226, .13); border-radius: 18px; background: rgba(15, 22, 61, .65); }
.card-heading { display: flex; align-items: center; justify-content: space-between; padding: 20px 23px 17px; }
.card-heading h3 { margin: 0; font-size: 15px; }
.card-heading h3 span { margin-right: 6px; padding: 2px 7px; border-radius: 7px; color: #7de8dc; background: rgba(89, 220, 207, .11); font-size: 9px; }
.card-heading p { margin: 4px 0 0; color: #6e79a9; font-size: 10px; }

.table-responsive { overflow-x: auto; }
.deps-table { width: 100%; min-width: 700px; border-collapse: collapse; text-align: right; }
.deps-table th, .deps-table td { padding: 13px 18px; border-top: 1px solid rgba(138, 152, 222, .09); vertical-align: middle; }
.deps-table th { color: #6874a6; background: rgba(10, 16, 47, .35); font-size: 10px; font-weight: 600; }
.deps-table td { color: #d9ddf5; font-size: 11px; }
.text-center { text-align: center; }

.dept-cell { display: flex; align-items: center; gap: 12px; }
.dept-avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; color: #252058; background: linear-gradient(145deg, #80e8df, #ac84fa); font-size: 11px; font-weight: 800; }
.dept-cell strong { font-size: 12px; color: #fff; }
.desc-text { margin: 0; color: #7782b0; font-size: 10px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.count-badge { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; color: #7de8dc; background: rgba(93, 222, 209, .12); border: 1px solid rgba(93, 222, 209, .2); }

.actions-cell { display: flex; gap: 6px; }
.action { width: 30px; height: 30px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; cursor: pointer; font-size: 14px; }
.action.edit { color: #78e4da; background: rgba(92, 220, 208, .08); }
.action.delete { color: #ff94ab; background: rgba(255, 103, 139, .08); }
.action:hover { filter: brightness(1.3); transform: translateY(-1px); }
.state-cell { height: 145px; color: #7d89b6 !important; text-align: center !important; }
.spinner { display: inline-block; width: 15px; height: 15px; margin-left: 7px; vertical-align: middle; border: 2px solid rgba(125, 232, 220, .25); border-top-color: #7de8dc; border-radius: 50%; animation: spin .7s linear infinite; }

.modal-overlay { position: fixed; inset: 82px 0 0; z-index: 100; display: grid; place-items: start center; padding: 18px; overflow-y: auto; background: rgba(4, 7, 27, .78); backdrop-filter: blur(7px); }
.modal-content { width: min(550px, 100%); max-height: calc(100vh - 118px); overflow-y: auto; position: relative; padding: 28px; border: 1px solid rgba(146, 160, 233, .2); border-radius: 20px; background: linear-gradient(145deg, #171d52, #0d143a); box-shadow: 0 25px 70px rgba(0, 0, 0, .4); }
.modal-close { position: absolute; top: 12px; left: 16px; border: 0; color: #8994c2; background: transparent; font-size: 25px; cursor: pointer; }
.modal-icon { width: 42px; height: 42px; display: grid; place-items: center; margin-bottom: 12px; border-radius: 12px; color: #202057; background: linear-gradient(145deg, #80e8df, #b486fb); font-size: 21px; }
.modal-content h3 { margin: 7px 0 2px; font-size: 21px; }
.modal-content > p { margin: 0; color: #818cb9; font-size: 11px; }
.dept-form { margin-top: 23px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; color: #b8c0e2; font-size: 10px; }
.form-group label small { color: #6975a7; font-size: 8px; }
.form-group input, .form-group textarea { width: 100%; padding: 0 11px; border: 1px solid rgba(145, 160, 230, .2); border-radius: 9px; outline: 0; color: #eef0ff; background: rgba(6, 11, 37, .46); font: inherit; font-size: 11px; }
.form-group input { min-height: 42px; }
.form-group textarea { padding-top: 10px; resize: vertical; }
.form-group input:focus, .form-group textarea:focus { border-color: #76e8de; box-shadow: 0 0 0 3px rgba(118, 232, 222, .08); }
.required { color: #ff9bad; margin-right: 3px; }
.modal-actions { display: flex; justify-content: flex-start; gap: 9px; margin-top: 20px; }
.secondary-btn { min-height: 43px; padding: 0 18px; border: 1px solid rgba(143, 157, 226, .2); border-radius: 10px; color: #aab4dc; background: transparent; font: inherit; font-size: 11px; cursor: pointer; }

.toast-message { position: fixed; left: 25px; bottom: 25px; z-index: 200; padding: 12px 17px; border: 1px solid rgba(116, 232, 220, .22); border-radius: 10px; color: #bdf7f0; background: #182552; box-shadow: 0 12px 30px rgba(0, 0, 0, .25); font-size: 11px; }
.toast-enter-active, .toast-leave-active { transition: .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .page-topline { align-items: flex-start; flex-direction: column; }
  .page-topline h2 { font-size: 24px; }
  .primary-btn { width: 100%; }
  .summary-strip { grid-template-columns: 1fr; }
  .modal-overlay { inset: 70px 0 0; padding: 12px; }
  .modal-content { max-height: calc(100vh - 82px); padding: 23px 18px; }
}
</style>