<template>
  <div class="settings-page" dir="rtl">
    <!-- رأس الصفحة -->
    <div class="settings-header">
      <div class="header-titles">
        <div class="breadcrumbs">
          <span>لوحة التحكم</span>
          <span>/</span>
          <span class="active-crumb">إعدادات النظام</span>
        </div>
        <div class="title-with-badge">
          <div class="settings-icon-badge">⚙️</div>
          <div>
            <h1>إعدادات النظام وإدارة المعايير</h1>
            <p>إدارة ساعات العمل المعيارية لكل عنصر في الخطط وضبط سياسات العمل والتكليف</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="openAddCategoryModal"
        >
          <span>＋</span> نوع خطة جديد
        </button>

        <button 
          type="button" 
          class="btn btn-primary save-all-btn" 
          :class="{ 'needs-save-pulse': hasUnsavedChanges }"
          :disabled="savingBulk"
          @click="saveAllHours"
        >
          <span v-if="savingBulk" class="spinner-inline"></span>
          <span v-else>💾</span>
          <span>حفظ كافة الساعات</span>
          <span v-if="hasUnsavedChanges" class="unsaved-badge" title="يوجد تعديلات غير محفوظة">!</span>
        </button>
      </div>
    </div>

    <!-- تنبيه علوي مميز عند وجود تعديلات غير محفوظة -->
    <Transition name="fade-slide">
      <div v-if="hasUnsavedChanges" class="unsaved-changes-top-alert">
        <div class="top-alert-content">
          <span class="alert-icon-beacon">⚠️</span>
          <div>
            <strong>تنبيه: يوجد تعديلات على ساعات العمل لم يتم حفظها بعد!</strong>
            <p>تأكد من الضغط على زر الحفظ لتثبيت القيم الجديدة وتفادي فقدان ما قمت بتعديله.</p>
          </div>
        </div>
        <div class="top-alert-actions">
          <button type="button" class="btn-alert-discard" @click="discardChanges" :disabled="savingBulk">
            تراجع عن التعديلات
          </button>
          <button type="button" class="btn-alert-save" @click="saveAllHours" :disabled="savingBulk">
            <span v-if="savingBulk" class="spinner-inline dark"></span>
            <span v-else>💾</span>
            <span>حفظ الآن</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- شريط البحث السريع والملخص -->
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
        <div v-if="hasUnsavedChanges" class="stat-pill warning-pill">
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
        <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">×</button>
      </div>
    </div>

    <!-- قسم تحميل البيانات -->
    <div v-if="loading" class="state-container">
      <div class="spinner-large"></div>
      <p>جارٍ تحميل إعدادات الخطط والمعايير...</p>
    </div>

    <!-- قائمة أنواع الخطط والعناصر -->
    <div v-else class="categories-container">
      <div 
        v-for="category in filteredCategories" 
        :key="category.id" 
        class="category-card"
      >
        <!-- رأس كارت نوع الخطة -->
        <div class="category-header">
          <div class="category-info">
            <div class="category-badge-icon">
              {{ getCategoryIcon(category.name) }}
            </div>
            <div>
              <div class="cat-title-row">
                <h2 class="category-name">{{ category.name }}</h2>
                <span class="items-count-badge">
                  {{ category.items ? category.items.length : 0 }} عناصر
                </span>
                <span class="total-hours-badge" v-if="category.items && category.items.length">
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

        <!-- شبكة العناصر المقدرة -->
        <div class="category-body">
          <div v-if="!category.items || category.items.length === 0" class="empty-category-box">
            <p>لا توجد عناصر مضافة بعد لخطة "{{ category.name }}".</p>
            <button 
              type="button" 
              class="btn-subtle" 
              @click="openAddItemModal(category)"
            >
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

      <!-- كارت إضافة نوع خطة جديد سريع -->
      <div class="add-new-category-placeholder" @click="openAddCategoryModal">
        <div class="placeholder-icon">＋</div>
        <h3>إضافة نوع خطة جديد</h3>
        <p>انقر هنا لإنشاء خطة مخصصة وإدراج عناصر عمل جديدة بساعاتها التقديرية</p>
      </div>
    </div>

    <!-- شريط عائم سفلي ثابت يظهر فور وجود تعديلات غير محفوظة -->
    <Transition name="slide-up">
      <div v-if="hasUnsavedChanges" class="unsaved-floating-bar" dir="rtl">
        <div class="floating-bar-inner">
          <div class="floating-bar-info">
            <span class="floating-beacon">⚠️</span>
            <div>
              <strong>توجد تعديلات معلقة على ساعات العمل!</strong>
              <span>لا تنسَ حفظ التغييرات قبل التنقل أو إغلاق الصفحة.</span>
            </div>
          </div>
          <div class="floating-bar-actions">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="discardChanges"
              :disabled="savingBulk"
            >
              تراجع واستعادة القيم
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm save-floating-btn" 
              @click="saveAllHours"
              :disabled="savingBulk"
            >
              <span v-if="savingBulk" class="spinner-inline"></span>
              <span v-else>💾</span>
              <span>حفظ كافة الساعات الآن</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- مودال إضافة / تعديل نوع خطة -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditingCategory ? 'تعديل نوع الخطة' : 'إضافة نوع خطة جديد' }}</h3>
            <button class="modal-close-btn" @click="showCategoryModal = false">×</button>
          </div>
          <form @submit.prevent="submitCategoryForm">
            <div class="form-group">
              <label>اسم نوع الخطة <span class="required-star">*</span></label>
              <input 
                v-model="categoryForm.name" 
                type="text" 
                required 
                placeholder="مثال: Social Media Growth Plan"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>وصف توضيحي (اختياري)</label>
              <textarea 
                v-model="categoryForm.description" 
                rows="3" 
                placeholder="نبذة عن طبيعة مهام وعناصر هذا النوع..." 
                class="form-control"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showCategoryModal = false">إلغاء</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingCategory">
                {{ submittingCategory ? 'جارٍ الحفظ...' : (isEditingCategory ? 'تحديث' : 'إضافة النوع') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- مودال إضافة عنصر جديد -->
    <Teleport to="body">
      <div v-if="showItemModal" class="modal-overlay" @click.self="showItemModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>إضافة عنصر عمل جديد إلى "{{ targetCategoryForNewItem?.name }}"</h3>
            <button class="modal-close-btn" @click="showItemModal = false">×</button>
          </div>
          <form @submit.prevent="submitItemForm">
            <div class="form-group">
              <label>اسم العنصر / نوع المنشور <span class="required-star">*</span></label>
              <input 
                v-model="itemForm.name" 
                type="text" 
                required 
                placeholder="مثال: انفوجرافيك تفاعلي، فيديو ترويجي 30 ثانية..."
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>عدد ساعات العمل المقدرة (بالساعة) <span class="required-star">*</span></label>
              <div class="hours-input-wrapper modal-input-wrapper">
                <span class="clock-icon">⏱️</span>
                <input 
                  v-model.number="itemForm.estimated_hours" 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  required
                  placeholder="مثال: 3"
                  class="hours-input form-control"
                />
                <span class="unit-tag">ساعة</span>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showItemModal = false">إلغاء</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingItem">
                {{ submittingItem ? 'جارٍ الإضافة...' : 'إضافة العنصر' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import api from '../axios';
import alertService from '../services/alertService';

const categories = ref([]);
const loading = ref(true);
const savingBulk = ref(false);
const searchQuery = ref('');

// خريطة الساعات الأصلية للمقارنة الدقيقة واكتشاف أي تعديل
const originalHoursMap = ref({});

const updateSnapshot = () => {
  const map = {};
  categories.value.forEach(cat => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        map[item.id] = Number(item.estimated_hours) || 0;
      });
    }
  });
  originalHoursMap.value = map;
};

