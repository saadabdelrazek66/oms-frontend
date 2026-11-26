<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="drilldown-drawer-overlay"
      @click.self="emit('close')"
      role="dialog"
      aria-modal="true"
    >
      <aside class="drilldown-drawer" dir="rtl">
        <!-- هيدر الدرج الجانبي -->
        <div class="drawer-header">
          <div class="drawer-header-info">
            <div class="drawer-icon-badge">{{ icon }}</div>
            <div>
              <h3 class="drawer-title">{{ title }}</h3>
              <div class="drawer-meta-tags">
                <span class="drawer-count-badge">
                  {{ filteredItems.length }} {{ type === 'overdue_tasks' ? 'مهمة' : 'منشور' }}
                </span>
                <span class="drawer-horizon-badge">
                  📅 النطاق: {{ horizonLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="drawer-header-actions">
            <button
              type="button"
              class="drawer-refresh-btn"
              @click="emit('refresh')"
              :disabled="loading"
              title="تحديث القائمة"
            >
              <span :class="{ 'is-spinning': loading }">🔄</span>
            </button>
            <button
              type="button"
              class="drawer-close-btn"
              @click="emit('close')"
              title="إغلاق الدرج (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- شريط البحث السريع داخل الدرج -->
        <div class="drawer-search-bar" v-if="items.length > 0">
          <span class="drawer-search-icon">🔍</span>
          <input
            type="text"
            v-model="drawerSearch"
            placeholder="ابحث بالاسم، المشروع، أو اسم الموظف..."
            class="drawer-search-input"
          />
          <button
            v-if="drawerSearch"
            type="button"
            class="drawer-clear-search"
            @click="drawerSearch = ''"
          >
            ✕
          </button>
        </div>

        <!-- جسم الدرج (قائمة العناصر) -->
        <div class="drawer-body">
          <!-- حالة التحميل داخل الدرج -->
          <div v-if="loading" class="drawer-loading-state">
            <span class="spinner large"></span>
            <p>جارٍ تحميل التفاصيل التشغيلية...</p>
          </div>

          <!-- حالة عدم وجود بيانات -->
          <div v-else-if="filteredItems.length === 0" class="drawer-empty-state">
            <div class="drawer-empty-icon">🎉</div>
            <h4>لا توجد عناصر متأخرة حالياً</h4>
            <p v-if="drawerSearch">لا توجد نتائج تطابق بحثك "{{ drawerSearch }}".</p>
            <p v-else>كل العمليات التشغيلية ضمن هذا النطاق منجزة وفي موعدها المحدد.</p>
          </div>

          <!-- قائمة العناصر المتأخرة -->
          <div v-else class="drawer-items-list">
            <!-- كارت مهمة متأخرة -->
            <template v-if="type === 'overdue_tasks'">
              <div
                v-for="task in filteredItems"
                :key="task.id"
                class="drawer-item-card task-card"
                :class="{ 'is-urgent': task.is_urgent }"
              >
                <div class="item-card-topline">
                  <div class="item-badges-row">
                    <span v-if="task.is_urgent" class="urgent-pill">🚨 عاجل جداً</span>
                    <span class="overdue-pill pulse-danger">
                      متأخرة منذ {{ task.days_overdue }} يوم
                    </span>
                    <span class="priority-pill" :class="'prio-' + task.priority">
                      {{ task.priority }}
                    </span>
                  </div>
                  <span class="item-date-text" :title="'تاريخ الاستحقاق: ' + task.due_date">
                    ⏰ {{ task.due_date || 'غير محدد' }}
                  </span>
                </div>

                <h4 class="item-title">{{ task.title }}</h4>

                <div class="item-project-info">
                  <span class="project-pill">📁 {{ task.project_name }}</span>
                </div>

                <div class="item-person-strip">
                  <div class="person-avatar-wrap">
                    <div class="person-avatar">{{ getInitials(task.assignee_name) }}</div>
                    <div class="person-details">
                      <strong class="person-name">{{ task.assignee_name }}</strong>
                      <small class="person-role">{{ task.assignee_job }}</small>
                    </div>
                  </div>

                  <div class="item-actions-row">
                    <button
                      type="button"
                      class="drawer-btn wa-contact-btn"
                      @click="emit('whatsapp-task', task)"
                      :title="task.assignee_phone ? 'مراسلة ' + task.assignee_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                    >
                      <span class="wa-icon">💬</span>
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      class="drawer-btn reschedule-trigger-btn"
                      @click="startReschedule(task)"
                      title="إعادة جدولة موعد الاستحقاق"
                    >
                      <span>🗓️</span>
                      <span>إعادة جدولة</span>
                    </button>

                    <button
                      type="button"
                      class="drawer-btn view-project-btn"
                      @click="emit('navigate', '/projects/' + task.project_id)"
                      title="الانتقال للمشروع"
                    >
                      <span>فتح ↗</span>
                    </button>
                  </div>
                </div>

                <!-- فورم إعادة الجدولة المباشر السريع -->
                <div v-if="activeRescheduleId === task.id" class="inline-reschedule-box">
                  <div class="reschedule-box-header">
                    <span>🗓️ تحديد موعد استحقاق جديد للمهمة:</span>
                  </div>
                  <div class="reschedule-input-row">
                    <input
                      type="datetime-local"
                      v-model="rescheduleDate"
                      class="reschedule-native-input"
                    />
                    <button
                      type="button"
                      class="reschedule-submit-btn"
                      @click="handleRescheduleSubmit(task)"
                      :disabled="savingReschedule"
                    >
                      {{ savingReschedule ? 'جارٍ الحفظ...' : 'تأكيد وحفظ' }}
                    </button>
                    <button
                      type="button"
                      class="reschedule-cancel-btn"
                      @click="cancelReschedule"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- كارت منشور متأخر عن موعد التسليم -->
            <template v-else-if="type === 'overdue_posts'">
              <div
                v-for="post in filteredItems"
                :key="post.id"
                class="drawer-item-card post-card"
              >
                <div class="item-card-topline">
                  <div class="item-badges-row">
                    <span class="overdue-pill pulse-danger">
                      متأخر منذ {{ post.days_overdue }} يوم
                    </span>
                    <span class="type-pill">📱 {{ post.post_type }}</span>
                  </div>
                  <span class="item-date-text">
                    ⏰ الديدلاين: {{ post.deadline || 'غير محدد' }}
                  </span>
                </div>

                <h4 class="item-title">{{ post.title }}</h4>

                <div class="item-project-info">
                  <span class="project-pill">📝 {{ post.plan_name }}</span>
                  <span v-if="post.target_date" class="target-date-pill">
                    📅 النشر المستهدف: {{ post.target_date }}
                  </span>
                </div>

                <div class="item-person-strip">
                  <div class="person-avatar-wrap">
                    <div class="person-avatar purple-avatar">{{ getInitials(post.designer_name) }}</div>
                    <div class="person-details">
                      <strong class="person-name">{{ post.designer_name }}</strong>
                      <small class="person-role">{{ post.designer_job }}</small>
                    </div>
                  </div>

                  <div class="item-actions-row">
                    <button
                      type="button"
                      class="drawer-btn wa-contact-btn"
                      @click="emit('whatsapp-post', post)"
                      :title="post.designer_phone ? 'مراسلة ' + post.designer_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                    >
                      <span class="wa-icon">💬</span>
                      <span>واتساب</span>
                    </button>

                    <button
                      type="button"
                      class="drawer-btn view-board-btn"
                      @click="emit('navigate', '/plan-board/' + post.plan_id)"
                      title="فتح لوحة الخطة"
                    >
                      <span>لوحة الخطة ↗</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- كارت منشور مرفوض في المراجعة -->
            <template v-else-if="type === 'rejected_posts'">
              <div
                v-for="post in filteredItems"
                :key="post.id"
                class="drawer-item-card rejected-post-card"
              >
                <div class="item-card-topline">
                  <div class="item-badges-row">
                    <span class="rejected-pill">❌ مرفوض</span>
                    <span class="type-pill">📱 {{ post.post_type }}</span>
                  </div>
                  <span class="item-date-text" v-if="post.target_date">
                    📅 النشر: {{ post.target_date }}
                  </span>
                </div>

                <h4 class="item-title">{{ post.title }}</h4>

                <div class="item-project-info">
                  <span class="project-pill">📝 {{ post.plan_name }}</span>
                  <span class="rejected-by-pill">🔍 الرفض من: {{ post.rejected_by }}</span>
                </div>

                <!-- ملاحظات الرفض -->
                <div class="rejection-reason-callout">
                  <div class="reason-label">⚠️ سبب الرفض والتعديلات المطلوبة:</div>
                  <p class="reason-text">{{ post.rejection_reason }}</p>
                </div>

                <div class="item-person-strip">
                  <div class="person-avatar-wrap">
                    <div class="person-avatar red-avatar">{{ getInitials(post.designer_name) }}</div>
                    <div class="person-details">
                      <strong class="person-name">{{ post.designer_name }}</strong>
                      <small class="person-role">{{ post.designer_job }}</small>
                    </div>
                  </div>

                  <div class="item-actions-row">
                    <button
                      type="button"
                      class="drawer-btn wa-contact-btn"
                      @click="emit('whatsapp-post', post)"
                      :title="post.designer_phone ? 'مراسلة ' + post.designer_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                    >
                      <span class="wa-icon">💬</span>
                      <span>تنبيه واتساب</span>
                    </button>

                    <button
                      type="button"
                      class="drawer-btn view-board-btn"
                      @click="emit('navigate', '/plan-board/' + post.plan_id)"
                      title="فتح لوحة الخطة"
                    >
                      <span>لوحة الخطة ↗</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ذيل الدرج -->
        <div class="drawer-footer">
          <button type="button" class="drawer-close-footer-btn" @click="emit('close')">
            إغلاق الدرج
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { getInitials } from '@/utils/workloadHelper';

const props = defineProps({
  open: { type: Boolean, default: false },
  type: { type: String, default: '' },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  horizonLabel: { type: String, default: '' },
  savingReschedule: { type: Boolean, default: false },
});

const emit = defineEmits([
  'close',
  'refresh',
  'navigate',
  'whatsapp-task',
  'whatsapp-post',
  'reschedule',
]);

const drawerSearch = ref('');
const activeRescheduleId = ref(null);
const rescheduleDate = ref('');

const filteredItems = computed(() => {
  if (!drawerSearch.value || !drawerSearch.value.trim()) {
    return props.items;
  }
  const q = drawerSearch.value.trim().toLowerCase();
  return props.items.filter((item) =>
    (item.title && item.title.toLowerCase().includes(q)) ||
    (item.project_name && item.project_name.toLowerCase().includes(q)) ||
    (item.plan_name && item.plan_name.toLowerCase().includes(q)) ||
    (item.assignee_name && item.assignee_name.toLowerCase().includes(q)) ||
    (item.designer_name && item.designer_name.toLowerCase().includes(q))
  );
});

watch(
  () => [props.open, props.type],
  ([isOpen]) => {
    document.body.classList.toggle('drawer-open', Boolean(isOpen));
    if (isOpen) {
      drawerSearch.value = '';
      activeRescheduleId.value = null;
    } else {
      activeRescheduleId.value = null;
    }
  }
);

watch(
  () => props.items,
  (list) => {
    if (activeRescheduleId.value && !list.some((item) => item.id === activeRescheduleId.value)) {
      activeRescheduleId.value = null;
    }
  }
);

const startReschedule = (task) => {
  activeRescheduleId.value = task.id;
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  rescheduleDate.value = d.toISOString().slice(0, 16);
};

const cancelReschedule = () => {
  activeRescheduleId.value = null;
  rescheduleDate.value = '';
};

const handleRescheduleSubmit = (task) => {
  emit('reschedule', { task, dueDate: rescheduleDate.value });
};

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && props.open) {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.body.classList.remove('drawer-open');
});
</script>

