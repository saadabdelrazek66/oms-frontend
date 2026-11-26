<template>
  <Teleport to="body">
    <div v-if="modelValue && canManageAccounts(currentUser)" class="clients-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="closeModal">
        <div
          ref="modalContent"
          class="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabindex="-1"
          @keydown.esc="closeModal"
        >
          <button
            ref="modalCloseButton"
            class="modal-close"
            type="button"
            aria-label="إغلاق النافذة"
            @click="closeModal"
          >
            ×
          </button>
          <div class="modal-icon">◇</div>
          <span class="eyebrow">ملف العميل</span>
          <h3 id="modal-title">{{ isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد' }}</h3>
          <p>أدخل البيانات الأساسية ووسائل التواصل الخاصة بالشركة.</p>

          <form class="client-form" @submit.prevent="saveClient">
            <!-- البيانات الأساسية والشعار -->
            <div class="form-section">
              <h4>البيانات الأساسية وشعار الشركة</h4>
              <div class="basic-info-grid">
                <div class="logo-field-group">
                  <label class="field-label">شعار الشركة (اللوجو)</label>
                  <input
                    ref="logoInputRef"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    style="display: none"
                    @change="onLogoSelected"
                  />

                  <div v-if="logoPreview" class="logo-preview-card">
                    <div class="logo-img-wrapper">
                      <img :src="logoPreview" alt="معاينة اللوجو" class="logo-preview-img" />
                    </div>
                    <div class="logo-preview-meta">
                      <span class="logo-status-tag">
                        <i class="check-icon">✓</i>
                        {{ logoFile ? 'لوجو جديد محدد' : 'اللوجو الحالي' }}
                      </span>
                      <div class="logo-action-buttons">
                        <button
                          type="button"
                          class="logo-action-btn edit-btn"
                          title="تغيير الصورة"
                          @click="triggerLogoUpload"
                        >
                          📷 تغيير
                        </button>
                        <button
                          type="button"
                          class="logo-action-btn remove-btn-custom"
                          title="إزالة الصورة"
                          @click="removeLogo"
                        >
                          🗑️ إزالة
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    v-else
                    class="logo-dropzone"
                    role="button"
                    tabindex="0"
                    @click="triggerLogoUpload"
                    @keydown.enter.prevent="triggerLogoUpload"
                    @keydown.space.prevent="triggerLogoUpload"
                  >
                    <div class="dropzone-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="dropzone-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div class="dropzone-text">
                      <span class="dropzone-main">اضغط لرفع لوجو العميل</span>
                      <span class="dropzone-sub">PNG, JPG, WebP أو SVG (حتى 5MB)</span>
                    </div>
                  </div>
                </div>

                <div class="form-group mb-0 client-name-group">
                  <label>اسم الشركة / العميل <i>*</i></label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="مثال: شركة أفق للتطوير"
                    required
                  />
                  <span class="field-hint">اسم الشركة يظهر في اللوحات والخطط والتقارير</span>
                </div>
              </div>
            </div>

            <!-- الهواتف -->
            <div class="form-section">
              <div class="section-head">
                <h4>أرقام الهواتف</h4>
                <button type="button" class="outline-btn" @click="addPhone">＋ إضافة رقم</button>
              </div>
              <div v-for="(phone, index) in form.phones" :key="index" class="dynamic-row">
                <input v-model="phone.number" type="text" placeholder="01xxxxxxxx" required dir="ltr" />
                <label
                  class="checkbox-label"
                  style="display: flex; align-items: center; gap: 5px; font-size: 10px; color: #aeb6d7; cursor: pointer"
                >
                  <input type="checkbox" v-model="phone.has_whatsapp" style="width: auto; min-height: auto" />
                  عليه واتساب؟
                </label>
                <button type="button" class="remove-btn" title="حذف الرقم" @click="removePhone(index)">🗑️</button>
              </div>
              <span v-if="!form.phones.length" class="empty-hint">لم يتم إضافة أرقام هاتف.</span>
            </div>

            <!-- الإيميلات -->
            <div class="form-section">
              <div class="section-head">
                <h4>البريد الإلكتروني للشركة</h4>
                <button type="button" class="outline-btn" @click="addEmail">＋ إضافة إيميل</button>
              </div>
              <div v-for="(email, index) in form.emails" :key="'e' + index" class="dynamic-row">
                <input
                  v-model="form.emails[index]"
                  type="email"
                  placeholder="name@company.com"
                  required
                  dir="ltr"
                />
                <button type="button" class="remove-btn" title="حذف الإيميل" @click="removeEmail(index)">🗑️</button>
              </div>
              <span v-if="!form.emails.length" class="empty-hint">لم يتم إضافة بريد إلكتروني.</span>
            </div>

            <!-- البيانات المالية -->
            <div class="form-section">
              <h4>البيانات المالية</h4>
              <div class="form-grid-3">
                <div class="form-group">
                  <label>اسم البنك</label>
                  <input v-model="form.bank_name" type="text" placeholder="مثال: CIB" />
                </div>
                <div class="form-group">
                  <label>فرع البنك</label>
                  <input v-model="form.bank_branch" type="text" placeholder="الفرع" />
                </div>
                <div class="form-group">
                  <label>الحساب البنكي / IBAN</label>
                  <input v-model="form.bank_account" type="text" placeholder="رقم الحساب" />
                </div>
                <div class="form-group">
                  <label>عنوان Instapay</label>
                  <input v-model="form.instapay" type="text" placeholder="@username" />
                </div>
                <div class="form-group">
                  <label>رقم المحفظة</label>
                  <input v-model="form.wallet" type="text" placeholder="رقم المحفظة" />
                </div>
              </div>
            </div>

            <!-- مسؤول المبيعات ونظام العمولة -->
            <div class="form-section">
              <h4>مسؤول المبيعات ونظام العمولة 🎯</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>مسؤول المبيعات / الشريك بالعمولة</label>
                  <select v-model="form.sales_rep_id" class="platform-select">
                    <option value="">بدون مسؤول مبيعات (عميل مباشر)</option>
                    <option v-for="user in salesReps" :key="user.id" :value="user.id">
                      {{ user.name }}
                      {{
                        user.work_type === 'commission' || user.work_type?.value === 'commission'
                          ? '🎯 (بالعمولة: ' +
                            (user.commission_type === 'percentage'
                              ? user.commission_rate + '%'
                              : Number(user.commission_rate).toLocaleString() + ' ج.م') +
                            ')'
                          : ''
                      }}
                    </option>
                  </select>
                  <small class="muted" style="font-size: 11px">
                    الموظف المستحق لعمولة تلقائية عند تسجيل إيرادات هذا العميل
                  </small>
                </div>

                <div class="form-group">
                  <label>نسبة عمولة مخصصة لهذا العميل (اختياري)</label>
                  <input
                    v-model="form.custom_commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="اتركها فارغة لاستخدام نسبة الموظف الافتراضية"
                  />
                  <small class="muted" style="font-size: 11px">
                    إذا تم تحديدها، سيتم احتساب العمولة بهذه القيمة بدلاً من النسبة الافتراضية للموظف
                  </small>
                </div>
              </div>
            </div>

            <!-- روابط درايف -->
            <div class="form-section">
              <div class="section-head">
                <h4>روابط درايف الخاصة بالعميل 📁</h4>
                <button type="button" class="outline-btn" @click="addDriveLink">＋ إضافة رابط درايف</button>
              </div>
              <TransitionGroup name="list" tag="div">
                <div v-for="(link, index) in form.drive_links" :key="'d' + index" class="dynamic-row">
                  <div class="custom-select-wrapper drive-select-wrapper">
                    <select v-model="link.title" class="drive-title-select" required>
                      <option value="" disabled>اختر نوع الرابط...</option>
                      <option v-for="opt in driveTitleOptions" :key="opt" :value="opt">{{ opt }}</option>
                      <option v-if="link.title && !driveTitleOptions.includes(link.title)" :value="link.title">
                        {{ link.title }}
                      </option>
                    </select>
                    <span class="select-chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                  <input
                    v-model="link.url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    required
                    dir="ltr"
                    style="flex: 2"
                  />
                  <button type="button" class="remove-btn" title="حذف الرابط" @click="removeDriveLink(index)">🗑️</button>
                </div>
              </TransitionGroup>
              <span v-if="!form.drive_links.length" class="empty-hint">لم يتم إضافة أي روابط درايف.</span>
            </div>

            <!-- السوشيال ميديا -->
            <div class="form-section">
              <div class="section-head">
                <h4>روابط التواصل الاجتماعي (المنصات)</h4>
                <button type="button" class="outline-btn" @click="addSocialLink">＋ إضافة منصة</button>
              </div>
              <div v-for="(link, index) in form.social_links" :key="'s' + index" class="social-link-wrapper">
                <div class="dynamic-row">
                  <select v-model="link.platform" class="platform-select" required style="flex: 1; min-width: 150px">
                    <option value="" disabled>اختر المنصة...</option>
                    <option v-for="p in socialPlatformOptions" :key="p.value" :value="p.value">
                      {{ p.label }}
                    </option>
                    <option
                      v-if="link.platform && !socialPlatformOptions.some((p) => p.value === link.platform)"
                      :value="link.platform"
                    >
                      {{ link.platform }}
                    </option>
                  </select>
                  <input
                    v-model="link.url"
                    type="url"
                    placeholder="https://..."
                    required
                    dir="ltr"
                    style="flex: 2"
                    :class="{ 'input-has-error': getSocialLinkError(link) }"
                    @blur="ensureHttpsPrefix(link)"
                  />
                  <button type="button" class="remove-btn" title="حذف المنصة" @click="removeSocialLink(index)">🗑️</button>
                </div>
                <transition name="slide-fade">
                  <div v-if="getSocialLinkError(link)" class="social-validation-warning">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">{{ getSocialLinkError(link) }}</span>
                  </div>
                </transition>
              </div>
              <span v-if="!form.social_links.length" class="empty-hint">لم يتم إضافة منصات تواصل.</span>
            </div>

            <!-- جروبات ومجموعات العمل -->
            <div class="form-section">
              <div class="section-head">
                <h4>جروبات ومجموعات العمل مع العميل (واتساب، تليجرام، إلخ)</h4>
                <button type="button" class="outline-btn" @click="addGroupLink">＋ إضافة رابط جروب</button>
              </div>
              <div v-for="(grp, index) in form.group_links" :key="'g' + index" class="group-link-wrapper">
                <div class="dynamic-row">
                  <select
                    v-model="grp.platform"
                    class="platform-select"
                    required
                    style="flex: 1; min-width: 140px"
                    @change="ensureHttpsPrefix(grp)"
                  >
                    <option value="" disabled>اختر المنصة...</option>
                    <option v-for="p in groupPlatformOptions" :key="p.value" :value="p.value">
                      {{ p.icon }} {{ p.label }}
                    </option>
                  </select>
                  <input
                    v-model="grp.title"
                    type="text"
                    placeholder="اسم أو وصف الجروب (مثال: جروب المحتوى)"
                    style="flex: 1.2; min-width: 130px"
                  />
                  <input
                    v-model="grp.url"
                    type="url"
                    :placeholder="getGroupPlatformPlaceholder(grp.platform)"
                    required
                    dir="ltr"
                    style="flex: 2"
                    :class="{
                      'input-error': grp.url && getGroupUrlValidationError(grp),
                      'input-success': grp.url && !getGroupUrlValidationError(grp),
                    }"
                    @blur="ensureHttpsPrefix(grp)"
                  />
                  <button type="button" class="remove-btn" title="حذف رابط الجروب" @click="removeGroupLink(index)">
                    🗑️
                  </button>
                </div>

                <div class="group-validation-feedback">
                  <span v-if="grp.url && getGroupUrlValidationError(grp)" class="val-error-text">
                    ⚠️ {{ getGroupUrlValidationError(grp) }}
                  </span>
                  <span v-else-if="grp.url" class="val-success-text">
                    ✅ رابط جروب {{ getGroupPlatformLabel(grp.platform) }} صحيح ومعتمد
                  </span>
                  <span v-else class="val-hint-text">
                    ℹ️ {{ getGroupPlatformHint(grp.platform) }}
                  </span>
                </div>
              </div>
              <span v-if="!form.group_links.length" class="empty-hint">لم يتم إضافة أي روابط جروبات للعميل.</span>
            </div>

            <!-- جهات الاتصال (الأشخاص) -->
            <div class="form-section">
              <div class="section-head">
                <h4>الأشخاص وجهات الاتصال (للتواصل الشخصي)</h4>
                <button type="button" class="outline-btn" @click="addContact">＋ إضافة شخص</button>
              </div>
              <div v-for="(contact, index) in form.contacts" :key="'c' + index" class="contact-row">
                <input v-model="contact.contact_name" type="text" placeholder="اسم الشخص" required />
                <select v-model="contact.contact_method" required>
                  <option value="" disabled>طريقة التواصل</option>
                  <option value="whatsapp">واتساب</option>
                  <option value="phone">اتصال هاتفي</option>
                  <option value="email">إيميل</option>
                  <option value="linkedin">لينكدإن</option>
                  <option value="other">أخرى</option>
                </select>
                <input v-model="contact.contact_details" type="text" placeholder="الرقم أو الإيميل" required />
                <button type="button" class="remove-btn" title="حذف الشخص" @click="removeContact(index)">🗑️</button>
              </div>
              <span v-if="!form.contacts.length" class="empty-hint">لم يتم إضافة جهات اتصال شخصية بعد.</span>
            </div>

            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="saving">
                {{ saving ? 'جارٍ الحفظ...' : 'حفظ البيانات' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import api from '@/axios'
import { canManageAccounts } from '@/utils/permissions'
import alertService from '@/services/alertService'
import {
  driveTitleOptions,
  ensureHttpsPrefix,
  getGroupPlatformHint,
  getGroupPlatformLabel,
  getGroupPlatformPlaceholder,
  getGroupUrlValidationError,
  getSocialLinkError,
  groupPlatformOptions,
  normalizePlatform,
  socialPlatformOptions,
} from '../utils/clientLinks'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editingClient: { type: Object, default: null },
  salesReps: { type: Array, default: () => [] },
  currentUser: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const isEditing = computed(() => Boolean(props.editingClient))
const saving = ref(false)
const modalCloseButton = ref(null)
const logoFile = ref(null)
const logoPreview = ref('')
const logoInputRef = ref(null)

const form = reactive({
  name: '',
  sales_rep_id: '',
  custom_commission_rate: '',
  phones: [],
  emails: [],
  bank_name: '',
  bank_branch: '',
  bank_account: '',
  instapay: '',
  wallet: '',
  social_links: [],
  group_links: [],
  drive_links: [],
  contacts: [],
})

const showToast = (msg) => alertService.smartToast(msg)

const resetForm = () => {
  logoFile.value = null
  logoPreview.value = ''
  if (logoInputRef.value) logoInputRef.value.value = ''
  Object.assign(form, {
    name: '',
    sales_rep_id: '',
    custom_commission_rate: '',
    phones: [],
    emails: [],
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    instapay: '',
    wallet: '',
    social_links: [],
    group_links: [],
    drive_links: [],
    contacts: [],
  })
}

watch(
  [() => props.modelValue, () => props.editingClient],
  async ([open, client]) => {
    if (!open) return
    logoFile.value = null
    logoPreview.value = client?.logo_url || ''
    if (logoInputRef.value) logoInputRef.value.value = ''

    if (client) {
      Object.assign(form, {
        name: client.name,
        sales_rep_id: client.sales_rep_id || '',
        custom_commission_rate: client.custom_commission_rate || '',
        phones: client.phones ? JSON.parse(JSON.stringify(client.phones)) : [],
        emails: client.emails ? [...client.emails] : [],
        bank_name: client.bank_name || '',
        bank_branch: client.bank_branch || '',
        bank_account: client.bank_account || '',
        instapay: client.instapay || '',
        wallet: client.wallet || '',
        social_links: client.social_links
          ? client.social_links.map((link) => ({
              platform: normalizePlatform(link.platform),
              url: link.url || '',
            }))
          : [],
        group_links: client.group_links
          ? client.group_links.map((grp) => ({
              platform: grp.platform || 'whatsapp',
              title: grp.title || '',
              url: grp.url || '',
            }))
          : [],
        drive_links: client.drive_links ? JSON.parse(JSON.stringify(client.drive_links)) : [],
        contacts: client.contacts ? JSON.parse(JSON.stringify(client.contacts)) : [],
      })
    } else {
      resetForm()
    }

    await nextTick()
    modalCloseButton.value?.focus({ preventScroll: true })
  },
  { immediate: true },
)

const closeModal = () => {
  emit('update:modelValue', false)
}

const triggerLogoUpload = () => logoInputRef.value?.click()

const onLogoSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToast('⚠️ يرجى اختيار ملف صورة صالح (PNG, JPG, WebP, SVG)')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('⚠️ حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت')
    return
  }
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

const removeLogo = () => {
  logoFile.value = null
  logoPreview.value = ''
  if (logoInputRef.value) logoInputRef.value.value = ''
}

const confirmAndRemove = async (title, message, list, index) => {
  const confirmed = await alertService.confirm({
    title,
    message,
    type: 'danger',
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
  })
  if (confirmed) list.splice(index, 1)
}

const addPhone = () => form.phones.push({ number: '', has_whatsapp: false })
const removePhone = (i) => confirmAndRemove('حذف رقم الهاتف', 'هل أنت متأكد من حذف هذا الرقم؟', form.phones, i)

const addEmail = () => form.emails.push('')
const removeEmail = (i) =>
  confirmAndRemove('حذف البريد الإلكتروني', 'هل أنت متأكد من حذف هذا البريد الإلكتروني؟', form.emails, i)

const addDriveLink = () => form.drive_links.push({ title: '', url: '' })
const removeDriveLink = (i) =>
  confirmAndRemove('حذف رابط الدرايف', 'هل أنت متأكد من حذف هذا الرابط؟', form.drive_links, i)

const addSocialLink = () => form.social_links.push({ platform: '', url: '' })
const removeSocialLink = (i) =>
  confirmAndRemove('حذف رابط المنصة', 'هل أنت متأكد من حذف هذا الرابط؟', form.social_links, i)

const addGroupLink = () => form.group_links.push({ platform: 'whatsapp', title: '', url: '' })
const removeGroupLink = (i) =>
  confirmAndRemove('حذف رابط الجروب', 'هل أنت متأكد من حذف رابط هذا الجروب؟', form.group_links, i)

const addContact = () =>
  form.contacts.push({ contact_name: '', contact_method: '', contact_details: '' })
const removeContact = (i) =>
  confirmAndRemove('حذف جهة الاتصال', 'هل أنت متأكد من حذف جهة الاتصال هذه؟', form.contacts, i)

const saveClient = async () => {
  if (!canManageAccounts(props.currentUser)) {
    showToast('عذراً، لا تمتلك الصلاحية لحفظ بيانات العميل')
    return
  }

  const invalidLink = form.social_links.find((link) => Boolean(getSocialLinkError(link)))
  if (invalidLink) {
    showToast(`⚠️ يرجى تصحيح رابط ${invalidLink.platform || 'المنصة'} غير المتطابق قبل الحفظ`)
    return
  }

  for (let i = 0; i < form.group_links.length; i++) {
    const grp = form.group_links[i]
    if (!grp.url || !grp.url.trim()) {
      showToast(`يرجى إدخال رابط الجروب رقم ${i + 1}`)
      return
    }
    const errorMsg = getGroupUrlValidationError(grp)
    if (errorMsg) {
      showToast(`خطأ في رابط الجروب (${getGroupPlatformLabel(grp.platform)}): ${errorMsg}`)
      return
    }
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('name', form.name ? form.name.trim() : '')
    formData.append('sales_rep_id', form.sales_rep_id || '')

    if (
      form.custom_commission_rate !== '' &&
      form.custom_commission_rate !== null &&
      form.custom_commission_rate !== undefined
    ) {
      formData.append('custom_commission_rate', form.custom_commission_rate)
    }
    if (form.bank_name) formData.append('bank_name', form.bank_name)
    if (form.bank_branch) formData.append('bank_branch', form.bank_branch)
    if (form.bank_account) formData.append('bank_account', form.bank_account)
    if (form.instapay) formData.append('instapay', form.instapay)
    if (form.wallet) formData.append('wallet', form.wallet)
    if (logoFile.value) formData.append('logo', logoFile.value)

    form.phones.forEach((phone, index) => {
      formData.append(`phones[${index}][number]`, phone.number || '')
      formData.append(`phones[${index}][has_whatsapp]`, phone.has_whatsapp ? '1' : '0')
    })

    form.emails.forEach((email, index) => {
      formData.append(`emails[${index}]`, email || '')
    })

    form.social_links.forEach((link, index) => {
      formData.append(`social_links[${index}][platform]`, link.platform || '')
      formData.append(`social_links[${index}][url]`, link.url || '')
    })

    form.group_links.forEach((group, index) => {
      formData.append(`group_links[${index}][platform]`, group.platform || 'other')
      formData.append(`group_links[${index}][title]`, group.title || '')
      formData.append(`group_links[${index}][url]`, group.url || '')
    })

    form.drive_links.forEach((link, index) => {
      formData.append(`drive_links[${index}][title]`, link.title || '')
      formData.append(`drive_links[${index}][url]`, link.url || '')
    })

    form.contacts.forEach((contact, index) => {
      formData.append(`contacts[${index}][contact_name]`, contact.contact_name || '')
      formData.append(`contacts[${index}][contact_method]`, contact.contact_method || '')
      formData.append(`contacts[${index}][contact_details]`, contact.contact_details || '')
    })

    if (isEditing.value) {
      formData.append('_method', 'PUT')
      await api.post(`/clients/${props.editingClient.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      await api.post('/clients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    const wasEditing = isEditing.value
    closeModal()
    emit('saved', wasEditing)
  } catch (error) {
    const backendErrors = error.response?.data?.errors
    let errorMsg = error.response?.data?.message
    if (backendErrors && typeof backendErrors === 'object') {
      const firstKey = Object.keys(backendErrors)[0]
      if (firstKey && backendErrors[firstKey]?.length) {
        errorMsg = backendErrors[firstKey][0]
      }
    }
    showToast(errorMsg || 'تأكد من إدخال البيانات بشكل صحيح')
  } finally {
    saving.value = false
  }
}
</script>