// فحص وجود أي تعديلات معلقة بدقة
const hasUnsavedChanges = computed(() => {
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

// فحص ما إذا كان عنصر معين تم تعديله
const isItemModified = (item) => {
  if (!item || originalHoursMap.value[item.id] === undefined) return false;
  const orig = originalHoursMap.value[item.id];
  const current = Number(item.estimated_hours) || 0;
  return Math.abs(orig - current) > 0.001;
};

// استعادة القيم الأصلية والتراجع عن التعديلات
const discardChanges = () => {
  categories.value.forEach(cat => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        if (originalHoursMap.value[item.id] !== undefined) {
          item.estimated_hours = originalHoursMap.value[item.id];
        }
      });
    }
  });
  alertService.info('تم التراجع عن التعديلات واستعادة الساعات السابقة.');
};

// جلب كافة التصنيفات وعناصرها
const fetchSettings = async () => {
  loading.value = true;
  try {
    const res = await api.get('/settings/plan-item-estimates');
    categories.value = res.data.data || [];
    updateSnapshot();
  } catch (error) {
    alertService.error('تعذر جلب إعدادات ساعات الخطط.');
  } finally {
    loading.value = false;
  }
};

const totalItemsCount = computed(() => {
  return categories.value.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);
});

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
  return categories.value.map(cat => {
    const catMatches = cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
    const matchingItems = cat.items ? cat.items.filter(item => item.name.toLowerCase().includes(q)) : [];
    
    if (catMatches) {
      return cat;
    }
    if (matchingItems.length > 0) {
      return {
        ...cat,
        items: matchingItems
      };
    }
    return null;
  }).filter(Boolean);
});

