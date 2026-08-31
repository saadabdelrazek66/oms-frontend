<template>
  <section class="users-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة الإدارة / الفريق</span>
        <h2>إدارة المستخدمين</h2>
        <p>تحكم في أعضاء فريقك وصلاحيات الوصول من مكان واحد.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()"><span>＋</span> إضافة مستخدم جديد</button>
    </div>

    <div class="stats-grid">
      <article class="stat-card"><div class="stat-icon teal">♙</div><div><span>إجمالي المستخدمين</span><strong>{{ pagination.total }}</strong></div><small>عضو في المساحة</small></article>
      <article class="stat-card"><div class="stat-icon purple">♟</div><div><span>المديرون</span><strong>{{ managerCount }}</strong></div><small>صلاحيات كاملة</small></article>
      <article class="stat-card"><div class="stat-icon orange">⌁</div><div><span>موظفو الفريق</span><strong>{{ employeeCount }}</strong></div><small>حساب نشط</small></article>
    </div>

    <div class="users-card">
      <div class="card-heading"><div><h3>كل المستخدمين <span>{{ pagination.total }}</span></h3><p>قائمة أعضاء فريقك الحالية</p></div><div class="live-state"><i></i> محدث الآن</div></div>
      <div class="filters-section">
        <div class="search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg><input v-model="filters.search" type="search" placeholder="ابحث بالاسم أو البريد الإلكتروني..." @input="debounceFetch" /></div>
        <select v-model="filters.role" @change="fetchUsers(1)"><option value="">كل الأدوار</option><option value="manager">مدير</option><option value="employee">موظف</option></select>
        <select v-model="filters.work_type" @change="fetchUsers(1)"><option value="">كل أنظمة العمل</option><option value="remote">عن بعد</option><option value="onsite">من الشركة</option></select>
      </div>

      <div class="table-responsive">
        <table class="users-table">
          <thead><tr><th>المستخدم</th><th>رقم الهاتف</th><th>الدور</th><th>نظام العمل</th><th>الإجراءات</th></tr></thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="state-cell"><span class="spinner"></span> جارٍ تحميل البيانات...</td></tr>
            <tr v-else-if="users.length === 0"><td colspan="5" class="state-cell empty">لا توجد بيانات مطابقة للفلاتر الحالية</td></tr>
            <tr v-for="user in users" v-else :key="user.id">
              <td><div class="user-cell"><div class="table-avatar">{{ getInitials(user.name) }}</div><div><strong>{{ user.name }}</strong><span>{{ user.email }}</span></div></div></td>
              <td class="muted-cell">{{ user.phone || '—' }}</td>
              <td><span :class="['badge', user.role === 'manager' ? 'manager' : 'employee']"><i></i>{{ user.role === 'manager' ? 'مدير' : 'موظف' }}</span></td>
              <td><span :class="['badge', user.work_type === 'remote' ? 'remote' : 'onsite']">{{ user.work_type === 'remote' ? 'عن بعد' : 'من الشركة' }}</span></td>
              <td><div class="actions-cell"><button class="action edit" type="button" title="تعديل" @click="openModal(user)">✎</button><button class="action delete" type="button" title="حذف" @click="deleteUser(user.id)">⌫</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.last_page > 1" class="pagination"><button :disabled="pagination.current_page === 1" @click="fetchUsers(pagination.current_page - 1)">السابق</button><span>صفحة <b>{{ pagination.current_page }}</b> من {{ pagination.last_page }}</span><button :disabled="pagination.current_page === pagination.last_page" @click="fetchUsers(pagination.current_page + 1)">التالي</button></div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" aria-label="إغلاق" @click="closeModal">×</button>
        <div class="modal-icon">♙</div><span class="eyebrow">بيانات الفريق</span><h3 id="modal-title">{{ isEditing ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد' }}</h3><p>{{ isEditing ? 'حدّث البيانات التي تريد تعديلها.' : 'أضف عضوًا جديدًا إلى مساحتك الرقمية.' }}</p>
        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group full"><label for="name">الاسم بالكامل</label><input id="name" v-model="form.name" type="text" placeholder="مثال: أحمد محمد" required /></div>
          <div class="form-group full"><label for="email">البريد الإلكتروني</label><input id="email" v-model="form.email" type="email" placeholder="name@company.com" required /></div>
          <div class="form-group full"><label for="password">كلمة المرور</label><input id="password" v-model="form.password" type="password" :required="!isEditing" :placeholder="isEditing ? 'اتركه فارغًا للاحتفاظ بالحالية' : 'أدخل كلمة مرور قوية'" /></div>
          <div class="form-group full"><label for="phone">رقم الهاتف</label><input id="phone" v-model="form.phone" type="text" placeholder="05xxxxxxxx" required /></div>
          <div class="form-group"><label for="role">الصلاحية</label><select id="role" v-model="form.role" required><option value="manager">مدير</option><option value="employee">موظف</option></select></div>
          <div class="form-group"><label for="work-type">نظام العمل</label><select id="work-type" v-model="form.work_type" required><option value="remote">عن بعد</option><option value="onsite">من الشركة</option></select></div>
          <div class="modal-actions"><button type="button" class="secondary-btn" @click="closeModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ البيانات' }}</button></div>
        </form>
      </div>
    </div>
    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../axios';

const users = ref([]); const loading = ref(true); const saving = ref(false); const showModal = ref(false); const isEditing = ref(false); const editId = ref(null); const toastMessage = ref(''); let timeout = null;
const pagination = ref({ current_page: 1, last_page: 1, total: 0 });
const filters = reactive({ search: '', role: '', work_type: '' });
const form = reactive({ name: '', email: '', password: '', phone: '', role: 'employee', work_type: 'onsite' });
const managerCount = computed(() => users.value.filter(user => user.role === 'manager').length);
const employeeCount = computed(() => users.value.filter(user => user.role === 'employee').length);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 3000); };
const debounceFetch = () => { clearTimeout(timeout); timeout = setTimeout(() => fetchUsers(1), 450); };

