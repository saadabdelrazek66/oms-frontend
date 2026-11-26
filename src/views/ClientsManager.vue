<template>
  <section class="clients-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة الإدارة / العملاء</span>
        <h2>إدارة العملاء والشركات</h2>
        <p>نظّم بيانات العملاء ووسائل التواصل والتفاصيل المالية في مكان واحد.</p>
      </div>
      <button v-if="can('clients.create')" class="primary-btn" type="button" @click="openModal()">
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
      <div>
        <span class="summary-icon green">👥</span>
        <div>
          <small>جروبات العمل</small><strong>{{ groupsTotal }}</strong>
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
              <th scope="col" style="width: 50px; text-align: center">#</th>
              <th scope="col">العميل / الشركة</th>
              <th scope="col">التواصل الأساسي</th>
              <th scope="col">البيانات المالية</th>
              <th scope="col">جهات الاتصال</th>
              <th scope="col">جروبات العميل</th>
              <th scope="col">السوشيال ميديا</th>
              <th scope="col">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="state-cell">
                <span class="spinner"></span> جارٍ تحميل البيانات...
              </td>
            </tr>
            <tr v-else-if="clients.length === 0">
              <td colspan="8" class="state-cell">لا يوجد عملاء مسجلون حاليًا</td>
            </tr>
            <tr v-for="(client, index) in clients" v-else :key="client.id">
              <td class="text-center" style="font-weight: 700; color: #8792be; width: 50px; vertical-align: middle">
                {{ index + 1 }}
              </td>
              <td>
                <div class="client-cell">
                  <ClientAvatar
                    :logo-url="client.logo_url"
                    :name="client.name"
                    :size="40"
                    rounded="11px"
                    class="client-avatar"
                  />
                  <div>
                    <strong>{{ client.name }}</strong>
                    <span
                      v-if="client.sales_rep"
                      class="client-rep-badge"
                      :title="`مسؤول المبيعات: ${client.sales_rep.name}`"
                    >
                      🎯 {{ client.sales_rep.name }}
                    </span>
                    <span v-else>عميل نشط</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="info-stack">
                  <div v-if="client.phones?.length" class="phone-actions">
                    <a class="phone-mini" :href="`tel:${client.phones[0].number}`" title="اتصال">
                      <span>☎</span><b dir="ltr">{{ client.phones[0].number }}</b>
                    </a>
                    <a
                      v-if="client.phones[0].has_whatsapp"
                      class="whatsapp-mini"
                      :href="buildWhatsAppUrl(client.phones[0].number) || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح واتساب"
                    >
                      <span>◉</span> واتساب
                    </a>
                  </div>
                  <span v-if="client.emails?.length">
                    ✉
                    <a :href="`mailto:${client.emails[0]}`" style="color: inherit; text-decoration: none">
                      {{ client.emails[0] }}
                    </a>
                  </span>
                  <span v-if="!client.phones?.length && !client.emails?.length" class="muted">
                    لا يوجد تواصل أساسي
                  </span>
                </div>
              </td>
              <td>
                <div class="info-stack financial">
                  <span v-if="client.bank_name">
                    بنك: {{ client.bank_name }}
                    <small v-if="client.bank_account">({{ client.bank_account }})</small>
                  </span>
                  <span v-if="client.instapay">Instapay: {{ client.instapay }}</span>
                  <span v-if="client.wallet">محفظة: {{ client.wallet }}</span>
                  <span
                    v-if="!client.bank_account && !client.instapay && !client.wallet && !client.bank_name"
                    class="muted"
                  >
                    لا توجد بيانات
                  </span>
                </div>
              </td>
              <td>
                <div v-if="client.contacts?.length" class="contacts-preview">
                  <span v-for="contact in client.contacts.slice(0, 2)" :key="contact.id">
                    <b>{{ contact.contact_name }}</b><small>{{ contact.contact_method }}</small>
                  </span>
                  <em v-if="client.contacts.length > 2">+{{ client.contacts.length - 2 }}</em>
                </div>
                <span v-else class="muted">لم تتم الإضافة</span>
              </td>
              <td>
                <div v-if="client.group_links?.length" class="client-group-badges">
                  <a
                    v-for="(grp, gIdx) in client.group_links.slice(0, 3)"
                    :key="gIdx"
                    :href="grp.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group-badge-pill"
                    :class="`platform-${grp.platform || 'other'}`"
                    :title="
                      grp.title
                        ? `${grp.title} (${getGroupPlatformLabel(grp.platform)})`
                        : getGroupPlatformLabel(grp.platform)
                    "
                  >
                    <span>{{ getGroupPlatformIcon(grp.platform) }}</span>
                    <strong>{{ grp.title || getGroupPlatformLabel(grp.platform) }}</strong>
                    <small>↗</small>
                  </a>
                  <span v-if="client.group_links.length > 3" class="more-groups-tag">
                    +{{ client.group_links.length - 3 }}
                  </span>
                </div>
                <span v-else class="muted">لا توجد جروبات</span>
              </td>
              <td>
                <div v-if="client.social_links?.length" class="social-links">
                  <a
                    v-for="(link, index) in client.social_links.slice(0, 3)"
                    :key="index"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ link.platform }} ↗
                  </a>
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
                    v-if="can('clients.edit')"
                    class="action edit"
                    type="button"
                    title="تعديل"
                    aria-label="تعديل بيانات العميل"
                    @click="openModal(client)"
                  >
                    ✎
                  </button>
                  <button
                    v-if="can('clients.delete')"
                    class="action delete"
                    type="button"
                    title="حذف العميل"
                    aria-label="حذف العميل"
                    @click="deleteClient(client.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ClientFormModal
      v-model="showModal"
      :editing-client="editingClient"
      :sales-reps="salesReps"
      :current-user="currentUser"
      @saved="handleClientSaved"
    />

    <ClientDetailsModal
      :client="selectedClient"
      :can-manage="canManageAccounts(currentUser)"
      @close="closeDetails"
      @edit="editSelectedClient"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/axios'
