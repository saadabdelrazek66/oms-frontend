<template>
  <div class="notification-templates-management" dir="rtl">
    <!-- رأس الصفحة الموحد والإحصائيات وفتات الخبز -->
    <div class="templates-header-card">
      <!-- شريط التنقل العلوي وزر العودة -->
      <div class="header-top-nav-row">
        <nav class="breadcrumbs-nav" aria-label="مسار التنقل">
          <router-link to="/manager/dashboard" class="crumb-link">لوحة التحكم</router-link>
          <span class="crumb-sep">/</span>
          <router-link to="/settings" class="crumb-link">إعدادات النظام</router-link>
          <span class="crumb-sep">/</span>
          <span class="crumb-current">قوالب الرسائل والواتساب</span>
        </nav>

        <router-link to="/settings" class="btn-return-settings">
          <span>⚙️</span>
          <span>العودة للإعدادات العامة</span>
        </router-link>
      </div>

      <!-- محتوى العنوان الرئيسي والإحصائيات -->
      <div class="header-main-content-row">
        <div class="header-main-info">
          <div class="header-icon-box">💬</div>
          <div>
            <h1 class="header-title">قوالب رسائل التنبيهات والواتساب</h1>
            <p class="header-subtitle">
              تحكم كامل وتخصيص لصياغة رسائل التنبيهات والواتساب لجميع عمليات النظام مع فحص القواعد والمعاينة الحية.
            </p>
          </div>
        </div>

        <!-- بطاقات الإحصائيات السريعة -->
        <div class="summary-chips-row">
          <div class="summary-chip">
            <span class="chip-label">إجمالي القوالب:</span>
            <span class="chip-val">{{ totalTemplatesCount }}</span>
          </div>
          <div class="summary-chip success">
            <span class="chip-label">المفعلة:</span>
            <span class="chip-val">{{ enabledTemplatesCount }}</span>
          </div>
          <div class="summary-chip info">
            <span class="chip-label">التصنيفات:</span>
            <span class="chip-val">{{ groups.length }}</span>
          </div>
          <button 
            type="button" 
            class="btn-refresh-templates"
            :disabled="loading"
            @click="fetchTemplates"
            title="تحديث القوالب"
          >
            <span :class="{ 'spin-icon': loading }">🔄</span>
            <span>تحديث</span>
          </button>
        </div>
      </div>
    </div>

    <!-- شريط تصنيفات المجموعات الأفقي السريع -->
    <div v-if="!loading" class="workspace-categories-bar">
      <div class="categories-bar-header">
        <span class="categories-icon">🗂️</span>
        <span class="categories-title">أقسام التنبيهات:</span>
      </div>

      <div class="categories-pills-carousel">
        <button
          type="button"
          class="category-nav-pill"
          :class="{ active: selectedGroupFilter === 'all' }"
          @click="selectCategory('all')"
        >
          <span class="pill-icon">📑</span>
          <span class="pill-name">كافة المجموعات</span>
          <span class="pill-counter">{{ totalTemplatesCount }}</span>
        </button>

        <button
          v-for="grp in groups"
          :key="grp.group"
          type="button"
          class="category-nav-pill"
          :class="{ active: selectedGroupFilter === grp.group }"
          @click="selectCategory(grp.group)"
        >
          <span class="pill-icon">{{ grp.icon }}</span>
          <span class="pill-name">{{ grp.label }}</span>
          <span class="pill-counter">{{ grp.templates ? grp.templates.length : 0 }}</span>
        </button>
      </div>
    </div>

    <!-- شاشة التحميل -->
    <div v-if="loading" class="templates-loading-box">
      <div class="spinner-large"></div>
      <p>جارٍ تحميل قوالب الإشعارات وفحص القواعد...</p>
    </div>

    <div v-else class="templates-workspace-layout">
      <!-- ============================================== -->
      <!-- الشريط الجانبي: قائمة أسماء القوالب الموسعة -->
      <!-- ============================================== -->
      <aside class="templates-sidebar-panel">
        <!-- ترويسة قائمة القوالب والبحث -->
        <div class="sidebar-header-section">
          <div class="sidebar-title-badge-row">
            <div class="sidebar-category-current">
              <span class="current-cat-icon">{{ currentGroupIcon }}</span>
              <h3 class="current-cat-title">{{ currentGroupTitle }}</h3>
            </div>
            <span class="sidebar-items-badge">{{ filteredTemplates.length }} قالب</span>
          </div>

          <!-- شريط البحث الذكي -->
          <div class="sidebar-search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery"
              type="text"
              class="sidebar-search-input"
              placeholder="ابحث باسم القالب، المعرف، أو الشرح..."
            />
            <button 
              v-if="searchQuery" 
              type="button" 
              class="clear-search-btn"
              @click="searchQuery = ''"
              title="مسح البحث"
            >
              ✕
            </button>
          </div>

          <!-- فلاتر التصفية السريعة للقوالب -->
          <div class="sidebar-filter-tabs">
            <button
              type="button"
              class="filter-tab-chip"
              :class="{ active: selectedStatusFilter === 'all' }"
              @click="selectedStatusFilter = 'all'"
            >
              الكل ({{ categoryTotalCount }})
            </button>
            <button
              type="button"
              class="filter-tab-chip"
              :class="{ active: selectedStatusFilter === 'enabled' }"
              @click="selectedStatusFilter = 'enabled'"
            >
              🟢 المفعلة ({{ categoryEnabledCount }})
            </button>
            <button
              v-if="categoryModifiedCount > 0"
              type="button"
              class="filter-tab-chip"
              :class="{ active: selectedStatusFilter === 'modified' }"
              @click="selectedStatusFilter = 'modified'"
            >
              ✏️ مخصصة ({{ categoryModifiedCount }})
            </button>
          </div>
        </div>

        <!-- قائمة أسماء القوالب الموسعة (Spacious Full-Height Scrollable List) -->
        <div class="templates-scroll-list">
          <div 
            v-if="filteredTemplates.length === 0" 
            class="templates-empty-state"
          >
            <span class="empty-icon">🔍</span>
            <p class="empty-text">لا توجد قوالب تطابق البحث أو الفلتر المحدد</p>
            <button 
              v-if="searchQuery || selectedStatusFilter !== 'all' || selectedGroupFilter !== 'all'"
              type="button"
              class="btn-reset-filters-inline"
              @click="resetAllFilters"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>

          <div
            v-for="tpl in filteredTemplates"
            :key="tpl.key"
            class="template-item-card"
            :class="{ 
              active: selectedTemplate && selectedTemplate.key === tpl.key,
              disabled: !tpl.is_enabled,
              modified: isTemplateModified(tpl)
            }"
            @click="selectTemplate(tpl)"
          >
            <div class="item-card-top">
              <span class="item-channel-tag" :class="tpl.channel">
                {{ getChannelLabel(tpl.channel) }}
              </span>
              <div class="item-status-icons">
                <span 
                  v-if="isTemplateModified(tpl)" 
                  class="modified-pill" 
                  title="تم تخصيص هذا القالب ومختلف عن النص الافتراضي"
                >
                  مُخصص
                </span>
                <span 
                  class="status-indicator-dot" 
                  :class="tpl.is_enabled ? 'enabled' : 'disabled'"
                  :title="tpl.is_enabled ? 'مفعل' : 'معطل'"
                ></span>
              </div>
            </div>

            <h4 class="item-title">{{ tpl.name_ar }}</h4>
            <p class="item-key"><code>{{ tpl.key }}</code></p>
            <p class="item-desc">{{ tpl.description_ar }}</p>
          </div>
        </div>
      </aside>

      <!-- ============================================== -->
      <!-- المنطقة الرئيسية: المحرر الذكي والمعاينة الحية -->
      <!-- ============================================== -->
      <main class="template-editor-workspace" v-if="selectedTemplate">
        <!-- شريط أدوات القالب النشط -->
        <div class="active-template-toolbar">
          <div class="toolbar-title-box">
            <div class="toolbar-icon">{{ getGroupIcon(selectedTemplate.group) }}</div>
            <div>
              <div class="flex-align-center gap-2">
                <h3 class="toolbar-template-name">{{ selectedTemplate.name_ar }}</h3>
                <span class="badge-channel" :class="selectedTemplate.channel">
                  {{ getChannelLabel(selectedTemplate.channel) }}
                </span>
              </div>
              <p class="toolbar-template-key">المفتاح البرمجي: <code>{{ selectedTemplate.key }}</code></p>
            </div>
          </div>

          <div class="toolbar-actions">
            <!-- مفتاح التفعيل / التعطيل السريع -->
            <label class="toggle-control-label" title="تفعيل أو تعطيل هذا الإشعار في المنظومة">
              <span class="toggle-text">{{ editForm.is_enabled ? 'مفعل' : 'معطل' }}</span>
              <span class="switch-toggle-sm">
                <input type="checkbox" v-model="editForm.is_enabled" @change="handleFormChange" />
                <span class="slider-round-sm"></span>
              </span>
            </label>

            <!-- زر استعادة الافتراضي -->
            <button
              type="button"
              class="btn-action-restore"
              :disabled="resetting || !isTemplateModified(selectedTemplate)"
              @click="confirmResetToDefault"
              title="استعادة النص الافتراضي الأصلي لهذا القالب"
            >
              <span v-if="resetting" class="spin-icon">🔄</span>
              <span v-else>↺</span>
              <span>استعادة الأصلي</span>
            </button>

            <!-- زر الحفظ -->
            <button
              type="button"
              class="btn-action-save"
              :class="{ 'needs-save-glow': hasUnsavedChanges && syntaxReport.is_valid }"
              :disabled="saving || !hasUnsavedChanges || !syntaxReport.is_valid"
              @click="saveTemplate"
            >
              <span v-if="saving" class="spin-icon">⏳</span>
              <span v-else>💾</span>
              <span>حفظ التعديل</span>
            </button>
          </div>
        </div>

        <!-- تنبيه في حال كان القالب معطلاً -->
        <div v-if="!editForm.is_enabled" class="disabled-template-alert">
          <span>⚠️</span>
          <p>هذا القالب معطل حالياً، ولن يتم إرسال أي رسائل مرتبطة به لحين إعادة التفعيل.</p>
        </div>

        <!-- شبكة المحرر والمعاينة التفاعلية -->
        <div class="editor-and-preview-grid">
          <!-- 1. عمود التعديل وحاقن المتغيرات -->
          <div class="editor-column">
            <!-- عنوان الإشعار للنظام الداخلي إذا كان متاحاً -->
            <div v-if="selectedTemplate.channel === 'system' || selectedTemplate.channel === 'both'" class="form-group mb-4">
              <label class="field-label">
                <span>عنوان الإشعار في النظام (Title)</span>
                <small class="field-hint">يظهر كعنوان رئيسي في مركز التنبيهات الداخلي</small>
              </label>
              <input
                v-model="editForm.title_template"
                type="text"
                class="form-control-input"
                placeholder="عنوان الإشعار..."
                @input="handleFormChange"
              />
            </div>

            <!-- صندوق حاقن المتغيرات الذكي (Tags Injector) -->
            <div class="placeholders-injector-card">
              <div class="injector-header">
                <div class="flex-align-center gap-2">
                  <span class="injector-icon">🏷️</span>
                  <strong>المتغيرات المتاحة لهذا القالب (انقر للحقن المباشر):</strong>
                </div>
                <span class="injector-count">({{ availablePlaceholdersList.length }} متغير متاح)</span>
              </div>

              <div class="placeholders-tags-cloud">
                <button
                  v-for="ph in availablePlaceholdersList"
                  :key="ph.cleanKey"
                  type="button"
                  class="placeholder-tag-btn"
                  :class="{ 
                    required: ph.isRequired,
                    used: isPlaceholderUsed(ph.cleanKey)
                  }"
                  :title="`مثال: ${ph.example || ph.label} - انقر لإدراج المتغير داخل النص`"
                  @click="injectPlaceholder(ph.cleanKey)"
                >
                  <span class="tag-label">{{ ph.label }}</span>
                  <code class="tag-code">{<span>{{ ph.cleanKey }}</span>}</code>
                  <span v-if="ph.isRequired" class="required-star" title="متغير إلزامي">*</span>
                  <span v-if="isPlaceholderUsed(ph.cleanKey)" class="used-check">✓</span>
                </button>
              </div>
              <small class="injector-instruction">
                💡 النقر على أي متغير يقوم بإدراجه مباشرة عند مؤشر الكتابة داخل النص بالأسفل. المتغيرات الموسومة بـ (*) إلزامية.
              </small>
            </div>

            <!-- محرر نص الرسالة -->
            <div class="form-group mb-3">
              <div class="editor-label-bar">
                <label class="field-label">
                  <span>نص الرسالة وقالب التنبيه (Message Body Template)</span>
                  <span class="char-counter" :class="{ 'counter-danger': editForm.template_body.length > 3000 }">
                    {{ editForm.template_body.length }} / 3000 حرف
                  </span>
                </label>
                <!-- أدوات تنسيق واتساب السريعة -->
                <div class="whatsapp-toolbar-tools">
                  <button type="button" class="tool-btn" @click="wrapSelection('*', '*')" title="خط عريض Bold (*نص*)">
                    <strong>B</strong>
                  </button>
                  <button type="button" class="tool-btn" @click="wrapSelection('_', '_')" title="خط مائل Italic (_نص_)">
                    <em>I</em>
                  </button>
                  <button type="button" class="tool-btn" @click="wrapSelection('~', '~')" title="خط مشطوب Strike (~نص~)">
                    <s>S</s>
                  </button>
                  <button type="button" class="tool-btn" @click="insertText('\n▪️ ')" title="نقطة تعداد (▪️)">
                    ▪️
                  </button>
                  <button type="button" class="tool-btn" @click="insertText('⏰ ')" title="أيقونة وقت (⏰)">
                    ⏰
                  </button>
                  <button type="button" class="tool-btn" @click="insertText('✅ ')" title="أيقونة صح (✅)">
                    ✅
                  </button>
                </div>
              </div>

              <textarea
                ref="bodyTextareaRef"
                v-model="editForm.template_body"
                rows="10"
                class="form-control-textarea"
                placeholder="اكتب نص قالب التنبيه هنا..."
                @input="handleFormChange"
              ></textarea>
            </div>

            <!-- تقرير الفحص البرمجي اللحظي (Syntax Validation Report) -->
            <div class="syntax-report-box" :class="syntaxReportStatusClass">
              <div class="report-header">
                <span class="report-icon">{{ syntaxReportStatusIcon }}</span>
                <strong>{{ syntaxReportStatusTitle }}</strong>
              </div>

              <!-- قائمة الأخطاء المانعة -->
              <ul v-if="syntaxReport.errors && syntaxReport.errors.length > 0" class="report-errors-list">
                <li v-for="(err, idx) in syntaxReport.errors" :key="'err-' + idx">
                  {{ err }}
                </li>
              </ul>

              <!-- قائمة التحذيرات غير المانعة -->
              <ul v-if="syntaxReport.warnings && syntaxReport.warnings.length > 0" class="report-warnings-list">
                <li v-for="(warn, idx) in syntaxReport.warnings" :key="'warn-' + idx">
                  {{ warn }}
                </li>
              </ul>
            </div>
          </div>

          <!-- 2. عمود المعاينة الحية في واتساب -->
          <div class="preview-column">
            <div class="preview-card-wrapper">
              <div class="preview-card-header">
                <div class="flex-align-center gap-2">
                  <span class="whatsapp-logo-icon">📱</span>
                  <strong>معاينة حية واقعية (Live Preview)</strong>
                </div>
                <span class="preview-badge">شاشة المستلم</span>
              </div>

              <!-- محاكي واجهة تطبيق واتساب الواقعية -->
              <div class="whatsapp-mock-phone">
                <!-- شريط رأس محادثة واتساب -->
                <div class="mock-wa-header">
                  <div class="mock-wa-avatar">
                    <span>🏢</span>
                  </div>
                  <div class="mock-wa-contact">
                    <span class="contact-name">نظام الإشعارات - OMS</span>
                    <span class="contact-status">متصل الآن</span>
                  </div>
                  <div class="mock-wa-actions">
                    <span>📞</span>
                    <span>⋮</span>
                  </div>
                </div>

                <!-- أرضية المحادثة والفقاعة -->
                <div class="mock-wa-chat-area">
                  <div class="mock-wa-date-pill">اليوم</div>

                  <!-- فقاعة الرسالة الواردة الخضراء -->
                  <div class="mock-wa-bubble">
                    <!-- عنوان الإشعار الداخلي إذا كان موجوداً -->
                    <div v-if="previewResult.preview_title" class="mock-wa-bubble-title">
                      🔔 {{ previewResult.preview_title }}
                    </div>

                    <!-- نص الرسالة المنسق مع استبدال المتغيرات وتنسيقات Bold/Italic -->
                    <div 
                      class="mock-wa-bubble-body" 
                      v-html="formattedPreviewHtml"
                    ></div>

                    <!-- وقت الإرسال وعلامتي الصح الأزرق -->
                    <div class="mock-wa-bubble-meta">
                      <span class="bubble-time">{{ currentPreviewTime }}</span>
                      <span class="bubble-checks">✓✓</span>
                    </div>
                  </div>
                </div>

                <!-- شريط الإدخال الوهمي للواتساب -->
                <div class="mock-wa-input-bar">
                  <span class="wa-input-icon">😊</span>
                  <div class="wa-input-fake">اكتب رسالة...</div>
                  <span class="wa-input-icon">📎</span>
                  <span class="wa-mic-btn">🎙️</span>
                </div>
              </div>

              <!-- توضيح قيم الأمثلة المستخدمة في المعاينة -->
              <div class="sample-data-explainer">
                <div class="explainer-title">
                  <span>ℹ️</span>
                  <strong>القيم الافتراضية المستخدمة في المعاينة أعلاه:</strong>
                </div>
                <div class="sample-data-chips">
                  <div 
                    v-for="(val, key) in previewResult.sample_data" 
                    :key="key" 
                    class="sample-chip"
                  >
                    <code>{<span>{{ key }}</span>}</code>
                    <span class="chip-arrow">←</span>
                    <span class="chip-value">{{ val }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import api from '../../axios';
import { toast, confirm } from '../../services/alertService';
import { useNotificationTemplates } from '@/composables/useNotificationTemplates';

const { setTemplate: setNotificationTemplate, fetchTemplates: refreshNotificationTemplates } = useNotificationTemplates();

// ==========================================
// الحالة العامة
// ==========================================
const loading = ref(true);
const saving = ref(false);
const resetting = ref(false);

const groups = ref([]);
const selectedGroupFilter = ref('all');
const selectedStatusFilter = ref('all'); // 'all', 'enabled', 'modified'
const searchQuery = ref('');

const selectedTemplate = ref(null);
const bodyTextareaRef = ref(null);

// نموذج التعديل النشط
const editForm = ref({
  template_body: '',
  title_template: '',
  is_enabled: true,
});

// نتائج المعاينة والفحص البرمجي
const syntaxReport = ref({
  is_valid: true,
  errors: [],
  warnings: [],
  detected_placeholders: [],
  missing_required: [],
});

const previewResult = ref({
  preview_title: '',
  preview_body: '',
  sample_data: {},
});

// تايمر التأخير لفحص السيرفر
let previewDebounceTimer = null;

// ==========================================
// استرجاع القوالب من الخادم
// ==========================================
const fetchTemplates = async () => {
  loading.value = true;
  try {
    const res = await api.get('/settings/notification-templates');
    groups.value = res.data.groups || [];

    // تحديد القالب المحدد افتراضياً
    if (!selectedTemplate.value && groups.value.length > 0) {
      const firstGroup = groups.value[0];
      if (firstGroup.templates && firstGroup.templates.length > 0) {
        selectTemplate(firstGroup.templates[0]);
      }
    } else if (selectedTemplate.value) {
      // إعادة ربط القالب الحالي بعد التحديث
      const all = getAllTemplatesFlat();
      const updated = all.find((t) => t.key === selectedTemplate.value.key);
      if (updated) {
        selectTemplate(updated);
      }
    }
  } catch (err) {
    console.error('Failed to load notification templates:', err);
    toast('تعذر تحميل قوالب الإشعارات من الخادم', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTemplates();
});

// ==========================================
// حساب القوالب والفلترة والتصنيف
// ==========================================
const getAllTemplatesFlat = () => {
  const list = [];
  groups.value.forEach((g) => {
    if (g.templates) {
      g.templates.forEach((t) => list.push(t));
    }
  });
  return list;
};

const totalTemplatesCount = computed(() => {
  return getAllTemplatesFlat().length;
});

const enabledTemplatesCount = computed(() => {
  return getAllTemplatesFlat().filter((t) => t.is_enabled).length;
});

const currentGroupTitle = computed(() => {
  if (selectedGroupFilter.value === 'all') return 'كافة قوالب التنبيهات';
  const found = groups.value.find((g) => g.group === selectedGroupFilter.value);
  return found ? found.label : 'قوالب القسم';
});

const currentGroupIcon = computed(() => {
  if (selectedGroupFilter.value === 'all') return '📑';
  const found = groups.value.find((g) => g.group === selectedGroupFilter.value);
  return found ? found.icon : '📋';
});

const categoryTemplates = computed(() => {
  let list = getAllTemplatesFlat();
  if (selectedGroupFilter.value !== 'all') {
    list = list.filter((t) => t.group === selectedGroupFilter.value);
  }
  return list;
});

const categoryTotalCount = computed(() => categoryTemplates.value.length);
const categoryEnabledCount = computed(() => categoryTemplates.value.filter((t) => t.is_enabled).length);
const categoryModifiedCount = computed(() => categoryTemplates.value.filter((t) => isTemplateModified(t)).length);

const selectCategory = (groupKey) => {
  selectedGroupFilter.value = groupKey;
  nextTick(() => {
    if (filteredTemplates.value.length > 0) {
      const exists = filteredTemplates.value.some((t) => t.key === selectedTemplate.value?.key);
      if (!exists) {
        selectTemplate(filteredTemplates.value[0]);
      }
    }
  });
};

const resetAllFilters = () => {
  searchQuery.value = '';
  selectedStatusFilter.value = 'all';
  selectedGroupFilter.value = 'all';
};

const filteredTemplates = computed(() => {
  let list = categoryTemplates.value;

  if (selectedStatusFilter.value === 'enabled') {
    list = list.filter((t) => t.is_enabled);
  } else if (selectedStatusFilter.value === 'modified') {
    list = list.filter((t) => isTemplateModified(t));
  }

  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((t) => {
      const name = (t.name_ar || '').toLowerCase();
      const key = (t.key || '').toLowerCase();
      const desc = (t.description_ar || '').toLowerCase();
      return name.includes(q) || key.includes(q) || desc.includes(q);
    });
  }

  return list;
});

// ==========================================
// اختيار وتعيين القالب النشط
// ==========================================
const selectTemplate = (tpl) => {
  selectedTemplate.value = tpl;
  editForm.value = {
    template_body: tpl.effective_body || tpl.template_body || tpl.default_body || '',
    title_template: tpl.effective_title || tpl.title_template || tpl.default_title || '',
    is_enabled: tpl.is_enabled !== undefined ? !!tpl.is_enabled : true,
  };

  runLocalSyntaxCheck();
  requestServerPreview();
};

const isTemplateModified = (tpl) => {
  if (!tpl) return false;
  const currentBody = tpl.template_body;
  return currentBody !== null && currentBody !== undefined && currentBody !== tpl.default_body;
};

const hasUnsavedChanges = computed(() => {
  if (!selectedTemplate.value) return false;
  const currentEffective = selectedTemplate.value.effective_body || '';
  const currentTitle = selectedTemplate.value.effective_title || '';
  const currentEnabled = !!selectedTemplate.value.is_enabled;

  return (
    editForm.value.template_body !== currentEffective ||
    editForm.value.title_template !== currentTitle ||
    editForm.value.is_enabled !== currentEnabled
  );
});

// ==========================================
// معالجة المتغيرات المتاحة للقالب
// ==========================================
const availablePlaceholdersList = computed(() => {
  if (!selectedTemplate.value) return [];
  const rawList = selectedTemplate.value.available_placeholders || [];
  const requiredList = (selectedTemplate.value.required_placeholders || []).map((r) => {
    const raw = typeof r === 'object' ? (r.key || r.tag || '') : r;
    return String(raw).replace(/[{}]/g, '').trim();
  });

  return rawList.map((item) => {
    const rawKey = typeof item === 'object' ? (item.key || item.tag || '') : item;
    const cleanKey = String(rawKey).replace(/[{}]/g, '').trim();
    const label = (typeof item === 'object' && item.label) ? item.label : cleanKey;
    const example = (typeof item === 'object' && item.example) ? item.example : '';
    const isRequired = requiredList.includes(cleanKey);

    return {
      cleanKey,
      label,
      example,
      isRequired,
    };
  });
});

const isPlaceholderUsed = (key) => {
  if (!editForm.value.template_body) return false;
  return editForm.value.template_body.includes(`{${key}}`);
};

// ==========================================
// حاقن المتغيرات الذكي (Tag Injection)
// ==========================================
const injectPlaceholder = (key) => {
  const token = `{${key}}`;
  const textarea = bodyTextareaRef.value;

  if (!textarea) {
    editForm.value.template_body += token;
    handleFormChange();
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = editForm.value.template_body;

  editForm.value.template_body = current.substring(0, start) + token + current.substring(end);
  handleFormChange();

  nextTick(() => {
    textarea.focus();
    const nextPos = start + token.length;
    textarea.setSelectionRange(nextPos, nextPos);
  });
};

const insertText = (text) => {
  const textarea = bodyTextareaRef.value;
  if (!textarea) {
    editForm.value.template_body += text;
    handleFormChange();
    return;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = editForm.value.template_body;
  editForm.value.template_body = current.substring(0, start) + text + current.substring(end);
  handleFormChange();

  nextTick(() => {
    textarea.focus();
    const nextPos = start + text.length;
    textarea.setSelectionRange(nextPos, nextPos);
  });
};

const wrapSelection = (before, after) => {
  const textarea = bodyTextareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = editForm.value.template_body;
  const selected = current.substring(start, end) || 'نص';

  const replacement = before + selected + after;
  editForm.value.template_body = current.substring(0, start) + replacement + current.substring(end);
  handleFormChange();

  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
};

// ==========================================
// الفحص البرمجي اللحظي (Local Client-Side Syntax Check)
// ==========================================
const handleFormChange = () => {
  runLocalSyntaxCheck();

  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(() => {
    requestServerPreview();
  }, 350);
};

const runLocalSyntaxCheck = () => {
  if (!selectedTemplate.value) return;

  const body = (editForm.value.template_body || '').trim();
  const errors = [];
  const warnings = [];

  // 1. طول النص
  if (body.length < 10) {
    errors.push('نص القالب قصير جداً (أقل من 10 أحرف).');
  }
  if (body.length > 3000) {
    errors.push('نص القالب يتجاوز الحد الأقصى (3000 حرف).');
  }

  // 2. توازن الأقواس
  const openCount = (body.match(/\{/g) || []).length;
  const closeCount = (body.match(/\}/g) || []).length;
  if (openCount !== closeCount) {
    errors.push(`أقواس المتغيرات غير متوازنة: تم العثور على (${openCount}) قوس فتح مقابل (${closeCount}) قوس إغلاق.`);
  }

  // 3. أقواس فارغة
  if (/\{\s*\}/.test(body)) {
    errors.push('يوجد متغير فارغ داخل الأقواس {}.');
  }

  // 4. استخراج المتغيرات وفحصها مع المسموح
  const detected = (body.match(/\{([a-zA-Z0-9_]+)\}/g) || []).map((m) => m.replace(/[{}]/g, ''));
  const allowed = availablePlaceholdersList.value.map((p) => p.cleanKey);

  detected.forEach((d) => {
    if (!allowed.includes(d)) {
      errors.push(`المتغير {${d}} غير مسموح به في هذا القالب.`);
    }
  });

  // 5. فحص المتغيرات الإلزامية
  availablePlaceholdersList.value.forEach((p) => {
    if (p.isRequired && !detected.includes(p.cleanKey)) {
      errors.push(`المتغير الإلزامي {${p.cleanKey}} مفقود من نص القالب.`);
    }
  });

  // 6. تحذيرات واتساب
  const stars = (body.match(/\*/g) || []).length;
  if (stars % 2 !== 0) {
    warnings.push(`تنبيه: عدد النجوم (*) فردي (${stars})، قد لا يظهر الخط العريض بالشكل المتوقع.`);
  }

  const withoutPlaceholders = body.replace(/\{[a-zA-Z0-9_]+\}/g, '');
  const underscores = (withoutPlaceholders.match(/_/g) || []).length;
  if (underscores % 2 !== 0) {
    warnings.push(`تنبيه: عدد الشَرطات السفلية (_) فردي (${underscores})، قد لا يظهر الخط المائل بالشكل المتوقع.`);
  }

  syntaxReport.value = {
    is_valid: errors.length === 0,
    errors,
    warnings,
    detected_placeholders: detected,
  };
};

const syntaxReportStatusClass = computed(() => {
  if (!syntaxReport.value.is_valid) return 'report-danger';
  if (syntaxReport.value.warnings && syntaxReport.value.warnings.length > 0) return 'report-warning';
  return 'report-success';
});

const syntaxReportStatusIcon = computed(() => {
  if (!syntaxReport.value.is_valid) return '❌';
  if (syntaxReport.value.warnings && syntaxReport.value.warnings.length > 0) return '⚠️';
  return '✅';
});

const syntaxReportStatusTitle = computed(() => {
  if (!syntaxReport.value.is_valid) {
    return `يوجد (${syntaxReport.value.errors.length}) خطأ في صياغة القالب تمنع الحفظ:`;
  }
  if (syntaxReport.value.warnings && syntaxReport.value.warnings.length > 0) {
    return 'صياغة القالب صحيحة مع بعض التنبيهات على تنسيق واتساب:';
  }
  return 'صياغة القالب متطابقة وسليمة 100% وجاهزة للاستخدام.';
});

// ==========================================
// طلب المعاينة الحية من الخادم
// ==========================================
const requestServerPreview = async () => {
  if (!selectedTemplate.value) return;

  try {
    const res = await api.post('/settings/notification-templates/preview', {
      key: selectedTemplate.value.key,
      template_body: editForm.value.template_body,
      title_template: editForm.value.title_template,
    });

    previewResult.value = {
      preview_title: res.data.preview_title || '',
      preview_body: res.data.preview_body || '',
      sample_data: res.data.sample_data || {},
    };

    if (res.data.errors && res.data.errors.length > 0) {
      syntaxReport.value.errors = res.data.errors;
      syntaxReport.value.is_valid = false;
    }
  } catch (err) {
    console.error('Server preview error:', err);
  }
};

// ==========================================
// تنسيق معاينة فقاعة الواتساب (WhatsApp Markdown Parser)
// ==========================================
const formattedPreviewHtml = computed(() => {
  let text = previewResult.value.preview_body || editForm.value.template_body || '';

  // حماية ضد XSS
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // استبدال المتغيرات غير المستبدلة بالقيم التوضيحية
  availablePlaceholdersList.value.forEach((p) => {
    const sampleVal = previewResult.value.sample_data[p.cleanKey] || p.example || `[${p.label}]`;
    const regex = new RegExp(`\\{${p.cleanKey}\\}`, 'g');
    text = text.replace(regex, `<span class="preview-var-highlight">${sampleVal}</span>`);
  });

  // واتساب Bold: *text*
  text = text.replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>');

  // واتساب Italic: _text_
  text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // واتساب Strikethrough: ~text~
  text = text.replace(/~([^~\n]+)~/g, '<del>$1</del>');

  // الأسطر الجديدة
  text = text.replace(/\n/g, '<br />');

  return text;
});

const currentPreviewTime = computed(() => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
});

// ==========================================
// حفظ التعديلات
// ==========================================
const saveTemplate = async () => {
  if (!selectedTemplate.value || !syntaxReport.value.is_valid) return;

  saving.value = true;
  try {
    const res = await api.put(`/settings/notification-templates/${selectedTemplate.value.key}`, {
      template_body: editForm.value.template_body,
      title_template: editForm.value.title_template,
      is_enabled: editForm.value.is_enabled,
    });

    toast(res.data.message || 'تم حفظ قالب الإشعار بنجاح 🚀', 'success');

    // تحديث البيانات المحلية
    selectedTemplate.value.template_body = res.data.template.template_body;
    selectedTemplate.value.title_template = res.data.template.title_template;
    selectedTemplate.value.is_enabled = res.data.template.is_enabled;
    selectedTemplate.value.effective_body = res.data.template.effective_body;
    selectedTemplate.value.effective_title = res.data.template.effective_title;

    setNotificationTemplate(selectedTemplate.value.key, res.data.template);
    await Promise.all([
      fetchTemplates(),
      refreshNotificationTemplates(true)
    ]);
  } catch (err) {
    console.error('Failed to save template:', err);
    const errMessage = err.response?.data?.message || 'فشل حفظ القالب، يرجى مراجعة الأخطاء.';
    toast(errMessage, 'error');
  } finally {
    saving.value = false;
  }
};

// ==========================================
// استعادة القالب الافتراضي الأصلي
// ==========================================
const confirmResetToDefault = async () => {
  if (!selectedTemplate.value) return;

  const isConfirmed = await confirm({
    title: 'استعادة القالب الافتراضي الأصلي؟',
    message: `هل أنت متأكد من رغبتك في استعادة الصياغة المصنعية الافتراضية لقالب [${selectedTemplate.value.name_ar}]؟ سيتم إلغاء كافة التعديلات المخصصة الحالية.`,
    confirmText: 'نعم، استعد الافتراضي',
    cancelText: 'إلغاء',
    type: 'warning',
  });

  if (!isConfirmed) return;

  resetting.value = true;
  try {
    const res = await api.post(`/settings/notification-templates/${selectedTemplate.value.key}/reset`);
    toast(res.data.message || 'تمت استعادة النص الافتراضي بنجاح 🔄', 'success');

    selectTemplate(res.data.template);
    setNotificationTemplate(selectedTemplate.value.key, res.data.template);
    await Promise.all([
      fetchTemplates(),
      refreshNotificationTemplates(true)
    ]);
  } catch (err) {
    console.error('Failed to reset template:', err);
    toast('تعذر استعادة النص الافتراضي للقالب', 'error');
  } finally {
    resetting.value = false;
  }
};

// ==========================================
// دوال مساعدة للعرض والأيقونات
// ==========================================
const getChannelLabel = (channel) => {
  switch (channel) {
    case 'whatsapp':
      return 'واتساب فقط 📱';
    case 'system':
      return 'نظام فقط 🔔';
    case 'both':
    default:
      return 'واتساب ونظام ⚡';
  }
};

const getGroupIcon = (groupKey) => {
  const grp = groups.value.find((g) => g.group === groupKey);
  return grp?.icon || '🔔';
};
</script>

<style scoped>
/* =================================================== */
/* التنسيقات العامة لتبويب قوالب الرسائل */
/* =================================================== */
.notification-templates-management {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

/* بطاقة الترويسة الرئيسية الموحدة */
.templates-header-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.15rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.header-top-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.breadcrumbs-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
}

.crumb-link {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.15s;
}

.crumb-link:hover {
  color: #38bdf8;
}

.crumb-sep {
  color: #475569;
}

.crumb-current {
  color: #34d399;
  font-weight: 700;
}

.btn-return-settings {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  padding: 0.4rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.825rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-return-settings:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: translateY(-1px);
}

.header-main-content-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.header-main-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-box {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  flex-shrink: 0;
}

.header-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #f8fafc;
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 44rem;
  line-height: 1.4;
}

.summary-chips-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.summary-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.75rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
}

