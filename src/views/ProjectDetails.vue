<template>
  <section class="project-details-page" dir="rtl">
    <div v-if="loading" class="loading-state">
      <span class="spinner"></span> جارٍ تحميل المشروع والمهام...
    </div>
    
    <div v-else-if="project" class="project-container">
      <!-- الترويسة ومعلومات المشروع العلوية -->
      <div class="page-topline">
        <div class="project-info-side">
          <span class="eyebrow">
            <router-link to="/projects" class="back-link">المشاريع</router-link> / {{ project.name }}
          </span>
          <div style="display:flex; align-items:center; gap:15px;">
            <h2>{{ project.name }}</h2>
            <span :class="['status-badge', getProjectStatusClass(project.status)]">{{ project.status }}</span>
          </div>
          <p class="desc-text">{{ project.description || 'لا يوجد وصف للمشروع.' }}</p>

          <!-- 🔴 الجزء الجديد: شريط الإنجاز والصحة العامة للمشروع 🔴 -->
          <div class="project-progress-wrapper mt-3">
            <div class="progress-header">
              <span class="progress-title">📈 نسبة إنجاز المشروع</span>
              <strong class="progress-value">{{ projectProgress }}%</strong>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" :style="{ width: projectProgress + '%' }" :class="progressColorClass"></div>
            </div>
            <div class="progress-stats mt-2">
              <span class="stat-item" title="المهام المكتملة"><i class="text-green">✅</i> مكتمل: {{ completedTasksCount }}</span>
              <span class="stat-item" title="المهام الجاري العمل عليها أو للمراجعة"><i class="text-orange">⏳</i> قيد العمل: {{ inProgressTasksCount }}</span>
              <span class="stat-item" title="المهام التي تجاوزت الديدلاين"><i class="text-red">🚨</i> متأخر: {{ overdueTasksCount }}</span>
            </div>
          </div>

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
        <div class="search-box">
          <span class="icon">🔍</span>
          <input type="text" v-model="searchQuery" placeholder="ابحث باسم المهمة لتظليلها فوراً..." />
        </div>
        
        <div class="filters-actions">
          <span class="filter-label">تصفية:</span>
          <button :class="['filter-btn', { active: currentFilter === 'all' }]" @click="currentFilter = 'all'">الكل</button>
          <button :class="['filter-btn', { active: currentFilter === 'mine' }]" @click="currentFilter = 'mine'">مهامي 👤</button>
          <button :class="['filter-btn', { active: currentFilter === 'urgent' }]" @click="currentFilter = 'urgent'">عاجلة 🚨</button>
          <button :class="['filter-btn', { active: currentFilter === 'overdue' }]" @click="currentFilter = 'overdue'">متأخرة ⏰</button>
          
          <div class="divider"></div>
          
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
            :move="checkMove" 
            @change="(e) => onTaskMove(e, column.id)"
            :animation="200"
            :force-fallback="true"
            fallback-class="sortable-fallback"
            :delay="200"
            :delay-on-touch-only="true"
            :touch-start-threshold="3"
          >
            <template #item="{ element }">
              <div 
                class="task-card" 
                :class="[
                  { 
                    'highlight-task': isTaskHighlighted(element),
                    'not-draggable': !canMoveTask(element)
                  },
                  getDeadlineStatus(element.created_at, element.due_date, element.status).class
                ]"
              >
                <div class="task-header">
                  <span :class="['priority-badge', element.priority]">{{ getPriorityLabel(element.priority) }}</span>
                  <div class="task-actions">
                    <button v-if="canViewChat(element)" type="button" @click.stop="openChatModal(element)" class="t-btn" title="تفاصيل ومحادثة المهمة">💬</button>
                    <template v-if="isManager">
                      <button type="button" @click.stop="openTaskModal(element)" class="t-btn" title="تعديل البيانات">✎</button>
                      <button type="button" @click.stop="deleteTask(element.id)" class="t-btn text-red" title="حذف">⌫</button>
                    </template>
                  </div>
                </div>
                
                <h4 class="task-title">{{ element.title }}</h4>
                <p v-if="element.description" class="task-desc">{{ truncate(element.description, 60) }}</p>
                
                <div class="task-footer">
                  <div class="due-date-smart" :title="'تاريخ الإنشاء: ' + formatDate(element.created_at)">
                    <div class="due-date-row">
                      <span>🕒 {{ formatDate(element.due_date) || 'بدون موعد' }}</span>
                      <!-- العداد التنازلي الحي -->
                      <span 
                        v-if="element.due_date && element.status !== 'completed'"
                        class="countdown-pill" 
                        :class="'countdown-' + getRemainingTime(element.due_date).status"
                        :title="'الوقت المتبقي حتى التسليم'"
                      >
                        <span class="countdown-dot"></span>
                        <span class="countdown-text">⏳ {{ getRemainingTime(element.due_date).text }}</span>
                      </span>
                    </div>
                    <span class="sla-msg">{{ getDeadlineStatus(element.created_at, element.due_date, element.status).message }}</span>
                  </div>
                  <div class="assignee-avatar" :title="'المسؤول: ' + (element.assignee?.name || 'غير محدد')">
                    {{ getInitials(element.assignee?.name || '?') }}
                  </div>
                </div>

                <!-- شريط التقدم الذكي (يظهر فقط إذا كان هناك ديدلاين والمهمة غير مكتملة) -->
                <div class="sla-progress-bg" v-if="element.due_date && element.status !== 'completed'">
                  <div class="sla-progress-fill" :style="{ width: getDeadlineStatus(element.created_at, element.due_date, element.status).percentage + '%' }"></div>
                </div>

              </div>
            </template>
          </draggable>
          <div v-if="column.tasks.length === 0" class="empty-column-msg">اسحب المهام هنا</div>
        </div>
      </div>
    </div>
    
    <div v-else class="error-state">المشروع غير موجود أو لا تملك صلاحية للوصول.</div>

    <!-- نافذة إضافة/تعديل المهمة -->
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
              <input v-model="taskForm.title" type="text" required :disabled="!isManager" />
            </div>
            
            <div class="form-group">
              <label>الوصف والتفاصيل</label>
              <textarea v-model="taskForm.description" rows="3" :disabled="!isManager"></textarea>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label>الحالة</label>
                <select v-model="taskForm.status" :disabled="!isManager">
                  <option value="todo">قيد الانتظار</option>
                  <option value="in_progress">جاري العمل</option>
                  <option value="in_review">للمراجعة</option>
                  <option value="completed">مكتملة</option>
                </select>
              </div>
              <div class="form-group">
                <label>الأولوية</label>
                <select v-model="taskForm.priority" :disabled="!isManager">
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة 🚨</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>تاريخ ووقت الاستحقاق (Deadline)</label>
                <input v-model="taskForm.due_date" type="datetime-local" :disabled="!isManager" />
                <!-- رسالة مساعدة تظهر للمدير ليتذكر إطار المشروع -->
                <small v-if="isManager" class="muted mt-1" style="display:block; font-size: 10px;">يجب أن يكون بين {{ project?.start_date }} و {{ project?.end_date }}</small>
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
              <button v-if="isManager" type="submit" class="primary-btn" :disabled="savingTask">
                {{ savingTask ? 'جارٍ الحفظ...' : 'حفظ المهمة' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- نافذة المحادثة والتفاصيل -->
    <Teleport to="body">
      <div v-if="showChatModal" class="modal-overlay" @click.self="closeChatModal">
        <div class="modal-content chat-modal">
          <button class="modal-close" type="button" @click="closeChatModal">×</button>
          
          <div class="chat-header">
            <span :class="['priority-badge', currentChatTask.priority]">{{ getPriorityLabel(currentChatTask.priority) }}</span>
            <h3 class="mt-2">{{ currentChatTask.title }}</h3>
            <p class="muted text-sm">{{ currentChatTask.description || 'لا يوجد وصف.' }}</p>
          </div>

          <div class="separator"></div>

          <div class="comments-list" ref="commentsContainer">
            <div v-if="loadingComments" class="text-center muted text-sm mt-3">جارٍ تحميل المحادثة...</div>
            <div v-else-if="comments.length === 0" class="text-center muted text-sm mt-3">لا توجد رسائل بعد. ابدأ النقاش!</div>
            
            <div v-for="comment in comments" :key="comment.id" :class="['comment-bubble', { 'mine': comment.user.id === currentUserId }, { 'is-deleted': comment.is_deleted }]">
              <template v-if="comment.is_deleted">
                <div class="comment-text deleted-text">🚫 تم حذف هذه الرسالة</div>
                <div class="comment-time">{{ new Date(comment.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) }}</div>
              </template>

              <template v-else>
                <div class="comment-top-row">
                  <div class="comment-author">{{ comment.user.name }}</div>
                  <div class="comment-actions">
                    <button v-if="comment.user.id === currentUserId" @click="startEdit(comment)" title="تعديل">✏️</button>
                    <button v-if="comment.user.id === currentUserId || isManager" @click="deleteCommentMessage(comment.id)" title="حذف">🗑️</button>
                  </div>
                </div>
                
                <div v-if="editingCommentId === comment.id" class="edit-comment-mode">
                  <input type="text" v-model="editCommentText" @keyup.enter="submitEditComment" />
                  <div class="edit-actions">
                    <button @click="submitEditComment" class="save-btn">حفظ</button>
                    <button @click="cancelEdit" class="cancel-btn">إلغاء</button>
                  </div>
                </div>

                <div v-else class="comment-text">
                  {{ comment.comment }}
                </div>
                
                <div class="comment-time">
                  {{ new Date(comment.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) }}
                  <span v-if="comment.is_edited" class="edited-flag">(مُعدّل)</span>
                </div>
              </template>
            </div>
          </div>

          <div class="comment-input-area mt-3">
            <input 
              type="text" 
              v-model="newComment" 
              @keyup.enter="postComment" 
              placeholder="اكتب رسالة (واضغط Enter)..." 
            />
            <button type="button" @click="postComment" :disabled="postingComment || !newComment.trim()">إرسال 🚀</button>
          </div>
        </div>
      </div>
    </Teleport>

    <transition name="toast">
      <div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div>
    </transition>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import draggable from 'vuedraggable';
import api from '../axios';

// استيراد المحرك الذكي
import { getDeadlineStatus } from '../utils/timeHelper';

// توقيت مرجعي مركزي يتحدث كل دقيقة للعداد التنازلي
const currentTime = ref(new Date().getTime());
let timerInterval = null;

const route = useRoute();
const project = ref(null);
const loading = ref(true);
const toastMessage = ref('');
let toastTimer;

const userRole = ref(localStorage.getItem('role') || 'employee');
const isManager = computed(() => userRole.value === 'manager');
const currentUserId = ref(parseInt(localStorage.getItem('user_id') || 0));

const boardColumns = reactive([
  { id: 'todo', title: 'قيد الانتظار', icon: '📝', tasks: [] },
  { id: 'in_progress', title: 'جاري العمل', icon: '⏳', tasks: [] },
  { id: 'in_review', title: 'للمراجعة', icon: '👀', tasks: [] },
  { id: 'completed', title: 'مكتملة', icon: '✅', tasks: [] }
]);

const allFetchedTasks = ref([]);
const currentFilter = ref('all');
const selectedUserId = ref('');
const searchQuery = ref('');

const showTaskModal = ref(false);
const isEditingTask = ref(false);
const editTaskId = ref(null);
const savingTask = ref(false);

const showChatModal = ref(false);
const currentChatTask = ref(null);
const comments = ref([]);
const newComment = ref('');
const loadingComments = ref(false);
const postingComment = ref(false);

// ----------------------------------------------------
// 🔴 حساب الإنجاز الذكي والـ Progress Bar 🔴
// ----------------------------------------------------
const completedTasksCount = computed(() => allFetchedTasks.value.filter(t => t.status === 'completed').length);
const inProgressTasksCount = computed(() => allFetchedTasks.value.filter(t => t.status !== 'completed' && t.status !== 'todo').length);
const overdueTasksCount = computed(() => allFetchedTasks.value.filter(t => getDeadlineStatus(t.created_at, t.due_date, t.status).isOverdue).length);

const projectProgress = computed(() => {
  if (allFetchedTasks.value.length === 0) return 0;
  return Math.round((completedTasksCount.value / allFetchedTasks.value.length) * 100);
});

const progressColorClass = computed(() => {
  if (projectProgress.value === 100) return 'bg-success';
  if (projectProgress.value > 50) return 'bg-info';
  if (projectProgress.value > 25) return 'bg-warning';
  return 'bg-danger';
});
// ----------------------------------------------------

const openChatModal = (task) => {
  currentChatTask.value = task;
  showChatModal.value = true;
  fetchComments(task.id);
};

const closeChatModal = () => {
  showChatModal.value = false;
  currentChatTask.value = null;
  comments.value = [];
  newComment.value = '';
};

const fetchComments = async (taskId) => {
  loadingComments.value = true;
  try {
    const res = await api.get(`/tasks/${taskId}/comments`);
    comments.value = res.data.data;
  } catch (error) {
    showToast('خطأ في جلب المحادثة');
  } finally {
    loadingComments.value = false;
  }
};

const postComment = async () => {
  if (!newComment.value.trim() || !currentChatTask.value) return;
  postingComment.value = true;
  try {
    const res = await api.post(`/tasks/${currentChatTask.value.id}/comments`, { comment: newComment.value });
    comments.value.push(res.data.data);
    newComment.value = '';
  } catch (error) {
    showToast('حدث خطأ أثناء إرسال الرسالة');
  } finally {
    postingComment.value = false;
  }
};

const editingCommentId = ref(null);
const editCommentText = ref('');

const startEdit = (comment) => {
  editingCommentId.value = comment.id;
  editCommentText.value = comment.comment;
};

const cancelEdit = () => {
  editingCommentId.value = null;
  editCommentText.value = '';
};

const submitEditComment = async () => {
  if (!editCommentText.value.trim()) return;
  try {
    const res = await api.put(`/task-comments/${editingCommentId.value}`, { comment: editCommentText.value });
    const index = comments.value.findIndex(c => c.id === editingCommentId.value);
    if (index !== -1) comments.value[index] = res.data.data;
    cancelEdit();
  } catch (error) {
    showToast('لا يمكنك تعديل هذا التعليق');
  }
};

const deleteCommentMessage = async (commentId) => {
  if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
  try {
    const res = await api.delete(`/task-comments/${commentId}`);
    const index = comments.value.findIndex(c => c.id === commentId);
    if (index !== -1) comments.value[index] = res.data.data;
  } catch (error) {
    showToast('غير مصرح لك بحذف التعليق');
  }
};

const taskForm = reactive({
  title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: ''
});

const showToast = (msg) => { toastMessage.value = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastMessage.value = '', 4000); };
const getInitials = (name) => name ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
const truncate = (text, len) => (text && text.length > len) ? text.substring(0, len) + '...' : (text || '');
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  const hasTime = String(date).includes(':');
  if (hasTime) {
    const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} (${timeStr})`;
  }
  return dateStr;
};

const getRemainingTime = (dueDate) => {
  if (!dueDate) return { text: 'غير محدد', status: 'normal' };

  const due = new Date(dueDate).getTime();
  const now = currentTime.value;
  const diff = due - now;

  if (diff < 0) {
    return { text: 'متأخر', status: 'danger' }; // أحمر
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let text = '';
  if (days > 0) text += `${days} يوم `;
  if (hours > 0) text += `${hours} ساعة `;
  if (days === 0 && minutes > 0) text += `${minutes} دقيقة`;
  
  if (text === '') text = 'أقل من دقيقة';

  // تحديد الحالة اللونية
  let status = 'normal'; // أخضر أو رمادي
  if (days === 0) status = 'warning'; // برتقالي إذا كان التسليم اليوم

  return { text: text.trim(), status };
};

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

const isTaskHighlighted = (task) => {
  if (!searchQuery.value.trim()) return false;
  return task.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase());
};

const canMoveTask = (task) => {
  if (isManager.value) return true;
  return task.assigned_to === currentUserId.value || task.created_by === currentUserId.value;
};

const canViewChat = (task) => {
  if (isManager.value) return true;
  return task.assigned_to === currentUserId.value || task.created_by === currentUserId.value;
};

const checkMove = (evt) => {
  return canMoveTask(evt.draggedContext.element);
};

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
  if (currentFilter.value === 'mine') filtered = filtered.filter(t => t.assigned_to === currentUserId.value);
  else if (currentFilter.value === 'urgent') filtered = filtered.filter(t => t.priority === 'urgent');
  else if (currentFilter.value === 'overdue') filtered = filtered.filter(t => getDeadlineStatus(t.created_at, t.due_date, t.status).isOverdue);
  
  if (selectedUserId.value) filtered = filtered.filter(t => t.assigned_to === selectedUserId.value);

  boardColumns.forEach(col => col.tasks = []);
  filtered.forEach(task => {
    const col = boardColumns.find(c => c.id === task.status);
    if (col) col.tasks.push(task);
  });
};

watch(currentFilter, (newVal) => {
  if (newVal === 'mine') selectedUserId.value = ''; 
  applyFilters();
});
watch(selectedUserId, (newVal) => {
  if (newVal && currentFilter.value === 'mine') currentFilter.value = 'all';
  applyFilters();
});

const onTaskMove = async (event, newStatusId) => {
  if (event.added) {
    const task = event.added.element;
    task.status = newStatusId;
    const taskIndex = allFetchedTasks.value.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) allFetchedTasks.value[taskIndex].status = newStatusId;

    try {
      const res = await api.patch(`/tasks/${task.id}`, { status: newStatusId });
      if (res.data.whatsapp_link) {
          window.open(res.data.whatsapp_link, '_blank');
      }
    } catch (error) {
      showToast('خطأ في تحديث حالة المهمة');
      fetchTasks();
    }
  }
};

const openTaskModal = (task = null) => {
  if (task && !isManager.value) {
    showToast('غير مصرح لك بتعديل بيانات المهمة، يمكنك فقط تغيير حالتها');
    return;
  }

  if (task) {
    isEditingTask.value = true; editTaskId.value = task.id;
    Object.assign(taskForm, {
      title: task.title, description: task.description || '', status: task.status,
      priority: task.priority, due_date: '', assigned_to: task.assigned_to || ''
    });

    if (task.due_date) {
      // تحويل المسافة إلى T وقص الثواني ليقبلها حقل الإدخال
      taskForm.due_date = task.due_date.replace(' ', 'T').substring(0, 16);
    }
  } else {
    isEditingTask.value = false; editTaskId.value = null;
    Object.assign(taskForm, { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
  }
  showTaskModal.value = true;
};

const closeTaskModal = () => { showTaskModal.value = false; };

const saveTask = async () => {
  savingTask.value = true;
  try {
    const payload = {
      ...taskForm,
      due_date: taskForm.due_date ? taskForm.due_date : null
    };

    let res;
    if (isEditingTask.value) {
      res = await api.put(`/tasks/${editTaskId.value}`, payload);
      showToast('تم التحديث بنجاح');
    } else {
      res = await api.post(`/projects/${project.value.id}/tasks`, payload);
      showToast('تمت إضافة المهمة للوحة');
    }
    
    if (res.data.whatsapp_link) {
        window.open(res.data.whatsapp_link, '_blank');
    }

    closeTaskModal();
    await fetchTasks();
  } catch (error) {
    // 🔴 التقاط رسالة الخطأ من السيرفر (مثل تجاوز تواريخ المشروع)
    const errorMessage = error.response?.data?.errors?.due_date?.[0] || error.response?.data?.message || 'حدث خطأ غير متوقع';
    showToast(errorMessage);
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
  timerInterval = setInterval(() => {
    currentTime.value = new Date().getTime();
  }, 60000); // تحديث كل 60 ثانية
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.project-details-page { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; display: flex; flex-direction: column; }
.loading-state, .error-state { display: flex; align-items: center; justify-content: center; height: 50vh; color: #7c87b5; font-size: 16px; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(125, 232, 220, .25); border-top-color: #7de8dc; border-radius: 50%; animation: spin 1s linear infinite; margin-left: 10px; }
@keyframes spin { to { transform: rotate(360deg); } }

.project-container { display: flex; flex-direction: column; flex-grow: 1; height: 100%; }
.page-topline { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(137, 153, 226, .1); }
.project-info-side { flex-grow: 1; }
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

/* --- 🔴 Project Progress Bar Styles 🔴 --- */
.project-progress-wrapper { background: rgba(15, 22, 61, 0.4); border: 1px solid rgba(137, 153, 226, 0.15); border-radius: 12px; padding: 15px; max-width: 500px; margin-top: 15px; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #eef0ff; }
.progress-title { font-weight: 600; color: #7de8dc; }
.progress-value { font-weight: 800; font-size: 15px; }
.progress-bar-container { width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; transition: width 0.4s ease, background-color 0.4s ease; }
.bg-success { background: linear-gradient(90deg, #25d366, #7de8dc); }
.bg-info { background: linear-gradient(90deg, #3b82f6, #8fc9ff); }
.bg-warning { background: linear-gradient(90deg, #f59e0b, #ffc480); }
.bg-danger { background: linear-gradient(90deg, #ef4444, #ff9bad); }
.progress-stats { display: flex; gap: 15px; font-size: 11px; color: #aab5da; }
.stat-item i { margin-left: 4px; font-style: normal; }
.text-green { color: #25d366; } .text-orange { color: #f59e0b; } .text-red { color: #ef4444; }
/* ------------------------------------------- */

.topline-actions { display: flex; align-items: center; gap: 20px; align-self: flex-end; }
.team-avatars { display: flex; direction: ltr; }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(145deg, #80e8df, #ac84fa); display: grid; place-items: center; font-size: 10px; font-weight: bold; color: #12183f; border: 2px solid #04071b; margin-left: -10px; }
.avatar.more { background: #2a3363; color: #fff; }
.primary-btn { padding: 10px 20px; border-radius: 10px; border: none; background: linear-gradient(110deg, #7de8dc, #b28aff); color: #12183f; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
.primary-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

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

.kanban-board { display: flex; gap: 20px; flex-grow: 1; align-items: stretch; overflow-x: auto; padding-bottom: 10px; }
.kanban-column { flex: 1; min-width: 300px; background: rgba(15, 22, 61, .4); border: 1px solid rgba(137, 153, 226, .1); border-radius: 16px; display: flex; flex-direction: column; max-height: calc(100vh - 180px); }
.column-header { padding: 15px 20px; border-bottom: 1px solid rgba(137, 153, 226, .1); background: rgba(6, 11, 37, .3); border-radius: 16px 16px 0 0; }
.col-title { display: flex; align-items: center; gap: 8px; }
.col-icon { font-size: 16px; }
.col-title h3 { margin: 0; font-size: 15px; color: #eef0ff; flex-grow: 1; }
.task-count { background: rgba(137, 153, 226, .2); color: #aab5da; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 12px; }
.task-list { padding: 15px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-height: 150px; }
.empty-column-msg { text-align: center; color: #6975a7; font-size: 12px; padding-bottom: 20px; font-style: italic; }

.task-card { background: rgba(26, 34, 77, 0.7); border: 1px solid rgba(137, 153, 226, .15); border-radius: 12px; padding: 15px; cursor: grab; transition: all 0.3s ease; position: relative; }
.task-card:active { cursor: grabbing; }
.task-card:hover { border-color: rgba(125, 232, 220, 0.4); transform: translateY(-2px); }
.not-draggable { cursor: not-allowed !important; opacity: 0.8; }
.not-draggable:hover { border-color: rgba(137, 153, 226, .15); transform: none; }
.highlight-task { box-shadow: 0 0 18px rgba(125, 232, 220, 0.4) !important; border-color: #7de8dc !important; transform: scale(1.02); z-index: 10; }
.ghost-task { opacity: 0.4; background: rgba(125, 232, 220, 0.1); border: 2px dashed #7de8dc; }
.sortable-fallback { opacity: 1 !important; cursor: grabbing !important; box-shadow: 0 15px 30px rgba(0,0,0,0.5) !important; transform: rotate(3deg) !important; background: #171d52 !important; }

/* SLA Smart Colors */
.task-card.dl-completed { border-right: 3px solid #7de8dc; }
.task-card.dl-safe { border-right: 3px solid #25d366; }
.task-card.dl-warning { border-right: 3px solid #ffc107; }
.task-card.dl-danger { border-right: 3px solid #fd7e14; }
.task-card.dl-urgent { border-right: 3px solid #ff4757; }
.task-card.dl-late { border-right: 3px solid #ff0000; background: rgba(255, 0, 0, 0.05); }
.task-card.dl-critical { border-right: 3px solid #8b0000; background: rgba(255, 71, 87, 0.1); animation: pulse-critical 2s infinite; }

@keyframes pulse-critical {
  0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(255, 71, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
}

.due-date-smart { display: flex; flex-direction: column; gap: 4px; font-size: 10px; color: #7c87b5; }
.due-date-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.countdown-pill { 
  display: inline-flex; 
  align-items: center; 
  gap: 4px; 
  padding: 2px 7px; 
  border-radius: 6px; 
  font-size: 9px; 
  font-weight: 700; 
  line-height: 1.2;
  transition: all 0.3s ease;
}
.countdown-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
}

/* status === 'danger' -> أحمر */
.countdown-danger {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
}
.countdown-danger .countdown-dot {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
  animation: countdown-pulse-anim 1.5s infinite;
}

/* status === 'warning' -> برتقالي/أصفر */
.countdown-warning {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.35);
}
.countdown-warning .countdown-dot {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

/* status === 'normal' -> أخضر طبيعي أو زمردي هادئ */
.countdown-normal {
  background: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.countdown-normal .countdown-dot {
  background: #10b981;
}

@keyframes countdown-pulse-anim {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.sla-msg { font-size: 9px; font-weight: bold; }

.task-card.dl-completed .sla-msg { color: #7de8dc; }
.task-card.dl-safe .sla-msg { color: #25d366; }
.task-card.dl-warning .sla-msg { color: #ffc107; }
.task-card.dl-danger .sla-msg { color: #fd7e14; }
.task-card.dl-urgent .sla-msg { color: #ff4757; }
.task-card.dl-late .sla-msg { color: #ff0000; }
.task-card.dl-critical .sla-msg { color: #ff6b81; }

.sla-progress-bg { height: 3px; background: rgba(137, 153, 226, 0.1); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.sla-progress-fill { height: 100%; transition: width 0.3s ease; }
.task-card.dl-safe .sla-progress-fill { background: #25d366; }
.task-card.dl-warning .sla-progress-fill { background: #ffc107; }
.task-card.dl-danger .sla-progress-fill { background: #fd7e14; }
.task-card.dl-urgent .sla-progress-fill { background: #ff4757; }
.task-card.dl-late .sla-progress-fill, .task-card.dl-critical .sla-progress-fill { background: #ff0000; }

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
.assignee-avatar { width: 24px; height: 24px; border-radius: 50%; background: #2a3363; display: grid; place-items: center; font-size: 9px; color: #fff; font-weight: bold; }

/* المودال */
.modal-overlay { position: fixed;   display: grid; place-items: center; padding: 20px; background: rgba(4, 7, 27, .78); backdrop-filter: blur(7px); overflow-y: auto;        inset: 0 !important; z-index: 9999 !important; }
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
  .page-topline { flex-direction: column; }
  .topline-actions { align-self: flex-start; margin-top: 15px; }
}

.chat-modal { width: min(600px, 100%) !important; display: flex; flex-direction: column; max-height: 85vh; }
.chat-header h3 { margin: 5px 0; color: #eef0ff; }
.chat-header .muted { color: #aab5da; line-height: 1.5; margin: 0; }
.separator { height: 1px; background: rgba(137, 153, 226, .15); margin: 15px 0; }

.comments-list { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 5px; min-height: 300px; max-height: 400px; }
.comment-bubble { background: rgba(6, 11, 37, 0.5); padding: 12px 15px; border-radius: 12px 12px 0 12px; max-width: 80%; align-self: flex-start; border: 1px solid rgba(137, 153, 226, 0.1); }
.comment-bubble.mine { align-self: flex-end; background: rgba(101, 181, 255, 0.1); border-radius: 12px 12px 12px 0; border-color: rgba(101, 181, 255, 0.2); }
.comment-author { font-size: 11px; color: #7c87b5; margin-bottom: 5px; font-weight: bold; }
.comment-bubble.mine .comment-author { color: #8fc9ff; }
.comment-text { font-size: 13px; color: #eef0ff; line-height: 1.5; }
.comment-time { font-size: 10px; color: #5a6593; text-align: left; margin-top: 5px; }

.comment-input-area { display: flex; gap: 10px; align-items: center; }
.comment-input-area input { flex-grow: 1; padding: 12px 15px; background: rgba(6, 11, 37, 0.6); border: 1px solid rgba(137, 153, 226, 0.2); border-radius: 25px; color: #fff; font-size: 13px; font-family: 'Cairo'; outline: none; }
.comment-input-area input:focus { border-color: #7de8dc; }
.comment-input-area button { background: linear-gradient(110deg, #7de8dc, #b28aff); border: none; border-radius: 25px; padding: 0 20px; height: 42px; color: #12183f; font-weight: bold; font-size: 13px; cursor: pointer; transition: 0.2s; }
.comment-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
.text-sm { font-size: 11px; }

.comment-bubble { position: relative; }
.comment-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
.comment-actions { opacity: 0; transition: opacity 0.2s; display: flex; gap: 5px; }
.comment-bubble:hover .comment-actions { opacity: 1; }
.comment-actions button { background: transparent; border: none; font-size: 11px; cursor: pointer; padding: 2px; filter: grayscale(100%); transition: 0.2s; }
.comment-actions button:hover { filter: grayscale(0%); transform: scale(1.1); }
.edited-flag { font-size: 9px; color: #7c87b5; margin-right: 4px; font-style: italic; }
.is-deleted { background: rgba(15, 22, 61, 0.4) !important; border-color: rgba(137, 153, 226, 0.05) !important; }
.deleted-text { color: #6975a7 !important; font-style: italic; font-size: 11px !important; margin-bottom: 5px; }
.edit-comment-mode { display: flex; flex-direction: column; gap: 8px; margin-top: 5px; }
.edit-comment-mode input { padding: 6px 10px; background: rgba(6, 11, 37, 0.8); border: 1px solid #7de8dc; border-radius: 6px; color: #fff; font-size: 12px; font-family: 'Cairo'; outline: none; }
.edit-actions { display: flex; gap: 5px; justify-content: flex-end; }
.save-btn { background: #7de8dc; color: #12183f; border: none; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; }
.cancel-btn { background: transparent; color: #ff9bad; border: 1px solid #ff9bad; padding: 3px 10px; border-radius: 4px; font-size: 10px; cursor: pointer; }
</style>