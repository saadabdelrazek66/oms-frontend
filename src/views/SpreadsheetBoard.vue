<template>
  <section class="spreadsheet-page" dir="rtl">
    <div class="page-topline">
      <div>
        <div class="breadcrumbs">
          <router-link to="/plan-contents">محتويات الخطط</router-link>
          <span>/</span>
          <span>لوحة المحتوى التفصيلية</span>
        </div>
        <h2>مصنع المحتوى (Spreadsheet)</h2>
        <p>تعديل فوري، تعبئة سريعة، وحفظ تلقائي لجميع خلايا الخطة.</p>
      </div>
      <div class="header-actions">
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
            <th colspan="5" class="group-header red-group">حالة المنشور</th>
            <th colspan="6" class="group-header admin-group">الإدارة والتكليف والمراجعة</th>
            <th colspan="2" class="group-header dark-red-group">موقف التمويل</th>
            <th colspan="8" class="group-header blue-group">محتوى المنشور</th>
            <th colspan="1" class="group-header light-blue-group">التسليم</th>
            <th colspan="1" class="group-header pink-group">ملاحظات</th>
            <th v-if="isManager" colspan="1" class="group-header admin-group">إجراءات</th>
          </tr>
          <tr>
            <th class="sub-th red-th">تاريخ النشر المخطط</th>
            <th class="sub-th red-th">النشر الفعلي</th>
            <th class="sub-th red-th">توقيت النشر</th>
            <th class="sub-th red-th">منصة النشر</th>
            <th class="sub-th red-th">روابط النشر</th>

            <th class="sub-th admin-th">المنفذ</th>
            <th class="sub-th admin-th">بدء التنفيذ</th>
            <th class="sub-th admin-th">الديدلاين</th>
            <th class="sub-th admin-th">المراجعين (متعدد)</th>
            <th class="sub-th admin-th">مراجعة القسم</th>
            <th class="sub-th admin-th" style="background: #cfd8dc;">اعتماد المدير</th>

            <th class="sub-th dark-red-th">منصة الإعلان</th>
            <th class="sub-th dark-red-th">حالة التمويل</th>

            <th class="sub-th blue-th">نوع المنشور</th>
            <th class="sub-th blue-th">الهدف</th>
            <th class="sub-th blue-th">شرح الفكرة تفصيلياً</th>
            <th class="sub-th blue-th">Caption</th>
            <th class="sub-th blue-th">TOV</th>
            <th class="sub-th blue-th">Call to Action</th>
            <th class="sub-th blue-th">Hashtag</th>
            <th class="sub-th blue-th">Reference Link</th>

            <th class="sub-th light-blue-th">روابط ووقت التسليم</th>
            <th class="sub-th pink-th">Note</th>
            <th v-if="isManager" class="sub-th admin-th">حذف</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="posts.length === 0">
            <td colspan="21" class="text-center py-4 muted">لا توجد منشورات. قم بإضافة منشور جديد.</td>
          </tr>
          <tr v-for="(post, index) in posts" :key="post.id" class="post-row">
            
            <!-- 2. حالة المنشور -->
            <td class="readonly-cell position-relative">
              <button class="icon-btn view-btn" @click="openViewModal(post)" title="عرض التفاصيل">👁️</button>
              <strong>{{ getDayName(post.target_date) }}</strong>
              <small>{{ formatDate(post.target_date) }}</small>
            </td>
            <td>
              <div class="lock-wrapper">
                <select v-model="post.actual_publish_status" @change="handlePublishStatusChange(post, $event)" :class="post.actual_publish_status === 'لم يتم' ? 'text-red' : 'text-green'" :disabled="!canEditPublishAndNotes(post) || isFieldDisabled(post, 'actual_publish_status')">
                  <option value="لم يتم">لم يتم</option>
                  <option value="تم النشر">تم النشر</option>
                </select>
                <span v-if="hasLockIcon(post, 'actual_publish_status')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'actual_publish_status')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <input type="text" v-model="post.publishing_time" @blur="autoSave(post, 'publishing_time')" placeholder="--:--" dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'publishing_time')" />
                <span v-if="hasLockIcon(post, 'publishing_time')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'publishing_time')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
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
            <td class="text-center">
              <div v-if="post.published_links && Object.keys(post.published_links).length > 0" class="published-links-preview">
                <a v-for="(link, platform) in post.published_links" :key="platform" 
                   v-show="link" :href="link" target="_blank" class="platform-link" :title="platform">
                   🔗 {{ platform }}
                </a>
                <button v-if="canEditLinks(post)" class="icon-btn edit-links" @click="openLinksModal(post, false)" title="تعديل الروابط">✏️</button>
              </div>
              <button v-else class="secondary-btn small-btn" @click="openLinksModal(post, false)">
                + إضافة روابط
              </button>
            </td>

            <!-- 1. الإدارة والتكليف -->
            <td>
              <div class="lock-wrapper">
                <select v-model="post.designer_id" @change="autoSave(post, 'designer_id')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'designer_id')">
                  <option :value="null">لم يحدد</option>
                  <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
                </select>
                <span v-if="hasLockIcon(post, 'designer_id')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'designer_id')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td style="min-width: 130px; padding: 4px;">
              <div class="execution-trigger" v-if="post.designer_id">
                <span v-if="post.execution_started_at" class="badge started">
                  🚀 بدأ: {{ new Date(post.execution_started_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
                <button v-else-if="canEditFields(post)" class="start-execution-btn" @click="startExecution(post)" title="اضغط لبدء احتساب وقت التنفيذ">
                  <span class="icon">▶️</span> تكليف وبدء العمل
                </button>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <VueDatePicker 
                  v-model="post.deadline" 
                  :disabled="!canEditFields(post) || isFieldDisabled(post, 'deadline')"
                  auto-apply
                  @closed="autoSave(post, 'deadline')"
                  time-picker-inline
                  position="left"
                  placeholder="تاريخ ووقت"
                ></VueDatePicker>
                <span v-if="hasLockIcon(post, 'deadline')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'deadline')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            
            <td>
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

            <td class="review-cell">
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
                  <button class="approve-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="approvePost(post, 'reviewer')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن المراجعة بدون روابط التسليم' : 'موافقة'">✅ موافقة</button>
                  <button class="reject-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="openRejectModal(post, 'reviewer')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن المراجعة بدون روابط التسليم' : 'رفض'">❌ رفض</button>
                </div>
                
                <span v-else class="badge pending">⏳ قيد الانتظار</span>
              </template>

              <button v-if="post.rejection_history && post.rejection_history.length > 0" 
                      class="history-btn mt-1" @click="openHistoryModal(post.rejection_history, 'القسم')">
                📜 سجل الرفض
              </button>
            </td>

            <td class="review-cell" style="background: #eceff1;">
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
                  <button class="approve-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="approvePost(post, 'manager')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن الاعتماد بدون روابط التسليم' : 'اعتماد نهائي'">✅ اعتماد</button>
                  <button class="reject-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="openRejectModal(post, 'manager')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن الاعتماد بدون روابط التسليم' : 'رفض'">❌ رفض</button>
                </div>
                
                <span v-else class="badge pending">⏳ قيد الانتظار</span>
              </template>

              <button v-if="post.manager_rejection_history && post.manager_rejection_history.length > 0" 
                      class="history-btn mt-1" @click="openHistoryModal(post.manager_rejection_history, 'المدير')">
                📜 سجل الرفض
              </button>
            </td>

            <td>
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
            <td>
              <div class="lock-wrapper">
                <select v-model="post.finance_status" @change="autoSave(post, 'finance_status')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'finance_status')">
                  <option value="غير ممول">غير ممول</option>
                  <option value="ممول">ممول</option>
                </select>
                <span v-if="hasLockIcon(post, 'finance_status')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'finance_status')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>

            <td>
              <div class="lock-wrapper">
                <select v-model="post.post_type" @change="autoSave(post, 'post_type')" :disabled="!canEditFields(post) || isFieldDisabled(post, 'post_type')">
                  <option value="">اختيار...</option>
                  <option value="Infograph">Infograph</option>
                  <option value="Video">Video</option>
                  <option value="Reel/Shorts">Reel / Shorts</option>
                  <option value="Text Only">Text Only</option>
                  <option value="Carousel">Carousel</option>
                </select>
                <span v-if="hasLockIcon(post, 'post_type')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'post_type')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
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
            <td>
              <div class="lock-wrapper">
                <textarea v-model="post.detailed_idea" @blur="autoSave(post, 'detailed_idea')" rows="2" :disabled="!canEditFields(post) || isFieldDisabled(post, 'detailed_idea')"></textarea>
                <span v-if="hasLockIcon(post, 'detailed_idea')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'detailed_idea')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <textarea v-model="post.caption" @blur="autoSave(post, 'caption')" rows="2" :disabled="!canEditFields(post) || isFieldDisabled(post, 'caption')"></textarea>
                <span v-if="hasLockIcon(post, 'caption')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'caption')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <textarea v-model="post.tov" @blur="autoSave(post, 'tov')" rows="2" placeholder="..." :disabled="!canEditFields(post) || isFieldDisabled(post, 'tov')"></textarea>
                <span v-if="hasLockIcon(post, 'tov')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'tov')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <textarea v-model="post.call_to_action" @blur="autoSave(post, 'call_to_action')" rows="2" placeholder="..." :disabled="!canEditFields(post) || isFieldDisabled(post, 'call_to_action')"></textarea>
                <span v-if="hasLockIcon(post, 'call_to_action')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'call_to_action')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="lock-wrapper">
                <textarea v-model="post.hashtags" @blur="autoSave(post, 'hashtags')" rows="2" placeholder="#..." dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'hashtags')"></textarea>
                <span v-if="hasLockIcon(post, 'hashtags')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'hashtags')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
              </div>
            </td>
            <td>
              <div class="textarea-link-wrapper lock-wrapper">
                <textarea v-model="post.reference_link" @blur="autoSave(post, 'reference_link')" rows="2" placeholder="Link..." dir="ltr" :disabled="!canEditFields(post) || isFieldDisabled(post, 'reference_link')"></textarea>
                <span v-if="hasLockIcon(post, 'reference_link')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'reference_link')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
                <div class="extracted-links" v-if="extractUrls(post.reference_link).length">
                  <a v-for="(url, i) in extractUrls(post.reference_link)" :key="i" :href="url" target="_blank" class="extracted-link-btn" :title="url">
                    {{ getUrlLabel(url, i) }}
                  </a>
                </div>
              </div>
            </td>

            <td class="delivery-cell">
              <div class="textarea-link-wrapper lock-wrapper">
                <textarea 
                  v-model="post.delivery_links" 
                  @blur="autoSave(post, 'delivery_links')" 
                  placeholder="روابط التسليم (Drive/Notion)..." 
                  dir="ltr" 
                  rows="2"
                  :disabled="!canEditDelivery(post) || isFieldDisabled(post, 'delivery_links')"
                ></textarea>
                <span v-if="hasLockIcon(post, 'delivery_links')" class="lock-indicator" :class="{ 'clickable-lock': isManager }" @click="unlockField(post, 'delivery_links')" :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'">🔒</span>
                <div class="extracted-links" v-if="extractUrls(post.delivery_links).length">
                  <a v-for="(url, i) in extractUrls(post.delivery_links)" :key="i" :href="url" target="_blank" class="extracted-link-btn" :title="url">
                    {{ getUrlLabel(url, i) }}
                  </a>
                </div>
              </div>
              <div class="delivery-status">
                <button 
                  v-if="(post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض') && canEditDelivery(post)"
                  @click="resubmitPost(post)"
                  class="primary-btn reject-submit-btn w-100 mt-1"
                >إعادة إرسال للمراجعة 🔄</button>
                <div v-else-if="post.delivered_at" class="delivered-info">
                  <span class="delivery-time">✅ تم التسليم: {{ formatDeliveryDate(post.delivered_at) }}</span>
                  <button 
                    v-if="canEditDelivery(post)" 
                    @click="markAsDelivered(post)" 
                    class="update-time-btn"
                    title="تحديث وقت التسليم"
                  >تحديث الوقت</button>
                </div>
                <button 
                  v-else-if="canEditDelivery(post)" 
                  @click="markAsDelivered(post)" 
                  class="primary-btn submit-delivery-btn"
                >تسجيل التسليم</button>
              </div>
            </td>
            <td><textarea v-model="post.notes" @blur="autoSave(post, 'notes')" rows="2" placeholder="..." :disabled="!canEditPublishAndNotes(post)"></textarea></td>
            <td v-if="isManager" class="text-center">
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
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="showAddRowModal = false">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="addingRow || !newRowDate">إضافة الصف</button>
          </div>
        </form>
      </div>
    </div>

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
    
    <div v-if="showLinksModal" class="modal-overlay" @click.self="showLinksModal = false">
      <div class="modal-content">
        <h3>🔗 روابط النشر الفعلية</h3>
        <p v-if="pendingPublishStatus" style="color: #ef6c00; font-weight: bold; font-size: 13px;">
          ⚠️ لا يمكن إتمام عملية النشر قبل إرفاق الروابط الفعلية للمنصات المطلوبة!
        </p>
        <p v-else>أدخل روابط المنشور بعد نشره على المنصات المحددة.</p>

        <div class="form-group mt-3" v-for="(link, platform) in tempLinks" :key="platform">
          <label>رابط منصة: <strong>{{ platform }}</strong> <span class="required" style="color: #d32f2f;">*</span></label>
          <input type="url" v-model="tempLinks[platform]" placeholder="https://..." dir="ltr" required />
        </div>

        <div class="modal-actions mt-4">
          <button type="button" class="secondary-btn" @click="showLinksModal = false">إلغاء</button>
          <button type="button" class="primary-btn" @click="savePublishedLinks">حفظ الروابط</button>
        </div>
      </div>
    </div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>

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
            <p class="report-subtitle">
              حالة النشر: 
              <span :class="['premium-badge', selectedPostForView.actual_publish_status === 'تم النشر' ? 'badge-success' : 'badge-warning']">
                {{ selectedPostForView.actual_publish_status || 'لم يتم' }}
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
                      <span class="info-label">تاريخ النشر</span>
                      <strong class="info-value">{{ getDayName(selectedPostForView.target_date) }} - {{ formatDate(selectedPostForView.target_date) }}</strong>
                    </div>
                  </li>
                  <li>
                    <span class="info-icon">⏰</span>
                    <div class="info-data">
                      <span class="info-label">الديدلاين</span>
                      <strong class="info-value text-red">{{ formatDate(selectedPostForView.deadline) || 'غير محدد' }}</strong>
                    </div>
                  </li>
                  <li>
                    <span class="info-icon">👨‍🎨</span>
                    <div class="info-data">
                      <span class="info-label">المنفذ</span>
                      <strong class="info-value text-blue">{{ getUserName(selectedPostForView.designer_id) }}</strong>
                    </div>
                  </li>
                  <li>
                    <span class="info-icon">💰</span>
                    <div class="info-data">
                      <span class="info-label">حالة التمويل</span>
                      <strong class="info-value">{{ selectedPostForView.finance_status || 'غير ممول' }}</strong>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- العمود الرئيسي للمحتوى -->
            <div class="report-main">
              <div class="premium-card highlight-card">
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
              <div class="premium-card links-card" style="margin-top: 24px;">
                <h3 class="card-title">🔗 المراجع والروابط</h3>
                <div class="links-grid">
                  <div class="link-group">
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
                    <div class="premium-links-container" v-if="extractUrls(selectedPostForView.delivery_links).length">
                      <a v-for="(url, i) in extractUrls(selectedPostForView.delivery_links)" :key="i" :href="url" target="_blank" class="premium-btn-link del-link">
                        <span class="link-icon">📁</span> {{ getUrlLabel(url, i) }}
                      </a>
                    </div>
                    <div v-else class="no-data">لم يتم تسليم ملفات بعد</div>
                  </div>
                  
                  <div class="link-group" v-if="selectedPostForView.published_links && Object.keys(selectedPostForView.published_links).length">
                    <span class="group-label">تم النشر على (Live Links)</span>
                    <div class="premium-links-container">
                      <a v-for="(link, platform) in selectedPostForView.published_links" :key="platform" v-show="link" :href="link" target="_blank" class="premium-btn-link live-link">
                        <span class="link-icon">🌐</span> {{ platform }}
                      </a>
                    </div>
                  </div>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '../axios';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import CustomMultiSelect from '../components/CustomMultiSelect.vue';

const route = useRoute();
const planId = route.params.id;

const posts = ref([]);
const allUsers = ref([]);
const currentUser = ref(null);
const currentPlan = ref(null);

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
  selectedPostForView.value = post;
  isViewModalOpen.value = true;
};

const closeViewModal = () => {
  isViewModalOpen.value = false;
  selectedPostForView.value = null;
};

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
  if (['input', 'select', 'button', 'textarea', 'a', 'path', 'svg', 'label'].includes(targetTag) || e.target.closest('.icon-btn, .primary-btn, .secondary-btn, .custom-multiselect, .dropdown-menu, .multiselect-toggle')) return;

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
const addingRow = ref(false);

const isPlanResponsible = ref(false);

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

const canEditLinks = (post) => {
  const hasLinks = post.published_links && Object.values(post.published_links).some(link => link && String(link).trim() !== '');
  return !hasLinks || isManager.value; 
};

const savePublishedLinks = async () => {
  const post = currentPostForLinks.value;
  
  let platforms = [];
  if (post.publishing_platform) {
    if (Array.isArray(post.publishing_platform)) {
      platforms = post.publishing_platform;
    } else if (typeof post.publishing_platform === 'string') {
      try { platforms = JSON.parse(post.publishing_platform); } catch(e) {}
    }
  }

  let missingPlatforms = [];
  platforms.forEach(platform => {
    if (!tempLinks.value[platform] || String(tempLinks.value[platform]).trim() === '') {
      missingPlatforms.push(platform);
    }
  });

  if (missingPlatforms.length > 0) {
    const missingStr = missingPlatforms.join('، ');
    if (typeof showToast === 'function') {
      showToast(`عذراً، يجب إدخال روابط لجميع المنصات المحددة: ${missingStr}`);
    }
    return;
  }

  const payload = { published_links: tempLinks.value };
  
  if (pendingPublishStatus.value) {
    payload.actual_publish_status = 'تم النشر';
  }

  saving.value = true;
  try {
    const res = await api.put(`/plan-posts/${post.id}`, payload);
    post.published_links = res.data.data ? res.data.data.published_links : tempLinks.value;
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
    if (typeof showToast === 'function') showToast('تم حفظ روابط النشر بنجاح ✅');
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ الروابط');
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

const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 4000); };

const isManager = computed(() => {
  if (!currentUser.value) return false;
  return currentUser.value.role === 'manager';
});

const canEditFields = (post) => {
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

const canEditPublishAndNotes = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanResponsible.value) return true;
  
  return canEditFields(post);
};

