<template>
  <Teleport to="body">
    <div v-if="modelValue && post" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay premium-overlay" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content premium-report-modal">
          <div class="premium-header">
            <div class="header-titles">
              <h2 class="report-title"><span class="icon">📊</span> تقرير تفصيلي للمنشور</h2>
              <p v-if="!isMediaBuyer" class="report-subtitle">
                حالة النشر:
                <span :class="['premium-badge', post.actual_publish_status === 'تم النشر' ? 'badge-success' : 'badge-warning']">
                  {{ post.actual_publish_status || 'لم يتم' }}
                </span>
              </p>
              <p v-else class="report-subtitle">
                حالة التمويل:
                <span :class="['premium-badge', post.finance_status === 'ممول' ? 'badge-success' : 'badge-warning']">
                  {{ post.finance_status || 'غير ممول' }}
                </span>
              </p>
            </div>
            <button class="premium-close-btn" @click="$emit('update:modelValue', false)">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          </div>

          <div class="premium-body">
            <div class="report-grid">
              <div class="report-sidebar">
                <div class="premium-card">
                  <h3 class="card-title">📌 معلومات أساسية</h3>
                  <ul class="info-list">
                    <li>
                      <span class="info-icon">📅</span>
                      <div class="info-data">
                        <span class="info-label">تاريخ النشر المخطط</span>
                        <div v-if="canEditTargetDateCell" style="display: flex; align-items: center; gap: 8px; margin-top: 4px">
                          <strong class="info-value">{{ getDayName(post.target_date) }} - {{ formatDate(post.target_date) }}</strong>
                          <input
                            type="date"
                            class="modal-target-date-picker"
                            :value="formatForDateInput(post.target_date)"
                            title="تعديل تاريخ النشر المخطط"
                            @change="$emit('target-date-change', post, $event)"
                          />
                        </div>
                        <div v-else>
                          <strong class="info-value">{{ getDayName(post.target_date) }} - {{ formatDate(post.target_date) }}</strong>
                          <span v-if="isPlanDelivered" class="plan-delivered-lock-tag" style="margin-right: 6px">
                            🔒 مقفل بعد التسليم النهائي
                          </span>
                        </div>
                      </div>
                    </li>

                    <li v-if="post.publishing_time">
                      <span class="info-icon">⏰</span>
                      <div class="info-data">
                        <span class="info-label">وقت النشر</span>
                        <strong class="info-value" dir="ltr">{{ post.publishing_time }}</strong>
                      </div>
                    </li>

                    <li v-if="!isMediaBuyer">
                      <span class="info-icon">⏰</span>
                      <div class="info-data">
                        <span class="info-label">الديدلاين</span>
                        <strong class="info-value text-red">{{ formatDeadlineDisplay(post.deadline) }}</strong>
                        <div v-if="post.is_displaced" style="margin-top: 4px">
                          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
                            <span class="displaced-badge">
                              {{ post.original_deadline ? '🔄 موعد مُرحّل' : '⏱️ ساعات مُرحّلة' }}
                            </span>
                            <button
                              v-if="isManager && post.original_deadline"
                              type="button"
                              class="restore-deadline-mini-btn"
                              title="استرجاع موعد التسليم الأصلي ↩️"
                              @click="$emit('restore-deadline', post)"
                            >
                              ↩️ استرجاع
                            </button>
                            <button
                              v-else-if="post.designer_id"
                              type="button"
                              class="restore-deadline-mini-btn"
                              title="إدارة الساعات في خطة اليوم"
                              @click="$router.push({ path: '/today-board', query: { user_id: post.designer_id } })"
                            >
                              ⏱️ خطة اليوم
                            </button>
                          </div>
                          <small v-if="post.original_deadline" style="display: block; font-size: 11px; color: #8fa0d4; margin-top: 2px">
                            الموعد الأصلي: {{ formatDeadlineDisplay(post.original_deadline) }}
                          </small>
                        </div>
                      </div>
                    </li>

                    <li v-if="!isMediaBuyer && !isDesignerOrEditor">
                      <span class="info-icon">👨‍🎨</span>
                      <div class="info-data">
                        <span class="info-label">المنفذ</span>
                        <strong class="info-value text-blue">{{ getUserName(post.designer_id) }}</strong>
                      </div>
                    </li>

                    <li v-if="post.ad_platform">
                      <span class="info-icon">📢</span>
                      <div class="info-data">
                        <span class="info-label">منصة الإعلان</span>
                        <strong class="info-value">
                          {{ Array.isArray(post.ad_platform) ? post.ad_platform.join(', ') : post.ad_platform }}
                        </strong>
                      </div>
                    </li>

                    <li>
                      <span class="info-icon">💰</span>
                      <div class="info-data">
                        <span class="info-label">حالة التمويل</span>
                        <strong class="info-value">{{ post.finance_status || 'غير ممول' }}</strong>
                      </div>
                    </li>

                    <li v-if="post.finance_cost !== null && post.finance_cost !== undefined && post.finance_cost !== ''">
                      <span class="info-icon">💵</span>
                      <div class="info-data">
                        <span class="info-label">تكلفة التمويل</span>
                        <strong class="info-value">{{ post.finance_cost }} $</strong>
                      </div>
                    </li>

                    <li v-if="post.finance_days !== null && post.finance_days !== undefined && post.finance_days !== ''">
                      <span class="info-icon">📅</span>
                      <div class="info-data">
                        <span class="info-label">أيام التمويل</span>
                        <strong class="info-value">{{ post.finance_days }} يوم</strong>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="report-main">
                <div v-if="!isMediaBuyer" class="premium-card highlight-card">
                  <div class="card-header-flex">
                    <h3 class="card-title" style="margin: 0">📝 تفاصيل المحتوى</h3>
                    <div class="tags-group">
                      <span class="premium-tag tag-type">{{ post.post_type || 'نوع غير محدد' }}</span>
                      <span v-for="obj in post.objective_array" :key="obj" class="premium-tag tag-objective">
                        🎯 {{ obj === 'آخر' ? post.custom_objective : obj }}
                      </span>
                    </div>
                  </div>

                  <div class="content-blocks">
                    <div class="text-block">
                      <span class="block-label">💡 الفكرة التفصيلية</span>
                      <div class="block-content">{{ post.detailed_idea || 'لا يوجد تفاصيل إضافية عن الفكرة.' }}</div>
                    </div>

                    <div class="text-block">
                      <span class="block-label">✍️ الكابشن (Caption)</span>
                      <div class="block-content caption-box">{{ post.caption || 'لم يتم كتابة الكابشن بعد.' }}</div>
                    </div>

                    <div class="text-block-grid">
                      <div class="text-block small-block">
                        <span class="block-label">🗣️ TOV</span>
                        <div class="block-content">{{ post.tov || '---' }}</div>
                      </div>
                      <div class="text-block small-block">
                        <span class="block-label">👉 CTA</span>
                        <div class="block-content">{{ post.call_to_action || '---' }}</div>
                      </div>
                      <div class="text-block small-block">
                        <span class="block-label">#️⃣ Hashtags</span>
                        <div class="block-content hashtags-box">{{ post.hashtags || '---' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="premium-card links-card" :style="!isMediaBuyer ? 'margin-top: 24px;' : ''">
                  <h3 class="card-title">🔗 {{ isMediaBuyer ? 'الروابط والتسليمات' : 'المراجع والروابط' }}</h3>
                  <div class="links-grid">
                    <div v-if="!isMediaBuyer" class="link-group">
                      <span class="group-label">روابط المرجعية (References)</span>
                      <div v-if="extractUrls(post.reference_link).length" class="premium-links-container">
                        <a
                          v-for="(url, i) in extractUrls(post.reference_link)"
                          :key="i"
                          :href="url"
                          target="_blank"
                          class="premium-btn-link ref-link"
                        >
                          <span class="link-icon">📑</span> {{ getUrlLabel(url, i) }}
                        </a>
                      </div>
                      <div v-else class="no-data">لا توجد مراجع</div>
                    </div>

                    <div class="link-group">
                      <span class="group-label">روابط التسليم (Deliverables)</span>

                      <div v-if="canEditDelivery(post)" class="modal-delivery-edit mt-2 mb-2">
                        <div class="relative">
                          <input
                            v-model="post.delivery_links"
                            type="url"
                            :placeholder="
                              isFolderAllowedForPostType(post?.post_type)
                                ? 'أدخل رابط مجلد أو ملف جوجل درايف للتسليم...'
                                : 'أدخل رابط ملف جوجل درايف أو دوكس للتسليم...'
                            "
                            dir="ltr"
                            class="modal-delivery-input"
                            :class="{ 'border-red-500': isDeliveryInvalid(post) }"
                            @input="handleDeliveryInput(post)"
                            @blur="$emit('auto-save', post, 'delivery_links')"
                          />
                        </div>
                        <p v-if="isDeliveryInvalid(post)" class="modal-error-msg">
                          <span>⚠️</span>
                          <span>{{ getDeliveryError(post) }}</span>
                        </p>

                        <div class="mt-2 flex gap-2">
                          <button
                            v-if="post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض'"
                            :disabled="!isPostDeliveryValid(post)"
                            :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                            :title="!isPostDeliveryValid(post) ? getDeliveryError(post) || 'رابط البوست غير صالح' : 'إعادة إرسال للمراجعة'"
                            class="primary-btn reject-submit-btn"
                            style="font-size: 11px; padding: 6px 12px"
                            @click="$emit('resubmit', post)"
                          >
                            إعادة إرسال للمراجعة 🔄
                          </button>
                          <button
                            v-else
                            :disabled="!isPostDeliveryValid(post)"
                            :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                            :title="!isPostDeliveryValid(post) ? getDeliveryError(post) || 'رابط البوست غير صالح' : 'تسجيل التسليم'"
                            class="primary-btn submit-delivery-btn"
                            style="font-size: 11px; padding: 6px 12px"
                            @click="$emit('mark-delivered', post)"
                          >
                            {{ post.delivered_at ? 'تحديث وقت التسليم' : 'تسجيل التسليم ✅' }}
                          </button>
                        </div>
                      </div>

                      <div v-if="extractUrls(post.delivery_links).length" class="premium-links-container">
                        <a
                          v-for="(url, i) in extractUrls(post.delivery_links)"
                          :key="i"
                          :href="url"
                          target="_blank"
                          class="premium-btn-link del-link"
                        >
                          <span class="link-icon">📁</span> {{ getUrlLabel(url, i) }}
                        </a>
                      </div>
                      <div v-else-if="!canEditDelivery(post)" class="no-data">لم يتم تسليم ملفات بعد</div>
                    </div>

                    <div class="link-group mt-3" style="border-top: 1px dashed rgba(255, 255, 255, 0.15); padding-top: 12px">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="group-label mb-0">📦 التسليم النهائي للأرشفة (Google Drive Folder)</span>
                        <span
                          v-if="hasConfirmedFinalDelivery(post) && !post._editingFinalLink"
                          class="modal-badge-locked"
                          title="تم تثبيت الرابط ولا يمكن تعديله إلا من قِبل المدير"
                        >
                          🔒 مقفل (متاح للمدير فقط)
                        </span>
                      </div>

                      <div v-if="!isPostFullyApproved(post)" class="modal-locked-notice">
                        🔒 متاح بعد اعتماد وموافقة القسم والمدير معاً
                      </div>

                      <div v-else-if="hasConfirmedFinalDelivery(post)" class="modal-delivery-view-box">
                        <div class="premium-links-container">
                          <a :href="formatExternalUrl(post.final_delivery_link)" target="_blank" class="premium-btn-link del-link">
                            <span class="link-icon">📁</span> فتح مجلد الأرشيف ↗
                          </a>
                          <button
                            v-if="isManager"
                            type="button"
                            class="modal-edit-final-btn"
                            title="تعديل رابط الأرشفة (متاح للمدير فقط)"
                            @click="$emit('open-archive', post)"
                          >
                            ✏️ تعديل الرابط
                          </button>
                        </div>
                        <div class="final-delivered-badge mt-2" style="max-width: fit-content">
                          <span>🔒 مؤرشف</span>
                          <small v-if="post.final_delivered_at">{{ formatDeliveryDate(post.final_delivered_at) }}</small>
                        </div>
                      </div>

                      <div v-else-if="canAddFinalDeliveryCell" class="mt-2">
                        <button
                          type="button"
                          class="add-archive-btn"
                          style="max-width: 220px; padding: 8px 14px; font-size: 12px"
                          @click="$emit('open-archive', post)"
                        >
                          <span>＋ إضافة مجلد الأرشيف</span>
                        </button>
                      </div>

                      <div v-else class="no-data">لم يتم تسليم مجلد الأرشفة بعد</div>
                    </div>

                    <div v-if="hasPublishedLinks(post)" class="link-group">
                      <span class="group-label">تم النشر على (Live Links)</span>
                      <div class="premium-links-container">
                        <a
                          v-for="(link, platform) in post.published_links"
                          v-show="link"
                          :key="platform"
                          :href="link"
                          target="_blank"
                          class="premium-btn-link live-link"
                        >
                          <span class="link-icon">🌐</span> {{ platform }}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="post.notes" class="premium-card notes-card" style="margin-top: 24px">
                  <h3 class="card-title">📝 ملاحظات (Notes)</h3>
                  <div
                    class="notes-content"
                    style="white-space: pre-wrap; color: #cbd5e1; line-height: 1.6; background: rgba(255, 255, 255, 0.03); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05)"
                  >
                    {{ post.notes }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { formatExternalUrl, isFolderAllowedForPostType } from '@/utils/driveValidation'
import {
  canAddFinalDelivery,
  canEditDelivery,
  canEditTargetDate,
  extractUrls,
  formatDate,
  formatDeadlineDisplay,
  formatDeliveryDate,
  formatForDateInput,
  getDayName,
  getDeliveryError,
  getUrlLabel,
  handleDeliveryInput,
  hasConfirmedFinalDelivery,
  hasPublishedLinks,
  isDeliveryInvalid,
  isPostDeliveryValid,
  isPostFullyApproved,
} from '../utils/boardHelpers'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  post: { type: Object, default: null },
  allUsers: { type: Array, default: () => [] },
  currentUser: { type: Object, default: null },
  isManager: { type: Boolean, default: false },
  isAccountManager: { type: Boolean, default: false },
  isPlanDelivered: { type: Boolean, default: false },
  isMediaBuyer: { type: Boolean, default: false },
  isDesignerOrEditor: { type: Boolean, default: false },
})

defineEmits([
  'update:modelValue',
  'target-date-change',
  'restore-deadline',
  'auto-save',
  'resubmit',
  'mark-delivered',
  'open-archive',
])

const canEditTargetDateCell = computed(() =>
  canEditTargetDate(props.isPlanDelivered, props.isManager, props.isAccountManager),
)

const canAddFinalDeliveryCell = computed(() =>
  canAddFinalDelivery(props.post, props.currentUser, props.isManager),
)

const getUserName = (id) => {
  if (!id) return 'غير محدد'
  const user = props.allUsers.find((u) => u.id === id)
  return user ? user.name : 'غير محدد'
}
</script>
