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

    <!-- شريط الإحصائيات السريع كفلاتر تفاعلية -->
    <div class="summary-strip">
      <div
        class="summary-stat-box"
        :class="{ active: currentFilter === 'all' }"
        @click="setFilter('all')"
        role="button"
        tabindex="0"
        title="عرض جميع المشاريع"
      >
        <span class="summary-icon teal">◈</span>
        <div><small>إجمالي المشاريع</small><strong>{{ projects.length }}</strong></div>
      </div>

      <div
        class="summary-stat-box"
        :class="{ active: currentFilter === 'جاري التنفيذ' }"
        @click="setFilter('جاري التنفيذ')"
        role="button"
        tabindex="0"
        title="تصفية مشاريع جاري التنفيذ"
      >
        <span class="summary-icon purple">⚡</span>
        <div><small>جاري التنفيذ</small><strong>{{ activeProjectsCount }}</strong></div>
      </div>

      <div
        class="summary-stat-box"
        :class="{ active: currentFilter === 'مكتمل' }"
        @click="setFilter('مكتمل')"
        role="button"
        tabindex="0"
        title="تصفية المشاريع المكتملة"
      >
        <span class="summary-icon green">✓</span>
        <div><small>مكتملة</small><strong>{{ completedProjectsCount }}</strong></div>
      </div>
    </div>

    <!-- شريط البحث والفلترة -->
    <div class="projects-toolbar" v-if="!loading && projects.length > 0">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ابحث باسم المشروع، الوصف، القسم، أو الموظف..."
          aria-label="البحث في المشاريع"
        />
        <button v-if="searchQuery" type="button" class="clear-search-btn" @click="searchQuery = ''" title="مسح البحث">×</button>
      </div>

      <div class="status-filter-tabs">
        <button
          type="button"
          :class="['filter-chip', { active: currentFilter === 'all' }]"
          @click="setFilter('all')"
        >
          الكل ({{ projects.length }})
        </button>
        <button
          type="button"
          :class="['filter-chip', 'chip-purple', { active: currentFilter === 'جاري التنفيذ' }]"
          @click="setFilter('جاري التنفيذ')"
        >
          جاري التنفيذ ({{ activeProjectsCount }})
        </button>
        <button
          type="button"
          :class="['filter-chip', 'chip-blue', { active: currentFilter === 'قيد التخطيط' }]"
          @click="setFilter('قيد التخطيط')"
        >
          قيد التخطيط ({{ planningProjectsCount }})
        </button>
        <button
          type="button"
          :class="['filter-chip', 'chip-green', { active: currentFilter === 'مكتمل' }]"
          @click="setFilter('مكتمل')"
        >
          مكتملة ({{ completedProjectsCount }})
        </button>
        <button
          v-if="pausedProjectsCount > 0"
          type="button"
          :class="['filter-chip', 'chip-red', { active: currentFilter === 'متوقف' }]"
          @click="setFilter('متوقف')"
        >
          متوقفة ({{ pausedProjectsCount }})
        </button>
      </div>
    </div>

    <!-- حالة التحميل والبيانات الفارغة -->
    <div v-if="loading" class="empty-state">
      <span class="spinner"></span>
      <p style="margin-top: 10px;">جارٍ تحميل المشاريع...</p>
    </div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <h3>لا توجد مشاريع مسجلة حالياً</h3>
      <p>ابدأ بإنشاء أول مشروع لتوزيع المهام وفرق العمل ومتابعة سير الإنجاز.</p>
      <button v-if="isManager" class="primary-btn mt-3" type="button" @click="openModal()">
        <span>＋</span> إنشاء مشروع جديد
      </button>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>لا توجد نتائج مطابقة للبحث أو الفلتر</h3>
      <p>جرّب البحث بكلمات أخرى أو إعادة ضبط الفلتر.</p>
      <button class="secondary-btn mt-3" type="button" @click="resetFilters">
        عرض جميع المشاريع
      </button>
    </div>

    <!-- شبكة المشاريع القابلة للنقر بالكامل -->
    <div v-else class="projects-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        :class="getStatusCardClass(project.status)"
        @click="goToProject(project.id)"
        role="button"
        tabindex="0"
        @keydown.enter="goToProject(project.id)"
        :aria-label="'فتح تفاصيل مشروع ' + project.name"
      >
        <!-- شريط التوهج العلوي حسب حالة المشروع -->
        <div class="card-accent-bar" :class="getStatusClass(project.status)"></div>

        <!-- رأس الكارت -->
        <div class="card-header">
          <div class="project-header-left">
            <div class="project-badge-icon" :class="getStatusClass(project.status)">
              <span>{{ getProjectIcon(project.status) }}</span>
            </div>
            <div class="title-and-status">
              <h3 class="project-name" :title="project.name">{{ project.name }}</h3>
              <div class="status-indicator-badge" :class="getStatusClass(project.status)">
                <span class="status-pulse-dot"></span>
                <span class="status-text">{{ project.status }}</span>
              </div>
            </div>
          </div>

          <!-- أدوات التعديل والحذف وسهم الفتح -->
          <div class="card-header-actions">
            <div v-if="isManager" class="card-actions" @click.stop>
              <button
                type="button"
                class="action edit"
                @click.stop="openModal(project)"
                title="تعديل المشروع"
                aria-label="تعديل"
              >
                ✎
              </button>
              <button
                type="button"
                class="action delete"
                @click.stop="deleteProject(project.id)"
                title="حذف المشروع"
                aria-label="حذف"
              >
                ⌫
              </button>
            </div>

            <div class="card-arrow-cue" aria-hidden="true" title="فتح المشروع">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <!-- وصف المشروع -->
        <p class="project-desc" :class="{ 'is-empty': !project.description }">
          {{ project.description || 'لا يوجد وصف تفصيلي مضاف لهذا المشروع حالياً.' }}
        </p>

        <!-- بيانات التواريخ والجدول الزمني -->
        <div class="project-meta-strip">
          <div class="meta-box">
            <span class="meta-label">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              تاريخ البداية
            </span>
            <span class="meta-val">{{ formatDate(project.start_date) || '—' }}</span>
          </div>

          <div class="meta-box-separator"></div>

          <div class="meta-box">
            <span class="meta-label">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              موعد التسليم
            </span>
            <span class="meta-val" :class="getDeadlineHighlightClass(project)">
              {{ formatDate(project.end_date) || 'غير محدد' }}
            </span>
          </div>
        </div>

        <!-- ذيل الكارت: الأقسام والفريق ومؤشر الفتح -->
        <div class="project-footer">
          <!-- وسوم الأقسام -->
          <div class="departments-tags">
            <template v-if="project.departments && project.departments.length > 0">
              <span
                v-for="dept in project.departments.slice(0, 2)"
                :key="dept.id"
                class="dept-pill"
                :title="dept.name"
              >
                #{{ dept.name }}
              </span>
              <span v-if="project.departments.length > 2" class="dept-pill more" :title="project.departments.slice(2).map(d => d.name).join(', ')">
                +{{ project.departments.length - 2 }}
              </span>
            </template>
            <span v-else class="dept-pill muted-pill">عام</span>
          </div>

          <!-- صور الفريق وتلميح الدخول -->
          <div class="footer-team-wrapper">
            <div
              v-if="project.users && project.users.length > 0"
              class="team-avatars"
              :title="'فريق العمل: ' + project.users.map(u => u.name).join(', ')"
            >
              <div
                v-for="(user, idx) in project.users.slice(0, 3)"
                :key="user.id"
                class="avatar"
                :style="{ zIndex: 5 - idx }"
              >
                {{ getInitials(user.name) }}
              </div>
              <div v-if="project.users.length > 3" class="avatar more">
                +{{ project.users.length - 3 }}
              </div>
            </div>
            <span v-else class="no-team-tag">بدون أعضاء</span>

            <span class="card-enter-prompt">
              <span>فتح اللوحة</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </span>
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
import { useRouter } from 'vue-router';
import api from '../axios';