const getCategoryIcon = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('content')) return '📝';
  if (n.includes('media production') || n.includes('video')) return '🎬';
  if (n.includes('digital') || n.includes('strategy')) return '🎯';
  if (n.includes('media buying') || n.includes('ad')) return '📢';
  if (n.includes('seo')) return '🔍';
  if (n.includes('analytics') || n.includes('reporting')) return '📊';
  return '📁';
};

// حفظ كافة الساعات دفعة واحدة
const saveAllHours = async () => {
  savingBulk.value = true;
  try {
    const allEstimates = [];
    categories.value.forEach(cat => {
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach(item => {
          allEstimates.push({
            id: item.id,
            estimated_hours: Number(item.estimated_hours) || 0
          });
        });
      }
    });

    if (allEstimates.length === 0) {
      alertService.info('لا توجد عناصر للحفظ.');
      savingBulk.value = false;
      return;
    }

    await api.put('/settings/plan-item-estimates/bulk-update', {
      estimates: allEstimates
    });

    updateSnapshot();
    alertService.success('تم حفظ وتحديث كافة الساعات بنجاح ✅');
  } catch (error) {
    alertService.error('حدث خطأ أثناء حفظ الساعات.');
  } finally {
    savingBulk.value = false;
  }
};

// ==========================================
// حماية مغادرة الصفحة والتنبيه التفاعلي
// ==========================================
onBeforeRouteLeave(async (to, from) => {
  if (hasUnsavedChanges.value) {
    const confirmed = await alertService.confirm({
      title: 'تنبيه: تعديلات غير محفوظة ⚠️',
      message: 'لديك تغييرات تم إجراؤها على ساعات العمل ولم تقم بحفظها بعد! هل أنت متأكد من رغبتك في مغادرة الصفحة وإلغاء هذه التعديلات؟',
      confirmText: 'نعم، مغادرة دون حفظ',
      cancelText: 'البقاء في الصفحة لحفظ التغييرات',
      type: 'warning'
    });

    if (!confirmed) {
      return false; // إلغاء التنقل والبقاء في الصفحة
    }
  }
  return true;
});

// تحذير المتصفح عند إعادة التحميل أو إغلاق التبويب
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
};

