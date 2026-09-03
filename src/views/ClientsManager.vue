<template>
  <section class="clients-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة الإدارة / العملاء</span>
        <h2>إدارة العملاء والشركات</h2>
        <p>نظّم بيانات العملاء ووسائل التواصل والتفاصيل المالية في مكان واحد.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()">
        <span>＋</span> إضافة عميل جديد
      </button>
    </div>

    <div class="summary-strip">
      <div>
        <span class="summary-icon teal">◇</span>
        <div>
          <small>إجمالي العملاء</small><strong>{{ clients.length }}</strong>
        </div>
      </div>
      <div>
        <span class="summary-icon purple">◎</span>
        <div>
          <small>جهات الاتصال</small><strong>{{ contactsTotal }}</strong>
        </div>
      </div>
      <div>
        <span class="summary-icon orange">↗</span>
        <div>
          <small>روابط اجتماعية</small><strong>{{ linksTotal }}</strong>
        </div>
      </div>
      <div class="sync-status"><i></i> بيانات محدثة من مساحة العمل</div>
    </div>

    <div class="clients-card">
      <div class="card-heading">
        <div>
          <h3>
            كل العملاء <span>{{ clients.length }}</span>
          </h3>
          <p>بيانات الشركات ووسائل التواصل المرتبطة بها</p>
        </div>
        <div class="live-state"><i></i> محدث الآن</div>
      </div>
      <div class="table-responsive" tabindex="0" aria-label="جدول العملاء قابل للتمرير أفقيًا">
        <table class="clients-table" :aria-busy="loading">
          <thead>
            <tr>
              <th scope="col">العميل / الشركة</th>
              <th scope="col">التواصل الأساسي</th>
              <th scope="col">البيانات المالية</th>
              <th scope="col">جهات الاتصال</th>
              <th scope="col">السوشيال ميديا</th>
              <th scope="col">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="state-cell">
                <span class="spinner"></span> جارٍ تحميل البيانات...
              </td>
            </tr>
            <tr v-else-if="clients.length === 0">
              <td colspan="6" class="state-cell">لا يوجد عملاء مسجلون حاليًا</td>
            </tr>
            <tr v-for="client in clients" v-else :key="client.id">
              <td>
                <div class="client-cell">
                  <div class="client-avatar">{{ getInitials(client.name) }}</div>
                  <div>
                    <strong>{{ client.name }}</strong
                    ><span>عميل نشط</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="info-stack">
                  <!-- عرض الرقم الأساسي (أول رقم) -->
                  <div v-if="client.phones?.length" class="phone-actions">
                    <a class="phone-mini" :href="`tel:${client.phones[0].number}`" title="اتصال"
                      ><span>☎</span><b dir="ltr">{{ client.phones[0].number }}</b></a
                    >
                    <a
                      v-if="client.phones[0].has_whatsapp"
                      class="whatsapp-mini"
                      :href="whatsappUrl(client.phones[0].number)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح واتساب"
                      ><span>◉</span> واتساب</a
                    >
                  </div>
                  <!-- عرض الإيميل الأساسي (أول إيميل) -->
                  <span v-if="client.emails?.length">
                    ✉
                    <a
                      :href="`mailto:${client.emails[0]}`"
                      style="color: inherit; text-decoration: none"
                      >{{ client.emails[0] }}</a
                    >
                  </span>
                  <span v-if="!client.phones?.length && !client.emails?.length" class="muted"
                    >لا يوجد تواصل أساسي</span
                  >
                </div>
              </td>
              <td>
                <div class="info-stack financial">
                  <span v-if="client.bank_name"
                    >بنك: {{ client.bank_name }}
                    <small v-if="client.bank_account">({{ client.bank_account }})</small></span
                  >
                  <span v-if="client.instapay">Instapay: {{ client.instapay }}</span>
                  <span v-if="client.wallet">محفظة: {{ client.wallet }}</span>
                  <span
                    v-if="
                      !client.bank_account &&
                      !client.instapay &&
                      !client.wallet &&
                      !client.bank_name
                    "
                    class="muted"
                    >لا توجد بيانات</span
                  >
                </div>
              </td>
              <td>
                <div v-if="client.contacts?.length" class="contacts-preview">
                  <span v-for="contact in client.contacts.slice(0, 2)" :key="contact.id"
                    ><b>{{ contact.contact_name }}</b
                    ><small>{{ contact.contact_method }}</small></span
                  >
                  <em v-if="client.contacts.length > 2">+{{ client.contacts.length - 2 }}</em>
                </div>
                <span v-else class="muted">لم تتم الإضافة</span>
              </td>
              <td>
                <div v-if="client.social_links?.length" class="social-links">
                  <!-- عرض الروابط بأسمائها الجديدة -->
                  <a
                    v-for="(link, index) in client.social_links.slice(0, 3)"
                    :key="index"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    >{{ link.platform }} ↗</a
                  >
                </div>
                <span v-else class="muted">لا توجد روابط</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="action details"
                    type="button"
                    title="عرض التفاصيل"
                    aria-label="عرض تفاصيل العميل"
                    @click="openDetails(client)"
                  >
                    ⌁
                  </button>
                  <button
                    class="action edit"
                    type="button"
                    title="تعديل"
                    aria-label="تعديل بيانات العميل"
                    @click="openModal(client)"
                  >
                    ✎
                  </button>
                  <button
                    class="action delete"
                    type="button"
                    title="حذف العميل"
                    aria-label="حذف العميل"
                    @click="deleteClient(client.id)"
                  >
                    ⌫
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- نافذة إضافة / تعديل العميل -->
    <div v-if="showModal" class="modal-overlay" role="presentation" @click.self="closeModal">
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
          <!-- البيانات الأساسية -->
          <div class="form-section">
            <h4>البيانات الأساسية</h4>
            <div class="form-group mb-0">
              <label>اسم الشركة / العميل <i>*</i></label>
              <input v-model="form.name" type="text" placeholder="مثال: شركة أفق" required />
            </div>
          </div>

          <!-- الهواتف -->
          <div class="form-section">
            <div class="section-head">
              <h4>أرقام الهواتف</h4>
              <button type="button" class="outline-btn" @click="addPhone">＋ إضافة رقم</button>
            </div>
            <div v-for="(phone, index) in form.phones" :key="index" class="dynamic-row">
              <input
                v-model="phone.number"
                type="text"
                placeholder="01xxxxxxxx"
                required
                dir="ltr"
              />
              <label
                class="checkbox-label"
                style="
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  font-size: 10px;
                  color: #aeb6d7;
                  cursor: pointer;
                "
              >
                <input
                  type="checkbox"
                  v-model="phone.has_whatsapp"
                  style="width: auto; min-height: auto"
                />
                عليه واتساب؟
              </label>
              <button
                type="button"
                class="remove-btn"
                @click="removePhone(index)"
                title="حذف الرقم"
              >
                ×
              </button>
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
              <button
                type="button"
                class="remove-btn"
                @click="removeEmail(index)"
                title="حذف الإيميل"
              >
                ×
              </button>
            </div>
            <span v-if="!form.emails.length" class="empty-hint">لم يتم إضافة بريد إلكتروني.</span>
          </div>

          <!-- البيانات المالية -->
          <div class="form-section">
            <h4>البيانات المالية</h4>
            <div class="form-grid-3">
              <div class="form-group">
                <label>اسم البنك</label
                ><input v-model="form.bank_name" type="text" placeholder="مثال: CIB" />
              </div>
              <div class="form-group">
                <label>فرع البنك</label
                ><input v-model="form.bank_branch" type="text" placeholder="الفرع" />
              </div>
              <div class="form-group">
                <label>الحساب البنكي / IBAN</label
                ><input v-model="form.bank_account" type="text" placeholder="رقم الحساب" />
              </div>
              <div class="form-group">
                <label>عنوان Instapay</label
                ><input v-model="form.instapay" type="text" placeholder="@username" />
              </div>
              <div class="form-group">
                <label>رقم المحفظة</label
                ><input v-model="form.wallet" type="text" placeholder="رقم المحفظة" />
              </div>
            </div>
          </div>

          <!-- السوشيال ميديا -->
          <div class="form-section">
            <div class="section-head">
              <h4>روابط التواصل الاجتماعي (المنصات)</h4>
              <button type="button" class="outline-btn" @click="addSocialLink">
                ＋ إضافة منصة
              </button>
            </div>
            <div v-for="(link, index) in form.social_links" :key="'s' + index" class="dynamic-row">
              <input
                v-model="link.platform"
                type="text"
                placeholder="اسم المنصة"
                required
                style="flex: 1"
              />
              <input
                v-model="link.url"
                type="url"
                placeholder="https://..."
                required
                dir="ltr"
                style="flex: 2"
              />
              <button
                type="button"
                class="remove-btn"
                @click="removeSocialLink(index)"
                title="حذف المنصة"
              >
                ×
              </button>
            </div>
            <span v-if="!form.social_links.length" class="empty-hint"
              >لم يتم إضافة منصات تواصل.</span
            >
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
              <input
                v-model="contact.contact_details"
                type="text"
                placeholder="الرقم أو الإيميل"
                required
              />
              <button
                type="button"
                class="remove-btn"
                @click="removeContact(index)"
                title="حذف الشخص"
              >
                ×
              </button>
            </div>
            <span v-if="!form.contacts.length" class="empty-hint"
              >لم يتم إضافة جهات اتصال شخصية بعد.</span
            >
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

    <!-- نافذة عرض التفاصيل الكاملة -->
    <div
      v-if="selectedClient"
      class="details-overlay"
      role="presentation"
      @click.self="closeDetails"
    >
      <div
        ref="detailsModal"
        class="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-details-title"
      >
        <button class="modal-close" type="button" aria-label="إغلاق" @click="closeDetails">
          ×
        </button>
        <div class="details-hero">
          <div class="details-avatar">{{ getInitials(selectedClient.name) }}</div>
          <div>
            <span class="eyebrow">ملف العميل التفصيلي</span>
            <h3 id="client-details-title">{{ selectedClient.name }}</h3>
            <span class="client-status"><i></i> عميل نشط بجميع المنصات</span>
          </div>
        </div>

        <div class="details-grid">
          <!-- تفاصيل الهواتف والإيميلات -->
          <section class="details-section">
            <h4><span class="section-symbol teal-symbol">☎</span> أرقام التواصل والبريد</h4>
            <div class="contact-actions">
              <!-- عرض جميع الهواتف -->
              <div v-if="selectedClient.phones?.length">
                <a
                  v-for="(phone, idx) in selectedClient.phones"
                  :key="'p' + idx"
                  class="contact-card phone-card mb-2"
                  :href="`tel:${phone.number}`"
                >
                  <span class="contact-icon">☎</span>
                  <span
                    ><small
                      >هاتف {{ idx + 1 }} {{ phone.has_whatsapp ? '(يدعم واتساب)' : '' }}</small
                    ><strong dir="ltr">{{ phone.number }}</strong></span
                  >
                  <b>اتصال</b>
                </a>
              </div>

              <!-- عرض جميع الإيميلات -->
              <div v-if="selectedClient.emails?.length" class="emails-list mt-2">
                <div
                  v-for="(email, idx) in selectedClient.emails"
                  :key="'em' + idx"
                  class="email-row"
                >
                  <span>✉</span><a :href="`mailto:${email}`">{{ email }}</a>
                </div>
              </div>

              <div
                v-if="!selectedClient.phones?.length && !selectedClient.emails?.length"
                class="empty-detail"
              >
                لا توجد بيانات تواصل أساسية
              </div>
            </div>
          </section>

          <!-- التفاصيل المالية -->
          <section class="details-section">
            <h4><span class="section-symbol purple-symbol">◎</span> البيانات المالية</h4>
            <div class="finance-list">
              <div v-if="selectedClient.bank_name || selectedClient.bank_account">
                <small>البنك</small>
                <strong
                  >{{ selectedClient.bank_name || 'غير محدد' }}
                  {{ selectedClient.bank_branch ? `(${selectedClient.bank_branch})` : '' }}</strong
                >
                <strong v-if="selectedClient.bank_account" class="mt-1" style="color: #78e5da">{{
                  selectedClient.bank_account
                }}</strong>
              </div>
              <div v-if="selectedClient.instapay">
                <small>Instapay</small><strong>{{ selectedClient.instapay }}</strong>
              </div>
              <div v-if="selectedClient.wallet">
                <small>المحفظة</small><strong>{{ selectedClient.wallet }}</strong>
              </div>
              <span
                v-if="
                  !selectedClient.bank_account &&
                  !selectedClient.instapay &&
                  !selectedClient.wallet &&
                  !selectedClient.bank_name
                "
                class="empty-detail"
                >لا توجد بيانات مالية</span
              >
            </div>
          </section>
        </div>

        <section class="details-section full-detail">
          <h4><span class="section-symbol orange-symbol">◎</span> الأشخاص (جهات الاتصال)</h4>
          <div v-if="selectedClient.contacts?.length" class="full-contacts">
            <div v-for="contact in selectedClient.contacts" :key="contact.id" class="full-contact">
              <div class="mini-avatar">{{ getInitials(contact.contact_name) }}</div>
              <div>
                <strong>{{ contact.contact_name }}</strong>
                <small>{{ contact.contact_method }} · {{ contact.contact_details }}</small>
              </div>
              <a
                v-if="contact.contact_method === 'whatsapp' || contact.contact_method === 'phone'"
                :href="
                  contact.contact_method === 'whatsapp'
                    ? whatsappUrl(contact.contact_details)
                    : `tel:${contact.contact_details}`
                "
                target="_blank"
                rel="noopener noreferrer"
                class="mini-action"
              >
                {{ contact.contact_method === 'whatsapp' ? 'مراسلة' : 'اتصال' }}
              </a>
            </div>
          </div>
          <span v-else class="empty-detail">لم تتم إضافة جهات اتصال شخصية</span>
        </section>

        <section class="details-section full-detail">
          <div class="section-heading-row">
            <h4><span class="section-symbol purple-symbol">↗</span> منصات السوشيال ميديا</h4>
            <span class="links-count">{{ selectedClient.social_links?.length || 0 }} منصات</span>
          </div>
          <div v-if="selectedClient.social_links?.length" class="detail-links">
            <a
              v-for="(link, index) in selectedClient.social_links"
              :key="'sl' + index"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>↗</span>
              <strong>{{ link.platform }}</strong>
              <small>{{ link.url }}</small>
            </a>
          </div>
          <span v-else class="empty-detail">لا توجد منصات مسجلة</span>
        </section>

        <div class="detail-footer">
          <button class="secondary-btn" type="button" @click="closeDetails">إغلاق</button>
          <button class="primary-btn" type="button" @click="editSelectedClient">
            تعديل ملف العميل
          </button>
        </div>
      </div>
    </div>

    <transition name="toast"
      ><div v-if="toastMessage" class="toast-message" role="status" aria-live="polite">
        {{ toastMessage }}
      </div></transition
    >
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import api from '../axios'

