<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">📊</div>
      <div>
        <h2>إعدادات خطط المحتوى وساعات المعايير</h2>
        <p>ضبط سياسات إنشاء واعتماد المنشورات بالإضافة إلى جداول الساعات التقديرية المعتمدة</p>
      </div>
    </div>

    <div class="sub-tab-switcher">
      <button
        type="button"
        class="sub-tab-btn"
        :class="{ 'active': plansSubTab === 'policies' }"
        @click="$emit('update:plansSubTab', 'policies')"
      >
        <span>⚙️</span> سياسات وضوابط الخطط
      </button>
      <button
        type="button"
        class="sub-tab-btn"
        :class="{ 'active': plansSubTab === 'estimates' }"
        @click="$emit('update:plansSubTab', 'estimates')"
      >
        <span>⏱️</span> جدول الساعات المقدرة لكل عنصر ({{ categories.length }} أنواع)
        <span v-if="hasUnsavedHoursChanges" class="mini-unsaved-dot"></span>
      </button>
    </div>

    <!-- القسم الأول: السياسات والضوابط -->
    <div v-if="plansSubTab === 'policies'" class="settings-grid">
      <div class="setting-card">
        <label class="setting-label">الحد الأدنى لمهلة تسليم البريف (بالساعات)</label>
        <div class="input-with-icon">
          <span class="input-icon">⏳</span>
          <input
            v-model.number="settingsForm.min_brief_lead_hours"
            type="number"
            min="1"
            class="form-control"
            placeholder="مثال: 48"
          />
          <span class="input-unit">ساعة</span>
        </div>
        <small class="setting-hint">أقل مهلة زمنية مسموح بها بين طلب البريف وموعد النشر المجدول (48 ساعة = يومين)</small>
      </div>

      <div class="setting-card flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">التكرار التلقائي الشهري للخطط (Auto-Recurrence)</strong>
          <p class="toggle-desc">توليد مسودة الخطة الجديدة للشهر القادم تلقائياً للعملاء المستمرين</p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.default_auto_recurrence" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">إلزامية مراجعة رئيس القسم أولاً (Require Dept Review)</strong>
          <p class="toggle-desc">منع إرسال المنشور للمدير أو العميل مباشرة دون موافقة تيم ليدر القسم المعني أولاً</p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.require_dept_review_first" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">التحقق الصارم من روابط جوجل درايف (Strict Drive Validation)</strong>
          <p class="toggle-desc">التحقق من صحة وقابلية فتح روابط درايف للمنشورات ومنع الروابط المعطوبة أو غير المصرح بها</p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.strict_drive_validation" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card flex-card full-span">
        <div class="toggle-info">
          <strong class="toggle-title">القفل التلقائي للمنشورات بعد الاعتماد (Auto-Lock on Approval)</strong>
          <p class="toggle-desc">قفل التعديل على أي منشور فور اعتماد العميل أو الإدارة له لمنع التغييرات غير الموثقة</p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.auto_lock_on_approval" />
          <span class="slider-round"></span>
        </label>
      </div>
    </div>

    <!-- القسم الثاني: جدول الساعات المقدرة -->
    <div v-if="plansSubTab === 'estimates'" class="estimates-embedded-container">
      <div class="summary-and-search-bar">
        <div class="stats-pills">
          <div class="stat-pill">
            <span class="pill-label">إجمالي أنواع الخطط:</span>
            <span class="pill-value">{{ categories.length }}</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">إجمالي العناصر المقدرة:</span>
            <span class="pill-value">{{ totalItemsCount }}</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">الوحدة المعتمدة:</span>
            <span class="pill-value highlight">الساعة ⏱️</span>
          </div>
          <div v-if="hasUnsavedHoursChanges" class="stat-pill warning-pill">
            <span class="pill-label">الحالة:</span>
            <span class="pill-value warning-text">يوجد تعديلات غير محفوظة ⚠️</span>
          </div>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="بحث سريع عن عنصر أو نوع خطة..."
            class="search-input"
          />
          <button v-if="searchQuery" type="button" class="clear-search" @click="searchQuery = ''">×</button>
        </div>
      </div>

      <div v-if="loadingHours" class="state-container">
        <div class="spinner-large"></div>
        <p>جارٍ تحميل إعدادات ساعات الخطط والمعايير...</p>
      </div>

      <div v-else class="categories-container">
        <div v-for="category in filteredCategories" :key="category.id" class="category-card">
          <div class="category-header">
            <div class="category-info">
              <div class="category-badge-icon">{{ getCategoryIcon(category.name) }}</div>
              <div>
                <div class="cat-title-row">
                  <h3 class="category-name">{{ category.name }}</h3>
                  <span class="items-count-badge">{{ category.items ? category.items.length : 0 }} عناصر</span>
                  <span v-if="category.items && category.items.length" class="total-hours-badge">
                    إجمالي: {{ calculateCategoryTotalHours(category) }} ساعة
                  </span>
                </div>
                <p v-if="category.description" class="category-desc">{{ category.description }}</p>
              </div>
            </div>

            <div class="category-actions">
              <button
                type="button"
                class="icon-action-btn add-item-btn"
                title="إضافة عنصر عمل جديد لهذا النوع"
                @click="openAddItemModal(category)"
              >
                <span>＋</span> إضافة عنصر
              </button>
              <button
                type="button"
                class="icon-action-btn edit-cat-btn"
                title="تعديل اسم أو وصف نوع الخطة"
                @click="openEditCategoryModal(category)"
              >
                ✏️
              </button>
              <button
                type="button"
                class="icon-action-btn delete-cat-btn"
                title="حذف هذا النوع بالكامل"
                @click="confirmDeleteCategory(category)"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="category-body">
            <div v-if="!category.items || category.items.length === 0" class="empty-category-box">
              <p>لا توجد عناصر مضافة بعد لخطة "{{ category.name }}".</p>
              <button type="button" class="btn-subtle" @click="openAddItemModal(category)">
                <span>＋</span> إضافة أول عنصر الآن
              </button>
            </div>

            <div v-else class="items-grid">
              <div
                v-for="item in category.items"
                :key="item.id"
                class="item-card"
                :class="{ 'item-modified': isItemModified(item) }"
              >
                <div class="item-header">
                  <div class="item-name-wrap">
                    <span class="item-name" :title="item.name">{{ item.name }}</span>
                    <span v-if="isItemModified(item)" class="modified-dot" title="قيمة معدلة لم تُحفظ بعد"></span>
                  </div>
                  <button
                    type="button"
                    class="item-delete-btn"
                    title="حذف هذا العنصر"
                    @click="confirmDeleteItem(item, category)"
                  >
                    🗑️
                  </button>
                </div>

                <div class="item-input-group">
                  <label class="input-label">الوقت المقدر:</label>
                  <div class="hours-input-wrapper" :class="{ 'wrapper-modified': isItemModified(item) }">
                    <span class="clock-icon">⏱️</span>
                    <input
                      v-model.number="item.estimated_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="999"
                      class="hours-input"
                    />
                    <span class="unit-tag">ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="add-new-category-placeholder" @click="openAddCategoryModal">
          <div class="placeholder-icon">＋</div>
          <h3>إضافة نوع خطة جديد</h3>
          <p>انقر هنا لإنشاء خطة مخصصة وإدراج عناصر عمل جديدة بساعاتها التقديرية</p>
        </div>
      </div>
    </div>

    <!-- مودال إضافة / تعديل نوع خطة -->
    <BaseModal
      v-model="showCategoryModal"
      :title="isEditingCategory ? 'تعديل نوع الخطة' : 'إضافة نوع خطة جديد'"
      max-width="480px"
    >
      <form @submit.prevent="submitCategoryForm">
        <div class="est-modal-group">
          <label>اسم نوع الخطة <span class="est-req">*</span></label>
          <input
            v-model="categoryForm.name"
            type="text"
            required
            placeholder="مثال: Social Media Growth Plan"
            class="est-input"
          />
        </div>
        <div class="est-modal-group">
          <label>وصف توضيحي (اختياري)</label>
          <textarea
            v-model="categoryForm.description"
            rows="3"
            placeholder="نبذة عن طبيعة مهام وعناصر هذا النوع..."
            class="est-input"
          ></textarea>
        </div>
        <div class="est-modal-foot">
          <button type="button" class="oms-btn oms-btn-secondary" @click="showCategoryModal = false">إلغاء</button>
          <button type="submit" class="oms-btn oms-btn-primary" :disabled="submittingCategory">
            {{ submittingCategory ? 'جارٍ الحفظ...' : (isEditingCategory ? 'تحديث' : 'إضافة النوع') }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- مودال إضافة عنصر جديد -->
    <BaseModal
      v-model="showItemModal"
      :title="`إضافة عنصر عمل جديد إلى &quot;${targetCategoryForNewItem?.name || ''}&quot;`"
      max-width="480px"
    >
      <form @submit.prevent="submitItemForm">
        <div class="est-modal-group">
          <label>اسم العنصر / نوع المنشور <span class="est-req">*</span></label>
          <input
            v-model="itemForm.name"
            type="text"
            required
            placeholder="مثال: انفوجرافيك تفاعلي، فيديو ترويجي 30 ثانية..."
            class="est-input"
          />
        </div>
        <div class="est-modal-group">
          <label>عدد ساعات العمل المقدرة (بالساعة) <span class="est-req">*</span></label>
          <div class="est-hours-row">
            <span>⏱️</span>
            <input
              v-model.number="itemForm.estimated_hours"
              type="number"
              step="0.5"
              min="0"
              required
              placeholder="مثال: 3"
              class="est-input"
            />
            <span class="est-unit">ساعة</span>
          </div>
        </div>
        <div class="est-modal-foot">
          <button type="button" class="oms-btn oms-btn-secondary" @click="showItemModal = false">إلغاء</button>
          <button type="submit" class="oms-btn oms-btn-primary" :disabled="submittingItem">
            {{ submittingItem ? 'جارٍ الإضافة...' : 'إضافة العنصر' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/axios';
import alertService from '@/services/alertService';
import BaseModal from '@/components/ui/BaseModal.vue';

defineProps({
  settingsForm: { type: Object, required: true },
  plansSubTab: { type: String, required: true },
});

defineEmits(['update:plansSubTab']);

const categories = ref([]);
const loadingHours = ref(true);
const savingBulkHours = ref(false);
const searchQuery = ref('');
const originalHoursMap = ref({});

const updateHoursSnapshot = () => {
  const map = {};
  categories.value.forEach((cat) => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach((item) => {
        map[item.id] = Number(item.estimated_hours) || 0;
      });
    }
  });
  originalHoursMap.value = map;
};

const hasUnsavedHoursChanges = computed(() => {
  if (!categories.value.length) return false;
  for (const cat of categories.value) {
    if (cat.items && Array.isArray(cat.items)) {
      for (const item of cat.items) {
        const orig = originalHoursMap.value[item.id];
        const current = Number(item.estimated_hours) || 0;
        if (orig !== undefined && Math.abs(orig - current) > 0.001) {
          return true;
        }
      }
    }
  }
  return false;
});

const isItemModified = (item) => {
  if (!item || originalHoursMap.value[item.id] === undefined) return false;
  const orig = originalHoursMap.value[item.id];
  const current = Number(item.estimated_hours) || 0;
  return Math.abs(orig - current) > 0.001;
};

const discardHoursChanges = () => {
  categories.value.forEach((cat) => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach((item) => {
        if (originalHoursMap.value[item.id] !== undefined) {
          item.estimated_hours = originalHoursMap.value[item.id];
        }
      });
    }
  });
  alertService.info('تم التراجع عن التعديلات واستعادة الساعات السابقة.');
};