<style scoped>
.spinner {
  display: inline-block;
  border: 3px solid rgba(125, 232, 220, 0.25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.spinner.large { width: 40px; height: 40px; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.is-spinning { display: inline-block; animation: spin 0.8s linear infinite; }

.drilldown-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 6, 23, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999999;
  display: flex;
  justify-content: flex-end;
  animation: fadeInDrawerOverlay 0.25s ease-out;
}

@keyframes fadeInDrawerOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drilldown-drawer {
  width: min(560px, 94vw);
  height: 100vh;
  background: linear-gradient(180deg, #10163a 0%, #0b0f2a 100%);
  border-left: 1px solid rgba(125, 232, 220, 0.25);
  box-shadow: -15px 0 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  animation: slideInDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Cairo', sans-serif;
  color: #edf0ff;
}

@keyframes slideInDrawer {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(14, 20, 56, 0.85);
  border-bottom: 1px solid rgba(137, 153, 226, 0.18);
}

.drawer-header-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.drawer-icon-badge {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: grid;
  place-items: center;
  font-size: 24px;
}

.drawer-title {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
}

.drawer-meta-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drawer-count-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.drawer-horizon-badge {
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-refresh-btn, .drawer-close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s;
}

.drawer-refresh-btn {
  width: 38px;
  height: 38px;
  font-size: 15px;
}

.drawer-refresh-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.2);
  color: #7de8dc;
  border-color: #7de8dc;
}

.drawer-close-btn {
  width: 38px;
  height: 38px;
  font-size: 16px;
  font-weight: 800;
}

.drawer-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: #ef4444;
}

