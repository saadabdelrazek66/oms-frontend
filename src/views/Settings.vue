<template>
  <div class="settings-page" dir="rtl">
    <!-- رأس الصفحة -->
    <div class="settings-header">
      <div class="header-titles">
        <div class="breadcrumbs">
          <span>لوحة التحكم</span>
          <span class="crumb-separator">/</span>
          <span class="active-crumb">الإعدادات العامة والسياسات</span>
        </div>
        <div class="title-with-badge">
          <div class="settings-icon-badge">⚙️</div>
          <div>
            <h1>إعدادات المنظومة العامة والسياسات</h1>
            <p>لوحة تحكم مركزية لضبط هوية الوكالة، سياسات الدوام، ضوابط خطط المحتوى، الإشعارات، والأمان</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button
          v-if="activeTab !== 'plans' || plansSubTab === 'policies'"
          type="button"
          class="btn btn-secondary-subtle"
          :disabled="savingSettings || resettingGroup"
          title="استعادة القيم الافتراضية الأصلية لهذا القسم"
          @click="confirmResetCurrentGroup"
        >
          <span v-if="resettingGroup" class="spinner-inline"></span>
          <span v-else>🔄</span>
          <span class="btn-label-desktop">استعادة افتراضيات التبويب</span>
          <span class="btn-label-mobile">استعادة</span>
        </button>

        <button
          v-if="activeTab === 'plans' && plansSubTab === 'estimates'"
          type="button"
          class="btn btn-secondary"
          @click="plansTabRef?.openAddCategoryModal()"
        >
          <span>＋</span>
          <span class="btn-label-desktop">نوع خطة جديد</span>
          <span class="btn-label-mobile">خطة جديدة</span>
        </button>

        <button
          v-if="activeTab === 'plans' && plansSubTab === 'estimates'"
          type="button"
          class="btn btn-primary save-all-btn"
          :class="{ 'needs-save-pulse': hasUnsavedHoursChanges }"
          :disabled="savingBulkHours"
          @click="plansTabRef?.saveAllHours()"
        >
          <span v-if="savingBulkHours" class="spinner-inline"></span>
          <span v-else>💾</span>
          <span class="btn-label-desktop">حفظ كافة الساعات</span>
          <span class="btn-label-mobile">حفظ الساعات</span>
          <span v-if="hasUnsavedHoursChanges" class="unsaved-badge" title="يوجد تعديلات غير محفوظة">!</span>
        </button>

        <button
          type="button"
          class="btn btn-primary main-save-btn"
          :class="{ 'needs-save-pulse': hasUnsavedSettings }"
          :disabled="savingSettings"
          @click="saveGeneralSettings"
        >
          <span v-if="savingSettings" class="spinner-inline"></span>
          <span v-else>💾</span>
          <span class="btn-label-desktop">حفظ التعديلات العامة</span>
          <span class="btn-label-mobile">حفظ</span>
          <span v-if="hasUnsavedSettings" class="unsaved-badge" title="يوجد تعديلات غير محفوظة">!</span>
        </button>
      </div>
    </div>

    <!-- تنبيه تجميد المنظومة إن كان مفعلاً -->
    <div v-if="settingsForm.system_freeze_mode" class="system-freeze-banner">
      <div class="freeze-icon">❄️</div>
      <div class="freeze-content">
        <strong>تنبيه: وضع تجميد المنظومة مفعّل حالياً (System Freeze Active)</strong>
        <p>المنظومة في وضع القراءة فقط للموظفين، ويمنع إنشاء أو تعديل أي مهام أو خطط لحين إلغاء التفعيل.</p>
      </div>
    </div>

    <!-- حاوية التبويبات والمحتوى الرئيسية -->
    <div class="settings-layout">
      <aside class="settings-sidebar">
        <nav class="settings-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="nav-tab-btn"
            :class="{
              active: activeTab === tab.id,
              'has-unsaved': tabHasUnsaved(tab.id),
            }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <div class="tab-text">
              <span class="tab-title">{{ tab.title }}</span>
              <span class="tab-desc">{{ tab.desc }}</span>
            </div>
            <span v-if="tabHasUnsaved(tab.id)" class="tab-unsaved-dot" title="تعديلات غير محفوظة"></span>
          </button>
        </nav>

        <div class="quick-status-card">
          <div class="status-header">
            <span class="status-indicator-dot online"></span>
            <strong>حالة خادم المنظومة</strong>
          </div>
          <div class="status-details">
            <div class="status-row">
              <span>المنطقة الزمنية:</span>
              <code>{{ settingsForm.system_timezone || 'Africa/Cairo' }}</code>
            </div>
            <div class="status-row">
              <span>العملة الافتراضية:</span>
              <span class="currency-tag">{{ settingsForm.default_currency || 'EGP' }}</span>
            </div>
            <div class="status-row">
              <span>ساعات الدوام اليومي:</span>
              <span>{{ settingsForm.default_daily_hours || 8 }} ساعات</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="settings-content-area">
        <div v-if="loadingSettings" class="loading-state-box">
          <div class="spinner-large"></div>
          <p>جارٍ تحميل الإعدادات والسياسات العامة...</p>
        </div>

        <div v-else class="tab-panel-container">
          <GeneralSettingsTab v-if="activeTab === 'general'" :settings-form="settingsForm" />
          <WorkloadSettingsTab v-if="activeTab === 'workload'" :settings-form="settingsForm" />
          <PlansSettingsTab
            v-show="activeTab === 'plans'"
            ref="plansTabRef"
            v-model:plans-sub-tab="plansSubTab"
            :settings-form="settingsForm"
          />
          <NotificationsSettingsTab v-if="activeTab === 'notifications'" :settings-form="settingsForm" />
          <SecuritySettingsTab v-if="activeTab === 'security'" :settings-form="settingsForm" />
          <StorageArchiveSettingsTab v-if="activeTab === 'storage'" :settings-form="settingsForm" />
        </div>
      </main>
    </div>

    <!-- شريط عائم سفلي للتعديلات غير المحفوظة -->
    <Transition name="slide-up">
      <div v-if="hasUnsavedSettings || hasUnsavedHoursChanges" class="unsaved-floating-bar" dir="rtl">
        <div class="floating-bar-inner">
          <div class="floating-bar-info">
            <span class="floating-beacon">⚠️</span>
            <div>
              <strong>
                {{ hasUnsavedSettings ? 'توجد تعديلات غير محفوظة على الإعدادات والسياسات!' : 'توجد تعديلات على ساعات العمل المعيارية لم تُحفظ بعد!' }}
              </strong>
              <span>لا تنسَ حفظ التغييرات لتثبيتها على النظام وتفادي فقدان ما قمت بتعديله.</span>
            </div>
          </div>
          <div class="floating-bar-actions">
            <button
              v-if="hasUnsavedSettings"
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="savingSettings"
              @click="discardSettingsChanges"
            >
              تراجع عن إعدادات السياسات
            </button>

            <button
              v-if="hasUnsavedHoursChanges"
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="savingBulkHours"
              @click="plansTabRef?.discardHoursChanges()"
            >
              تراجع عن الساعات
            </button>

            <button
              v-if="hasUnsavedHoursChanges"
              type="button"
              class="btn btn-primary btn-sm save-floating-btn"
              :disabled="savingBulkHours"
              @click="plansTabRef?.saveAllHours()"
            >
              <span v-if="savingBulkHours" class="spinner-inline"></span>
              <span v-else>💾</span>
              <span>حفظ الساعات الآن</span>
            </button>

            <button
              v-if="hasUnsavedSettings"
              type="button"
              class="btn btn-primary btn-sm save-floating-btn"
              :disabled="savingSettings"
              @click="saveGeneralSettings"
            >
              <span v-if="savingSettings" class="spinner-inline"></span>
              <span v-else>💾</span>
              <span>حفظ الإعدادات العامة الآن</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import api from '../axios';
