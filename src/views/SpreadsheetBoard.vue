<template>
  <!-- شاشة منع وصول الموظفين قبل الاعتماد الداخلي -->
  <div v-if="accessDenied" class="access-denied-wrapper" dir="rtl">
    <div class="access-denied-card">
      <div class="lock-icon-badge">🔒</div>
      <h2>الوصول غير متاح حالياً</h2>
      <p class="denied-text">{{ accessDeniedMessage || 'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.' }}</p>
      <div class="denied-actions">
        <router-link to="/plan-contents" class="return-plans-btn">
          <span>العودة إلى محتويات الخطط</span>
          <span style="font-size: 16px;">↩️</span>
        </router-link>
      </div>
    </div>
  </div>

  <section v-else class="spreadsheet-page" dir="rtl">
    <div class="page-topline">
      <div class="topline-info">
        <div class="breadcrumbs">
          <router-link to="/plan-contents">محتويات الخطط</router-link>
          <span>/</span>
          <span>لوحة المحتوى التفصيلية</span>
        </div>
        <h2>مصنع المحتوى (Spreadsheet)</h2>
        <p>تعديل فوري، تعبئة سريعة، وحفظ تلقائي لجميع خلايا الخطة.</p>
      </div>

      <!-- تنبيه المنشورات العاجلة في المساحة البيضاء العلوية -->
      <div v-if="urgentPosts.length > 0" class="urgent-top-banner" @click="scrollToUrgent" title="اضغط للانتقال إلى المنشورات العاجلة">
        <div class="urgent-banner-icon">
          <span class="beacon-pulse"></span>
          🚨
        </div>
        <div class="urgent-banner-text">
          <span class="urgent-banner-badge">{{ urgentPosts.length }}</span>
          <span class="urgent-banner-label">
            يوجد <strong>{{ urgentText }}</strong> بحاجة لمتابعة عاجلة
          </span>
        </div>
        <button type="button" class="urgent-jump-btn" @click.stop="scrollToUrgent" title="التمرير إلى المنشور العاجل التالي">
          <span>انتقال</span>
          <span class="jump-arrow">⬇️</span>
        </button>
      </div>

      <div class="header-actions">
        <!-- روابط مجلدات درايف للعميل (رفع المراجعة والتسليم النهائي) -->
        <div v-if="reviewFolderLink || finalDeliveryFolderLink" class="drive-folders-group">
          <a
            v-if="reviewFolderLink"
            :href="formatExternalUrl(reviewFolderLink)"
            target="_blank"
            rel="noopener noreferrer"
            class="drive-folder-btn review-btn"
            title="فتح مجلد رفع المراجعة على Google Drive للعميل"
          >
            <svg class="drive-icon" viewBox="0 0 87.3 78" width="15" height="15" aria-hidden="true">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span class="btn-text">مجلد رفع المراجعة</span>
            <span class="external-arrow" aria-hidden="true">↗</span>
          </a>

          <a
            v-if="finalDeliveryFolderLink"
            :href="formatExternalUrl(finalDeliveryFolderLink)"
            target="_blank"
            rel="noopener noreferrer"
            class="drive-folder-btn final-btn"
            title="فتح مجلد التسليم النهائي على Google Drive للعميل"
          >
            <svg class="drive-icon" viewBox="0 0 87.3 78" width="15" height="15" aria-hidden="true">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span class="btn-text">مجلد التسليم النهائي</span>
            <span class="external-arrow" aria-hidden="true">↗</span>
          </a>
        </div>

        <span v-if="saving" class="saving-indicator">
          <i class="spinner"></i> جارٍ الحفظ...
        </span>
        <button class="primary-btn" type="button" @click="showAddRowModal = true" :disabled="isReviewerCheck">
          <span>＋</span> منشور إضافي
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تحميل اللوحة...
    </div>

    <div v-else class="spreadsheet-container"
         ref="spreadsheetContainer"
         @mousedown="onMouseDown"
         @mouseleave="onMouseLeave"
         @mouseup="onMouseUp"
         @mousemove="onMouseMove">
      <table class="spreadsheet-table">
        <thead>
          <tr>
            <th rowspan="2" class="group-header row-num-header " style="width: 45px; text-align: center; vertical-align: middle; z-index: 10;">#</th>
            <th :colspan="isDesignerOrEditor ? 1 : (isMediaBuyer ? 3 : 5)" class="group-header red-group">حالة المنشور</th>
            <th v-if="!isMediaBuyer" :colspan="isDesignerOrEditor ? 5 : 6" class="group-header admin-group">الإدارة والتكليف والمراجعة</th>
            <th v-if="!isDesignerOrEditor" colspan="4" class="group-header dark-red-group">موقف التمويل</th>
            <th v-if="!isMediaBuyer" colspan="8" class="group-header blue-group">محتوى المنشور</th>
            <th colspan="1" class="group-header light-blue-group">التسليم</th>
            <th colspan="1" class="group-header pink-group">ملاحظات</th>
            <th v-if="canDeletePosts" colspan="1" class="group-header admin-group">إجراءات</th>
          </tr>
          <tr>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th ">تاريخ النشر المخطط</th>
            <th v-if="!isMediaBuyer && !isDesignerOrEditor" class="sub-th red-th">النشر الفعلي</th>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th">توقيت النشر</th>
            <th v-if="!isMediaBuyer" class="sub-th red-th">منصة النشر</th>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th">روابط النشر</th>

            <th v-if="!isMediaBuyer && !isDesignerOrEditor" class="sub-th admin-th">المنفذ</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">بدء التنفيذ</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th" style="min-width: 145px;">الديدلاين</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">المراجعين (متعدد)</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">مراجعة القسم</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th" style="background: #cfd8dc;">اعتماد المدير</th>

            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">منصة الإعلان</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">حالة التمويل</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">تكلفة التمويل ($)</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">أيام التمويل</th>

            <th v-if="!isMediaBuyer" class="sub-th blue-th">نوع المنشور</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">الهدف</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">شرح الفكرة تفصيلياً</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Caption</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">TOV</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Call to Action</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Hashtag</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Reference Link</th>

            <th class="sub-th light-blue-th" style="min-width: 330px;">روابط ووقت التسليم</th>
            <th class="sub-th pink-th">Note</th>
            <th v-if="canDeletePosts" class="sub-th admin-th">حذف</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredPosts.length === 0">
            <td :colspan="isMediaBuyer ? 10 : (isDesignerOrEditor ? 17 : (canDeletePosts ? 27 : 26))" class="text-center py-4 muted">لا توجد منشورات. قم بإضافة منشور جديد.</td>
          </tr>
          <tr v-for="(post, index) in filteredPosts" :key="post.id" :id="'post-row-' + post.id" class="post-row" :class="{ 'urgent-row': post.is_urgent }">
            <td class="text-center readonly-cell row-num-cell" style="font-weight: 700; width: 65px; color: #8792be; vertical-align: middle;">
              <div v-if="isDesignerOrEditor" class="row-num-with-action">
                <span class="row-index" :title="'منشور #' + (index + 1)">{{ index + 1 }}</span>
                <button class="icon-btn row-view-btn" @click="openViewModal(post)" title="عرض تفاصيل المنشور 👁️">👁️</button>
                <button type="button" class="icon-btn" :class="{ 'urgent-active-glow': post.is_urgent }" @click.stop="toggleUrgent(post)" :title="post.is_urgent ? 'منشور عاجل 🚨 (اضغط لإلغاء العاجل)' : 'تحويل لمنشور عاجل ⚡ وإزاحة الفائض'">
                  {{ post.is_urgent ? '🚨' : '⚡' }}
                </button>
                <span v-if="post.is_displaced" class="displaced-dot" :title="post.displaced_reason || 'منشور مُرحّل بقرار إداري 🔄'">🔄</span>
              </div>
              <template v-else>
                <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                  <span>{{ index + 1 }}</span>
                  <button type="button" class="icon-btn" :class="{ 'urgent-active-glow': post.is_urgent }" @click.stop="toggleUrgent(post)" :title="post.is_urgent ? 'منشور عاجل 🚨 (اضغط لإلغاء العاجل)' : 'تحويل لمنشور عاجل ⚡ وإزاحة الفائض'">
                    {{ post.is_urgent ? '🚨' : '⚡' }}
                  </button>
                  <span v-if="post.is_displaced" class="displaced-dot" :title="post.displaced_reason || 'منشور مُرحّل بقرار إداري 🔄'">🔄</span>
                </div>
              </template>
            </td>
            
            <!-- 2. حالة المنشور وموعد النشر الذكي -->
            <td v-if="!isDesignerOrEditor" class="readonly-cell position-relative target-date-td" :class="getDeadlineStatus(currentPlan?.start_date || post.created_at, post.target_date, post.actual_publish_status).class + '-border'">
              <button class="icon-btn view-btn" @click="openViewModal(post)" title="عرض التفاصيل">👁️</button>
              
              <!-- صندوق تاريخ النشر المخطط (تفاعلي للمدير والأكونت مانجر قبل التسليم النهائي) -->
              <div 
                v-if="canEditTargetDate(post)" 
                class="target-date-interactive-box"
                @click="onTargetDateContainerClick(post.id)"
                title="اضغط لتعديل تاريخ النشر المخطط 📅"
              >
                <strong class="target-day-name">{{ getDayName(post.target_date) }}</strong>
                <span class="target-date-badge">
                  <small>{{ formatDate(post.target_date) }}</small>
                  <span class="cal-mini-icon">📅</span>
                </span>
                <input 
                  type="date"
                  :ref="el => registerDateInput(post.id, el)"
                  class="target-date-native-overlay"
                  :value="formatForDateInput(post.target_date)"
                  @click.stop="onDateInputClick($event)"
                  @change="handleTargetDateChange(post, $event)"
                  title="اختر تاريخ النشر المخطط"
                />
              </div>

              <!-- عرض ثابت إذا كان مسلماً نهائياً أو مستخدم غير مصرح له -->
              <div v-else class="target-date-static-box" :title="isPlanDelivered ? 'تم قفل تعديل تاريخ النشر بعد إتمام التسليم النهائي للخطة 🔒' : ''">
                <strong class="target-day-name">{{ getDayName(post.target_date) }}</strong>
                <small>{{ formatDate(post.target_date) }}</small>
                <div v-if="isPlanDelivered" class="plan-delivered-lock-tag" title="تم قفل تاريخ النشر المخطط نظراً لإتمام التسليم النهائي للخطة">
                  🔒 مقفل نهائياً
                </div>
              </div>

              <div v-if="post.is_urgent" class="urgent-badge" title="هذا المنشور ذو أولوية قصوى وعاجلة">🚨 عاجل</div>
              <div v-if="post.is_displaced" class="displaced-badge" :title="post.displaced_reason || 'تم ترحيل موعد تسليم المنشور لإفساح المجال لمنشور طارئ'">🔄 ترحيل موعد التسليم</div>
              
              <!-- SLA Smart Indicator لموعد النشر -->
              <div class="sla-indicator" style="margin-top: 5px;">
                <span class="sla-msg" :class="getDeadlineStatus(currentPlan?.start_date || post.created_at, post.target_date, post.actual_publish_status).class + '-text'">
                  {{ getDeadlineStatus(currentPlan?.start_date || post.created_at, post.target_date, post.actual_publish_status).message }}
                </span>
                <div class="sla-progress-bg" v-if="post.actual_publish_status !== 'تم النشر'">
                  <div class="sla-progress-fill" :class="getDeadlineStatus(currentPlan?.start_date || post.created_at, post.target_date, post.actual_publish_status).class + '-bg'" :style="{ width: getDeadlineStatus(currentPlan?.start_date || post.created_at, post.target_date, post.actual_publish_status).percentage + '%' }"></div>
                </div>
              </div>
            </td>

            <td v-if="!isMediaBuyer && !isDesignerOrEditor">
              <div class="lock-wrapper">
                <select v-model="post.actual_publish_status" @change="handlePublishStatusChange(post, $event)" :class="post.actual_publish_status === 'لم يتم' ? 'text-red' : 'text-green'" :disabled="!canEditPublishAndNotes(post) || isFieldDisabled(post, 'actual_publish_status')">
                  <option value="لم يتم">لم يتم</option>
                  <option value="تم النشر">تم النشر</option>
                </select>
                <span v-if="hasLockIcon(post, 'actual_publish_status')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'actual_publish_status')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isDesignerOrEditor">
              <div class="lock-wrapper">
                <input type="text" v-model="post.publishing_time" @blur="autoSave(post, 'publishing_time')" placeholder="--:--" dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'publishing_time')" />
                <span v-if="hasLockIcon(post, 'publishing_time')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'publishing_time')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <CustomMultiSelect
                  v-model="post.publishing_platform"
                  :options="[
                    { label: 'Facebook', value: 'Facebook' },
                    { label: 'Instagram', value: 'Instagram' },
                    { label: 'Twitter/X', value: 'Twitter/X' },
                    { label: 'LinkedIn', value: 'LinkedIn' },
                    { label: 'TikTok', value: 'TikTok' },
                    { label: 'Snapchat', value: 'Snapchat' }
                  ]"
                  @change="autoSave(post, 'publishing_platform')"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'publishing_platform')"
                  placeholder="اختر منصة..."
                />
                <span v-if="hasLockIcon(post, 'publishing_platform')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'publishing_platform')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isDesignerOrEditor" class="text-center">
              <div v-if="hasPublishedLinks(post)" class="published-links-preview">
                <a v-for="(link, platform) in post.published_links" :key="platform" 
                   v-show="link" :href="link" target="_blank" class="platform-link" :title="platform">
                  🔗 {{ platform }}
                </a>
                <button v-if="canEditLinks(post)" class="icon-btn edit-links" @click="openLinksModal(post, false)" title="تعديل الروابط">✏️</button>
              </div>
              <template v-else>
                <button v-if="canEditLinks(post)" class="secondary-btn small-btn" @click="openLinksModal(post, false)">
                  + إضافة روابط
                </button>
                <span v-else class="muted" style="font-size: 11px;">لا توجد روابط</span>
              </template>
            </td>

            <!-- 1. الإدارة والتكليف -->
            <td v-if="!isMediaBuyer && !isDesignerOrEditor">
              <div class="lock-wrapper">
                <select v-model="post.designer_id" @change="autoSave(post, 'designer_id')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'designer_id')">
                  <option :value="null">لم يحدد</option>
                  <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
                </select>
                <span v-if="hasLockIcon(post, 'designer_id')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'designer_id')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer" style="min-width: 130px; padding: 4px;">
              <div class="execution-trigger" v-if="post.designer_id">
                <span v-if="post.execution_started_at" class="badge started">
                  🚀 بدأ: {{ new Date(post.execution_started_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
                <button v-else-if="canEditFields(post)" class="start-execution-btn" @click="startExecution(post)" title="اضغط لبدء احتساب وقت التنفيذ">
                  <span class="icon">▶️</span> تكليف وبدء العمل
                </button>
              </div>
            </td>
            
            <!-- عمود الديدلاين وتأثير المحرك الذكي -->
            <td v-if="!isMediaBuyer" :class="getDeadlineStatus(post.execution_started_at || post.created_at, post.deadline, post.delivered_at ? 'completed' : 'pending').class + '-border'" style="min-width: 145px; padding: 4px;">
              <SmartDeadlinePicker
                v-model="post.deadline"
                :disabled="!canEditFields(post) || isFieldDisabled(post, 'deadline')"
                :is-locked="hasLockIcon(post, 'deadline')"
                :is-manager="isManager"
                :post="post"
                :execution-started-at="post.execution_started_at || post.created_at"
                @change="autoSave(post, 'deadline')"
                @unlock="unlockField(post, 'deadline')"
              />
              
              <!-- SLA Smart Indicator للديدلاين -->
              <div class="sla-indicator" v-if="post.deadline" style="margin-top: 5px; margin-bottom: 5px;">
                <span class="sla-msg" :class="getDeadlineStatus(post.execution_started_at || post.created_at, post.deadline, post.delivered_at ? 'completed' : 'pending').class + '-text'">
                  {{ getDeadlineStatus(post.execution_started_at || post.created_at, post.deadline, post.delivered_at ? 'completed' : 'pending').message }}
                </span>
                <div class="sla-progress-bg" v-if="!post.delivered_at">
                  <div class="sla-progress-fill" :class="getDeadlineStatus(post.execution_started_at || post.created_at, post.deadline, post.delivered_at ? 'completed' : 'pending').class + '-bg'" :style="{ width: getDeadlineStatus(post.execution_started_at || post.created_at, post.deadline, post.delivered_at ? 'completed' : 'pending').percentage + '%' }"></div>
                </div>
              </div>

              <!-- شارة موعد التسليم المرحل بوضوح في عمود الديدلاين -->
              <div v-if="post.is_displaced" class="displaced-deadline-tag" :title="post.displaced_reason || 'تم ترحيل موعد التسليم الابتدائي تلقائياً'">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 4px;">
                  <span>🔄 موعد التسليم مُرحّل رسمياً</span>
                  <button v-if="isManager" type="button" class="restore-deadline-mini-btn" @click.stop="restorePostDeadline(post)" title="استرجاع موعد التسليم الأصلي ↩️">↩️</button>
                </div>
                <small v-if="post.original_deadline" class="original-deadline-hint">الموعد السابق: {{ formatDeadlineDisplay(post.original_deadline) }}</small>
              </div>
            </td>
            
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <CustomMultiSelect
                  v-model="post.reviewer_ids"
                  :options="allUsers.map(u => ({ label: u.name, value: u.id }))"
                  @change="autoSave(post, 'reviewer_ids')"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'reviewer_ids')"
                  placeholder="اختر مراجع..."
                />
                <span v-if="hasLockIcon(post, 'reviewer_ids')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'reviewer_ids')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>

            <td v-if="!isMediaBuyer" class="review-cell">
              <template v-if="post.review_status === 'معتمد'">
                <span class="badge approved">🟢 معتمد</span>
                <span v-if="post.department_approved_at" class="approval-time">
                  🕒 {{ new Date(post.department_approved_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </template>
              
              <template v-else-if="post.review_status === 'مرفوض'">
                <span class="badge pending" style="color: #d32f2f;">🔴 مرفوض</span>
                <button v-if="isManager || (post.reviewer_ids && post.reviewer_ids.includes(currentUser?.id))" 
                        class="reset-btn" @click="resetReview(post, 'reviewer')" title="إعادة فتح المراجعة بعد التعديل">
                  🔄 تراجع
                </button>
              </template>

              <template v-else>
                <span v-if="post.reviewers_statuses && post.reviewers_statuses[currentUser?.id] === 'معتمد' && !isManager" class="badge" style="background: #e3f2fd; color: #1976d2;">
                  ✅ تمت موافقتك
                </span>
                
                <div v-else-if="(post.reviewer_ids && post.reviewer_ids.includes(currentUser?.id)) || isManager" class="review-actions">
                  <button class="approve-btn" :disabled="!isPostDeliveryValid(post)" @click="approvePost(post, 'reviewer')" :title="!isPostDeliveryValid(post) ? 'لا يمكن المراجعة بدون رابط تسليم صالح لملف درايف' : 'موافقة'">✅ موافقة</button>
                  <button class="reject-btn" :disabled="!isPostDeliveryValid(post)" @click="openRejectModal(post, 'reviewer')" :title="!isPostDeliveryValid(post) ? 'لا يمكن المراجعة بدون رابط تسليم صالح لملف درايف' : 'رفض'">❌ رفض</button>
                </div>
                
                <span v-else class="badge pending">⏳ قيد الانتظار</span>
              </template>

              <button v-if="post.rejection_history && post.rejection_history.length > 0" 
                      class="history-btn mt-1" @click="openHistoryModal(post.rejection_history, 'القسم')">
                📜 سجل الرفض
              </button>
            </td>

            <td v-if="!isMediaBuyer" class="review-cell" style="background: #eceff1;">
              <template v-if="post.manager_review_status === 'معتمد'">
                <span class="badge approved">🟢 معتمد</span>
                <span v-if="post.manager_approved_at" class="approval-time">
                  🕒 {{ new Date(post.manager_approved_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </template>
              
              <template v-else-if="post.manager_review_status === 'مرفوض'">
                <span class="badge pending" style="color: #d32f2f;">🔴 مرفوض</span>
                <button v-if="isManager" 
                        class="reset-btn" @click="resetReview(post, 'manager')" title="إعادة فتح المراجعة">
                  🔄 تراجع
                </button>
              </template>
              
              <template v-else>
                <div v-if="isManager" class="review-actions">
                  <button class="approve-btn" :disabled="!isPostDeliveryValid(post)" @click="approvePost(post, 'manager')" :title="!isPostDeliveryValid(post) ? 'لا يمكن الاعتماد بدون رابط تسليم صالح لملف درايف' : 'اعتماد نهائي'">✅ اعتماد</button>
                  <button class="reject-btn" :disabled="!isPostDeliveryValid(post)" @click="openRejectModal(post, 'manager')" :title="!isPostDeliveryValid(post) ? 'لا يمكن الاعتماد بدون رابط تسليم صالح لملف درايف' : 'رفض'">❌ رفض</button>
                </div>
                
                <span v-else class="badge pending">⏳ قيد الانتظار</span>
              </template>

              <button v-if="post.manager_rejection_history && post.manager_rejection_history.length > 0" 
                      class="history-btn mt-1" @click="openHistoryModal(post.manager_rejection_history, 'المدير')">
                📜 سجل الرفض
              </button>
            </td>

            <td v-if="!isDesignerOrEditor">
              <div class="lock-wrapper">
                <CustomMultiSelect
                  v-model="post.ad_platform"
                  :options="[
                    { label: 'Facebook Ads', value: 'Facebook Ads' },
                    { label: 'Google Ads', value: 'Google Ads' },
                    { label: 'Snapchat Ads', value: 'Snapchat Ads' },
                    { label: 'TikTok Ads', value: 'TikTok Ads' }
                  ]"
                  @change="autoSave(post, 'ad_platform')"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'ad_platform')"
                  placeholder="اختر منصة..."
                />
                <span v-if="hasLockIcon(post, 'ad_platform')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'ad_platform')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isDesignerOrEditor">
              <div class="lock-wrapper">
                <select v-model="post.finance_status" @change="autoSave(post, 'finance_status')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_status')">
                  <option value="غير ممول">غير ممول</option>
                  <option value="ممول">ممول</option>
                </select>
                <span v-if="hasLockIcon(post, 'finance_status')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'finance_status')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isDesignerOrEditor">
              <div class="lock-wrapper">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  v-model="post.finance_cost" 
                  @blur="autoSave(post, 'finance_cost')" 
                  placeholder="0.00"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_cost')" 
                />
                <span v-if="hasLockIcon(post, 'finance_cost')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'finance_cost')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isDesignerOrEditor">
              <div class="lock-wrapper">
                <input 
                  type="number" 
                  step="1" 
                  min="0"
                  v-model="post.finance_days" 
                  @blur="autoSave(post, 'finance_days')" 
                  placeholder="0"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_days')" 
                />
                <span v-if="hasLockIcon(post, 'finance_days')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'finance_days')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>

            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <select v-model="post.post_type" @change="autoSave(post, 'post_type')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'post_type')">
                  <option value="">اختيار...</option>
                  <option v-for="type in availablePostTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
                <span v-if="hasLockIcon(post, 'post_type')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'post_type')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="objective-wrapper" style="flex-direction: column; align-items: stretch; position: relative;">
                <CustomMultiSelect 
                  v-model="post.objective_array" 
                  :options="objectiveOptions" 
                  @change="handleObjectiveChange(post)"
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'objective')"
                >
                  <template #selected-text="{ selectedOptions }">
                    <div v-if="selectedOptions && selectedOptions.length" class="objective-tags">
                      <span v-for="opt in selectedOptions" :key="opt.value" class="obj-tag" :class="getObjectiveClass(opt.value)">
                        {{ opt.value === 'آخر' && post.custom_objective ? post.custom_objective : opt.label }}
                      </span>
                    </div>
                    <span v-else style="color:#999;">اختيار...</span>
                  </template>
                </CustomMultiSelect>
                
                <input v-if="post.objective_array && post.objective_array.includes('آخر')" 
                       type="text" 
                       v-model="post.custom_objective" 
                       @blur="handleObjectiveChange(post)" 
                       placeholder="اكتب..." 
                       :disabled="!canEditFields(post) || isFieldDisabled(post, 'objective')" 
                       class="mt-1" style="font-size: 11px; padding: 4px;" />
                <span v-if="hasLockIcon(post, 'objective')" class="lock-indicator" style="top: 15px;" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'objective')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <textarea v-model="post.detailed_idea" @blur="autoSave(post, 'detailed_idea')" rows="2" :disabled="!canEditFields(post) || isFieldDisabled(post, 'detailed_idea')"></textarea>
                <span v-if="hasLockIcon(post, 'detailed_idea')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'detailed_idea')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <textarea v-model="post.caption" @blur="autoSave(post, 'caption')" rows="2" :disabled="!canEditFields(post) || isFieldDisabled(post, 'caption')"></textarea>
                <span v-if="hasLockIcon(post, 'caption')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'caption')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <textarea v-model="post.tov" @blur="autoSave(post, 'tov')" rows="2" placeholder="..." :disabled="!canEditFields(post) || isFieldDisabled(post, 'tov')"></textarea>
                <span v-if="hasLockIcon(post, 'tov')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'tov')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <textarea v-model="post.call_to_action" @blur="autoSave(post, 'call_to_action')" rows="2" placeholder="..." :disabled="!canEditFields(post) || isFieldDisabled(post, 'call_to_action')"></textarea>
                <span v-if="hasLockIcon(post, 'call_to_action')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'call_to_action')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="lock-wrapper">
                <textarea v-model="post.hashtags" @blur="autoSave(post, 'hashtags')" rows="2" placeholder="#..." dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'hashtags')"></textarea>
                <span v-if="hasLockIcon(post, 'hashtags')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'hashtags')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="!isMediaBuyer">
              <div class="textarea-link-wrapper lock-wrapper">
                <textarea v-model="post.reference_link" @blur="autoSave(post, 'reference_link')" rows="2" placeholder="Link..." dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'reference_link')"></textarea>
                <span v-if="hasLockIcon(post, 'reference_link')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'reference_link')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
                <div class="extracted-links" v-if="getExtractedRefUrls(post).length">
                  <a v-for="(url, i) in getExtractedRefUrls(post)" :key="i" :href="url" target="_blank" class="extracted-link-btn" :title="url">
                    {{ getUrlLabel(url, i) }}
                  </a>
                </div>
              </div>
            </td>

            <td class="delivery-cell" 
                :class="{ 'cell-invalid': isDeliveryInvalid(post) }"
                :title="isDeliveryInvalid(post) ? getDeliveryError(post) : ''">
              <div class="delivery-split-grid">
                <!-- 1. التسليم أثناء العمل (للمراجعة) -->
                <div class="delivery-split-col work-delivery-col">
                  <div class="delivery-sub-label">
                    <span>📁 تسليم العمل (للمراجعة)</span>
                  </div>
                  <div class="textarea-link-wrapper lock-wrapper">
                    <textarea 
                      v-model="post.delivery_links" 
                      @input="handleDeliveryInput(post)"
                      @blur="autoSave(post, 'delivery_links')" 
                      placeholder="رابط ملف التسليم (Google Drive / Docs)..." 
                      dir="ltr" 
                      rows="2"
                      :class="{ 'input-invalid': isDeliveryInvalid(post) }"
                      :disabled="!canEditDelivery(post) || isFieldDisabled(post, 'delivery_links')"
                    ></textarea>
                    <span v-if="hasLockIcon(post, 'delivery_links')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'delivery_links')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
                    <div class="extracted-links" v-if="getExtractedDelUrls(post).length">
                      <a v-for="(url, i) in getExtractedDelUrls(post)" :key="i" :href="url" target="_blank" class="extracted-link-btn" :title="url">
                        {{ getUrlLabel(url, i) }}
                      </a>
                    </div>
                  </div>
                  <div class="delivery-status">
                    <button 
                      v-if="(post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض') && canEditDelivery(post)"
                      @click="resubmitPost(post)"
                      :disabled="!isPostDeliveryValid(post)"
                      :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                      :title="!isPostDeliveryValid(post) ? (getDeliveryError(post) || 'لا يمكن إعادة الإرسال بدون رابط ملف درايف صالح') : 'إعادة إرسال للمراجعة 🔄'"
                      class="primary-btn reject-submit-btn w-100 mt-1"
                    >إعادة إرسال 🔄</button>
                    <div v-else-if="post.delivered_at" class="delivered-info">
                      <span class="delivery-time">✅ {{ formatDeliveryDate(post.delivered_at) }}</span>
                      <button 
                        v-if="canEditDelivery(post)" 
                        @click="markAsDelivered(post)" 
                        :disabled="!isPostDeliveryValid(post)"
                        :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                        :title="!isPostDeliveryValid(post) ? (getDeliveryError(post) || 'لا يمكن تحديث الوقت بدون رابط ملف درايف صالح') : 'تحديث وقت التسليم'"
                        class="update-time-btn"
                      >تحديث</button>
                    </div>
                    <button 
                      v-else-if="canEditDelivery(post)" 
                      @click="markAsDelivered(post)" 
                      :disabled="!isPostDeliveryValid(post)"
                      :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(post) }"
                      :title="!isPostDeliveryValid(post) ? (getDeliveryError(post) || 'لا يمكن تسجيل التسليم بدون رابط ملف درايف صالح') : 'تسجيل التسليم'"
                      class="primary-btn submit-delivery-btn"
                    >تسجيل التسليم</button>
                  </div>
                </div>

                <!-- فاصل رأسي بين تسليم العمل والتسليم النهائي -->
                <div class="delivery-split-divider"></div>

                <!-- 2. التسليم النهائي للأرشفة (بعد اعتماد القسم والمدير) -->
                <div class="delivery-split-col final-delivery-col">
                  <div class="delivery-sub-label">
                    <span>📦 تسليم نهائي للأرشفة</span>
                  </div>

                  <!-- حالة 1: لم يُعتمد المنشور بالكامل بعد -->
                  <div v-if="!isPostFullyApproved(post)" class="final-delivery-locked" title="لا يمكن إضافة رابط مجلد الأرشفة إلا بعد موافقة واعتماد القسم والمدير معاً">
                    <span>🔒 متاح بعد اعتماد القسم والمدير</span>
                  </div>

                  <!-- حالة 2: تم تأكيد الرابط وحفظه مسبقاً (مؤرشف ومقفل للموظفين، متاح للتعديل للمدير فقط) -->
                  <div v-else-if="hasConfirmedFinalDelivery(post)" class="final-delivery-confirmed">
                    <div class="final-delivery-view-box">
                      <a :href="formatExternalUrl(post.final_delivery_link)" target="_blank" class="extracted-link-btn final-folder-link" title="فتح مجلد الأرشيف على Google Drive">
                        📁 مجلد الأرشيف ↗
                      </a>
                      <button 
                        v-if="isManager" 
                        type="button" 
                        class="final-edit-btn" 
                        @click="openArchiveModal(post)" 
                        title="تعديل رابط الأرشفة (متاح للمدير فقط)">
                        ✏️
                      </button>
                    </div>
                    <div class="final-delivered-badge mt-1" :title="isManager ? 'مؤرشف - يمكن للمدير تعديله' : 'تم تثبيت رابط الأرشفة وقفله نهائياً ولا يمكن تعديله إلا من قِبل المدير 🔒'">
                      <span class="badge-lock-text">🔒 مؤرشف</span>
                      <small v-if="post.final_delivered_at">{{ formatDeliveryDate(post.final_delivered_at) }}</small>
                    </div>
                  </div>

                  <!-- حالة 3: معتمد بالكامل والمستخدم مصرح له بالإضافة (المنفذ أو المدير) -->
                  <div v-else-if="canAddFinalDelivery(post)" class="final-delivery-add-box">
                    <button 
                      type="button" 
                      class="add-archive-btn" 
                      @click="openArchiveModal(post)"
                      title="إضافة رابط مجلد الأرشفة على Google Drive"
                    >
                      <span>＋ إضافة مجلد الأرشيف</span>
                    </button>
                  </div>

                  <!-- حالة 4: معتمد بالكامل ومستخدم آخر (للعرض فقط دون صلاحية) -->
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
                  @blur="autoSave(post, 'notes')" 
                  rows="2" 
                  placeholder="..." 
                  :disabled="!canEditNotes(post) || isFieldDisabled(post, 'notes')"
                ></textarea>
                <span v-if="hasLockIcon(post, 'notes')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'notes')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td v-if="canDeletePosts" class="text-center">
              <button 
                class="icon-btn delete-btn" 
                @click="deletePost(post, index)" 
                title="حذف الصف"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    
    <Teleport to="body">
      <div v-if="showAddRowModal" class="modal-overlay" @click.self="showAddRowModal = false">
      <div class="modal-content" style="width: min(400px, 100%)">
        <h3>إضافة منشور إضافي</h3>
        <p>حدد تاريخ اليوم الذي تريد إضافة صف جديد فيه.</p>
        <form @submit.prevent="addNewRow">
          <div class="form-group mt-3">
            <label>تاريخ المنشور</label>
            <VueDatePicker 
              v-model="newRowDate" 
              :enable-time-picker="false"
              auto-apply
              model-type="yyyy-MM-dd"
              format="yyyy-MM-dd"
              :min-date="planStartDate"
              :max-date="planEndDate"
              placeholder="اختر تاريخ المنشور"
              required
            ></VueDatePicker>
          </div>

          <!-- 🔴 الإضافة الجديدة التي نسيها الـ AI 🔴 -->
          <div class="form-group" style="margin-top: 20px; background: rgba(239, 68, 68, 0.05); padding: 12px; border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.3);">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0; font-size: 13px; color: #ef4444; font-weight: bold;">
              <input type="checkbox" v-model="newRowIsUrgent" style="width: 18px; height: 18px; accent-color: #ef4444;" />
              🚨 تعيين كمنشور عاجل ذو أولوية قصوى
            </label>
            <p style="margin: 5px 0 0 28px; font-size: 10px; color: #666;">سيظهر المنشور مميزاً باللون الأحمر لتنبيه فريق العمل.</p>
          </div>
          <!-- ==================================== -->

          <div class="modal-actions mt-4">
            <button type="button" class="secondary-btn" @click="showAddRowModal = false">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="addingRow || !newRowDate">إضافة الصف</button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>


    
    <Teleport to="body">
      <div v-if="rejectModalPost" class="modal-overlay" @click.self="rejectModalPost = null">
      <div class="modal-content" style="width: min(400px, 100%)">
        <h3 style="color: #cc0000;">رفض المنشور ({{ activeReviewTitle }}) ❌</h3>
        <p>يرجى توضيح سبب الرفض أو التعديلات المطلوبة للمنفذ.</p>
        <form @submit.prevent="submitReject">
          <div class="form-group">
            <label>سبب الرفض والتعديلات المطلوبة</label>
            <textarea v-model="rejectReason" rows="4" required placeholder="مثال: يرجى تعديل الألوان لتناسب الهوية..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="rejectModalPost = null">إلغاء</button>
            <button type="submit" class="primary-btn reject-submit-btn">إرسال الرفض</button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>


    
    <Teleport to="body">
      <div v-if="activeHistoryArray" class="modal-overlay" @click.self="activeHistoryArray = null">
      <div class="modal-content" style="width: min(500px, 100%)">
        <h3>📜 سجل الرفض والتعديلات ({{ activeHistoryTitle }})</h3>
        <div class="history-list">
          <div v-for="(record, idx) in activeHistoryArray" :key="idx" class="history-item">
            <div class="history-meta">
              <strong>بواسطة: {{ record.reviewer_name }}</strong>
              <span dir="ltr">{{ new Date(record.date).toLocaleString('ar-EG') }}</span>
            </div>
            <p class="history-reason">{{ record.reason }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="activeHistoryArray = null">إغلاق</button>
        </div>
      </div>
    </div>
    </Teleport>

    
    
    <Teleport to="body">
      <div v-if="showWaModal" class="modal-overlay" @click.self="showWaModal = false">
      <div class="modal-content wa-card" style="max-width: 450px; border-radius: 16px; overflow: hidden; padding: 0;">
        <div style="background: #25D366; color: white; padding: 20px; text-align: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" style="margin-bottom: 10px;"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/></svg>
          <h3 style="margin: 0; font-size: 20px;">إرسال إشعار واتساب</h3>
          <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">تم إعداد الرسالة تلقائياً. راجعها قبل الإرسال.</p>
        </div>
        
        <div style="padding: 20px;">
          <div class="form-group">
            <textarea v-model="waMessage" rows="5" dir="auto" style="border: 1px solid #ddd; border-radius: 8px; font-size: 14px; padding: 12px; width: 100%; box-sizing: border-box; background: #f9f9f9; resize: vertical;"></textarea>
          </div>

          <div class="mt-4">
            <label style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 8px; display: block;">الخيارات المتاحة (اضغط للإرسال):</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button v-for="(rec, idx) in waPayload.recipients" :key="idx" 
                      @click="sendWhatsApp(rec.phone, waMessage)" 
                      class="wa-btn primary">
                <span style="font-size: 16px;">💬</span> إرسال لـ {{ rec.name }} ({{ rec.role }})
              </button>
              
              <button v-if="waPayload.manager_phone && !isManager"
                      @click="sendWhatsApp(waPayload.manager_phone, `*نسخة للمدير للعلم:*\n\n` + waMessage)" 
                      class="wa-btn secondary">
                <span style="font-size: 16px;">📋</span> إرسال نسخة للمدير
              </button>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 25px; display: flex; justify-content: center;">
            <button type="button" class="secondary-btn" @click="showWaModal = false" style="width: 100%; padding: 10px; border-radius: 8px;">إغلاق / تجاهل</button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    
    
    <Teleport to="body">
      <div v-if="showLinksModal" class="modal-overlay" @click.self="showLinksModal = false">
      <div class="modal-content links-modal-card" style="width: min(540px, 95%); border-radius: 14px; padding: 22px;" dir="rtl">
        <div class="d-flex align-items-center justify-content-between mb-3" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
          <h3 style="margin: 0; font-size: 17px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
            <span>🔗</span>
            <span>روابط النشر الفعلية</span>
          </h3>
          <button type="button" @click="showLinksModal = false" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; line-height: 1;">✕</button>
        </div>

        <p v-if="pendingPublishStatus" style="color: #c2410c; font-weight: bold; font-size: 12.5px; background: #fff7ed; padding: 10px 12px; border-radius: 8px; border: 1px solid #ffedd5; margin-bottom: 15px;">
          ⚠️ لا يمكن إتمام عملية النشر قبل إرفاق الروابط الفعلية الصحيحة لكل منصة مطلوبة!
        </p>
        <p v-else style="font-size: 12px; color: #64748b; margin-bottom: 15px;">
          أدخل رابط المنشور الفعلي لكل منصة من المنصات المحددة أدناه (يتم التحقق تلقائياً من تطابق الرابط مع المنصة).
        </p>

        <form @submit.prevent="savePublishedLinks">
          <div class="form-group mb-3" v-for="(link, platform) in tempLinks" :key="platform" style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="mb-0" style="font-size: 12px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <span>🌐 منصة:</span>
                <span style="color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">{{ platform }}</span>
                <span class="required" style="color: #ef4444;">*</span>
              </label>

              <a 
                v-if="tempLinks[platform] && getPlatformValidation(platform, tempLinks[platform]).valid" 
                :href="getPlatformValidation(platform, tempLinks[platform]).formattedUrl" 
                target="_blank" 
                class="test-platform-link-btn"
                style="font-size: 11px; color: #2563eb; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"
                title="فتح الرابط للتجربة في نافذة جديدة"
              >
                <span>🔗 تجربة الرابط ↗</span>
              </a>
            </div>

            <input 
              type="text" 
              v-model="tempLinks[platform]" 
              :placeholder="`أدخل رابط منشور ${platform} (مثال: https://...)`" 
              dir="ltr" 
              required 
              style="width: 100%; padding: 9px 12px; border-radius: 6px; font-size: 12.5px; box-sizing: border-box; font-family: monospace; transition: all 0.2s;"
              :style="{
                border: !tempLinks[platform] || !tempLinks[platform].trim() ? '1.5px solid #cbd5e1' : (getPlatformValidation(platform, tempLinks[platform]).valid ? '1.5px solid #10b981' : '1.5px solid #ef4444'),
                background: !tempLinks[platform] || !tempLinks[platform].trim() ? '#fff' : (getPlatformValidation(platform, tempLinks[platform]).valid ? '#f0fdf4' : '#fef2f2')
              }"
            />

            <!-- رسالة التحقق الفوري -->
            <div v-if="tempLinks[platform] && tempLinks[platform].trim() && !getPlatformValidation(platform, tempLinks[platform]).valid" style="color: #dc2626; font-size: 11px; margin-top: 5px; font-weight: 600; line-height: 1.35;">
              ⚠️ {{ getPlatformValidation(platform, tempLinks[platform]).message }}
            </div>
            <div v-else-if="tempLinks[platform] && tempLinks[platform].trim() && getPlatformValidation(platform, tempLinks[platform]).valid" style="color: #059669; font-size: 11px; margin-top: 5px; font-weight: 600;">
              ✅ رابط صالح ومطابق لمنصة {{ platform }}
            </div>
          </div>

          <div class="modal-actions mt-4" style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="secondary-btn" @click="showLinksModal = false">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="saving || !areAllTempLinksValid">
              {{ saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ الروابط' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>

    <!-- مودال إضافة / تعديل رابط مجلد الأرشفة -->
    <Teleport to="body">
      <div v-if="archiveModalPost" class="modal-overlay" @click.self="closeArchiveModal">
        <div class="modal-content archive-modal-card" style="width: min(520px, 95%); border-radius: 14px; padding: 22px;" dir="rtl">
          <div class="d-flex align-items-center justify-content-between mb-3" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <h3 style="margin: 0; font-size: 17px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <span>📁</span>
              <span>{{ archiveModalPost.final_delivery_link ? 'تعديل رابط مجلد الأرشفة' : 'إضافة رابط مجلد الأرشفة' }}</span>
            </h3>
            <button type="button" @click="closeArchiveModal" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; line-height: 1;">✕</button>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 15px;">
            منشور #{{ getPostRowIndex(archiveModalPost) }} | تاريخ النشر: {{ formatDate(archiveModalPost.target_date) }}
          </p>

          <form @submit.prevent="saveArchiveModalLink">
            <div class="form-group mb-3">
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block;">
                رابط مجلد الأرشفة على Google Drive <span style="color: #ef4444;">*</span>
              </label>
              <input 
                type="url" 
                v-model="archiveModalLink" 
                @input="handleArchiveModalInput"
                placeholder="https://drive.google.com/drive/folders/..." 
                dir="ltr" 
                required 
                style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; box-sizing: border-box;"
                :style="{ borderColor: archiveModalError ? '#ef4444' : (archiveModalValid ? '#10b981' : '#cbd5e1') }"
              />
              <div v-if="archiveModalError" style="color: #ef4444; font-size: 11px; margin-top: 5px; font-weight: 600;">
                ⚠️ {{ archiveModalError }}
              </div>
              <div v-else-if="archiveModalValid" style="color: #059669; font-size: 11px; margin-top: 5px; font-weight: 600;">
                ✅ رابط مجلد Google Drive صالح
              </div>
            </div>

            <div v-if="archiveModalValid && archiveModalLink" class="mb-3">
              <a :href="formatExternalUrl(archiveModalLink)" target="_blank" class="extracted-link-btn final-folder-link" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 11.5px;">
                <span>🔗 فتح الرابط للتجربة والتأكد ↗</span>
              </a>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px 12px; border-radius: 8px; font-size: 11px; color: #64748b; margin-bottom: 20px;">
              🔒 <strong>تنبيه:</strong> بمجرد التأكيد، يتم تثبيت رابط الأرشفة للموظفين والمنفذ. التعديل لاحقاً متاح للمدير فقط.
            </div>

            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
              <button type="button" class="secondary-btn" @click="closeArchiveModal" :disabled="savingArchiveModal">
                إلغاء
              </button>
              <button 
                type="submit" 
                class="primary-btn" 
                :disabled="!archiveModalValid || savingArchiveModal"
                style="padding: 8px 18px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; border-radius: 6px; cursor: pointer;"
              >
                {{ savingArchiveModal ? '⏳ جارٍ الحفظ...' : (archiveModalPost.final_delivery_link ? '💾 حفظ التعديل' : '✅ تأكيد الإضافة وقفل الرابط') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>




                  <!-- View Post Modal (Premium Report Design) -->
    <teleport to="body">
      <div v-if="isViewModalOpen" class="modal-overlay premium-overlay" @click.self="closeViewModal">
      <div class="modal-content premium-report-modal">
        
        <!-- Header -->
        <div class="premium-header">
          <div class="header-titles">
            <h2 class="report-title">
              <span class="icon">📊</span> تقرير تفصيلي للمنشور
            </h2>
            <p v-if="!isMediaBuyer" class="report-subtitle">
              حالة النشر: 
              <span :class="['premium-badge', selectedPostForView.actual_publish_status === 'تم النشر' ? 'badge-success' : 'badge-warning']">
                {{ selectedPostForView.actual_publish_status || 'لم يتم' }}
              </span>
            </p>
            <p v-else class="report-subtitle">
              حالة التمويل: 
              <span :class="['premium-badge', selectedPostForView.finance_status === 'ممول' ? 'badge-success' : 'badge-warning']">
                {{ selectedPostForView.finance_status || 'غير ممول' }}
              </span>
            </p>
          </div>
          <button class="premium-close-btn" @click="closeViewModal">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div v-if="selectedPostForView" class="premium-body">
          <div class="report-grid">
            
            <!-- العمود الجانبي للبيانات الأساسية -->
            <div class="report-sidebar">
              <div class="premium-card">
                <h3 class="card-title">📌 معلومات أساسية</h3>
                <ul class="info-list">
                  <li>
                    <span class="info-icon">📅</span>
                    <div class="info-data">
                      <span class="info-label">تاريخ النشر المخطط</span>
                      <div v-if="canEditTargetDate(selectedPostForView)" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <strong class="info-value">{{ getDayName(selectedPostForView.target_date) }} - {{ formatDate(selectedPostForView.target_date) }}</strong>
                        <input 
                          type="date" 
                          class="modal-target-date-picker" 
                          :value="formatForDateInput(selectedPostForView.target_date)"
                          @change="handleTargetDateChange(selectedPostForView, $event)"
                          title="تعديل تاريخ النشر المخطط"
                        />
                      </div>
                      <div v-else>
                        <strong class="info-value">{{ getDayName(selectedPostForView.target_date) }} - {{ formatDate(selectedPostForView.target_date) }}</strong>
                        <span v-if="isPlanDelivered" class="plan-delivered-lock-tag" style="margin-right: 6px;">🔒 مقفل بعد التسليم النهائي</span>
                      </div>
                    </div>
                  </li>
                  <li v-if="selectedPostForView.publishing_time">
                    <span class="info-icon">⏰</span>
                    <div class="info-data">
                      <span class="info-label">وقت النشر</span>
                      <strong class="info-value" dir="ltr">{{ selectedPostForView.publishing_time }}</strong>
                    </div>
                  </li>
                  <li v-if="!isMediaBuyer">
                    <span class="info-icon">⏰</span>
                    <div class="info-data">
                      <span class="info-label">الديدلاين</span>
                      <strong class="info-value text-red">{{ formatDeadlineDisplay(selectedPostForView.deadline) }}</strong>
                      <div v-if="selectedPostForView.is_displaced" style="margin-top: 4px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="displaced-badge">🔄 مُرحّل رسمياً</span>
                          <button v-if="isManager" type="button" class="restore-deadline-mini-btn" @click="restorePostDeadline(selectedPostForView)" title="استرجاع موعد التسليم الأصلي ↩️">↩️ استرجاع</button>
                        </div>
                        <small v-if="selectedPostForView.original_deadline" style="display: block; font-size: 11px; color: #8fa0d4; margin-top: 2px;">
                          الموعد الأصلي: {{ formatDeadlineDisplay(selectedPostForView.original_deadline) }}
                        </small>
                      </div>
                    </div>
                  </li>
                  <li v-if="!isMediaBuyer && !isDesignerOrEditor">
                    <span class="info-icon">👨‍🎨</span>
                    <div class="info-data">
                      <span class="info-label">المنفذ</span>
                      <strong class="info-value text-blue">{{ getUserName(selectedPostForView.designer_id) }}</strong>
                    </div>
                  </li>
                  <li v-if="selectedPostForView.ad_platform">
                    <span class="info-icon">📢</span>
                    <div class="info-data">
                      <span class="info-label">منصة الإعلان</span>
                      <strong class="info-value">{{ Array.isArray(selectedPostForView.ad_platform) ? selectedPostForView.ad_platform.join(', ') : selectedPostForView.ad_platform }}</strong>
                    </div>
                  </li>
                  <li>
                    <span class="info-icon">💰</span>
                    <div class="info-data">
                      <span class="info-label">حالة التمويل</span>
                      <strong class="info-value">{{ selectedPostForView.finance_status || 'غير ممول' }}</strong>
                    </div>
                  </li>
                  <li v-if="selectedPostForView.finance_cost !== null && selectedPostForView.finance_cost !== undefined && selectedPostForView.finance_cost !== ''">
                    <span class="info-icon">💵</span>
                    <div class="info-data">
                      <span class="info-label">تكلفة التمويل</span>
                      <strong class="info-value">{{ selectedPostForView.finance_cost }} $</strong>
                    </div>
                  </li>
                  <li v-if="selectedPostForView.finance_days !== null && selectedPostForView.finance_days !== undefined && selectedPostForView.finance_days !== ''">
                    <span class="info-icon">📅</span>
                    <div class="info-data">
                      <span class="info-label">أيام التمويل</span>
                      <strong class="info-value">{{ selectedPostForView.finance_days }} يوم</strong>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- العمود الرئيسي للمحتوى -->
            <div class="report-main">
              <div v-if="!isMediaBuyer" class="premium-card highlight-card">
                <div class="card-header-flex">
                  <h3 class="card-title" style="margin: 0;">📝 تفاصيل المحتوى</h3>
                  <div class="tags-group">
                    <span class="premium-tag tag-type">{{ selectedPostForView.post_type || 'نوع غير محدد' }}</span>
                    <span v-for="obj in selectedPostForView.objective_array" :key="obj" class="premium-tag tag-objective">
                      🎯 {{ obj === 'آخر' ? selectedPostForView.custom_objective : obj }}
                    </span>
                  </div>
                </div>
                
                <div class="content-blocks">
                  <div class="text-block">
                    <span class="block-label">💡 الفكرة التفصيلية</span>
                    <div class="block-content">{{ selectedPostForView.detailed_idea || 'لا يوجد تفاصيل إضافية عن الفكرة.' }}</div>
                  </div>
                  
                  <div class="text-block">
                    <span class="block-label">✍️ الكابشن (Caption)</span>
                    <div class="block-content caption-box">{{ selectedPostForView.caption || 'لم يتم كتابة الكابشن بعد.' }}</div>
                  </div>

                  <div class="text-block-grid">
                    <div class="text-block small-block">
                      <span class="block-label">🗣️ TOV</span>
                      <div class="block-content">{{ selectedPostForView.tov || '---' }}</div>
                    </div>
                    <div class="text-block small-block">
                      <span class="block-label">👉 CTA</span>
                      <div class="block-content">{{ selectedPostForView.call_to_action || '---' }}</div>
                    </div>
                    <div class="text-block small-block">
                      <span class="block-label">#️⃣ Hashtags</span>
                      <div class="block-content hashtags-box">{{ selectedPostForView.hashtags || '---' }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- بطاقة الروابط -->
              <div class="premium-card links-card" :style="!isMediaBuyer ? 'margin-top: 24px;' : ''">
                <h3 class="card-title">🔗 {{ isMediaBuyer ? 'الروابط والتسليمات' : 'المراجع والروابط' }}</h3>
                <div class="links-grid">
                  <div v-if="!isMediaBuyer" class="link-group">
                    <span class="group-label">روابط المرجعية (References)</span>
                    <div class="premium-links-container" v-if="extractUrls(selectedPostForView.reference_link).length">
                      <a v-for="(url, i) in extractUrls(selectedPostForView.reference_link)" :key="i" :href="url" target="_blank" class="premium-btn-link ref-link">
                        <span class="link-icon">📑</span> {{ getUrlLabel(url, i) }}
                      </a>
                    </div>
                    <div v-else class="no-data">لا توجد مراجع</div>
                  </div>

                  <div class="link-group">
                    <span class="group-label">روابط التسليم (Deliverables)</span>
                    
                    <!-- إدخال وتعديل رابط التسليم من داخل المودال إذا كان المستخدم مصرح له -->
                    <div v-if="canEditDelivery(selectedPostForView)" class="modal-delivery-edit mt-2 mb-2">
                      <div class="relative">
                        <input 
                          type="url" 
                          v-model="selectedPostForView.delivery_links"
                          @input="handleDeliveryInput(selectedPostForView)"
                          @blur="autoSave(selectedPostForView, 'delivery_links')"
                          placeholder="أدخل رابط ملف جوجل درايف أو دوكس للتسليم..." 
                          dir="ltr"
                          class="modal-delivery-input"
                          :class="{ 'border-red-500': isDeliveryInvalid(selectedPostForView) }"
                        />
                      </div>
                      <p v-if="isDeliveryInvalid(selectedPostForView)" class="modal-error-msg">
                        <span>⚠️</span>
                        <span>{{ getDeliveryError(selectedPostForView) }}</span>
                      </p>
                      
                      <!-- زر التسليم / إعادة الإرسال من داخل المودال -->
                      <div class="mt-2 flex gap-2">
                        <button
                          v-if="selectedPostForView.review_status === 'مرفوض' || selectedPostForView.manager_review_status === 'مرفوض'"
                          @click="resubmitPost(selectedPostForView)"
                          :disabled="!isPostDeliveryValid(selectedPostForView)"
                          :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(selectedPostForView) }"
                          :title="!isPostDeliveryValid(selectedPostForView) ? (getDeliveryError(selectedPostForView) || 'رابط البوست غير صالح') : 'إعادة إرسال للمراجعة'"
                          class="primary-btn reject-submit-btn"
                          style="font-size: 11px; padding: 6px 12px;"
                        >إعادة إرسال للمراجعة 🔄</button>
                        <button
                          v-else
                          @click="markAsDelivered(selectedPostForView)"
                          :disabled="!isPostDeliveryValid(selectedPostForView)"
                          :class="{ 'disabled-delivery-btn': !isPostDeliveryValid(selectedPostForView) }"
                          :title="!isPostDeliveryValid(selectedPostForView) ? (getDeliveryError(selectedPostForView) || 'رابط البوست غير صالح') : 'تسجيل التسليم'"
                          class="primary-btn submit-delivery-btn"
                          style="font-size: 11px; padding: 6px 12px;"
                        >{{ selectedPostForView.delivered_at ? 'تحديث وقت التسليم' : 'تسجيل التسليم ✅' }}</button>
                      </div>
                    </div>

                    <div class="premium-links-container" v-if="extractUrls(selectedPostForView.delivery_links).length">
                      <a v-for="(url, i) in extractUrls(selectedPostForView.delivery_links)" :key="i" :href="url" target="_blank" class="premium-btn-link del-link">
                        <span class="link-icon">📁</span> {{ getUrlLabel(url, i) }}
                      </a>
                    </div>
                    <div v-else-if="!canEditDelivery(selectedPostForView)" class="no-data">لم يتم تسليم ملفات بعد</div>
                  </div>

                  <!-- التسليم النهائي للأرشفة في المودال -->
                  <div class="link-group mt-3" style="border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px;">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="group-label mb-0">📦 التسليم النهائي للأرشفة (Google Drive Folder)</span>
                      <span v-if="hasConfirmedFinalDelivery(selectedPostForView) && !selectedPostForView._editingFinalLink" class="modal-badge-locked" title="تم تثبيت الرابط ولا يمكن تعديله إلا من قِبل المدير">
                        🔒 مقفل (متاح للمدير فقط)
                      </span>
                    </div>
                    
                    <div v-if="!isPostFullyApproved(selectedPostForView)" class="modal-locked-notice">
                      🔒 متاح بعد اعتماد وموافقة القسم والمدير معاً
                    </div>

                    <!-- إذا كان الرابط مؤكداً ومحفوظاً -->
                    <div v-else-if="hasConfirmedFinalDelivery(selectedPostForView)" class="modal-delivery-view-box">
                      <div class="premium-links-container">
                        <a :href="formatExternalUrl(selectedPostForView.final_delivery_link)" target="_blank" class="premium-btn-link del-link">
                          <span class="link-icon">📁</span> فتح مجلد الأرشيف ↗
                        </a>
                        <button 
                          v-if="isManager" 
                          type="button" 
                          class="modal-edit-final-btn" 
                          @click="openArchiveModal(selectedPostForView)"
                          title="تعديل رابط الأرشفة (متاح للمدير فقط)">
                          ✏️ تعديل الرابط
                        </button>
                      </div>
                      <div class="final-delivered-badge mt-2" style="max-width: fit-content;">
                        <span>🔒 مؤرشف</span>
                        <small v-if="selectedPostForView.final_delivered_at">{{ formatDeliveryDate(selectedPostForView.final_delivered_at) }}</small>
                      </div>
                    </div>

                    <!-- إذا لم يُضف بعد والمستخدم مصرح له -->
                    <div v-else-if="canAddFinalDelivery(selectedPostForView)" class="mt-2">
                      <button 
                        type="button" 
                        class="add-archive-btn" 
                        @click="openArchiveModal(selectedPostForView)"
                        style="max-width: 220px; padding: 8px 14px; font-size: 12px;"
                      >
                        <span>＋ إضافة مجلد الأرشيف</span>
                      </button>
                    </div>

                    <div v-else class="no-data">لم يتم تسليم مجلد الأرشفة بعد</div>
                  </div>
                  
                  <div class="link-group" v-if="hasPublishedLinks(selectedPostForView)">
                    <span class="group-label">تم النشر على (Live Links)</span>
                    <div class="premium-links-container">
                      <a v-for="(link, platform) in selectedPostForView.published_links" :key="platform" v-show="link" :href="link" target="_blank" class="premium-btn-link live-link">
                        <span class="link-icon">🌐</span> {{ platform }}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- بطاقة الملاحظات (Notes) لو كانت موجودة -->
              <div v-if="selectedPostForView.notes" class="premium-card notes-card" style="margin-top: 24px;">
                <h3 class="card-title">📝 ملاحظات (Notes)</h3>
                <div class="notes-content" style="white-space: pre-wrap; color: #cbd5e1; line-height: 1.6; background: rgba(255, 255, 255, 0.03); padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                  {{ selectedPostForView.notes }}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      </div>
    </teleport>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import api from '../axios';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import CustomMultiSelect from '../components/CustomMultiSelect.vue';
import SmartDeadlinePicker from '../components/SmartDeadlinePicker.vue';
import alertService from '../services/alertService';

// استيراد المحرك الذكي
import { getDeadlineStatus } from '../utils/timeHelper';
// استيراد دالة التحقق من روابط درايف للبوست
import { validatePostDriveLink, validateDriveFolderLink } from '../utils/driveValidation';
// استيراد دالة التحقق من روابط منصات النشر
import { validatePlatformLink, detectPlatformFromUrl } from '../utils/platformValidation';

// دوال التحقق من صحة رابط تسليم البوست (Google Drive / Docs) مع التخزين المؤقت O(1)
const isPostDeliveryValid = (post) => {
  if (!post || !post.delivery_links || !String(post.delivery_links).trim()) return false;
  if (post._isDeliveryValid !== undefined) return post._isDeliveryValid;
  return validatePostDriveLink(post.delivery_links).valid;
};

const isDeliveryInvalid = (post) => {
  if (!post) return false;
  if (post.delivery_links && String(post.delivery_links).trim() !== '') {
    return !isPostDeliveryValid(post);
  }
  return Boolean(post._deliveryTouched);
};

const getDeliveryError = (post) => {
  if (!post) return '';
  if (post._deliveryError !== undefined) return post._deliveryError || '';
  const res = validatePostDriveLink(post.delivery_links);
  return res.valid ? '' : res.message;
};

const handleDeliveryInput = (post) => {
  if (!post) return;
  post._deliveryTouched = true;
  post._extractedDelUrls = undefined;
  const res = validatePostDriveLink(post.delivery_links);
  post._isDeliveryValid = res.valid;
  post._deliveryError = res.valid ? null : res.message;
};

const getExtractedRefUrls = (post) => {
  if (!post) return [];
  if (post._extractedRefUrls !== undefined) return post._extractedRefUrls;
  post._extractedRefUrls = extractUrls(post.reference_link);
  return post._extractedRefUrls;
};

const getExtractedDelUrls = (post) => {
  if (!post) return [];
  if (post._extractedDelUrls !== undefined) return post._extractedDelUrls;
  post._extractedDelUrls = extractUrls(post.delivery_links);
  return post._extractedDelUrls;
};

// دوال التحقق والتسليم النهائي للأرشفة (Google Drive Folder)
const isPostFullyApproved = (post) => {
  if (!post) return false;
  return post.review_status === 'معتمد' && post.manager_review_status === 'معتمد';
};

const hasConfirmedFinalDelivery = (post) => {
  if (!post) return false;
  return Boolean(post.final_delivery_link && String(post.final_delivery_link).trim() !== '');
};

const canAddFinalDelivery = (post) => {
  if (!post || !currentUser.value) return false;
  if (!isPostFullyApproved(post)) return false;
  const isExec = Number(currentUser.value.id) === Number(post.designer_id);
  const isMgr = Boolean(isManager.value);
  return isExec || isMgr;
};

const archiveModalPost = ref(null);
const archiveModalLink = ref('');
const archiveModalError = ref('');
const archiveModalValid = ref(false);
const savingArchiveModal = ref(false);

const getPostRowIndex = (post) => {
  if (!post) return '';
  const idx = posts.value.findIndex(p => p.id === post.id);
  return idx >= 0 ? idx + 1 : post.id;
};

const openArchiveModal = (post) => {
  if (!post) return;
  archiveModalPost.value = post;
  archiveModalLink.value = post.final_delivery_link || '';
  archiveModalError.value = '';
  archiveModalValid.value = Boolean(post.final_delivery_link && validateDriveFolderLink(post.final_delivery_link).valid);
};

const closeArchiveModal = () => {
  archiveModalPost.value = null;
  archiveModalLink.value = '';
  archiveModalError.value = '';
  archiveModalValid.value = false;
  savingArchiveModal.value = false;
};

const handleArchiveModalInput = () => {
  const val = archiveModalLink.value ? archiveModalLink.value.trim() : '';
  if (!val) {
    archiveModalValid.value = false;
    archiveModalError.value = 'يرجى إدخال الرابط';
    return;
  }
  const res = validateDriveFolderLink(val);
  archiveModalValid.value = res.valid;
  archiveModalError.value = res.valid ? '' : res.message;
};

const saveArchiveModalLink = async () => {
  if (!archiveModalPost.value) return;
  const post = archiveModalPost.value;
  const trimmed = String(archiveModalLink.value || '').trim();

  if (!trimmed) {
    archiveModalError.value = 'يرجى إدخال رابط مجلد الأرشفة أولاً.';
    return;
  }

  const res = validateDriveFolderLink(trimmed);
  if (!res.valid) {
    archiveModalError.value = res.message || 'يجب أن يكون الرابط عبارة عن رابط مجلد صحيح على Google Drive.';
    return;
  }

  savingArchiveModal.value = true;
  saving.value = true;
  try {
    const apiRes = await api.put(`/plan-posts/${post.id}`, {
      final_delivery_link: trimmed
    });

    const updatedData = apiRes.data?.data || {};
    post.final_delivery_link = updatedData.final_delivery_link || trimmed;
    post.final_delivered_at = updatedData.final_delivered_at || new Date().toISOString();
    post._isFinalDeliveryValid = true;
    post._finalDeliveryError = null;

    if (selectedPostForView.value && selectedPostForView.value.id === post.id) {
      selectedPostForView.value.final_delivery_link = post.final_delivery_link;
      selectedPostForView.value.final_delivered_at = post.final_delivered_at;
    }

    alertService.success('تم تأكيد وحفظ رابط الأرشفة بنجاح ✅');
    closeArchiveModal();
  } catch (err) {
    const errMsg = err.response?.data?.message || 'تعذر حفظ رابط الأرشفة!';
    archiveModalError.value = errMsg;
    alertService.error(errMsg);
  } finally {
    savingArchiveModal.value = false;
    saving.value = false;
  }
};

const canEditFinalDelivery = (post) => {
  return canAddFinalDelivery(post);
};


const getExtractedFinalDelUrls = (post) => {
  if (!post) return [];
  if (post._extractedFinalDelUrls !== undefined) return post._extractedFinalDelUrls;
  post._extractedFinalDelUrls = extractUrls(post.final_delivery_link);
  return post._extractedFinalDelUrls;
};

const route = useRoute();
const planId = route.params.id;

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    return null;
  }
};

const posts = ref([]);
const allUsers = ref([]);
const currentUser = ref(getStoredUser());
const currentPlan = ref(null);
let cachedPlanCategories = null;
const planCategories = ref([]);

const fetchPlanCategories = async () => {
  if (cachedPlanCategories && planCategories.value.length === 0) {
    planCategories.value = cachedPlanCategories;
  }
  try {
    const res = await api.get('/plan-categories/options');
    const data = res.data?.data || res.data || [];
    planCategories.value = data;
    cachedPlanCategories = data;
  } catch (error) {
    console.error('Error fetching plan categories options:', error);
  }
};

const currentPlanCategory = computed(() => {
  if (!currentPlan.value?.plan_type || !planCategories.value?.length) return null;
  const targetType = String(currentPlan.value.plan_type).trim().toLowerCase();
  return planCategories.value.find(c => String(c.name || '').trim().toLowerCase() === targetType) || null;
});

const availablePostTypes = computed(() => {
  const options = [];
  
  // 1. من عناصر نوع الخطة المحدد (Category items من إعدادات أنواع الخطط)
  if (currentPlanCategory.value?.items && Array.isArray(currentPlanCategory.value.items)) {
    currentPlanCategory.value.items.forEach(item => {
      const name = String(item.name || '').trim();
      if (name && !options.includes(name)) {
        options.push(name);
      }
    });
  }
  
  // 2. من عناصر ومخرجات الخطة الحالية نفسها إذا وُجدت
  if (currentPlan.value?.items && Array.isArray(currentPlan.value.items)) {
    currentPlan.value.items.forEach(item => {
      const name = String(item.item_name || item.name || '').trim();
      if (name && !options.includes(name)) {
        options.push(name);
      }
    });
  }

  // 3. كإجراء احتياطي إذا لم يكن لنوع الخطة عناصر محددة في الإعدادات
  if (options.length === 0) {
    const defaultTypes = ['Infograph', 'Video', 'Reel/Shorts', 'Text Only', 'Carousel'];
    defaultTypes.forEach(t => options.push(t));
  }
  
  // 4. التأكد من بقاء أي نوع منشور محفوظ مسبقاً في الصفوف الحالية حتى لا يظهر فارغاً
  (posts.value || []).forEach(p => {
    const val = String(p.post_type || '').trim();
    if (val && !options.includes(val)) {
      options.push(val);
    }
  });

  return options;
});
const isPlanResponsible = ref(false);
const accessDenied = ref(false);
const accessDeniedMessage = ref('');

const formatExternalUrl = (url) => {
  if (!url) return '#';
  const str = String(url).trim();
  return /^https?:\/\//i.test(str) ? str : `https://${str}`;
};

// روابط مجلدات جوجل درايف للعميل (المراجعة والتسليم النهائي)
const reviewFolderLink = computed(() => {
  if (!currentPlan.value) return null;

  // 1. من كائن folders المدمج في الخطة
  const directLink = currentPlan.value.folders?.review_link;
  if (directLink && typeof directLink === 'string' && directLink.trim() !== '') {
    return directLink.trim();
  }

  // 2. من كائن العميل client
  const clientReview = currentPlan.value.client?.review_link;
  if (clientReview && typeof clientReview === 'string' && clientReview.trim() !== '') {
    return clientReview.trim();
  }

  // 3. من مصفوفة أو كائن drive_links في بيانات العميل
  const driveLinks = currentPlan.value.client?.drive_links || currentPlan.value.client?.driveLinks;
  if (Array.isArray(driveLinks)) {
    const rf = driveLinks.find(d => 
      d && (d.title === 'رابط مراجعة خطط' || d.title?.includes('مراجعة خطط') || d.title?.includes('مراجعة') || d.type === 'review')
    );
    if (rf && (rf.url || rf.link) && String(rf.url || rf.link).trim() !== '') {
      return String(rf.url || rf.link).trim();
    }
  } else if (driveLinks && typeof driveLinks === 'object') {
    if (driveLinks.review_link && String(driveLinks.review_link).trim() !== '') {
      return String(driveLinks.review_link).trim();
    }
  }

  // 4. خيار احتياطي من الخطة مباشرة
  if (currentPlan.value.review_link && typeof currentPlan.value.review_link === 'string' && currentPlan.value.review_link.trim() !== '') {
    return currentPlan.value.review_link.trim();
  }

  return null;
});

const finalDeliveryFolderLink = computed(() => {
  if (!currentPlan.value) return null;

  // 1. من كائن folders المدمج في الخطة
  const directLink = currentPlan.value.folders?.final_delivery_link;
  if (directLink && typeof directLink === 'string' && directLink.trim() !== '') {
    return directLink.trim();
  }

  // 2. من كائن العميل client
  const clientFinal = currentPlan.value.client?.final_delivery_link;
  if (clientFinal && typeof clientFinal === 'string' && clientFinal.trim() !== '') {
    return clientFinal.trim();
  }

  // 3. من مصفوفة أو كائن drive_links في بيانات العميل
  const driveLinks = currentPlan.value.client?.drive_links || currentPlan.value.client?.driveLinks;
  if (Array.isArray(driveLinks)) {
    const ff = driveLinks.find(d => 
      d && (d.title === 'رابط تسليم نهائي خطط' || d.title?.includes('تسليم نهائي خطط') || d.title?.includes('تسليم نهائي') || d.type === 'final_delivery')
    );
    if (ff && (ff.url || ff.link) && String(ff.url || ff.link).trim() !== '') {
      return String(ff.url || ff.link).trim();
    }
  } else if (driveLinks && typeof driveLinks === 'object') {
    if (driveLinks.final_delivery_link && String(driveLinks.final_delivery_link).trim() !== '') {
      return String(driveLinks.final_delivery_link).trim();
    }
  }

  // 4. خيار احتياطي من الخطة مباشرة
  if (currentPlan.value.final_delivery_link && typeof currentPlan.value.final_delivery_link === 'string' && currentPlan.value.final_delivery_link.trim() !== '') {
    return currentPlan.value.final_delivery_link.trim();
  }

  return null;
});

const isManager = computed(() => {
  if (!currentUser.value) return false;
  return currentUser.value.role === 'manager';
});

const checkIfResponsibleFromPlan = (plan) => {
  if (!plan || !currentUser.value) return false;
  const uid = Number(currentUser.value.id);
  if (plan.users && Array.isArray(plan.users)) {
    return plan.users.some(u => Number(u.id) === uid && u.pivot?.task_role === 'responsible');
  }
  return false;
};

const checkIfExecutorFromPlan = (plan) => {
  if (!plan || !currentUser.value) return false;
  const uid = Number(currentUser.value.id);
  if (plan.users && Array.isArray(plan.users)) {
    return plan.users.some(u => Number(u.id) === uid && u.pivot?.task_role === 'executor');
  }
  return false;
};

const isMediaBuyer = computed(() => {
  return !isPlanResponsible.value && currentUser.value?.job_title === 'Media Buyer';
});

const isDesignerOrEditor = computed(() => {
  if (isManager.value || isPlanResponsible.value || checkIfResponsibleFromPlan(currentPlan.value)) {
    return false;
  }
  return ['Graphic Designer', 'Video Editor'].includes(currentUser.value?.job_title) || checkIfExecutorFromPlan(currentPlan.value);
});

const filteredPosts = computed(() => {
  // 1. المدير أو مسئول الخطة: يرى كل الصفوف
  if (currentUser.value?.role === 'manager' || isPlanResponsible.value) {
    return posts.value;
  }
  
  // 2. الميديا باير: يرى فقط المنشورات الممولة
  if (currentUser.value?.job_title === 'Media Buyer') {
    return posts.value.filter(post => post.finance_status === 'ممول');
  }
  
  // 3. باقي الموظفين (مصمم، مونتير، الخ): يرون فقط المنشورات التي تخصهم
  const currentUserId = currentUser.value?.id;
  return posts.value.filter(post => {
    const isDesigner = post.designer_id == currentUserId;
    // التأكد من أن reviewer_ids مصفوفة وتحتوي على الـ id
    const isReviewer = Array.isArray(post.reviewer_ids) && post.reviewer_ids.some(id => String(id) === String(currentUserId));
    
    return isDesigner || isReviewer;
  });
});

// المنشورات العاجلة والتنبيه العلوي
const currentUrgentIndex = ref(0);
const urgentPosts = computed(() => {
  return filteredPosts.value.filter(p => Boolean(p.is_urgent));
});

const urgentText = computed(() => {
  const c = urgentPosts.value.length;
  if (c === 1) return 'منشور عاجل واحد';
  if (c === 2) return 'منشوران عاجلان';
  if (c >= 3 && c <= 10) return `${c} منشورات عاجلة`;
  return `${c} منشوراً عاجلاً`;
});

const scrollToUrgent = () => {
  if (!urgentPosts.value.length) return;
  
  if (currentUrgentIndex.value >= urgentPosts.value.length) {
    currentUrgentIndex.value = 0;
  }
  
  const targetPost = urgentPosts.value[currentUrgentIndex.value];
  const el = document.getElementById(`post-row-${targetPost.id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('urgent-highlight-pulse');
    setTimeout(() => {
      el.classList.remove('urgent-highlight-pulse');
    }, 2500);
  }
  
  currentUrgentIndex.value = (currentUrgentIndex.value + 1) % urgentPosts.value.length;
};

const planStartDate = computed(() => {
  if (!currentPlan.value || !currentPlan.value.start_date) return null;
  return new Date(currentPlan.value.start_date);
});

const planEndDate = computed(() => {
  if (!currentPlan.value || !currentPlan.value.end_date) return null;
  return new Date(currentPlan.value.end_date);
});

const isViewModalOpen = ref(false);
const selectedPostForView = ref(null);

const openViewModal = (post) => {
  if (post) {
    if (post._finalDeliveryInput === undefined) {
      post._finalDeliveryInput = post.final_delivery_link || '';
    }
    post._editingFinalLink = false;
    post._finalDeliveryDraftTouched = false;
  }
  selectedPostForView.value = post;
  isViewModalOpen.value = true;
};

const closeViewModal = () => {
  isViewModalOpen.value = false;
  selectedPostForView.value = null;
};

const checkAndOpenQueryPost = () => {
  const targetPostId = route.query.postId || route.query.viewPost || route.query.post_id;
  if (!targetPostId || !posts.value.length) return;
  
  const foundPost = posts.value.find(p => String(p.id) === String(targetPostId));
  if (foundPost) {
    openViewModal(foundPost);
    nextTick(() => {
      const rowEl = document.getElementById(`post-row-${foundPost.id}`);
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowEl.classList.add('urgent-highlight-pulse');
        setTimeout(() => rowEl.classList.remove('urgent-highlight-pulse'), 3000);
      }
    });
  }
};

watch(() => route.query.postId, () => {
  checkAndOpenQueryPost();
});

const getUserName = (id) => {
  if (!id) return 'غير محدد';
  const user = allUsers.value.find(u => u.id === id);
  return user ? user.name : 'غير محدد';
};

const spreadsheetContainer = ref(null);
let isDown = false;
let startX;
let scrollLeft;

const onMouseDown = (e) => {
  if (!spreadsheetContainer.value) return;
  const targetTag = e.target.tagName.toLowerCase();
  if (['input', 'select', 'button', 'textarea', 'a', 'path', 'svg', 'label'].includes(targetTag) || e.target.closest('.icon-btn, .primary-btn, .secondary-btn, .custom-multiselect, .dropdown-menu, .multiselect-toggle, .smart-deadline-cell, .deadline-active-chip, .deadline-empty-btn, .deadline-popover-card, .target-date-interactive-box')) return;

  isDown = true;
  spreadsheetContainer.value.classList.add('dragging');
  startX = e.pageX - spreadsheetContainer.value.offsetLeft;
  scrollLeft = spreadsheetContainer.value.scrollLeft;
};

const onMouseLeave = () => {
  isDown = false;
  if (spreadsheetContainer.value) {
    spreadsheetContainer.value.classList.remove('dragging');
  }
};

const onMouseUp = () => {
  isDown = false;
  if (spreadsheetContainer.value) {
    spreadsheetContainer.value.classList.remove('dragging');
  }
};

const onMouseMove = (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - spreadsheetContainer.value.offsetLeft;
  const walk = (x - startX) * 1.5;
  spreadsheetContainer.value.scrollLeft = scrollLeft - walk;
};

const loading = ref(true);
const saving = ref(false);
const toastMessage = ref('');

const showAddRowModal = ref(false);
const newRowDate = ref('');
const newRowIsUrgent = ref(false);
const addingRow = ref(false);

const rejectModalPost = ref(null);
const rejectReason = ref('');
const activeReviewType = ref(''); 
const activeReviewTitle = ref('');

const activeHistoryArray = ref(null);
const activeHistoryTitle = ref('');

const showWaModal = ref(false);
const waPayload = ref(null);
const waMessage = ref('');

const showLinksModal = ref(false);
const currentPostForLinks = ref(null);
const tempLinks = ref({});
const pendingPublishStatus = ref(false);

const openLinksModal = (post, fromPublishAction = false) => {
  if (isMediaBuyer.value) return;
  currentPostForLinks.value = post;
  pendingPublishStatus.value = fromPublishAction;
  tempLinks.value = {};
  
  let platforms = [];
  if (post.publishing_platform) {
    if (Array.isArray(post.publishing_platform)) {
      platforms = post.publishing_platform;
    } else if (typeof post.publishing_platform === 'string') {
      try { platforms = JSON.parse(post.publishing_platform); } catch(e) {}
    }
  }

  platforms.forEach(platform => {
    tempLinks.value[platform] = post.published_links && post.published_links[platform] ? post.published_links[platform] : '';
  });
  
  showLinksModal.value = true;
};

const hasPublishedLinks = (post) => {
  if (!post || !post.published_links) return false;
  return Object.values(post.published_links).some(link => link && String(link).trim() !== '');
};

const canEditLinks = (post) => {
  if (isMediaBuyer.value) return false;
  const hasLinks = hasPublishedLinks(post);
  return !hasLinks || isManager.value; 
};

const getPlatformValidation = (platform, link) => {
  return validatePlatformLink(platform, link);
};

const areAllTempLinksValid = computed(() => {
  const keys = Object.keys(tempLinks.value || {});
  if (keys.length === 0) return false;
  return keys.every(platform => {
    const link = tempLinks.value[platform];
    if (!link || !String(link).trim()) return false;
    return validatePlatformLink(platform, link).valid;
  });
});

const savePublishedLinks = async () => {
  if (isMediaBuyer.value) return;
  const post = currentPostForLinks.value;
  if (!post) return;
  
  let platforms = [];
  if (post.publishing_platform) {
    if (Array.isArray(post.publishing_platform)) {
      platforms = post.publishing_platform;
    } else if (typeof post.publishing_platform === 'string') {
      try { platforms = JSON.parse(post.publishing_platform); } catch(e) {}
    }
  }

  // 1. التأكد من وجود روابط لجميع المنصات المحددة
  let missingPlatforms = [];
  platforms.forEach(platform => {
    if (!tempLinks.value[platform] || String(tempLinks.value[platform]).trim() === '') {
      missingPlatforms.push(platform);
    }
  });

  if (missingPlatforms.length > 0) {
    const missingStr = missingPlatforms.join('، ');
    alertService.error(`عذراً، يجب إدخال روابط لجميع المنصات المحددة: ${missingStr}`);
    return;
  }

  // 2. التحقق من مطابقة كل رابط للمنصة الخاصة به
  const formattedLinks = {};
  for (const platform of platforms) {
    const valResult = validatePlatformLink(platform, tempLinks.value[platform]);
    if (!valResult.valid) {
      alertService.error(valResult.message);
      return;
    }
    formattedLinks[platform] = valResult.formattedUrl;
  }

  const payload = { published_links: formattedLinks };
  
  if (pendingPublishStatus.value) {
    payload.actual_publish_status = 'تم النشر';
  }

  saving.value = true;
  try {
    const res = await api.put(`/plan-posts/${post.id}`, payload);
    post.published_links = res.data.data ? res.data.data.published_links : formattedLinks;
    if (pendingPublishStatus.value) {
      post.actual_publish_status = 'تم النشر';
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (!post.publishing_time) {
        post.publishing_time = currentTime;
      } else if (!post.publishing_time.includes(currentTime)) {
        post.publishing_time = `${post.publishing_time} - ${currentTime}`;
      }
      autoSave(post, 'publishing_time');
    }
    showLinksModal.value = false;
    alertService.success('تم التحقق من الروابط وحفظها بنجاح ✅');
  } catch (error) {
    const errMsg = error.response?.data?.message || 'حدث خطأ أثناء حفظ الروابط!';
    alertService.error(errMsg);
    if (pendingPublishStatus.value) {
      post.actual_publish_status = 'لم يتم';
    }
  } finally {
    saving.value = false;
  }
};

const openWaModal = (payload) => {
  if (!payload || !payload.recipients || payload.recipients.length === 0) return;
  waPayload.value = payload;
  waMessage.value = payload.message;
  showWaModal.value = true;
};

const sendWhatsApp = (phone, customMessage) => {
  if (!phone) {
    if (typeof showToast === 'function') showToast('رقم الهاتف غير متوفر');
    return;
  }
  const text = encodeURIComponent(customMessage || waMessage.value);
  
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    cleanPhone = '2' + cleanPhone;
  }
  
  window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${text}`, '_blank');
};

const showToast = (message, type = 'info') => {
  if (!message) return;
  if (message.includes('خطأ') || message.includes('تعذر') || message.includes('فشل') || message.includes('غير مصرح') || message.includes('⚠️')) {
    alertService.error(message);
  } else if (message.includes('تم') || message.includes('نجاح') || message.includes('✅') || message.includes('🚀')) {
    alertService.success(message);
  } else {
    alertService.toast(message, type);
  }
};



// الأكونت مانجر: بالمسمى الوظيفي أو بالمسؤولية عن هذه الخطة
const isAccountManager = computed(() => {
  if (!currentUser.value) return false;
  if (currentUser.value.job_title === 'Account Manager') return true;
  return isPlanResponsible.value || checkIfResponsibleFromPlan(currentPlan.value);
});

// هل تم التسليم النهائي للخطة؟
const isPlanDelivered = computed(() => {
  if (!currentPlan.value) return false;
  return currentPlan.value.status === 'completed' || !!currentPlan.value.actual_delivery_date;
});

// صلاحية تعديل تاريخ النشر المخطط: للمدير والأكونت مانجر فقط ويقفل بعد التسليم النهائي للخطة
const canEditTargetDate = (post) => {
  if (isPlanDelivered.value) return false;
  return isManager.value || isAccountManager.value;
};

const dateInputRefs = ref({});
const registerDateInput = (postId, el) => {
  if (el) {
    dateInputRefs.value[postId] = el;
  }
};

const formatForDateInput = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return '';
  }
};

const onTargetDateContainerClick = (postId) => {
  const el = dateInputRefs.value[postId];
  if (el) {
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
      } catch (err) {
        el.focus();
      }
    } else {
      el.focus();
    }
  }
};

