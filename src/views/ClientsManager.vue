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
      <div class="table-responsive">
        <table class="clients-table">
          <thead>
            <tr>
              <th>العميل / الشركة</th>
              <th>التواصل الأساسي</th>
              <th>البيانات المالية</th>
              <th>جهات الاتصال</th>
              <th>السوشيال ميديا</th>
              <th>إجراءات</th>
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
                  <div v-if="client.phone" class="phone-actions">
                    <a class="phone-mini" :href="`tel:${client.phone}`" title="اتصال"
                      ><span>☎</span><b dir="ltr">{{ client.phone }}</b></a
                    ><a
                      class="whatsapp-mini"
                      :href="whatsappUrl(client.phone)"
                      target="_blank"
                      rel="noopener"
                      title="فتح واتساب"
                      ><span>◉</span> واتساب</a
                    >
                  </div>
                  <span v-if="client.email">
                    ✉
                    <a
                      :href="`mailto:${client.email}`"
                      style="color: inherit; text-decoration: none"
                    >
                      {{ client.email }}
                    </a>
                  </span>
                </div>
              </td>
              <td>
                <div class="info-stack financial">
                  <span v-if="client.bank_account">بنك: {{ client.bank_account }}</span
                  ><span v-if="client.instapay">Instapay: {{ client.instapay }}</span
                  ><span v-if="client.wallet">محفظة: {{ client.wallet }}</span
                  ><span
                    v-if="!client.bank_account && !client.instapay && !client.wallet"
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
                  ><em v-if="client.contacts.length > 2">+{{ client.contacts.length - 2 }}</em>
                </div>
                <span v-else class="muted">لم تتم الإضافة</span>
              </td>
              <td>
                <div v-if="client.social_links?.length" class="social-links">
                  <a
                    v-for="(link, index) in client.social_links.slice(0, 3)"
                    :key="index"
                    :href="link"
                    target="_blank"
                    rel="noopener"
                    >رابط {{ index + 1 }} ↗</a
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
                    @click="openDetails(client)"
                  >
                    ⌁</button
                  ><button
                    class="action edit"
                    type="button"
                    title="تعديل"
                    @click="openModal(client)"
                  >
                    ✎</button
                  ><button
                    class="action delete"
                    type="button"
                    title="حذف"
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

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" aria-label="إغلاق" @click="closeModal">×</button>
        <div class="modal-icon">◇</div>
        <span class="eyebrow">ملف العميل</span>
        <h3 id="modal-title">{{ isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد' }}</h3>
        <p>أدخل البيانات الأساسية ووسائل التواصل الخاصة بالشركة.</p>
        <form class="client-form" @submit.prevent="saveClient">
          <div class="form-section">
            <h4>البيانات الأساسية</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>اسم الشركة / العميل <i>*</i></label
                ><input v-model="form.name" type="text" placeholder="مثال: شركة أفق" required />
              </div>
              <div class="form-group">
                <label>رقم الهاتف الأساسي</label
                ><input v-model="form.phone" type="text" placeholder="05xxxxxxxx" />
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني</label
                ><input v-model="form.email" type="email" placeholder="name@company.com" />
              </div>
            </div>
          </div>
          <div class="form-section">
            <h4>البيانات المالية</h4>
            <div class="form-grid-3">
              <div class="form-group">
                <label>الحساب البنكي</label
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
          <div class="form-section">
            <div class="section-head">
              <h4>روابط التواصل الاجتماعي</h4>
              <button type="button" class="outline-btn" @click="addSocialLink">
                ＋ إضافة رابط
              </button>
            </div>
            <div v-for="(link, index) in form.social_links" :key="index" class="dynamic-row">
              <input
                v-model="form.social_links[index]"
                type="url"
                placeholder="https://..."
                required
              /><button type="button" class="remove-btn" @click="removeSocialLink(index)">×</button>
            </div>
            <span v-if="!form.social_links.length" class="empty-hint">لم يتم إضافة روابط بعد.</span>
          </div>
          <div class="form-section">
            <div class="section-head">
              <h4>الأشخاص وجهات الاتصال</h4>
              <button type="button" class="outline-btn" @click="addContact">＋ إضافة شخص</button>
            </div>
            <div v-for="(contact, index) in form.contacts" :key="index" class="contact-row">
              <input
                v-model="contact.contact_name"
                type="text"
                placeholder="اسم الشخص"
                required
              /><select v-model="contact.contact_method" required>
                <option value="" disabled>طريقة التواصل</option>
                <option value="واتساب">واتساب</option>
                <option value="اتصال هاتفي">اتصال هاتفي</option>
                <option value="إيميل">إيميل</option>
                <option value="تليجرام">تليجرام</option>
                <option value="أخرى">أخرى</option></select
              ><input
                v-model="contact.contact_details"
                type="text"
                placeholder="الرقم أو الإيميل"
                required
              /><button type="button" class="remove-btn" @click="removeContact(index)">×</button>
            </div>
            <span v-if="!form.contacts.length" class="empty-hint"
              >لم يتم إضافة جهات اتصال بعد.</span
            >
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeModal">إلغاء</button
            ><button type="submit" class="primary-btn" :disabled="saving">
              {{ saving ? 'جارٍ الحفظ...' : 'حفظ البيانات' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="selectedClient" class="details-overlay" @click.self="selectedClient = null">
      <div
        class="details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-details-title"
      >
        <button class="modal-close" type="button" aria-label="إغلاق" @click="selectedClient = null">
          ×
        </button>
        <div class="details-hero">
          <div class="details-avatar">{{ getInitials(selectedClient.name) }}</div>
          <div>
            <span class="eyebrow">ملف العميل</span>
            <h3 id="client-details-title">{{ selectedClient.name }}</h3>
            <span class="client-status"><i></i> عميل نشط</span>
          </div>
        </div>
        <div class="details-grid">
          <section class="details-section">
            <h4><span class="section-symbol teal-symbol">☎</span> بيانات التواصل</h4>
            <div class="contact-actions">
              <a
                v-if="selectedClient.phone"
                class="contact-card phone-card"
                :href="`tel:${selectedClient.phone}`"
                ><span class="contact-icon">☎</span
                ><span
                  ><small>اتصال هاتفي</small
                  ><strong dir="ltr">{{ selectedClient.phone }}</strong></span
                ><b>اتصال</b></a
              ><a
                v-if="selectedClient.phone"
                class="contact-card whatsapp-card"
                :href="whatsappUrl(selectedClient.phone)"
                target="_blank"
                rel="noopener"
                ><span class="contact-icon whatsapp-icon">◉</span
                ><span><small>واتساب</small><strong>فتح محادثة واتساب</strong></span
                ><b>مراسلة</b></a
              >
              <div v-if="!selectedClient.phone && !selectedClient.email" class="empty-detail">
                لا توجد بيانات تواصل
              </div>
              <div v-if="selectedClient.email" class="email-row">
                <span>✉</span
                ><a :href="`mailto:${selectedClient.email}`">{{ selectedClient.email }}</a>
              </div>
            </div>
          </section>
          <section class="details-section">
            <h4><span class="section-symbol purple-symbol">◎</span> البيانات المالية</h4>
            <div class="finance-list">
              <div v-if="selectedClient.bank_account">
                <small>الحساب البنكي</small><strong>{{ selectedClient.bank_account }}</strong>
              </div>
              <div v-if="selectedClient.instapay">
                <small>Instapay</small><strong>{{ selectedClient.instapay }}</strong>
              </div>
              <div v-if="selectedClient.wallet">
                <small>المحفظة</small><strong>{{ selectedClient.wallet }}</strong>
              </div>
              <span
                v-if="
                  !selectedClient.bank_account && !selectedClient.instapay && !selectedClient.wallet
                "
                class="empty-detail"
                >لا توجد بيانات مالية</span
              >
            </div>
          </section>
        </div>
        <section class="details-section full-detail">
          <h4><span class="section-symbol orange-symbol">◎</span> جهات الاتصال</h4>
          <div v-if="selectedClient.contacts?.length" class="full-contacts">
            <div v-for="contact in selectedClient.contacts" :key="contact.id" class="full-contact">
              <div class="mini-avatar">{{ getInitials(contact.contact_name) }}</div>
              <div>
                <strong>{{ contact.contact_name }}</strong
                ><small>{{ contact.contact_method }} · {{ contact.contact_details }}</small>
              </div>
              <a
                v-if="
                  contact.contact_method === 'واتساب' || contact.contact_method === 'اتصال هاتفي'
                "
                :href="
                  contact.contact_method === 'واتساب'
                    ? whatsappUrl(contact.contact_details)
                    : `tel:${contact.contact_details}`
                "
                target="_blank"
                rel="noopener"
                class="mini-action"
                >{{ contact.contact_method === 'واتساب' ? 'واتساب' : 'اتصال' }}</a
              >
            </div>
          </div>
          <span v-else class="empty-detail">لم تتم إضافة جهات اتصال</span>
        </section>
        <section class="details-section full-detail">
          <div class="section-heading-row">
            <h4><span class="section-symbol purple-symbol">↗</span> روابط السوشيال ميديا</h4>
            <span class="links-count">{{ selectedClient.social_links?.length || 0 }} روابط</span>
          </div>
          <div v-if="selectedClient.social_links?.length" class="detail-links">
            <a
              v-for="(link, index) in selectedClient.social_links"
              :key="index"
              :href="link"
              target="_blank"
              rel="noopener"
              ><span>↗</span><strong>رابط التواصل {{ index + 1 }}</strong
              ><small>{{ link }}</small></a
            >
          </div>
          <span v-else class="empty-detail">لا توجد روابط اجتماعية</span>
        </section>
        <div class="detail-footer">
          <button class="secondary-btn" type="button" @click="selectedClient = null">إغلاق</button
          ><button class="primary-btn" type="button" @click="editSelectedClient">
            تعديل بيانات العميل
          </button>
        </div>
      </div>
    </div>
    <transition name="toast"
      ><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition
    >
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../axios'
const clients = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const selectedClient = ref(null)
const isEditing = ref(false)
const editId = ref(null)
const toastMessage = ref('')
const form = reactive({
  name: '',
  phone: '',
  email: '',
  bank_account: '',
  instapay: '',
  wallet: '',
  social_links: [],
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
const openDetails = (client) => {
  selectedClient.value = client
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
  setTimeout(() => {
    toastMessage.value = ''
  }, 3200)
}
const fetchClients = async () => {
  loading.value = true
  try {
    const response = await api.get('/clients')
    clients.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    showToast(error.response?.data?.message || 'تعذر تحميل العملاء')
  } finally {
    loading.value = false
  }
}
const addSocialLink = () => form.social_links.push('')
const removeSocialLink = (index) => form.social_links.splice(index, 1)
const addContact = () =>
  form.contacts.push({ contact_name: '', contact_method: '', contact_details: '' })
const removeContact = (index) => form.contacts.splice(index, 1)
const resetForm = () =>
  Object.assign(form, {
    name: '',
    phone: '',
    email: '',
    bank_account: '',
    instapay: '',
    wallet: '',
    social_links: [],
    contacts: [],
  })
const openModal = (client) => {
  isEditing.value = Boolean(client)
  editId.value = client?.id || null
  if (client)
    Object.assign(form, {
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      bank_account: client.bank_account || '',
      instapay: client.instapay || '',
      wallet: client.wallet || '',
      social_links: [...(client.social_links || [])],
      contacts: JSON.parse(JSON.stringify(client.contacts || [])),
    })
  else resetForm()
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
}
const saveClient = async () => {
  saving.value = true
  try {
    if (isEditing.value) await api.put(`/clients/${editId.value}`, form)
    else await api.post('/clients', form)
    closeModal()
    showToast(isEditing.value ? 'تم تحديث بيانات العميل' : 'تم إنشاء العميل بنجاح')
    await fetchClients()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ')
  } finally {
    saving.value = false
  }
}
const deleteClient = async (id) => {
  if (!window.confirm('هل أنت متأكد من حذف هذا العميل وجميع بياناته؟')) return
  try {
    await api.delete(`/clients/${id}`)
    showToast('تم حذف العميل بنجاح')
    await fetchClients()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}
onMounted(fetchClients)
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
.clients-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}
.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}
.eyebrow {
  color: #76e8de;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
}
.page-topline h2 {
  margin: 7px 0 3px;
  font-size: 28px;
}
.page-topline p {
  margin: 0;
  color: #818cb9;
  font-size: 12px;
}
.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 43px;
  padding: 0 17px;
  border: 0;
  border-radius: 11px;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 9px 22px rgba(111, 222, 211, 0.13);
  transition: 0.2s;
}
.primary-btn span {
  font-size: 20px;
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
  grid-template-columns: repeat(3, 1fr) 1.7fr;
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(137, 153, 226, 0.13);
  border-radius: 15px;
  background: rgba(137, 153, 226, 0.13);
}
.summary-strip > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 17px;
  background: rgba(21, 29, 73, 0.68);
}
.summary-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-size: 16px;
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
  color: #7c87b5;
  font-size: 9px;
}
.summary-strip strong {
  color: #eef0ff;
  font-size: 20px;
}
.sync-status {
  justify-content: center;
  color: #7480ae;
  font-size: 9px;
}
.sync-status i,
.live-state i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #72e5d9;
  box-shadow: 0 0 8px #72e5d9;
}
.clients-card {
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, 0.13);
  border-radius: 18px;
  background: rgba(15, 22, 61, 0.65);
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 23px 17px;
}
.card-heading h3 {
  margin: 0;
  font-size: 15px;
}
.card-heading h3 span {
  margin-right: 6px;
  padding: 2px 7px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, 0.11);
  font-size: 9px;
}
.card-heading p {
  margin: 4px 0 0;
  color: #6e79a9;
  font-size: 10px;
}
.live-state {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7180ae;
  font-size: 9px;
}
.table-responsive {
  overflow-x: auto;
}
.clients-table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
  text-align: right;
}
.clients-table th,
.clients-table td {
  padding: 14px 20px;
  border-top: 1px solid rgba(138, 152, 222, 0.09);
  vertical-align: middle;
}
.clients-table th {
  color: #6874a6;
  background: rgba(10, 16, 47, 0.35);
  font-size: 9px;
  font-weight: 600;
}
.clients-table td {
  color: #d9ddf5;
  font-size: 10px;
}
.client-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}
.client-avatar {
  width: 33px;
  height: 33px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 9px;
  font-weight: 800;
}
.client-cell strong,
.client-cell span {
  display: block;
}
.client-cell strong {
  font-size: 11px;
}
.client-cell span {
  color: #7782b0;
  font-size: 8px;
}
.info-stack {
  display: grid;
  gap: 5px;
  color: #aeb6d7;
  font-size: 10px;
}
.info-stack b {
  color: #aeb6d7;
  font-weight: 500;
}
.phone-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}
.phone-mini,
.whatsapp-mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 9px;
}
.phone-mini {
  color: #7de8dc;
  background: rgba(90, 220, 207, 0.08);
}
.phone-mini span {
  font-size: 13px;
}
.whatsapp-mini {
  border: 1px solid rgba(44, 211, 101, 0.28);
  color: #78f0a4;
  background: rgba(32, 189, 92, 0.1);
}
.whatsapp-mini span {
  font-size: 12px;
  color: #27d866;
}
.financial {
  color: #9d9bd0;
}
.muted,
.empty-hint {
  color: #7782b0;
  font-size: 9px;
}
.contacts-preview {
  display: grid;
  gap: 4px;
}
.contacts-preview span {
  display: flex;
  align-items: center;
  gap: 5px;
}
.contacts-preview b {
  font-size: 9px;
}
.contacts-preview small {
  color: #7782b0;
  font-size: 8px;
}
.contacts-preview em {
  color: #c491ff;
  font-size: 8px;
  font-style: normal;
}
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 130px;
}
.social-links a {
  padding: 4px 6px;
  border: 1px solid rgba(119, 229, 217, 0.17);
  border-radius: 6px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.07);
  text-decoration: none;
  font-size: 8px;
}
.social-links a:hover {
  color: #d09aff;
}
.actions-cell {
  display: flex;
  gap: 6px;
}
.action {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
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
  height: 150px;
  color: #7d89b6 !important;
  text-align: center !important;
}
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  vertical-align: middle;
  border: 2px solid rgba(125, 232, 220, 0.25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.modal-overlay {
  position: fixed;
  inset: 82px 0 0;
  z-index: 100;
  display: grid;
  place-items: start center;
  padding: 18px;
  overflow-y: auto;
  background: rgba(4, 7, 27, 0.78);
  backdrop-filter: blur(7px);
}
.modal-content {
  width: min(850px, 100%);
  max-height: calc(100vh - 118px);
  overflow-y: auto;
  position: relative;
  padding: 28px;
  border: 1px solid rgba(146, 160, 233, 0.2);
  border-radius: 20px;
  background: linear-gradient(145deg, #171d52, #0d143a);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
}
.modal-close {
  position: absolute;
  top: 12px;
  left: 16px;
  border: 0;
  color: #8994c2;
  background: transparent;
  font-size: 25px;
  cursor: pointer;
}
.modal-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 12px;
  color: #202057;
  background: linear-gradient(145deg, #80e8df, #b486fb);
  font-size: 21px;
}
.modal-content h3 {
  margin: 7px 0 2px;
  font-size: 21px;
}
.modal-content > p {
  margin: 0;
  color: #818cb9;
  font-size: 11px;
}
.client-form {
  margin-top: 23px;
}
.form-section {
  margin-bottom: 15px;
  padding: 14px;
  border: 1px solid rgba(140, 155, 226, 0.13);
  border-radius: 12px;
  background: rgba(6, 11, 37, 0.2);
}
.form-section h4 {
  margin: 0 0 13px;
  color: #b986ff;
  font-size: 11px;
}
.form-grid,
.form-grid-3 {
  display: grid;
  gap: 13px;
}
.form-grid {
  grid-template-columns: repeat(3, 1fr);
}
.form-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}
.form-group {
  min-width: 0;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #b8c0e2;
  font-size: 10px;
}
.form-group label i {
  color: #ff9bad;
  font-style: normal;
}
.form-group input,
.form-group select,
.form-group textarea,
.dynamic-row input,
.contact-row input,
.contact-row select {
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border: 1px solid rgba(145, 160, 230, 0.2);
  border-radius: 8px;
  outline: 0;
  color: #eef0ff;
  background: rgba(6, 11, 37, 0.46);
  font: inherit;
  font-size: 10px;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus,
.dynamic-row input:focus,
.contact-row input:focus,
.contact-row select:focus {
  border-color: #76e8de;
  box-shadow: 0 0 0 3px rgba(118, 232, 222, 0.08);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h4 {
  margin: 0;
}
.outline-btn {
  padding: 6px 9px;
  border: 1px solid rgba(119, 229, 217, 0.25);
  border-radius: 7px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.07);
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}
.dynamic-row,
.contact-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.remove-btn {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 113, 145, 0.18);
  border-radius: 7px;
  color: #ff94ab;
  background: rgba(255, 103, 139, 0.08);
  font-size: 17px;
  cursor: pointer;
}
.contact-row input,
.contact-row select {
  flex: 1;
}
.modal-actions {
  display: flex;
  justify-content: flex-start;
  gap: 9px;
  margin-top: 18px;
}
.secondary-btn {
  min-height: 43px;
  padding: 0 18px;
  border: 1px solid rgba(143, 157, 226, 0.2);
  border-radius: 10px;
  color: #aab4dc;
  background: transparent;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.toast-message {
  position: fixed;
  left: 25px;
  bottom: 25px;
  z-index: 200;
  padding: 12px 17px;
  border: 1px solid rgba(116, 232, 220, 0.22);
  border-radius: 10px;
  color: #bdf7f0;
  background: #182552;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  font-size: 11px;
}
.toast-enter-active,
.toast-leave-active {
  transition: 0.25s;
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
@media (max-width: 720px) {
  .page-topline {
    align-items: flex-start;
    flex-direction: column;
  }
  .page-topline h2 {
    font-size: 24px;
  }
  .primary-btn {
    width: 100%;
  }
  .summary-strip {
    grid-template-columns: 1fr 1fr;
  }
  .sync-status {
    grid-column: 1/-1;
  }
  .card-heading {
    padding-right: 15px;
    padding-left: 15px;
  }
  .clients-table th,
  .clients-table td {
    padding-right: 14px;
    padding-left: 14px;
  }
  .modal-overlay {
    inset: 70px 0 0;
    padding: 12px;
  }
  .modal-content {
    max-height: calc(100vh - 82px);
    padding: 23px 18px;
  }
  .form-grid,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
  .contact-row {
    align-items: stretch;
    flex-wrap: wrap;
  }
  .contact-row input,
  .contact-row select {
    flex: 1 1 42%;
  }
  .contact-row .remove-btn {
    align-self: center;
  }
}
.page-topline h2 {
  font-size: 30px;
}
.page-topline p,
.card-heading p {
  font-size: 13px;
}
.clients-table th {
  font-size: 11px;
}
.clients-table td {
  font-size: 12px;
}
.client-cell strong {
  font-size: 13px;
}
.client-cell span,
.info-stack,
.people-cell,
.muted {
  font-size: 11px;
}
.social-links a {
  font-size: 10px;
}
.action.details {
  color: #c491ff;
  background: rgba(180, 112, 255, 0.1);
}
.details-overlay {
  position: fixed;
  inset: 82px 0 0;
  z-index: 110;
  display: grid;
  place-items: start center;
  padding: 18px;
  overflow-y: auto;
  background: rgba(4, 7, 27, 0.8);
  backdrop-filter: blur(8px);
}
.details-modal {
  width: min(700px, 100%);
  max-height: calc(100vh - 118px);
  overflow-y: auto;
  position: relative;
  padding: 28px;
  border: 1px solid rgba(146, 160, 233, 0.22);
  border-radius: 22px;
  background: linear-gradient(145deg, #171d52, #0d143a);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
}
.details-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(143, 157, 226, 0.14);
}
.details-avatar {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 18px;
  font-weight: 800;
}
.details-hero h3 {
  margin: 5px 0 2px;
  font-size: 23px;
}
.client-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #78e4d8;
  font-size: 10px;
}
.client-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #70e1d5;
  box-shadow: 0 0 8px #70e1d5;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 18px;
}
.details-section {
  padding: 16px;
  border: 1px solid rgba(140, 155, 226, 0.13);
  border-radius: 14px;
  background: rgba(6, 11, 37, 0.2);
}
.details-section h4 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 13px;
  color: #dfe3fa;
  font-size: 12px;
}
.section-symbol {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  font-size: 13px;
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
  gap: 9px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #edf0ff;
  text-decoration: none;
  transition: 0.2s;
}
.contact-card span:nth-child(2) {
  flex: 1;
}
.contact-card small,
.contact-card strong {
  display: block;
}
.contact-card small {
  color: #8190bd;
  font-size: 9px;
}
.contact-card strong {
  margin-top: 2px;
  font-size: 11px;
}
.contact-card b {
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 9px;
}
.contact-icon {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 15px;
}
.phone-card {
  border-color: rgba(118, 229, 217, 0.15);
  background: rgba(90, 220, 207, 0.06);
}
.phone-card .contact-icon {
  color: #17204e;
  background: #78e5da;
}
.phone-card b {
  color: #78e5da;
  background: rgba(90, 220, 207, 0.12);
}
.whatsapp-card {
  border-color: rgba(78, 220, 126, 0.3);
  background: linear-gradient(90deg, rgba(31, 184, 91, 0.18), rgba(31, 184, 91, 0.06));
}
.whatsapp-card .contact-icon {
  color: #fff;
  background: #20bd5c;
  font-weight: 800;
  box-shadow: 0 0 13px rgba(32, 189, 92, 0.35);
}
.whatsapp-card b {
  color: #7af0a7;
  background: rgba(32, 189, 92, 0.17);
}
.contact-card:hover {
  transform: translateY(-1px);
  filter: brightness(1.15);
}
.email-row {
  display: flex;
  gap: 7px;
  margin-top: 4px;
  color: #c491ff;
  font-size: 11px;
}
.email-row a {
  color: #c491ff;
  text-decoration: none;
}
.finance-list {
  display: grid;
  gap: 10px;
}
.finance-list div {
  padding-bottom: 8px;
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
  color: #7b87b4;
  font-size: 9px;
}
.finance-list strong {
  margin-top: 2px;
  color: #d9ddf5;
  font-size: 11px;
}
.full-detail {
  margin-top: 14px;
}
.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-heading-row h4 {
  margin-bottom: 0;
}
.links-count {
  color: #7de8dc;
  font-size: 9px;
}
.full-contacts {
  display: grid;
  gap: 7px;
}
.full-contact {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px;
  border-radius: 9px;
  background: rgba(8, 14, 45, 0.42);
}
.mini-avatar {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #241d55;
  background: linear-gradient(145deg, #80e8df, #ad84fa);
  font-size: 9px;
  font-weight: 800;
}
.full-contact > div:nth-child(2) {
  flex: 1;
}
.full-contact strong,
.full-contact small {
  display: block;
}
.full-contact strong {
  font-size: 10px;
}
.full-contact small {
  margin-top: 2px;
  color: #7d89b6;
  font-size: 9px;
}
.mini-action {
  padding: 4px 7px;
  border-radius: 6px;
  color: #78e5da;
  background: rgba(90, 220, 207, 0.09);
  font-size: 9px;
  text-decoration: none;
}
.detail-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.detail-links a {
  display: block;
  padding: 11px;
  border: 1px solid rgba(180, 112, 255, 0.17);
  border-radius: 9px;
  color: #d9ddf5;
  background: rgba(180, 112, 255, 0.06);
  text-decoration: none;
}
.detail-links a:hover {
  border-color: #b986ff;
  background: rgba(180, 112, 255, 0.12);
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
  font-size: 10px;
}
.detail-links small {
  max-width: 230px;
  margin-top: 4px;
  overflow: hidden;
  color: #7782b0;
  direction: ltr;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 8px;
}
.detail-footer {
  display: flex;
  justify-content: flex-start;
  gap: 9px;
  margin-top: 18px;
}
.details-modal .primary-btn {
  min-height: 40px;
}
.details-modal .secondary-btn {
  min-height: 40px;
}
@media (max-width: 720px) {
  .details-overlay {
    inset: 70px 0 0;
    padding: 12px;
  }
  .details-modal {
    max-height: calc(100vh - 82px);
    padding: 20px 15px;
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
  .detail-links {
    grid-template-columns: 1fr;
  }
  .details-hero h3 {
    font-size: 20px;
  }
  .page-topline h2 {
    font-size: 26px;
  }
}
</style>