// مودال التصنيف
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
        description: categoryForm.value.description
      });
      const idx = categories.value.findIndex(c => c.id === categoryForm.value.id);
      if (idx !== -1) {
        categories.value[idx].name = res.data.data.name;
        categories.value[idx].description = res.data.data.description;
      }
      alertService.success('تم تحديث نوع الخطة بنجاح');
    } else {
      const res = await api.post('/settings/plan-item-categories', {
        name: categoryForm.value.name,
        description: categoryForm.value.description
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
    type: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-categories/${cat.id}`);
    categories.value = categories.value.filter(c => c.id !== cat.id);
    updateSnapshot();
    alertService.success('تم حذف نوع الخطة بنجاح 🗑️');
  } catch (error) {
    alertService.error('فشل في حذف نوع الخطة.');
  }
};

// مودال العنصر
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
      estimated_hours: Number(itemForm.value.estimated_hours) || 0
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
    type: 'warning'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-estimates/${item.id}`);
    category.items = category.items.filter(i => i.id !== item.id);
    delete originalHoursMap.value[item.id];
    alertService.success('تم حذف العنصر بنجاح.');
  } catch (error) {
    alertService.error('تعذر حذف العنصر.');
  }
};

onMounted(() => {
  fetchSettings();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 100%;
  color: #edf2f7;
  font-family: inherit;
  padding-bottom: 90px;
}

/* الرأس */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(18, 24, 65, 0.65);
  border: 1px solid rgba(138, 155, 235, 0.16);
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 8px 30px rgba(3, 7, 26, 0.3);
  backdrop-filter: blur(12px);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #7987bd;
  margin-bottom: 6px;
}

.active-crumb {
  color: #7de8dc;
  font-weight: 700;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 14px;
}

.settings-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.2), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(125, 232, 220, 0.4);
  display: grid;
  place-items: center;
  font-size: 24px;
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.15);
}

.title-with-badge h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.title-with-badge p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #9aa7d9;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #7de8dc, #64cfc3);
  color: #0c1236;
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.35);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #8ef2e6, #7de8dc);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(125, 232, 220, 0.5);
}

.btn-secondary {
  background: rgba(138, 155, 235, 0.12);
  border: 1px solid rgba(138, 155, 235, 0.25);
  color: #dbe4ff;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(138, 155, 235, 0.22);
  color: #ffffff;
  border-color: rgba(138, 155, 235, 0.4);
}

.save-all-btn {
  position: relative;
  min-width: 160px;
}

.save-all-btn.needs-save-pulse {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  box-shadow: 0 0 18px rgba(245, 158, 11, 0.55);
  animation: save-pulse 1.8s infinite;
}

@keyframes save-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 14px rgba(245, 158, 11, 0.4); }
  50% { transform: scale(1.03); box-shadow: 0 0 24px rgba(245, 158, 11, 0.7); }
}

.unsaved-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  display: grid;
  place-items: center;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* شريط التنبيه العلوي المميز */
.unsaved-changes-top-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.12));
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 14px;
  padding: 14px 20px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
  backdrop-filter: blur(8px);
}

.top-alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon-beacon {
  font-size: 22px;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
}

.top-alert-content strong {
  display: block;
  font-size: 13.5px;
  color: #fef3c7;
  font-weight: 800;
}

.top-alert-content p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: #fde68a;
}

.top-alert-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-alert-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f59e0b;
  color: #1e1302;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}

.btn-alert-save:hover:not(:disabled) {
  background: #fbbf24;
  transform: translateY(-1px);
}

.btn-alert-discard {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fde68a;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-alert-discard:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

/* شريط البحث والإحصاءات */
.summary-and-search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.stats-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(19, 27, 72, 0.55);
  border: 1px solid rgba(138, 155, 235, 0.15);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11.5px;
}

.warning-pill {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.4);
}

.warning-text {
  color: #fbbf24 !important;
  font-weight: 800;
}

.pill-label {
  color: #8b99cf;
}

.pill-value {
  color: #ffffff;
  font-weight: 800;
}

.pill-value.highlight {
  color: #7de8dc;
}

.search-box {
  position: relative;
  min-width: 280px;
  flex: 0 1 360px;
}