const onDateInputClick = (event) => {
  const el = event.target;
  if (el && typeof el.showPicker === 'function') {
    try {
      el.showPicker();
    } catch (e) {
      // fallback
    }
  }
};

const handleTargetDateChange = async (post, event) => {
  const newDate = event.target.value;
  if (!newDate) return;
  if (formatForDateInput(post.target_date) === newDate) return;

  // 🛡️ فحص قفل الأمان: منع تقديم تاريخ النشر ليكون قبل موعد الديدلاين الحالي
  if (post.deadline) {
    const deadlineDateStr = String(post.deadline).trim().substring(0, 10);
    if (deadlineDateStr > newDate) {
      showToast(`عذراً، لا يمكن جعل تاريخ النشر (${newDate}) قبل موعد التسليم الابتدائي للمنشور (${deadlineDateStr})! يرجى تقديم الديدلاين أولاً.`, 'error');
      event.target.value = formatForDateInput(post.target_date);
      return;
    }
  }

  const oldDate = post.target_date;
  post.target_date = newDate;

  saving.value = true;
  try {
    const res = await api.put(`/plan-posts/${post.id}`, { target_date: newDate });
    showToast('تم تحديث تاريخ النشر المخطط بنجاح ✅', 'success');
    posts.value.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
  } catch (error) {
    post.target_date = oldDate;
    const msg = error.response?.data?.message || 'تعذر تحديث تاريخ النشر المخطط!';
    showToast(msg, 'error');
  } finally {
    saving.value = false;
  }
};