const fetchHoursSettings = async () => {
  loadingHours.value = true;
  try {
    const res = await api.get('/settings/plan-item-estimates');
    categories.value = res.data.data || [];
    updateHoursSnapshot();
  } catch (error) {
    alertService.error('تعذر جلب إعدادات ساعات الخطط.');
  } finally {
    loadingHours.value = false;
  }
};

const totalItemsCount = computed(() =>
  categories.value.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0)
);

const calculateCategoryTotalHours = (category) => {
  if (!category.items) return 0;
  const total = category.items.reduce((sum, item) => sum + (Number(item.estimated_hours) || 0), 0);
  return Number(total.toFixed(2));
};

const filteredCategories = computed(() => {
  if (!searchQuery.value || !searchQuery.value.trim()) {
    return categories.value;
  }
  const q = searchQuery.value.trim().toLowerCase();
  return categories.value
    .map((cat) => {
      const catMatches =
        cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
      const matchingItems = cat.items ? cat.items.filter((item) => item.name.toLowerCase().includes(q)) : [];
      if (catMatches) return cat;
      if (matchingItems.length > 0) return { ...cat, items: matchingItems };
      return null;
    })
    .filter(Boolean);
});

const getCategoryIcon = (name) => {
  if (!name) return '📁';
  const n = name.toLowerCase();
  if (n.includes('social') || n.includes('سوشيال')) return '📱';
  if (n.includes('branding') || n.includes('هوية')) return '🎨';
  if (n.includes('web') || n.includes('موقع') || n.includes('تطوير')) return '💻';
  if (n.includes('media production') || n.includes('video')) return '🎬';
  if (n.includes('digital') || n.includes('strategy')) return '🎯';
  if (n.includes('media buying') || n.includes('ad')) return '📢';
  if (n.includes('seo')) return '🔍';
  if (n.includes('analytics') || n.includes('reporting')) return '📊';
  return '📁';
};

