<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="presentation" @click.self="emitClose">
      <div 
        ref="modalContent" 
        class="perm-modal-content" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="perm-modal-title" 
        tabindex="-1" 
        @keydown.esc="emitClose"
      >
        <!-- إغلاق -->
        <button class="modal-close" type="button" aria-label="إغلاق النافذة" @click="emitClose">
          <span aria-hidden="true">×</span>
        </button>

        <!-- الهيدر وبطاقة الموظف -->
        <div class="perm-header">
          <div class="user-info-banner">
            <div class="user-avatar-large">{{ getInitials(user?.name) }}</div>
            <div class="user-meta">
              <div class="user-title-row">
                <h3 id="perm-modal-title">إدارة صلاحيات الموظف</h3>
                <span class="job-chip" v-if="user?.job_title">{{ user?.job_title }}</span>
                <span class="role-chip">{{ user?.role === 'manager' ? 'مدير' : 'موظف' }}</span>
              </div>
              <p class="user-sub">
                الموظف: <strong>{{ user?.name }}</strong> ({{ user?.email }})
              </p>
            </div>
          </div>

          <!-- شريط الإجراءات السريعة والقوالب النموذجية -->
          <div class="presets-bar">
            <div class="presets-label">
              <span>⚡ قوالب سريعة:</span>
            </div>
            <div class="presets-pills">
              <button 
                v-for="(preset, key) in presets" 
                :key="key" 
                type="button" 
                class="preset-btn"
                :title="preset.description_ar"
                @click="applyPreset(preset.permissions)"
              >
                {{ preset.name_ar.split('(')[0] }}
              </button>
            </div>
            <div class="bulk-actions">
              <button type="button" class="bulk-btn select-all" @click="selectAll">تحديد الكل</button>
              <button type="button" class="bulk-btn deselect-all" @click="deselectAll">إلغاء التحديد</button>
            </div>
          </div>
        </div>

        <!-- حالة التحميل -->
        <div v-if="loading" class="perm-loading">
          <span class="spinner" aria-hidden="true"></span>
          <span>جارٍ جلب مصفوفة الصلاحيات...</span>
        </div>

        <!-- محتوى الصلاحيات مجمعة حسب الموديول -->
        <div v-else class="perm-body custom-scrollbar">
          <div class="modules-grid">
            <div 
              v-for="group in modules" 
              :key="group.module" 
              class="module-card"
              :class="{ 'has-selected': isModulePartiallySelected(group) }"
            >
              <div class="module-card-header">
                <div class="module-title-wrap">
                  <span class="module-icon">{{ getModuleIcon(group.module) }}</span>
                  <span class="module-title">{{ group.module_label }}</span>
                  <span class="module-count">
                    ({{ countSelectedInModule(group) }} / {{ group.permissions.length }})
                  </span>
                </div>
                <button 
                  type="button" 
                  class="module-toggle-all"
                  @click="toggleModule(group)"
                >
                  {{ isModuleAllSelected(group) ? 'إلغاء الموديول' : 'تحديد الموديول' }}
                </button>
              </div>

              <div class="permissions-list">
                <label 
                  v-for="perm in group.permissions" 
                  :key="perm.code" 
                  class="permission-item"
                  :class="{ active: selectedCodes.includes(perm.code) }"
                  :title="perm.description_ar || perm.name_ar"
                >
                  <input 
                    type="checkbox" 
                    :value="perm.code" 
                    v-model="selectedCodes" 
                    class="perm-checkbox"
                  />
                  <div class="perm-label-wrap">
                    <span class="perm-action-badge" :class="'action-' + perm.action">
                      {{ getActionIcon(perm.action) }}
                    </span>
                    <span class="perm-name">{{ perm.name_ar }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- الفوتر مع زر الحفظ والعداد -->
        <div class="perm-footer">
          <div class="selected-summary">
            <span>تم تحديد <strong>{{ selectedCodes.length }}</strong> صلاحية للموظف</span>
          </div>
          <div class="footer-actions">
            <button type="button" class="cancel-btn" @click="emitClose">إلغاء</button>
            <button 
              type="button" 
              class="save-btn" 
              :disabled="saving" 
              @click="savePermissions"
            >
              <span v-if="saving" class="spinner" aria-hidden="true"></span>
              <span>{{ saving ? 'جارٍ الحفظ...' : '💾 حفظ الصلاحيات' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import api from '../axios';
import alertService from '../services/alertService';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'updated']);

const loading = ref(false);
const saving = ref(false);
const modules = ref([]);
const presets = ref({});
const selectedCodes = ref([]);

// ذاكرة تخزين مؤقت للصلاحيات العامة
let cachedModules = null;
let cachedPresets = null;

const emitClose = () => {
  emit('close');
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

const getModuleIcon = (module) => {
  const icons = {
    clients: '👥',
    vault: '🔒',
    projects: '📁',
    tasks: '📋',
    plans: '📅',
    posts: '📊',
    quick_tasks: '⚡',
    workload: '⏱️',
    departments: '🏢',
    users: '👤',
    logs: '📜',
    trash: '🗑️',
  };
  return icons[module] || '⚙️';
};

const getActionIcon = (action) => {
  const icons = {
    view: '👁️',
    create: '➕',
    edit: '✏️',
    delete: '🗑️',
    approve: '✅',
    reject: '❌',
    assign: '👤',
    manage: '⚙️',
  };
  return icons[action] || '•';
};

// جلب الصلاحيات العامة وصلاحيات المستخدم
const loadData = async () => {
  if (!props.user?.id) return;
  loading.value = true;
  try {
    // 1. جلب قائمة كل الصلاحيات إذا لم تكن مخزنة مسبقاً
    if (!cachedModules) {
      const res = await api.get('/permissions');
      cachedModules = res.data.modules || [];
      cachedPresets = res.data.presets || {};
    }
    modules.value = cachedModules;
    presets.value = cachedPresets;

    // 2. جلب الصلاحيات المحددة للمستخدم
    const userRes = await api.get(`/permissions/users/${props.user.id}`);
    selectedCodes.value = [...(userRes.data.permission_codes || [])];
  } catch (error) {
    console.error('Error loading permissions:', error);
    alertService.toast(error.response?.data?.message || 'تعذر جلب الصلاحيات', 'error');
  } finally {
    loading.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadData();
  }
});

// عمليات سريعة
const selectAll = () => {
  const allCodes = [];
  modules.value.forEach(m => {
    m.permissions.forEach(p => allCodes.push(p.code));
  });
  selectedCodes.value = Array.from(new Set(allCodes));
};

const deselectAll = () => {
  selectedCodes.value = [];
};

const applyPreset = (codes) => {
  selectedCodes.value = [...codes];
  alertService.toast('تم تطبيق القالب المحدد في القائمة، اضغط حفظ للتأكيد.', 'info');
};

const countSelectedInModule = (group) => {
  return group.permissions.filter(p => selectedCodes.value.includes(p.code)).length;
};

const isModuleAllSelected = (group) => {
  if (!group.permissions?.length) return false;
  return group.permissions.every(p => selectedCodes.value.includes(p.code));
};

const isModulePartiallySelected = (group) => {
  return countSelectedInModule(group) > 0;
};

const toggleModule = (group) => {
  const allSelected = isModuleAllSelected(group);
  const groupCodes = group.permissions.map(p => p.code);

  if (allSelected) {
    // إزالة الكل من هذا الموديول
    selectedCodes.value = selectedCodes.value.filter(c => !groupCodes.includes(c));
  } else {
    // إضافة الكل من هذا الموديول
    const newSet = new Set([...selectedCodes.value, ...groupCodes]);
    selectedCodes.value = Array.from(newSet);
  }
};

// حفظ الصلاحيات
const savePermissions = async () => {
  if (!props.user?.id) return;
  saving.value = true;
  try {
    const res = await api.post(`/permissions/users/${props.user.id}`, {
      permission_codes: selectedCodes.value,
    });

    alertService.toast(res.data?.message || 'تم تحديث صلاحيات الموظف بنجاح 🚀', 'success');

    // إذا كان الموظف المعدل هو المستخدم المسجل حالياً، نحدث الكاش المحلي فوراً
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const currentUser = JSON.parse(stored);
        if (currentUser.id === props.user.id) {
          currentUser.permission_codes = selectedCodes.value;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
    } catch (e) {
      console.error(e);
    }

    emit('updated', { userId: props.user.id, permissions: selectedCodes.value });
    emitClose();
  } catch (error) {
    console.error('Error saving permissions:', error);
    alertService.toast(error.response?.data?.message || 'حدث خطأ أثناء حفظ الصلاحيات', 'error');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.perm-modal-content {
  background: #0b112c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15);
  border-radius: 18px;
  width: 100%;
  max-width: 980px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  color: #e2e8f0;
  direction: rtl;
  font-family: 'Cairo', sans-serif;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-close {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}
.modal-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

/* Header */
.perm-header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(30, 41, 89, 0.3) 0%, transparent 100%);
}

.user-info-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.user-avatar-large {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #ffffff;
  font-weight: 700;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
}

.user-meta {
  flex: 1;
}

.user-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-title-row h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.job-chip {
  background: rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.3);
  color: #38bdf8;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.role-chip {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.user-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

/* Presets Bar */
.presets-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 10px 14px;
  border-radius: 12px;
}

.presets-label {
  font-size: 12px;
  font-weight: 700;
  color: #f1f5f9;
}

.presets-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.preset-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  color: #ffffff;
  transform: translateY(-1px);
}