const fetchUsers = async (page = 1) => {
  loading.value = true;
  try {
    const response = await api.get('/users', { params: { page, ...filters } });
    users.value = response.data.data || [];
    pagination.value = { current_page: response.data.current_page || page, last_page: response.data.last_page || 1, total: response.data.total || 0 };
  } catch (error) { console.error('Error fetching users:', error); showToast(error.response?.data?.message || 'تعذر تحميل المستخدمين'); }
  finally { loading.value = false; }
};

const resetForm = () => Object.assign(form, { name: '', email: '', password: '', phone: '', role: 'employee', work_type: 'onsite' });
const openModal = (user = null) => { isEditing.value = Boolean(user); editId.value = user?.id || null; user ? Object.assign(form, { name: user.name, email: user.email, password: '', phone: user.phone, role: user.role, work_type: user.work_type }) : resetForm(); showModal.value = true; };
const closeModal = () => { showModal.value = false; };
const saveUser = async () => { saving.value = true; try { if (isEditing.value) await api.put(`/users/${editId.value}`, form); else await api.post('/users', form); closeModal(); showToast(isEditing.value ? 'تم تحديث بيانات المستخدم' : 'تم إنشاء المستخدم بنجاح'); await fetchUsers(pagination.value.current_page); } catch (error) { showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ'); } finally { saving.value = false; } };
const deleteUser = async (id) => { if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائيًا؟')) return; try { await api.delete(`/users/${id}`); showToast('تم حذف المستخدم بنجاح'); await fetchUsers(pagination.value.current_page); } catch (error) { showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف'); } };
onMounted(() => fetchUsers());
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; } :global(body) { margin: 0; font-family: 'Cairo', sans-serif; }
.users-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; }.page-topline { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; margin-bottom: 28px; }.eyebrow { color: #76e8de; font-size: 10px; font-weight: 700; letter-spacing: .7px; }.page-topline h2 { margin: 7px 0 3px; font-size: 28px; }.page-topline p, .modal-content > p { margin: 0; color: #818cb9; font-size: 12px; }.primary-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 43px; padding: 0 17px; border: 0; border-radius: 11px; color: #12183f; background: linear-gradient(110deg, #7de8dc, #b28aff); font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 9px 22px rgba(111,222,211,.13); transition: .2s; }.primary-btn span { font-size: 20px; line-height: 0; }.primary-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }.primary-btn:disabled { opacity: .6; cursor: wait; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 18px; }.stat-card { display: flex; align-items: center; gap: 12px; min-height: 98px; padding: 17px; position: relative; overflow: hidden; border: 1px solid rgba(137,153,226,.13); border-radius: 16px; background: rgba(21,29,73,.65); }.stat-card::after { content: ''; position: absolute; width: 100px; height: 100px; left: -55px; bottom: -65px; border-radius: 50%; background: #72e6da; opacity: .08; filter: blur(10px); }.stat-card span, .stat-card small { display: block; color: #7f8ab8; font-size: 10px; }.stat-card strong { display: block; margin-top: 2px; color: #f3f4ff; font-size: 25px; }.stat-card small { margin-right: auto; align-self: flex-end; color: #6571a5; font-size: 9px; }.stat-icon { width: 39px; height: 39px; display: grid; place-items: center; border-radius: 12px; font-size: 21px; }.teal { color: #7de8dc; background: rgba(93,222,209,.12); }.purple { color: #c994ff; background: rgba(180,112,255,.12); }.orange { color: #ffc480; background: rgba(255,186,86,.12); }
.users-card { overflow: hidden; border: 1px solid rgba(137,153,226,.13); border-radius: 18px; background: rgba(15,22,61,.65); box-shadow: 0 18px 45px rgba(2,6,25,.12); }.card-heading { display: flex; align-items: center; justify-content: space-between; padding: 21px 23px 17px; }.card-heading h3 { margin: 0; font-size: 15px; }.card-heading h3 span { margin-right: 6px; padding: 2px 7px; border-radius: 7px; color: #7de8dc; background: rgba(89,220,207,.11); font-size: 9px; }.card-heading p { margin: 4px 0 0; color: #6e79a9; font-size: 10px; }.live-state { display: flex; align-items: center; gap: 6px; color: #7180ae; font-size: 9px; }.live-state i { width: 6px; height: 6px; border-radius: 50%; background: #6fe2d7; box-shadow: 0 0 8px #6fe2d7; }.filters-section { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; padding: 0 23px 19px; }.search-wrap { display: flex; align-items: center; min-height: 41px; padding: 0 12px; border: 1px solid rgba(138,152,222,.18); border-radius: 10px; background: rgba(7,13,42,.44); }.search-wrap svg { width: 16px; margin-left: 8px; fill: none; stroke: #6f7cad; stroke-width: 1.7; stroke-linecap: round; }.search-wrap input, .filters-section select { width: 100%; border: 0; outline: 0; color: #dfe3fa; background: transparent; font: inherit; font-size: 10px; }.filters-section select { min-height: 41px; padding: 0 11px; border: 1px solid rgba(138,152,222,.18); border-radius: 10px; background-color: rgba(7,13,42,.44); }.filters-section option, .user-form option { color: #e7e9ff; background: #161c4d; }
.table-responsive { overflow-x: auto; }.users-table { width: 100%; min-width: 650px; border-collapse: collapse; text-align: right; }.users-table th, .users-table td { padding: 14px 23px; border-top: 1px solid rgba(138,152,222,.09); }.users-table th { color: #6874a6; background: rgba(10,16,47,.35); font-size: 10px; font-weight: 600; }.users-table td { color: #d9ddf5; font-size: 11px; }.user-cell { display: flex; align-items: center; gap: 10px; }.table-avatar { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; color: #242057; background: linear-gradient(145deg, #80e8df, #ad84fa); font-size: 10px; font-weight: 800; }.user-cell strong, .user-cell span { display: block; }.user-cell strong { font-size: 11px; }.user-cell span, .muted-cell { color: #7782b0; font-size: 10px; direction: ltr; text-align: right; }.badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 7px; font-size: 9px; }.badge i { width: 5px; height: 5px; border-radius: 50%; }.badge.manager { color: #d09aff; background: rgba(186,121,255,.11); }.badge.manager i { background: #c288ff; }.badge.employee { color: #78e3d8; background: rgba(90,220,207,.1); }.badge.employee i { background: #71e3d7; }.badge.remote { color: #ffc783; background: rgba(255,185,89,.1); }.badge.onsite { color: #98a3d2; background: rgba(133,149,218,.1); }.actions-cell { display: flex; gap: 7px; }.action { width: 29px; height: 29px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: transparent; font-size: 15px; cursor: pointer; transition: .2s; }.action.edit { color: #78e4da; background: rgba(92,220,208,.08); }.action.delete { color: #ff94ab; background: rgba(255,103,139,.08); }.action:hover { transform: translateY(-1px); filter: brightness(1.3); }.state-cell { height: 150px; color: #7d89b6 !important; text-align: center !important; }.empty { color: #7d89b6 !important; }.spinner { display: inline-block; width: 16px; height: 16px; margin-left: 8px; vertical-align: middle; border: 2px solid rgba(125,232,220,.25); border-top-color: #7de8dc; border-radius: 50%; animation: spin .7s linear infinite; }.pagination { display: flex; align-items: center; justify-content: center; gap: 17px; padding: 18px; color: #7782af; font-size: 10px; }.pagination button { padding: 7px 13px; border: 1px solid rgba(138,152,222,.18); border-radius: 8px; color: #aeb7dc; background: rgba(9,15,45,.5); font: inherit; cursor: pointer; }.pagination button:disabled { opacity: .35; cursor: not-allowed; }.pagination b { color: #7de8dc; }
.modal-overlay { position: fixed; inset: 82px 0 0; z-index: 100; display: grid; place-items: start center; padding: 18px; overflow-y: auto; background: rgba(4,7,27,.78); backdrop-filter: blur(7px); }.modal-content { width: min(480px, 100%); max-height: calc(100vh - 118px); overflow-y: auto; position: relative; padding: 28px; border: 1px solid rgba(146,160,233,.2); border-radius: 20px; color: #e9ebff; background: linear-gradient(145deg, #171d52, #0d143a); box-shadow: 0 25px 70px rgba(0,0,0,.4); }.modal-close { position: absolute; top: 13px; left: 16px; border: 0; color: #8994c2; background: transparent; font-size: 25px; cursor: pointer; }.modal-icon { width: 42px; height: 42px; display: grid; place-items: center; margin-bottom: 13px; border-radius: 12px; color: #202057; background: linear-gradient(145deg, #80e8df, #b486fb); font-size: 22px; }.modal-content h3 { margin: 7px 0 2px; font-size: 21px; }.user-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 24px; }.form-group { min-width: 0; }.form-group.full { grid-column: 1 / -1; }.form-group label { display: block; margin-bottom: 6px; color: #b8c0e2; font-size: 10px; }.form-group input, .form-group select { width: 100%; min-height: 42px; padding: 0 11px; border: 1px solid rgba(145,160,230,.2); border-radius: 9px; outline: 0; color: #eef0ff; background: rgba(6,11,37,.46); font: inherit; font-size: 11px; }.form-group input:focus, .form-group select:focus { border-color: #76e8de; box-shadow: 0 0 0 3px rgba(118,232,222,.08); }.form-group input::placeholder { color: #626e9e; }.modal-actions { display: flex; justify-content: flex-start; gap: 9px; grid-column: 1 / -1; margin-top: 8px; }.secondary-btn { min-height: 43px; padding: 0 18px; border: 1px solid rgba(143,157,226,.2); border-radius: 10px; color: #aab4dc; background: transparent; font: inherit; font-size: 11px; cursor: pointer; }.toast-message { position: fixed; left: 25px; bottom: 25px; z-index: 200; padding: 12px 17px; border: 1px solid rgba(116,232,220,.22); border-radius: 10px; color: #bdf7f0; background: #182552; box-shadow: 0 12px 30px rgba(0,0,0,.25); font-size: 11px; }.toast-enter-active, .toast-leave-active { transition: .25s; }.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); } @keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 720px) { .modal-overlay { inset: 70px 0 0; padding: 12px; }.modal-content { max-height: calc(100vh - 82px); } .page-topline { align-items: flex-start; flex-direction: column; }.page-topline h2 { font-size: 24px; }.primary-btn { width: 100%; }.stats-grid { grid-template-columns: 1fr; }.stat-card { min-height: 78px; }.filters-section { grid-template-columns: 1fr; }.card-heading, .filters-section { padding-right: 15px; padding-left: 15px; }.users-table th, .users-table td { padding-right: 15px; padding-left: 15px; }.user-form { grid-template-columns: 1fr; }.form-group.full { grid-column: auto; }.modal-actions { grid-column: auto; }.modal-content { padding: 23px 18px; } }
</style>