const router = useRouter();

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

const searchQuery = ref('');
const currentFilter = ref('all');

const setFilter = (filter) => {
  currentFilter.value = currentFilter.value === filter && filter !== 'all' ? 'all' : filter;
};

const resetFilters = () => {
  searchQuery.value = '';
  currentFilter.value = 'all';
};

const goToProject = (projectId) => {
  router.push(`/projects/${projectId}`);
};

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
const planningProjectsCount = computed(() => projects.value.filter(p => p.status === 'قيد التخطيط').length);
const pausedProjectsCount = computed(() => projects.value.filter(p => p.status === 'متوقف').length);

const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    if (currentFilter.value !== 'all' && project.status !== currentFilter.value) {
      return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const matchName = project.name?.toLowerCase().includes(q);
      const matchDesc = project.description?.toLowerCase().includes(q);
      const matchDept = project.departments?.some(d => d.name?.toLowerCase().includes(q));
      const matchUser = project.users?.some(u => u.name?.toLowerCase().includes(q));
      return matchName || matchDesc || matchDept || matchUser;
    }
    return true;
  });
});

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

const getStatusCardClass = (status) => {
  switch (status) {
    case 'مكتمل': return 'theme-green';
    case 'جاري التنفيذ': return 'theme-purple';
    case 'متوقف': return 'theme-red';
    case 'قيد التخطيط': default: return 'theme-blue';
  }
};