.drawer-search-bar {
  padding: 12px 24px;
  position: relative;
  background: rgba(10, 15, 42, 0.6);
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
}

.drawer-search-icon {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #818cb9;
}

.drawer-search-input {
  width: 100%;
  padding: 10px 38px 10px 36px;
  background: rgba(16, 22, 60, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 12.5px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.drawer-search-input:focus {
  border-color: #7de8dc;
  box-shadow: 0 0 0 3px rgba(125, 232, 220, 0.15);
}

.drawer-clear-search {
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.drawer-loading-state, .drawer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 280px;
  color: #818cb9;
}

.drawer-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.drawer-empty-state h4 {
  color: #fff;
  margin: 0 0 6px 0;
  font-size: 17px;
}

.drawer-empty-state p {
  margin: 0;
  font-size: 12.5px;
  max-width: 320px;
}

.drawer-items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-item-card {
  background: rgba(18, 25, 68, 0.85);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 14px;
  padding: 16px 18px;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.drawer-item-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 232, 220, 0.35);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.drawer-item-card.is-urgent {
  border-right: 4px solid #ef4444;
}

.item-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
  flex-wrap: wrap;
}

.item-badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.urgent-pill {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.45);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}

.overdue-pill {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.priority-pill {
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(137, 153, 226, 0.15);
  color: #cbd5e1;
}

.priority-pill.prio-عالية, .priority-pill.prio-high {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.type-pill {
  background: rgba(168, 85, 247, 0.18);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.rejected-pill {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
}

.item-date-text {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.item-title {
  margin: 0 0 10px 0;
  font-size: 14.5px;
  font-weight: 800;
  color: #fff;
  line-height: 1.4;
}

.item-project-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.project-pill {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
}

.target-date-pill {
  background: rgba(137, 153, 226, 0.1);
  color: #a5b4fc;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
}

.rejected-by-pill {
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
}

.rejection-reason-callout {
  background: rgba(239, 68, 68, 0.1);
  border: 1px dashed rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.reason-label {
  font-size: 11px;
  font-weight: 800;
  color: #fca5a5;
  margin-bottom: 4px;
}

.reason-text {
  margin: 0;
  font-size: 12px;
  color: #fecaca;
  line-height: 1.45;
}

.item-person-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(137, 153, 226, 0.15);
  flex-wrap: wrap;
}

.person-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}

.person-avatar.purple-avatar {
  background: linear-gradient(135deg, #a855f7, #6d28d9);
}

.person-avatar.red-avatar {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
}

.person-details {
  display: flex;
  flex-direction: column;
}

.person-name {
  font-size: 12.5px;
  color: #fff;
}

.person-role {
  font-size: 10.5px;
  color: #818cb9;
}

.item-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.wa-contact-btn {
  background: rgba(37, 211, 102, 0.15);
  color: #25D366;
  border-color: rgba(37, 211, 102, 0.35);
}

.wa-contact-btn:hover {
  background: #25D366;
  color: #0b1132;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
  transform: translateY(-2px);
}

.reschedule-trigger-btn {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border-color: rgba(168, 85, 247, 0.3);
}

.reschedule-trigger-btn:hover {
  background: rgba(168, 85, 247, 0.28);
  color: #fff;
  border-color: #a855f7;
  transform: translateY(-2px);
}

.view-project-btn, .view-board-btn {
  background: rgba(137, 153, 226, 0.12);
  color: #7de8dc;
  border-color: rgba(125, 232, 220, 0.25);
}

.view-project-btn:hover, .view-board-btn:hover {
  background: rgba(125, 232, 220, 0.25);
  color: #fff;
  border-color: #7de8dc;
  transform: translateY(-2px);
}

.inline-reschedule-box {
  margin-top: 14px;
  padding: 12px;
  background: rgba(10, 15, 42, 0.85);
  border: 1px solid rgba(168, 85, 247, 0.35);
  border-radius: 10px;
}

.reschedule-box-header {
  font-size: 11px;
  font-weight: 700;
  color: #c084fc;
  margin-bottom: 8px;
}

.reschedule-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reschedule-native-input {
  flex: 1;
  min-width: 180px;
  padding: 6px 10px;
  background: rgba(16, 22, 60, 0.8);
  border: 1px solid rgba(137, 153, 226, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}

.reschedule-submit-btn {
  background: linear-gradient(135deg, #a855f7, #6d28d9);
  color: #fff;
  border: none;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s;
}

.reschedule-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.reschedule-cancel-btn {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(137, 153, 226, 0.2);
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
}

.reschedule-cancel-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.drawer-footer {
  padding: 16px 24px;
  background: rgba(14, 20, 56, 0.85);
  border-top: 1px solid rgba(137, 153, 226, 0.18);
  display: flex;
  justify-content: flex-end;
}

.drawer-close-footer-btn {
  background: rgba(137, 153, 226, 0.12);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #cbd5e1;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.drawer-close-footer-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

@media (max-width: 540px) {
  .drilldown-drawer {
    width: 100vw;
  }
  .drawer-header {
    padding: 14px 16px;
  }
  .drawer-search-bar {
    padding: 10px 16px;
  }
  .drawer-search-icon {
    right: 28px;
  }
  .drawer-clear-search {
    left: 28px;
  }
  .drawer-body {
    padding: 14px 16px;
  }
  .drawer-footer {
    padding: 12px 16px;
  }
  .item-actions-row {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