const canDeletePosts = computed(() => {
  return isManager.value || isPlanResponsible.value || checkIfResponsibleFromPlan(currentPlan.value);
});

// دوال احتساب الصلاحيات بدقة مع التخزين المؤقت في O(1) لتسريع ريندر الجدول
const computeCanEditFields = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  
  if (isPlanResponsible.value) {
    const isDelivered = !!post.delivered_at;
    const isRejected = post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض';
    
    if (isDelivered && !isRejected) {
      return false;
    }
    return true;
  }
  
  return false;
};

const computeCanEditPublishAndNotes = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanResponsible.value) return true;
  
  return computeCanEditFields(post);
};

const computeCanEditNotes = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanResponsible.value) return true;

  const currentUserId = String(currentUser.value.id);
  const isExecutor = post.designer_id != null && String(post.designer_id) === currentUserId;

  let isReviewer = false;
  if (post.reviewer_ids) {
    if (Array.isArray(post.reviewer_ids)) {
      isReviewer = post.reviewer_ids.some(id => String(id) === currentUserId);
    } else {
      isReviewer = String(post.reviewer_ids) === currentUserId;
    }
  }

  return isExecutor || isReviewer;
};

const computeCanEditDelivery = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  
  if (currentUser.value.id === post.designer_id) {
    const isDelivered = !!post.delivered_at;
    const isRejected = post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض';
    
    if (isDelivered && !isRejected) {
      return false;
    }
    return true;
  }
  
  return false;
};