.summary-chip.success {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
}

.summary-chip.info {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.chip-val {
  font-weight: 800;
}

.btn-refresh-templates {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  padding: 0.4rem 0.85rem;
  border-radius: 0.625rem;
  font-size: 0.825rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh-templates:hover {
  background: rgba(255, 255, 255, 0.15);
}

.spin-icon {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* شاشة التحميل */
.templates-loading-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-large {
  width: 2.75rem;
  height: 2.75rem;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* =================================================== */
/* مساحة العمل: شبكة القائمة والمحرر */
/* =================================================== */
/* شريط تصنيفات المجموعات الأفقي */
.workspace-categories-bar {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.categories-bar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.categories-pills-carousel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0.15rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.categories-pills-carousel::-webkit-scrollbar {
  height: 4px;
}

.categories-pills-carousel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.category-nav-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.825rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-nav-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.category-nav-pill.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
  border-color: #10b981;
  color: #34d399;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
}

.pill-icon {
  font-size: 1rem;
}

.pill-counter {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
}

.category-nav-pill.active .pill-counter {
  background: rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
}

.templates-workspace-layout {
  display: grid;
  grid-template-columns: 24rem 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 1200px) {
  .templates-workspace-layout {
    grid-template-columns: 21rem 1fr;
  }
}

@media (max-width: 992px) {
  .templates-workspace-layout {
    grid-template-columns: 1fr;
  }
}

/* --------------------------------------------------- */
/* القائمة الجانبية الموسعة لأسماء القوالب */
/* --------------------------------------------------- */
.templates-sidebar-panel {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  height: calc(100vh - 13.5rem);
  min-height: 620px;
  max-height: 850px;
  position: sticky;
  top: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

@media (max-width: 992px) {
  .templates-sidebar-panel {
    position: static;
    height: auto;
    min-height: unset;
    max-height: 520px;
  }
}

.sidebar-header-section {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.75rem;
}

.sidebar-title-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sidebar-category-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.current-cat-icon {
  font-size: 1.15rem;
}

.current-cat-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-items-badge {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.sidebar-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  pointer-events: none;
}

.sidebar-search-input {
  width: 100%;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.625rem;
  padding: 0.5rem 2.25rem 0.5rem 2rem;
  color: #f1f5f9;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s;
}

.sidebar-search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.clear-search-btn {
  position: absolute;
  left: 0.625rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.75rem;
}

.sidebar-filter-tabs {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.filter-tab-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-tab-chip:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.filter-tab-chip.active {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-weight: 700;
}

/* قائمة التمرير لأسماء وبطاقات القوالب */
.templates-scroll-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  overflow-y: auto;
  padding-left: 0.35rem;
  padding-right: 0.15rem;
}

.templates-scroll-list::-webkit-scrollbar {
  width: 5px;
}

.templates-scroll-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 5px;
}

.templates-scroll-list::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.4);
}

.template-item-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 0.875rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  position: relative;
}

.template-item-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.template-item-card.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.28));
  border-color: #10b981;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.28);
}

