<template>
  <section class="projects-page" dir="rtl">
    <!-- الترويسة العلوية -->
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / إدارة المشاريع</span>
        <h2>{{ isManager ? 'جميع المشاريع' : 'مشاريعي الحالية' }}</h2>
        <p>نظرة عامة على المشاريع، حالتها، وفرق العمل المسندة إليها.</p>
      </div>
      <button v-if="isManager" class="primary-btn" type="button" @click="openModal()">
        <span>＋</span> مشروع جديد
      </button>
    </div>

    <!-- شريط الإحصائيات السريع -->
    <div class="summary-strip">
      <div><span class="summary-icon teal">◈</span><div><small>إجمالي المشاريع</small><strong>{{ projects.length }}</strong></div></div>
      <div><span class="summary-icon purple">◌</span><div><small>جاري التنفيذ</small><strong>{{ activeProjectsCount }}</strong></div></div>
      <div><span class="summary-icon orange">◷</span><div><small>مكتملة</small><strong>{{ completedProjectsCount }}</strong></div></div>
    </div>

    <!-- شبكة المشاريع (Cards) -->
    <div v-if="loading" class="text-center mt-3 muted"><span class="spinner"></span> جارٍ تحميل المشاريع...</div>
    <div v-else-if="projects.length === 0" class="text-center mt-3 muted">لا توجد مشاريع متاحة حالياً.</div>
    <div v-else class="projects-grid">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="card-header">
          <div class="project-title">
            <h3>{{ project.name }}</h3>
            <span :class="['status-badge', getStatusClass(project.status)]">{{ project.status }}</span>
          </div>
          <div v-if="isManager" class="card-actions">
            <button class="action edit" @click="openModal(project)" title="تعديل">✎</button>
            <button class="action delete" @click="deleteProject(project.id)" title="حذف">⌫</button>
          </div>
        </div>
        
        <p class="project-desc">{{ project.description || 'لا يوجد وصف مضاف لهذا المشروع.' }}</p>
        
        <div class="project-meta">
          <div class="meta-item">
            <small>البداية:</small> <span>{{ formatDate(project.start_date) }}</span>
          </div>
          <div class="meta-item">
            <small>النهاية المتوقعة:</small> <span>{{ formatDate(project.end_date) || 'غير محدد' }}</span>
          </div>
        </div>

        <div class="project-footer">
          <div class="departments-tags">
            <span v-for="dept in project.departments" :key="dept.id" class="tag">#{{ dept.name }}</span>
          </div>
          
          <!-- تم تجميع الفريق مع زر التفاصيل هنا -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="team-avatars" :title="'أعضاء الفريق: ' + project.users.map(u => u.name).join(', ')">
              <div v-for="(user, index) in project.users.slice(0, 3)" :key="user.id" class="avatar">
                {{ getInitials(user.name) }}
              </div>
              <div v-if="project.users.length > 3" class="avatar more">+{{ project.users.length - 3 }}</div>
            </div>
            
            <router-link :to="`/projects/${project.id}`" class="details-link-btn">فتح المشروع ↗</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- نافذة إضافة/تعديل المشروع (للمدير فقط) -->
     <Teleport to="body">
    <div v-if="showModal && isManager" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" type="button" @click="closeModal">×</button>
        <div class="modal-icon">🚀</div>
        <span class="eyebrow">مساحة المشاريع</span>
        <h3>{{ isEditing ? 'تعديل المشروع' : 'إنشاء مشروع جديد' }}</h3>
        
        <form class="plan-form mt-2" @submit.prevent="saveProject">
          <div class="form-group">
            <label>اسم المشروع <span class="text-red">*</span></label>
            <input v-model="form.name" type="text" required placeholder="مثال: إطلاق الهوية البصرية الجديدة" />
          </div>
          
          <div class="form-group">
            <label>وصف المشروع</label>
            <textarea v-model="form.description" rows="3" placeholder="تفاصيل وأهداف المشروع..."></textarea>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label>تاريخ البداية <span class="text-red">*</span></label>
              <input v-model="form.start_date" type="date" required />
            </div>
            <div class="form-group">
              <label>تاريخ النهاية المتوقع</label>
              <input v-model="form.end_date" type="date" />
            </div>
          </div>
          
          <div class="form-group">
            <label>حالة المشروع</label>
            <select v-model="form.status">
              <option value="قيد التخطيط">قيد التخطيط</option>
              <option value="جاري التنفيذ">جاري التنفيذ</option>
              <option value="متوقف">متوقف</option>
              <option value="مكتمل">مكتمل</option>
            </select>
          </div>

          <div class="separator"></div>
          <div class="section-title"><span>⌁</span> الصلاحيات وتوزيع الفريق</div>
          
          <div class="form-grid">
            <!-- 1. اختيار الأقسام (فلتر ذكي) -->
            <div class="form-group">
              <label>1. الأقسام المشاركة <span class="text-red">*</span></label>
              <div class="checkbox-list">
                <label v-for="dept in allDepartments" :key="dept.id" class="custom-cb">
                  <input type="checkbox" :value="dept.id" v-model="form.department_ids" />
                  <span class="cb-text">{{ dept.name }}</span>
                </label>
              </div>
            </div>
            
            <!-- 2. اختيار الموظفين (يظهرون بناءً على الأقسام المحددة) -->
            <div class="form-group">
              <label>2. أعضاء الفريق المصرح لهم <span class="text-red">*</span></label>
              <div v-if="form.department_ids.length === 0" class="muted text-center mt-3" style="font-size: 10px;">
                يرجى تحديد قسم واحد على الأقل لظهور الموظفين.
              </div>
              <div v-else class="checkbox-list">
                <label v-for="user in availableUsers" :key="user.id" class="custom-cb">
                  <input type="checkbox" :value="user.id" v-model="form.user_ids" />
                  <span class="cb-text">{{ user.name }} <small>({{ getDepartmentName(user) }})</small></span>
                </label>
                <div v-if="availableUsers.length === 0" class="muted text-center mt-2" style="font-size: 10px;">
                  لا يوجد موظفون مسجلون في الأقسام المحددة.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="saving">
              {{ saving ? 'جارٍ الحفظ...' : 'حفظ المشروع' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>

    <!-- رسائل التنبيه (Toast) -->
    <transition name="toast">
      <div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../axios'; // تأكد من مسار الأكسيوس الصحيح لديك

const userRole = ref(localStorage.getItem('role') || 'employee');
const isManager = computed(() => userRole.value === 'manager');

const projects = ref([]);
const allDepartments = ref([]);
const allUsers = ref([]);
const loading = ref(true);
const saving = ref(false);
const toastMessage = ref('');
let toastTimer;

const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);

const form = reactive({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'قيد التخطيط',
  department_ids: [],
  user_ids: []
});

// اللوجيك الذكي المحدث لتصفية الموظفين
const availableUsers = computed(() => {
  if (form.department_ids.length === 0) return [];
  
  // تحويل القيم المحددة إلى أرقام لضمان التطابق الدقيق
  const selectedDepts = form.department_ids.map(id => Number(id));
  
  return allUsers.value.filter(u => {
    // الاحتمال الأول: الموظف لديه department_id مباشر
    if (u.department_id) {
      return selectedDepts.includes(Number(u.department_id));
    }
    // الاحتمال الثاني: الموظف لديه كائن department
    if (u.department && u.department.id) {
      return selectedDepts.includes(Number(u.department.id));
    }
    // الاحتمال الثالث: الموظف مربوط بعدة أقسام (Many-to-Many)
    if (u.departments && Array.isArray(u.departments)) {
      return u.departments.some(d => selectedDepts.includes(Number(d.id)));
    }
    return false;
  });
});

const activeProjectsCount = computed(() => projects.value.filter(p => p.status === 'جاري التنفيذ').length);
const completedProjectsCount = computed(() => projects.value.filter(p => p.status === 'مكتمل').length);

const showToast = (msg) => {
  toastMessage.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastMessage.value = '', 3000);
};

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
// دالة محدثة لجلب اسم القسم بذكاء
const getDepartmentName = (user) => {
  if (user.departments && user.departments.length > 0) {
    return user.departments.map(d => d.name).join('، ');
  }
  if (user.department && user.department.name) {
    return user.department.name;
  }
  const deptId = user.department_id;
  if (!deptId) return 'بدون قسم';
  const dept = allDepartments.value.find(d => Number(d.id) === Number(deptId));
  return dept ? dept.name : 'بدون قسم';
};