const canEditFields = (post) => {
  if (!post) return false;
  if (post._canEdit !== undefined) return post._canEdit;
  return computeCanEditFields(post);
};

const canEditPublishAndNotes = (post) => {
  if (!post) return false;
  if (post._canEditPublishAndNotes !== undefined) return post._canEditPublishAndNotes;
  return computeCanEditPublishAndNotes(post);
};

const canEditNotes = (post) => {
  if (!post) return false;
  if (post._canEditNotes !== undefined) return post._canEditNotes;
  return computeCanEditNotes(post);
};

const canEditDelivery = (post) => {
  if (!post) return false;
  if (post._canEditDelivery !== undefined) return post._canEditDelivery;
  return computeCanEditDelivery(post);
};

// دالة المعالجة المسبقة للمنشورات لتفادي آلاف العمليات الحسابية المتكررة في كل فريم
const enrichPost = (post) => {
  if (!post) return post;
  post._lockedFieldsSet = new Set(Array.isArray(post.locked_fields) ? post.locked_fields : []);
  post._isDeliveryValid = (post.delivery_links && String(post.delivery_links).trim()) ? validatePostDriveLink(post.delivery_links).valid : false;
  post._isFinalDeliveryValid = (post.final_delivery_link && String(post.final_delivery_link).trim()) ? validateDriveFolderLink(post.final_delivery_link).valid : false;
  post._finalDeliveryInput = post.final_delivery_link || '';
  post._editingFinalLink = false;
  post._finalDeliveryDraftTouched = false;
  post._canEdit = computeCanEditFields(post);
  post._canEditPublishAndNotes = computeCanEditPublishAndNotes(post);
  post._canEditNotes = computeCanEditNotes(post);
  post._canEditDelivery = computeCanEditDelivery(post);
  return post;
};

