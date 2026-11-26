<template>
  <!-- 1. نافذة نجاح إنشاء/استنساخ الخطة -->
  <Teleport to="body">
    <div v-if="showCreationSuccess" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-creation')">
        <div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center">
          <button class="modal-close" type="button" @click="$emit('close-creation')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #7de8dc, #b28aff); color: #12183f; margin: 0 auto 15px">
            {{ isDuplicateSuccess ? '✨' : '🚀' }}
          </div>
          <h3 style="color: #78e4d8">{{ isDuplicateSuccess ? 'تم استنساخ الخطة بنجاح!' : 'تم إنشاء الخطة بنجاح!' }}</h3>
          <p style="margin-bottom: 20px">الآن يمكنك إبلاغ المسؤولين ببدء العمل على هذه الخطة.</p>
          <div v-if="createdPlan" class="wa-actions-container">
            <div v-if="getResponsibles(createdPlan).length > 0" class="executors-list">
              <h4 style="font-size: 11px; color: #aeb6d7; text-align: right; margin-bottom: 10px">إبلاغ المسؤولين للإنجاز:</h4>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <a
                  v-for="resp in getResponsibles(createdPlan)"
                  :key="resp.id"
                  :href="generateWaLink('plan_assigned', createdPlan, resp)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wa-btn-large"
                  style="text-decoration: none; display: flex; align-items: center; justify-content: center"
                >
                  <span>إرسال تنبيه للمسؤول: {{ resp.name }}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 8px">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div v-else class="muted mt-3" style="font-size: 10px">لا يوجد مسؤولين مسجلين في هذه الخطة.</div>
          </div>
          <div class="modal-actions" style="justify-content: center; margin-top: 25px">
            <button type="button" class="secondary-btn" @click="$emit('close-creation')">تخطي</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 2. نافذة تنبيه الواتساب الفوري -->
  <Teleport to="body">
    <div v-if="waPrompt.show" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-wa-prompt')">
        <div class="modal-content delivery-modal" style="width: min(450px, 100%) !important; text-align: center">
          <button class="modal-close" type="button" @click="$emit('close-wa-prompt')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #25d366, #128c7e); margin: 0 auto 15px; color: #fff">
            📱
          </div>
          <h3 style="color: #25d366">{{ waPrompt.title }}</h3>
          <p style="margin-bottom: 20px">{{ waPrompt.desc }}</p>

          <div v-if="waPrompt.recipients && waPrompt.recipients.length > 0" style="display: flex; flex-direction: column; gap: 10px">
            <a
              v-for="(rec, idx) in waPrompt.recipients"
              :key="idx"
              :href="rec.link"
              target="_blank"
              rel="noopener noreferrer"
              class="wa-btn-large"
              style="text-decoration: none"
              @click="$emit('close-wa-prompt')"
            >
              <span>إرسال لـ {{ rec.name }} ({{ rec.role }})</span>
            </a>
          </div>

          <a
            v-else-if="waPrompt.link"
            :href="waPrompt.link"
            target="_blank"
            rel="noopener noreferrer"
            class="wa-btn-large"
            style="text-decoration: none"
            @click="$emit('close-wa-prompt')"
          >
            <span>إرسال التنبيه عبر واتساب</span>
          </a>

          <div class="modal-actions" style="justify-content: center; margin-top: 15px">
            <button type="button" class="secondary-btn" @click="$emit('close-wa-prompt')">تخطي</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 3. نافذة نجاح التسليم النهائي -->
  <Teleport to="body">
    <div v-if="showDeliverySuccess" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-delivery')">
        <div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center">
          <button class="modal-close" type="button" @click="$emit('close-delivery')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #70e1d5, #55c8bc); margin: 0 auto 15px">🎉</div>
          <h3 style="color: #78e4d8">تم اعتماد وتسليم الخطة بنجاح!</h3>
          <p style="margin-bottom: 20px">الآن يمكنك إبلاغ العميل بالرابط، وإبلاغ الإدارة، وإعطاء إشارة البدء لفريق التنفيذ.</p>
          <div v-if="deliveredPlan" class="wa-actions-container">
            <a :href="generateWaLink('client_delivery', deliveredPlan)" target="_blank" rel="noopener noreferrer" class="wa-btn-large" style="text-decoration: none">
              <span>إبلاغ العميل على واتساب</span>
            </a>

            <button
              v-if="deliveredGroupLinks.length > 0"
              type="button"
              class="wa-btn-large group-delivery-btn"
              style="margin-top: 8px; border: none; cursor: pointer; text-decoration: none"
              @click="$emit('open-group-notify', deliveredPlan, 'delivery')"
            >
              <span>👥 إبلاغ جروب العميل بالتسليم ({{ deliveredGroupLinks.length }})</span>
              <span style="font-size: 14px">↗</span>
            </button>

            <div v-if="managersList.length > 0" class="managers-list mt-3">
              <h4 style="font-size: 11px; color: #aeb6d7; text-align: right; margin-bottom: 8px">إبلاغ الإدارة / المدير بالتسليم:</h4>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <a
                  v-for="mgr in managersList"
                  :key="'mgr_' + mgr.id"
                  :href="generateWaLink('manager_delivery', deliveredPlan, mgr)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wa-btn-manager"
                  style="text-decoration: none"
                >
                  <span>📋 إرسال تنبيه للمدير: {{ mgr.name }}</span>
                </a>
              </div>
            </div>

            <div v-if="getExecutors(deliveredPlan).length > 0" class="executors-list mt-3">
              <h4 style="font-size: 11px; color: #aeb6d7; text-align: right; margin-bottom: 10px">إبلاغ المنفذين للبدء:</h4>
              <div style="display: flex; flex-direction: column; gap: 8px">
                <a
                  v-for="executor in getExecutors(deliveredPlan)"
                  :key="executor.id"
                  :href="generateWaLink('executors_start', deliveredPlan, executor)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wa-btn-small"
                  style="text-decoration: none; display: block; text-align: center"
                >
                  إرسال للمنفذ: {{ executor.name }} 📱
                </a>
              </div>
            </div>
            <div v-else class="muted mt-3" style="font-size: 9px">لا يوجد منفذين مسجلين في هذه الخطة.</div>
          </div>
          <div class="modal-actions" style="justify-content: center; margin-top: 25px">
            <button type="button" class="secondary-btn" @click="$emit('close-delivery')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 4. نافذة إخطار ممثلي العميل بعد انتهاء المراجعة -->
  <Teleport to="body">
    <div v-if="clientNotifyPlan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-client-notify')">
        <div class="modal-content client-notify-modal" role="dialog" style="width: min(620px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-client-notify')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #10b981, #059669); color: #fff">💬</div>
          <span class="eyebrow" style="color: #34d399">المتابعة والتواصل مع العميل</span>
          <h3 style="color: #6ee7b7">إخطار العميل باكتمال المراجعة الداخلية</h3>

          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; line-height: 1.5">
            خطة العميل: <strong style="color: #f1f5f9">{{ clientNotifyPlan.client?.name || 'غير محدد' }}</strong>
            <span style="margin-right: 6px; color: #cbd5e1">({{ getPlanDisplayName(clientNotifyPlan) }})</span>
          </p>

          <div class="wa-msg-preview-card" style="margin-top: 16px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px 14px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
              <span style="font-size: 12px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px">
                <span>📋</span> نص الرسالة المجهزة للعميل:
              </span>
              <button
                type="button"
                style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; border-radius: 6px; padding: 3px 9px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px"
                title="نسخ نص الرسالة"
                @click="copyText(reviewMsg, 'client')"
              >
                <span>{{ copiedType === 'client' ? '✓ تم النسخ' : 'نسخ النص' }}</span>
              </button>
            </div>
            <div style="font-size: 12px; color: #cbd5e1; white-space: pre-wrap; line-height: 1.6; max-height: 120px; overflow-y: auto; padding-right: 4px" dir="rtl">
              {{ reviewMsg }}
            </div>
          </div>

          <div v-if="notifyGroupLinks.length > 0" class="client-groups-section" style="margin-top: 18px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
              <h4 style="font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 0; display: flex; align-items: center; gap: 6px">
                <span>👥</span> جروبات ومجموعات العمل مع العميل
                <span style="font-size: 11px; background: rgba(14, 165, 233, 0.15); color: #38bdf8; padding: 2px 7px; border-radius: 9999px">
                  {{ notifyGroupLinks.length }}
                </span>
              </h4>
              <small style="color: #94a3b8; font-size: 11px">(يتم نسخ نص الرسالة فوراً عند الضغط)</small>
            </div>

            <div class="groups-grid" style="display: flex; flex-direction: column; gap: 8px">
              <div
                v-for="(grp, gIdx) in notifyGroupLinks"
                :key="'cg_' + gIdx"
                class="group-card-row"
                style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px"
              >
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(15, 23, 42, 0.7); display: grid; place-items: center; font-size: 18px; border: 1px solid rgba(148, 163, 184, 0.2)">
                    {{ getGroupPlatformIcon(grp.platform) }}
                  </div>
                  <div>
                    <div style="font-size: 13px; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 6px">
                      {{ grp.title || getGroupPlatformLabel(grp.platform) }}
                      <span style="font-size: 10.5px; padding: 1px 6px; border-radius: 4px; font-weight: 600" :class="`platform-badge-${grp.platform || 'other'}`">
                        {{ getGroupPlatformLabel(grp.platform) }}
                      </span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap" dir="ltr">
                      {{ grp.url }}
                    </div>
                  </div>
                </div>

                <button type="button" class="direct-group-btn" title="نسخ نص الرسالة وفتح الجروب مباشرة" @click="notifyClientGroup(grp, clientNotifyPlan, 'review_done')">
                  <span>إبلاغ هذا الجروب</span> <span>↗</span>
                </button>
              </div>
            </div>
          </div>

          <div class="client-contacts-section" style="margin-top: 20px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
              <h4 style="font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 0; display: flex; align-items: center; gap: 6px">
                <span>👥</span> أرقام وممثلو العميل المتاحون للتواصل
                <span style="font-size: 11px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 2px 7px; border-radius: 9999px">
                  {{ notifyContacts.length }}
                </span>
              </h4>
            </div>

            <div v-if="notifyContacts.length > 0" class="contacts-grid" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto">
              <div
                v-for="contact in notifyContacts"
                :key="contact.id"
                class="contact-card-row"
                style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px; transition: all 0.2s ease"
              >
                <div style="display: flex; align-items: center; gap: 10px">
                  <UserAvatar :name="contact.name" :size="36" />
                  <div>
                    <div style="font-size: 13px; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 6px">
                      {{ contact.name }}
                      <span v-if="contact.is_primary" style="font-size: 10px; padding: 1px 6px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-radius: 4px">رئيسي</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-top: 2px">
                      <span>{{ contact.method === 'whatsapp' ? 'واتساب' : contact.method === 'phone' ? 'هاتف' : contact.method }}</span>
                      <span>•</span>
                      <span dir="ltr">{{ contact.details }}</span>
                    </div>
                  </div>
                </div>

                <a
                  :href="getClientContactWaLink(clientNotifyPlan, contact.details, contact.name)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="direct-wa-btn"
                  style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600"
                >
                  <span>مراسلة واتساب</span> <span>↗</span>
                </a>
              </div>
            </div>

            <div v-else style="padding: 16px; background: rgba(30, 41, 59, 0.4); border: 1px dashed rgba(148, 163, 184, 0.2); border-radius: 10px; text-align: center; color: #94a3b8; font-size: 12.5px">
              <span>⚠️ لا توجد جهات اتصال مسجلة لممثلي هذا العميل. يمكنك إضافة أرقام ممثلي العميل من صفحة العملاء، أو إدخال رقم هاتف أدناه للإرسال المباشر.</span>
            </div>

            <div style="margin-top: 14px; padding: 10px 14px; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 8px">
              <span style="font-size: 11.5px; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 6px">
                أو إرسال مباشر لرقم آخر عبر واتساب:
              </span>
              <div style="display: flex; gap: 8px">
                <input
                  v-model="customDirectPhone"
                  type="text"
                  placeholder="رقم الهاتف (مثال: 01012345678 أو 96650...)"
                  dir="ltr"
                  style="flex: 1; padding: 6px 10px; font-size: 12px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 6px; color: #fff"
                />
                <a
                  :href="customDirectPhone ? getClientContactWaLink(clientNotifyPlan, customDirectPhone) : '#'"
                  :target="customDirectPhone ? '_blank' : '_self'"
                  rel="noopener noreferrer"
                  :style="[
                    'text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;',
                    customDirectPhone ? 'background: #10b981; color: #fff; cursor: pointer;' : 'background: rgba(148, 163, 184, 0.2); color: #64748b; pointer-events: none;',
                  ]"
                >
                  <span>إرسال</span> ↗
                </a>
              </div>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 22px; display: flex; justify-content: flex-end">
            <button type="button" class="secondary-btn" @click="$emit('close-client-notify')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 5. نافذة إبلاغ جروبات العميل -->
  <Teleport to="body">
    <div v-if="groupNotifyPlan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close-group-notify')">
        <div class="modal-content client-notify-modal group-notify-modal" role="dialog" style="width: min(620px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close-group-notify')">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #0ea5e9, #0284c7); color: #fff">👥</div>
          <span class="eyebrow" style="color: #38bdf8">إبلاغ جروبات ومجموعات العمل</span>
          <h3 style="color: #7dd3fc">
            {{ groupNotifyType === 'delivery' ? 'إبلاغ جروب العميل بالتسليم النهائي 🎉' : 'إبلاغ جروب العميل باكتمال المراجعة 📋' }}
          </h3>

          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px; line-height: 1.5">
            خطة العميل: <strong style="color: #f1f5f9">{{ groupNotifyPlan.client?.name || 'غير محدد' }}</strong>
            <span style="margin-right: 6px; color: #cbd5e1">({{ getPlanDisplayName(groupNotifyPlan) }})</span>
          </p>

          <div class="wa-msg-preview-card" style="margin-top: 16px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 10px; padding: 12px 14px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
              <span style="font-size: 12px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px">
                <span>📋</span> نص الرسالة المجهزة لنشرها في الجروب:
              </span>
              <button
                type="button"
                style="background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.35); color: #38bdf8; border-radius: 6px; padding: 3px 9px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px"
                title="نسخ نص الرسالة"
                @click="copyText(groupMsg, 'group')"
              >
                <span>{{ copiedType === 'group' ? '✓ تم النسخ' : 'نسخ النص' }}</span>
              </button>
            </div>
            <div style="font-size: 12px; color: #cbd5e1; white-space: pre-wrap; line-height: 1.6; max-height: 120px; overflow-y: auto; padding-right: 4px" dir="rtl">
              {{ groupMsg }}
            </div>
          </div>

          <div class="client-contacts-section" style="margin-top: 20px">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
              <h4 style="font-size: 13px; font-weight: 700; color: #e2e8f0; margin: 0; display: flex; align-items: center; gap: 6px">
                <span>👥</span> اختر الجروب المراد إبلاغه
                <span style="font-size: 11px; background: rgba(14, 165, 233, 0.15); color: #38bdf8; padding: 2px 7px; border-radius: 9999px">
                  {{ modalGroupLinks.length }} جروب متاح
                </span>
              </h4>
            </div>

            <div v-if="modalGroupLinks.length > 0" class="groups-grid" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto">
              <div
                v-for="(grp, gIdx) in modalGroupLinks"
                :key="'gnm_' + gIdx"
                class="group-card-row"
                style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 10px"
              >
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(15, 23, 42, 0.7); display: grid; place-items: center; font-size: 20px; border: 1px solid rgba(148, 163, 184, 0.2)">
                    {{ getGroupPlatformIcon(grp.platform) }}
                  </div>
                  <div>
                    <div style="font-size: 13px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 6px">
                      {{ grp.title || getGroupPlatformLabel(grp.platform) }}
                      <span style="font-size: 10.5px; padding: 1px 7px; border-radius: 4px; font-weight: 600" :class="`platform-badge-${grp.platform || 'other'}`">
                        {{ getGroupPlatformLabel(grp.platform) }}
                      </span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap" dir="ltr">
                      {{ grp.url }}
                    </div>
                  </div>
                </div>

                <button type="button" class="direct-group-btn" title="نسخ نص الرسالة وفتح الجروب مباشرة" @click="notifyClientGroup(grp, groupNotifyPlan, groupNotifyType)">
                  <span>إبلاغ ونشر بالجروب</span> <span>↗</span>
                </button>
              </div>
            </div>

            <div v-else style="padding: 16px; background: rgba(30, 41, 59, 0.4); border: 1px dashed rgba(148, 163, 184, 0.2); border-radius: 10px; text-align: center; color: #94a3b8; font-size: 12.5px">
              <span>⚠️ لا توجد جروبات مسجلة لهذا العميل. يمكنك إضافة روابط مجموعات العمل من صفحة إدارة العملاء.</span>
            </div>

            <div class="group-notify-hint-box" style="margin-top: 14px; padding: 10px 14px; background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 8px; color: #94a3b8; font-size: 11.5px; display: flex; align-items: center; gap: 8px">
              <span>ℹ️</span>
              <span>عند الضغط على "إبلاغ ونشر بالجروب"، يتم نسخ الرسالة المجهزة تلقائياً وفتح رابط الجروب في تبويب جديد للصقها فوراً.</span>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 22px; display: flex; justify-content: flex-end">
            <button type="button" class="secondary-btn" @click="$emit('close-group-notify')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import alertService from '@/services/alertService'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { getGroupPlatformIcon, getGroupPlatformLabel } from '@/modules/clients/utils/clientLinks'
