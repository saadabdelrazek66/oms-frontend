<template>
  <Teleport to="body">
    <div v-if="show" class="sub-modal-overlay" dir="rtl" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="sub-modal-card">
        <header class="modal-header">
          <div class="header-title">
            <span class="header-icon">{{ isEditing ? '✏️' : '💳' }}</span>
            <div>
              <h3>{{ isEditing ? `تعديل الاشتراك: ${subscription?.name}` : 'إضافة اشتراك أو خدمة متجددة' }}</h3>
              <p>اضبط مواعيد التذكير المتعددة وقنوات التنبيه لحماية خدمات الشركة من التوقف المفاجئ</p>
            </div>
          </div>
          <button type="button" class="close-btn" aria-label="إغلاق" @click="$emit('close')">✕</button>
        </header>

        <form @submit.prevent="handleSubmit" class="modal-body" novalidate>
          <div v-if="serverBanner" class="server-error-banner">
            ⚠️ {{ serverBanner }}
          </div>

          <!-- القسم 1: البيانات الأساسية -->
          <section class="form-section">
            <h4 class="section-heading">1. البيانات الأساسية وبيانات الوصول</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">اسم الاشتراك / الخدمة</label>
                <input
                  v-model="form.name"
                  type="text"
                  maxlength="191"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('name') }"
                  placeholder="مثال: Domain octomedia.com أو استضافة AWS"
                  @blur="touchField('name', form)"
                  @input="validateFieldIfTouched('name', form)"
                />
                <span v-if="hasError('name')" class="error-text">{{ getError('name') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label required">التصنيف</label>
                <select
                  v-model="form.category"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('category') }"
                  @change="touchField('category', form)"
                >
                  <option value="" disabled>اختر التصنيف...</option>
                  <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                    {{ cat.icon }} {{ cat.label }}
                  </option>
                </select>
                <span v-if="hasError('category')" class="error-text">{{ getError('category') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label required">الشركة المزودة (Provider)</label>
                <input
                  v-model="form.provider_name"
                  type="text"
                  maxlength="191"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('provider_name') }"
                  placeholder="مثال: Cloudflare, Namecheap, Hostinger, Google..."
                  @blur="touchField('provider_name', form)"
                  @input="validateFieldIfTouched('provider_name', form)"
                />
                <span v-if="hasError('provider_name')" class="error-text">{{ getError('provider_name') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">النطاق / المعرف (Domain / Account ID)</label>
                <input
                  v-model="form.domain_or_identifier"
                  type="text"
                  maxlength="191"
                  dir="ltr"
                  class="form-input text-left"
                  :class="{ 'is-invalid': hasError('domain_or_identifier') }"
                  :placeholder="form.category === 'domain' ? 'example.com' : 'example.com أو ID الحساب'"
                  @blur="touchField('domain_or_identifier', form)"
                  @input="validateFieldIfTouched('domain_or_identifier', form)"
                />
                <span v-if="hasError('domain_or_identifier')" class="error-text">{{ getError('domain_or_identifier') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">رابط لوحة التحكم / التجديد</label>
                <input
                  v-model="form.management_url"
                  type="url"
                  maxlength="500"
                  dir="ltr"
                  class="form-input text-left"
                  :class="{ 'is-invalid': hasError('management_url') }"
                  placeholder="https://dash.cloudflare.com/..."
                  @blur="touchField('management_url', form)"
                  @input="validateFieldIfTouched('management_url', form)"
                />
                <span v-if="hasError('management_url')" class="error-text">{{ getError('management_url') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">البريد المسجل به الحساب لدى المزود</label>
                <input
                  v-model="form.account_email"
                  type="email"
                  maxlength="191"
                  dir="ltr"
                  class="form-input text-left"
                  :class="{ 'is-invalid': hasError('account_email') }"
                  placeholder="accounts@company.com"
                  @blur="touchField('account_email', form)"
                  @input="validateFieldIfTouched('account_email', form)"
                />
                <span v-if="hasError('account_email')" class="error-text">{{ getError('account_email') }}</span>
              </div>
            </div>
          </section>

          <!-- القسم 2: التكلفة ودورة الفوترة والتواريخ -->
          <section class="form-section">
            <h4 class="section-heading">2. التكلفة، دورة الفوترة، والمواعيد</h4>
            <div class="form-grid three-cols">
              <div class="form-group">
                <label class="form-label required">قيمة الاشتراك</label>
                <input
                  v-model="form.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('amount') }"
                  placeholder="0.00"
                  @blur="touchField('amount', form)"
                  @input="validateFieldIfTouched('amount', form)"
                />
                <span v-if="hasError('amount')" class="error-text">{{ getError('amount') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label required">العملة</label>
                <select
                  v-model="form.currency"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('currency') }"
                  @change="touchField('currency', form)"
                >
                  <option v-for="cur in currencies" :key="cur" :value="cur">{{ cur }}</option>
                </select>
                <span v-if="hasError('currency')" class="error-text">{{ getError('currency') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label required">دورة الفوترة</label>
                <select
                  v-model="form.billing_cycle"
                  class="form-select"
                  :class="{ 'is-invalid': hasError('billing_cycle') }"
                  @change="onBillingCycleChange"
                >
                  <option v-for="cycle in billingCycleOptions" :key="cycle.value" :value="cycle.value">
                    {{ cycle.label }}
                  </option>
                </select>
                <span v-if="hasError('billing_cycle')" class="error-text">{{ getError('billing_cycle') }}</span>
              </div>

              <div v-if="form.billing_cycle === 'custom_days'" class="form-group">
                <label class="form-label required">عدد أيام الدورة المخصصة</label>
                <input
                  v-model="form.custom_cycle_days"
                  type="number"
                  min="1"
                  max="3650"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('custom_cycle_days') }"
                  placeholder="مثال: 45"
                  @blur="touchField('custom_cycle_days', form)"
                  @input="validateFieldIfTouched('custom_cycle_days', form)"
                />
                <span v-if="hasError('custom_cycle_days')" class="error-text">{{ getError('custom_cycle_days') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label required">تاريخ بداية الاشتراك / الدورة</label>
                <input
                  v-model="form.start_date"
                  type="date"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('start_date') }"
                  @change="touchField('start_date', form)"
                />
                <span v-if="hasError('start_date')" class="error-text">{{ getError('start_date') }}</span>
              </div>

              <div class="form-group">
                <div class="label-with-action">
                  <label class="form-label required">تاريخ الانتهاء القادم</label>
                  <button
                    type="button"
                    class="mini-action-link"
                    title="حساب تاريخ الانتهاء تلقائياً بناءً على تاريخ البداية والدورة"
                    @click="autoFillNextExpiry"
                  >
                    احتساب تلقائي ✨
                  </button>
                </div>
                <input
                  v-model="form.next_expiry_date"
                  type="date"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('next_expiry_date') }"
                  @change="touchField('next_expiry_date', form)"
                />
                <span v-if="hasError('next_expiry_date')" class="error-text">{{ getError('next_expiry_date') }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">فترة السماح بعد الانتهاء (بالأيام)</label>
                <input
                  v-model="form.grace_period_days"
                  type="number"
                  min="0"
                  max="90"
                  class="form-input"
                  :class="{ 'is-invalid': hasError('grace_period_days') }"
                  @blur="touchField('grace_period_days', form)"
                />
                <small class="field-hint">تستمر التنبيهات الحرجة يومياً خلال هذه المدة بعد الانتهاء</small>
                <span v-if="hasError('grace_period_days')" class="error-text">{{ getError('grace_period_days') }}</span>
              </div>

              <div v-if="isEditing" class="form-group">
                <label class="form-label">الحالة</label>
                <select v-model="form.status" class="form-select" @change="touchField('status', form)">
                  <option value="active">نشط (مراقب تلقائياً)</option>
                  <option value="paused">موقوف مؤقتاً (إيقاف التذكيرات)</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              <div class="form-group checkbox-card-group">
                <label class="toggle-card-label">
                  <input v-model="form.auto_renew" type="checkbox" />
                  <span>
                    <strong>تجديد تلقائي لدى المزود (Auto-Renew)</strong>
                    <small>سيظل التذكير يعمل كتنبيه مراجعة قبل السحب المالي</small>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <!-- القسم 3: قنوات الإشعار ومواعيد التذكير -->
          <section class="form-section">
            <h4 class="section-heading">3. قنوات الإشعار ومراحل التذكير الاستباقية</h4>

            <div class="form-group mb-block">
              <label class="form-label required">قنوات التنبيه المفعلة</label>
              <div class="channels-grid">
                <button
                  v-for="ch in channelOptions"
                  :key="ch.value"
                  type="button"
                  class="channel-toggle-card"
                  :class="{ active: form.channels.includes(ch.value) }"
                  @click="toggleChannel(ch.value)"
                >
                  <span class="ch-icon">{{ ch.icon }}</span>
                  <span class="ch-label">{{ ch.label }}</span>
                  <span class="ch-check">{{ form.channels.includes(ch.value) ? '✓' : '' }}</span>
                </button>
              </div>
              <div v-if="form.channels.includes('browser') && !isBrowserGranted && isBrowserSupported" class="inline-info-hint">
                🔔 تنبيه: إذن إشعارات المتصفح غير مفعل حالياً لديك،
                <button type="button" class="mini-action-link" @click="requestPermission">اضغط هنا لتفعيله</button>
              </div>
              <span v-if="hasError('channels')" class="error-text">{{ getError('channels') }}</span>
            </div>

            <div class="form-group">
              <label class="form-label required">مواعيد التذكير قبل الانتهاء (عدة مراحل)</label>
              <div class="presets-row">
                <button
                  v-for="preset in DEFAULT_REMINDER_PRESETS"
                  :key="preset.value"
                  type="button"
                  class="offset-chip"
                  :class="{ active: form.reminder_days_before.includes(preset.value) }"
                  @click="toggleReminderOffset(preset.value)"
                >
                  {{ preset.label }}
                </button>
              </div>

              <div class="custom-offset-row">
                <input
                  v-model="customOffsetInput"
                  type="number"
                  min="0"
                  max="365"
                  class="form-input custom-offset-input"
                  placeholder="أضف يوماً مخصصاً (مثلاً: 21)"
                  @keydown.enter.prevent="addCustomOffset"
                />
                <button type="button" class="btn-secondary-sm" @click="addCustomOffset">+ إضافة موعد</button>
              </div>

              <div v-if="form.reminder_days_before.length > 0" class="selected-tags-list">
                <span v-for="day in sortedSelectedOffsets" :key="day" class="selected-tag">
                  {{ day === 0 ? 'يوم الانتهاء (0)' : `قبل ${day} يوم` }}
                  <button type="button" class="tag-remove-btn" @click="removeReminderOffset(day)">✕</button>
                </span>
              </div>

              <span v-if="customOffsetError" class="error-text">{{ customOffsetError }}</span>
              <span v-if="hasError('reminder_days_before')" class="error-text">{{ getError('reminder_days_before') }}</span>
            </div>
          </section>

          <!-- القسم 4: المستلمون والملاحظات -->
          <section class="form-section">
            <h4 class="section-heading">4. المستلمون للتنبيهات والملاحظات</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">مستخدمو النظام (يصلهم: البريد + المتصفح + النظام)</label>
                <input
                  v-model="userSearch"
                  type="text"
                  class="form-input mb-sm"
                  placeholder="ابحث باسم الموظف أو بريده..."
                />
                <div class="users-checklist-box">
                  <label
                    v-for="u in filteredUsers"
                    :key="u.id"
                    class="user-check-row"
                    :class="{ checked: form.notify_user_ids.includes(u.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="u.id"
                      v-model="form.notify_user_ids"
                      @change="touchField('notify_user_ids', form)"
                    />
                    <span class="user-meta">
                      <strong>{{ u.name }}</strong>
                      <small>{{ u.email }} {{ u.job_title ? `• ${u.job_title}` : '' }}</small>
                    </span>
                  </label>
                  <p v-if="filteredUsers.length === 0" class="empty-mini">لا يوجد مستخدمون مطابقون للبحث.</p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">إيميلات إضافية خارجية (يصلها تنبيه البريد)</label>
                <div class="custom-offset-row">
                  <input
                    v-model="emailTagInput"
                    type="email"
                    dir="ltr"
                    class="form-input text-left"
                    placeholder="billing@company.com"
                    @keydown.enter.prevent="addExternalEmail"
                  />
                  <button type="button" class="btn-secondary-sm" @click="addExternalEmail">+ إضافة بريد</button>
                </div>
                <span v-if="emailInputError" class="error-text">{{ emailInputError }}</span>

                <div v-if="form.notify_emails.length > 0" class="selected-tags-list">
                  <span v-for="em in form.notify_emails" :key="em" class="selected-tag email-tag">
                    📧 {{ em }}
                    <button type="button" class="tag-remove-btn" @click="removeExternalEmail(em)">✕</button>
                  </span>
                </div>
                <span v-if="hasError('notify_emails')" class="error-text">{{ getError('notify_emails') }}</span>
                <span v-if="hasError('notify_user_ids')" class="error-text">{{ getError('notify_user_ids') }}</span>
              </div>

              <div class="form-group full-width">
                <label class="form-label">ملاحظات داخلية</label>
                <textarea
                  v-model="form.notes"
                  rows="2"
                  maxlength="2000"
                  class="form-textarea"
                  :class="{ 'is-invalid': hasError('notes') }"
                  placeholder="بيانات الخطة، طريقة الدفع، أو أي ملاحظات للفريق..."
                  @blur="touchField('notes', form)"
                ></textarea>
                <span v-if="hasError('notes')" class="error-text">{{ getError('notes') }}</span>
              </div>
            </div>
          </section>

          <footer class="modal-footer">
            <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
            <button type="submit" class="save-btn" :disabled="submitting">
              <span v-if="submitting" class="spinner-sm"></span>
              <span>{{ submitting ? 'جارٍ الحفظ...' : (isEditing ? 'حفظ التعديلات 💾' : 'إنشاء الاشتراك وتفعيل التنبيهات 🚀') }}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import {
  DEFAULT_REMINDER_PRESETS,
  DEFAULT_REMINDER_DAYS,
  DEFAULT_CHANNELS,
  SUPPORTED_CURRENCIES,
  computeNextExpiryPreview,
} from '../constants/subscriptionOptions.js';
import {
  SUBSCRIPTION_FORM_FIELDS,
  validateSubscriptionField,
  validateSubscriptionForm,
  validateSingleEmailAddition,
  validateSingleReminderOffsetAddition,
} from '../validation/subscriptionValidator.js';
import { useFormValidation } from '../composables/useFormValidation.js';
import { useBrowserNotifications } from '../composables/useBrowserNotifications.js';

const props = defineProps({
  show: { type: Boolean, default: false },
  subscription: { type: Object, default: null },
  meta: { type: Object, default: () => ({}) },
  submitting: { type: Boolean, default: false },
  onSave: { type: Function, required: true },
});

const emit = defineEmits(['close']);

const { isSupported: isBrowserSupported, isGranted: isBrowserGranted, requestPermission } = useBrowserNotifications();

const isEditing = computed(() => Boolean(props.subscription?.id));

const form = reactive({
  name: '',
  category: 'domain',
  provider_name: '',
  domain_or_identifier: '',
  management_url: '',
  account_email: '',
  amount: '',
  currency: 'USD',
  billing_cycle: 'annual',
  custom_cycle_days: null,
  start_date: new Date().toISOString().slice(0, 10),
  next_expiry_date: '',
  grace_period_days: 7,
  auto_renew: false,
  status: 'active',
  channels: [...DEFAULT_CHANNELS],
  reminder_days_before: [...DEFAULT_REMINDER_DAYS],
  notify_user_ids: [],
  notify_emails: [],
  notes: '',
});

const userSearch = ref('');
const emailTagInput = ref('');
const emailInputError = ref('');
const customOffsetInput = ref('');
const customOffsetError = ref('');

const {
  serverBanner,
  touchField,
  validateFieldIfTouched,
  validateAll,
  applyServerErrors,
  resetValidation,
  hasError,
  getError,
} = useFormValidation({
  fields: SUBSCRIPTION_FORM_FIELDS,
  validateFieldFn: validateSubscriptionField,
  validateFormFn: validateSubscriptionForm,
});

const categoryOptions = computed(() =>
  props.meta?.categories?.length
    ? props.meta.categories
    : [
        { value: 'domain', label: 'نطاقات (Domains)', icon: '🌐' },
        { value: 'hosting', label: 'استضافة مواقع (Hosting)', icon: '🏠' },
        { value: 'ssl', label: 'شهادات أمان (SSL)', icon: '🔒' },
        { value: 'saas', label: 'أدوات وبرمجيات (SaaS)', icon: '🧩' },
        { value: 'marketing_tool', label: 'أدوات تسويق وإعلانات', icon: '📣' },
        { value: 'server', label: 'خوادم وسيرفرات (VPS)', icon: '🖥️' },
        { value: 'email_service', label: 'خدمات البريد الإلكتروني', icon: '📧' },
        { value: 'other', label: 'اشتراكات أخرى', icon: '📦' },
      ]
);

const billingCycleOptions = computed(() =>
  props.meta?.billing_cycles?.length
    ? props.meta.billing_cycles
    : [
        { value: 'monthly', label: 'شهري' },
        { value: 'quarterly', label: 'ربع سنوي (كل 3 أشهر)' },
        { value: 'semi_annual', label: 'نصف سنوي (كل 6 أشهر)' },
        { value: 'annual', label: 'سنوي' },
        { value: 'biennial', label: 'كل سنتين' },
        { value: 'custom_days', label: 'مخصص (عدد أيام محدد)' },
      ]
);

const channelOptions = computed(() =>
  props.meta?.channels?.length
    ? props.meta.channels
    : [
        { value: 'email', label: 'البريد الإلكتروني', icon: '📧' },
        { value: 'browser', label: 'إشعارات المتصفح', icon: '🔔' },
        { value: 'system', label: 'إشعارات النظام الداخلية', icon: '💬' },
      ]
);

const currencies = computed(() => props.meta?.supported_currencies || SUPPORTED_CURRENCIES);

const sortedSelectedOffsets = computed(() => [...form.reminder_days_before].sort((a, b) => b - a));

const filteredUsers = computed(() => {
  const users = props.meta?.users || [];
  const q = userSearch.value.trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (u) =>
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q)
  );
});

const initForm = () => {
  resetValidation();
  emailTagInput.value = '';
  emailInputError.value = '';
  customOffsetInput.value = '';
  customOffsetError.value = '';
  userSearch.value = '';

  const s = props.subscription;
  if (s && s.id) {
    form.name = s.name || '';
    form.category = s.category || 'domain';
    form.provider_name = s.provider_name || '';
    form.domain_or_identifier = s.domain_or_identifier || '';
    form.management_url = s.management_url || '';
    form.account_email = s.account_email || '';
    form.amount = s.amount ?? '';
    form.currency = s.currency || 'USD';
    form.billing_cycle = s.billing_cycle || 'annual';
    form.custom_cycle_days = s.custom_cycle_days ?? null;
    form.start_date = s.start_date || new Date().toISOString().slice(0, 10);
    form.next_expiry_date = s.next_expiry_date || '';
    form.grace_period_days = s.grace_period_days ?? 7;
    form.auto_renew = Boolean(s.auto_renew);
    form.status = s.status === 'paused' || s.status === 'cancelled' ? s.status : 'active';
    form.channels = Array.isArray(s.channels) ? [...s.channels] : [...DEFAULT_CHANNELS];
    form.reminder_days_before = Array.isArray(s.reminder_days_before)
      ? [...s.reminder_days_before]
      : [...DEFAULT_REMINDER_DAYS];
    form.notify_user_ids = Array.isArray(s.notify_user_ids) ? [...s.notify_user_ids] : [];
    form.notify_emails = Array.isArray(s.notify_emails) ? [...s.notify_emails] : [];
    form.notes = s.notes || '';
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const defaultUser = (() => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        return stored?.id ? [Number(stored.id)] : [];
      } catch {
        return [];
      }
    })();

    form.name = '';
    form.category = 'domain';
    form.provider_name = '';
    form.domain_or_identifier = '';
    form.management_url = '';
    form.account_email = '';
    form.amount = '';
    form.currency = props.meta?.defaults?.currency || 'USD';
    form.billing_cycle = 'annual';
    form.custom_cycle_days = null;
    form.start_date = today;
    form.next_expiry_date = computeNextExpiryPreview(today, 'annual');
    form.grace_period_days = props.meta?.defaults?.grace_period_days ?? 7;
    form.auto_renew = false;
    form.status = 'active';
    form.channels = [...(props.meta?.defaults?.channels || DEFAULT_CHANNELS)];
    form.reminder_days_before = [...(props.meta?.defaults?.reminder_days_before || DEFAULT_REMINDER_DAYS)];
    form.notify_user_ids = defaultUser;
    form.notify_emails = [];
    form.notes = '';
  }
};

watch(
  () => [props.show, props.subscription],
  ([showVal]) => {
    if (showVal) initForm();
  },
  { immediate: true }
);

const onBillingCycleChange = () => {
  if (form.billing_cycle !== 'custom_days') {
    form.custom_cycle_days = null;
  }
  touchField('billing_cycle', form);
};

const autoFillNextExpiry = () => {
  const computedDate = computeNextExpiryPreview(form.start_date, form.billing_cycle, form.custom_cycle_days);
  if (computedDate) {
    form.next_expiry_date = computedDate;
    touchField('next_expiry_date', form);
  }
};

const toggleChannel = (channelValue) => {
  const idx = form.channels.indexOf(channelValue);
  if (idx >= 0) {
    form.channels.splice(idx, 1);
  } else {
    form.channels.push(channelValue);
  }
  touchField('channels', form);
};

const toggleReminderOffset = (days) => {
  customOffsetError.value = '';
  const idx = form.reminder_days_before.indexOf(days);
  if (idx >= 0) {
    form.reminder_days_before.splice(idx, 1);
  } else {
    const check = validateSingleReminderOffsetAddition(days, form.reminder_days_before, form.billing_cycle, form.custom_cycle_days);
    if (!check.valid) {
      customOffsetError.value = check.message;
      return;
    }
    form.reminder_days_before.push(days);
  }
  touchField('reminder_days_before', form);
};

const addCustomOffset = () => {
  customOffsetError.value = '';
  const check = validateSingleReminderOffsetAddition(
    customOffsetInput.value,
    form.reminder_days_before,
    form.billing_cycle,
    form.custom_cycle_days
  );
  if (!check.valid) {
    customOffsetError.value = check.message;
    return;
  }
  form.reminder_days_before.push(check.value);
  customOffsetInput.value = '';
  touchField('reminder_days_before', form);
};

const removeReminderOffset = (days) => {
  form.reminder_days_before = form.reminder_days_before.filter((d) => d !== days);
  touchField('reminder_days_before', form);
};

const addExternalEmail = () => {
  emailInputError.value = '';
  const check = validateSingleEmailAddition(emailTagInput.value, form.notify_emails);
  if (!check.valid) {
    emailInputError.value = check.message;
    return;
  }
  form.notify_emails.push(check.value);
  emailTagInput.value = '';
  touchField('notify_emails', form);
};

const removeExternalEmail = (email) => {
  form.notify_emails = form.notify_emails.filter((e) => e !== email);
  touchField('notify_emails', form);
};

const handleSubmit = async () => {
  if (!validateAll(form)) {
    return;
  }

  const payload = {
    name: form.name.trim(),
    category: form.category,
    provider_name: form.provider_name.trim(),
    domain_or_identifier: form.domain_or_identifier.trim() || null,
    management_url: form.management_url.trim() || null,
    account_email: form.account_email.trim() || null,
    amount: Number(form.amount),
    currency: form.currency,
    billing_cycle: form.billing_cycle,
    custom_cycle_days: form.billing_cycle === 'custom_days' ? Number(form.custom_cycle_days) : null,
    start_date: form.start_date,
    next_expiry_date: form.next_expiry_date,
    grace_period_days: Number(form.grace_period_days ?? 7),
    auto_renew: Boolean(form.auto_renew),
    channels: [...form.channels],
    reminder_days_before: [...sortedSelectedOffsets.value],
    notify_user_ids: [...form.notify_user_ids],
    notify_emails: [...form.notify_emails],
    notes: form.notes.trim() || null,
  };

  if (isEditing.value) {
    payload.status = form.status;
  }

  const result = await props.onSave(payload);
  if (result?.ok) {
    emit('close');
  } else if (result) {
    applyServerErrors(result.errors, result.message);
  }
};
</script>

<style scoped>
.sub-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(6px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.sub-modal-card {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 58rem;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.5rem;
  background: rgba(30, 41, 59, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(14, 165, 233, 0.2));
  border: 1px solid rgba(16, 185, 129, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.header-title h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 800;
}

.header-title p {
  margin: 0.2rem 0 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  cursor: pointer;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.server-error-banner {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-section {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.95rem;
  padding: 1rem 1.15rem;
}

.section-heading {
  margin: 0 0 0.85rem 0;
  color: #34d399;
  font-size: 0.9rem;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.form-grid.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .form-grid,
  .form-grid.three-cols {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.mb-block {
  margin-bottom: 1rem;
}

.mb-sm {
  margin-bottom: 0.4rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #cbd5e1;
}

.form-label.required::after {
  content: ' *';
  color: #f43f5e;
}

.label-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.mini-action-link {
  background: none;
  border: none;
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.mini-action-link:hover {
  text-decoration: underline;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.625rem;
  padding: 0.55rem 0.75rem;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #10b981;
}

.form-input.is-invalid,
.form-select.is-invalid,
.form-textarea.is-invalid {
  border-color: #f43f5e;
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.15);
}

.text-left {
  text-align: left;
}

.error-text {
  color: #fda4af;
  font-size: 0.75rem;
  font-weight: 600;
}

.field-hint {
  color: #64748b;
  font-size: 0.72rem;
}

.checkbox-card-group {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .checkbox-card-group {
    grid-column: span 1;
  }
}

.toggle-card-label {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  cursor: pointer;
}

.toggle-card-label strong {
  display: block;
  color: #f1f5f9;
  font-size: 0.82rem;
}

.toggle-card-label small {
  color: #94a3b8;
  font-size: 0.74rem;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (max-width: 640px) {
  .channels-grid {
    grid-template-columns: 1fr;
  }
}

.channel-toggle-card {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.7rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.channel-toggle-card.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #34d399;
}

.ch-label {
  flex: 1;
  text-align: right;
}

.inline-info-hint {
  margin-top: 0.35rem;
  font-size: 0.77rem;
  color: #7dd3fc;
}

.presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.55rem;
}

.offset-chip {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.77rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.offset-chip.active {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}

.custom-offset-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary-sm {
  white-space: nowrap;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
  padding: 0.52rem 0.85rem;
  border-radius: 0.625rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.selected-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.76rem;
  font-weight: 600;
}

.email-tag {
  background: rgba(56, 189, 248, 0.14);
  border-color: rgba(56, 189, 248, 0.3);
  color: #bae6fd;
}

.tag-remove-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.72rem;
  opacity: 0.8;
}

.users-checklist-box {
  max-height: 11rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.65rem;
  padding: 0.5rem;
}

.user-check-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.user-check-row.checked {
  background: rgba(16, 185, 129, 0.14);
}

.user-meta strong {
  display: block;
  font-size: 0.8rem;
  color: #f1f5f9;
}

.user-meta small {
  font-size: 0.72rem;
  color: #94a3b8;
}

.empty-mini {
  margin: 0;
  padding: 0.75rem;
  text-align: center;
  color: #64748b;
  font-size: 0.78rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 0.6rem 1.2rem;
  border-radius: 0.65rem;
  font-weight: 700;
  cursor: pointer;
}

.save-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 0.6rem 1.4rem;
  border-radius: 0.65rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
