<template>
  <section class="trash-page" dir="rtl">
    
    <!-- الترويسة الرئيسية -->
    <div class="page-header d-flex justify-between align-center mb-4">
      <div>
        <span class="eyebrow">🗑️ مركز إدارة المحذوفات | Recovery Center</span>
        <h2 class="page-title">سلة المهملات</h2>
        <p class="page-subtitle">
          استعراض واستعادة العناصر المحذوفة مؤقتاً، أو حذفها نهائياً من قاعدة البيانات.
        </p>
      </div>

      <div class="header-actions d-flex gap-2 align-center">
        <button 
          type="button" 
          @click="openRestoreAllModal" 
          class="btn-success-soft"
          :disabled="loading || currentCategoryCount === 0"
          title="استعادة كل عناصر القسم الحالي"
        >
          <span>🔄</span> استعادة الكل ({{ currentCategoryCount }})
        </button>

        <button 
          type="button" 
          @click="openEmptyTrashModal" 
          class="btn-danger-soft"
          :disabled="loading || currentCategoryCount === 0"
          title="تفريغ سلة هذا القسم نهائياً"
        >
          <span>🔥</span> تفريغ سلة القسم
        </button>

        <button 
          type="button" 
          @click="refreshCurrent" 
          class="btn-icon" 
          :class="{ spinning: loading }"
          title="تحديث البيانات"
        >
          🔄
        </button>
      </div>
    </div>

    <!-- ألسنة التبويب للكاتيجوريز (Category Tabs / Pills) -->
    <div class="category-tabs-container mb-4">
      <div class="category-tabs">
        <button 
          type="button"
          v-for="cat in categories" 
          :key="cat.id"
          class="category-tab-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="changeCategory(cat.id)"
        >
          <span class="tab-icon">{{ cat.icon }}</span>
          <span class="tab-label">{{ cat.label }}</span>
          <span class="tab-badge" :class="{ 'has-items': counts[cat.id] > 0 }">
            {{ counts[cat.id] || 0 }}
          </span>
        </button>
      </div>

      <!-- إجمالي كل المحذوفات -->
      <div class="total-trashed-badge">
        <span class="dot"></span>
        <span>إجمالي المحذوفات: <strong>{{ counts.total || 0 }}</strong></span>
      </div>
    </div>

    <!-- شريط البحث والتصفية -->
    <div class="glass-panel filter-toolbar mb-4 d-flex justify-between align-center">
      <div class="search-box flex-1">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="handleSearchInput"
          :placeholder="`بحث في ${activeCategoryObj.label} المحذوفة...`" 
          class="form-control-search"
        />
        <button 
          v-if="searchQuery" 
          type="button" 
          @click="clearSearch" 
          class="clear-search-btn"
        >
          ✕
        </button>
      </div>

      <div class="category-summary text-sm muted">
        <span>عرض: <strong>{{ pagination.total || items.length }}</strong> عنصر في قسم <strong>{{ activeCategoryObj.label }}</strong></span>
      </div>
    </div>

    <!-- جدول عرض المحذوفات -->
    <div class="glass-panel table-container relative-container">
      <div v-if="loading" class="inner-loading-overlay">
        <span class="spinner"></span>
        <span class="loading-text">جارٍ تحميل المحذوفات...</span>
      </div>

      <div class="table-responsive">
        <table class="trash-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">#</th>
              <th>العنصر 📄</th>
              <th v-if="activeCategory === 'clients'">وسائل الاتصال 📞</th>
              <th v-if="activeCategory === 'users'">الدور والقسم 👥</th>
              <th v-if="activeCategory === 'projects'">الأقسام المشاركة 🏢</th>
              <th v-if="activeCategory === 'plans'">العميل التابع له 🏢</th>
              <th v-if="activeCategory === 'departments'">الوصف والتفاصيل 📝</th>
              <th>البيانات المرتبطة 📊</th>
              <th>تاريخ وساعة الحذف ⏱️</th>
              <th style="text-align: center; width: 180px;">الإجراءات ⚡</th>
            </tr>
          </thead>

          <tbody v-if="items.length > 0">
            <tr v-for="(item, index) in items" :key="item.id">
              <td class="row-num-cell">{{ ((pagination.current_page - 1) * pagination.per_page) + index + 1 }}</td>
              
              <!-- عمود العنصر الأساسي -->
              <td>
                <div class="item-main-cell">
                  <div class="item-avatar-icon">
                    <img v-if="item.logo" :src="item.logo" class="client-logo-mini" alt="Logo" />
                    <span v-else>{{ activeCategoryObj.icon }}</span>
                  </div>
                  <div class="item-text">
                    <strong class="item-title">{{ getItemTitle(item) }}</strong>
                    <small v-if="getItemSubtitle(item)" class="item-subtitle">{{ getItemSubtitle(item) }}</small>
                  </div>
                </div>
              </td>

              <!-- أعمدة مخصصة حسب التصنيف -->
              <td v-if="activeCategory === 'clients'">
                <div class="contact-info-cell">
                  <div v-if="item.emails" class="text-xs">✉️ {{ formatContactField(item.emails) }}</div>
                  <div v-if="item.phones" class="text-xs mt-1">📱 {{ formatContactField(item.phones) }}</div>
                  <span v-if="!item.emails && !item.phones" class="muted text-xs">—</span>
                </div>
              </td>

              <td v-if="activeCategory === 'users'">
                <div class="user-role-cell">
                  <span class="badge-role" :class="item.role">{{ translateRole(item.role) }}</span>
                  <span v-if="item.departments && item.departments.length > 0" class="dept-tag mt-1">
                    📁 {{ item.departments.map(d => d.name).join('، ') }}
                  </span>
                  <span v-else-if="item.department" class="dept-tag mt-1">
                    📁 {{ item.department.name }}
                  </span>
                </div>
              </td>

              <td v-if="activeCategory === 'projects'">
                <div class="project-depts-cell">
                  <div v-if="item.departments && item.departments.length > 0" class="d-flex gap-1 flex-wrap">
                    <span v-for="d in item.departments" :key="d.id" class="dept-badge">
                      {{ d.name }}
                    </span>
                  </div>
                  <span v-else class="muted text-xs">عام (بدون أقسام)</span>
                </div>
              </td>

              <td v-if="activeCategory === 'plans'">
                <div class="plan-client-cell">
                  <strong v-if="item.client" style="color: #60a5fa;">🏢 {{ item.client.name }}</strong>
                  <span v-else class="muted text-xs">غير محدد</span>
                </div>
              </td>

              <td v-if="activeCategory === 'departments'">
                <div class="dept-desc-cell">
                  <span v-if="item.description" class="text-xs">{{ item.description }}</span>
                  <span v-else class="muted text-xs">—</span>
                </div>
              </td>

              <!-- البيانات المرتبطة -->
              <td>
                <div class="related-data-cell">
                  <span v-if="activeCategory === 'clients'" class="badge-soft blue">
                    📋 {{ item.plans_count || 0 }} خطة محتوى
                  </span>
                  <span v-else-if="activeCategory === 'users'" class="badge-soft purple">
                    💼 {{ item.job_title || 'موظف' }}
                  </span>
                  <span v-else-if="activeCategory === 'projects'" class="badge-soft blue">
                    📝 {{ item.tasks_count || 0 }} مهمة
                  </span>
                  <span v-else-if="activeCategory === 'plans'" class="badge-soft emerald">
                    📌 {{ item.posts_count || 0 }} منشور
                  </span>
                  <span v-else-if="activeCategory === 'departments'" class="badge-soft purple">
                    👥 {{ item.users_count || 0 }} موظف | 📁 {{ item.projects_count || 0 }} مشروع
                  </span>
                </div>
              </td>

              <!-- تاريخ الحذف -->
              <td>
                <div class="deleted-time-cell">
                  <span class="date-text text-danger">{{ formatDate(item.deleted_at) }}</span>
                  <span class="time-relative muted text-xs">{{ formatRelativeTime(item.deleted_at) }}</span>
                </div>
              </td>

              <!-- أزرار الإجراءات -->
              <td class="text-center">
                <div class="action-buttons-group">
                  <button 
                    type="button" 
                    @click="restoreItem(item)" 
                    class="action-btn btn-restore"
                    :disabled="item._processing"
                    title="استعادة العنصر فوراً"
                  >
                    <span>🔄</span>
                    <span>استعادة</span>
                  </button>

                  <button 
                    type="button" 
                    @click="openForceDeleteModal(item)" 
                    class="action-btn btn-force-delete"
                    :disabled="item._processing"
                    title="حذف نهائي لا رجعة فيه"
                  >
                    <span>🗑️</span>
                    <span>حذف نهائي</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- حالة الفراغ -->
          <tbody v-else>
            <tr>
              <td colspan="7" class="text-center py-5">
                <div class="empty-trash-box">
                  <div class="empty-icon">🧹✨</div>
                  <h3 class="empty-title">سلة المهملات فارغة!</h3>
                  <p class="empty-desc">
                    {{ searchQuery ? 'لا توجد نتائج تطابق بحثك في هذا القسم.' : `لا توجد عناصر محذوفة في قسم (${activeCategoryObj.label}).` }}
                  </p>
                  <button v-if="searchQuery" @click="clearSearch" class="btn-secondary-sm mt-2">
                    إلغاء البحث وعرض الكل
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- الترقيم (Pagination) -->
      <div v-if="pagination.last_page > 1" class="pagination-footer d-flex justify-between align-center p-3">
        <span class="text-sm muted">صفحة {{ pagination.current_page }} من {{ pagination.last_page }}</span>
        <div class="pagination-buttons d-flex gap-2">
          <button 
            type="button" 
            class="btn-page" 
            :disabled="pagination.current_page <= 1"
            @click="fetchItems(pagination.current_page - 1)"
          >
            السابق
          </button>
          <button 
            type="button" 
            class="btn-page" 
            :disabled="pagination.current_page >= pagination.last_page"
            @click="fetchItems(pagination.current_page + 1)"
          >
            التالي
          </button>
        </div>
      </div>
    </div>

    <!-- ================= مودالات التأكيد ================= -->

    <!-- 1. مودال الحذف النهائي لعنصر محدد -->
    <Teleport to="body">
      <div v-if="showForceModal" class="modal-overlay" @click.self="showForceModal = false">
        <div class="modal-content force-modal-card" dir="rtl">
          <div class="modal-header-danger">
            <span class="modal-icon-danger">⚠️</span>
            <h3>تأكيد الحذف النهائي</h3>
          </div>

          <div class="modal-body py-3">
            <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
              أنت على وشك حذف <strong>{{ activeCategoryObj.singular }}</strong>:
            </p>
            <div class="target-item-card">
              <strong style="color: #ef4444; font-size: 15px;">{{ selectedItem ? getItemTitle(selectedItem) : '' }}</strong>
              <div class="text-xs muted mt-1">تاريخ الحذف المؤقت: {{ selectedItem ? formatDate(selectedItem.deleted_at) : '' }}</div>
            </div>

            <div class="danger-warning-box mt-3">
              🔥 <strong>تحذير لا رجعة فيه:</strong> الحذف النهائي سيؤدي إلى مسح العنصر تماماً من قاعدة البيانات دون إمكانية استرجاعه مستقبلاً.
            </div>
          </div>

          <div class="modal-actions d-flex justify-between gap-2 mt-4">
            <button type="button" class="btn-cancel" @click="showForceModal = false" :disabled="processingAction">
              إلغاء التراجع
            </button>
            <button 
              type="button" 
              class="btn-confirm-delete" 
              @click="confirmForceDelete"
              :disabled="processingAction"
            >
              {{ processingAction ? '⏳ جارٍ الحذف النهائي...' : '💥 نعم، حذف نهائياً الآن' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 2. مودال تفريغ سلة القسم نهائياً -->
    <Teleport to="body">
      <div v-if="showEmptyModal" class="modal-overlay" @click.self="showEmptyModal = false">
        <div class="modal-content force-modal-card" dir="rtl">
          <div class="modal-header-danger">
            <span class="modal-icon-danger">🚨</span>
            <h3>تفريغ سلة {{ activeCategoryObj.label }} نهائياً</h3>
          </div>

          <div class="modal-body py-3">
            <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
              هل أنت متأكد من رغبتك في تفريغ سلة قسم <strong>({{ activeCategoryObj.label }})</strong> بالكامل؟
            </p>
            <div class="target-item-card text-center">
              <strong style="color: #f87171; font-size: 18px;">{{ currentCategoryCount }} عنصر محذوف</strong>
              <p class="text-xs muted mt-1">سيتم مسحها جميعاً فوراً من قاعدة البيانات.</p>
            </div>
          </div>

          <div class="modal-actions d-flex justify-between gap-2 mt-4">
            <button type="button" class="btn-cancel" @click="showEmptyModal = false" :disabled="processingAction">
              إلغاء
            </button>
            <button 
              type="button" 
              class="btn-confirm-delete" 
              @click="confirmEmptyTrash"
              :disabled="processingAction"
            >
              {{ processingAction ? '⏳ جارٍ التفريغ...' : '🔥 تأكيد تفريغ السلة بالكامل' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 3. مودال استعادة جميع العناصر -->
    <Teleport to="body">
      <div v-if="showRestoreAllModal" class="modal-overlay" @click.self="showRestoreAllModal = false">
        <div class="modal-content restore-modal-card" dir="rtl">
          <div class="modal-header-success">
            <span class="modal-icon-success">🔄</span>
            <h3>استعادة جميع {{ activeCategoryObj.label }}</h3>
          </div>

          <div class="modal-body py-3">
            <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.6;">
              هل تريد استعادة جميع عناصر قسم <strong>({{ activeCategoryObj.label }})</strong> البالغ عددها <strong>{{ currentCategoryCount }}</strong> عنصر؟
            </p>
            <p class="text-xs muted">ستعود العناصر فوراً إلى حالتها النشطة في جداول النظام.</p>
          </div>

          <div class="modal-actions d-flex justify-between gap-2 mt-4">
            <button type="button" class="btn-cancel" @click="showRestoreAllModal = false" :disabled="processingAction">
              إلغاء
            </button>
            <button 
              type="button" 
              class="btn-confirm-restore" 
              @click="confirmRestoreAll"
              :disabled="processingAction"
            >
              {{ processingAction ? '⏳ جارٍ الاستعادة...' : '✅ نعم، استعادة الكل' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../axios';
import alertService from '../services/alertService';

// التصنيفات المدعومة
const categories = [
  { id: 'clients', label: 'العملاء والشركات', singular: 'العميل', icon: '🏢' },
  { id: 'users', label: 'المستخدمين وفريق العمل', singular: 'المستخدم', icon: '👥' },
  { id: 'projects', label: 'المشاريع', singular: 'المشروع', icon: '📁' },
  { id: 'plans', label: 'خطط المحتوى', singular: 'خطة المحتوى', icon: '📋' },
  { id: 'departments', label: 'الأقسام الإدارية', singular: 'القسم', icon: '🏛️' },
];

const activeCategory = ref('clients');
const activeCategoryObj = computed(() => {
  return categories.find(c => c.id === activeCategory.value) || categories[0];
});

const counts = ref({
  clients: 0,
  users: 0,
  projects: 0,
  plans: 0,
  departments: 0,
  total: 0
});

const currentCategoryCount = computed(() => {
  return counts.value[activeCategory.value] || 0;
});

const items = ref([]);
const loading = ref(false);
const searchQuery = ref('');
let searchDebounceTimer = null;

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0
});

// المودالات
const showForceModal = ref(false);
const showEmptyModal = ref(false);
const showRestoreAllModal = ref(false);
const selectedItem = ref(null);
const processingAction = ref(false);

// جلب الإحصائيات
const fetchCounts = async () => {
  try {
    const res = await api.get('/trash/counts');
    if (res.data?.data) {
      counts.value = res.data.data;
    }
  } catch (err) {
    console.error('Error fetching trash counts:', err);
  }
};

// جلب العناصر المحذوفة
const fetchItems = async (page = 1) => {
  loading.value = true;
  try {
    const params = {
      page,
      search: searchQuery.value ? searchQuery.value.trim() : undefined
    };

    const res = await api.get(`/trash/${activeCategory.value}`, { params });
    if (res.data?.status === 'success') {
      items.value = res.data.data || [];
      if (res.data.pagination) {
        pagination.value = res.data.pagination;
      }
    }
  } catch (err) {
    const msg = err.response?.data?.message || 'تعذر جلب عناصر سلة المهملات!';
    alertService.error(msg);
  } finally {
    loading.value = false;
  }
};

const changeCategory = (catId) => {
  if (activeCategory.value === catId) return;
  activeCategory.value = catId;
  searchQuery.value = '';
  fetchItems(1);
};

const refreshCurrent = async () => {
  await Promise.all([fetchCounts(), fetchItems(pagination.value.current_page)]);
};

const handleSearchInput = () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchItems(1);
  }, 350);
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchItems(1);
};

// استعادة عنصر واحد
const restoreItem = async (item) => {
  item._processing = true;
  try {
    const res = await api.post(`/trash/${activeCategory.value}/${item.id}/restore`);
    alertService.success(res.data?.message || 'تمت الاستعادة بنجاح');
    // إزالة العنصر من القائمة وتحديث العدادات
    items.value = items.value.filter(i => i.id !== item.id);
    fetchCounts();
    if (pagination.value.total > 0) pagination.value.total -= 1;
  } catch (err) {
    const msg = err.response?.data?.message || 'تعذر استعادة العنصر!';
    alertService.error(msg);
  } finally {
    item._processing = false;
  }
};

// مودال الحذف النهائي
const openForceDeleteModal = (item) => {
  selectedItem.value = item;
  showForceModal.value = true;
};

const confirmForceDelete = async () => {
  if (!selectedItem.value) return;
  processingAction.value = true;
  const targetId = selectedItem.value.id;
  try {
    const res = await api.delete(`/trash/${activeCategory.value}/${targetId}/force`);
    alertService.success(res.data?.message || 'تم الحذف النهائي بنجاح');
    items.value = items.value.filter(i => i.id !== targetId);
    showForceModal.value = false;
    selectedItem.value = null;
    fetchCounts();
    if (pagination.value.total > 0) pagination.value.total -= 1;
  } catch (err) {
    const msg = err.response?.data?.message || 'تعذر الحذف النهائي!';
    alertService.error(msg);
  } finally {
    processingAction.value = false;
  }
};

// مودال استعادة الكل
const openRestoreAllModal = () => {
  showRestoreAllModal.value = true;
};

const confirmRestoreAll = async () => {
  processingAction.value = true;
  try {
    const res = await api.post(`/trash/${activeCategory.value}/restore-all`);
    alertService.success(res.data?.message || 'تمت استعادة جميع العناصر بنجاح');
    showRestoreAllModal.value = false;
    await refreshCurrent();
  } catch (err) {
    const msg = err.response?.data?.message || 'تعذر استعادة العناصر!';
    alertService.error(msg);
  } finally {
    processingAction.value = false;
  }
};

// مودال تفريغ سلة القسم
const openEmptyTrashModal = () => {
  showEmptyModal.value = true;
};

const confirmEmptyTrash = async () => {
  processingAction.value = true;
  try {
    const res = await api.delete(`/trash/${activeCategory.value}/empty`);
    alertService.success(res.data?.message || 'تم تفريغ سلة القسم بنجاح');
    showEmptyModal.value = false;
    await refreshCurrent();
  } catch (err) {
    const msg = err.response?.data?.message || 'تعذر تفريغ سلة المهملات!';
    alertService.error(msg);
  } finally {
    processingAction.value = false;
  }
};

// التنسيق والمساعدات
const getItemTitle = (item) => {
  if (!item) return '';
  return item.name || `#${item.id}`;
};

const getItemSubtitle = (item) => {
  if (!item) return '';
  if (activeCategory.value === 'clients') return item.bank_name ? `بنك: ${item.bank_name}` : '';
  if (activeCategory.value === 'users') return item.email || '';
  if (activeCategory.value === 'projects') return item.description || '';
  if (activeCategory.value === 'plans') return `نوع الخطة: ${item.plan_type || 'عام'}`;
  if (activeCategory.value === 'departments') return item.description || 'قسم إداري';
  return '';
};

const formatContactField = (val) => {
  if (!val) return '';
  if (Array.isArray(val)) return val.join('، ');
  if (typeof val === 'object') {
    try {
      return Object.values(val).join('، ');
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'منذ لحظات';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return '';
  } catch (e) {
    return '';
  }
};

const translateRole = (role) => {
  if (!role) return 'موظف';
  const r = typeof role === 'object' && role.value ? role.value : String(role);
  return r === 'manager' ? 'مدير عام' : 'موظف';
};

onMounted(() => {
  fetchCounts();
  fetchItems(1);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.trash-page {
  min-height: 100vh;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
  padding-bottom: 50px;
}

/* Utilities */
.mb-4 { margin-bottom: 24px; }
.mb-3 { margin-bottom: 16px; }
.mt-1 { margin-top: 4px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 14px; }
.mt-4 { margin-top: 20px; }
.p-3 { padding: 16px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.py-5 { padding-top: 45px; padding-bottom: 45px; }
.d-flex { display: flex; }
.justify-between { justify-content: space-between; }
.align-center { align-items: center; }
.gap-1 { gap: 6px; }
.gap-2 { gap: 10px; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
.text-center { text-align: center; }
.text-danger { color: #f87171 !important; }
.muted { color: #94a3b8; }
.text-sm { font-size: 12.5px; }
.text-xs { font-size: 11px; }

/* Header */
.eyebrow {
  color: #f87171;
  font-size: 11.5px;
  font-weight: 700;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 4px 12px;
  border-radius: 6px;
  display: inline-block;
  margin-bottom: 8px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.btn-success-soft {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 7px 14px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-weight: 700;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-success-soft:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.22);
  color: #fff;
  transform: translateY(-1px);
}

.btn-danger-soft {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 7px 14px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-weight: 700;
  font-size: 12.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-danger-soft:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  color: #fff;
  transform: translateY(-1px);
}

.btn-success-soft:disabled,
.btn-danger-soft:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.18);
  color: #aab5da;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: 0.2s;
  font-size: 14px;
}

.btn-icon:hover {
  background: rgba(137, 153, 226, 0.22);
  color: #fff;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Category Tabs (Pills) */
.category-tabs-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  background: rgba(12, 18, 52, 0.5);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(137, 153, 226, 0.1);
}

.category-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category-tab-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 9px;
  font-family: 'Cairo';
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.category-tab-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.04);
}

.category-tab-btn.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.25));
  color: #fff;
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.tab-badge {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 1px 7px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  transition: 0.2s;
}

.category-tab-btn.active .tab-badge.has-items {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}

.total-trashed-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
}

.total-trashed-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

/* Glass Panel & Filter */
.glass-panel {
  background: rgba(12, 18, 52, 0.55);
  border: 1px solid rgba(137, 153, 226, 0.12);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.filter-toolbar {
  padding: 12px 18px;
  gap: 15px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 12px;
  font-size: 13px;
  color: #64748b;
  pointer-events: none;
}

.form-control-search {
  width: 100%;
  max-width: 420px;
  background: rgba(6, 11, 37, 0.65);
  border: 1px solid rgba(137, 153, 226, 0.18);
  color: #e2e8f0;
  padding: 8px 36px 8px 32px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-size: 12.5px;
  outline: none;
  transition: all 0.2s;
}

.form-control-search:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.clear-search-btn {
  position: absolute;
  left: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
}

/* Table */
.relative-container {
  position: relative;
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

.trash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: right;
}

.trash-table th {
  padding: 14px 18px;
  color: #94a3b8;
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
  font-weight: 700;
  font-size: 12px;
  background: rgba(8, 13, 41, 0.4);
  white-space: nowrap;
}

.trash-table td {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(137, 153, 226, 0.06);
  vertical-align: middle;
}

.trash-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.row-num-cell {
  text-align: center !important;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
}

/* Cell Elements */
.item-main-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
  font-size: 17px;
  flex-shrink: 0;
}

.client-logo-mini {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.item-text {
  display: flex;
  flex-direction: column;
}

.item-title {
  color: #f1f5f9;
  font-size: 13.5px;
  font-weight: 700;
}

.item-subtitle {
  color: #64748b;
  font-size: 11px;
  margin-top: 2px;
}

.badge-role {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  display: inline-block;
}

.badge-role.manager {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-role.employee {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.dept-tag {
  font-size: 11px;
  color: #94a3b8;
  display: block;
}

.dept-badge {
  background: rgba(137, 153, 226, 0.1);
  color: #c7d2fe;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid rgba(137, 153, 226, 0.2);
}

.badge-soft {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-block;
}

.badge-soft.blue { background: rgba(59, 130, 246, 0.12); color: #93c5fd; }
.badge-soft.purple { background: rgba(147, 51, 234, 0.12); color: #c084fc; }
.badge-soft.emerald { background: rgba(16, 185, 129, 0.12); color: #6ee7b7; }

.deleted-time-cell {
  display: flex;
  flex-direction: column;
}

.date-text {
  font-size: 12px;
  font-weight: 600;
}

/* Actions */
.action-buttons-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  padding: 5px 10px;
  border-radius: 6px;
  font-family: 'Cairo';
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  border: none;
}

.btn-restore {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.btn-restore:hover:not(:disabled) {
  background: #10b981;
  color: #fff;
  transform: translateY(-1px);
}

.btn-force-delete {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.btn-force-delete:hover:not(:disabled) {
  background: #ef4444;
  color: #fff;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Empty State */
.empty-trash-box {
  padding: 30px;
}

.empty-icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.empty-title {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 6px;
}

.empty-desc {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

.btn-secondary-sm {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 5px 14px;
  border-radius: 6px;
  font-family: 'Cairo';
  font-size: 12px;
  cursor: pointer;
}

/* Pagination */
.pagination-footer {
  border-top: 1px solid rgba(137, 153, 226, 0.08);
  background: rgba(8, 13, 41, 0.25);
}

.btn-page {
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #c7d2fe;
  padding: 4px 12px;
  border-radius: 6px;
  font-family: 'Cairo';
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: rgba(137, 153, 226, 0.22);
  color: #fff;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Loading Overlay */
.inner-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8, 13, 41, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

/* Modal Cards */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: grid;
  place-items: center;
  z-index: 9999;
  padding: 15px;
}

.force-modal-card,
.restore-modal-card {
  width: min(480px, 95%);
  background: #0d1338;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.force-modal-card {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.restore-modal-card {
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.modal-header-danger,
.modal-header-success {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 12px;
}

.modal-header-danger h3 {
  margin: 0;
  color: #f87171;
  font-size: 18px;
  font-weight: 800;
}

.modal-header-success h3 {
  margin: 0;
  color: #34d399;
  font-size: 18px;
  font-weight: 800;
}

.modal-icon-danger { font-size: 24px; }
.modal-icon-success { font-size: 24px; }

.target-item-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  padding: 12px 14px;
  border-radius: 8px;
  margin-top: 8px;
}

.danger-warning-box {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 9px 18px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-confirm-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  transition: 0.2s;
}

.btn-confirm-delete:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
}

.btn-confirm-restore {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-family: 'Cairo';
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: 0.2s;
}

.btn-confirm-restore:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.btn-confirm-delete:disabled,
.btn-confirm-restore:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