import {
  getClientContactList,
  getClientGroupLinks,
  getExecutors,
  getPlanDisplayName,
  getResponsibles,
} from '../utils/planHelpers'

const props = defineProps({
  showCreationSuccess: { type: Boolean, default: false },
  isDuplicateSuccess: { type: Boolean, default: false },
  createdPlan: { type: Object, default: null },
  waPrompt: { type: Object, required: true },
  showDeliverySuccess: { type: Boolean, default: false },
  deliveredPlan: { type: Object, default: null },
  clientNotifyPlan: { type: Object, default: null },
  groupNotifyPlan: { type: Object, default: null },
  groupNotifyType: { type: String, default: 'review_done' },
  allClients: { type: Array, default: () => [] },
  managersList: { type: Array, default: () => [] },
  generateWaLink: { type: Function, required: true },
  getClientReviewMessage: { type: Function, required: true },
  getClientDeliveryMessage: { type: Function, required: true },
  getClientContactWaLink: { type: Function, required: true },
  notifyClientGroup: { type: Function, required: true },
})

defineEmits([
  'close-creation',
  'close-wa-prompt',
  'close-delivery',
  'close-client-notify',
  'close-group-notify',
  'open-group-notify',
])

const customDirectPhone = ref('')
const copiedType = ref('')

watch(
  () => props.clientNotifyPlan,
  (val) => {
    if (val) customDirectPhone.value = ''
  },
)

const deliveredGroupLinks = computed(() =>
  getClientGroupLinks(props.deliveredPlan, props.allClients),
)
const notifyGroupLinks = computed(() =>
  getClientGroupLinks(props.clientNotifyPlan, props.allClients),
)
const modalGroupLinks = computed(() =>
  getClientGroupLinks(props.groupNotifyPlan, props.allClients),
)
const notifyContacts = computed(() => getClientContactList(props.clientNotifyPlan))
const reviewMsg = computed(() => props.getClientReviewMessage(props.clientNotifyPlan))
const groupMsg = computed(() =>
  props.groupNotifyType === 'delivery'
    ? props.getClientDeliveryMessage(props.groupNotifyPlan)
    : props.getClientReviewMessage(props.groupNotifyPlan),
)

const copyText = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedType.value = type
    alertService.smartToast('تم نسخ نص الرسالة بنجاح 📋')
    setTimeout(() => {
      if (copiedType.value === type) copiedType.value = ''
    }, 2500)
  } catch {
    alertService.smartToast('تعذر النسخ تلقائياً')
  }
}
</script>