const canEditDelivery = (post) => {
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

const startExecution = async (post) => {
  if (!window.confirm('هل أنت متأكد من تكليف المنفذ وبدء العمل؟ (تأكد من استكمال كافة بيانات الـ Brief)')) return;
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
  if (!window.confirm('هل أنت متأكد من إعادة إرسال المنشور للمراجعة؟')) return;
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
  return post.locked_fields && Array.isArray(post.locked_fields) && post.locked_fields.includes(fieldName);
};

const hasLockIcon = (post, fieldName) => {
  return post.locked_fields && Array.isArray(post.locked_fields) && post.locked_fields.includes(fieldName);
};

const unlockField = async (post, fieldName) => {
  if (!isManager.value) return;
  
  try {
    const response = await api.post(`/plan-posts/${post.id}/unlock-field`, { field_name: fieldName });
    post.locked_fields = response.data.locked_fields || response.data.data?.locked_fields || [];
    
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

const fetchUsers = async () => {
  try {
    const res = await api.get('/users?per_page=100');
    allUsers.value = res.data.data || [];
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
  } catch (error) {
    try {
      const fallbackRes = await api.get('/content-plans');
      const allPlans = fallbackRes.data.data || fallbackRes.data || [];
      currentPlan.value = allPlans.find(p => p.id == planId) || null;
    } catch(e) {
      console.error('Error fetching plan details:', e);
    }
  }
};

const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/content-plans/${planId}/posts`);
    posts.value = res.data.data.map(p => {
      let objArr = p.objective ? p.objective.split(', ') : [];
      let custom = objArr.filter(o => !predefinedObjectives.includes(o));
      let predefined = objArr.filter(o => predefinedObjectives.includes(o));
      
      let finalObjArr = [...predefined];
      if (custom.length > 0) finalObjArr.push('آخر');

      return {
        ...p,
        objective_array: finalObjArr,
        custom_objective: custom.join(', '),
        ad_platform: Array.isArray(p.ad_platform) ? p.ad_platform : (p.ad_platform ? JSON.parse(p.ad_platform) : []),
        reviewer_ids: Array.isArray(p.reviewer_ids) ? p.reviewer_ids : (p.reviewer_ids ? JSON.parse(p.reviewer_ids) : []),
        published_links: typeof p.published_links === 'string' ? JSON.parse(p.published_links || '{}') : (p.published_links || {}),
        deadline: formatDateTimeLocal(p.deadline)
      };
    });
    
    isPlanResponsible.value = res.data.is_responsible || false;
    
  } catch (error) {
    showToast('تعذر تحميل بيانات اللوحة.');
  } finally {
    loading.value = false;
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
  if (!confirm('هل أنت متأكد من حذف هذا الصف نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) {
    return;
  }

  try {
    await api.delete(`/plan-posts/${post.id}`);
    posts.value.splice(index, 1);
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
  saving.value = true;
  try {
    const res = await api.put(`/plan-posts/${post.id}`, { [field]: post[field] });
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
  } catch (error) {
    showToast('حدث خطأ أثناء الحفظ التلقائي!');
  } finally {
    setTimeout(() => { saving.value = false; }, 500);
  }
};

const approvePost = async (post, type) => {
  if (!window.confirm('هل أنت متأكد من الاعتماد؟')) return;
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
  if (!window.confirm('هل أنت متأكد من التراجع وإعادة فتح المراجعة لهذا المنشور؟')) return;
  
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
      post.published_links && post.published_links[platform] && String(post.published_links[platform]).trim() !== ''
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
    const res = await api.post(`/content-plans/${planId}/posts`, { target_date: newRowDate.value });
    const newPost = res.data.data;
    newPost.ad_platform = []; 
    newPost.reviewer_ids = []; 
    posts.value.push(newPost);
    posts.value.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
    showAddRowModal.value = false;
    newRowDate.value = '';
    showToast('تمت إضافة المنشور للجدول.');
  } catch (error) {
    showToast('خطأ في إضافة المنشور.');
  } finally {
    addingRow.value = false;
  }
};

onMounted(() => {
  fetchCurrentUser(); 
  fetchUsers();
  fetchCurrentPlan();
  fetchPosts();
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

input, select, textarea { width: 100%; height: 100%; min-height: 33px; border: none; outline: none; background: transparent; padding: 4px 6px; font-family: inherit; font-size: 11px; color: #222; text-align: center; resize: none; transition: 0.15s; }
textarea { padding-top: 8px; }

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

.modal-overlay { position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,0.5); display: grid; place-items: center; }
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
  grid-template-columns: 280px 1fr;
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
  color: #c9d2f4;
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
}

.info-label {
  font-size: 12px;
  color: #7a82a6;
}

.info-value {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
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
  color: #9ba3c4;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.links-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-label {
  font-size: 13px;
  color: #7a82a6;
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
</style>
