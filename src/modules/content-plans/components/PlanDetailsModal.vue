<template>
  <Teleport to="body">
    <div v-if="plan" class="plans-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close')">
        <div class="modal-content plan-details-modal" role="dialog" style="width: min(560px, 100%) !important">
          <button class="modal-close" type="button" @click="$emit('close')">×</button>
          <div class="modal-icon">✎</div>
          <span class="eyebrow">تفاصيل الخطة</span>
          <h3>تفاصيل ومعلومات الخطة</h3>

          <div class="details-summary-card">
            <div class="summary-top-row">
              <div class="summary-client-info">
                <span class="summary-client-title">{{ plan.client?.name || 'عميل محذوف' }}</span>
                <span
                  :class="['summary-plan-tag', 'plan-type-tag', getPlanTypeInfo(plan.plan_type).class]"
                  :title="'نوع الخطة: ' + (plan.plan_type || 'غير محدد')"
                >
                  <span class="plan-type-icon" aria-hidden="true">{{ getPlanTypeInfo(plan.plan_type).icon }}</span>
                  <span class="plan-type-text">{{ plan.plan_type }}</span>
                </span>
              </div>

              <div :class="['status-badge', getPlanStatusInfo(plan.status).class]">
                <i></i>{{ getPlanStatusInfo(plan.status).text }}
              </div>
            </div>

            <div class="deadlines-timeline-grid">
              <div v-if="plan.requires_review" class="timeline-box">
                <div class="timeline-box-header">
                  <span class="tb-title">📤 موعد التسليم الابتدائي (المنفذ):</span>
                  <span class="tb-val" :class="{ highlight: plan.planned_initial_delivery_date }">
                    {{ plan.planned_initial_delivery_date ? formatDate(plan.planned_initial_delivery_date) : 'غير محدد' }}
                  </span>
                </div>
                <div
                  v-if="plan.actual_initial_delivery_date"
                  class="delivery-status-pill success"
                  title="تاريخ أول محاولة تسليم تم تسجيلها"
                >
                  <span class="pill-icon">✓</span>
                  <span>تاريخ أول تسليم للمراجعة: <strong>{{ formatDate(plan.actual_initial_delivery_date) }}</strong></span>
                </div>
                <div v-else class="delivery-status-pill pending">
                  <span class="pill-icon">⏳</span>
                  <span>لم يتم أول تسليم للمراجعة بعد</span>
                </div>
              </div>

              <div v-if="plan.requires_review" class="timeline-box">
                <div class="timeline-box-header">
                  <span class="tb-title">🔍 موعد إنهاء المراجعة:</span>
                  <span class="tb-val">{{ formatDate(plan.planned_review_date) }}</span>
                </div>
                <div v-if="plan.actual_review_date" class="delivery-status-pill success">
                  <span class="pill-icon">✓</span>
                  <span>تمت المراجعة: <strong>{{ formatDate(plan.actual_review_date) }}</strong></span>
                </div>
              </div>

              <div class="timeline-box">
                <div class="timeline-box-header">
                  <span class="tb-title">🏁 موعد التسليم النهائي:</span>
                  <span class="tb-val">{{ formatDate(plan.planned_delivery_date) }}</span>
                </div>
                <div v-if="plan.actual_delivery_date" class="delivery-status-pill success">
                  <span class="pill-icon">✓</span>
                  <span>تم التسليم النهائي: <strong>{{ formatDate(plan.actual_delivery_date) }}</strong></span>
                </div>
              </div>
            </div>

            <div v-if="plan.items && plan.items.length > 0" class="details-scope-block">
              <div class="details-scope-header">
                <div class="details-scope-title">
                  <span>📦</span> عناصر ومخرجات الخطة<span v-if="isManager"> وساعات العمل</span> ({{ plan.items.length }})
                </div>
                <div v-if="isManager" class="details-scope-badge">
                  ⏱️ <strong>{{ formatHours(plan.total_estimated_hours || calculateItemsHours(plan.items)) }}</strong> ساعة عمل
                </div>
              </div>
              <div class="details-scope-grid">
                <div v-for="item in plan.items" :key="item.id" class="details-scope-card">
                  <div class="scope-card-main">
                    <span class="scope-item-bullet">•</span>
                    <strong class="scope-card-title">{{ item.item_name }}</strong>
                  </div>
                  <div class="scope-card-metrics">
                    <span class="scope-metric-badge qty-badge">العدد: <strong>{{ item.quantity }}</strong></span>
                    <span v-if="isManager" class="scope-metric-badge hours-badge">{{ item.hours_per_unit }} س/وحدة</span>
                    <span v-if="isManager" class="scope-metric-badge total-badge">الإجمالي: <strong>{{ formatHours(item.total_hours) }} س</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="histories.length > 0" class="details-history-block">
              <div class="details-history-title">
                <span>📋</span> سجل المتابعة والمراجعات ({{ histories.length }})
              </div>
              <div class="history-timeline compact-timeline">
                <div v-for="(history, index) in histories" :key="'dh_' + index" class="timeline-item">
                  <div
                    class="tl-dot"
                    :class="history.action === 'approved' ? 'tl-green' : history.action === 'submitted' ? 'tl-blue' : 'tl-red'"
                  ></div>
                  <div class="tl-content">
                    <div class="tl-header">
                      <strong>
                        <template v-if="history.action === 'submitted'">
                          🚀 المنفذ: {{ history.reviewer?.name || history.user?.name || 'الموظف' }}
                        </template>
                        <template v-else>
                          🔍 المراجع: {{ history.reviewer?.name || history.user?.name || 'مجهول' }}
                        </template>
                      </strong>
                      <span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span>
                    </div>
                    <div
                      class="tl-action"
                      :class="history.action === 'approved' ? 'text-green' : history.action === 'submitted' ? 'text-blue' : 'text-red'"
                    >
                      <template v-if="history.action === 'submitted'">
                        🚀 قام {{ history.reviewer?.name || history.user?.name || 'الموظف' }} بتسليم الخطة للمراجعة
                      </template>
                      <template v-else-if="history.action === 'approved'">✅ وافق على الخطة واعتمدها</template>
                      <template v-else>❌ رفض الخطة وطلب تعديلات</template>
                    </div>
                    <div v-if="history.notes" class="tl-notes">{{ history.notes }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="plan.notes"
              class="details-notes-box"
              style="margin-top: 14px; padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 8px"
            >
              <div style="font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px">
                <span>📝</span> ملاحظات الخطة:
              </div>
              <div style="color: #e2e8f0; font-size: 13px; white-space: pre-wrap; line-height: 1.6">
                {{ plan.notes }}
              </div>
            </div>

            <div v-if="folders.review_link || folders.final_delivery_link" class="client-folders-modal-box">
              <span class="cf-box-title">📁 مجلدات العميل على Google Drive (لوصول سريع):</span>
              <div class="cf-box-links">
                <a
                  v-if="folders.review_link"
                  :href="formatExternalUrl(folders.review_link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cf-link-badge review"
                  title="فتح مجلد المراجعة"
                >
                  <span>📁</span> مجلد المراجعة ↗
                </a>
                <a
                  v-if="folders.final_delivery_link"
                  :href="formatExternalUrl(folders.final_delivery_link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cf-link-badge final"
                  title="فتح مجلد التسليم النهائي"
                >
                  <span>📂</span> مجلد التسليم النهائي ↗
                </a>
                <a
                  v-if="linkExists"
                  :href="formatExternalUrl(planFileLink)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cf-link-badge plan"
                  title="فتح رابط البلان"
                  style="border-color: rgba(96, 165, 250, 0.4); color: #93c5fd; background: rgba(59, 130, 246, 0.1)"
                >
                  <span>🔗</span> رابط البلان ↗
                </a>
              </div>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 20px; display: flex; justify-content: flex-end">
            <button type="button" class="secondary-btn" @click="$emit('close')">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { getPlanTypeInfo } from '@/utils/planTheme'
import { formatExternalUrl } from '@/utils/driveValidation'
import {
  calculateItemsHours,
  formatDate,
  formatHours,
  getPlanFileLink,
  getPlanFolders,
  getPlanStatusInfo,
  getReviewHistories,
  hasPlanLink,
} from '../utils/planHelpers'

const props = defineProps({
  plan: { type: Object, default: null },
  isManager: { type: Boolean, default: false },
})

defineEmits(['close'])

const histories = computed(() => getReviewHistories(props.plan))
const folders = computed(() => getPlanFolders(props.plan))
const planFileLink = computed(() => getPlanFileLink(props.plan))
const linkExists = computed(() => hasPlanLink(props.plan))
</script>