.search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  background: rgba(17, 24, 68, 0.7);
  border: 1px solid rgba(138, 155, 235, 0.2);
  border-radius: 10px;
  padding: 9px 36px 9px 32px;
  color: #ffffff;
  font-size: 12px;
  transition: all 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: #7de8dc;
  box-shadow: 0 0 12px rgba(125, 232, 220, 0.25);
  background: rgba(17, 24, 68, 0.95);
}

.clear-search {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #8f9bc7;
  font-size: 16px;
  cursor: pointer;
}

/* بطاقات الكاتيجوري */
.categories-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-card {
  background: rgba(16, 23, 62, 0.75);
  border: 1px solid rgba(138, 155, 235, 0.16);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(4, 7, 26, 0.25);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  border-color: rgba(125, 232, 220, 0.3);
  box-shadow: 0 8px 30px rgba(4, 7, 26, 0.4);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(12, 17, 49, 0.7);
  border-bottom: 1px solid rgba(138, 155, 235, 0.1);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-badge-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(138, 155, 235, 0.1);
  border: 1px solid rgba(138, 155, 235, 0.25);
  display: grid;
  place-items: center;
  font-size: 20px;
}

.cat-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-name {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.items-count-badge {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.3);
  padding: 2px 8px;
  border-radius: 8px;
}

.total-hours-badge {
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 2px 8px;
  border-radius: 8px;
}

.category-desc {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: #8c9ac9;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(138, 155, 235, 0.08);
  border: 1px solid rgba(138, 155, 235, 0.2);
  color: #d0daf8;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.icon-action-btn:hover {
  background: rgba(138, 155, 235, 0.18);
  color: #ffffff;
}

.icon-action-btn.add-item-btn {
  background: rgba(125, 232, 220, 0.12);
  border-color: rgba(125, 232, 220, 0.3);
  color: #7de8dc;
}

.icon-action-btn.add-item-btn:hover {
  background: rgba(125, 232, 220, 0.22);
  color: #a0f5ec;
}

.icon-action-btn.delete-cat-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.category-body {
  padding: 20px;
}

.empty-category-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #7c8abf;
  background: rgba(10, 15, 42, 0.4);
  border: 1px dashed rgba(138, 155, 235, 0.2);
  border-radius: 12px;
  gap: 12px;
  text-align: center;
}

.empty-category-box p {
  margin: 0;
  font-size: 13px;
}

.btn-subtle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(125, 232, 220, 0.1);
  border: 1px solid rgba(125, 232, 220, 0.3);
  color: #7de8dc;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-subtle:hover {
  background: rgba(125, 232, 220, 0.2);
  color: #ffffff;
}

/* شبكة العناصر */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.item-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  background: rgba(10, 15, 42, 0.55);
  border: 1px solid rgba(138, 155, 235, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-card:hover {
  border-color: rgba(125, 232, 220, 0.35);
  background: rgba(14, 21, 58, 0.7);
  transform: translateY(-1px);
}

.item-card.item-modified {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(245, 158, 11, 0.06);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.15);
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.item-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  font-size: 13px;
  font-weight: 700;
  color: #f1f4ff;
  line-height: 1.4;
  word-break: break-word;
}

.modified-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
  flex-shrink: 0;
}

.item-delete-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.2s, background 0.2s;
}

.item-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.item-input-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid rgba(138, 155, 235, 0.08);
  padding-top: 8px;
}

.input-label {
  font-size: 11px;
  color: #8392c4;
}

.hours-input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: rgba(8, 12, 34, 0.85);
  border: 1px solid rgba(138, 155, 235, 0.25);
  border-radius: 8px;
  padding: 2px 8px;
  transition: all 0.2s;
}

.hours-input-wrapper.wrapper-modified {
  border-color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
  background: rgba(26, 18, 5, 0.9);
}

.hours-input-wrapper:focus-within {
  border-color: #7de8dc;
  box-shadow: 0 0 10px rgba(125, 232, 220, 0.2);
}

