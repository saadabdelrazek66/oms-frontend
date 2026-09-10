<template>
  <section class="project-details-page" dir="rtl">
    <div v-if="loading" class="loading-state">
      <span class="spinner"></span> جارٍ تحميل المشروع والمهام...
    </div>
    
    <div v-else-if="project" class="project-container">
      <!-- الترويسة ومعلومات المشروع العلوية -->
      <div class="page-topline">
        <div>
          <span class="eyebrow">
            <router-link to="/projects" class="back-link">المشاريع</router-link> / {{ project.name }}
          </span>
          <div style="display:flex; align-items:center; gap:15px;">
            <h2>{{ project.name }}</h2>
            <span :class="['status-badge', getProjectStatusClass(project.status)]">{{ project.status }}</span>
          </div>
          <p class="desc-text">{{ project.description || 'لا يوجد وصف للمشروع.' }}</p>
        </div>
        <div class="topline-actions">
          <div class="team-avatars" :title="'فريق العمل: ' + project.users.map(u => u.name).join(', ')">
            <div v-for="user in project.users.slice(0, 4)" :key="user.id" class="avatar">{{ getInitials(user.name) }}</div>
            <div v-if="project.users.length > 4" class="avatar more">+{{ project.users.length - 4 }}</div>
          </div>
          <button class="primary-btn" type="button" @click="openTaskModal()">
            <span>＋</span> إضافة مهمة
          </button>
        </div>
      </div>

      <!-- شريط البحث والفلاتر المتقدمة -->
      <div class="filters-search-bar glass-card">
        <!-- البحث بإضاءة المهام -->
        <div class="search-box">
          <span class="icon">🔍</span>
          <input type="text" v-model="searchQuery" placeholder="ابحث باسم المهمة لتظليلها فوراً..." />
        </div>
        
        <!-- الفلاتر السريعة وفلتر الأعضاء -->
        <div class="filters-actions">
          <span class="filter-label">تصفية:</span>
          <button :class="['filter-btn', { active: currentFilter === 'all' }]" @click="currentFilter = 'all'">الكل</button>
          <button :class="['filter-btn', { active: currentFilter === 'mine' }]" @click="currentFilter = 'mine'">مهامي 👤</button>
          <button :class="['filter-btn', { active: currentFilter === 'urgent' }]" @click="currentFilter = 'urgent'">عاجلة 🚨</button>
          <button :class="['filter-btn', { active: currentFilter === 'overdue' }]" @click="currentFilter = 'overdue'">متأخرة ⏰</button>
          
          <div class="divider"></div>
          
          <!-- قائمة تصفية الأعضاء -->
          <select v-model="selectedUserId" class="user-filter-select">
            <option value="">مهام كل الفريق</option>
            <option v-for="user in project.users" :key="user.id" :value="user.id">
              مهام: {{ user.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- لوحة الكانبان (Kanban Board) -->
      <div class="kanban-board">
        <div v-for="column in boardColumns" :key="column.id" class="kanban-column glass-card">
          <div class="column-header">
            <div class="col-title">
              <span class="col-icon">{{ column.icon }}</span>
              <h3>{{ column.title }}</h3>
              <span class="task-count">{{ column.tasks.length }}</span>
            </div>
          </div>

          <!-- مساحة السحب والإفلات للمهام -->
          <draggable
            v-model="column.tasks"
            :group="{ name: 'tasks' }"
            item-key="id"
            class="task-list"
            ghost-class="ghost-task"
            @change="(e) => onTaskMove(e, column.id)"
          >
            <template #item="{ element }">
              <div 
                class="task-card" 
                :class="{ 'highlight-task': isTaskHighlighted(element) }"
              >
                <div class="task-header">
                  <span :class="['priority-badge', element.priority]">{{ getPriorityLabel(element.priority) }}</span>
                  <div class="task-actions" v-if="canEditTask(element)">
                    <button @click="openTaskModal(element)" class="t-btn" title="تعديل">✎</button>
                    <button @click="deleteTask(element.id)" class="t-btn text-red" title="حذف">⌫</button>
                  </div>
                </div>
                
                <h4 class="task-title">{{ element.title }}</h4>
                <p v-if="element.description" class="task-desc">{{ truncate(element.description, 60) }}</p>
                
                <div class="task-footer">
                  <div class="due-date" :class="{'is-overdue': isOverdue(element.due_date, element.status)}">
                    🕒 {{ formatDate(element.due_date) || 'بدون موعد' }}
                  </div>
                  <div class="assignee-avatar" :title="'المسؤول: ' + (element.assignee?.name || 'غير محدد')">
                    {{ getInitials(element.assignee?.name || '?') }}
                  </div>
                </div>
              </div>
            </template>
          </draggable>
          <div v-if="column.tasks.length === 0" class="empty-column-msg">اسحب المهام هنا</div>
        </div>
      </div>
    </div>
    
    <div v-else class="error-state">المشروع غير موجود أو لا تملك صلاحية للوصول.</div>

    <!-- نافذة إضافة / تعديل المهمة -->
    <Teleport to="body">
      <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
        <div class="modal-content" style="width: min(500px, 100%) !important;">
          <button class="modal-close" type="button" @click="closeTaskModal">×</button>
          <div class="modal-icon">📋</div>
          <span class="eyebrow">إدارة المهام</span>
          <h3>{{ isEditingTask ? 'تعديل المهمة' : 'مهمة جديدة' }}</h3>
          
          <form class="plan-form mt-2" @submit.prevent="saveTask">
            <div class="form-group">
              <label>عنوان المهمة <span class="text-red">*</span></label>
              <input v-model="taskForm.title" type="text" required />
            </div>
            
            <div class="form-group">
              <label>الوصف والتفاصيل</label>
              <textarea v-model="taskForm.description" rows="3"></textarea>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label>الحالة</label>
                <select v-model="taskForm.status">
                  <option value="todo">قيد الانتظار</option>
                  <option value="in_progress">جاري العمل</option>
                  <option value="in_review">للمراجعة</option>
                  <option value="completed">مكتملة</option>
                </select>
              </div>
              <div class="form-group">
                <label>الأولوية</label>
                <select v-model="taskForm.priority">
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة 🚨</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>تاريخ الاستحقاق (Deadline)</label>
                <input v-model="taskForm.due_date" type="date" />
              </div>
              
              <div class="form-group" v-if="isManager">
                <label>إسناد إلى <span class="text-red">*</span></label>
                <select v-model="taskForm.assigned_to" required>
                  <option value="" disabled>اختر عضو الفريق...</option>
                  <option v-for="user in project.users" :key="user.id" :value="user.id">
                    {{ user.name }}
                  </option>
                </select>
              </div>
              <div class="form-group" v-else>
                <label>المسؤول</label>
                <div class="self-assigned-msg">
                  <span>👤</span> سيتم إسناد هذه المهمة إليك تلقائياً لتقوم بتنفيذها.
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeTaskModal">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="savingTask">
                {{ savingTask ? 'جارٍ الحفظ...' : 'حفظ المهمة' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <transition name="toast">
      <div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import draggable from 'vuedraggable';
import api from '../axios';

const route = useRoute();
const project = ref(null);
const loading = ref(true);
const toastMessage = ref('');
let toastTimer;

// بيانات المستخدم الحالي
const userRole = ref(localStorage.getItem('role') || 'employee');
const isManager = computed(() => userRole.value === 'manager');
const currentUserId = ref(parseInt(localStorage.getItem('user_id') || 0));

// الكانبان بورد (الأعمدة)
const boardColumns = reactive([
  { id: 'todo', title: 'قيد الانتظار', icon: '📝', tasks: [] },
  { id: 'in_progress', title: 'جاري العمل', icon: '⏳', tasks: [] },
  { id: 'in_review', title: 'للمراجعة', icon: '👀', tasks: [] },
  { id: 'completed', title: 'مكتملة', icon: '✅', tasks: [] }
]);

// متغيرات الفلترة والبحث
const allFetchedTasks = ref([]);
const currentFilter = ref('all');
const selectedUserId = ref('');
const searchQuery = ref('');

// نافذة المهام
const showTaskModal = ref(false);
const isEditingTask = ref(false);
const editTaskId = ref(null);
const savingTask = ref(false);

const taskForm = reactive({
  title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: ''
});

// --- الدوال المساعدة ---
const showToast = (msg) => { toastMessage.value = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastMessage.value = '', 3000); };
const getInitials = (name) => name ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
const truncate = (text, len) => text.length > len ? text.substring(0, len) + '...' : text;
const formatDate = (date) => date ? new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '';
const isOverdue = (date, status) => date && status !== 'completed' && new Date(date) < new Date();

const getPriorityLabel = (p) => {
  const labels = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
  return labels[p] || p;
};

const getProjectStatusClass = (status) => {
  switch(status) {
    case 'مكتمل': return 'status-green'; case 'جاري التنفيذ': return 'status-purple';
    case 'متوقف': return 'status-red'; default: return 'status-blue';
  }
};

const canEditTask = (task) => {
  if (isManager.value) return true;
  return task.assigned_to === currentUserId.value || task.created_by === currentUserId.value;
};

// إضاءة المهام عند البحث
const isTaskHighlighted = (task) => {
  if (!searchQuery.value.trim()) return false;
  return task.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase());
};

// --- جلب البيانات وتوزيعها وتطبيق الفلاتر ---
const fetchProjectData = async () => {
  loading.value = true;
  try {
    const resProject = await api.get(`/projects/${route.params.id}`);
    project.value = resProject.data.data;
    await fetchTasks();
  } catch (error) {
    showToast('عذراً، لا يمكن الوصول للمشروع');
  } finally {
    loading.value = false;
  }
};

const fetchTasks = async () => {
  try {
    const res = await api.get(`/projects/${route.params.id}/tasks`);
    allFetchedTasks.value = res.data.data;
    applyFilters(); 
  } catch (error) {
    console.error(error);
  }
};

const applyFilters = () => {
  let filtered = allFetchedTasks.value;
  
  // 1. تطبيق الفلتر السريع
  if (currentFilter.value === 'mine') {
    filtered = filtered.filter(t => t.assigned_to === currentUserId.value);
  } else if (currentFilter.value === 'urgent') {
    filtered = filtered.filter(t => t.priority === 'urgent');
  } else if (currentFilter.value === 'overdue') {
    filtered = filtered.filter(t => isOverdue(t.due_date, t.status));
  }

  // 2. تطبيق فلتر الموظف (إذا تم اختياره)
  if (selectedUserId.value) {
    filtered = filtered.filter(t => t.assigned_to === selectedUserId.value);
  }

  // تفريغ الأعمدة وإعادة توزيع المهام المفلترة
  boardColumns.forEach(col => col.tasks = []);
  filtered.forEach(task => {
    const col = boardColumns.find(c => c.id === task.status);
    if (col) col.tasks.push(task);
  });
};

// مراقبة التغييرات في الفلاتر لتحديث اللوحة فوراً
watch(currentFilter, (newVal) => {
  if (newVal === 'mine') selectedUserId.value = ''; // تصفير قائمة الأعضاء إذا اختار "مهامي"
  applyFilters();
});
watch(selectedUserId, (newVal) => {
  if (newVal && currentFilter.value === 'mine') currentFilter.value = 'all'; // منع التعارض
  applyFilters();
});



// --- إدارة المهام (CRUD) ---
const openTaskModal = (task = null) => {
  if (task) {
    isEditingTask.value = true; editTaskId.value = task.id;
    Object.assign(taskForm, {
      title: task.title, description: task.description || '', status: task.status,
      priority: task.priority, due_date: task.due_date || '', assigned_to: task.assigned_to || ''
    });
  } else {
    isEditingTask.value = false; editTaskId.value = null;
    Object.assign(taskForm, { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
  }
  showTaskModal.value = true;
};

const closeTaskModal = () => { showTaskModal.value = false; };

const openWhatsAppLink = (link, popup = null) => {
  if (!link) {
    popup?.close();
    return;
  }

  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || url.hostname !== 'wa.me' ) {
      popup?.close();
      return;
    }

    if (popup && !popup.closed) {
      popup.location.href = url.toString();
    } else {
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    }
  } catch {
    popup?.close();
  }
};

const onTaskMove = async (event, newStatusId) => {
  if (!event.added) return;

  const task = event.added.element;
  const previousStatusId = task.status;
  const taskIndex = allFetchedTasks.value.findIndex((t) => t.id === task.id);

  task.status = newStatusId;
  if (taskIndex !== -1) {
    allFetchedTasks.value[taskIndex].status = newStatusId;
  }

  // فتح popup بشكل مباشر من حدث السحب لتفادي حظر المتصفح.
  const whatsappPopup = window.open('about:blank', '_blank');

  try {
    const res = await api.patch(`/tasks/${task.id}`, {
      status: newStatusId,
    });

    openWhatsAppLink(res.data?.whatsapp_link, whatsappPopup);
  } catch (error) {
    whatsappPopup?.close();
    task.status = previousStatusId;
    if (taskIndex !== -1) {
      allFetchedTasks.value[taskIndex].status = previousStatusId;
    }
    showToast(error.response?.data?.message || 'خطأ في تحديث حالة المهمة');
    await fetchTasks();
  }
};

const saveTask = async () => {
  savingTask.value = true;
  // نفس المعالجة لمنع حظر واتساب بعد انتهاء طلب API.
  const whatsappPopup = window.open('about:blank', '_blank');

  try {
    let res;

    if (isEditingTask.value) {
      res = await api.put(`/tasks/${editTaskId.value}`, taskForm);
      showToast('تم التحديث بنجاح');
    } else {
      res = await api.post(`/projects/${project.value.id}/tasks`, taskForm);
      showToast('تمت إضافة المهمة للوحة');
    }

    openWhatsAppLink(res.data?.whatsapp_link, whatsappPopup);

    closeTaskModal();
    await fetchTasks();
  } catch (error) {
    whatsappPopup?.close();
    showToast(error.response?.data?.message || 'حدث خطأ');
  } finally {
    savingTask.value = false;
  }
};

const deleteTask = async (taskId) => {
  if (!confirm('تأكيد حذف المهمة نهائياً؟')) return;
  try {
    await api.delete(`/tasks/${taskId}`);
    showToast('تم الحذف');
    await fetchTasks();
  } catch (error) {
    showToast(error.response?.data?.message || 'لا تملك صلاحية الحذف');
  }
};

onMounted(() => {
  fetchProjectData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.project-details-page { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; display: flex; flex-direction: column; }
.loading-state, .error-state { display: flex; align-items: center; justify-content: center; height: 50vh; color: #7c87b5; font-size: 16px; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(125, 232, 220, .25); border-top-color: #7de8dc; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* الترويسة */
.project-container { display: flex; flex-direction: column; flex-grow: 1; height: 100%; }
.page-topline { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(137, 153, 226, .1); }
.eyebrow { color: #76e8de; font-size: 12px; font-weight: 700; }
.back-link { color: #8fc9ff; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
.page-topline h2 { margin: 5px 0 0 0; font-size: 28px; font-weight: 800; }
.desc-text { color: #aab5da; font-size: 13px; margin: 8px 0 0 0; max-width: 600px; line-height: 1.6; }
.status-badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; margin-top: 5px; }
.status-green { color: #78e4d8; background: rgba(90, 220, 207, .1); }
.status-blue { color: #8fc9ff; background: rgba(101, 181, 255, .1); }
.status-purple { color: #c491ff; background: rgba(180, 112, 255, .12); }
.status-red { color: #ff9bad; background: rgba(255, 103, 139, .1); }

.topline-actions { display: flex; align-items: center; gap: 20px; }
.team-avatars { display: flex; direction: ltr; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(145deg, #80e8df, #ac84fa); display: grid; place-items: center; font-size: 10px; font-weight: bold; color: #12183f; border: 2px solid #04071b; margin-left: -10px; }
.avatar.more { background: #2a3363; color: #fff; }
.primary-btn { padding: 10px 20px; border-radius: 10px; border: none; background: linear-gradient(110deg, #7de8dc, #b28aff); color: #12183f; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
.primary-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

/* شريط البحث والفلاتر */
.filters-search-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 20px; padding: 12px 20px; border-radius: 12px; }
.glass-card { background: rgba(15, 22, 61, .65); border: 1px solid rgba(137, 153, 226, .13); }

.search-box { display: flex; align-items: center; background: rgba(6, 11, 37, 0.6); border: 1px solid rgba(137, 153, 226, 0.2); border-radius: 8px; padding: 8px 12px; flex-grow: 1; max-width: 350px; }
.search-box .icon { font-size: 14px; margin-left: 8px; opacity: 0.7; }
.search-box input { border: none; background: transparent; color: #eef0ff; font-family: 'Cairo'; outline: none; width: 100%; font-size: 12px; }
.search-box input:focus { border-color: #7de8dc; }

.filters-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-label { color: #818cb9; font-size: 12px; font-weight: bold; }
.filter-btn { background: rgba(6, 11, 37, 0.4); border: 1px solid rgba(137, 153, 226, 0.15); color: #aab5da; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-family: 'Cairo'; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.filter-btn:hover { background: rgba(137, 153, 226, 0.1); color: #eef0ff; }
.filter-btn.active { background: rgba(101, 181, 255, 0.15); color: #8fc9ff; border-color: rgba(101, 181, 255, 0.3); }

.divider { width: 1px; height: 20px; background: rgba(137, 153, 226, 0.2); margin: 0 5px; }

.user-filter-select { background: rgba(6, 11, 37, 0.6); border: 1px solid rgba(137, 153, 226, 0.2); color: #aab5da; border-radius: 8px; padding: 6px 10px; font-family: 'Cairo'; font-size: 11px; outline: none; cursor: pointer; }
.user-filter-select:focus { border-color: #7de8dc; color: #eef0ff; }

/* الكانبان بورد */
.kanban-board { display: flex; gap: 20px; flex-grow: 1; align-items: stretch; overflow-x: auto; padding-bottom: 10px; }
.kanban-column { flex: 1; min-width: 300px; background: rgba(15, 22, 61, .4); border: 1px solid rgba(137, 153, 226, .1); border-radius: 16px; display: flex; flex-direction: column; max-height: calc(100vh - 180px); }
.column-header { padding: 15px 20px; border-bottom: 1px solid rgba(137, 153, 226, .1); background: rgba(6, 11, 37, .3); border-radius: 16px 16px 0 0; }
.col-title { display: flex; align-items: center; gap: 8px; }
.col-icon { font-size: 16px; }
.col-title h3 { margin: 0; font-size: 15px; color: #eef0ff; flex-grow: 1; }
.task-count { background: rgba(137, 153, 226, .2); color: #aab5da; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px; }

.task-list { padding: 15px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-height: 150px; }
.empty-column-msg { text-align: center; color: #6975a7; font-size: 12px; padding-bottom: 20px; font-style: italic; }

/* كارت المهمة */
.task-card { background: rgba(26, 34, 77, 0.7); border: 1px solid rgba(137, 153, 226, .15); border-radius: 12px; padding: 15px; cursor: grab; transition: all 0.3s ease; position: relative; }
.task-card:active { cursor: grabbing; }
.task-card:hover { border-color: rgba(125, 232, 220, 0.4); transform: translateY(-2px); }

/* إضاءة كارت المهمة عند البحث */
.highlight-task { box-shadow: 0 0 18px rgba(125, 232, 220, 0.4) !important; border-color: #7de8dc !important; transform: scale(1.02); z-index: 10; }

.ghost-task { opacity: 0.4; background: rgba(125, 232, 220, 0.1); border: 1px dashed #7de8dc; }
.task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.priority-badge { font-size: 9px; font-weight: bold; padding: 3px 6px; border-radius: 4px; }
.priority-badge.low { background: rgba(143, 201, 255, 0.15); color: #8fc9ff; }
.priority-badge.medium { background: rgba(201, 148, 255, 0.15); color: #c994ff; }
.priority-badge.high { background: rgba(255, 196, 128, 0.15); color: #ffc480; }
.priority-badge.urgent { background: rgba(255, 103, 139, 0.15); color: #ff9bad; border: 1px solid rgba(255, 103, 139, 0.3); }

.task-actions { display: flex; gap: 5px; opacity: 0; transition: 0.2s; }
.task-card:hover .task-actions { opacity: 1; }
.t-btn { background: transparent; border: none; color: #aab5da; cursor: pointer; font-size: 13px; }
.t-btn:hover { color: #7de8dc; }
.t-btn.text-red:hover { color: #ff9bad; }

.task-title { margin: 0 0 5px 0; font-size: 14px; color: #eef0ff; line-height: 1.4; }
.task-desc { margin: 0 0 12px 0; font-size: 11px; color: #aab5da; line-height: 1.5; }
.task-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(137, 153, 226, .15); padding-top: 10px; }
.due-date { font-size: 10px; color: #7c87b5; }
.due-date.is-overdue { color: #ff9bad; font-weight: bold; }
.assignee-avatar { width: 24px; height: 24px; border-radius: 50%; background: #2a3363; display: grid; place-items: center; font-size: 9px; color: #fff; font-weight: bold; }

/* المودال ورسائل التنبيه */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 20px; background: rgba(4, 7, 27, .78); backdrop-filter: blur(7px); overflow-y: auto; }
.modal-content { background: linear-gradient(145deg, #171d52, #0d143a); border: 1px solid rgba(146, 160, 233, .2); border-radius: 20px; padding: 30px; position: relative; box-shadow: 0 25px 70px rgba(0,0,0,.4); }
.modal-close { position: absolute; top: 15px; left: 20px; border: 0; background: transparent; color: #8994c2; font-size: 28px; cursor: pointer; }
.modal-icon { width: 45px; height: 45px; display: grid; place-items: center; background: linear-gradient(145deg, #80e8df, #b486fb); border-radius: 12px; color: #202057; font-size: 22px; margin-bottom: 15px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; color: #b8c0e2; font-size: 12px; margin-bottom: 8px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; background: rgba(6, 11, 37, .46); border: 1px solid rgba(145, 160, 230, .2); border-radius: 9px; color: #eef0ff; font-family: 'Cairo'; font-size: 12px; outline: none; }
.form-group input:focus, .form-group textarea:focus { border-color: #76e8de; }
.text-red { color: #ff9bad; }
.self-assigned-msg { background: rgba(143, 201, 255, 0.1); border: 1px dashed #8fc9ff; padding: 10px; border-radius: 8px; font-size: 11px; color: #8fc9ff; display: flex; align-items: center; gap: 8px; }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.secondary-btn { padding: 10px 20px; background: transparent; border: 1px solid rgba(143, 157, 226, .2); color: #aab4dc; border-radius: 10px; cursor: pointer; font-family: 'Cairo'; font-size: 12px; }
.toast-message { position: fixed; bottom: 25px; left: 25px; background: #182552; color: #bdf7f0; padding: 12px 20px; border-radius: 10px; border: 1px solid rgba(116, 232, 220, .22); z-index: 99999; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-size: 12px; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }

@media (max-width: 900px) {
  .filters-search-bar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: none; }
}
</style>