<template>
  <div
    :id="'plan-card-' + plan.id"
    class="plan-card"
    :class="[
      'plan-card-' + plan.status,
      {
        'is-delayed': isDelayed,
        'is-targeted': isTargeted,
        'is-card-expanded': isExpanded,
        'is-card-collapsed': !isExpanded,
      },
    ]"
  >
    <div class="card-accent-bar" :class="'accent-' + plan.status"></div>

    <!-- رأس الكارت -->
    <div class="card-header-row">
      <div class="client-meta-group">
        <ClientAvatar
          :logo-url="plan.client?.logo_url"
          :name="plan.client?.name"
          size="44"
          rounded="12px"
          class="client-avatar-badge"
        />
        <div class="client-title-block">
          <h3 class="client-heading" :title="plan.client?.name">
            {{ plan.client?.name || 'عميل محذوف' }}
          </h3>
          <div v-if="plan.start_date || plan.end_date" class="plan-date-range">
            <span class="range-icon">📅</span>
            <span class="range-text">
              {{ formatShortDate(plan.start_date) }} ⭢ {{ formatShortDate(plan.end_date) }}
            </span>
          </div>
        </div>
      </div>

      <div class="card-top-right">
        <div :class="['card-status-badge', getPlanStatusInfo(plan.status).class]">
          <span class="pulse-indicator"></span>
          <span>{{ getPlanStatusInfo(plan.status).text }}</span>
        </div>

        <div v-if="isManager" class="card-quick-actions-bar">
          <div class="admin-quick-actions">
            <button
              v-if="plan.status !== 'completed'"
              class="quick-icon-btn wa-btn"
              type="button"
              title="تنبيه واتساب الذكي"
              aria-label="تنبيه واتساب"
              @click="$emit('smart-notify', plan)"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </button>
            <button
              v-permission="'plans.duplicate'"
              class="quick-icon-btn duplicate"
              type="button"
              title="استنساخ كقالب"
              aria-label="استنساخ كقالب"
              @click="$emit('duplicate', plan)"
            >
              <svg viewBox="0 0 24 24" width="14.5" height="14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button
              v-permission="'plans.edit'"
              class="quick-icon-btn edit"
              type="button"
              title="تعديل الخطة"
              aria-label="تعديل الخطة"
              @click="$emit('edit', plan)"
            >
              ✎
            </button>
            <button
              v-permission="'archive.manage'"
              class="quick-icon-btn archive"
              type="button"
              title="نقل الخطة إلى الأرشيف"
              aria-label="أرشفة الخطة"
              @click="$emit('archive', plan)"
            >
              🗄️
            </button>
            <button
              v-permission="'plans.delete'"
              class="quick-icon-btn delete"
              type="button"
              title="حذف الخطة"
              aria-label="حذف الخطة"
              @click="$emit('delete', plan.id)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- نوع الخطة وساعات العمل -->
    <div class="card-plan-type-row">
      <span
        :class="['plan-type-tag', getPlanTypeInfo(plan.plan_type).class]"
        :title="'نوع الخطة: ' + (plan.plan_type || 'غير محدد')"
      >
        <span class="plan-type-icon" aria-hidden="true">{{ getPlanTypeInfo(plan.plan_type).icon }}</span>
        <span class="plan-type-text">{{ plan.plan_type || 'عامة' }}</span>
      </span>

      <span
        v-if="isManager && Number(plan.total_estimated_hours) > 0"
        class="plan-hours-badge"
        :title="'إجمالي ساعات العمل التقديرية: ' + formatHours(plan.total_estimated_hours) + ' ساعة'"
      >
        ⏱️ {{ formatHours(plan.total_estimated_hours) }}س
      </span>
    </div>

    <!-- مخرجات الخطة -->
    <div v-if="plan.items && plan.items.length > 0" class="card-items-scope-row">
      <span
        v-for="item in plan.items"
        :key="item.id || item.item_name"
        class="card-scope-pill"
        :title="item.quantity + ' ' + item.item_name + (isManager && item.total_hours ? ' (' + item.total_hours + 'س)' : '')"
      >
        <strong class="pill-qty">{{ item.quantity }}</strong>
        <span class="pill-name">{{ item.item_name }}</span>
      </span>
    </div>

    <!-- شريط فريق العمل -->
    <div class="team-roles-strip">
      <span class="role-inline-tag" :title="'المسؤول: ' + (getRoleNames(plan.users, 'responsible') || 'غير محدد')">
        <span class="role-emoji">👑</span>
        <span class="role-lbl">المسؤول:</span>
        <span class="role-val">{{ getRoleNames(plan.users, 'responsible') || '—' }}</span>
      </span>

      <span v-if="plan.requires_review" class="role-separator">·</span>

      <span
        v-if="plan.requires_review"
        class="role-inline-tag"
        :title="'المراجع: ' + (getRoleNames(plan.users, 'reviewer') || 'غير محدد')"
      >
        <span class="role-emoji">👁️</span>
        <span class="role-lbl">المراجع:</span>
        <span class="role-val">{{ getRoleNames(plan.users, 'reviewer') || '—' }}</span>
      </span>

      <span class="role-separator">·</span>

      <span class="role-inline-tag" :title="'المنفذين: ' + (getRoleNames(plan.users, 'executor') || 'غير محدد')">
        <span class="role-emoji">⚡</span>
        <span class="role-lbl">المنفذين:</span>
        <span class="role-val">{{ getRoleNames(plan.users, 'executor') || '—' }}</span>
      </span>
    </div>

    <!-- الوضع المصغر -->
    <div v-if="!isExpanded" class="card-collapsed-footer">
      <div
        v-if="activeStageNum"
        class="card-mini-stage-strip"
        title="المرحلة الحالية - انقر لتوسيع مراحل الخطة"
        @click="$emit('toggle-expand', plan.id)"
      >
        <div class="mini-stage-leading">
          <span class="mini-stage-dot" :class="getStageState(plan, activeStageNum).class"></span>
          <span class="mini-stage-title">المرحلة {{ activeStageNum }}: {{ getStageName(activeStageNum) }}</span>
        </div>
        <span class="mini-stage-chip" :class="getStageState(plan, activeStageNum).class">
          {{ getStageState(plan, activeStageNum).label }}
        </span>
      </div>

      <div class="card-bottom-actions-row">
        <router-link
          v-if="canOpenSpreadsheet"
          :to="`/plan-board/${plan.id}`"
          class="card-quick-spreadsheet-btn"
          title="فتح لوحة المحتوى (Spreadsheet) مباشرة"
          @click.stop
        >
          <span class="btn-rocket">🚀</span>
          <span>لوحة المحتوى</span>
        </router-link>

        <button
          type="button"
          class="card-bottom-expand-btn"
          :class="{ 'full-width': !canOpenSpreadsheet }"
          title="توسيع الكارت وعرض كافة المراحل والتفاصيل"
          @click.stop="$emit('toggle-expand', plan.id)"
        >
          <span>عرض مراحل وتفاصيل الخطة</span>
          <span class="btn-arrow">▾</span>
        </button>
      </div>
    </div>

    <!-- الوضع الموسع والمراحل الأربع -->
    <div v-if="isExpanded" class="card-expanded-body">
      <div class="card-timeline-accordion" dir="rtl">
        <div class="accordion-stages-list">
          <!-- المرحلة 1: تسليم ابتدائي -->
          <div
            class="accordion-stage-card"
            :class="[getStageState(plan, 1).class, { 'is-expanded': openStage === 1 }]"
          >
            <div class="stage-accordion-header" @click="$emit('toggle-stage', plan, 1)">
              <div class="stage-header-content">
                <div class="stage-header-top-row">
                  <div class="stage-title-group">
                    <span class="stage-node-badge">{{ getStageState(plan, 1).icon }}</span>
                    <span class="stage-header-title">1. تسليم ابتدائي</span>
                    <span v-if="activeStageNum === 1 && plan.status !== 'completed'" class="current-stage-tag">● النشطة</span>
                  </div>
                  <div class="header-status-side">
                    <span class="stage-status-chip" :class="getStageState(plan, 1).class">
                      {{ getStageState(plan, 1).label }}
                    </span>
                    <span class="chevron-arrow" :class="{ open: openStage === 1 }">▾</span>
                  </div>
                </div>
                <div
                  v-if="plan.planned_initial_delivery_date || plan.actual_initial_delivery_date"
                  class="stage-header-meta-row"
                >
                  <span v-if="getStageState(plan, 1).isDone && plan.actual_initial_delivery_date" class="meta-date-item">
                    <span class="meta-icon success-icon">✓</span>
                    <span class="meta-text">تم التسليم: {{ formatDate(plan.actual_initial_delivery_date) }}</span>
                  </span>
                  <span v-else-if="plan.planned_initial_delivery_date" class="meta-date-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">الموعد: {{ formatDate(plan.planned_initial_delivery_date) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-show="openStage === 1" class="stage-accordion-drawer">
              <div class="drawer-inner-content">
                <div class="drawer-info-grid">
                  <div class="drawer-meta-item">
                    <span class="meta-label">موعد التسليم:</span>
                    <span class="meta-val" :class="{ highlight: plan.planned_initial_delivery_date }">
                      {{ plan.planned_initial_delivery_date ? formatDate(plan.planned_initial_delivery_date) : 'غير محدد' }}
                    </span>
                  </div>
                  <div v-if="plan.actual_initial_delivery_date" class="drawer-meta-item">
                    <span class="meta-label">تم التسليم الفعلي:</span>
                    <span class="meta-val success-val">{{ formatDate(plan.actual_initial_delivery_date) }}</span>
                  </div>
                </div>

                <div
                  v-if="plan.planned_initial_delivery_date && (plan.status === 'pending' || plan.status === 'rejected')"
                  class="drawer-sla-bar"
                >
                  <div class="sla-meta-row">
                    <span class="sla-caption">مؤشر الإنجاز:</span>
                    <span class="sla-msg" :class="stage1Sla.class + '-text'">{{ stage1Sla.message }}</span>
                  </div>
                  <div class="sla-progress-track">
                    <div
                      class="sla-progress-fill"
                      :class="stage1Sla.class + '-bg'"
                      :style="{ width: stage1Sla.percentage + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="drawer-actions-row">
                  <div
                    v-if="canSubmitForReview && (plan.status === 'pending' || plan.status === 'rejected')"
                    class="main-action-wrap"
                  >
                    <button
                      class="drawer-primary-btn"
                      type="button"
                      :disabled="actionLoading === `submit-review-${plan.id}`"
                      title="تسليم الخطة للمراجعة"
                      @click="$emit('submit-review', plan)"
                    >
                      {{ actionLoading === `submit-review-${plan.id}` ? 'جارٍ...' : 'تسليم للمراجعة 📤' }}
                    </button>
                  </div>
                  <div
                    v-else-if="plan.actual_initial_delivery_date || ['under_review', 'reviewed', 'completed'].includes(plan.status)"
                    class="drawer-status-pill success-pill"
                  >
                    ✓ تم تسليم البلان للمراجعة
                  </div>

                  <div class="drawer-links-group">
                    <a
                      v-if="folders.review_link"
                      class="drawer-link-pill folder-rev"
                      :href="formatExternalUrl(folders.review_link)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="مجلد المراجعة (Google Drive) - لرفع ملفات البوستات"
                    >
                      <span>📁</span> مجلد الرفع
                    </a>
                    <a
                      v-if="linkExists && plan.status !== 'completed'"
                      class="drawer-link-pill plan-link"
                      :href="formatExternalUrl(planFileLink)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح رابط البلان"
                    >
                      <span>🔗</span> رابط البلان
                    </a>
                    <span
                      v-else-if="linkExists"
                      class="drawer-link-pill plan-link is-disabled"
                      title="تم إيقاف هذا الرابط لاكتمال التسليم النهائي للخطة"
                      aria-disabled="true"
                    >
                      <span>🔗</span> رابط البلان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- المرحلة 2: مراجعة داخلية -->
          <div
            class="accordion-stage-card"
            :class="[getStageState(plan, 2).class, { 'is-expanded': openStage === 2 }]"
          >
            <div class="stage-accordion-header" @click="$emit('toggle-stage', plan, 2)">
              <div class="stage-header-content">
                <div class="stage-header-top-row">
                  <div class="stage-title-group">
                    <span class="stage-node-badge">{{ getStageState(plan, 2).icon }}</span>
                    <span class="stage-header-title">2. مراجعة داخلية</span>
                    <span v-if="activeStageNum === 2 && plan.status !== 'completed'" class="current-stage-tag">● النشطة</span>
                  </div>
                  <div class="header-status-side">
                    <span class="stage-status-chip" :class="getStageState(plan, 2).class">
                      {{ getStageState(plan, 2).label }}
                    </span>
                    <span class="chevron-arrow" :class="{ open: openStage === 2 }">▾</span>
                  </div>
                </div>
                <div
                  v-if="plan.requires_review && (plan.planned_review_date || plan.actual_review_date)"
                  class="stage-header-meta-row"
                >
                  <span v-if="getStageState(plan, 2).isDone && plan.actual_review_date" class="meta-date-item">
                    <span class="meta-icon success-icon">✓</span>
                    <span class="meta-text">تم الاعتماد: {{ formatDate(plan.actual_review_date) }}</span>
                  </span>
                  <span v-else-if="plan.planned_review_date" class="meta-date-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">الموعد: {{ formatDate(plan.planned_review_date) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-show="openStage === 2" class="stage-accordion-drawer">
              <div class="drawer-inner-content">
                <template v-if="plan.requires_review">
                  <div class="drawer-info-grid">
                    <div class="drawer-meta-item">
                      <span class="meta-label">موعد الإنهاء:</span>
                      <span class="meta-val">{{ plan.planned_review_date ? formatDate(plan.planned_review_date) : 'غير محدد' }}</span>
                    </div>
                    <div v-if="plan.actual_review_date" class="drawer-meta-item">
                      <span class="meta-label">تم الاعتماد في:</span>
                      <span class="meta-val success-val">{{ formatDate(plan.actual_review_date) }}</span>
                    </div>
                  </div>

                  <div
                    v-if="plan.planned_review_date && (plan.status === 'under_review' || (!plan.planned_initial_delivery_date && ['pending', 'rejected'].includes(plan.status)))"
                    class="drawer-sla-bar"
                  >
                    <div class="sla-meta-row">
                      <span class="sla-caption">مؤشر ديدلاين المراجعة:</span>
                      <span class="sla-msg" :class="stage2Sla.class + '-text'">{{ stage2Sla.message }}</span>
                    </div>
                    <div v-if="!['reviewed', 'completed'].includes(plan.status)" class="sla-progress-track">
                      <div
                        class="sla-progress-fill"
                        :class="stage2Sla.class + '-bg'"
                        :style="{ width: stage2Sla.percentage + '%' }"
                      ></div>
                    </div>
                  </div>
                </template>
                <div v-else class="drawer-skipped-msg">
                  <span>— هذه الخطة لا تتطلب مراجعة داخلية —</span>
                </div>

                <div class="drawer-actions-row">
                  <div v-if="isReviewer && plan.status === 'under_review'" class="duo-action-btns">
                    <button
                      v-permission="'plans.approve'"
                      class="drawer-action-btn accept-btn"
                      :disabled="actionLoading === `approve-${plan.id}`"
                      @click="$emit('approve', plan)"
                    >
                      اعتماد الخطة ✅
                    </button>
                    <button
                      v-permission="'plans.reject'"
                      class="drawer-action-btn reject-btn"
                      :disabled="actionLoading === `reject-${plan.id}`"
                      @click="$emit('reject', plan)"
                    >
                      طلب تعديلات ❌
                    </button>
                  </div>
                  <div v-else-if="plan.status === 'under_review'" class="drawer-status-pill warning-pill">
                    <span>⏳ الخطة قيد المراجعة الداخلية حالياً</span>
                  </div>
                  <div v-else-if="plan.status === 'rejected'" class="main-action-wrap">
                    <button class="drawer-action-btn rejections-btn" type="button" @click="$emit('open-rejections', plan)">
                      عرض أسباب الرفض والملاحظات 📄
                    </button>
                  </div>
                  <span v-else-if="plan.requires_review && plan.status === 'pending'" class="drawer-muted-hint">
                    بانتظار التسليم الابتدائي للمراجعة
                  </span>
                  <div
                    v-else-if="plan.requires_review && ['reviewed', 'completed'].includes(plan.status)"
                    style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap"
                  >
                    <span class="drawer-status-pill success-pill">✓ تم إنهاء المراجعة والاعتماد بنجاح</span>
                    <button
                      v-if="canNotifyClient"
                      class="drawer-action-btn notify-client-pill-btn"
                      type="button"
                      title="إرسال رسالة واتساب لممثلي العميل لإعلامهم بانتهاء المراجعة"
                      @click="$emit('notify-client', plan)"
                    >
                      <span>💬</span> إخطار العميل
                    </button>
                    <button
                      v-if="canNotifyClient && groupLinks.length > 0"
                      class="drawer-action-btn notify-client-group-pill-btn"
                      type="button"
                      :title="`إبلاغ جروبات العميل (${groupLinks.length} جروب متاح)`"
                      @click="$emit('notify-client-groups', plan, 'review_done')"
                    >
                      <span>👥</span> إبلاغ جروب العميل
                      <span v-if="groupLinks.length > 1" class="group-count-badge">{{ groupLinks.length }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- المرحلة 3: متابعة مع العميل -->
          <div
            class="accordion-stage-card"
            :class="[getStageState(plan, 3).class, { 'is-expanded': openStage === 3 }]"
          >
            <div class="stage-accordion-header" @click="$emit('toggle-stage', plan, 3)">
              <div class="stage-header-content">
                <div class="stage-header-top-row">
                  <div class="stage-title-group">
                    <span class="stage-node-badge">{{ getStageState(plan, 3).icon }}</span>
                    <span class="stage-header-title">3. متابعة مع العميل</span>
                    <span v-if="activeStageNum === 3 && plan.status !== 'completed'" class="current-stage-tag">● النشطة</span>
                  </div>
                  <div class="header-status-side">
                    <span class="stage-status-chip" :class="getStageState(plan, 3).class">
                      {{ getStageState(plan, 3).label }}
                    </span>
                    <span class="chevron-arrow" :class="{ open: openStage === 3 }">▾</span>
                  </div>
                </div>
                <div
                  v-if="isClientApproved || followUps.length > 0"
                  class="stage-header-meta-row"
                >
                  <span v-if="isClientApproved" class="meta-date-item">
                    <span class="meta-icon success-icon">✓</span>
                    <span class="meta-text">معتمد من العميل</span>
                  </span>
                  <span v-else-if="followUps.length > 0" class="meta-date-item">
                    <span class="meta-icon">💬</span>
                    <span class="meta-text">{{ followUps.length }} ملاحظة مسجلة</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-show="openStage === 3" class="stage-accordion-drawer">
              <div class="drawer-inner-content">
                <div class="followup-drawer-info">
                  <div class="followup-count-tag" :class="{ 'has-items': followUps.length > 0 }">
                    <span class="badge-num">{{ followUps.length }}</span>
                    <span>ملاحظات وتحديثات مسجلة مع العميل</span>
                  </div>

                  <div
                    v-if="followUps.length > 0"
                    class="latest-feedback-card"
                    :title="followUps[followUps.length - 1]?.client_feedback"
                  >
                    <span class="quote-icon">💬</span>
                    <span class="feedback-text">
                      آخر ملاحظة:
                      {{
                        followUps[followUps.length - 1]?.client_feedback
                          ? followUps[followUps.length - 1].client_feedback.length > 55
                            ? followUps[followUps.length - 1].client_feedback.slice(0, 55) + '...'
                            : followUps[followUps.length - 1].client_feedback
                          : 'تحديث مسجل'
                      }}
                    </span>
                  </div>
                  <span v-else-if="plan.status === 'completed'" class="drawer-muted-hint success-text">
                    تمت المتابعة مع العميل واستكمال الخطة
                  </span>
                  <span v-else-if="plan.status === 'reviewed'" class="drawer-muted-hint ready-text">
                    الخطة معتمدة داخلياً وجاهزة لإرسالها للعميل وتدوين الملاحظات
                  </span>
                  <span v-else class="drawer-muted-hint">تُتاح المتابعة بعد استكمال المراجعة الداخلية</span>
                </div>

                <div class="drawer-actions-row">
                  <button
                    class="drawer-action-btn client-approval-btn"
                    :class="{ 'is-approved': isClientApproved }"
                    type="button"
                    :disabled="actionLoading === `client-approval-${plan.id}` || (!isClientApproved && !canApproveClient(plan))"
                    :title="
                      isClientApproved
                        ? plan.status === 'completed'
                          ? 'الخطة معتمدة ومكتملة'
                          : 'الخطة معتمدة من العميل (اضغط لإلغاء الاعتماد)'
                        : !canApproveClient(plan)
                          ? 'غير متاح قبل استكمال المراجعة الداخلية'
                          : 'اعتماد العميل لفتح مرحلة التسليم النهائي'
                    "
                    @click="$emit('toggle-client-approval', plan)"
                  >
                    <span v-if="actionLoading === `client-approval-${plan.id}`">⏳</span>
                    <span v-else-if="isClientApproved">✅</span>
                    <span v-else>⭐</span>
                    <span>{{ isClientApproved ? 'تم اعتماد العميل ✅' : 'اعتماد العميل' }}</span>
                  </button>

                  <button
                    v-if="canNotifyClient"
                    class="drawer-action-btn notify-client-btn"
                    type="button"
                    title="إرسال رسالة واتساب لممثلي العميل لإعلامهم بانتهاء المراجعة الداخلية وبانتظار مراجعتهم"
                    @click="$emit('notify-client', plan)"
                  >
                    <span>💬</span> إخطار العميل بانتهاء المراجعة (واتساب)
                  </button>
                  <button
                    v-if="canNotifyClient && groupLinks.length > 0"
                    class="drawer-action-btn notify-client-group-btn"
                    type="button"
                    :title="`إبلاغ جروبات العميل (${groupLinks.length} جروب متاح)`"
                    @click="$emit('notify-client-groups', plan, 'review_done')"
                  >
                    <span>👥</span> إبلاغ جروبات العميل
                    <span v-if="groupLinks.length > 1" class="group-count-badge">{{ groupLinks.length }}</span>
                  </button>
                  <button
                    class="drawer-action-btn followup-btn"
                    type="button"
                    :disabled="plan.requires_review && !['reviewed', 'completed'].includes(plan.status) && followUps.length === 0"
                    :title="
                      plan.requires_review && !['reviewed', 'completed'].includes(plan.status) && followUps.length === 0
                        ? 'غير متاح قبل انتهاء المراجعة الداخلية'
                        : 'فتح سجل ومتابعات العميل'
                    "
                    @click="$emit('open-followups', plan)"
                  >
                    <span>💬</span> إدارة متابعات وملاحظات العميل ({{ followUps.length }})
                  </button>

                  <a
                    v-for="(grp, gIdx) in groupLinks"
                    :key="'cg' + gIdx"
                    :href="grp.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="drawer-action-btn client-group-pill"
                    :class="`platform-${grp.platform || 'other'}`"
                    :title="grp.title ? `إبلاغ ${grp.title} (نسخ نص الخطة وفتح الرابط)` : 'إبلاغ جروب العميل'"
                    @click.prevent="$emit('notify-direct-group', grp, plan, 'review_done')"
                  >
                    <span>{{ getGroupPlatformIcon(grp.platform) }}</span>
                    <span>{{ grp.title || getGroupPlatformLabel(grp.platform) }} ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- المرحلة 4: التسليم النهائي -->
          <div
            class="accordion-stage-card"
            :class="[
              getStageState(plan, 4).class,
              {
                'is-expanded': openStage === 4,
                'is-stage-disabled': !isClientApproved && plan.status !== 'completed',
              },
            ]"
          >
            <div class="stage-accordion-header" @click="$emit('toggle-stage', plan, 4)">
              <div class="stage-header-content">
                <div class="stage-header-top-row">
                  <div class="stage-title-group">
                    <span class="stage-node-badge">{{ getStageState(plan, 4).icon }}</span>
                    <span class="stage-header-title">4. التسليم النهائي</span>
                    <span v-if="activeStageNum === 4 && plan.status !== 'completed'" class="current-stage-tag">● النشطة</span>
                  </div>
                  <div class="header-status-side">
                    <span class="stage-status-chip" :class="getStageState(plan, 4).class">
                      {{ getStageState(plan, 4).label }}
                    </span>
                    <span class="chevron-arrow" :class="{ open: openStage === 4 }">▾</span>
                  </div>
                </div>
                <div v-if="plan.planned_delivery_date || plan.actual_delivery_date" class="stage-header-meta-row">
                  <span v-if="getStageState(plan, 4).isDone && plan.actual_delivery_date" class="meta-date-item">
                    <span class="meta-icon success-icon">✓</span>
                    <span class="meta-text">تم التسليم: {{ formatDate(plan.actual_delivery_date) }}</span>
                  </span>
                  <span v-else-if="plan.planned_delivery_date" class="meta-date-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">الموعد: {{ formatDate(plan.planned_delivery_date) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-show="openStage === 4" class="stage-accordion-drawer">
              <div class="drawer-inner-content">
                <div v-if="!isClientApproved && plan.status !== 'completed'" class="stage-locked-notice">
                  <span class="locked-icon">🔒</span>
                  <div class="locked-info">
                    <strong class="locked-title">المرحلة الرابعة غير مفعلة حالياً</strong>
                    <p class="locked-desc">
                      يلزم تسجيل اعتماد العميل في (المرحلة 3: متابعة مع العميل) أولاً ليتم فتح هذه المرحلة وتأكيد التسليم النهائي.
                    </p>
                  </div>
                </div>

                <div class="drawer-info-grid">
                  <div class="drawer-meta-item">
                    <span class="meta-label">موعد التسليم النهائي:</span>
                    <span class="meta-val" :class="{ highlight: plan.planned_delivery_date }">
                      {{ plan.planned_delivery_date ? formatDate(plan.planned_delivery_date) : 'غير محدد' }}
                    </span>
                  </div>
                  <div v-if="plan.actual_delivery_date" class="drawer-meta-item">
                    <span class="meta-label">تم التسليم في:</span>
                    <span class="meta-val success-val">{{ formatDate(plan.actual_delivery_date) }}</span>
                  </div>
                </div>

                <div v-if="plan.planned_delivery_date" class="drawer-sla-bar">
                  <div class="sla-meta-row">
                    <span class="sla-caption">ديدلاين العميل:</span>
                    <span class="sla-msg" :class="stage4Sla.class + '-text'">{{ stage4Sla.message }}</span>
                  </div>
                  <div v-if="plan.status !== 'completed'" class="sla-progress-track">
                    <div
                      class="sla-progress-fill"
                      :class="stage4Sla.class + '-bg'"
                      :style="{ width: stage4Sla.percentage + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="drawer-actions-row">
                  <div v-if="plan.status === 'completed'" class="drawer-status-pill success-pill">
                    <span>🎉 تم التسليم النهائي للعميل بنجاح</span>
                  </div>
                  <div v-else-if="!isClientApproved" class="drawer-status-pill locked-pill">
                    <span>🔒 غير مفعلة بانتظار اعتماد العميل</span>
                  </div>
                  <div
                    v-else-if="isResponsible && (plan.status === 'reviewed' || (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')))"
                    class="main-action-wrap"
                  >
                    <button
                      class="drawer-primary-btn final-btn"
                      type="button"
                      :disabled="actionLoading === `delivery-${plan.id}`"
                      title="تأكيد التسليم النهائي"
                      @click="$emit('final-delivery', plan)"
                    >
                      {{ actionLoading === `delivery-${plan.id}` ? 'جارٍ...' : 'تأكيد التسليم النهائي ✅' }}
                    </button>
                  </div>
                  <span v-else-if="plan.requires_review && !['reviewed', 'completed'].includes(plan.status)" class="drawer-muted-hint">
                    بانتظار إنهاء المراجعة الداخلية
                  </span>
                  <span v-else class="drawer-muted-hint">بانتظار إنهاء الدورة</span>

                  <div v-if="folders.final_delivery_link || linkExists" class="drawer-links-group">
                    <a
                      v-if="folders.final_delivery_link"
                      class="drawer-link-pill folder-final"
                      :href="formatExternalUrl(folders.final_delivery_link)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="مجلد التسليم النهائي 📂 (Google Drive)"
                    >
                      <span>📂</span> مجلد التسليم النهائي
                    </a>
                    <a
                      v-if="linkExists && plan.status === 'completed'"
                      class="drawer-link-pill plan-link"
                      :href="formatExternalUrl(planFileLink)"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="فتح رابط البلان النهائي"
                    >
                      <span>🔗</span> رابط البلان النهائي
                    </a>
                    <span
                      v-else-if="linkExists"
                      class="drawer-link-pill plan-link is-disabled"
                      title="رابط البلان النهائي غير متاح إلا بعد إتمام التسليم النهائي أولاً"
                      aria-disabled="true"
                    >
                      <span>🔗</span> رابط البلان النهائي
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- فوتر الكارت الموسع -->
      <div class="card-footer-controls">
        <div class="card-utilities-bar">
          <div class="secondary-actions-group">
            <button
              v-if="reviewHistories.length > 0"
              class="cluster-btn history"
              type="button"
              title="سجل حركات واعتمادات الخطة"
              @click="$emit('open-history', plan)"
            >
              <span>📋</span> سجل الحركات ({{ reviewHistories.length }})
            </button>

            <button
              v-if="plan.reference_links && plan.reference_links.length > 0"
              class="cluster-btn references"
              type="button"
              title="المراجع المساعدة المرفقة"
              @click="$emit('open-references', plan)"
            >
              <span>🔗</span> المراجع ({{ plan.reference_links.length }})
            </button>

            <button
              class="cluster-btn details"
              type="button"
              title="عرض تفاصيل الخطة والديدلاين والملاحظات"
              @click="$emit('open-details', plan)"
            >
              <span>✎</span> تفاصيل الخطة
            </button>
          </div>

          <div v-if="isManager" class="card-toggles-stack">
            <AutoRecurrenceToggle
              :plan-id="plan.id"
              :model-value="Boolean(plan.is_recurring)"
              compact
              class="compact-recurrence-toggle"
              @update:model-value="plan.is_recurring = $event"
            />
            <EmployeeClientNotifyToggle
              :plan-id="plan.id"
              :model-value="Boolean(plan.allow_client_notify_by_employee)"
              compact
              class="compact-notify-toggle"
              @update:model-value="plan.allow_client_notify_by_employee = $event"
            />
          </div>
        </div>

        <router-link v-if="canOpenSpreadsheet" :to="`/plan-board/${plan.id}`" class="spreadsheet-link-banner">
          <span>فتح لوحة المحتوى (Spreadsheet)</span>
          <span class="rocket-icon">🚀</span>
        </router-link>
      </div>

      <button
        type="button"
        class="card-expanded-bottom-close-btn"
        title="طي مراحل وتفاصيل الخطة وتصغير الكارت"
        @click="$emit('toggle-expand', plan.id)"
      >
        <span>طي مراحل وتفاصيل الخطة</span>
        <span class="close-icon">▲</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ClientAvatar from '@/components/ClientAvatar.vue'
import AutoRecurrenceToggle from '@/components/AutoRecurrenceToggle.vue'
import EmployeeClientNotifyToggle from '@/components/EmployeeClientNotifyToggle.vue'
import { getPlanTypeInfo } from '@/utils/planTheme'
import { getDeadlineStatus } from '@/utils/timeHelper'
import { formatExternalUrl } from '@/utils/driveValidation'
import { getGroupPlatformIcon, getGroupPlatformLabel } from '@/modules/clients/utils/clientLinks'
import {
  canApproveClient,
  formatDate,
  formatHours,
  formatShortDate,
  getActiveStageNumber,
  getClientGroupLinks,
  getFollowUps,
  getPlanFileLink,
  getPlanFolders,
  getPlanStatusInfo,
  getReviewHistories,
  getRoleNames,
  getStageName,
  getStageState,
  hasPlanLink,
  isPlanClientApproved,
} from '../utils/planHelpers'

const props = defineProps({
  plan: { type: Object, required: true },
  isManager: { type: Boolean, default: false },
  isTargeted: { type: Boolean, default: false },
  isDelayed: { type: Boolean, default: false },
  isExpanded: { type: Boolean, default: false },
  openStage: { type: Number, default: 0 },
  canOpenSpreadsheet: { type: Boolean, default: false },
  canSubmitForReview: { type: Boolean, default: false },
  isReviewer: { type: Boolean, default: false },
  isResponsible: { type: Boolean, default: false },
  canNotifyClient: { type: Boolean, default: false },
  actionLoading: { type: String, default: '' },
  currentTime: { type: Number, required: true },
  allClients: { type: Array, default: () => [] },
})

defineEmits([
  'toggle-expand',
  'toggle-stage',
  'smart-notify',
  'duplicate',
  'edit',
  'archive',
  'delete',
  'submit-review',
  'approve',
  'reject',
  'open-rejections',
  'notify-client',
  'notify-client-groups',
  'notify-direct-group',
  'toggle-client-approval',
  'open-followups',
  'final-delivery',
  'open-history',
  'open-references',
  'open-details',
])

const activeStageNum = computed(() => getActiveStageNumber(props.plan))
const folders = computed(() => getPlanFolders(props.plan))
const planFileLink = computed(() => getPlanFileLink(props.plan))
const linkExists = computed(() => hasPlanLink(props.plan))
const isClientApproved = computed(() => isPlanClientApproved(props.plan))
const followUps = computed(() => getFollowUps(props.plan))
const reviewHistories = computed(() => getReviewHistories(props.plan))
const groupLinks = computed(() => getClientGroupLinks(props.plan, props.allClients))

const stage1Sla = computed(() =>
  getDeadlineStatus(
    props.plan.created_at || props.plan.start_date,
    props.plan.planned_initial_delivery_date,
    props.plan.status,
    props.currentTime,
  ),
)

const stage2Sla = computed(() =>
  getDeadlineStatus(
    props.plan.actual_initial_delivery_date || props.plan.created_at || props.plan.start_date,
    props.plan.planned_review_date,
    ['reviewed', 'completed'].includes(props.plan.status) ? 'completed' : props.plan.status,
    props.currentTime,
  ),
)

const stage4Sla = computed(() =>
  getDeadlineStatus(
    props.plan.created_at || props.plan.start_date,
    props.plan.planned_delivery_date,
    props.plan.status,
    props.currentTime,
  ),
)
</script>
