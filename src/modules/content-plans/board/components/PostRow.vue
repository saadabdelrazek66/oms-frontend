<template>
  <tr :id="`post-row-${post.id}`" class="post-row" :class="{ 'urgent-row': post.is_urgent }">
    <td
      class="text-center readonly-cell row-num-cell"
      style="font-weight: 700; width: 65px; color: #8792be; vertical-align: middle"
    >
      <div v-if="isDesignerOrEditor" class="row-num-with-action">
        <span class="row-index" :title="`منشور #${index + 1}`">{{ index + 1 }}</span>
        <button class="icon-btn row-view-btn" title="عرض تفاصيل المنشور 👁️" @click="$emit('view', post)">
          👁️
        </button>
        <button
          type="button"
          class="icon-btn"
          :class="{ 'urgent-active-glow': post.is_urgent }"
          :title="post.is_urgent ? 'منشور عاجل 🚨 (اضغط لإلغاء العاجل)' : 'تحويل لمنشور عاجل ⚡ وإزاحة الفائض'"
          @click.stop="$emit('toggle-urgent', post)"
        >
          {{ post.is_urgent ? '🚨' : '⚡' }}
        </button>
        <span v-if="post.is_displaced" class="displaced-dot" :title="post.displaced_reason || 'منشور مُرحّل بقرار إداري 🔄'">
          🔄
        </span>
      </div>
      <template v-else>
        <div style="display: flex; align-items: center; justify-content: center; gap: 4px">
          <span>{{ index + 1 }}</span>
          <button
            type="button"
            class="icon-btn"
            :class="{ 'urgent-active-glow': post.is_urgent }"
            :title="post.is_urgent ? 'منشور عاجل 🚨 (اضغط لإلغاء العاجل)' : 'تحويل لمنشور عاجل ⚡ وإزاحة الفائض'"
            @click.stop="$emit('toggle-urgent', post)"
          >
            {{ post.is_urgent ? '🚨' : '⚡' }}
          </button>
          <span v-if="post.is_displaced" class="displaced-dot" :title="post.displaced_reason || 'منشور مُرحّل بقرار إداري 🔄'">
            🔄
          </span>
        </div>
      </template>
    </td>

    <td
      v-if="!isDesignerOrEditor"
      class="readonly-cell position-relative target-date-td"
      :class="`${publishDeadlineStatus.class}-border`"
    >
      <button class="icon-btn view-btn" title="عرض التفاصيل" @click="$emit('view', post)">👁️</button>

      <div
        v-if="canEditTargetDateCell"
        class="target-date-interactive-box"
        title="اضغط لتعديل تاريخ النشر المخطط 📅"
        @click="onTargetDateContainerClick"
      >
        <strong class="target-day-name">{{ getDayName(post.target_date) }}</strong>
        <span class="target-date-badge">
          <small>{{ formatDate(post.target_date) }}</small>
          <span class="cal-mini-icon">📅</span>
        </span>
        <input
          ref="targetDateInputRef"
          type="date"
          class="target-date-native-overlay"
          :value="formatForDateInput(post.target_date)"
          title="اختر تاريخ النشر المخطط"
          @click.stop="onDateInputClick"
          @change="$emit('target-date-change', post, $event)"
        />
      </div>

      <div
        v-else
        class="target-date-static-box"
        :title="isPlanDelivered ? 'تم قفل تعديل تاريخ النشر بعد إتمام التسليم النهائي للخطة 🔒' : ''"
      >
        <strong class="target-day-name">{{ getDayName(post.target_date) }}</strong>
        <small>{{ formatDate(post.target_date) }}</small>
        <div
          v-if="isPlanDelivered"
          class="plan-delivered-lock-tag"
          title="تم قفل تاريخ النشر المخطط نظراً لإتمام التسليم النهائي للخطة"
        >
          🔒 مقفل نهائياً
        </div>
      </div>

      <div v-if="post.is_urgent" class="urgent-badge" title="هذا المنشور ذو أولوية قصوى وعاجلة">🚨 عاجل</div>
      <div
        v-if="post.is_displaced"
        class="displaced-badge"
        :title="post.displaced_reason || 'تم ترحيل موعد تسليم المنشور لإفساح المجال لمنشور طارئ'"
      >
        🔄 ترحيل موعد التسليم
      </div>

      <div class="sla-indicator" style="margin-top: 5px">
        <span class="sla-msg" :class="`${publishDeadlineStatus.class}-text`">
          {{ publishDeadlineStatus.message }}
        </span>
        <div v-if="post.actual_publish_status !== 'تم النشر'" class="sla-progress-bg">
          <div
            class="sla-progress-fill"
            :class="`${publishDeadlineStatus.class}-bg`"
            :style="{ width: `${publishDeadlineStatus.percentage}%` }"
          ></div>
        </div>
      </div>
    </td>

    <td v-if="!isMediaBuyer && !isDesignerOrEditor">
      <div class="lock-wrapper">
        <select
          v-model="post.actual_publish_status"
          :class="post.actual_publish_status === 'لم يتم' ? 'text-red' : 'text-green'"
          :disabled="!canEditPublishAndNotes(post) || isFieldDisabled(post, 'actual_publish_status', isManager)"
          @change="$emit('publish-status-change', post, $event)"
        >
          <option value="لم يتم">لم يتم</option>
          <option value="تم النشر">تم النشر</option>
        </select>
        <span
          v-if="hasLockIcon(post, 'actual_publish_status')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'actual_publish_status')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isDesignerOrEditor">
      <div class="lock-wrapper">
        <input
          v-model="post.publishing_time"
          type="text"
          placeholder="--:--"
          dir="ltr"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'publishing_time', isManager)"
          @blur="$emit('auto-save', post, 'publishing_time')"
        />
        <span
          v-if="hasLockIcon(post, 'publishing_time')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'publishing_time')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <CustomMultiSelect
          v-model="post.publishing_platform"
          :options="publishingPlatformOptions"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'publishing_platform', isManager)"
          placeholder="اختر منصة..."
          @change="$emit('auto-save', post, 'publishing_platform')"
        />
        <span
          v-if="hasLockIcon(post, 'publishing_platform')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'publishing_platform')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isDesignerOrEditor" class="text-center">
      <div v-if="hasPublishedLinks(post)" class="published-links-preview">
        <a
          v-for="(link, platform) in post.published_links"
          v-show="link"
          :key="platform"
          :href="link"
          target="_blank"
          class="platform-link"
          :title="platform"
        >
          🔗 {{ platform }}
        </a>
        <button
          v-if="canEditLinksCell"
          class="icon-btn edit-links"
          title="تعديل الروابط"
          @click="$emit('open-links', post, false)"
        >
          ✏️
        </button>
      </div>
      <template v-else>
        <button
          v-if="canEditLinksCell"
          class="secondary-btn small-btn"
          @click="$emit('open-links', post, false)"
        >
          + إضافة روابط
        </button>
        <span v-else class="muted" style="font-size: 11px">لا توجد روابط</span>
      </template>
    </td>

    <td v-if="!isMediaBuyer && !isDesignerOrEditor">
      <div class="lock-wrapper">
        <select
          v-model="post.designer_id"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'designer_id', isManager)"
          @change="$emit('auto-save', post, 'designer_id')"
        >
          <option :value="null">لم يحدد</option>
          <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
        <span
          v-if="hasLockIcon(post, 'designer_id')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'designer_id')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer" style="min-width: 130px; padding: 4px">
      <div v-if="post.designer_id" class="execution-trigger">
        <span v-if="post.execution_started_at" class="badge started">
          🚀 بدأ:
          {{
            new Date(post.execution_started_at).toLocaleString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </span>
        <button
          v-else-if="canEditFields(post)"
          class="start-execution-btn"
          title="اضغط لبدء احتساب وقت التنفيذ"
          @click="$emit('start-execution', post)"
        >
          <span class="icon">▶️</span> تكليف وبدء العمل
        </button>
      </div>
    </td>

    <td v-if="!isMediaBuyer" :class="`${workDeadlineStatus.class}-border`" style="min-width: 145px; padding: 4px">
      <SmartDeadlinePicker
        v-model="post.deadline"
        :disabled="!canEditFields(post) || isFieldDisabled(post, 'deadline', isManager)"
        :is-locked="hasLockIcon(post, 'deadline')"
        :is-manager="isManager"
        :post="post"
        :execution-started-at="post.execution_started_at || post.created_at"
        @change="$emit('auto-save', post, 'deadline')"
        @unlock="$emit('unlock-field', post, 'deadline')"
      />

      <div v-if="post.deadline" class="sla-indicator" style="margin-top: 5px; margin-bottom: 5px">
        <span class="sla-msg" :class="`${workDeadlineStatus.class}-text`">
          {{ workDeadlineStatus.message }}
        </span>
        <div v-if="!post.delivered_at" class="sla-progress-bg">
          <div
            class="sla-progress-fill"
            :class="`${workDeadlineStatus.class}-bg`"
            :style="{ width: `${workDeadlineStatus.percentage}%` }"
          ></div>
        </div>
      </div>

      <div
        v-if="post.is_displaced"
        class="displaced-deadline-tag"
        :title="post.displaced_reason || 'تم ترحيل ساعات العمل أو موعد التسليم'"
      >
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px">
          <span v-if="post.original_deadline">🔄 موعد التسليم مُرحّل</span>
          <span v-else>⏱️ ساعات مُرحّلة {{ post.shifted_hours_to_future ? `(${post.shifted_hours_to_future} س)` : '' }}</span>
          <button
            v-if="isManager && post.original_deadline"
            type="button"
            class="restore-deadline-mini-btn"
            title="استرجاع موعد التسليم الأصلي ↩️"
            @click.stop="$emit('restore-deadline', post)"
          >
            ↩️
          </button>
          <button
            v-else-if="post.designer_id"
            type="button"
            class="restore-deadline-mini-btn"
            title="عرض وإدارة الترحيل في خطة اليوم"
            @click.stop="$router.push({ path: '/today-board', query: { user_id: post.designer_id } })"
          >
            ⏱️
          </button>
        </div>
        <small v-if="post.original_deadline" class="original-deadline-hint">
          الموعد السابق: {{ formatDeadlineDisplay(post.original_deadline) }}
        </small>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <CustomMultiSelect
          v-model="post.reviewer_ids"
          :options="reviewerOptions"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'reviewer_ids', isManager)"
          placeholder="اختر مراجع..."
          @change="$emit('auto-save', post, 'reviewer_ids')"
        />
        <span
          v-if="hasLockIcon(post, 'reviewer_ids')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'reviewer_ids')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer" class="review-cell">
      <template v-if="post.review_status === 'معتمد'">
        <span class="badge approved">🟢 معتمد</span>
        <span v-if="post.department_approved_at" class="approval-time">
          🕒
          {{
            new Date(post.department_approved_at).toLocaleString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </span>
      </template>

      <template v-else-if="post.review_status === 'مرفوض'">
        <span class="badge pending" style="color: #d32f2f">🔴 مرفوض</span>
        <button
          v-if="isManager || isCurrentUserReviewer"
          class="reset-btn"
          title="إعادة فتح المراجعة بعد التعديل"
          @click="$emit('reset-review', post, 'reviewer')"
        >
          🔄 تراجع
        </button>
      </template>

      <template v-else>
        <span
          v-if="post.reviewers_statuses && post.reviewers_statuses[currentUser?.id] === 'معتمد' && !isManager"
          class="badge"
          style="background: #e3f2fd; color: #1976d2"
        >
          ✅ تمت موافقتك
        </span>

        <div v-else-if="isCurrentUserReviewer || isManager" class="review-actions">
          <button
            class="approve-btn"
            :disabled="!isPostDeliveryValid(post)"
            :title="!isPostDeliveryValid(post) ? 'لا يمكن المراجعة بدون رابط تسليم صالح لملف درايف' : 'موافقة'"
            @click="$emit('approve', post, 'reviewer')"
          >
            ✅ موافقة
          </button>
          <button
            class="reject-btn"
            :disabled="!isPostDeliveryValid(post)"
            :title="!isPostDeliveryValid(post) ? 'لا يمكن المراجعة بدون رابط تسليم صالح لملف درايف' : 'رفض'"
            @click="$emit('reject', post, 'reviewer')"
          >
            ❌ رفض
          </button>
        </div>

        <span v-else class="badge pending">⏳ قيد الانتظار</span>
      </template>

      <button
        v-if="post.rejection_history && post.rejection_history.length > 0"
        class="history-btn mt-1"
        @click="$emit('open-history', post.rejection_history, 'القسم')"
      >
        📜 سجل الرفض
      </button>
    </td>

    <td v-if="!isMediaBuyer" class="review-cell" style="background: #eceff1">
      <template v-if="post.manager_review_status === 'معتمد'">
        <span class="badge approved">🟢 معتمد</span>
        <span v-if="post.manager_approved_at" class="approval-time">
          🕒
          {{
            new Date(post.manager_approved_at).toLocaleString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </span>
      </template>

      <template v-else-if="post.manager_review_status === 'مرفوض'">
        <span class="badge pending" style="color: #d32f2f">🔴 مرفوض</span>
        <button
          v-if="isManager"
          class="reset-btn"
          title="إعادة فتح المراجعة"
          @click="$emit('reset-review', post, 'manager')"
        >
          🔄 تراجع
        </button>
      </template>

      <template v-else>
        <div v-if="isManager" class="review-actions">
          <button
            class="approve-btn"
            :disabled="!isPostDeliveryValid(post)"
            :title="!isPostDeliveryValid(post) ? 'لا يمكن الاعتماد بدون رابط تسليم صالح لملف درايف' : 'اعتماد نهائي'"
            @click="$emit('approve', post, 'manager')"
          >
            ✅ اعتماد
          </button>
          <button
            class="reject-btn"
            :disabled="!isPostDeliveryValid(post)"
            :title="!isPostDeliveryValid(post) ? 'لا يمكن الاعتماد بدون رابط تسليم صالح لملف درايف' : 'رفض'"
            @click="$emit('reject', post, 'manager')"
          >
            ❌ رفض
          </button>
        </div>

        <span v-else class="badge pending">⏳ قيد الانتظار</span>
      </template>

      <button
        v-if="post.manager_rejection_history && post.manager_rejection_history.length > 0"
        class="history-btn mt-1"
        @click="$emit('open-history', post.manager_rejection_history, 'المدير')"
      >
        📜 سجل الرفض
      </button>
    </td>

    <td v-if="!isDesignerOrEditor">
      <div class="lock-wrapper">
        <CustomMultiSelect
          v-model="post.ad_platform"
          :options="adPlatformOptions"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'ad_platform', isManager)"
          placeholder="اختر منصة..."
          @change="$emit('auto-save', post, 'ad_platform')"
        />
        <span
          v-if="hasLockIcon(post, 'ad_platform')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'ad_platform')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isDesignerOrEditor">
      <div class="lock-wrapper">
        <select
          v-model="post.finance_status"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_status', isManager)"
          @change="$emit('auto-save', post, 'finance_status')"
        >
          <option value="غير ممول">غير ممول</option>
          <option value="ممول">ممول</option>
        </select>
        <span
          v-if="hasLockIcon(post, 'finance_status')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'finance_status')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isDesignerOrEditor">
      <div class="lock-wrapper">
        <input
          v-model="post.finance_cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_cost', isManager)"
          @blur="$emit('auto-save', post, 'finance_cost')"
        />
        <span
          v-if="hasLockIcon(post, 'finance_cost')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'finance_cost')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isDesignerOrEditor">
      <div class="lock-wrapper">
        <input
          v-model="post.finance_days"
          type="number"
          step="1"
          min="0"
          placeholder="0"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_days', isManager)"
          @blur="$emit('auto-save', post, 'finance_days')"
        />
        <span
          v-if="hasLockIcon(post, 'finance_days')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'finance_days')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <select
          v-model="post.post_type"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'post_type', isManager)"
          @change="onPostTypeChange"
        >
          <option value="">اختيار...</option>
          <option v-for="type in availablePostTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        <span
          v-if="hasLockIcon(post, 'post_type')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'post_type')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="objective-wrapper" style="flex-direction: column; align-items: stretch; position: relative">
        <CustomMultiSelect
          v-model="post.objective_array"
          :options="objectiveOptions"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'objective', isManager)"
          @change="onObjectiveChange"
        >
          <template #selected-text="{ selectedOptions }">
            <div v-if="selectedOptions && selectedOptions.length" class="objective-tags">
              <span
                v-for="opt in selectedOptions"
                :key="opt.value"
                class="obj-tag"
                :class="getObjectiveClass(opt.value)"
              >
                {{ opt.value === 'آخر' && post.custom_objective ? post.custom_objective : opt.label }}
              </span>
            </div>
            <span v-else style="color: #999">اختيار...</span>
          </template>
        </CustomMultiSelect>

        <input
          v-if="post.objective_array && post.objective_array.includes('آخر')"
          v-model="post.custom_objective"
          type="text"
          placeholder="اكتب..."
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'objective', isManager)"
          class="mt-1"
          style="font-size: 11px; padding: 4px"
          @blur="onObjectiveChange"
        />
        <span
          v-if="hasLockIcon(post, 'objective')"
          class="lock-indicator"
          style="top: 15px"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'objective')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <textarea
          v-model="post.detailed_idea"
          rows="2"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'detailed_idea', isManager)"
          @blur="$emit('auto-save', post, 'detailed_idea')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'detailed_idea')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'detailed_idea')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <textarea
          v-model="post.caption"
          rows="2"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'caption', isManager)"
          @blur="$emit('auto-save', post, 'caption')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'caption')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'caption')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <textarea
          v-model="post.tov"
          rows="2"
          placeholder="..."
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'tov', isManager)"
          @blur="$emit('auto-save', post, 'tov')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'tov')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'tov')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <textarea
          v-model="post.call_to_action"
          rows="2"
          placeholder="..."
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'call_to_action', isManager)"
          @blur="$emit('auto-save', post, 'call_to_action')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'call_to_action')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'call_to_action')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="lock-wrapper">
        <textarea
          v-model="post.hashtags"
          rows="2"
          placeholder="#..."
          dir="ltr"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'hashtags', isManager)"
          @blur="$emit('auto-save', post, 'hashtags')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'hashtags')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'hashtags')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="!isMediaBuyer">
      <div class="textarea-link-wrapper lock-wrapper">
        <textarea
          v-model="post.reference_link"
          rows="2"
          placeholder="Link..."
          dir="ltr"
          :disabled="!canEditFields(post) || isFieldDisabled(post, 'reference_link', isManager)"
          @blur="$emit('auto-save', post, 'reference_link')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'reference_link')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'reference_link')"
        >
          🔒
        </span>
        <div v-if="getExtractedRefUrls(post).length" class="extracted-links">
          <a
            v-for="(url, i) in getExtractedRefUrls(post)"
            :key="i"
            :href="url"
            target="_blank"
            class="extracted-link-btn"
            :title="url"
          >
            {{ getUrlLabel(url, i) }}
          </a>
        </div>
      </div>
    </td>

    <td
      class="delivery-cell"
      :class="{ 'cell-invalid': isDeliveryInvalid(post) }"
      :title="isDeliveryInvalid(post) ? getDeliveryError(post) : ''"
    >
      <div class="delivery-split-grid">
        <div class="delivery-split-col work-delivery-col">
          <div class="delivery-sub-label">
            <span>📁 تسليم العمل (للمراجعة)</span>
          </div>
          <div class="textarea-link-wrapper lock-wrapper">
            <textarea
              v-model="post.delivery_links"
              :placeholder="
                isFolderAllowedForPostType(post.post_type)
                  ? 'رابط مجلد أو ملف التسليم (Google Drive)...'
                  : 'رابط ملف التسليم (Google Drive / Docs)...'
              "
              dir="ltr"
              rows="2"
              :class="{ 'input-invalid': isDeliveryInvalid(post) }"
              :disabled="!canEditDelivery(post) || isFieldDisabled(post, 'delivery_links', isManager)"
              @input="handleDeliveryInput(post)"
              @blur="$emit('auto-save', post, 'delivery_links')"
            ></textarea>
            <span
              v-if="hasLockIcon(post, 'delivery_links')"
              class="lock-indicator"
              :class="{ 'clickable-lock': isManager }"
              :title="lockTitle"
              @click="$emit('unlock-field', post, 'delivery_links')"
            >
              🔒
            </span>
            <div v-if="getExtractedDelUrls(post).length" class="extracted-links">
              <a
                v-for="(url, i) in getExtractedDelUrls(post)"
                :key="i"
                :href="url"
                target="_blank"
                class="extracted-link-btn"
                :title="url"
              >
                {{ getUrlLabel(url, i) }}
              </a>
            </div>
          </div>
          <div class="delivery-status">
            <button
              v-if="(post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض') && canEditDelivery(post)"
              :disabled="!isPostDeliveryValid(post)"
              :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
              :title="
                !isPostDeliveryValid(post)
                  ? getDeliveryError(post) || 'لا يمكن إعادة الإرسال بدون رابط ملف درايف صالح'
                  : 'إعادة إرسال للمراجعة 🔄'
              "
              class="primary-btn reject-submit-btn w-100 mt-1"
              @click="$emit('resubmit', post)"
            >
              إعادة إرسال 🔄
            </button>
            <div v-else-if="post.delivered_at" class="delivered-info">
              <span class="delivery-time">✅ {{ formatDeliveryDate(post.delivered_at) }}</span>
              <button
                v-if="canEditDelivery(post)"
                :disabled="!isPostDeliveryValid(post)"
                :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                :title="
                  !isPostDeliveryValid(post)
                    ? getDeliveryError(post) || 'لا يمكن تحديث الوقت بدون رابط ملف درايف صالح'
                    : 'تحديث وقت التسليم'
                "
                class="update-time-btn"
                @click="$emit('mark-delivered', post)"
              >
                تحديث
              </button>
            </div>
            <button
              v-else-if="canEditDelivery(post)"
              :disabled="!isPostDeliveryValid(post)"
              :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
              :title="
                !isPostDeliveryValid(post)
                  ? getDeliveryError(post) || 'لا يمكن تسجيل التسليم بدون رابط ملف درايف صالح'
                  : 'تسجيل التسليم'
              "
              class="primary-btn submit-delivery-btn"
              @click="$emit('mark-delivered', post)"
            >
              تسجيل التسليم
            </button>
          </div>
        </div>

        <div class="delivery-split-divider"></div>

        <div class="delivery-split-col final-delivery-col">
          <div class="delivery-sub-label">
            <span>📦 تسليم نهائي للأرشفة</span>
          </div>

          <div
            v-if="!isPostFullyApproved(post)"
            class="final-delivery-locked"
            title="لا يمكن إضافة رابط مجلد الأرشفة إلا بعد موافقة واعتماد القسم والمدير معاً"
          >
            <span>🔒 متاح بعد اعتماد القسم والمدير</span>
          </div>

          <div v-else-if="hasConfirmedFinalDelivery(post)" class="final-delivery-confirmed">
            <div class="final-delivery-view-box">
              <a
                :href="formatExternalUrl(post.final_delivery_link)"
                target="_blank"
                class="extracted-link-btn final-folder-link"
                title="فتح مجلد الأرشيف على Google Drive"
              >
                📁 مجلد الأرشيف ↗
              </a>
              <button
                v-if="isManager"
                type="button"
                class="final-edit-btn"
                title="تعديل رابط الأرشفة (متاح للمدير فقط)"
                @click="$emit('open-archive', post)"
              >
                ✏️
              </button>
            </div>
            <div
              class="final-delivered-badge mt-1"
              :title="
                isManager
                  ? 'مؤرشف - يمكن للمدير تعديله'
                  : 'تم تثبيت رابط الأرشفة وقفله نهائياً ولا يمكن تعديله إلا من قِبل المدير 🔒'
              "
            >
              <span class="badge-lock-text">🔒 مؤرشف</span>
              <small v-if="post.final_delivered_at">{{ formatDeliveryDate(post.final_delivered_at) }}</small>
            </div>
          </div>

          <div v-else-if="canAddFinalDeliveryCell" class="final-delivery-add-box">
            <button
              type="button"
              class="add-archive-btn"
              title="إضافة رابط مجلد الأرشفة على Google Drive"
              @click="$emit('open-archive', post)"
            >
              <span>＋ إضافة مجلد الأرشيف</span>
            </button>
          </div>

          <div v-else class="final-delivery-readonly">
            <div class="muted-notice">
              <span>⏳ بانتظار تسليم الأرشيف</span>
            </div>
          </div>
        </div>
      </div>
    </td>

    <td>
      <div class="lock-wrapper">
        <textarea
          v-model="post.notes"
          rows="2"
          placeholder="..."
          :disabled="!canEditNotes(post) || isFieldDisabled(post, 'notes', isManager)"
          @blur="$emit('auto-save', post, 'notes')"
        ></textarea>
        <span
          v-if="hasLockIcon(post, 'notes')"
          class="lock-indicator"
          :class="{ 'clickable-lock': isManager }"
          :title="lockTitle"
          @click="$emit('unlock-field', post, 'notes')"
        >
          🔒
        </span>
      </div>
    </td>

    <td v-if="canDeletePosts || canArchivePosts" class="text-center">
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px">
        <button
          v-if="canArchivePosts"
          type="button"
          class="icon-btn"
          style="color: #a5b4fc"
          title="نقل المنشور للأرشيف"
          @click="$emit('archive-post', post, index)"
        >
          🗄️
        </button>
        <button
          v-if="canDeletePosts"
          class="icon-btn delete-btn"
          title="حذف الصف"
          @click="$emit('delete-post', post, index)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path>
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed, ref } from 'vue'
import CustomMultiSelect from '@/components/CustomMultiSelect.vue'
import SmartDeadlinePicker from '@/components/SmartDeadlinePicker.vue'
import { formatExternalUrl, isFolderAllowedForPostType } from '@/utils/driveValidation'
import { getDeadlineStatus } from '@/utils/timeHelper'
import {
  adPlatformOptions,
  canAddFinalDelivery,
  canEditDelivery,
  canEditFields,
  canEditLinks,
  canEditNotes,
  canEditPublishAndNotes,
  canEditTargetDate,
  formatDate,
  formatDeadlineDisplay,
  formatDeliveryDate,
  formatForDateInput,
  getDayName,
  getDeliveryError,
  getExtractedDelUrls,
  getExtractedRefUrls,
  getObjectiveClass,
  getUrlLabel,
  handleDeliveryInput,
  hasLockIcon,
  hasPublishedLinks,
  isDeliveryInvalid,
  isFieldDisabled,
  isPostDeliveryValid,
  isPostFullyApproved,
  hasConfirmedFinalDelivery,
  objectiveOptions,
  publishingPlatformOptions,
  syncObjectiveValue,
} from '../utils/boardHelpers'