const saveAllHours = async () => {
  savingBulkHours.value = true;
  try {
    const allEstimates = [];
    categories.value.forEach((cat) => {
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach((item) => {
          allEstimates.push({
            id: item.id,
            estimated_hours: Number(item.estimated_hours) || 0,
          });
        });
      }
    });

    if (allEstimates.length === 0) {
      alertService.info('لا توجد عناصر للحفظ.');
      return;
    }

    await api.put('/settings/plan-item-estimates/bulk-update', { estimates: allEstimates });
    updateHoursSnapshot();
    alertService.success('تم حفظ وتحديث كافة الساعات بنجاح ✅');
  } catch (error) {
    alertService.error('حدث خطأ أثناء حفظ الساعات.');
  } finally {
    savingBulkHours.value = false;
  }
};

// مودالات التصنيفات والعناصر
const showCategoryModal = ref(false);
const isEditingCategory = ref(false);
const submittingCategory = ref(false);
const categoryForm = ref({ id: null, name: '', description: '' });

const openAddCategoryModal = () => {
  isEditingCategory.value = false;
  categoryForm.value = { id: null, name: '', description: '' };
  showCategoryModal.value = true;
};

const openEditCategoryModal = (cat) => {
  isEditingCategory.value = true;
  categoryForm.value = { id: cat.id, name: cat.name, description: cat.description || '' };
  showCategoryModal.value = true;
};