const getProjectIcon = (status) => {
  switch (status) {
    case 'مكتمل': return '🏆';
    case 'جاري التنفيذ': return '⚡';
    case 'متوقف': return '⏸️';
    case 'قيد التخطيط': default: return '🎯';
  }
};

const getDeadlineHighlightClass = (project) => {
  if (project.status === 'مكتمل') return 'text-green';
  if (!project.end_date) return '';
  const due = new Date(project.end_date).getTime();
  const now = new Date().getTime();
  if (due < now) return 'text-red';
  if (due - now < 3 * 24 * 60 * 60 * 1000) return 'text-orange';
  return '';
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

/* Summary Strip as Interactive Filter */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  overflow: hidden;
  margin-bottom: 22px;
  border: 1px solid rgba(137, 153, 226, .16);
  border-radius: 16px;
  background: rgba(137, 153, 226, .14);
}

.summary-stat-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(21, 29, 73, .72);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
}

.summary-stat-box:hover {
  background: rgba(30, 42, 105, 0.9);
}

.summary-stat-box.active {
  background: rgba(28, 40, 102, 0.98);
  box-shadow: inset 0 -3px 0 #7de8dc;
}

.summary-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 19px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.teal { color: #7de8dc; background: rgba(93, 222, 209, .15); border: 1px solid rgba(125, 232, 220, 0.25); }
.purple { color: #c994ff; background: rgba(180, 112, 255, .15); border: 1px solid rgba(196, 145, 255, 0.25); }
.green { color: #25d366; background: rgba(37, 211, 102, .15); border: 1px solid rgba(37, 211, 102, 0.25); }
.orange { color: #ffc480; background: rgba(255, 186, 86, .15); border: 1px solid rgba(255, 186, 86, 0.25); }

.summary-stat-box small { display: block; color: #8a96c7; font-size: 11px; font-weight: 600; margin-bottom: 2px; }
.summary-stat-box strong { display: block; color: #eef0ff; font-size: 24px; line-height: 1.15; font-weight: 800; }

/* Toolbar: Search & Filter Tabs */
.projects-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(15, 22, 61, 0.65);
  border: 1px solid rgba(137, 153, 226, 0.18);
  border-radius: 12px;
  padding: 0 14px;
  flex: 1 1 320px;
  min-height: 44px;
  transition: 0.25s ease;
}

.search-input-wrapper:focus-within {
  border-color: #7de8dc;
  box-shadow: 0 0 16px rgba(125, 232, 220, 0.16);
  background: rgba(15, 22, 61, 0.9);
}

.search-icon {
  font-size: 14px;
  margin-left: 10px;
  color: #7c87b5;
  display: flex;
  align-items: center;
}

.search-input-wrapper input {
  background: transparent;
  border: none;
  color: #fff;
  width: 100%;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  direction: rtl;
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: #8da0d9;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.clear-search-btn:hover { color: #fff; }

.status-filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid rgba(137, 153, 226, 0.18);
  background: rgba(15, 22, 61, 0.5);
  color: #8da0d9;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-chip:hover {
  background: rgba(22, 32, 85, 0.85);
  color: #eef0ff;
  border-color: rgba(137, 153, 226, 0.35);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: linear-gradient(110deg, rgba(125, 232, 220, 0.22), rgba(178, 138, 255, 0.22));
  border-color: #7de8dc;
  color: #7de8dc;
  box-shadow: 0 0 14px rgba(125, 232, 220, 0.18);
}

.filter-chip.chip-purple.active {
  background: rgba(180, 112, 255, 0.22);
  border-color: #c491ff;
  color: #c491ff;
  box-shadow: 0 0 14px rgba(180, 112, 255, 0.18);
}

.filter-chip.chip-green.active {
  background: rgba(37, 211, 102, 0.2);
  border-color: #78e4d8;
  color: #78e4d8;
  box-shadow: 0 0 14px rgba(120, 228, 216, 0.18);
}

.filter-chip.chip-blue.active {
  background: rgba(101, 181, 255, 0.22);
  border-color: #8fc9ff;
  color: #8fc9ff;
  box-shadow: 0 0 14px rgba(101, 181, 255, 0.18);
}

.filter-chip.chip-red.active {
  background: rgba(255, 103, 139, 0.22);
  border-color: #ff9bad;
  color: #ff9bad;
  box-shadow: 0 0 14px rgba(255, 103, 139, 0.18);
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(15, 22, 61, 0.4);
  border: 1px dashed rgba(137, 153, 226, 0.2);
  border-radius: 20px;
  color: #8da0d9;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 18px;
  color: #eef0ff;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 13px;
  color: #7c87b5;
  margin: 0;
}

/* Projects Grid & Modern Cards */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

.project-card {
  position: relative;
  background: linear-gradient(165deg, rgba(20, 29, 78, 0.72) 0%, rgba(11, 16, 48, 0.88) 100%);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 20px;
  padding: 22px 22px 18px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.project-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.55), 0 0 25px -5px rgba(125, 232, 220, 0.15);
  border-color: rgba(125, 232, 220, 0.4);
}

.project-card:active {
  transform: translateY(-2px) scale(0.99);
}

.project-card:focus-visible {
  outline: 2px solid #7de8dc;
  outline-offset: 2px;
}

/* Top Accent Glow Bar */
.card-accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  transition: height 0.25s ease, box-shadow 0.25s ease;
}

.project-card:hover .card-accent-bar {
  height: 4.5px;
  box-shadow: 0 0 12px currentColor;
}

.card-accent-bar.status-green { background: linear-gradient(90deg, #25d366, #7de8dc); color: #7de8dc; }
.card-accent-bar.status-purple { background: linear-gradient(90deg, #b470ff, #c994ff, #7de8dc); color: #c994ff; }
.card-accent-bar.status-blue { background: linear-gradient(90deg, #65b5ff, #7de8dc); color: #65b5ff; }
.card-accent-bar.status-red { background: linear-gradient(90deg, #ff4757, #ff8fa4); color: #ff6b81; }

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.project-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.project-badge-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 19px;
  flex-shrink: 0;
  background: rgba(10, 16, 47, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.2);
  transition: transform 0.3s ease;
}

.project-card:hover .project-badge-icon {
  transform: scale(1.08) rotate(3deg);
}

.title-and-status {
  min-width: 0;
  flex: 1;
}

.project-name {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 800;
  color: #f1f4ff;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.project-card:hover .project-name {
  color: #7de8dc;
}

/* Status Pill with Dot Pulse */
.status-indicator-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.4;
}

.status-green { color: #78e4d8; background: rgba(90, 220, 207, .12); border: 1px solid rgba(120, 228, 216, 0.25); }
.status-blue { color: #8fc9ff; background: rgba(101, 181, 255, .12); border: 1px solid rgba(101, 181, 255, 0.25); }
.status-purple { color: #c491ff; background: rgba(180, 112, 255, .14); border: 1px solid rgba(180, 112, 255, 0.25); }
.status-red { color: #ff9bad; background: rgba(255, 103, 139, .12); border: 1px solid rgba(255, 103, 139, 0.25); }

.status-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: relative;
}

.status-green .status-pulse-dot { background: #25d366; box-shadow: 0 0 8px #25d366; }
.status-purple .status-pulse-dot { background: #b470ff; box-shadow: 0 0 8px #b470ff; }
.status-blue .status-pulse-dot { background: #65b5ff; box-shadow: 0 0 8px #65b5ff; }
.status-red .status-pulse-dot { background: #ff4757; box-shadow: 0 0 8px #ff4757; }

/* Actions & Arrow Cue */
.card-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 6px;
}

.action {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid rgba(137, 153, 226, 0.16);
  background: rgba(10, 16, 47, 0.6);
  font-size: 13px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
}

.action.edit { color: #78e4da; }
.action.edit:hover { background: rgba(92, 220, 208, 0.18); border-color: #78e4da; transform: scale(1.08); }
.action.delete { color: #ff94ab; }
.action.delete:hover { background: rgba(255, 103, 139, 0.18); border-color: #ff94ab; transform: scale(1.08); }

.card-arrow-cue {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid rgba(137, 153, 226, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: #7c87b5;
  display: grid;
  place-items: center;
  transition: all 0.25s ease;
}

.project-card:hover .card-arrow-cue {
  background: rgba(125, 232, 220, 0.16);
  border-color: rgba(125, 232, 220, 0.45);
  color: #7de8dc;
  transform: translate(-2px, -2px);
}

/* Project Description */
.project-desc {
  font-size: 12.5px;
  color: #9cb0dd;
  line-height: 1.6;
  margin: 0 0 16px 0;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px;
}

.project-desc.is-empty {
  color: #6975a7;
  font-style: italic;
}

/* Project Meta Dates Strip */
.project-meta-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(8, 13, 38, 0.45);
  border: 1px solid rgba(137, 153, 226, 0.1);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.meta-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #7885b5;
  font-size: 10.5px;
}

.meta-val {
  color: #e2e6fa;
  font-size: 12px;
  font-weight: 700;
}

.meta-box-separator {
  width: 1px;
  height: 26px;
  background: rgba(137, 153, 226, 0.15);
}

/* Project Footer */
.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(137, 153, 226, 0.12);
  padding-top: 14px;
  gap: 12px;
}

.departments-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.dept-pill {
  font-size: 10.5px;
  font-weight: 600;
  color: #8fc9ff;
  background: rgba(101, 181, 255, 0.08);
  border: 1px solid rgba(101, 181, 255, 0.22);
  padding: 3px 8px;
  border-radius: 6px;
  line-height: 1.3;
}

.dept-pill.more {
  background: rgba(137, 153, 226, 0.1);
  color: #adb9e6;
  border-color: rgba(137, 153, 226, 0.2);
}

.dept-pill.muted-pill {
  color: #7782b0;
  background: rgba(119, 130, 176, 0.08);
  border-color: rgba(119, 130, 176, 0.15);
}

.footer-team-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.team-avatars {
  display: flex;
  align-items: center;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(145deg, #78e4d8, #b486fb);
  display: grid;
  place-items: center;
  font-size: 9.5px;
  font-weight: 800;
  color: #12183f;
  border: 2px solid #0e153b;
  margin-left: -9px;
  transition: transform 0.2s ease;
}

.team-avatars:hover .avatar {
  transform: translateX(-3px);
}

.avatar.more {
  background: #252e5d;
  color: #cdd6f7;
  font-size: 9px;
}

.no-team-tag {
  color: #6975a7;
  font-size: 10.5px;
}

.card-enter-prompt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #7de8dc;
  font-size: 11.5px;
  font-weight: 700;
  opacity: 0.65;
  transition: all 0.25s ease;
}

.project-card:hover .card-enter-prompt {
  opacity: 1;
  transform: translateX(-4px);
  color: #92efe5;
}

.text-orange { color: #ffbd73 !important; }
.text-green { color: #78e4d8 !important; }
.text-red { color: #ff9bad !important; }

.modal-overlay { 
  position: fixed; 
  display: grid; 
  place-items: center; 
  padding: 20px; 
  background: rgba(4, 7, 27, .78); 
  backdrop-filter: blur(7px); 
  overflow-y: auto; 
  inset: 0 !important; 
  z-index: 9999 !important; 
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