const props = defineProps({
  post: { type: Object, required: true },
  index: { type: Number, required: true },
  currentPlan: { type: Object, default: null },
  currentUser: { type: Object, default: null },
  allUsers: { type: Array, default: () => [] },
  availablePostTypes: { type: Array, default: () => [] },
  isManager: { type: Boolean, default: false },
  isAccountManager: { type: Boolean, default: false },
  isPlanDelivered: { type: Boolean, default: false },
  isMediaBuyer: { type: Boolean, default: false },
  isDesignerOrEditor: { type: Boolean, default: false },
  canDeletePosts: { type: Boolean, default: false },
  canArchivePosts: { type: Boolean, default: false },
})

const emit = defineEmits([
  'view',
  'toggle-urgent',
  'target-date-change',
  'unlock-field',
  'publish-status-change',
  'auto-save',
  'open-links',
  'start-execution',
  'restore-deadline',
  'approve',
  'reject',
  'reset-review',
  'open-history',
  'resubmit',
  'mark-delivered',
  'open-archive',
  'archive-post',
  'delete-post',
])

const targetDateInputRef = ref(null)

const lockTitle = computed(() =>
  props.isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة',
)

const reviewerOptions = computed(() => props.allUsers.map((u) => ({ label: u.name, value: u.id })))