const clients = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const selectedClient = ref(null)
const isEditing = ref(false)
const editId = ref(null)
const toastMessage = ref('')
const modalCloseButton = ref(null)
const detailsModal = ref(null)
let toastTimer = null

const form = reactive({
  name: '',
  phones: [], // مصفوفة { number, has_whatsapp }
  emails: [], // مصفوفة نصوص
  bank_name: '',
  bank_branch: '',
  bank_account: '',
  instapay: '',
  wallet: '',
  social_links: [], // مصفوفة { platform, url }
  contacts: [],
})

const contactsTotal = computed(() =>
  clients.value.reduce((total, client) => total + (client.contacts?.length || 0), 0),
)
const linksTotal = computed(() =>
  clients.value.reduce((total, client) => total + (client.social_links?.length || 0), 0),
)

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

const openDetails = async (client) => {
  selectedClient.value = client
  await nextTick()
  detailsModal.value?.focus({ preventScroll: true })
}
const closeDetails = () => {
  selectedClient.value = null
}
const editSelectedClient = () => {
  const client = selectedClient.value
  selectedClient.value = null
  openModal(client)
}

const whatsappUrl = (phone) => {
  const digits = String(phone || '')
    .replace(/[^0-9+]/g, '')
    .replace(/^00/, '+')
  const normalized = digits.startsWith('+')
    ? digits.slice(1)
    : digits.startsWith('0')
      ? `20${digits.slice(1)}`
      : digits
  return `https://wa.me/${normalized}`
}