const submitCategoryForm = async () => {
  if (!categoryForm.value.name.trim()) return;
  submittingCategory.value = true;
  try {
    if (isEditingCategory.value) {
      const res = await api.put(`/settings/plan-item-categories/${categoryForm.value.id}`, {
        name: categoryForm.value.name,
        description: categoryForm.value.description,
      });
      const idx = categories.value.findIndex((c) => c.id === categoryForm.value.id);
      if (idx !== -1) {
        categories.value[idx].name = res.data.data.name;
        categories.value[idx].description = res.data.data.description;
      }
      alertService.success('تم تحديث نوع الخطة بنجاح');
    } else {
      const res = await api.post('/settings/plan-item-categories', {
        name: categoryForm.value.name,
        description: categoryForm.value.description,
      });
      categories.value.push(res.data.data);
      alertService.success('تمت إضافة نوع الخطة بنجاح ✅');
    }
    showCategoryModal.value = false;
  } catch (error) {
    alertService.error(error.response?.data?.message || 'تعذر حفظ نوع الخطة');
  } finally {
    submittingCategory.value = false;
  }
};

const confirmDeleteCategory = async (cat) => {
  const confirmed = await alertService.confirm({
    title: 'حذف نوع الخطة',
    message: `هل أنت متأكد من حذف "${cat.name}" وكافة عناصره المقدرة؟`,
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'danger',
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-categories/${cat.id}`);
    categories.value = categories.value.filter((c) => c.id !== cat.id);
    updateHoursSnapshot();
    alertService.success('تم حذف نوع الخطة بنجاح 🗑️');
  } catch (error) {
    alertService.error('فشل في حذف نوع الخطة.');
  }
};

const showItemModal = ref(false);
const submittingItem = ref(false);
const targetCategoryForNewItem = ref(null);
const itemForm = ref({ name: '', estimated_hours: 1 });

const openAddItemModal = (cat) => {
  targetCategoryForNewItem.value = cat;
  itemForm.value = { name: '', estimated_hours: 1 };
  showItemModal.value = true;
};

const submitItemForm = async () => {
  if (!itemForm.value.name.trim() || !targetCategoryForNewItem.value) return;
  submittingItem.value = true;
  try {
    const res = await api.post('/settings/plan-item-estimates', {
      category_id: targetCategoryForNewItem.value.id,
      name: itemForm.value.name.trim(),
      estimated_hours: Number(itemForm.value.estimated_hours) || 0,
    });

    if (!targetCategoryForNewItem.value.items) {
      targetCategoryForNewItem.value.items = [];
    }
    targetCategoryForNewItem.value.items.push(res.data.data);
    originalHoursMap.value[res.data.data.id] = Number(res.data.data.estimated_hours) || 0;

    showItemModal.value = false;
    alertService.success('تمت إضافة العنصر بنجاح ✅');
  } catch (error) {
    alertService.error(error.response?.data?.message || 'تعذر إضافة العنصر');
  } finally {
    submittingItem.value = false;
  }
};

const confirmDeleteItem = async (item, category) => {
  const confirmed = await alertService.confirm({
    title: 'حذف العنصر',
    message: `هل أنت متأكد من حذف عنصر "${item.name}"؟`,
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'warning',
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-estimates/${item.id}`);
    category.items = category.items.filter((i) => i.id !== item.id);
    delete originalHoursMap.value[item.id];
    alertService.success('تم حذف العنصر بنجاح.');
  } catch (error) {
    alertService.error('تعذر حذف العنصر.');
  }
};

onMounted(() => {
  fetchHoursSettings();
});

defineExpose({
  hasUnsavedHoursChanges,
  savingBulkHours,
  saveAllHours,
  discardHoursChanges,
  openAddCategoryModal,
});
</script>

<style scoped>
.est-modal-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.est-modal-group label {
  font-size: 0.84rem;
  color: #cbd5e1;
  font-weight: 600;
}

.est-req {
  color: #f87171;
}

.est-input {
  width: 100%;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  padding: 9px 12px;
  color: #f8fafc;
  font-size: 0.9rem;
}

.est-hours-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.est-unit {
  color: #94a3b8;
  font-size: 0.85rem;
  white-space: nowrap;
}

.est-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>