const enrichPosts = (postsList) => {
  if (!Array.isArray(postsList)) return;
  for (let i = 0; i < postsList.length; i++) {
    enrichPost(postsList[i]);
  }
};

const startExecution = async (post) => {
  const confirmed = await alertService.confirm({
    title: 'بدء تنفيذ المنشور',
    message: 'هل أنت متأكد من تكليف المنفذ وبدء العمل؟ (تأكد من استكمال كافة بيانات الـ Brief)',
    confirmText: 'نعم، ابدأ العمل 🚀',
    cancelText: 'إلغاء',
    type: 'info'
  });
  if (!confirmed) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/start-execution`);
    
    post.execution_started_at = res.data.data.execution_started_at;
    
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
    
    if (typeof showToast === 'function') {
      showToast(res.data.message || 'تم إعطاء إشارة البدء بنجاح 🚀');
    }
  } catch (error) {
    if (typeof showToast === 'function') {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة بدء التنفيذ.');
    }
  }
};

const formatDeliveryDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${hours}:${minutes} ${ampm}`;
};

const markAsDelivered = (post) => {
  post._deliveryTouched = true;
  const valResult = validatePostDriveLink(post.delivery_links);
  if (!valResult.valid) {
    showToast(valResult.message || 'رابط البوست غير صالح ولن يتم حفظه');
    return;
  }

  if (!post.delivery_links || extractUrls(post.delivery_links).length === 0) {
    showToast('⚠️ لا يمكن التسليم بدون إرفاق رابط صحيح (يبدأ بـ http) في خانة التسليم.');
    return;
  }
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  
  post.delivered_at = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
  autoSave(post, 'delivered_at');
};