const showToast = (message) => {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 3200)
}

const fetchClients = async () => {
  loading.value = true
  try {
    const response = await api.get('/clients')
    clients.value = response.data.data || response.data || []
  } catch (error) {
    showToast(error.response?.data?.message || 'تعذر تحميل العملاء')
  } finally {
    loading.value = false
  }
}

// دوال التحكم في المصفوفات (Dynamic Inputs)
const addPhone = () => form.phones.push({ number: '', has_whatsapp: false })
const removePhone = (index) => {
  if (window.confirm('هل أنت متأكد من حذف رقم الهاتف هذا؟')) {
    form.phones.splice(index, 1)
  }
}

const addEmail = () => form.emails.push('')
const removeEmail = (index) => {
  if (window.confirm('هل أنت متأكد من حذف البريد الإلكتروني هذا؟')) {
    form.emails.splice(index, 1)
  }
}

const addSocialLink = () => form.social_links.push({ platform: '', url: '' })
const removeSocialLink = (index) => {
  if (window.confirm('هل أنت متأكد من حذف هذا الرابط (المنصة)؟')) {
    form.social_links.splice(index, 1)
  }
}

const addContact = () =>
  form.contacts.push({ contact_name: '', contact_method: '', contact_details: '' })
const removeContact = (index) => {
  if (window.confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
    form.contacts.splice(index, 1)
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    phones: [],
    emails: [],
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    instapay: '',
    wallet: '',
    social_links: [],
    contacts: [],
  })
}