const getStatusClass = (status) => {
  switch(status) {
    case 'مكتمل': return 'status-green';
    case 'جاري التنفيذ': return 'status-purple';
    case 'متوقف': return 'status-red';
    case 'قيد التخطيط': default: return 'status-blue';
  }
};

const fetchProjects = async () => {
  loading.value = true;
  try {
    const res = await api.get('/projects');
    projects.value = res.data.data;
  } catch (error) {
    showToast('خطأ في جلب المشاريع');
  } finally {
    loading.value = false;
  }
};

const fetchResources = async () => {
  if (isManager.value) {
    try {
      const [resDepts, resUsers] = await Promise.all([
        api.get('/departments?per_page=100'),
        api.get('/users?per_page=100')
      ]);
      allDepartments.value = resDepts.data.data || resDepts.data;
      allUsers.value = resUsers.data.data || resUsers.data;
    } catch (error) {
      console.error('Failed to load resources');
    }
  }
};

const resetForm = () => {
  Object.assign(form, { name: '', description: '', start_date: '', end_date: '', status: 'قيد التخطيط', department_ids: [], user_ids: [] });
};

const openModal = (project = null) => {
  if (project) {
    isEditing.value = true;
    editId.value = project.id;
    Object.assign(form, {
      name: project.name,
      description: project.description || '',
      start_date: project.start_date,
      end_date: project.end_date || '',
      status: project.status,
      department_ids: project.departments.map(d => d.id),
      user_ids: project.users.map(u => u.id)
    });
  } else {
    isEditing.value = false;
    editId.value = null;
    resetForm();
  }
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveProject = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/projects/${editId.value}`, form);
      showToast('تم تحديث المشروع بنجاح');
    } else {
      await api.post('/projects', form);
      showToast('تم إنشاء المشروع بنجاح');
    }
    closeModal();
    await fetchProjects();
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
  } finally {
    saving.value = false;
  }
};

const deleteProject = async (id) => {
  if (!confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
  try {
    await api.delete(`/projects/${id}`);
    showToast('تم حذف المشروع');
    await fetchProjects();
  } catch (error) {
    showToast('حدث خطأ أثناء الحذف');
  }
};

onMounted(() => {
  fetchProjects();
  fetchResources();
});
</script>

<style scoped>
/* استخدمنا نفس الهيكلة والألوان لمساحة العمل الخاصة بك لضمان التناسق */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.projects-page { min-height: 100%; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; }

/* Topline & Summary (Reused from previous components) */
.page-topline { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 25px; }
.eyebrow { color: #76e8de; font-size: 12px; font-weight: 700; }
.page-topline h2 { margin: 7px 0 3px; font-size: 28px; font-weight: 800; }
.page-topline p { margin: 0; color: #818cb9; font-size: 14px; }
.primary-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 43px; padding: 0 17px; border: 0; border-radius: 11px; color: #12183f; background: linear-gradient(110deg, #7de8dc, #b28aff); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: .2s; }
.primary-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.primary-btn:disabled { opacity: 0.6; cursor: wait; }

.summary-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; overflow: hidden; margin-bottom: 25px; border: 1px solid rgba(137, 153, 226, .13); border-radius: 15px; background: rgba(137, 153, 226, .13); }
.summary-strip > div { display: flex; align-items: center; gap: 10px; padding: 16px 18px; background: rgba(21, 29, 73, .68); }
.summary-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 9px; font-size: 18px; }
.teal { color: #7de8dc; background: rgba(93, 222, 209, .12); }
.purple { color: #c994ff; background: rgba(180, 112, 255, .12); }
.orange { color: #ffc480; background: rgba(255, 186, 86, .12); }
.summary-strip small { display: block; color: #7c87b5; font-size: 11px; }
.summary-strip strong { display: block; color: #eef0ff; font-size: 22px; line-height: 1.2; }

/* Projects Grid Cards */
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.project-card { background: rgba(15, 22, 61, .65); border: 1px solid rgba(137, 153, 226, .13); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; transition: 0.3s; }
.project-card:hover { border-color: rgba(125, 232, 220, 0.4); transform: translateY(-3px); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
.project-title h3 { margin: 0 0 8px 0; font-size: 18px; color: #eef0ff; }
.status-badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
.status-green { color: #78e4d8; background: rgba(90, 220, 207, .1); }
.status-blue { color: #8fc9ff; background: rgba(101, 181, 255, .1); }
.status-purple { color: #c491ff; background: rgba(180, 112, 255, .12); }
.status-red { color: #ff9bad; background: rgba(255, 103, 139, .1); }

.card-actions { display: flex; gap: 6px; }
.action { width: 30px; height: 30px; border-radius: 8px; border: none; font-size: 14px; cursor: pointer; display: grid; place-items: center; }
.action.edit { color: #78e4da; background: rgba(92, 220, 208, .08); }
.action.delete { color: #ff94ab; background: rgba(255, 103, 139, .08); }
.action:hover { filter: brightness(1.3); }

.project-desc { font-size: 13px; color: #aab5da; line-height: 1.6; margin-bottom: 20px; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.project-meta { display: flex; gap: 15px; margin-bottom: 20px; background: rgba(6, 11, 37, 0.3); padding: 10px; border-radius: 8px; }
.meta-item { display: flex; flex-direction: column; }
.meta-item small { color: #7c87b5; font-size: 10px; }
.meta-item span { color: #d9ddf5; font-size: 12px; font-weight: bold; }

.project-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(137, 153, 226, .13); padding-top: 15px; }
.departments-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.tag { font-size: 10px; color: #8fc9ff; background: rgba(101, 181, 255, .1); padding: 3px 6px; border-radius: 4px; }
.team-avatars { display: flex; }
.avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(145deg, #80e8df, #ac84fa); display: grid; place-items: center; font-size: 9px; font-weight: bold; color: #12183f; border: 2px solid #0f163d; margin-right: -8px; }
.avatar.more { background: #2a3363; color: #fff; }

.modal-overlay { 
  position: fixed; 
  inset: 0; 
  z-index: 9999; 
  display: grid; 
  place-items: center; 
  padding: 20px; 
  background: rgba(4, 7, 27, .78); 
  backdrop-filter: blur(7px); 
  overflow-y: auto; 
}

/* 2. ستايل زر فتح المشروع الجديد */
.details-link-btn {
  background: rgba(101, 181, 255, 0.1);
  color: #8fc9ff;
  border: 1px solid rgba(101, 181, 255, 0.2);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
  text-decoration: none;
  transition: 0.2s;
  display: inline-block;
}
.details-link-btn:hover {
  background: rgba(101, 181, 255, 0.2);
  transform: translateY(-2px);
}
.modal-content { width: min(700px, 100%); background: linear-gradient(145deg, #171d52, #0d143a); border: 1px solid rgba(146, 160, 233, .2); border-radius: 20px; padding: 30px; position: relative; box-shadow: 0 25px 70px rgba(0,0,0,.4); max-height: 90vh; overflow-y: auto; }
.modal-close { position: absolute; top: 15px; left: 20px; border: 0; background: transparent; color: #8994c2; font-size: 28px; cursor: pointer; }
.modal-icon { width: 45px; height: 45px; display: grid; place-items: center; background: linear-gradient(145deg, #80e8df, #b486fb); border-radius: 12px; color: #202057; font-size: 22px; margin-bottom: 15px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: #b8c0e2; font-size: 13px; margin-bottom: 8px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; background: rgba(6, 11, 37, .46); border: 1px solid rgba(145, 160, 230, .2); border-radius: 9px; color: #eef0ff; font-family: 'Cairo', sans-serif; font-size: 13px; outline: none; }
.form-group input:focus, .form-group textarea:focus { border-color: #76e8de; }
.text-red { color: #ff9bad; }
.separator { height: 1px; background: rgba(143, 157, 226, .14); margin: 20px 0; }
.section-title { font-size: 14px; color: #b986ff; margin-bottom: 15px; font-weight: bold; }
.checkbox-list { display: grid; gap: 10px; max-height: 200px; overflow-y: auto; background: rgba(6, 11, 37, .3); padding: 15px; border-radius: 9px; border: 1px solid rgba(145, 160, 230, .1); }
.custom-cb { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.custom-cb input { width: 16px; height: 16px; accent-color: #76e8de; }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.secondary-btn { padding: 10px 20px; background: transparent; border: 1px solid rgba(143, 157, 226, .2); color: #aab4dc; border-radius: 10px; cursor: pointer; font-family: 'Cairo'; }
.muted { color: #6975a7; }

/* Toast */
.toast-message { position: fixed; bottom: 25px; left: 25px; background: #182552; color: #bdf7f0; padding: 12px 20px; border-radius: 10px; border: 1px solid rgba(116, 232, 220, .22); z-index: 200; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
.spinner { display: inline-block; width: 15px; height: 15px; border: 2px solid rgba(125, 232, 220, .25); border-top-color: #7de8dc; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .summary-strip { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .page-topline { flex-direction: column; align-items: flex-start; }
}
</style>