.bulk-actions {
  display: flex;
  gap: 6px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-right: 8px;
}

.bulk-btn {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.bulk-btn.select-all {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}
.bulk-btn.select-all:hover {
  background: rgba(52, 211, 153, 0.15);
}
.bulk-btn.deselect-all {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}
.bulk-btn.deselect-all:hover {
  background: rgba(248, 113, 113, 0.15);
}

/* Loading & Body */
.perm-loading {
  padding: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #94a3b8;
  font-size: 14px;
}

.perm-body {
  padding: 20px 28px;
  overflow-y: auto;
  flex: 1;
}

.modules-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px 18px;
  transition: all 0.2s;
}
.module-card.has-selected {
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.03);
}

.module-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.module-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.module-icon {
  font-size: 18px;
}
.module-title {
  font-weight: 700;
  font-size: 14px;
  color: #f8fafc;
}
.module-count {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.module-toggle-all {
  background: transparent;
  border: none;
  color: #60a5fa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  font-family: inherit;
}
.module-toggle-all:hover {
  background: rgba(96, 165, 250, 0.1);
  color: #93c5fd;
}

/* Permissions List */
.permissions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.permission-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}
.permission-item.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.4);
}

.perm-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  cursor: pointer;
  display: grid;
  place-content: center;
  margin: 0;
  transition: all 0.2s;
}
.perm-checkbox:checked {
  background: #6366f1;
  border-color: #6366f1;
}
.perm-checkbox:checked::before {
  content: "";
  width: 8px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translate(1px, -1px);
}

.perm-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.perm-action-badge {
  font-size: 11px;
  display: inline-flex;
}

.perm-name {
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.permission-item.active .perm-name {
  color: #ffffff;
  font-weight: 600;
}

/* Footer */
.perm-footer {
  padding: 16px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 17, 44, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.selected-summary {
  font-size: 13px;
  color: #94a3b8;
}
.selected-summary strong {
  color: #60a5fa;
  font-size: 15px;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.save-btn {
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  border: none;
  color: #ffffff;
  padding: 8px 22px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  transition: all 0.2s;
}
.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 640px) {
  .permissions-list {
    grid-template-columns: 1fr;
  }
  .presets-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