.clock-icon {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}

.hours-input {
  width: 65px;
  background: transparent;
  border: none;
  color: #7de8dc;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  outline: none;
  font-family: inherit;
}

.wrapper-modified .hours-input {
  color: #fbbf24;
}

.hours-input::-webkit-inner-spin-button,
.hours-input::-webkit-outer-spin-button {
  opacity: 1;
}

.unit-tag {
  font-size: 10.5px;
  color: #8c9ac9;
  font-weight: 600;
  margin-right: 4px;
}

/* الشريط العائم السفلي */
.unsaved-floating-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: min(880px, calc(100vw - 36px));
  z-index: 1000;
  pointer-events: auto;
}

.floating-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(15, 21, 56, 0.95);
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: 16px;
  padding: 14px 22px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65), 0 0 25px rgba(245, 158, 11, 0.2);
  backdrop-filter: blur(16px);
}

.floating-bar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.floating-beacon {
  font-size: 24px;
  animation: pulse-beacon 1.5s infinite;
}

@keyframes pulse-beacon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.floating-bar-info strong {
  display: block;
  font-size: 13.5px;
  color: #fef3c7;
  font-weight: 800;
}

.floating-bar-info span {
  display: block;
  font-size: 11px;
  color: #fde68a;
  margin-top: 2px;
}

.floating-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}

.save-floating-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
}

.save-floating-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  transform: translateY(-1px);
}

/* كارت إضافة نوع خطة جديد المساعد */
.add-new-category-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 20px;
  background: rgba(14, 20, 56, 0.35);
  border: 2px dashed rgba(138, 155, 235, 0.25);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}

.add-new-category-placeholder:hover {
  background: rgba(14, 20, 56, 0.6);
  border-color: #7de8dc;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(125, 232, 220, 0.1);
}

.placeholder-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.3);
  display: grid;
  place-items: center;
  font-size: 20px;
  color: #7de8dc;
  margin-bottom: 12px;
}

.add-new-category-placeholder h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #f1f4ff;
}

.add-new-category-placeholder p {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: #8795c7;
}

/* المودال */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 6, 24, 0.75);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  z-index: 99999;
  padding: 16px;
}

.modal-card {
  width: min(480px, 100%);
  background: #0f153a;
  border: 1px solid rgba(138, 155, 235, 0.25);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  padding: 22px 24px;
  color: #edf2f7;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(138, 155, 235, 0.12);
  padding-bottom: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #8c9ac9;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
}

.required-star {
  color: #ef4444;
}

.form-control {
  background: rgba(8, 12, 34, 0.85);
  border: 1px solid rgba(138, 155, 235, 0.25);
  border-radius: 9px;
  padding: 9px 12px;
  color: #ffffff;
  font-size: 12.5px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #7de8dc;
  box-shadow: 0 0 10px rgba(125, 232, 220, 0.25);
}

.modal-input-wrapper {
  padding: 4px 10px;
  width: 100%;
}

.modal-input-wrapper .hours-input {
  width: 100%;
  text-align: right;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

/* مؤشرات الحالة والـ Spinner */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #8f9dc9;
  gap: 12px;
}

.spinner-large {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(125, 232, 220, 0.2);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(12, 18, 54, 0.3);
  border-top-color: #0c1236;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-inline.dark {
  border-color: rgba(30, 19, 2, 0.3);
  border-top-color: #1e1302;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 30px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .btn {
    flex: 1;
  }
  .summary-and-search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    width: 100%;
  }
  .items-grid {
    grid-template-columns: 1fr;
  }
  .unsaved-changes-top-alert {
    flex-direction: column;
    align-items: stretch;
  }
  .top-alert-actions {
    width: 100%;
  }
  .top-alert-actions button {
    flex: 1;
  }
  .floating-bar-inner {
    flex-direction: column;
    align-items: stretch;
  }
  .floating-bar-actions {
    width: 100%;
  }
  .floating-bar-actions button {
    flex: 1;
  }
}
</style>
