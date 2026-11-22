<template>
  <div class="tab-content-pane">
    <div class="accounts-header-strip">
      <div>
        <h3>أقسام وتصنيفات الحسابات</h3>
        <p>تنظيم وتبويب أبواب المصروفات والإيرادات لسهولة التحليل والتقارير</p>
      </div>
      <button class="primary-btn" type="button" @click="$emit('add-category', categoryTypeFilter === 'income' ? 'income' : 'expense')">
        <span>＋</span> إضافة قسم جديد
      </button>
    </div>

    <!-- فلتر تصنيف الأقسام (مصروفات / إيرادات / الكل والبحث السريع) -->
    <div class="filter-card categories-filter-bar">
      <div class="categories-filter-content">
        <!-- أزرار التصفية السريعة بالنوع -->
        <div class="categories-filter-pills">
          <button
            type="button"
            class="pill-filter-btn"
            :class="{ active: categoryTypeFilter === 'all' }"
            @click="categoryTypeFilter = 'all'"
          >
            جميع الأقسام ({{ categories.length }})
          </button>
          <button
            type="button"
            class="pill-filter-btn pill-expense"
            :class="{ active: categoryTypeFilter === 'expense' }"
            @click="categoryTypeFilter = 'expense'"
          >
            📉 أقسام المصروفات ({{ expenseCategoriesCount }})
          </button>
          <button
            type="button"
            class="pill-filter-btn pill-income"
            :class="{ active: categoryTypeFilter === 'income' }"
            @click="categoryTypeFilter = 'income'"
          >
            📈 أقسام الإيرادات ({{ incomeCategoriesCount }})
          </button>
        </div>

        <!-- البحث والفرز السريع -->
        <div class="categories-search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="categorySearchQuery"
            type="text"
            class="filter-input search-input"
            placeholder="بحث باسم القسم أو الوصف..."
          />
          <button
            v-if="categorySearchQuery || categoryTypeFilter !== 'all'"
            type="button"
            class="reset-filter-btn"
            title="إعادة ضبط الفلتر"
            @click="resetFilter"
          >
            ↺ تصفير
          </button>
        </div>
      </div>
    </div>

    <!-- شبكة بطاقات الأقسام المفلترة -->
    <div v-if="filteredCategories.length > 0" class="categories-grid">
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="category-card"
        :style="{ borderTopColor: cat.color || '#38bdf8' }"
      >
        <div class="cat-card-header">
          <span class="cat-big-icon">{{ cat.icon || '📁' }}</span>
          <div class="cat-badges-wrap">
            <span v-if="cat.cost_type === 'fixed' || cat.slug === 'office_rent'" class="cost-type-pill">مصروف ثابت</span>
            <span class="type-pill" :class="cat.type === 'income' ? 'type-income' : 'type-expense'">
              {{ cat.type === 'income' ? 'إيراد' : 'مصروف' }}
            </span>
          </div>
        </div>

        <div class="cat-card-body">
          <h4>{{ cat.name }}</h4>
          <p>{{ cat.description || 'لا يوجد وصف مضاف' }}</p>
          <div v-if="(cat.cost_type === 'fixed' || cat.slug === 'office_rent') && Number(cat.fixed_amount) > 0" class="cat-fixed-amount-box">
            <span class="fixed-label">المبلغ المحدد:</span>
            <strong class="fixed-val">{{ formatCurrency(cat.fixed_amount) }}</strong>
          </div>
          <small class="trx-count">{{ cat.transactions_count || 0 }} معاملة مسجلة</small>
        </div>

        <div class="cat-card-footer">
          <template v-if="cat.is_system">
            <span class="system-badge">قسم أساسي للنظام 🔒</span>
            <button class="edit-btn" @click="$emit('edit-category', cat)" title="تعديل بيانات أو قيمة القسم">تعديل ✏️</button>
          </template>
          <div v-else class="custom-actions">
            <button class="edit-btn" @click="$emit('edit-category', cat)">تعديل</button>
            <button class="delete-btn" @click="$emit('delete-category', cat)">حذف</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      لا توجد أقسام مطابقة للفلتر المحدد
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})

defineEmits(['add-category', 'edit-category', 'delete-category'])

const categoryTypeFilter = ref('all')
const categorySearchQuery = ref('')

const expenseCategoriesCount = computed(() => {
  return props.categories.filter(c => c.type === 'expense').length
})

const incomeCategoriesCount = computed(() => {
  return props.categories.filter(c => c.type === 'income').length
})

const filteredCategories = computed(() => {
  return props.categories.filter(cat => {
    if (categoryTypeFilter.value !== 'all' && cat.type !== categoryTypeFilter.value) {
      return false
    }
    if (categorySearchQuery.value && categorySearchQuery.value.trim()) {
      const q = categorySearchQuery.value.trim().toLowerCase()
      const matchName = cat.name && cat.name.toLowerCase().includes(q)
      const matchDesc = cat.description && cat.description.toLowerCase().includes(q)
      if (!matchName && !matchDesc) {
        return false
      }
    }
    return true
  })
})

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString() + ' ج.م'
}

const resetFilter = () => {
  categorySearchQuery.value = ''
  categoryTypeFilter.value = 'all'
}
</script>

<style scoped>
.accounts-header-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

.accounts-header-strip h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.accounts-header-strip p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.primary-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #38bdf8, #0284c7);
  color: #0c1236;
  font-size: 13px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
}

.filter-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 14px;
}

.categories-filter-bar {
  margin-bottom: 20px;
  padding: 14px 18px;
}

.categories-filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.categories-filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.pill-filter-btn.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.35));
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.categories-filter-pills .pill-expense.active {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.22), rgba(225, 29, 72, 0.32));
  border-color: #f43f5e;
  color: #fb7185;
}

.categories-filter-pills .pill-income.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.32));
  border-color: #10b981;
  color: #34d399;
}

.categories-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  min-width: 250px;
}

.search-icon {
  font-size: 14px;
  color: #94a3b8;
}

.filter-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-radius: 8px;
  padding: 7px 12px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.filter-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.categories-search-box .search-input {
  width: 100%;
}

.reset-filter-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  transition: all 0.2s;
}

.reset-filter-btn:hover {
  color: #ffffff;
  border-color: #38bdf8;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.category-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-top: 4px solid;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-big-icon {
  font-size: 26px;
}

.cat-badges-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cost-type-pill {
  font-size: 10.5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 700;
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.type-pill {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.type-income {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.type-expense {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.cat-card-body h4 {
  margin: 0 0 4px;
  font-size: 15px;
  color: #ffffff;
}

.cat-card-body p {
  margin: 0 0 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.cat-fixed-amount-box {
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.cat-fixed-amount-box .fixed-label {
  color: #94a3b8;
}

.cat-fixed-amount-box .fixed-val {
  color: #38bdf8;
  font-weight: 700;
}

.trx-count {
  font-size: 11px;
  color: #64748b;
}

.cat-card-footer {
  padding-top: 8px;
  border-top: 1px solid rgba(135, 155, 230, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.system-badge {
  font-size: 11px;
  color: #64748b;
}

.cat-card-footer .edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.cat-card-footer .edit-btn:hover {
  background: rgba(56, 189, 248, 0.12);
}

.custom-actions {
  display: flex;
  gap: 10px;
}

.custom-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.custom-actions .edit-btn {
  color: #38bdf8;
}

.custom-actions .edit-btn:hover {
  background: rgba(56, 189, 248, 0.12);
}

.custom-actions .delete-btn {
  color: #f43f5e;
}

.custom-actions .delete-btn:hover {
  background: rgba(244, 63, 94, 0.12);
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 13px;
}
</style>