const openModal = (client) => {
  isEditing.value = Boolean(client)
  editId.value = client?.id || null
  if (client) {
    Object.assign(form, {
      name: client.name,
      phones: client.phones ? JSON.parse(JSON.stringify(client.phones)) : [],
      emails: client.emails ? [...client.emails] : [],
      bank_name: client.bank_name || '',
      bank_branch: client.bank_branch || '',
      bank_account: client.bank_account || '',
      instapay: client.instapay || '',
      wallet: client.wallet || '',
      social_links: client.social_links ? JSON.parse(JSON.stringify(client.social_links)) : [],
      contacts: client.contacts ? JSON.parse(JSON.stringify(client.contacts)) : [],
    })
  } else {
    resetForm()
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

watch([showModal, selectedClient], async ([modalOpen, detailsOpen]) => {
  document.body.classList.toggle('modal-is-open', modalOpen || Boolean(detailsOpen))
  if (modalOpen) {
    await nextTick()
    modalCloseButton.value?.focus({ preventScroll: true })
  }
})

const saveClient = async () => {
  saving.value = true
  try {
    // إرسال البيانات للباك إند، الـ Validation سيتكفل بالباقي
    if (isEditing.value) await api.put(`/clients/${editId.value}`, form)
    else await api.post('/clients', form)
    closeModal()
    showToast(isEditing.value ? 'تم تحديث بيانات العميل' : 'تم إنشاء العميل بنجاح')
    await fetchClients()
  } catch (error) {
    showToast(error.response?.data?.message || 'تأكد من إدخال البيانات بشكل صحيح')
  } finally {
    saving.value = false
  }
}

// تنبيه الحذف القوي
const deleteClient = async (id) => {
  const confirmMessage =
    '⚠️ تنبيه هام وحرج!\n\nهل أنت متأكد تماماً من رغبتك في حذف هذا العميل؟\n\n- سيتم حذف الشركة بالكامل.\n- سيتم حذف جميع وسائل التواصل والأشخاص المرتبطين.\n- لا يمكن التراجع عن هذه الخطوة أبداً!'
  if (!window.confirm(confirmMessage)) return

  try {
    await api.delete(`/clients/${id}`)
    showToast('تم حذف العميل وجميع بياناته بنجاح')
    await fetchClients()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}

onMounted(fetchClients)

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  document.body.classList.remove('modal-is-open')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}
:global(body) {
  margin: 0;
  font-family: 'Cairo', sans-serif;
}
:global(body.modal-is-open) {
  overflow: hidden;
}

.clients-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}
.page-intro {
  min-width: 0;
}
.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
.eyebrow {
  display: inline-block;
  color: #76e8de;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: 0.35px;
}
.page-topline h2 {
  margin: 8px 0 5px;
  color: #f5f6ff;
  font-size: clamp(26px, 2.5vw, 32px);
  line-height: 1.25;
  font-weight: 800;
}
.page-topline p {
  max-width: 720px;
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
}

.primary-btn,
.secondary-btn {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 19px;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}
.primary-btn {
  flex: 0 0 auto;
  border: 0;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  box-shadow: 0 9px 22px rgba(111, 222, 211, 0.13);
}
.primary-btn span {
  font-size: 22px;
  line-height: 0;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.06);
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(210px, 1.35fr);
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(137, 153, 226, 0.13);
  border-radius: 15px;
  background: rgba(137, 153, 226, 0.13);
}
.summary-strip > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(21, 29, 73, 0.68);
}
.summary-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 19px;
}
.teal {
  color: #7de8dc;
  background: rgba(93, 222, 209, 0.12);
}
.purple {
  color: #c994ff;
  background: rgba(180, 112, 255, 0.12);
}
.orange {
  color: #ffc480;
  background: rgba(255, 186, 86, 0.12);
}
.summary-strip small,
.summary-strip strong {
  display: block;
}
.summary-strip small {
  color: #929dc8;
  font-size: 12px;
  line-height: 1.5;
}
.summary-strip strong {
  margin-top: 2px;
  color: #eef0ff;
  font-size: 24px;
  line-height: 1.2;
}
.sync-status {
  justify-content: center;
  color: #8995c2;
  font-size: 12px;
  line-height: 1.5;
}
.sync-status i,
.live-state i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #72e5d9;
  box-shadow: 0 0 8px #72e5d9;
}