const resubmitPost = async (post) => {
  post._deliveryTouched = true;
  const valResult = validatePostDriveLink(post.delivery_links);
  if (!valResult.valid) {
    showToast(valResult.message || 'رابط البوست غير صالح ولن يتم حفظه');
    return;
  }

  if (!post.delivery_links || extractUrls(post.delivery_links).length === 0) {
    showToast('⚠️ لا يمكن إعادة التسليم للمراجعة بدون إرفاق روابط صحيحة.');
    return;
  }
  const confirmed = await alertService.confirm({
    title: 'إعادة إرسال للمراجعة',
    message: 'هل أنت متأكد من إعادة إرسال المنشور للمراجعة؟',
    confirmText: 'نعم، أعد الإرسال 🔄',
    cancelText: 'إلغاء',
    type: 'info'
  });
  if (!confirmed) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/resubmit`);
    
    post.delivered_at = res.data.data.delivered_at;
    post.review_status = res.data.data.review_status;
    post.manager_review_status = res.data.data.manager_review_status;
    post.reviewers_statuses = res.data.data.reviewers_statuses || {};
    post.manager_approved_at = res.data.data.manager_approved_at;
    
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
    
    if (typeof showToast === 'function') {
      showToast('تمت إعادة الإرسال للمراجعة بنجاح 🔄');
    }
  } catch (error) {
    if (typeof showToast === 'function') {
      showToast('حدث خطأ أثناء إعادة الإرسال.');
    }
  }
};

const isFieldDisabled = (post, fieldName) => {
  if (isManager.value) return false;
  if (post?._lockedFieldsSet) return post._lockedFieldsSet.has(fieldName);
  return post?.locked_fields && Array.isArray(post.locked_fields) && post.locked_fields.includes(fieldName);
};

const hasLockIcon = (post, fieldName) => {
  if (post?._lockedFieldsSet) return post._lockedFieldsSet.has(fieldName);
  return post?.locked_fields && Array.isArray(post.locked_fields) && post.locked_fields.includes(fieldName);
};

const unlockField = async (post, fieldName) => {
  if (!isManager.value) return;
  
  try {
    const response = await api.post(`/plan-posts/${post.id}/unlock-field`, { field_name: fieldName });
    post.locked_fields = response.data.locked_fields || response.data.data?.locked_fields || [];
    enrichPost(post);
    
    if (typeof showToast === 'function') {
      showToast('تم فك القفل بنجاح 🔓');
    }
  } catch (error) {
    console.error('فشل فك القفل:', error);
    if (typeof showToast === 'function') {
      showToast('حدث خطأ أثناء فك القفل');
    }
  }
};

const isReviewerCheck = computed(() => {
    if (!currentUser.value) return true;
    if (isManager.value) return false;
    if (isPlanResponsible.value) return false;
    return true; 
});

const normalizeDeadline = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:00`;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
};

const formatDeadlineDisplay = (val) => {
  if (!val) return 'غير محدد';
  const str = String(val).trim();
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/);
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  if (match) {
    const y = match[1];
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const h24 = parseInt(match[4], 10);
    const min = match[5];
    const ampm = h24 >= 12 ? 'م' : 'ص';
    const h12 = h24 % 12 || 12;
    return `${d} ${months[m]} ${y} • ${String(h12).padStart(2, '0')}:${min} ${ampm}`;
  }
  return formatDate(val) || 'غير محدد';
};

const formatDateTimeLocal = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return `${d.getDate()}/${d.getMonth() + 1}`;
};
const getDayName = (dateString) => {
  if (!dateString) return '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[new Date(dateString).getDay()];
};

const fetchCurrentUser = async () => {
  try {
    const res = await api.get('/user');
    currentUser.value = res.data;
  } catch (error) {
    console.error('تعذر جلب بيانات المستخدم الحالي');
  }
};

// ذاكرة تخزين مؤقت على مستوى الموديول لتفادي استهلاك الشبكة
let cachedUsers = null;

const fetchUsers = async () => {
  if (cachedUsers && allUsers.value.length === 0) {
    allUsers.value = cachedUsers;
    return;
  }
  try {
    const res = await api.get('/users?per_page=100');
    const data = res.data.data || [];
    allUsers.value = data;
    cachedUsers = data;
  } catch (error) {}
};

const predefinedObjectives = ['Awareness', 'Educational', 'Engagement', 'Storytelling', 'Conversion', 'Social Proof'];

const objectiveOptions = [
  { label: 'Awareness', value: 'Awareness' },
  { label: 'Educational', value: 'Educational' },
  { label: 'Engagement', value: 'Engagement' },
  { label: 'Storytelling', value: 'Storytelling' },
  { label: 'Conversion', value: 'Conversion' },
  { label: 'Social Proof', value: 'Social Proof' },
  { label: 'آخر (كتابة يدوية)', value: 'آخر' }
];

const getObjectiveClass = (obj) => {
  const mapping = {
    'Awareness': 'obj-awareness',
    'Educational': 'obj-educational',
    'Engagement': 'obj-engagement',
    'Storytelling': 'obj-storytelling',
    'Conversion': 'obj-conversion',
    'Social Proof': 'obj-social-proof'
  };
  return mapping[obj] || '';
};

const handleObjectiveChange = (post) => {
  let finalArray = (post.objective_array || []).filter(v => v !== 'آخر');
  if (post.objective_array && post.objective_array.includes('آخر') && post.custom_objective) {
    finalArray.push(post.custom_objective);
  }
  post.objective = finalArray.join(', ');
  autoSave(post, 'objective');
};

const fetchCurrentPlan = async () => {
  try {
    const res = await api.get(`/content-plans/${planId}`);
    currentPlan.value = res.data.data || res.data;
    
    // التحقق من صلاحية الموظف: منع الفتح إذا كانت الخطة تتطلب مراجعة ولم تُعتمد داخلياً بعد
    if (!isManager.value && currentPlan.value?.requires_review && !['reviewed', 'completed'].includes(currentPlan.value?.status)) {
      accessDenied.value = true;
      accessDeniedMessage.value = 'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.';
      return;
    }

    if (checkIfResponsibleFromPlan(currentPlan.value)) {
      isPlanResponsible.value = true;
      if (posts.value && posts.value.length) {
        enrichPosts(posts.value);
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      accessDenied.value = true;
      accessDeniedMessage.value = error.response.data?.message || 'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.';
      return;
    }
    console.error('Error fetching plan details:', error);
  }
};

const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/content-plans/${planId}/posts`);
    const rawPosts = res.data.data || [];
    posts.value = rawPosts.map(p => {
      let objArr = p.objective ? p.objective.split(', ') : [];
      let custom = objArr.filter(o => !predefinedObjectives.includes(o));
      let predefined = objArr.filter(o => predefinedObjectives.includes(o));
      
      let finalObjArr = [...predefined];
      if (custom.length > 0) finalObjArr.push('آخر');

      return enrichPost({
        ...p,
        objective_array: finalObjArr,
        custom_objective: custom.join(', '),
        ad_platform: Array.isArray(p.ad_platform) ? p.ad_platform : (p.ad_platform ? JSON.parse(p.ad_platform) : []),
        reviewer_ids: Array.isArray(p.reviewer_ids) ? p.reviewer_ids : (p.reviewer_ids ? JSON.parse(p.reviewer_ids) : []),
        published_links: typeof p.published_links === 'string' ? JSON.parse(p.published_links || '{}') : (p.published_links || {}),
        deadline: normalizeDeadline(p.deadline)
      });
    });
    
    isPlanResponsible.value = res.data.is_responsible || checkIfResponsibleFromPlan(currentPlan.value) || isPlanResponsible.value || false;
    if (isPlanResponsible.value) {
      enrichPosts(posts.value);
    }
    
  } catch (error) {
    if (error.response?.status === 403) {
      accessDenied.value = true;
      accessDeniedMessage.value = error.response.data?.message || 'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.';
      return;
    }
    showToast('تعذر تحميل بيانات اللوحة.');
  } finally {
    loading.value = false;
    nextTick(() => {
      checkAndOpenQueryPost();
    });
  }
};

const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

const getUrlLabel = (url, index) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    let name = domain.split('.')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (name.toLowerCase() === 'drive') name = 'Google Drive';
    if (name.toLowerCase() === 'docs') name = 'Google Docs';
    if (name.toLowerCase() === 'trello') name = 'Trello';
    
    if (name.length > 12) name = name.substring(0, 10) + '...';
    
    return `🔗 ${name}`;
  } catch (e) {
    return `🔗 رابط ${index + 1}`;
  }
};

const deletePost = async (post, index) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف المنشور',
    message: 'هل أنت متأكد من حذف هذا الصف نهائياً؟ لا يمكن التراجع عن هذه الخطوة.',
    confirmText: 'نعم، احذف الصف 🗑️',
    cancelText: 'إلغاء',
    type: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/plan-posts/${post.id}`);
    const idx = posts.value.findIndex(p => p.id === post.id);
    if (idx !== -1) {
      posts.value.splice(idx, 1);
    } else {
      posts.value.splice(index, 1);
    }
    if (typeof showToast === 'function') {
      showToast('تم حذف الصف بنجاح 🗑️');
    }
  } catch (error) {
    console.error('فشل الحذف:', error);
    if (typeof showToast === 'function') {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة الحذف');
    }
  }
};

const autoSave = async (post, field) => {
  if (field === 'delivery_links') {
    // التحقق الصارم من رابط تسليم البوست (Google Drive / Docs)
    const valResult = validatePostDriveLink(post.delivery_links);
    if (!valResult.valid) {
      post._deliveryTouched = true;
      post._deliveryError = valResult.message;
      post._isDeliveryValid = false;
      showToast('رابط البوست غير صالح ولن يتم حفظه');
      return; // منع إرسال طلب الـ API
    }
    post._deliveryError = null;
    post._isDeliveryValid = true;
  }

  if (field === 'final_delivery_link') {
    if (post.final_delivery_link && !isManager.value) {
      showToast('عذراً، تم تثبيت رابط الأرشفة مسبقاً ولا يمكن تعديله إلا من قِبل المدير.');
      return;
    }
    // التحقق الصارم من رابط مجلد الأرشفة (Google Drive Folder)
    if (post.final_delivery_link && String(post.final_delivery_link).trim()) {
      const valResult = validateDriveFolderLink(post.final_delivery_link);
      if (!valResult.valid) {
        post._finalDeliveryTouched = true;
        post._finalDeliveryError = valResult.message;
        post._isFinalDeliveryValid = false;
        showToast(valResult.message || 'رابط مجلد الأرشفة غير صالح ولن يتم حفظه');
        return;
      }
    }
    post._finalDeliveryError = null;
    post._isFinalDeliveryValid = true;
  }

  if (field === 'deadline') {
    if (post.deadline) {
      const deadlineDateStr = String(post.deadline).trim().substring(0, 10);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      if (deadlineDateStr < todayStr) {
        showToast(`عذراً، لا يمكن اختيار موعد تسليم ابتدائي في يوم مضى أو تاريخ سابق (${deadlineDateStr})!`, 'error');
        return;
      }

      if (post.target_date) {
        const targetDateStr = String(post.target_date).trim().substring(0, 10);
        if (deadlineDateStr > targetDateStr) {
          showToast(`عذراً، لا يمكن أن يكون موعد التسليم الابتدائي (${deadlineDateStr}) بعد تاريخ النشر المخطط (${targetDateStr})!`, 'error');
          return;
        }
      }
    }
  }

  saving.value = true;
  try {
    const res = await api.put(`/plan-posts/${post.id}`, { [field]: post[field] });
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
    if (field === 'delivery_links' || field === 'reference_link' || field === 'final_delivery_link') {
      post._extractedRefUrls = undefined;
      post._extractedDelUrls = undefined;
      post._extractedFinalDelUrls = undefined;
    }
    if (res.data?.data?.final_delivered_at) {
      post.final_delivered_at = res.data.data.final_delivered_at;
    }
    enrichPost(post);

    if (res.data?.cascade_warning) {
      showToast(res.data.cascade_warning, 'warning');
      await fetchPosts();
    } else if (res.data?.displaced_items && res.data.displaced_items.length > 0) {
      showToast(`تم ترحيل ${res.data.displaced_items.length} من المهام/المنشورات تلقائياً لليوم التالي لتجاوز سعة العمل 8 ساعات 🔄`, 'info');
      await fetchPosts();
    } else if (res.data?.rolled_back_items && res.data.rolled_back_items.length > 0) {
      showToast(`تم إرجاع ${res.data.rolled_back_items.length} من المهام/المنشورات لمواعيدها الأصلية بعد زوال حالة الطوارئ ↩️`, 'success');
      await fetchPosts();
    }
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ التلقائي!');
  } finally {
    setTimeout(() => { saving.value = false; }, 500);
  }
};