import alertService from '../services/alertService';
import { useSystemSettings } from '../composables/useSystemSettings';

import GeneralSettingsTab from '../components/settings/GeneralSettingsTab.vue';
import WorkloadSettingsTab from '../components/settings/WorkloadSettingsTab.vue';
import PlansSettingsTab from '../components/settings/PlansSettingsTab.vue';
import NotificationsSettingsTab from '../components/settings/NotificationsSettingsTab.vue';
import SecuritySettingsTab from '../components/settings/SecuritySettingsTab.vue';
import StorageArchiveSettingsTab from '../components/settings/StorageArchiveSettingsTab.vue';

const { fetchSettings: refreshGlobalSettings } = useSystemSettings();

const tabs = [
  { id: 'general', title: 'الهوية والبيانات', icon: '🏢', desc: 'الاسم، الشعار، العملة، التوقيت' },
  { id: 'workload', title: 'الدوام وحِمل العمل', icon: '⏱️', desc: 'ساعات العمل، العطلات، الإجهاد' },
  { id: 'plans', title: 'خطط المحتوى والمعايير', icon: '📊', desc: 'ضوابط النشر، وجداول الساعات' },
  { id: 'notifications', title: 'التنبيهات والواتساب', icon: '🔔', desc: 'الديدلاين، الأصوات، الواتساب' },
  { id: 'security', title: 'الأمان والاحتفاظ', icon: '🔒', desc: 'الجلسات، السلة، وسجل التدقيق' },
  { id: 'storage', title: 'التخزين والأرشفة', icon: '☁️', desc: 'مجلد درايف، وسياسات التسليم' },
];

