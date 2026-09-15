<template>
  <section class="system-logs-page" dir="rtl">
    
    <!-- الترويسة مع زر الحذف المدمج -->
    <div class="page-header d-flex justify-between align-center mb-4">
      <div>
        <span class="eyebrow">مراقبة النظام | Audit Trail 🔍</span>
        <h2 class="page-title">سجلات النظام وحركات المستخدمين</h2>
      </div>
      <div>
        <button @click="openManageLogsModal" class="btn-danger-soft">
          🗑️ إدارة السجلات وتفريغ المساحة
        </button>
      </div>
    </div>

    <!-- شريط الفلاتر المدمج (Compact Toolbar) -->
    <div class="glass-panel filter-toolbar mb-4">
      <div class="filter-item">
        <select v-model="filters.role" class="form-control-sm" @change="fetchLogs(1)">
          <option value="">👤 كل الصلاحيات</option>
          <option value="manager">إدارة (Manager)</option>
          <option value="employee">موظف (Employee)</option>
        </select>
      </div>

      <div class="filter-item">
        <select v-model="filters.module" class="form-control-sm" @change="fetchLogs(1)">
          <option value="">📁 كل الأقسام</option>
          <option value="Auth">المصادقة</option>
          <option value="Task">المهام</option>
          <option value="Project">المشاريع</option>
          <option value="ContentPlan">خطط المحتوى</option>
          <option value="PlanPost">منشورات الخطط</option>
          <option value="User">الموظفين</option>
        </select>
      </div>

      <div class="filter-item">
        <select v-model="filters.event" class="form-control-sm" @change="fetchLogs(1)">
          <option value="">⚡ كل الأحداث</option>
          <option value="created">إضافة (Created)</option>
          <option value="updated">تعديل (Updated)</option>
          <option value="deleted">حذف (Deleted)</option>
        </select>
      </div>

      <div class="filter-item d-flex align-center gap-2 date-range">
        <span class="muted text-sm">من:</span>
        <input type="date" v-model="filters.date_from" class="form-control-sm date-input" @change="fetchLogs(1)" />
        <span class="muted text-sm">إلى:</span>
        <input type="date" v-model="filters.date_to" class="form-control-sm date-input" @change="fetchLogs(1)" />
      </div>

      <div class="filter-actions d-flex gap-2">
        <button @click="resetFilters" class="btn-icon" title="إعادة ضبط الفلاتر">🔄</button>
      </div>
    </div>

    <!-- جدول السجلات الأنيق -->
    <div class="glass-panel table-container relative-container">
      <div v-if="loading" class="inner-loading-overlay">
        <span class="spinner"></span>
      </div>

      <div class="table-responsive">
        <table class="logs-table">
          <thead>
            <tr>
              <th>التوقيت ⏱️</th>
              <th>المستخدم 👤</th>
              <th>القسم 📁</th>
              <th>الحدث ⚡</th>
              <th>الوصف</th>
              <th class="text-center">إجراء</th>
            </tr>
          </thead>
          <tbody v-if="logsData && logsData.data.length > 0">
            <tr v-for="log in logsData.data" :key="log.id">
              <td>
                <div class="time-cell">
                  <span class="date-text">{{ log.created_at.split(' ')[0] }}</span>
                  <span class="time-text muted">{{ log.created_at.split(' ').slice(1).join(' ') }}</span>
                </div>
              </td>
              <td>
                <div class="user-info-cell">
                  <strong>{{ log.causer }}</strong>
                  <span :class="['role-dot', log.causer_role]" :title="translateRole(log.causer_role)"></span>
                </div>
              </td>
              <td><span class="module-text">{{ translateModule(log.module) }}</span></td>
              <td><span :class="['badge-soft', getEventBadgeClass(log.event)]">{{ translateEvent(log.event) }}</span></td>
              <td class="desc-cell">{{ log.description }}</td>
              <td class="text-center">
                <button @click="openDetails(log)" class="btn-view" v-if="hasDetails(log)" title="التفاصيل">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <span v-else class="muted">-</span>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="text-center py-5 empty-state">
                <div class="text-4xl mb-2">📭</div>
                <p>لا توجد سجلات مطابقة لخيارات البحث الحالية.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- أزرار التنقل (Pagination) -->
      <div v-if="logsData && logsData.last_page > 1" class="pagination-wrapper mt-3">
        <button class="page-btn" :disabled="logsData.current_page === 1" @click="fetchLogs(logsData.current_page - 1)">❮</button>
        <span class="page-info">صفحة <strong>{{ logsData.current_page }}</strong> من {{ logsData.last_page }}</span>
        <button class="page-btn" :disabled="logsData.current_page === logsData.last_page" @click="fetchLogs(logsData.current_page + 1)">❯</button>
      </div>
    </div>

    <!-- نافذة إدارة السجلات (الحذف) المدمجة -->
    
    <Teleport to="body">
      <div v-if="isManageModalOpen" class="modal-overlay" @click.self="closeManageModal">
      <div class="modal-content manage-modal">
        <div class="modal-header">
          <h3>🗑️ إدارة السجلات وتفريغ المساحة</h3>
          <button class="close-btn" @click="closeManageModal">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="muted text-sm mb-4">اختر طريقة الحذف المناسبة. تذكر أن هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
          
          <!-- خيارات الحذف (Radio) -->
          <div class="delete-options mb-4">
            <label class="radio-option">
              <input type="radio" v-model="deleteMode" value="period" />
              <span>حذف فترة محددة فقط</span>
            </label>
            <label class="radio-option text-red">
              <input type="radio" v-model="deleteMode" value="all" />
              <span>مسح جميع السجلات من النظام كلياً (محو شامل)</span>
            </label>
          </div>

          <!-- اختيار التاريخ (يظهر فقط إذا اختار فترة) -->
          <div v-if="deleteMode === 'period'" class="date-picker-box mb-4">
            <div class="d-flex gap-2 align-center">
              <div class="flex-1">
                <label class="text-xs muted block mb-1">من تاريخ</label>
                <input type="date" v-model="deleteDates.from" class="form-control" />
              </div>
              <div class="flex-1">
                <label class="text-xs muted block mb-1">إلى تاريخ</label>
                <input type="date" v-model="deleteDates.to" class="form-control" />
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button @click="closeManageModal" class="btn-cancel flex-1">إلغاء</button>
            <button @click="executeDelete" class="btn-danger flex-2" :disabled="isDeleting || (deleteMode === 'period' && (!deleteDates.from || !deleteDates.to))">
              <span v-if="isDeleting">جارِ التنفيذ...</span>
              <span v-else>تأكيد الحذف النهائي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>


    <!-- نافذة تفاصيل السجل (مقارنة القديم والجديد) -->
    
    <Teleport to="body">
      <div v-if="isDetailsModalOpen" class="modal-overlay" @click.self="closeDetails">
      <div class="modal-content details-modal">
        <div class="modal-header">
          <h3>التفاصيل الدقيقة للحدث</h3>
          <button class="close-btn" @click="closeDetails">✕</button>
        </div>
        <div class="modal-body">
          <div class="log-context mb-4">
            <span class="badge-soft blue-badge">{{ translateModule(selectedLog.module) }}</span>
            <p class="mt-2 text-sm">{{ selectedLog.description }} بواسطة <strong>{{ selectedLog.causer }}</strong></p>
          </div>
          
          <div v-if="selectedLog.event === 'updated' && selectedLog.properties.old" class="diff-container">
            <div class="diff-row header-row">
              <div class="diff-col">اسم الحقل</div>
              <div class="diff-col old-val">قبل التعديل</div>
              <div class="diff-col new-val">بعد التعديل</div>
            </div>
            <div class="diff-row" v-for="(newVal, key) in selectedLog.properties.attributes" :key="key">
              <div class="diff-col field-name">{{ translateField(key) }}</div>
              <div class="diff-col old-data">{{ selectedLog.properties.old[key] ?? '-' }}</div>
              <div class="diff-col new-data">{{ newVal ?? '-' }}</div>
            </div>
          </div>
          <div v-else class="raw-data">
            <pre dir="ltr">{{ JSON.stringify(selectedLog.properties.attributes || selectedLog.properties, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
    </Teleport>


  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../axios';

// 🔴 تجهيز التواريخ الافتراضية (اليوم و 30 يوم لورا) 🔴
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getThirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

const loading = ref(true);
const logsData = ref({ data: [], current_page: 1, last_page: 1 });

// تعيين القيم الافتراضية
const filters = ref({ 
  role: '', 
  module: '', 
  event: '', 
  date_from: getThirtyDaysAgo(), 
  date_to: getTodayDate() 
});

// متغيرات نوافذ (Modals)
const isDetailsModalOpen = ref(false);
const selectedLog = ref(null);

const isManageModalOpen = ref(false);
const deleteMode = ref('period');
const deleteDates = ref({ from: '', to: '' });
const isDeleting = ref(false);

const fetchLogs = async (page = 1) => {
  loading.value = true;
  try {
    const response = await api.get('/system-logs', { params: { page, ...filters.value } });
    logsData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = { 
    role: '', module: '', event: '', 
    date_from: getThirtyDaysAgo(), 
    date_to: getTodayDate() 
  };
  fetchLogs(1);
};

// --- دوال إدارة وحذف السجلات ---
const openManageLogsModal = () => {
  deleteMode.value = 'period';
  deleteDates.value = { from: '', to: '' };
  isManageModalOpen.value = true;
};
const closeManageModal = () => { isManageModalOpen.value = false; };

const executeDelete = async () => {
  isDeleting.value = true;
  try {
    const payload = {
      delete_all: deleteMode.value === 'all',
      date_from: deleteMode.value === 'period' ? deleteDates.value.from : null,
      date_to: deleteMode.value === 'period' ? deleteDates.value.to : null,
    };
    
    const response = await api.delete('/system-logs', { data: payload });
    isManageModalOpen.value = false;
    alert(response.data.message);
    fetchLogs(1); 
  } catch (error) {
    alert(error.response?.data?.message || 'حدث خطأ أثناء الحذف.');
  } finally {
    isDeleting.value = false;
  }
};

// --- دوال التفاصيل ---
const hasDetails = (log) => log.properties && (log.properties.attributes || Object.keys(log.properties).length > 0);
const openDetails = (log) => { selectedLog.value = log; isDetailsModalOpen.value = true; };
const closeDetails = () => { isDetailsModalOpen.value = false; selectedLog.value = null; };

// --- دوال الترجمة والتجميل ---
const translateModule = (m) => ({ Task: 'المهام', Project: 'المشاريع', ContentPlan: 'خطط المحتوى', PlanPost: 'منشورات', User: 'الموظفين', Auth: 'المصادقة' }[m] || m);
const translateEvent = (e) => ({ created: 'إضافة', updated: 'تعديل', deleted: 'حذف' }[e] || 'أخرى');
const translateField = (f) => ({ status: 'الحالة', title: 'العنوان', description: 'الوصف', due_date: 'التسليم', assigned_to: 'المنفذ' }[f] || f);
const translateRole = (role) => ({ manager: 'إدارة', employee: 'موظف', system: 'نظام' }[role] || role);

const getEventBadgeClass = (e) => ({ created: 'green', updated: 'blue', deleted: 'red' }[e] || 'gray');

onMounted(() => fetchLogs(1));
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
.system-logs-page { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 40px; }

/* Utilities */
.mb-4 { margin-bottom: 25px; } .mt-4 { margin-top: 20px; } .mb-3 { margin-bottom: 15px; } .mt-3 { margin-top: 15px; } .mt-2 { margin-top: 10px; }
.d-flex { display: flex; } .justify-between { justify-content: space-between; } .align-center { align-items: center; } .gap-2 { gap: 10px; }
.text-center { text-align: center; } .text-red { color: #f87171 !important; } .muted { color: #818cb9; } .text-sm { font-size: 12px; } .text-xs { font-size: 11px; }
.block { display: block; } .flex-1 { flex: 1; } .flex-2 { flex: 2; }

/* Header */
.eyebrow { color: #f59e0b; font-size: 12px; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
.page-title { margin: 0; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.btn-danger-soft { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 16px; border-radius: 8px; font-family: 'Cairo'; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-danger-soft:hover { background: rgba(239, 68, 68, 0.2); color: #fff; }

/* Compact Toolbar */
.glass-panel { background: rgba(15, 22, 61, 0.5); border: 1px solid rgba(137, 153, 226, 0.12); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 12px 15px; }
.filter-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.form-control-sm { background: rgba(6, 11, 37, 0.6); border: 1px solid rgba(137, 153, 226, 0.15); color: #eef0ff; padding: 6px 12px; border-radius: 6px; font-family: 'Cairo'; font-size: 12px; outline: none; min-width: 130px; transition: 0.2s; }
.form-control-sm:focus, .form-control:focus { border-color: #3b82f6; }
.date-input { min-width: 110px; padding: 5px 8px; }
.btn-icon { background: rgba(137, 153, 226, 0.1); border: none; color: #aab5da; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: grid; place-items: center; transition: 0.2s; }
.btn-icon:hover { background: rgba(137, 153, 226, 0.2); color: #fff; }

/* Table */
.relative-container { position: relative; padding: 0; overflow: hidden; }
.table-responsive { overflow-x: auto; width: 100%; }
.logs-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: right; }
.logs-table th { padding: 14px 20px; color: #aab5da; border-bottom: 1px solid rgba(137, 153, 226, 0.1); font-weight: 600; font-size: 12px; background: rgba(10, 15, 44, 0.3); white-space: nowrap; }
.logs-table td { padding: 14px 20px; border-bottom: 1px solid rgba(137, 153, 226, 0.05); vertical-align: middle; }
.logs-table tr:hover td { background: rgba(255,255,255,0.015); }
.empty-state { color: #64748b; }

/* Table Inner Elements */
.time-cell { display: flex; flex-direction: column; gap: 2px; }
.date-text { font-weight: 600; color: #eef0ff; }
.time-text { font-size: 11px; }
.user-info-cell { display: flex; align-items: center; gap: 8px; }
.role-dot { width: 8px; height: 8px; border-radius: 50%; }
.role-dot.manager { background: #f59e0b; box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
.role-dot.employee { background: #3b82f6; }
.module-text { font-weight: 600; color: #aab5da; }
.desc-cell { max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #c3cbe4; }
.btn-view { background: transparent; border: none; color: #8fc9ff; cursor: pointer; padding: 4px; border-radius: 4px; transition: 0.2s; display: inline-flex; }
.btn-view:hover { background: rgba(143, 201, 255, 0.1); color: #fff; }

/* Soft Badges */
.badge-soft { padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-block; }
.badge-soft.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-soft.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.badge-soft.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge-soft.gray { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }

/* Pagination */
.pagination-wrapper { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-top: 1px solid rgba(137, 153, 226, 0.05); }
.page-btn { background: rgba(137, 153, 226, 0.1); border: none; color: #eef0ff; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.page-btn:hover:not(:disabled) { background: #3b82f6; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 12px; color: #818cb9; } .page-info strong { color: #fff; }

/* Modals General */
.modal-overlay { position: fixed;  background: rgba(4, 7, 20, 0.8); backdrop-filter: blur(4px); display: grid; place-items: center;  padding: 20px;        inset: 0 !important; z-index: 9999 !important; }
.modal-content { background: #0f163d; border-radius: 16px; border: 1px solid rgba(137, 153, 226, 0.15); width: 100%; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); animation: scaleUp 0.2s ease-out; }
@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid rgba(137, 153, 226, 0.1); background: rgba(0,0,0,0.15); }
.modal-header h3 { margin: 0; font-size: 16px; color: #fff; font-weight: 700; }
.close-btn { background: none; border: none; color: #aab5da; font-size: 16px; cursor: pointer; } .close-btn:hover { color: #fff; }
.modal-body { padding: 24px; max-height: 75vh; overflow-y: auto; }

/* Manage / Delete Modal */
.manage-modal { max-width: 450px; }
.radio-option { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid rgba(137, 153, 226, 0.1); border-radius: 8px; cursor: pointer; margin-bottom: 10px; transition: 0.2s; background: rgba(6, 11, 37, 0.3); font-size: 13px; font-weight: 600; }
.radio-option:hover { background: rgba(137, 153, 226, 0.05); }
.radio-option.text-red { color: #fca5a5; border-color: rgba(239, 68, 68, 0.2); }
.radio-option input[type="radio"] { accent-color: #3b82f6; width: 16px; height: 16px; }
.radio-option.text-red input[type="radio"] { accent-color: #ef4444; }
.date-picker-box { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border: 1px dashed rgba(137, 153, 226, 0.2); }
.form-control { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(137, 153, 226, 0.2); background: rgba(6, 11, 37, 0.8); color: #fff; font-family: 'Cairo'; font-size: 13px; outline: none; }
.btn-cancel, .btn-danger { padding: 10px; border-radius: 8px; font-weight: 700; font-family: 'Cairo'; cursor: pointer; border: none; font-size: 13px; transition: 0.2s; }
.btn-cancel { background: rgba(137, 153, 226, 0.1); color: #aab5da; } .btn-cancel:hover { background: rgba(137, 153, 226, 0.2); color: #fff; }
.btn-danger { background: #ef4444; color: #fff; } .btn-danger:hover:not(:disabled) { background: #dc2626; } .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Details Modal (Diff) */
.details-modal { max-width: 650px; }
.log-context { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border-right: 3px solid #3b82f6; }
.diff-container { border: 1px solid rgba(137, 153, 226, 0.1); border-radius: 8px; overflow: hidden; background: rgba(6, 11, 37, 0.4); }
.diff-row { display: grid; grid-template-columns: 1fr 1.5fr 1.5fr; border-bottom: 1px solid rgba(137, 153, 226, 0.05); } .diff-row:last-child { border-bottom: none; }
.header-row { background: rgba(0,0,0,0.4); font-weight: 700; font-size: 12px; color: #aab5da; }
.diff-col { padding: 10px 15px; font-size: 12.5px; word-break: break-word; display: flex; align-items: center; }
.field-name { background: rgba(0,0,0,0.2); font-weight: 600; color: #8fc9ff; }
.old-val { color: #fca5a5; } .old-data { color: #f87171; text-decoration: line-through; opacity: 0.8; }
.new-val { color: #6ee7b7; } .new-data { color: #34d399; font-weight: 600; }
.raw-data pre { background: #000; padding: 15px; border-radius: 8px; font-size: 11px; color: #a5b4fc; overflow-x: auto; margin: 0; }

.inner-loading-overlay { position: absolute; inset: 0; background: rgba(10, 15, 44, 0.7); display: grid; place-items: center; z-index: 10; }
.spinner { width: 35px; height: 35px; border: 3px solid rgba(59, 130, 246, 0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .filter-toolbar { flex-direction: column; align-items: stretch; }
  .filter-item { width: 100%; }
  .date-range { flex-direction: column; align-items: stretch; }
  .diff-row { grid-template-columns: 1fr; border-bottom: 2px solid rgba(137,153,226,0.1); }
  .header-row { display: none; }
  .diff-col { padding: 8px; border-bottom: 1px solid rgba(137,153,226,0.05); }
}
</style>