const restorePostDeadline = async (post) => {
  if (!post) return;
  const confirmed = await alertService.confirm({
    title: 'استرجاع موعد التسليم الأصلي',
    message: `هل أنت متأكد من استرجاع موعد التسليم الأصلي (${formatDeadlineDisplay(post.original_deadline)}) لهذا المنشور وإلغاء حالة الترحيل؟`,
    confirmText: 'نعم، استرجع الموعد ↩️',
    cancelText: 'إلغاء',
    type: 'info'
  });
  if (!confirmed) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/restore-deadline`);
    showToast(res.data?.message || 'تم استرجاع موعد التسليم الأصلي بنجاح ↩️', 'success');
    if (selectedPostForView.value && selectedPostForView.value.id === post.id) {
      selectedPostForView.value.is_displaced = false;
      selectedPostForView.value.displaced_reason = null;
      if (res.data?.data?.deadline) {
        selectedPostForView.value.deadline = res.data.data.deadline;
      }
    }
    await fetchPosts();
  } catch (err) {
    showToast(err.response?.data?.message || 'حدث خطأ أثناء استرجاع الموعد!', 'error');
  }
};

const toggleUrgent = async (post) => {
  post.is_urgent = !post.is_urgent;
  await autoSave(post, 'is_urgent');
};

const approvePost = async (post, type) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد اعتماد المنشور',
    message: `هل أنت متأكد من تسجيل الاعتماد (${type === 'manager' ? 'اعتماد المدير' : 'مراجعة القسم'})؟`,
    confirmText: 'نعم، اعتمد المنشور ✅',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/review`, { 
      review_type: type,
      status: 'معتمد' 
    });
    
    post.review_status = res.data.data.review_status;
    post.manager_review_status = res.data.data.manager_review_status;
    post.reviewers_statuses = res.data.data.reviewers_statuses;
    post.department_approved_at = res.data.data.department_approved_at;
    post.manager_approved_at = res.data.data.manager_approved_at;
    
    if (res.data?.whatsapp_payload) {
      openWaModal(res.data.whatsapp_payload);
    }
    
    showToast(res.data.data.review_status === 'معتمد' ? 'تم الاعتماد بنجاح ✅' : 'تم تسجيل موافقتك، بانتظار باقي المراجعين ⏳');
  } catch (error) {
    showToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ');
  }
};

const resetReview = async (post, type) => {
  const confirmed = await alertService.confirm({
    title: 'إعادة فتح المراجعة',
    message: 'هل أنت متأكد من التراجع وإعادة فتح المراجعة لهذا المنشور؟',
    confirmText: 'نعم، أعد فتح المراجعة 🔄',
    cancelText: 'إلغاء',
    type: 'warning'
  });
  if (!confirmed) return;
  
  try {
    if (type === 'manager') {
      await api.put(`/plan-posts/${post.id}`, { manager_review_status: 'قيد الانتظار' });
      post.manager_review_status = 'قيد الانتظار';
      post.manager_approved_at = null;
    } else {
      await api.put(`/plan-posts/${post.id}`, { 
        review_status: 'قيد الانتظار',
        reviewers_statuses: {} 
      });
      post.review_status = 'قيد الانتظار';
      post.reviewers_statuses = {};
      post.department_approved_at = null;
    }
    showToast('تم التراجع، المنشور الآن قيد الانتظار 🔄');
  } catch (error) {
    showToast('حدث خطأ أثناء التراجع');
  }
};

const openRejectModal = (post, type) => {
  rejectReason.value = '';
  rejectModalPost.value = post;
  activeReviewType.value = type;
  activeReviewTitle.value = type === 'manager' ? 'المدير' : 'القسم';
};

const submitReject = async () => {
  if (!rejectReason.value) return;
  try {
    const res = await api.post(`/plan-posts/${rejectModalPost.value.id}/review`, { 
      review_type: activeReviewType.value,
      status: 'مرفوض', 
      reason: rejectReason.value 
    });
    
    rejectModalPost.value.review_status = res.data.data.review_status;
    rejectModalPost.value.manager_review_status = res.data.data.manager_review_status;
    
    if (activeReviewType.value === 'manager') {
      rejectModalPost.value.manager_rejection_history = res.data.data.manager_rejection_history;
    } else {
      rejectModalPost.value.rejection_history = res.data.data.rejection_history;
    }
    
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
    
    showToast('تم إرسال الرفض 🔴');
    rejectModalPost.value = null; 
  } catch (error) {
    showToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ');
  }
};

const openHistoryModal = (historyArray, title) => {
  activeHistoryArray.value = historyArray;
  activeHistoryTitle.value = title;
};

const handlePublishStatusChange = (post, event) => {
  const newStatus = post.actual_publish_status; 
  
  if (newStatus === 'تم النشر') {
    if (post.review_status !== 'معتمد' || post.manager_review_status !== 'معتمد') {
      showToast('⚠️ لا يمكن النشر قبل الحصول على موافقة جميع المراجعين واعتماد المدير النهائي.');
      post.actual_publish_status = 'لم يتم'; 
      return;
    }

    let platforms = [];
    if (post.publishing_platform) {
      if (Array.isArray(post.publishing_platform)) platforms = post.publishing_platform;
      else if (typeof post.publishing_platform === 'string') {
        try { platforms = JSON.parse(post.publishing_platform); } catch(e) {}
      }
    }
    
    const hasAllLinks = platforms.length > 0 && platforms.every(platform => 
      post.published_links && 
      post.published_links[platform] && 
      String(post.published_links[platform]).trim() !== '' &&
      validatePlatformLink(platform, post.published_links[platform]).valid
    );

    if (!hasAllLinks) {
      post.actual_publish_status = 'لم يتم'; 
      openLinksModal(post, true);
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!post.publishing_time) {
      post.publishing_time = currentTime;
    } else if (!post.publishing_time.includes(currentTime)) {
      post.publishing_time = `${post.publishing_time} - ${currentTime}`;
    }
    autoSave(post, 'publishing_time');
    autoSave(post, 'actual_publish_status');
  } else {
    autoSave(post, 'actual_publish_status');
  }
};

const addNewRow = async () => {
  if (!newRowDate.value) return;
  addingRow.value = true;
  try {
    const res = await api.post(`/content-plans/${planId}/posts`, { target_date: newRowDate.value, is_urgent: newRowIsUrgent.value });
    const newPost = res.data.data;
    newPost.ad_platform = []; 
    newPost.reviewer_ids = []; 
    posts.value.push(newPost);
    posts.value.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
    showAddRowModal.value = false;
    newRowDate.value = '';
    if (newRowIsUrgent.value) {
      showToast('تمت إضافة المنشور العاجل وإعادة جدولة الفائض تلقائياً للأيام التالية 🚀', 'success');
      await fetchBoardData();
    } else {
      showToast('تمت إضافة المنشور للجدول.');
    }
  } catch (error) {
    showToast('خطأ في إضافة المنشور.');
  } finally {
    addingRow.value = false;
  }
};