.clients-card {
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, 0.13);
  border-radius: 18px;
  background: rgba(15, 22, 61, 0.65);
  box-shadow: 0 18px 45px rgba(2, 6, 25, 0.12);
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
}
.card-heading h3 {
  margin: 0;
  color: #f0f2ff;
  font-size: 19px;
  line-height: 1.4;
}
.card-heading h3 span {
  display: inline-block;
  margin-right: 7px;
  padding: 3px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, 0.11);
  font-size: 12px;
  vertical-align: middle;
}
.card-heading p {
  margin: 5px 0 0;
  color: #8691bf;
  font-size: 13px;
  line-height: 1.6;
}
.live-state {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  color: #8995c2;
  font-size: 12px;
  white-space: nowrap;
}
.table-responsive {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}
.clients-table {
  width: 100%;
  min-width: 1040px;
  border-collapse: collapse;
  text-align: right;
}
.clients-table th,
.clients-table td {
  padding: 16px 20px;
  border-top: 1px solid rgba(138, 152, 222, 0.09);
  vertical-align: middle;
}
.clients-table th {
  color: #8792be;
  background: rgba(10, 16, 47, 0.35);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  white-space: nowrap;
}
.clients-table td {
  color: #d9ddf5;
  font-size: 14px;
  line-height: 1.6;
}
.client-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 180px;
}
.client-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 13px;
  font-weight: 800;
}
.client-cell > div:last-child {
  min-width: 0;
}
.client-cell strong,
.client-cell span {
  display: block;
}
.client-cell strong {
  overflow: hidden;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-cell span {
  margin-top: 3px;
  color: #8995c2;
  font-size: 13px;
}
.info-stack {
  display: grid;
  gap: 7px;
  color: #aeb6d7;
  font-size: 13px;
}
.phone-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.phone-mini,
.whatsapp-mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 8px;
  border-radius: 7px;
  text-decoration: none;
  font-size: 12px;
}
.phone-mini {
  color: #7de8dc;
  background: rgba(90, 220, 207, 0.08);
}
.phone-mini span {
  font-size: 15px;
}
.whatsapp-mini {
  border: 1px solid rgba(44, 211, 101, 0.28);
  color: #78f0a4;
  background: rgba(32, 189, 92, 0.1);
}
.whatsapp-mini span {
  font-size: 14px;
  color: #27d866;
}
.financial {
  color: #a9a6d8;
}
.muted,
.empty-hint,
.empty-detail {
  color: #8995c1;
  font-size: 13px;
}
.contacts-preview {
  display: grid;
  gap: 6px;
  min-width: 150px;
}
.contacts-preview span {
  display: flex;
  align-items: center;
  gap: 6px;
}
.contacts-preview b {
  font-size: 13px;
}
.contacts-preview small {
  color: #8995c1;
  font-size: 12px;
}
.contacts-preview em {
  color: #c491ff;
  font-size: 11px;
  font-style: normal;
}
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 180px;
}
.social-links a {
  padding: 5px 8px;
  border: 1px solid rgba(119, 229, 217, 0.17);
  border-radius: 7px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.07);
  text-decoration: none;
  font-size: 12px;
  transition: 0.2s;
}
.social-links a:hover {
  color: #d09aff;
  border-color: rgba(180, 112, 255, 0.3);
  background: rgba(180, 112, 255, 0.1);
}
.actions-cell {
  display: flex;
  gap: 8px;
}
.action {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  transition: 0.2s;
}
.action.details {
  color: #c491ff;
  background: rgba(180, 112, 255, 0.1);
}
.action.edit {
  color: #78e4da;
  background: rgba(92, 220, 208, 0.08);
}
.action.delete {
  color: #ff94ab;
  background: rgba(255, 103, 139, 0.08);
}
.action:hover {
  filter: brightness(1.3);
  transform: translateY(-1px);
}
.state-cell {
  height: 160px;
  color: #8e99c3 !important;
  text-align: center !important;
  font-size: 14px !important;
}
.spinner {
  width: 18px;
  height: 18px;
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
  border: 2px solid rgba(125, 232, 220, 0.25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.modal-overlay,
.details-overlay {
  position: fixed;
  inset: 82px 0 0;
  z-index: 100;
  display: grid;
  place-items: start center;
  padding: 20px;
  overflow-y: auto;
  background: rgba(4, 7, 27, 0.8);
  backdrop-filter: blur(8px);
}
.details-overlay {
  z-index: 110;
}
.modal-content,
.details-modal {
  width: min(850px, 100%);
  max-height: calc(100vh - 122px);
  overflow-y: auto;
  position: relative;
  padding: 30px;
  border: 1px solid rgba(146, 160, 233, 0.2);
  border-radius: 20px;
  background: linear-gradient(145deg, #171d52, #0d143a);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
}
.details-modal {
  width: min(700px, 100%);
  border-radius: 22px;
}
.modal-close {
  position: absolute;
  top: 10px;
  left: 12px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: #a3add1;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}
.modal-close:hover {
  color: #ff9bad;
}
.modal-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
  border-radius: 13px;
  color: #202057;
  background: linear-gradient(145deg, #80e8df, #b486fb);
  font-size: 24px;
}
.modal-content h3 {
  margin: 8px 0 4px;
  color: #f3f4ff;
  font-size: 24px;
  line-height: 1.35;
}
.client-form {
  margin-top: 25px;
}
.form-section {
  margin-bottom: 17px;
  padding: 16px;
  border: 1px solid rgba(140, 155, 226, 0.13);
  border-radius: 13px;
  background: rgba(6, 11, 37, 0.2);
}
.form-section h4 {
  margin: 0 0 14px;
  color: #c293ff;
  font-size: 16px;
  line-height: 1.5;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}
.section-head h4 {
  margin: 0;
}
.form-grid-3 {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.form-group {
  min-width: 0;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #c7cde8;
  font-size: 14px !important;
  line-height: 1.5;
  font-weight: 600;
}
.form-group label i {
  color: #ff9bad;
  font-style: normal;
}
.form-group input,
.form-group select,
.dynamic-row input,
.contact-row input,
.contact-row select {
  width: 100%;
  min-height: 48px;
  padding: 0 13px;
  border: 1px solid rgba(145, 160, 230, 0.2);
  border-radius: 10px;
  outline: 0;
  color: #eef0ff;
  background: rgba(6, 11, 37, 0.46);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
  transition: 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.dynamic-row input:focus,
.contact-row input:focus,
.contact-row select:focus {
  border-color: #76e8de;
  box-shadow: 0 0 0 3px rgba(118, 232, 222, 0.1);
}
.form-group input::placeholder,
.dynamic-row input::placeholder,
.contact-row input::placeholder {
  color: #7783ad;
  opacity: 1;
}
.outline-btn {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(119, 229, 217, 0.25);
  border-radius: 8px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.07);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dynamic-row,
.contact-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 9px;
}
.checkbox-label {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #aeb6d7;
  font-size: 13px !important;
  white-space: nowrap;
}
.checkbox-label input {
  width: 18px !important;
  min-height: 18px !important;
  accent-color: #76e8de;
}
.remove-btn {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border: 1px solid rgba(255, 113, 145, 0.18);
  border-radius: 8px;
  color: #ff94ab;
  background: rgba(255, 103, 139, 0.08);
  font-size: 20px;
  cursor: pointer;
}
.empty-hint {
  display: block;
  margin-top: 5px;
}
.modal-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 20px;
}

.details-hero {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 21px;
  border-bottom: 1px solid rgba(143, 157, 226, 0.14);
}
.details-avatar {
  width: 62px;
  height: 62px;
  flex: 0 0 62px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 20px;
  font-weight: 800;
}
.details-hero > div:last-child {
  min-width: 0;
}
.details-hero h3 {
  overflow: hidden;
  margin: 6px 0 3px;
  font-size: 25px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #78e4d8;
  font-size: 13px;
}
.client-status i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #70e1d5;
  box-shadow: 0 0 8px #70e1d5;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 19px;
}
.details-section {
  min-width: 0;
  padding: 17px;
  border: 1px solid rgba(140, 155, 226, 0.13);
  border-radius: 14px;
  background: rgba(6, 11, 37, 0.2);
}
.details-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: #dfe3fa;
  font-size: 15px;
  line-height: 1.5;
}
.section-symbol {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 15px;
}
.teal-symbol {
  color: #78e5da;
  background: rgba(90, 220, 207, 0.1);
}
.purple-symbol {
  color: #c491ff;
  background: rgba(180, 112, 255, 0.1);
}
.orange-symbol {
  color: #ffc480;
  background: rgba(255, 186, 86, 0.1);
}
.contact-actions {
  display: grid;
  gap: 8px;
}
.contact-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #edf0ff;
  text-decoration: none;
  transition: 0.2s;
}
.contact-card span:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.contact-card small,
.contact-card strong {
  display: block;
}
.contact-card small {
  color: #8190bd;
  font-size: 12px;
}
.contact-card strong {
  overflow: hidden;
  margin-top: 3px;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-card b {
  padding: 5px 8px;
  border-radius: 6px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.12);
  font-size: 12px;
  white-space: nowrap;
}
.contact-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 17px;
}
.phone-card {
  border-color: rgba(118, 229, 217, 0.15);
  background: rgba(90, 220, 207, 0.06);
}
.phone-card .contact-icon {
  color: #17204e;
  background: #78e5da;
}
.contact-card:hover {
  transform: translateY(-1px);
  filter: brightness(1.15);
}
.email-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  color: #c491ff;
  font-size: 14px;
}
.email-row a {
  overflow: hidden;
  color: #c491ff;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.finance-list {
  display: grid;
  gap: 11px;
}
.finance-list div {
  padding-bottom: 9px;
  border-bottom: 1px solid rgba(143, 157, 226, 0.1);
}
.finance-list div:last-child {
  border: 0;
}
.finance-list small,
.finance-list strong {
  display: block;
}
.finance-list small {
  color: #8995c1;
  font-size: 12px;
}
.finance-list strong {
  margin-top: 3px;
  color: #d9ddf5;
  font-size: 14px;
  line-height: 1.5;
}
.full-detail {
  margin-top: 15px;
}
.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.section-heading-row h4 {
  margin-bottom: 0;
}
.links-count {
  color: #7de8dc;
  font-size: 12px;
}
.full-contacts {
  display: grid;
  gap: 8px;
}
.full-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 9px;
  background: rgba(8, 14, 45, 0.42);
}
.mini-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #241d55;
  background: linear-gradient(145deg, #80e8df, #ad84fa);
  font-size: 11px;
  font-weight: 800;
}
.full-contact > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.full-contact strong,
.full-contact small {
  display: block;
}
.full-contact strong {
  font-size: 13px;
}
.full-contact small {
  overflow: hidden;
  margin-top: 3px;
  color: #8995c1;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-action {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border-radius: 7px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.09);
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
}
.detail-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-top: 13px;
}
.detail-links a {
  display: block;
  min-width: 0;
  padding: 12px;
  border: 1px solid rgba(180, 112, 255, 0.17);
  border-radius: 9px;
  color: #d9ddf5;
  background: rgba(180, 112, 255, 0.06);
  text-decoration: none;
}
.detail-links span {
  float: left;
  color: #c491ff;
}
.detail-links strong,
.detail-links small {
  display: block;
}
.detail-links strong {
  font-size: 13px;
  margin-bottom: 5px;
}
.detail-links small {
  overflow: hidden;
  color: #8995c1;
  direction: ltr;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}