.template-item-card.active::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0.6rem;
  bottom: 0.6rem;
  width: 4px;
  border-radius: 4px 0 0 4px;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.template-item-card.disabled {
  opacity: 0.55;
}

.item-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-channel-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 0.375rem;
}

.item-channel-tag.whatsapp {
  background: rgba(37, 211, 102, 0.15);
  color: #25d366;
}

.item-channel-tag.system {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.item-channel-tag.both {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.item-status-icons {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.modified-pill {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
}

.status-indicator-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}

.status-indicator-dot.enabled {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.status-indicator-dot.disabled {
  background: #64748b;
}

.item-title {
  margin: 0;
  font-size: 0.925rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.4;
}

.item-key code {
  font-size: 0.725rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  padding: 0.12rem 0.4rem;
  border-radius: 0.25rem;
  direction: ltr;
  display: inline-block;
}

.item-desc {
  margin: 0;
  font-size: 0.775rem;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.templates-empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 2rem;
}

.empty-text {
  margin: 0;
  font-size: 0.85rem;
}

.btn-reset-filters-inline {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  padding: 0.4rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-filters-inline:hover {
  background: rgba(16, 185, 129, 0.25);
}

/* --------------------------------------------------- */
/* منطقة المحرر الرئيسي */
/* --------------------------------------------------- */
.template-editor-workspace {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* شريط أدوات القالب النشط */
.active-template-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.toolbar-title-box {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.toolbar-icon {
  font-size: 1.85rem;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-template-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #f8fafc;
}

.badge-channel {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
}

.badge-channel.whatsapp { background: rgba(37, 211, 102, 0.15); color: #25d366; }
.badge-channel.system { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.badge-channel.both { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

.toolbar-template-key {
  margin: 0.2rem 0 0 0;
  font-size: 0.775rem;
  color: #94a3b8;
}

.toolbar-template-key code {
  color: #38bdf8;
  direction: ltr;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toggle-control-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.4rem 0.75rem;
  border-radius: 0.625rem;
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
}

.switch-toggle-sm {
  position: relative;
  display: inline-block;
  width: 2.25rem;
  height: 1.25rem;
}

.switch-toggle-sm input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-round-sm {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #475569;
  transition: .3s;
  border-radius: 1.25rem;
}

.slider-round-sm:before {
  position: absolute;
  content: "";
  height: 0.95rem;
  width: 0.95rem;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.switch-toggle-sm input:checked + .slider-round-sm {
  background-color: #10b981;
}

.switch-toggle-sm input:checked + .slider-round-sm:before {
  transform: translateX(1rem);
}

.btn-action-restore {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.5rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.825rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action-restore:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.btn-action-restore:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action-save {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-action-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
}

.btn-action-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.needs-save-glow {
  animation: pulseSave 2s infinite;
}

@keyframes pulseSave {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

.disabled-template-alert {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.disabled-template-alert p {
  margin: 0;
}

/* --------------------------------------------------- */
/* شبكة المحرر والمعاينة التفاعلية */
/* --------------------------------------------------- */
.editor-and-preview-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 992px) {
  .editor-and-preview-grid {
    grid-template-columns: 1fr;
  }
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.375rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 400;
}

.form-control-input {
  width: 100%;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.625rem;
  padding: 0.625rem 0.875rem;
  color: #f8fafc;
  font-size: 0.875rem;
  outline: none;
}

.form-control-input:focus {
  border-color: #10b981;
}

/* صندوق حاقن المتغيرات */
.placeholders-injector-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.injector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.825rem;
  color: #cbd5e1;
}

.injector-count {
  font-size: 0.75rem;
  color: #64748b;
}

.placeholders-tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.placeholder-tag-btn {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  padding: 0.35rem 0.625rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
}

.placeholder-tag-btn:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  transform: translateY(-1px);
}

.placeholder-tag-btn.required {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.08);
}

.placeholder-tag-btn.used {
  border-color: rgba(16, 185, 129, 0.4);
}

.tag-label {
  font-size: 0.75rem;
  color: #e2e8f0;
  font-weight: 600;
}

.tag-code {
  font-size: 0.7rem;
  color: #38bdf8;
  direction: ltr;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}

.required-star {
  color: #f59e0b;
  font-weight: 800;
}

.used-check {
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 800;
}

.injector-instruction {
  font-size: 0.725rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* محرر النص وأدوات التنسيق */
.editor-label-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.char-counter {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.char-counter.counter-danger {
  color: #ef4444;
}

.whatsapp-toolbar-tools {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tool-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.775rem;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.form-control-textarea {
  width: 100%;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  padding: 0.875rem;
  color: #f8fafc;
  font-size: 0.9rem;
  line-height: 1.6;
  outline: none;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-control-textarea:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

/* صندوق تقرير الفحص البرمجي */
.syntax-report-box {
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.825rem;
}

.syntax-report-box.report-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
}

.syntax-report-box.report-danger {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.syntax-report-box.report-warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.report-errors-list,
.report-warnings-list {
  margin: 0;
  padding-right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* --------------------------------------------------- */
/* عمود المعاينة الواقعية لواتساب */
/* --------------------------------------------------- */
.preview-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-card-wrapper {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.whatsapp-logo-icon {
  font-size: 1.1rem;
}

.preview-badge {
  background: rgba(37, 211, 102, 0.15);
  color: #25d366;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.375rem;
}

/* محاكي هاتف واتساب */
.whatsapp-mock-phone {
  background: #0b141a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.mock-wa-header {
  background: #202c33;
  padding: 0.625rem 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mock-wa-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: #128c7e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.mock-wa-contact {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e9edef;
}

.contact-status {
  font-size: 0.675rem;
  color: #8696a0;
}

.mock-wa-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #aebac1;
  font-size: 0.85rem;
}

.mock-wa-chat-area {
  background-color: #0c1317;
  background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 16px 16px;
  padding: 1rem;
  min-height: 18rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mock-wa-date-pill {
  align-self: center;
  background: #182229;
  color: #8696a0;
  padding: 0.2rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.675rem;
  font-weight: 600;
}

.mock-wa-bubble {
  align-self: flex-start;
  max-width: 90%;
  background: #005c4b;
  border-radius: 0.5rem 0.5rem 0.5rem 0;
  padding: 0.625rem 0.75rem;
  color: #e9edef;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mock-wa-bubble-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #38bdf8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.25rem;
}

.mock-wa-bubble-body {
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.preview-var-highlight) {
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
  padding: 0.05rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.mock-wa-bubble-meta {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: #8696a0;
  margin-top: 0.25rem;
}

.bubble-checks {
  color: #53bdeb;
}

.mock-wa-input-bar {
  background: #202c33;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.wa-input-fake {
  flex: 1;
  background: #2a3942;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  color: #8696a0;
}

.wa-input-icon {
  font-size: 1rem;
  color: #8696a0;
}

.wa-mic-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

/* توضيح بيانات العينات */
.sample-data-explainer {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.75rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.explainer-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.sample-data-chips {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 10rem;
  overflow-y: auto;
}

.sample-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.sample-chip code {
  color: #38bdf8;
  direction: ltr;
}

.chip-arrow {
  color: #64748b;
}

.chip-value {
  color: #e2e8f0;
  font-weight: 600;
}
</style>