const isCurrentUserReviewer = computed(
  () =>
    Array.isArray(props.post.reviewer_ids) &&
    props.post.reviewer_ids.includes(props.currentUser?.id),
)

const canEditTargetDateCell = computed(() =>
  canEditTargetDate(props.isPlanDelivered, props.isManager, props.isAccountManager),
)

const canEditLinksCell = computed(() =>
  canEditLinks(props.post, props.isMediaBuyer, props.isManager),
)

const canAddFinalDeliveryCell = computed(() =>
  canAddFinalDelivery(props.post, props.currentUser, props.isManager),
)

const publishDeadlineStatus = computed(() =>
  getDeadlineStatus(
    props.currentPlan?.start_date || props.post.created_at,
    props.post.target_date,
    props.post.actual_publish_status,
  ),
)

const workDeadlineStatus = computed(() =>
  getDeadlineStatus(
    props.post.execution_started_at || props.post.created_at,
    props.post.deadline,
    props.post.delivered_at ? 'completed' : 'pending',
  ),
)

const onTargetDateContainerClick = () => {
  const el = targetDateInputRef.value
  if (!el) return
  if (typeof el.showPicker === 'function') {
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  } else {
    el.focus()
  }
}

const onDateInputClick = (event) => {
  const el = event.target
  if (el && typeof el.showPicker === 'function') {
    try {
      el.showPicker()
    } catch {
      // fallback
    }
  }
}

const onPostTypeChange = () => {
  if (props.post.delivery_links && String(props.post.delivery_links).trim()) {
    handleDeliveryInput(props.post)
  }
  emit('auto-save', props.post, 'post_type')
}

const onObjectiveChange = () => {
  syncObjectiveValue(props.post)
  emit('auto-save', props.post, 'objective')
}
</script>