import { useAuthStore } from '@/stores/authStore'
import { canManageAccounts, can } from '@/utils/permissions'
import { buildWhatsAppUrl } from '@/utils/whatsapp'
import ClientAvatar from '@/components/ClientAvatar.vue'
import ClientFormModal from '@/modules/clients/components/ClientFormModal.vue'
import ClientDetailsModal from '@/modules/clients/components/ClientDetailsModal.vue'
import { getGroupPlatformIcon, getGroupPlatformLabel } from '@/modules/clients/utils/clientLinks'
import alertService from '@/services/alertService'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

const clients = ref([])
const salesReps = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingClient = ref(null)
const selectedClient = ref(null)

const showToast = (message) => alertService.smartToast(message)

const contactsTotal = computed(() =>
  clients.value.reduce((total, client) => total + (client.contacts?.length || 0), 0),
)
const linksTotal = computed(() =>
  clients.value.reduce((total, client) => total + (client.social_links?.length || 0), 0),
)
const groupsTotal = computed(() =>
  clients.value.reduce((total, client) => total + (client.group_links?.length || 0), 0),
)

const fetchClients = async () => {
  loading.value = true
  try {
    const response = await api.get('/clients')
    clients.value = response.data.data || response.data
  } catch (error) {
    console.error('Error fetching clients:', error)
    showToast(error.response?.data?.message || 'تعذر تحميل بيانات العملاء')
  } finally {
    loading.value = false
  }
}

const fetchSalesReps = async () => {
  try {
    const res = await api.get('/users/options', { params: { with_commission: 1 } })
    salesReps.value = res.data?.data || []
  } catch (err) {
    console.error('Error fetching sales reps:', err)
  }
}

const openModal = (client = null) => {
  if (!canManageAccounts(currentUser.value)) {
    showToast('عذراً، لا تمتلك الصلاحية لإضافة أو تعديل العملاء')
    return
  }
  editingClient.value = client
  showModal.value = true
}

const openDetails = (client) => {
  selectedClient.value = client
}

const closeDetails = () => {
  selectedClient.value = null
}

const editSelectedClient = (client) => {
  closeDetails()
  openModal(client)
}

const handleClientSaved = async (wasEditing) => {
  showToast(wasEditing ? 'تم تحديث بيانات العميل بنجاح' : 'تم إنشاء العميل بنجاح')
  await fetchClients()
}

const deleteClient = async (id) => {
  if (!canManageAccounts(currentUser.value)) {
    showToast('عذراً، لا تمتلك الصلاحية لحذف العميل')
    return
  }
  const confirmed = await alertService.confirm({
    title: '⚠️ تنبيه حرج: حذف العميل بالكامل',
    message:
      'هل أنت متأكد تماماً من رغبتك في حذف هذا العميل؟\n\n- سيتم حذف ملف الشركة بالكامل.\n- سيتم حذف جميع وسائل التواصل والأشخاص المرتبطين بها.\n- لا يمكن التراجع عن هذه العملية نهائياً!',
    type: 'danger',
    confirmText: 'نعم، احذف العميل نهائياً',
    cancelText: 'تراجع',
  })
  if (!confirmed) return

  try {
    await api.delete(`/clients/${id}`)
    showToast('تم حذف العميل وجميع بياناته بنجاح')
    await fetchClients()
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف')
  }
}

watch([showModal, selectedClient], ([modalOpen, detailsOpen]) => {
  document.body.classList.toggle('modal-is-open', modalOpen || Boolean(detailsOpen))
})

onMounted(() => {
  fetchClients()
  fetchSalesReps()
})

onBeforeUnmount(() => {
  document.body.classList.remove('modal-is-open')
})
</script>

<style src="@/modules/clients/styles/clients-shared.css"></style>