.detail-footer {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 20px;
}
.toast-message {
  position: fixed;
  left: max(20px, env(safe-area-inset-left));
  bottom: max(20px, env(safe-area-inset-bottom));
  z-index: 200;
  max-width: min(420px, calc(100vw - 40px));
  padding: 14px 18px;
  border: 1px solid rgba(116, 232, 220, 0.22);
  border-radius: 10px;
  color: #c8faf5;
  background: #182552;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  line-height: 1.6;
}

.modal-close:focus-visible,
.primary-btn:focus-visible,
.secondary-btn:focus-visible,
.outline-btn:focus-visible,
.action:focus-visible,
.contact-btn:focus-visible,
.remove-btn:focus-visible,
.mini-action:focus-visible,
.table-responsive:focus-visible,
.form-group input:focus-visible,
.form-group select:focus-visible,
.dynamic-row input:focus-visible,
.contact-row input:focus-visible,
.contact-row select:focus-visible {
  outline: 2px solid #79e6db;
  outline-offset: 2px;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1050px) {
  .summary-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .sync-status {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  .form-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .page-topline {
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
  }
  .page-topline h2 {
    font-size: clamp(25px, 8vw, 30px);
  }
  .primary-btn {
    width: 100%;
  }
  .summary-strip {
    grid-template-columns: 1fr 1fr;
  }
  .sync-status {
    grid-column: 1 / -1;
  }
  .card-heading {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px 15px 17px;
  }
  .clients-table th,
  .clients-table td {
    padding-right: 14px;
    padding-left: 14px;
  }
  .modal-overlay,
  .details-overlay {
    inset: 70px 0 0;
    padding: 12px;
  }
  .modal-content,
  .details-modal {
    max-height: calc(100dvh - 82px);
    padding: 25px 18px 20px;
    border-radius: 16px;
  }
  .form-grid-3,
  .details-grid,
  .detail-links {
    grid-template-columns: 1fr;
  }
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .outline-btn {
    width: 100%;
  }
  .dynamic-row,
  .contact-row {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .dynamic-row > input {
    flex: 1 1 70%;
  }
  .dynamic-row .checkbox-label {
    flex: 1 1 auto;
  }
  .contact-row input,
  .contact-row select {
    flex: 1 1 42%;
  }
  .contact-row .remove-btn {
    align-self: center;
  }
  .modal-actions,
  .detail-footer {
    flex-direction: column-reverse;
  }
  .modal-actions .primary-btn,
  .modal-actions .secondary-btn,
  .detail-footer .primary-btn,
  .detail-footer .secondary-btn {
    width: 100%;
  }
  .details-hero h3 {
    font-size: 22px;
  }
}

@media (max-width: 390px) {
  .summary-strip {
    grid-template-columns: 1fr;
  }
  .sync-status {
    grid-column: auto;
  }
  .summary-strip > div {
    padding: 14px;
  }
  .summary-strip small {
    font-size: 11px;
  }
  .clients-table th,
  .clients-table td {
    padding-right: 12px;
    padding-left: 12px;
  }
  .modal-content,
  .details-modal {
    padding-inline: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn,
  .secondary-btn,
  .action,
  .contact-card,
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
  .spinner {
    animation-duration: 1.5s;
  }
}
</style>