onMounted(async () => {
  fetchCurrentUser(); 
  fetchUsers();
  await Promise.allSettled([
    fetchPlanCategories(),
    fetchCurrentPlan(),
    fetchPosts()
  ]);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing: border-box; }
.spreadsheet-page { height: 100vh; display: flex; flex-direction: column; background: #fdfdfd; color: #333; font-family: 'Cairo', sans-serif; }

.page-topline { padding: 15px 20px; background: #fff; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.breadcrumbs { font-size: 11px; color: #888; margin-bottom: 5px; display: flex; gap: 6px; }
.breadcrumbs a { color: #2196f3; text-decoration: none; }
.page-topline h2 { margin: 0; font-size: 20px; color: #222; }
.page-topline p { margin: 2px 0 0; color: #666; font-size: 11px; }

.header-actions { display: flex; align-items: center; gap: 15px; }

/* أزرار مجلدات درايف للعميل */
.drive-folders-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drive-folder-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.drive-folder-btn .drive-icon {
  flex-shrink: 0;
}

.drive-folder-btn .btn-text {
  line-height: 1.2;
}

.drive-folder-btn .external-arrow {
  font-size: 11px;
  font-weight: bold;
  opacity: 0.65;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.drive-folder-btn:hover .external-arrow {
  transform: translate(-1px, -1px);
  opacity: 1;
}

/* زر مجلد رفع المراجعة */
.drive-folder-btn.review-btn {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.drive-folder-btn.review-btn:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #78350f;
  box-shadow: 0 3px 8px rgba(245, 158, 11, 0.18);
  transform: translateY(-1px);
}

/* زر مجلد التسليم النهائي */
.drive-folder-btn.final-btn {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.drive-folder-btn.final-btn:hover {
  background: #d1fae5;
  border-color: #10b981;
  color: #047857;
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.18);
  transform: translateY(-1px);
}

.drive-folder-btn:active {
  transform: translateY(0);
}

.saving-indicator { font-size: 11px; color: #ff9800; display: flex; align-items: center; gap: 5px; font-weight: bold; }
.spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #ff9800; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
.spinner.large { width: 30px; height: 30px; border-width: 3px; border-color: #2196f3; border-top-color: transparent; margin-bottom: 10px; }

.primary-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 15px; border: 0; border-radius: 6px; color: #fff; background: #2196f3; font: inherit; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.primary-btn:hover { background: #1976d2; }
.primary-btn:disabled { background: #9e9e9e; cursor: not-allowed; }
.reject-submit-btn { background: #cc0000; }
.reject-submit-btn:hover { background: #aa0000; }

.spreadsheet-container { 
  flex-grow: 1; 
  overflow: auto; 
  -webkit-overflow-scrolling: touch;
  background: #f8f9fa; 
  padding-bottom: 50px; 
  cursor: grab;
}

.spreadsheet-container:active {
  cursor: grabbing;
}

.spreadsheet-container.dragging {
  cursor: grabbing;
  user-select: none;
}

.spreadsheet-container.dragging table {
  pointer-events: none; /* يمنع تحديد النص أو الضغط بالخطأ أثناء السحب */
}

/* تحسين شكل شريط التمرير (Scrollbar) للماوس */
.spreadsheet-container::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}

.spreadsheet-container::-webkit-scrollbar-track {
  background: #e9ecef;
  border-radius: 6px;
  margin: 0 10px;
}

.spreadsheet-container::-webkit-scrollbar-thumb {
  background: #adb5bd;
  border-radius: 6px;
  border: 3px solid #e9ecef;
}

.spreadsheet-container::-webkit-scrollbar-thumb:hover {
  background: #6c757d;
}
.spreadsheet-table { border-collapse: collapse; min-width: max-content; background: #fff; }
.spreadsheet-table thead { position: sticky; top: 0; z-index: 20; }
.spreadsheet-table thead th { position: sticky; top: inherit; z-index: 20; box-shadow: inset 0 1px 0 #dcdcdc, inset 0 -1px 0 #dcdcdc; }

.extracted-links {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: #fdfdfd;
  border-top: 1px dashed #e0e0e0;
  flex-wrap: wrap;
  justify-content: flex-start;
}
.extracted-link-btn {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 10px;
  font-family: inherit;
  color: #333;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 3px 8px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.extracted-link-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #000;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* تحديد أقصى عرض لأعمدة الاختيار المتعدد حتى يلتف النص ولا يكبر الجدول */
.spreadsheet-table td:has(.custom-multiselect) {
  max-width: 180px;
}

th, td { border: 1px solid #dcdcdc; padding: 0; text-align: center; vertical-align: middle; }
th { color: #000; font-weight: 700; font-size: 12px; padding: 6px 10px; white-space: nowrap; }

.group-header { font-size: 13px; font-weight: 800; padding: 8px !important; }
.admin-group, .admin-th { background: #e0e0e0; }
.red-group, .red-th { background: #f4cccc; color: #000; }
.dark-red-group, .dark-red-th { background: #cc0000; color: #fff; }
.blue-group, .blue-th { background: #4a86e8; color: #fff; }
.light-blue-group, .light-blue-th { background: #9fc5e8; color: #000; }
.pink-group, .pink-th { background: #ff00ff; color: #fff; }

.sub-th { font-size: 10px; font-weight: 600; }

td { height: 35px; position: relative; min-width: 100px; }
.readonly-cell { background: #f1f3f4; padding: 0 10px; white-space: nowrap; text-align: center; vertical-align: middle; }
.readonly-cell strong { font-size: 11px; display: block; }
.readonly-cell small { font-size: 10px; color: #555; display: block; }

.review-cell { text-align: center; vertical-align: middle; background: #f9f9f9; padding: 5px !important; }
.review-actions { display: flex; gap: 4px; }
.review-actions button { border: none; padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; color: #fff; transition: 0.2s; }
.approve-btn { background: #388e3c; } .approve-btn:hover:not(:disabled) { background: #2e7d32; }
.reject-btn { background: #d32f2f; } .reject-btn:hover:not(:disabled) { background: #c62828; }
.review-actions button:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(100%); }
.badge { font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 4px; }
.badge.approved { background: #e8f5e9; color: #2e7d32; }
.badge.pending { background: #fff3e0; color: #e65100; }
.approval-time {
  font-size: 9px;
  color: #757575;
  margin-top: 3px;
  display: block;
  text-align: center;
}
.badge.started {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #0d47a1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 0;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #90caf9;
  font-size: 10px;
  font-weight: bold;
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.5);
}
.start-execution-btn {
  background: linear-gradient(135deg, #43a047, #2e7d32);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 0;
}
.start-execution-btn:hover {
  background: linear-gradient(135deg, #4caf50, #388e3c);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.start-execution-btn:active {
  transform: translateY(0);
}
.history-btn { background: #f1f3f4; border: 1px solid #ccc; font-size: 9px; padding: 3px 6px; border-radius: 4px; cursor: pointer; color: #555; transition: 0.2s; }
.history-btn:hover { background: #e0e0e0; }

input:disabled, select:disabled, textarea:disabled {
  background-color: #f1f3f4 !important;
  color: #757575 !important;
  cursor: not-allowed;
  opacity: 0.8;
  border: 1px dashed #cfd8dc !important; /* لتمييزها بصرياً أنها مقفلة */
}

.delivery-cell {
  display: flex !important;
  flex-direction: column;
  gap: 6px;
  padding: 8px !important;
  min-width: 180px;
  height: 100%;
}
.delivery-cell textarea {
  width: 100%;
  resize: vertical;
  min-height: 40px;
  font-size: 11px;
}
.delivery-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.submit-delivery-btn {
  background: #388e3c;
  font-size: 10px;
  padding: 4px 10px;
  width: 100%;
  justify-content: center;
}
.submit-delivery-btn:hover {
  background: #2e7d32;
}
.delivered-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  background: #e8f5e9;
  border: 1px dashed #a5d6a7;
  border-radius: 4px;
  padding: 4px;
}
.delivery-time {
  font-size: 10px;
  color: #2e7d32;
  font-weight: bold;
}
.update-time-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 9px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}
.update-time-btn:hover {
  color: #115293;
}

/* تنسيقات التحقق الصارم لخلية التسليم والـ Tooltip */
.delivery-cell.cell-invalid {
  background-color: #fef2f2 !important;
  border: 1.5px solid #ef4444 !important;
  box-shadow: inset 0 0 6px rgba(239, 68, 68, 0.15) !important;
  transition: all 0.2s ease;
  position: relative;
}

.delivery-cell.cell-invalid textarea,
.delivery-cell textarea.input-invalid {
  border: 1.5px solid #ef4444 !important;
  background-color: #fff5f5 !important;
  border-radius: 4px;
}

.disabled-delivery-btn,
.disabled-delivery-btn:disabled,
button:disabled.submit-delivery-btn,
button:disabled.reject-submit-btn,
button:disabled.update-time-btn {
  opacity: 0.45 !important;
  cursor: not-allowed !important;
  filter: grayscale(0.6) !important;
}

/* تنسيقات حقل التسليم داخل المودال */
.modal-delivery-edit {
  width: 100%;
}

.modal-delivery-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  background: #1e293b;
  color: #fff;
  border: 1.5px solid #334155;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
}

.modal-delivery-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.modal-delivery-input.border-red-500 {
  border-color: #ef4444 !important;
  background-color: rgba(239, 68, 68, 0.08) !important;
}

.modal-delivery-input.border-red-500:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}

.modal-error-msg {
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  margin: 6px 0 0 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

input, select, textarea { width: 100%; height: 100%; min-height: 33px; border: none; outline: none; background: transparent; padding: 4px 6px; font-family: inherit; font-size: 11px; color: #222; text-align: center; resize: none; transition: 0.15s; }
textarea { padding-top: 8px; }

/* تحسين تجربة المستخدم لحقول الأرقام في الجدول لتشبه الإكسيل */
.spreadsheet-table input[type="number"]::-webkit-outer-spin-button,
.spreadsheet-table input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.spreadsheet-table input[type="number"] {
  -moz-appearance: textfield;
}

/* تحسين تجربة المستخدم للـ Textarea في الجدول */
.spreadsheet-table textarea {
  resize: vertical;
  min-height: 50px;
}

textarea::-webkit-scrollbar {
  width: 6px;
}
textarea::-webkit-scrollbar-track {
  background: transparent; 
}
textarea::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
textarea::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
input:focus, select:focus, textarea:focus { box-shadow: inset 0 0 0 2px #2196f3; background: #fff; z-index: 10; position: relative; }

.multi-select { height: auto; min-height: 35px; }
.multi-select option { padding: 4px; }
.text-red { color: #cc0000 !important; font-weight: bold; }
.text-green { color: #388e3c !important; font-weight: bold; }
.muted { color: #888; }

.modal-overlay { position: fixed;   background: rgba(0,0,0,0.5); display: grid; place-items: center;     inset: 0 !important; z-index: 9999 !important; }
.modal-content { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.modal-content h3 { margin: 0 0 10px; font-size: 18px; color: #222; }
.modal-content p { font-size: 12px; color: #666; margin-bottom: 20px; }
.form-group label { display: block; font-size: 11px; font-weight: 600; margin-bottom: 5px; color: #444; }
.form-group input[type="date"] { border: 1px solid #ccc; border-radius: 6px; text-align: right; }
.form-group textarea { border: 1px solid #ccc; border-radius: 6px; text-align: right; padding: 10px; font-size: 12px; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.secondary-btn { padding: 8px 15px; border: 1px solid #ccc; border-radius: 6px; background: transparent; color: #555; cursor: pointer; font-size: 12px; font-weight: bold; }

.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { background: #fdf2f2; border-right: 3px solid #d32f2f; padding: 10px; border-radius: 4px; }
.history-meta { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 5px; }
.history-meta strong { color: #d32f2f; }
.history-reason { margin: 0; font-size: 12px; color: #333; line-height: 1.5; }

.reset-btn {
  background: transparent;
  border: 1px solid #90caf9;
  color: #1976d2;
  font-size: 9px;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 4px;
  display: inline-block;
}
.reset-btn:hover {
  background: #e3f2fd;
}
.mt-1 {
  margin-top: 4px;
}

.toast-message { position: fixed; bottom: 20px; left: 20px; background: #323232; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast-enter-active, .toast-leave-active { transition: 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
@keyframes spin { to { transform: rotate(360deg); } }

/* أزرار وتصميم الواتساب */
.wa-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.wa-btn.primary {
  background: #25D366;
  color: white;
  box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);
}
.wa-btn.primary:hover {
  background: #1ebc59;
  transform: translateY(-2px);
}
.wa-btn.secondary {
  background: #f0f2f5;
  color: #333;
  border: 1px solid #ddd;
}
.wa-btn.secondary:hover {
  background: #e4e6e9;
}
.published-links-preview { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: center; }
.platform-link { font-size: 11px; padding: 4px 8px; background: #e3f2fd; color: #1565c0; border-radius: 4px; text-decoration: none; font-weight: bold; }
.platform-link:hover { background: #bbdefb; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 14px; }

/* ألوان قائمة الهدف (Objective) */
.objective-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.obj-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  background-color: #f0f0f0; 
  color: #333;
}

.obj-tag.obj-awareness { background-color: #d9ead3; color: #274e13; }
.obj-tag.obj-educational { background-color: #116f44; color: #ffffff; }
.obj-tag.obj-engagement { background-color: #fce5cd; color: #783f04; }
.obj-tag.obj-storytelling { background-color: #783f04; color: #ffffff; }
.obj-tag.obj-conversion { background-color: #f8cccc; color: #cc0000; }
.obj-tag.obj-social-proof { background-color: #e4d7f5; color: #4a235a; }

.objective-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 140px;
}
.delete-btn {
  color: #ff6b8b;
  transition: all 0.2s ease;
}
.delete-btn:hover {
  color: #ff335f;
  background: rgba(255, 51, 95, 0.1);
  transform: scale(1.05);
}
.delete-btn svg {
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.lock-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
}
.clickable-lock {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.clickable-lock:hover {
  transform: scale(1.2) rotate(-10deg);
  opacity: 1;
}

.lock-indicator {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  z-index: 5;
  cursor: help;
  opacity: 0.8;
  pointer-events: auto;
}
input:disabled, select:disabled, textarea:disabled, .custom-multiselect.disabled {
  cursor: not-allowed !important;
  opacity: 0.75;
}

/* ---------------------------------------------------
   SLA Smart Colors (تأثيرات التأخير الذكية)
--------------------------------------------------- */
.dl-completed-text { color: #20b2aa !important; }
.dl-safe-text { color: #25d366 !important; }
.dl-warning-text { color: #ffc107 !important; }
.dl-danger-text { color: #fd7e14 !important; }
.dl-urgent-text { color: #ff4757 !important; }
.dl-late-text { color: #ff0000 !important; }
.dl-critical-text { color: #cc0000 !important; font-weight: bold; animation: pulse-text 2s infinite; }

.dl-completed-bg { background: #20b2aa !important; }
.dl-safe-bg { background: #25d366 !important; }
.dl-warning-bg { background: #ffc107 !important; }
.dl-danger-bg { background: #fd7e14 !important; }
.dl-urgent-bg { background: #ff4757 !important; }
.dl-late-bg { background: #ff0000 !important; }
.dl-critical-bg { background: #cc0000 !important; }

.dl-completed-border { border-right: 3px solid #20b2aa !important; }
.dl-safe-border { border-right: 3px solid #25d366 !important; }
.dl-warning-border { border-right: 3px solid #ffc107 !important; }
.dl-danger-border { border-right: 3px solid #fd7e14 !important; }
.dl-urgent-border { border-right: 3px solid #ff4757 !important; }
.dl-late-border { border-right: 3px solid #ff0000 !important; }
.dl-critical-border { border-right: 3px solid #cc0000 !important; }

.sla-indicator { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.sla-progress-bg { height: 3px; background: rgba(0, 0, 0, 0.1); border-radius: 2px; overflow: hidden; width: 80%; margin-top: 2px; }
.sla-progress-fill { height: 100%; transition: width 0.3s ease; }
.sla-msg { font-size: 9px; font-weight: bold; display: block; }
@keyframes pulse-text { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* Premium Report Modal Styles */
.premium-overlay {
  background: rgba(10, 12, 20, 0.85);
  backdrop-filter: blur(10px);
  z-index: 9999 !important;
}

.premium-report-modal {
  width: 900px !important;
  max-width: 95vw;
  max-height: 90vh;
  background: linear-gradient(145deg, #181d33 0%, #111526 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.premium-header {
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-subtitle {
  margin: 0;
  font-size: 14px;
  color: #9ba3c4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.premium-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.badge-success { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

.premium-close-btn {
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ba3c4;
  cursor: pointer;
  transition: all 0.2s;
}
.premium-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.premium-body {
  padding: 24px 32px;
  flex: 1;
  overflow-y: auto;
}

.premium-body::-webkit-scrollbar {
  width: 6px;
}
.premium-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.report-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
}

.premium-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 24px;
}

.card-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #7de8dc !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-list li {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
}

.info-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* يسمح للنص الطويل بالالتفاف */
}

.info-label {
  font-size: 12px;
  color: #aab5da;
}

.info-value {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
  word-break: break-word;
  overflow-wrap: break-word;
}

.text-red { color: #f87171 !important; }
.text-blue { color: #60a5fa !important; }

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 10px;
}

.tags-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.premium-tag {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.tag-type { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
.tag-objective { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }

.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.text-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-label {
  font-size: 13px;
  font-weight: 600;
  color: #aab5da;
}

.block-content {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  max-height: 280px;
  overflow-y: auto;
}

.block-content::-webkit-scrollbar {
  width: 5px;
}
.block-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.caption-box {
  border-right: 3px solid #60a5fa;
  font-style: italic;
}

.hashtags-box {
  color: #38bdf8;
  font-weight: 500;
}

.text-block-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.links-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-label {
  font-size: 13px;
  color: #aab5da;
  margin-bottom: 12px;
  display: block;
}

.premium-links-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.premium-btn-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.ref-link { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
.ref-link:hover { background: rgba(59, 130, 246, 0.2); transform: translateY(-2px); }

.del-link { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
.del-link:hover { background: rgba(16, 185, 129, 0.2); transform: translateY(-2px); }

.live-link { background: rgba(236, 72, 153, 0.1); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.2); }
.live-link:hover { background: rgba(236, 72, 153, 0.2); transform: translateY(-2px); }

.no-data {
  font-size: 13px;
  color: #555;
  font-style: italic;
  padding: 8px;
}

@media (max-width: 900px) {
  .report-grid { grid-template-columns: 1fr; }
  .text-block-grid { grid-template-columns: 1fr; }
}

.urgent-row {
  background-color: rgba(239, 68, 68, 0.04) !important;
}
.urgent-row td {
  border-top: 1px solid rgba(239, 68, 68, 0.4) !important;
  border-bottom: 1px solid rgba(239, 68, 68, 0.4) !important;
  animation: row-cell-glow 2s infinite ease-in-out;
}
.urgent-row td:first-child {
  border-right: 2px solid rgba(239, 68, 68, 0.8) !important;
}
.urgent-row td:last-child {
  border-left: 2px solid rgba(239, 68, 68, 0.8) !important;
}
@keyframes row-cell-glow {
  0% { border-color: rgba(239, 68, 68, 0.3) !important; box-shadow: inset 0 0 5px rgba(239, 68, 68, 0.1); }
  50% { border-color: rgba(239, 68, 68, 0.8) !important; box-shadow: inset 0 0 15px rgba(239, 68, 68, 0.3); }
  100% { border-color: rgba(239, 68, 68, 0.3) !important; box-shadow: inset 0 0 5px rgba(239, 68, 68, 0.1); }
}
.urgent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(239, 68, 68, 0.15);
  color: #ff8b9f;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  margin-top: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: pulse-urgent 2s infinite;
  white-space: nowrap;
}
.displaced-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(147, 51, 234, 0.15);
  color: #c084fc;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-top: 6px;
  border: 1px solid rgba(168, 85, 247, 0.35);
  white-space: nowrap;
}
.displaced-dot {
  font-size: 11px;
}
@keyframes pulse-urgent {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

/* تنبيه المنشورات العاجلة في الشريط العلوي */
.urgent-top-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
  border: 1.5px solid #ef4444;
  border-radius: 30px;
  padding: 6px 16px;
  box-shadow: 0 3px 12px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.08);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: banner-pulse 3s infinite ease-in-out;
}

.urgent-top-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.25);
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

.urgent-banner-icon {
  position: relative;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beacon-pulse {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.4);
  animation: beacon-wave 2s infinite;
  z-index: 0;
}

@keyframes beacon-wave {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.7); opacity: 0; }
}

@keyframes banner-pulse {
  0% { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 3px 12px rgba(239, 68, 68, 0.12); }
  50% { border-color: rgba(220, 38, 38, 1); box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25); }
  100% { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 3px 12px rgba(239, 68, 68, 0.12); }
}

.urgent-banner-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #991b1b;
  font-weight: 600;
}

.urgent-banner-badge {
  background: #dc2626;
  color: #fff;
  padding: 1px 9px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

.urgent-banner-label strong {
  color: #b91c1c;
  font-weight: 700;
}

.urgent-jump-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
}

.urgent-jump-btn:hover {
  background: #b91c1c;
  transform: scale(1.04);
}

.urgent-jump-btn .jump-arrow {
  font-size: 11px;
  animation: bounce-down 1.5s infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(2px); }
}

/* تأثير التمييز عند الانتقال إلى المنشور العاجل */
.urgent-highlight-pulse td {
  background-color: rgba(254, 202, 202, 0.6) !important;
  transition: background-color 0.4s ease;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.6) inset !important;
}

@media (max-width: 900px) {
  .page-topline {
    flex-wrap: wrap;
    gap: 12px;
  }
  .urgent-top-banner {
    order: 3;
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .page-topline {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 14px;
  }
  .header-actions {
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }
  .drive-folders-group {
    width: 100%;
    order: 1;
    display: flex;
    gap: 6px;
  }
  .drive-folder-btn {
    flex: 1;
    justify-content: center;
    padding: 6px 8px;
    font-size: 11px;
  }
  .primary-btn {
    flex: 1;
    justify-content: center;
  }
  .urgent-banner-text {
    font-size: 11px;
  }
}



/* واجهة منع الوصول للموظفين قبل الاعتماد الداخلي */
.access-denied-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  padding: 40px 20px;
}

.access-denied-card {
  max-width: 480px;
  width: 100%;
  text-align: center;
  background: rgba(14, 21, 56, 0.85);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 35px 25px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.lock-icon-badge {
  font-size: 36px;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 18px rgba(239, 68, 68, 0.25);
}

.access-denied-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0;
}

.denied-text {
  font-size: 13.5px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

.denied-actions {
  margin-top: 10px;
}

.return-plans-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 9px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.return-plans-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.5);
}



/* صندوق تاريخ النشر المخطط التفاعلي للمدير والأكونت مانجر */
.target-date-td {
  vertical-align: middle;
}

.target-date-interactive-box {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: rgba(59, 130, 246, 0.08);
  border: 1px dashed rgba(59, 130, 246, 0.4);
  transition: all 0.2s ease;
  margin: 3px 0;
  user-select: none;
}

.target-date-interactive-box:hover {
  background: rgba(59, 130, 246, 0.16);
  border-color: #3b82f6;
  border-style: solid;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.25);
}

.target-day-name {
  font-size: 11.5px;
  color: #1e293b;
  display: block;
}

.target-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 2px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.target-date-badge small {
  font-size: 10.5px;
  font-weight: 700;
  color: #2563eb;
}

.cal-mini-icon {
  font-size: 10px;
}

.target-date-native-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 5;
  margin: 0;
  padding: 0;
  border: none;
}

.target-date-static-box {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2px 0;
}

.target-date-static-box strong {
  font-size: 11px;
  display: block;
}

.target-date-static-box small {
  font-size: 10px;
  color: #555;
  display: block;
}

.plan-delivered-lock-tag {
  font-size: 9px;
  font-weight: 800;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 3px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.modal-target-date-picker {
  background: #ffffff;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  font-family: inherit;
  color: #1e293b;
  cursor: pointer;
}

.row-num-with-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 2px 0;
}

.row-num-with-action .row-index {
  font-size: 13px;
  font-weight: 800;
  color: #6366f1;
  line-height: 1.1;
}

.row-num-with-action .row-view-btn {
  font-size: 14px;
  padding: 1px 3px;
  line-height: 1;
  border-radius: 4px;
  transition: transform 0.2s ease, background 0.2s ease;
  cursor: pointer;
}

.row-num-with-action .row-view-btn:hover {
  transform: scale(1.25);
  background: rgba(99, 102, 241, 0.15);
}

.row-num-with-action .urgent-dot {
  font-size: 10px;
  line-height: 1;
}

.urgent-active-glow {
  background: rgba(239, 68, 68, 0.25) !important;
  border-radius: 4px;
  animation: pulse-urgent 1.5s infinite;
}
@keyframes pulse-urgent {
  0% { transform: scale(1); }
  50% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

.displaced-deadline-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 5px;
  padding: 4px 6px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px dashed rgba(59, 130, 246, 0.45);
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  text-align: right;
  line-height: 1.3;
}

.restore-deadline-mini-btn {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #60a5fa;
  cursor: pointer;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.2;
  transition: all 0.2s ease;
}

.restore-deadline-mini-btn:hover {
  background: rgba(59, 130, 246, 0.35);
  color: #fff;
  transform: scale(1.1);
}

.displaced-deadline-tag .original-deadline-hint {
  font-size: 10px;
  font-weight: normal;
  color: #8fa0d4;
  margin-top: 2px;
}

.sub-th.light-blue-th {
  min-width: 330px !important;
}

.delivery-cell {
  min-width: 330px;
  max-width: 390px;
  vertical-align: top;
  padding: 5px 6px !important;
}

.delivery-split-grid {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.delivery-split-col {
  flex: 1;
  min-width: 155px;
  display: flex;
  flex-direction: column;
}

.delivery-split-divider {
  width: 1px;
  background: rgba(203, 213, 225, 0.7);
  align-self: stretch;
  margin: 0 1px;
  flex-shrink: 0;
}

.delivery-sub-label {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.final-delivery-locked {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 5px 6px;
  font-size: 10px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
}

.final-del-wrapper textarea {
  border-color: #8b5cf6 !important;
  background: #faf5ff !important;
}

.final-del-wrapper textarea:focus {
  border-color: #7c3aed !important;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
}

.final-delivery-confirmed {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.final-delivery-view-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.final-folder-link {
  background: #ede9fe !important;
  color: #6d28d9 !important;
  border: 1px solid #c4b5fd !important;
  font-weight: 700 !important;
  font-size: 10.5px !important;
  flex: 1;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.final-folder-link:hover {
  background: #ddd6fe !important;
  color: #5b21b6 !important;
}

.final-edit-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  flex-shrink: 0;
}

.final-edit-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
  transform: scale(1.08);
}

.final-actions-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.add-archive-btn {
  background: #f5f3ff !important;
  color: #7c3aed !important;
  border: 1px dashed #c4b5fd !important;
  border-radius: 6px !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  padding: 5px 8px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  width: 100% !important;
  transition: all 0.2s ease !important;
  text-align: center !important;
  line-height: 1.2 !important;
}

.add-archive-btn:hover {
  background: #ede9fe !important;
  border-color: #8b5cf6 !important;
  color: #6d28d9 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 5px rgba(124, 58, 237, 0.15) !important;
}

.archive-modal-card {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25) !important;
  border: 1px solid #e2e8f0;
}

.final-delivered-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 9.5px;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 4px;
  padding: 2px 5px;
  margin-top: 2px;
}

.badge-lock-text {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.modal-badge-locked {
  font-size: 10px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}

.modal-edit-final-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 6px;
}

.modal-edit-final-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
}

.muted-notice {
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
  padding: 4px;
  background: #f8fafc;
  border-radius: 4px;
}

.modal-locked-notice {
  font-size: 11px;
  color: #94a3b8;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  text-align: center;
}

</style>