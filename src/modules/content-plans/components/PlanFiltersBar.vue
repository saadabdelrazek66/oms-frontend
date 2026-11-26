<template>
  <div class="filters-bar" :class="{ 'advanced-open': showAdvanced }">
    <div class="filters-header">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="filters.search"
          type="text"
          placeholder="بحث باسم العميل، نوع الخطة، أو ملاحظات..."
          @keyup.enter="$emit('apply')"
        />
      </div>
      <div class="filters-actions">
        <button class="secondary-btn" type="button" @click="$emit('toggle-advanced')">
          <span>⎈</span> فلاتر متقدمة
        </button>
        <button class="primary-btn" type="button" :disabled="loading" @click="$emit('apply')">
          بحث وتصفية
        </button>
        <button v-if="hasActiveFilters" class="secondary-btn text-red" type="button" @click="$emit('reset')">
          إلغاء الفلاتر
        </button>
      </div>
    </div>

    <div v-show="showAdvanced" class="advanced-filters">
      <div class="form-grid-3">
        <div class="form-group">
          <label>العميل</label>
          <select v-model="filters.client_id">
            <option value="">الكل</option>
            <option v-for="client in allClients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>نوع الخطة</label>
          <select v-model="filters.plan_type">
            <option value="">الكل</option>
            <option v-for="cat in planCategories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            <option v-for="legacyType in legacyPlanTypes" :key="legacyType" :value="legacyType">
              {{ legacyType }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>حالة الخطة</label>
          <select v-model="filters.status">
            <option value="">الكل</option>
            <option value="pending">معلقة / قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="under_review">قيد المراجعة</option>
            <option value="reviewed">تمت المراجعة</option>
            <option value="completed">مكتملة ومغلقة</option>
            <option value="rejected">مرفوضة</option>
          </select>
        </div>

        <div v-if="canFilterByEmployee" class="form-group">
          <label>الموظف</label>
          <select v-model="filters.employee_id">
            <option value="">الكل</option>
            <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>تاريخ الخطة (من)</label>
          <input v-model="filters.start_date" type="date" />
        </div>
        <div class="form-group">
          <label>تاريخ الخطة (إلى)</label>
          <input v-model="filters.end_date" type="date" />
        </div>

        <div class="form-group">
          <label>موعد التسليم (من)</label>
          <input v-model="filters.delivery_from" type="date" />
        </div>
        <div class="form-group">
          <label>موعد التسليم (إلى)</label>
          <input v-model="filters.delivery_to" type="date" />
        </div>

        <div class="form-group">
          <label>موعد المراجعة (من)</label>
          <input v-model="filters.review_from" type="date" />
        </div>
        <div class="form-group">
          <label>موعد المراجعة (إلى)</label>
          <input v-model="filters.review_to" type="date" />
        </div>

        <div class="form-group toggle-group" style="align-items: flex-start; grid-column: span 2">
          <label>خيارات إضافية</label>
          <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 5px">
            <label class="custom-cb">
              <input v-model="filters.is_overdue" type="checkbox" value="1" />
              <span class="cb-text text-red">متأخرة فقط</span>
            </label>
            <label class="custom-cb">
              <input v-model="filters.requires_review" type="checkbox" value="1" />
              <span class="cb-text">تتطلب مراجعة</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  showAdvanced: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  hasActiveFilters: { type: Boolean, default: false },
  canFilterByEmployee: { type: Boolean, default: false },
  allClients: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  planCategories: { type: Array, default: () => [] },
  legacyPlanTypes: { type: Array, default: () => [] },
})

defineEmits(['toggle-advanced', 'apply', 'reset'])
</script>