const activeTab = ref('general');
const plansSubTab = ref('policies');
const plansTabRef = ref(null);

const loadingSettings = ref(true);
const savingSettings = ref(false);
const resettingGroup = ref(false);

const settingsForm = ref({});
const originalSettings = ref({});
const groupsMeta = ref({});

const hasUnsavedHoursChanges = computed(() => Boolean(plansTabRef.value?.hasUnsavedHoursChanges));
const savingBulkHours = computed(() => Boolean(plansTabRef.value?.savingBulkHours));

const hasUnsavedSettings = computed(() => {
  if (!originalSettings.value || Object.keys(originalSettings.value).length === 0) return false;
  return JSON.stringify(settingsForm.value) !== JSON.stringify(originalSettings.value);
});

const tabHasUnsaved = (tabId) => {
  if (tabId === 'plans' && hasUnsavedHoursChanges.value) return true;
  if (!groupsMeta.value[tabId] || !originalSettings.value) return false;

  const keys = groupsMeta.value[tabId].map((s) => s.key);
  for (const k of keys) {
    if (JSON.stringify(settingsForm.value[k]) !== JSON.stringify(originalSettings.value[k])) {
      return true;
    }
  }
  return false;
};

const fetchGeneralSettings = async () => {
  loadingSettings.value = true;
  try {
    const res = await api.get('/settings/general');
    if (res.data) {
      groupsMeta.value = res.data.groups || {};
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat || {}));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat || {}));
    }
  } catch (error) {
    console.error('Failed to fetch general settings:', error);
    alertService.error('تعذر جلب الإعدادات العامة للمنظومة.');
  } finally {
    loadingSettings.value = false;
  }
};

const saveGeneralSettings = async () => {
  savingSettings.value = true;
  try {
    const res = await api.post('/settings/general', {
      settings: settingsForm.value,
    });

    if (res.data && res.data.flat) {
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat));
    } else {
      originalSettings.value = JSON.parse(JSON.stringify(settingsForm.value));
    }

    try {
      await refreshGlobalSettings(true);
    } catch (e) {}

    alertService.success('تم حفظ وتطبيق كافة الإعدادات والسياسات بنجاح ✅');
  } catch (error) {
    console.error('Error saving settings:', error);
    alertService.error(error.response?.data?.message || 'تعذر حفظ الإعدادات، يرجى التحقق من المدخلات.');
  } finally {
    savingSettings.value = false;
  }
};

const discardSettingsChanges = () => {
  settingsForm.value = JSON.parse(JSON.stringify(originalSettings.value));
  alertService.info('تم التراجع عن التعديلات واستعادة الإعدادات الأصلية.');
};

const confirmResetCurrentGroup = async () => {
  const currentTabObj = tabs.find((t) => t.id === activeTab.value);
  const tabName = currentTabObj ? currentTabObj.title : activeTab.value;

  const confirmed = await alertService.confirm({
    title: `استعادة افتراضيات "${tabName}"؟`,
    message: `هل أنت متأكد من استعادة القيم الافتراضية المصنعية لتبويب ${tabName}؟ سيتم إلغاء أي تعديلات مخصصة قمت بضبطها مسبقاً لهذا القسم.`,
    confirmText: 'نعم، استعد الافتراضيات',
    cancelText: 'إلغاء',
    type: 'warning',
  });

  if (!confirmed) return;

  resettingGroup.value = true;
  try {
    const res = await api.post('/settings/general/reset', {
      group: activeTab.value,
    });

    if (res.data && res.data.flat) {
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat));
    }

    try {
      await refreshGlobalSettings(true);
    } catch (e) {}

    alertService.success(`تمت استعادة إعدادات "${tabName}" إلى الافتراضي بنجاح 🔄`);
  } catch (error) {
    alertService.error('فشل في استعادة الافتراضيات.');
  } finally {
    resettingGroup.value = false;
  }
};

onBeforeRouteLeave(async () => {
  if (hasUnsavedSettings.value || hasUnsavedHoursChanges.value) {
    const confirmed = await alertService.confirm({
      title: 'تنبيه: تعديلات غير محفوظة ⚠️',
      message: 'لديك تغييرات تم إجراؤها على الإعدادات أو الساعات ولم تقم بحفظها بعد! هل أنت متأكد من رغبتك في مغادرة الصفحة وإلغاء هذه التعديلات؟',
      confirmText: 'نعم، مغادرة دون حفظ',
      cancelText: 'البقاء في الصفحة لحفظ التغييرات',
      type: 'warning',
    });
    if (!confirmed) return false;
  }
  return true;
});

const handleBeforeUnload = (e) => {
  if (hasUnsavedSettings.value || hasUnsavedHoursChanges.value) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
};

onMounted(() => {
  fetchGeneralSettings();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style src="../components/settings/settings-shared.css"></style>
