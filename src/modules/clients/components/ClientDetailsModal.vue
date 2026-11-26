<template>
  <Teleport to="body">
    <div v-if="client" class="clients-modal-root" dir="rtl">
      <div class="details-overlay" role="presentation" @click.self="$emit('close')">
        <div
          class="details-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-details-title"
          tabindex="-1"
          @keydown.esc="$emit('close')"
        >
          <button class="modal-close" type="button" aria-label="إغلاق" @click="$emit('close')">
            ×
          </button>

          <div class="details-hero">
            <ClientAvatar
              :logo-url="client.logo_url"
              :name="client.name"
              :size="62"
              rounded="17px"
              class="details-avatar"
            />
            <div>
              <span class="eyebrow">ملف العميل التفصيلي</span>
              <h3 id="client-details-title">{{ client.name }}</h3>
              <span class="client-status"><i></i> عميل نشط بجميع المنصات</span>
            </div>
          </div>

          <div class="details-grid">
            <!-- تفاصيل الهواتف والإيميلات -->
            <section class="details-section">
              <h4><span class="section-symbol teal-symbol">☎</span> أرقام التواصل والبريد</h4>
              <div class="contact-actions">
                <div v-if="client.phones?.length">
                  <a
                    v-for="(phone, idx) in client.phones"
                    :key="'p' + idx"
                    class="contact-card phone-card mb-2"
                    :href="`tel:${phone.number}`"
                  >
                    <span class="contact-icon">☎</span>
                    <span>
                      <small>هاتف {{ idx + 1 }} {{ phone.has_whatsapp ? '(يدعم واتساب)' : '' }}</small>
                      <strong dir="ltr">{{ phone.number }}</strong>
                    </span>
                    <b>اتصال</b>
                  </a>
                </div>

                <div v-if="client.emails?.length" class="emails-list mt-2">
                  <div v-for="(email, idx) in client.emails" :key="'em' + idx" class="email-row">
                    <span>✉</span><a :href="`mailto:${email}`">{{ email }}</a>
                  </div>
                </div>

                <div v-if="!client.phones?.length && !client.emails?.length" class="empty-detail">
                  لا توجد بيانات تواصل أساسية
                </div>
              </div>
            </section>

            <!-- التفاصيل المالية -->
            <section class="details-section">
              <h4><span class="section-symbol purple-symbol">◎</span> البيانات المالية</h4>
              <div class="finance-list">
                <div v-if="client.bank_name || client.bank_account">
                  <small>البنك</small>
                  <strong>
                    {{ client.bank_name || 'غير محدد' }}
                    {{ client.bank_branch ? `(${client.bank_branch})` : '' }}
                  </strong>
                  <strong v-if="client.bank_account" class="mt-1" style="color: #78e5da">
                    {{ client.bank_account }}
                  </strong>
                </div>
                <div v-if="client.instapay">
                  <small>Instapay</small><strong>{{ client.instapay }}</strong>
                </div>
                <div v-if="client.wallet">
                  <small>المحفظة</small><strong>{{ client.wallet }}</strong>
                </div>
                <span
                  v-if="!client.bank_account && !client.instapay && !client.wallet && !client.bank_name"
                  class="empty-detail"
                >
                  لا توجد بيانات مالية
                </span>
              </div>
            </section>

            <!-- مسؤول المبيعات والعمولة -->
            <section class="details-section">
              <h4><span class="section-symbol green-symbol">◎</span> مسؤول المبيعات والعمولة</h4>
              <div class="finance-list">
                <div v-if="client.sales_rep">
                  <small>المسؤول المباشر</small>
                  <strong>🎯 {{ client.sales_rep.name }}</strong>
                  <small
                    v-if="client.custom_commission_rate"
                    class="mt-1"
                    style="color: #38bdf8; display: block"
                  >
                    نسبة خاصة: {{ client.custom_commission_rate }}%
                  </small>
                  <small
                    v-else-if="client.sales_rep.commission_rate"
                    class="mt-1"
                    style="color: #38bdf8; display: block"
                  >
                    نسبة افتراضية: {{ client.sales_rep.commission_rate }}%
                  </small>
                </div>
                <span v-else class="empty-detail">عميل مباشر (بدون مسؤول مبيعات)</span>
              </div>
            </section>
          </div>

          <section class="details-section full-detail">
            <h4><span class="section-symbol orange-symbol">◎</span> الأشخاص (جهات الاتصال)</h4>
            <div v-if="client.contacts?.length" class="full-contacts">
              <div v-for="contact in client.contacts" :key="contact.id" class="full-contact">
                <UserAvatar :name="contact.contact_name" :size="36" class="mini-avatar" />
                <div>
                  <strong>{{ contact.contact_name }}</strong>
                  <small>{{ contact.contact_method }} · {{ contact.contact_details }}</small>
                </div>
                <a
                  v-if="contact.contact_method === 'whatsapp' || contact.contact_method === 'phone'"
                  :href="
                    contact.contact_method === 'whatsapp'
                      ? buildWhatsAppUrl(contact.contact_details) || '#'
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
              <h4><span class="section-symbol blue-symbol">📁</span> روابط درايف</h4>
              <span class="links-count">{{ client.drive_links?.length || 0 }} روابط</span>
            </div>
            <div v-if="client.drive_links?.length" class="detail-links">
              <a
                v-for="(link, index) in client.drive_links"
                :key="'dl' + index"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="drive-link-card"
              >
                <span>🔗</span>
                <strong>{{ link.title }}</strong>
                <small>{{ link.url }}</small>
              </a>
            </div>
            <span v-else class="empty-detail">لا توجد روابط درايف مسجلة</span>
          </section>

          <section class="details-section full-detail">
            <div class="section-heading-row">
              <h4><span class="section-symbol green-symbol">👥</span> جروبات ومجموعات العميل</h4>
              <span class="links-count">{{ client.group_links?.length || 0 }} جروبات</span>
            </div>
            <div v-if="client.group_links?.length" class="detail-links group-detail-links">
              <a
                v-for="(grp, index) in client.group_links"
                :key="'gl' + index"
                :href="grp.url"
                target="_blank"
                rel="noopener noreferrer"
                class="group-detail-card"
                :class="`platform-${grp.platform || 'other'}`"
              >
                <div class="group-detail-left">
                  <span class="group-platform-icon">{{ getGroupPlatformIcon(grp.platform) }}</span>
                  <div>
                    <strong>{{ grp.title || getGroupPlatformLabel(grp.platform) }}</strong>
                    <span class="group-platform-label">{{ getGroupPlatformLabel(grp.platform) }}</span>
                  </div>
                </div>
                <div class="group-detail-right">
                  <small dir="ltr">{{ grp.url }}</small>
                  <span class="open-btn">فتح الجروب ↗</span>
                </div>
              </a>
            </div>
            <span v-else class="empty-detail">لا توجد روابط جروبات مسجلة لهذا العميل</span>
          </section>

          <section class="details-section full-detail">
            <div class="section-heading-row">
              <h4><span class="section-symbol purple-symbol">↗</span> منصات السوشيال ميديا</h4>
              <span class="links-count">{{ client.social_links?.length || 0 }} منصات</span>
            </div>
            <div v-if="client.social_links?.length" class="detail-links">
              <a
                v-for="(link, index) in client.social_links"
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
            <button class="secondary-btn" type="button" @click="$emit('close')">إغلاق</button>
            <button v-if="canManage" class="primary-btn" type="button" @click="$emit('edit', client)">
              تعديل ملف العميل
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import ClientAvatar from '@/components/ClientAvatar.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { buildWhatsAppUrl } from '@/utils/whatsapp'
import { getGroupPlatformIcon, getGroupPlatformLabel } from '../utils/clientLinks'

defineProps({
  client: { type: Object, default: null },
  canManage: { type: Boolean, default: false },
})

defineEmits(['close', 'edit'])
</script>
