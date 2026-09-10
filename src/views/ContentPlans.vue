<template>
  <section class="plans-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / خطط المحتوى</span>
        <h2>{{ isManager ? 'إدارة خطط المحتوى' : 'الخطط المسندة إليّ' }}</h2>
        <p>تابع مراحل العمل، دورات المراجعة، ومواعيد التسليم من مكان واحد.</p>
      </div>
      <button v-if="isManager" class="primary-btn" type="button" @click="openManagerModal()">
        <span>＋</span> إضافة خطة جديدة
      </button>
    </div>

    <div class="summary-strip">
      <div><span class="summary-icon teal">◈</span><div><small>إجمالي الخطط</small><strong>{{ plans.length }}</strong></div></div>
      <div><span class="summary-icon purple">◌</span><div><small>قيد المراجعة</small><strong>{{ underReviewCount }}</strong></div></div>
      <div><span class="summary-icon orange">◷</span><div><small>مرفوضة / متأخرة</small><strong>{{ delayedCount }}</strong></div></div>
      <div class="sync-status"><i></i> بيانات محدثة من مساحة العمل</div>
    </div>

    <div class="plans-card">
      <div class="card-heading">
        <div><h3>الخطط الحالية <span>{{ plans.length }}</span></h3><p>حالة التسليم والمراجعة</p></div>
        <div class="legend">
          <span><i class="green-dot"></i> مكتملة</span>
          <span><i class="blue-dot"></i> جاهزة لمراجعة العميل</span>
          <span><i class="purple-dot"></i> قيد المراجعة</span>
          <span><i class="gray-dot"></i> قيد التنفيذ</span>
          <span><i class="orange-dot"></i> مرفوضة</span>
        </div>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول خطط المحتوى قابل للتمرير أفقيًا">
        <table class="plans-table" :aria-busy="loading">
          <thead>
            <tr>
              <th scope="col">العميل والخطة</th>
              <th scope="col">المسؤول</th>
              <th scope="col">المراجع الداخلي</th>
              <th scope="col">القائم بالخطة (المنفذ)</th>
              <th scope="col">التسليم النهائي</th>
              <th scope="col">المراجعة وحالة الخطة</th>
              <th scope="col">الروابط والمتابعة</th>
              <th v-if="isManager">إدارة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td :colspan="isManager ? 8 : 7" class="state-cell"><span class="spinner"></span> جارٍ التحميل...</td></tr>
            <tr v-else-if="plans.length === 0"><td :colspan="isManager ? 8 : 7" class="state-cell">لا توجد خطط مسجلة حاليًا</td></tr>
            <tr v-for="plan in plans" v-else :key="plan.id">
              <td>
                <div class="plan-cell">
                  <div class="plan-avatar">{{ getInitials(plan.client?.name || '؟') }}</div>
                  <div><strong>{{ plan.client?.name || 'عميل محذوف' }}</strong><span>{{ plan.plan_type }}</span></div>
                </div>
              </td>
              <td><span class="people-cell">{{ getRoleNames(plan.users, 'responsible') }}</span></td>
              <td><span v-if="plan.requires_review" class="people-cell">{{ getRoleNames(plan.users, 'reviewer') }}</span><span v-else class="muted">—</span></td>
              <td><span class="people-cell">{{ getRoleNames(plan.users, 'executor') }}</span></td>
              
              <td>
                <div class="milestone">
                  <span class="date">{{ formatDate(plan.planned_delivery_date) }}</span>
                  <div v-if="plan.status === 'completed'" class="status-badge status-green">
                    <i></i> تم التسليم <small>{{ formatDate(plan.actual_delivery_date) }}</small>
                  </div>
                  <button v-else-if="isUserResponsible(plan) && (plan.status === 'reviewed' || (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')))" class="confirm-btn" type="button" :disabled="actionLoading === `delivery-${plan.id}`" @click="submitFinalDelivery(plan)">
                    {{ actionLoading === `delivery-${plan.id}` ? 'جارٍ...' : 'تأكيد التسليم النهائي' }}
                  </button>
                  <span v-else class="muted">بانتظار إنهاء الدورة</span>
                </div>
              </td>
              
              <td>
                <div class="milestone" style="min-width: 175px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span v-if="plan.requires_review" class="date">{{ formatDate(plan.planned_review_date) }}</span>
                    <span v-else class="muted mb-1" style="display:block;">— لا تتطلب مراجعة —</span>
                    
                    <button v-if="isManager && plan.status !== 'completed'" title="تنبيه واتساب الذكي" aria-label="إرسال تنبيه واتساب ذكي" class="wa-quick-btn" type="button" @click="smartNotify(plan)">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    </button>
                  </div>
                  
                  <div v-if="isUserResponsible(plan) && plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')" class="mt-1 mb-1">
                    <button class="confirm-btn review" type="button" :disabled="actionLoading === `submit-review-${plan.id}`" @click="submitForReview(plan)">
                      {{ actionLoading === `submit-review-${plan.id}` ? 'جارٍ...' : 'إرسال للمراجعة الداخلية' }}
                    </button>
                  </div>
                  
                  <div v-if="isUserReviewer(plan) && plan.status === 'under_review'" class="review-actions mt-1 mb-1">
                    <button class="confirm-btn accept-btn" :disabled="actionLoading === `approve-${plan.id}`" @click="approvePlan(plan)">قبول ✅</button>
                    <button class="confirm-btn reject-btn" :disabled="actionLoading === `reject-${plan.id}`" @click="openRejectModal(plan)">رفض ❌</button>
                  </div>

                  <div :class="['status-badge', getPlanStatusInfo(plan.status).class]">
                    <i></i>{{ getPlanStatusInfo(plan.status).text }}
                    <small v-if="plan.requires_review && (plan.status === 'reviewed' || plan.status === 'completed')">{{ formatDate(plan.actual_review_date) }}</small>
                  </div>

                  <div v-if="plan.status === 'rejected'" class="mt-2">
                    <button class="reject-reasons-btn" type="button" @click="openRejectionsModal(plan)">عرض أسباب الرفض 📄</button>
                  </div>
                </div>
              </td>
              
              <td class="details-cell">
                <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-start;">
                  <button class="followup-btn" type="button" 
                          :disabled="plan.requires_review && !['reviewed', 'completed'].includes(plan.status)"
                          :title="plan.requires_review && !['reviewed', 'completed'].includes(plan.status) ? 'غير متاح قبل انتهاء المراجعة الداخلية' : ''"
                          @click="openFollowUpsModal(plan)">
                    متابعة العميل 💬 ({{ getFollowUps(plan).length }})
                  </button>
                  <a v-if="plan.final_link" :href="plan.final_link" target="_blank" rel="noopener noreferrer" class="link-btn">فتح البلان ↗</a>
                  <button v-if="plan.reference_links && plan.reference_links.length > 0" class="ref-links-btn" type="button" @click="openReferencesModal(plan)">
                    المراجع المساعدة 🔗 ({{ plan.reference_links.length }})
                  </button>
                  <button v-if="getReviewHistories(plan).length > 0" @click="openHistoryModal(plan)" class="history-btn">سجل الحركات 📋</button>
                  <button class="details-btn" type="button" @click="openDetailsModal(plan)">تحديث الرابط/الملاحظات</button>
                </div>
              </td>
              
              <td v-if="isManager">
                <div class="actions-cell">
                  <button class="action duplicate" type="button" title="استنساخ كقالب" aria-label="استنساخ الخطة" @click="openDuplicateModal(plan)">⎘</button>
                  <button class="action edit" type="button" title="تعديل" aria-label="تعديل خطة المحتوى" @click="openManagerModal(plan)">✎</button>
                  <button class="action delete" type="button" title="حذف" aria-label="حذف خطة المحتوى" @click="deletePlan(plan.id)">⌫</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showDuplicateModal" class="modal-overlay" role="presentation" @click.self="closeDuplicateModal">
      <div class="modal-content" role="dialog" style="width: min(500px, 100%) !important;">
        <button class="modal-close" type="button" @click="closeDuplicateModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #78e4d8, #65b5ff); color: #12183f;">⎘</div>
        <span class="eyebrow" style="color: #65b5ff;">استنساخ سريع</span>
        <h3>تحديد تواريخ الشهر الجديد</h3>
        <p>سيتم نسخ العميل، نوع الخطة، الروابط، وفريق العمل كما هم من الخطة الأصلية.</p>
        
        <form class="plan-form mt-2" @submit.prevent="submitDuplicate">
          <div class="form-grid">
            <div class="form-group">
              <label>تاريخ بداية الخطة</label>
              <input v-model="duplicateForm.start_date" type="date" required />
            </div>
            <div class="form-group">
              <label>تاريخ نهاية الخطة</label>
              <input v-model="duplicateForm.end_date" type="date" required />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>التسليم النهائي</label>
              <input v-model="duplicateForm.planned_delivery_date" type="datetime-local" required />
            </div>
            <div class="form-group" v-if="planToDuplicate?.requires_review">
              <label>موعد إنهاء المراجعة</label>
              <input v-model="duplicateForm.planned_review_date" type="datetime-local" required />
            </div>
          </div>
          <div class="modal-actions" style="margin-top: 20px;">
            <button type="button" class="secondary-btn" @click="closeDuplicateModal">إلغاء</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #78e4d8, #65b5ff);" :disabled="actionLoading === 'duplicate'">
              {{ actionLoading === 'duplicate' ? 'جارٍ الاستنساخ...' : 'تأكيد واستنساخ 🚀' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showImageViewer" class="modal-overlay image-viewer-overlay" role="presentation" @click.self="closeImageViewer">
      <button class="viewer-close" type="button" @click="closeImageViewer">×</button>
      <img :src="viewerImageUrl" alt="معاينة الصورة" class="viewer-image" />
    </div>

    <div v-if="showFollowUpsModal" class="modal-overlay" role="presentation" @click.self="closeFollowUpsModal">
      <div class="modal-content followups-modal" role="dialog" style="width: min(650px, 100%) !important;">
        <button class="modal-close" type="button" @click="closeFollowUpsModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #8fc9ff, #65b5ff); color: #12183f;">💬</div>
        <span class="eyebrow" style="color: #65b5ff;">سجل المتابعة</span>
        <h3>متابعة العميل: {{ selectedFollowUpPlan?.client?.name }}</h3>
        
        <form class="plan-form mt-2" style="background: rgba(6,11,37,.3); padding: 15px; border-radius: 12px; border: 1px solid rgba(145,160,230,.1);" @submit.prevent="saveFollowUp">
          <div class="form-group mb-2">
            <label>{{ editingFollowUpId ? 'تعديل التحديث' : 'إضافة تحديث جديد' }}</label>
            <textarea v-model="followUpForm.content" rows="3" required></textarea>
          </div>
          
          <div class="form-group mb-0 flex-upload-group">
            <label class="upload-btn">
              <input type="file" ref="fileInput" @change="handleImageUpload" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" hidden />
              <span>📷 إرفاق صورة (اختياري)</span>
            </label>
            
            <div v-if="imagePreview" class="image-preview-wrapper">
              <img :src="imagePreview" alt="preview" class="image-preview" />
              <button type="button" class="remove-image-btn" @click="clearImage" title="إلغاء الصورة">×</button>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 15px;">
            <button v-if="editingFollowUpId" type="button" class="secondary-btn" @click="cancelEditFollowUp">إلغاء التعديل</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #8fc9ff, #65b5ff);" :disabled="actionLoading === 'save-followup'">
              {{ actionLoading === 'save-followup' ? 'جارٍ...' : (editingFollowUpId ? 'حفظ التعديل' : 'إضافة التحديث') }}
            </button>
          </div>
        </form>

        <hr class="separator" />
        <div class="history-timeline">
          <div v-if="getFollowUps(selectedFollowUpPlan).length === 0" class="muted text-center">لا توجد متابعات مسجلة حتى الآن.</div>
          <div v-for="followUp in getFollowUps(selectedFollowUpPlan)" :key="followUp.id" class="timeline-item">
            <div class="tl-dot" style="background: #65b5ff;"></div>
            <div class="tl-content fu-content">
              <div class="tl-header">
                <strong>{{ followUp.user?.name || 'مجهول' }}</strong>
                <span class="tl-date" dir="ltr">{{ formatDate(followUp.created_at) }}</span>
              </div>
              <div class="fu-text">{{ followUp.content }}</div>
              
              <div v-if="followUp.image_url" class="fu-image-container" @click="openImageViewer(followUp.image_url)">
                <img :src="followUp.image_url" alt="مرفق" class="fu-thumbnail" />
                <div class="zoom-overlay"><span>🔍</span></div>
              </div>

              <div class="fu-actions" v-if="isManager">
                <button type="button" @click="editFollowUp(followUp)" class="fu-btn edit-fu">✎ تعديل</button>
                <button type="button" @click="deleteFollowUp(followUp.id)" class="fu-btn delete-fu">⌫ حذف</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReferencesModal" class="modal-overlay" role="presentation" @click.self="closeReferencesModal"><div class="modal-content references-modal" role="dialog" style="width: min(450px, 100%) !important;"><button class="modal-close" type="button" @click="closeReferencesModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #76e8de, #4facfe); color: #12183f;">🔗</div><span class="eyebrow" style="color: #4facfe;">مراجع العمل</span><h3>الروابط المساعدة للإنجاز</h3><p>الروابط المرفقة كمرجع ومصدر لإعداد هذه الخطة.</p><div class="ref-links-list mt-3"><a v-for="(link, index) in selectedReferencesPlan?.reference_links" :key="index" :href="link" target="_blank" rel="noopener noreferrer" class="ref-link-item"><span class="link-number">{{ index + 1 }}</span><span class="link-url">{{ link }}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a></div><div class="modal-actions" style="justify-content:center; margin-top:20px;"><button type="button" class="secondary-btn" @click="closeReferencesModal">إغلاق</button></div></div></div>
    <div v-if="showCreationSuccessModal" class="modal-overlay" role="presentation" @click.self="closeCreationModal"><div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center;"><button class="modal-close" type="button" @click="closeCreationModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #7de8dc, #b28aff); color: #12183f; margin: 0 auto 15px;">🚀</div><h3 style="color:#78e4d8;">تم إنشاء الخطة بنجاح!</h3><p style="margin-bottom: 20px;">الآن يمكنك إبلاغ المسؤولين ببدء العمل على هذه الخطة.</p><div class="wa-actions-container" v-if="createdPlan"><div v-if="getResponsibles(createdPlan).length > 0" class="executors-list"><h4 style="font-size:11px; color:#aeb6d7; text-align:right; margin-bottom:10px;">إبلاغ المسؤولين للإنجاز:</h4><div style="display:flex; flex-direction:column; gap:8px;"><a v-for="resp in getResponsibles(createdPlan)" :key="resp.id" :href="generateWaLink('plan_assigned', createdPlan, resp)" target="_blank" class="wa-btn-large" style="text-decoration:none; display:flex; align-items:center; justify-content:center;"><span>إرسال تنبيه للمسؤول: {{ resp.name }}</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 8px;"><path d="M17.472...Z"/></svg></a></div></div><div v-else class="muted mt-3" style="font-size:10px;">لا يوجد مسؤولين مسجلين في هذه الخطة.</div></div><div class="modal-actions" style="justify-content:center; margin-top:25px;"><button type="button" class="secondary-btn" @click="closeCreationModal">تخطي</button></div></div></div>
    <div v-if="showWaPromptModal" class="modal-overlay" @click.self="closeWaPrompt"><div class="modal-content delivery-modal" style="width: min(400px, 100%) !important; text-align: center;"><button class="modal-close" type="button" @click="closeWaPrompt">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #25D366, #128C7E); margin: 0 auto 15px; color:#fff;">📱</div><h3 style="color:#25D366;">{{ waPromptTitle }}</h3><p style="margin-bottom: 20px;">{{ waPromptDesc }}</p><a :href="waPromptLink" target="_blank" class="wa-btn-large" style="text-decoration: none;" @click="closeWaPrompt"><span>إرسال التنبيه عبر واتساب</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></a><div class="modal-actions" style="justify-content:center; margin-top:15px;"><button type="button" class="secondary-btn" @click="closeWaPrompt">تخطي</button></div></div></div>
    <div v-if="showDeliverySuccessModal" class="modal-overlay" @click.self="closeDeliveryModal"><div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center;"><button class="modal-close" type="button" @click="closeDeliveryModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #70e1d5, #55c8bc); margin: 0 auto 15px;">🎉</div><h3 style="color:#78e4d8;">تم اعتماد وتسليم الخطة بنجاح!</h3><p style="margin-bottom: 20px;">الآن يمكنك إبلاغ العميل بالرابط، وإعطاء إشارة البدء لفريق التنفيذ.</p><div class="wa-actions-container" v-if="deliveredPlan"><a :href="generateWaLink('client_delivery', deliveredPlan)" target="_blank" class="wa-btn-large" style="text-decoration:none;"><span>إبلاغ العميل على واتساب</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472...Z"/></svg></a><div v-if="getExecutors(deliveredPlan).length > 0" class="executors-list mt-3"><h4 style="font-size:11px; color:#aeb6d7; text-align:right; margin-bottom:10px;">إبلاغ المنفذين للبدء:</h4><div style="display:flex; flex-direction:column; gap:8px;"><a v-for="executor in getExecutors(deliveredPlan)" :key="executor.id" :href="generateWaLink('executors_start', deliveredPlan, executor)" target="_blank" class="wa-btn-small" style="text-decoration:none; display:block; text-align:center;">إرسال للمنفذ: {{ executor.name }} 📱</a></div></div><div v-else class="muted mt-3" style="font-size:9px;">لا يوجد منفذين مسجلين في هذه الخطة.</div></div><div class="modal-actions" style="justify-content:center; margin-top:25px;"><button type="button" class="secondary-btn" @click="closeDeliveryModal">إغلاق</button></div></div></div>
    <div v-if="showManagerModal && isManager" class="modal-overlay" @click.self="closeManagerModal"><div class="modal-content" role="dialog"><button class="modal-close" type="button" @click="closeManagerModal">×</button><div class="modal-icon">◈</div><span class="eyebrow">مساحة التخطيط</span><h3>{{ isEditing ? 'تعديل الخطة' : 'إنشاء خطة جديدة' }}</h3><form class="plan-form" @submit.prevent="saveManagerPlan"><div class="form-grid"><div class="form-group"><label>العميل المستهدف</label><select v-model="form.client_id" required><option value="" disabled>اختر العميل...</option><option v-for="client in allClients" :key="client.id" :value="client.id">{{ client.name }}</option></select></div><div class="form-group"><label>نوع الخطة</label><select v-model="form.plan_type" required><option value="" disabled>اختر...</option><option value="استراتيجية (Strategic)">استراتيجية</option><option value="محتوى (Content)">محتوى</option><option value="تسويق عبر السوشيال ميديا">سوشيال ميديا</option><option value="إعلانات ممولة (Media Buying)">إعلانات ممولة</option><option value="تحسين محركات البحث (SEO)">SEO</option><option value="خطة شاملة">خطة شاملة</option></select></div></div><div class="form-grid"><div class="form-group"><label>تاريخ بداية الخطة</label><input v-model="form.start_date" type="date" required /></div><div class="form-group"><label>تاريخ نهاية الخطة</label><input v-model="form.end_date" type="date" required /></div></div><div class="form-grid"><div class="form-group"><label>التسليم النهائي</label><input v-model="form.planned_delivery_date" type="datetime-local" required /></div><div class="form-group toggle-group"><label>مراجعة داخلية؟</label><label class="toggle-switch"><input type="checkbox" v-model="form.requires_review"><span class="slider"></span></label><span class="toggle-label">{{ form.requires_review ? 'نعم' : 'لا' }}</span></div></div><div class="form-grid" v-if="form.requires_review"><div class="form-group"><label>موعد إنهاء المراجعة</label><input v-model="form.planned_review_date" type="datetime-local" required /></div></div><div class="separator"></div><div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><div><span>🔗</span> الروابط المرجعية (Reference Links)</div><button type="button" class="add-link-btn" @click="addReferenceLink">＋ إضافة رابط</button></div><div class="reference-links-container"><div v-for="(link, index) in form.reference_links" :key="index" class="link-input-group"><input v-model="form.reference_links[index]" type="url" placeholder="أدخل رابط المرجع (مثال: Google Drive, Notion, etc...)" required /><button type="button" class="remove-link-btn" @click="removeReferenceLink(index)" title="حذف الرابط">⌫</button></div><p v-if="form.reference_links.length === 0" class="muted text-center" style="font-size:10px; margin-top:10px;">لا توجد روابط مرجعية (اختياري)</p></div><div class="separator"></div><div class="section-title"><span>⌁</span> توزيع المهام</div><div class="form-grid-3 users-grid"><div class="form-group"><label>المسؤول</label><div class="checkbox-list"><label v-for="user in allUsers" :key="'resp_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.responsible_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div><div class="form-group" v-if="form.requires_review"><label>المراجع</label><div class="checkbox-list"><label v-for="user in allUsers" :key="'rev_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.reviewer_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div><div class="form-group" :style="form.requires_review ? '' : 'grid-column: span 2;'"><label>المنفذ</label><div class="checkbox-list" :style="form.requires_review ? '' : 'display:grid; grid-template-columns:1fr 1fr;'"><label v-for="user in allUsers" :key="'exec_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.executor_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div></div><div class="modal-actions"><button type="button" class="secondary-btn" @click="closeManagerModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ الخطة' }}</button></div></form></div></div>
    <div v-if="showDetailsModal" class="modal-overlay" role="presentation" @click.self="closeDetailsModal"><div class="modal-content" role="dialog" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeDetailsModal">×</button><div class="modal-icon">✎</div><span class="eyebrow">تحديث سريع</span><h3>تحديث تفاصيل الخطة</h3><form class="plan-form" @submit.prevent="saveDetails"><div class="form-group"><label>لينك البلان النهائي</label><input v-model="detailsForm.final_link" type="url" placeholder="https://..." /></div><div class="form-group"><label>ملاحظات عامة</label><textarea v-model="detailsForm.notes" rows="4"></textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" @click="closeDetailsModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">حفظ التفاصيل</button></div></form></div></div>
    <div v-if="showRejectModal" class="modal-overlay" role="presentation" @click.self="closeRejectModal"><div class="modal-content reject-modal" role="dialog" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeRejectModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b);">❌</div><span class="eyebrow" style="color: #ff9bad;">إجراء مراجعة</span><h3 style="color: #ff9bad;">رفض الخطة وطلب تعديل</h3><form class="plan-form" @submit.prevent="submitRejectPlan"><div class="form-group"><label>ملاحظات الرفض (إجبارية)</label><textarea v-model="rejectNotes" rows="5" required></textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" @click="closeRejectModal">إلغاء</button><button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #ff8fa4, #ff678b);" :disabled="actionLoading.startsWith('reject-')">تأكيد الرفض</button></div></form></div></div>
    <div v-if="showRejectionsModal" class="modal-overlay" role="presentation" @click.self="closeRejectionsModal"><div class="modal-content history-modal" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeRejectionsModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b);">❌</div><h3>سجل أسباب الرفض</h3><div class="history-timeline"><div v-for="(rejection, index) in selectedRejections" :key="index" class="timeline-item"><div class="tl-dot tl-red"></div><div class="tl-content"><div class="tl-header"><strong>المراجع: {{ rejection.reviewer?.name || 'مجهول' }}</strong><span class="tl-date" dir="ltr">{{ formatDate(rejection.created_at) }}</span></div><div class="tl-action text-red">الرفض رقم {{ selectedRejections.length - index }}</div><div class="tl-notes">{{ rejection.notes }}</div></div></div></div></div></div>
    <div v-if="showHistoryModal" class="modal-overlay" role="presentation" @click.self="closeHistoryModal"><div class="modal-content history-modal" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeHistoryModal">×</button><div class="modal-icon">📋</div><h3>السجل الكامل للحركات</h3><div class="history-timeline"><div v-for="(history, index) in getReviewHistories(selectedHistoryPlan)" :key="index" class="timeline-item"><div class="tl-dot" :class="history.action === 'approved' ? 'tl-green' : 'tl-red'"></div><div class="tl-content"><div class="tl-header"><strong>{{ history.reviewer?.name || 'مجهول' }}</strong><span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span></div><div class="tl-action" :class="history.action === 'approved' ? 'text-green' : 'text-red'">{{ history.action === 'approved' ? '✅ وافق على الخطة' : '❌ رفض الخطة' }}</div><div class="tl-notes" v-if="history.notes">{{ history.notes }}</div></div></div></div></div></div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message" role="status" aria-live="polite">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import api from '../axios';

const getUserData = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { return {}; } };
const currentUser = getUserData();
const currentUserId = ref(currentUser.id || parseInt(localStorage.getItem('user_id') || 0));

const userRole = ref(localStorage.getItem('role') || 'employee'); 
const isManager = computed(() => userRole.value === 'manager');

const isUserResponsible = (plan) => { if (isManager.value) return true; return plan.users?.some(u => u.id === currentUserId.value && u.pivot.task_role === 'responsible'); };
const isUserReviewer = (plan) => { if (isManager.value) return true; return plan.users?.some(u => u.id === currentUserId.value && u.pivot.task_role === 'reviewer'); };
const getExecutors = (plan) => { if (!plan || !plan.users) return []; return plan.users.filter(u => u.pivot?.task_role === 'executor'); };
const getResponsibles = (plan) => { if (!plan || !plan.users) return []; return plan.users.filter(u => u.pivot?.task_role === 'responsible'); }; 

const plans = ref([]); 
const allUsers = ref([]); 
const allClients = ref([]); 
const loading = ref(true); 
const saving = ref(false); 
const actionLoading = ref('');
const toastMessage = ref('');
const editId = ref(null);

const showManagerModal = ref(false);
const showDetailsModal = ref(false);
const showRejectModal = ref(false);
const showHistoryModal = ref(false);
const showRejectionsModal = ref(false);
const showFollowUpsModal = ref(false);
const showDeliverySuccessModal = ref(false);
const showCreationSuccessModal = ref(false); 
const showReferencesModal = ref(false); 

// متغيرات ودوال نافذة عرض الصورة المكبرة
const showImageViewer = ref(false);
const viewerImageUrl = ref('');
const openImageViewer = (url) => { viewerImageUrl.value = url; showImageViewer.value = true; };
const closeImageViewer = () => { showImageViewer.value = false; viewerImageUrl.value = ''; };

const deliveredPlan = ref(null);
const createdPlan = ref(null); 
const selectedReferencesPlan = ref(null); 

const showWaPromptModal = ref(false);
const waPromptTitle = ref('');
const waPromptDesc = ref('');
const waPromptLink = ref('');

const isEditing = ref(false); 
const rejectNotes = ref('');
const selectedHistoryPlan = ref(null);
const selectedRejections = ref([]);
const selectedFollowUpPlan = ref(null);

// ==== إضافات دالة الاستنساخ كقالب ====
const showDuplicateModal = ref(false);
const planToDuplicate = ref(null);
const duplicateForm = reactive({ start_date: '', end_date: '', planned_delivery_date: '', planned_review_date: '' });

const openDuplicateModal = (plan) => {
  planToDuplicate.value = plan;
  duplicateForm.start_date = '';
  duplicateForm.end_date = '';
  duplicateForm.planned_delivery_date = '';
  duplicateForm.planned_review_date = '';
  showDuplicateModal.value = true;
};

const closeDuplicateModal = () => {
  showDuplicateModal.value = false;
  planToDuplicate.value = null;
};

const submitDuplicate = async () => {
  actionLoading.value = 'duplicate';
  try {
    await api.post(`/content-plans/${planToDuplicate.value.id}/duplicate`, duplicateForm);
    closeDuplicateModal();
    showToast('تم استنساخ الخطة بنجاح 🚀');
    await fetchPlans();
  } catch (error) {
    console.error('فشل الاستنساخ:', error);
    showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة الاستنساخ');
  } finally {
    actionLoading.value = '';
  }
};
// ======================================

// متغيرات ودوال الفورم الخاص بالمتابعة
const editingFollowUpId = ref(null);
const fileInput = ref(null);
const imagePreview = ref(null);
const followUpForm = reactive({ content: '', image: null });

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('حجم الصورة يجب أن لا يتعدى 5 ميجابايت'); return; }
  followUpForm.image = file;
  imagePreview.value = URL.createObjectURL(file);
};
const clearImage = () => {
  followUpForm.image = null;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
const cancelEditFollowUp = () => {
  editingFollowUpId.value = null;
  followUpForm.content = '';
  clearImage();
};
const editFollowUp = (item) => {
  editingFollowUpId.value = item.id;
  followUpForm.content = item.content;
  followUpForm.image = null; 
  imagePreview.value = item.image_url || null;
};
const saveFollowUp = async () => { 
  if (!followUpForm.content.trim()) return; 
  actionLoading.value = 'save-followup'; 
  const formData = new FormData();
  formData.append('content', followUpForm.content);
  if (followUpForm.image) {
    formData.append('image', followUpForm.image);
  }
  try { 
    if (editingFollowUpId.value) { 
      formData.append('_method', 'PUT');
      await api.post(`/follow-ups/${editingFollowUpId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
      showToast('تم التعديل'); 
    } else { 
      await api.post(`/content-plans/${selectedFollowUpPlan.value.id}/follow-ups`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
      showToast('تمت الإضافة'); 
    } 
    cancelEditFollowUp(); 
    await fetchPlans(); 
    selectedFollowUpPlan.value = plans.value.find(p => p.id === selectedFollowUpPlan.value.id); 
  } catch (error) {} finally { actionLoading.value = ''; } 
};
const deleteFollowUp = async (id) => { if (!window.confirm('متأكد من حذف المتابعة؟')) return; try { await api.delete(`/follow-ups/${id}`); showToast('تم الحذف'); await fetchPlans(); selectedFollowUpPlan.value = plans.value.find(p => p.id === selectedFollowUpPlan.value.id); } catch (error) {} };

const form = reactive({ 
  client_id: '', plan_type: '', start_date: '', end_date: '', requires_review: true, 
  planned_delivery_date: '', planned_review_date: '', 
  final_link: '', notes: '', reference_links: [], 
  responsible_ids: [], reviewer_ids: [], executor_ids: [] 
});
const detailsForm = reactive({ final_link: '', notes: '' });

const getReviewHistories = (plan) => { if (!plan) return []; return plan.review_histories || plan.reviewHistories || []; };
const getFollowUps = (plan) => { if (!plan) return []; return plan.client_follow_ups || plan.clientFollowUps || []; };

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const getRoleNames = (users = [], role) => { const matches = users.filter(user => user.pivot?.task_role === role); return matches.length ? matches.map(user => user.name).join('، ') : '—'; };
const formatDate = (value) => value ? new Date(value).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const toDatetimeLocal = (value) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
let toastTimer;
const showToast = (message) => { toastMessage.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMessage.value = ''; }, 3200); };

const getPlanStatusInfo = (status) => {
  switch(status) {
    case 'completed': return { text: 'مكتملة ومُعتمدة', class: 'status-green' };
    case 'reviewed': return { text: 'جاهزة لمراجعة العميل', class: 'status-blue' };
    case 'under_review': return { text: 'قيد المراجعة', class: 'status-purple' };
    case 'rejected': return { text: 'مرفوضة (تعديل)', class: 'status-red' };
    case 'pending': default: return { text: 'قيد التنفيذ', class: 'status-gray' };
  }
};

const underReviewCount = computed(() => plans.value.filter(plan => plan.status === 'under_review').length);
const delayedCount = computed(() => plans.value.filter(plan => plan.status === 'rejected' || (plan.status === 'pending' && new Date() > new Date(plan.planned_delivery_date))).length);

const fetchPlans = async () => { loading.value = true; try { const response = await api.get('/content-plans'); plans.value = response.data.data || response.data || []; } catch (error) { showToast('تعذر تحميل الخطط'); } finally { loading.value = false; } };
const fetchResources = async () => { if (isManager.value) { try { const [resUsers, resClients] = await Promise.all([api.get('/users?per_page=100'), api.get('/clients?per_page=100')]); allUsers.value = resUsers.data.data || []; allClients.value = resClients.data.data || []; } catch (error) {} } };

const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

const generateWaLink = (type, plan, specificUser = null) => {
  if (!plan) return '#';
  const systemPrefix = "-- *تنبيه آلي من نظام Octo Space*\n\n";
  let phone = '';
  let message = '';
  let targetUser = specificUser;

  switch (type) {
    case 'plan_assigned':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم إسناد خطة جديدة لك لعميل (*${plan.client?.name || ''}*).\nيرجى الدخول للنظام والبدء في الإنجاز.`;
      break;
    case 'review_needed':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'reviewer');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nيوجد خطة لعميل (*${plan.client?.name || ''}*) بانتظار مراجعتك الداخلية الآن.\nيرجى الدخول للنظام.`;
      break;
    case 'plan_rejected':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم رفض خطة العميل (*${plan.client?.name || ''}*).\nيرجى الدخول للنظام لقراءة الملاحظات وتعديلها.`;
      break;
    case 'plan_approved':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتمت الموافقة على خطة العميل (*${plan.client?.name || ''}*).\nالخطة جاهزة الآن للتسليم النهائي، يرجى المتابعة وتسليمها.`;
      break;
    case 'plan_delayed':
      const roleToBlame = plan.status === 'under_review' ? 'reviewer' : 'responsible';
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === roleToBlame);
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\n-- تنبيه بتأخير إنجاز خطة العميل (*${plan.client?.name || ''}*) عن الموعد المحدد.\nيرجى سرعة الإنجاز لتجنب تعطيل العمل.`;
      break;
    case 'client_delivery':
      phone = plan.client?.phone;
      message = `${systemPrefix}مرحباً بك عميلنا العزيز (*${plan.client?.name || ''}*)،\nتم اعتماد خطة العمل الخاصة بك بنجاح.\nيمكنك الاطلاع عليها من الرابط التالي:\n${plan.final_link || '---'}\n\nنسعد بخدمتكم.`;
      break;
    case 'executors_start':
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم اعتماد وتسليم خطة العميل (*${plan.client?.name || ''}*).\nيرجى البدء في مهام التنفيذ الخاصة بك.\nرابط الخطة: ${plan.final_link || '---'}`;
      break;
  }

  if (type !== 'client_delivery' && targetUser) {
    phone = targetUser.phone;
  }
  
  const formattedPhone = formatPhone(phone);
  if (!formattedPhone) return null;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

const triggerWaPrompt = (title, desc, type, plan) => {
  const link = generateWaLink(type, plan);
  if (!link) { showToast('رقم الهاتف غير مسجل أو غير صالح للشخص المستهدف.'); return; }
  waPromptTitle.value = title;
  waPromptDesc.value = desc;
  waPromptLink.value = link;
  showWaPromptModal.value = true;
};
const closeWaPrompt = () => { showWaPromptModal.value = false; };

const smartNotify = (plan) => {
  if (plan.status === 'pending' || plan.status === 'rejected') { triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المسؤول عن الخطة بضرورة الإنجاز.', 'plan_delayed', plan); } 
  else if (plan.status === 'under_review') { triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المراجع الداخلي لإنهاء المراجعة.', 'plan_delayed', plan); } 
  else if (plan.status === 'reviewed') { triggerWaPrompt('الخطة جاهزة', 'تنبيه المسؤول لتسليم الخطة للعميل.', 'plan_approved', plan); } 
  else { showToast('الخطة مكتملة.'); }
};

const submitForReview = async (plan) => {
  if (!window.confirm('إرسال الخطة للمراجعة الداخلية؟')) return;
  actionLoading.value = `submit-review-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/submit-review`); 
    showToast('تم الإرسال للمراجعة'); 
    await fetchPlans(); 
    triggerWaPrompt('تم الإرسال بنجاح', 'هل تريد إرسال تنبيه للمراجع لكي يبدأ الآن؟', 'review_needed', plan);
  } catch (error) {} finally { actionLoading.value = ''; }
};

const approvePlan = async (plan) => {
  if (!window.confirm('تأكيد الموافقة على الخطة؟')) return;
  actionLoading.value = `approve-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/approve`); 
    showToast('تم الاعتماد'); 
    await fetchPlans();
    triggerWaPrompt('تمت الموافقة بنجاح', 'أبلغ المسؤول الآن بأن الخطة جاهزة لتُسلم للعميل.', 'plan_approved', plan);
  } catch (error) {} finally { actionLoading.value = ''; }
};

const submitRejectPlan = async () => {
  actionLoading.value = `reject-${editId.value}`;
  const planToReject = plans.value.find(p => p.id === editId.value);
  try { 
    await api.post(`/content-plans/${editId.value}/reject`, { notes: rejectNotes.value }); 
    showToast('تم رفض الخطة'); 
    closeRejectModal(); 
    await fetchPlans();
    triggerWaPrompt('تم تسجيل الرفض', 'أبلغ المسؤول الآن بضرورة الدخول لقراءة ملاحظاتك وتعديلها.', 'plan_rejected', planToReject);
  } catch (error) {} finally { actionLoading.value = ''; }
};

const submitFinalDelivery = async (plan) => {
  if (!window.confirm('تأكيد التسليم النهائي للعميل؟')) return;
  actionLoading.value = `delivery-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/final-delivery`); 
    showToast('تم التسليم بنجاح'); 
    await fetchPlans(); 
    deliveredPlan.value = plans.value.find(p => p.id === plan.id);
    showDeliverySuccessModal.value = true;
  } catch (error) {} finally { actionLoading.value = ''; }
};
const closeDeliveryModal = () => { showDeliverySuccessModal.value = false; deliveredPlan.value = null; };

const addReferenceLink = () => {
  if (form.reference_links.length >= 15) { showToast('الحد الأقصى هو 15 رابط.'); return; }
  form.reference_links.push('');
};
const removeReferenceLink = (index) => { form.reference_links.splice(index, 1); };
const openReferencesModal = (plan) => { selectedReferencesPlan.value = plan; showReferencesModal.value = true; };
const closeReferencesModal = () => { showReferencesModal.value = false; selectedReferencesPlan.value = null; };

const resetForm = () => Object.assign(form, { 
  client_id: '', plan_type: '', start_date: '', end_date: '', requires_review: true, 
  planned_delivery_date: '', planned_review_date: '', 
  final_link: '', notes: '', reference_links: [],
  responsible_ids: [], reviewer_ids: [], executor_ids: [] 
});

const openManagerModal = (plan = null) => { 
  isEditing.value = Boolean(plan); 
  editId.value = plan?.id || null; 
  if (plan) { 
    Object.assign(form, { 
      client_id: plan.client_id, 
      plan_type: plan.plan_type, 
      start_date: plan.start_date ? plan.start_date.split('T')[0].split(' ')[0] : '', 
      end_date: plan.end_date ? plan.end_date.split('T')[0].split(' ')[0] : '', 
      requires_review: Boolean(plan.requires_review), 
      planned_delivery_date: toDatetimeLocal(plan.planned_delivery_date), 
      planned_review_date: toDatetimeLocal(plan.planned_review_date), 
      final_link: plan.final_link || '', 
      notes: plan.notes || '', 
      reference_links: Array.isArray(plan.reference_links) ? [...plan.reference_links] : [],
      responsible_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'responsible').map(user => user.id), 
      reviewer_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'reviewer').map(user => user.id), 
      executor_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'executor').map(user => user.id) 
    }); 
  } else { 
    resetForm(); 
  } 
  showManagerModal.value = true; 
};
const closeManagerModal = () => { showManagerModal.value = false; };
const closeCreationModal = () => { showCreationSuccessModal.value = false; createdPlan.value = null; };

const saveManagerPlan = async () => { 
  saving.value = true; 
  if (!form.requires_review) { form.planned_review_date = ''; form.reviewer_ids = []; } 
  form.reference_links = form.reference_links.filter(link => link.trim() !== '');
  
  try { 
    if (isEditing.value) {
      await api.put(`/content-plans/${editId.value}`, form);
      closeManagerModal(); 
      showToast('تم التحديث بنجاح'); 
      await fetchPlans(); 
    } else {
      const response = await api.post('/content-plans', form);
      closeManagerModal(); 
      showToast('تم الإنشاء بنجاح'); 
      await fetchPlans(); 
      const newPlanId = response.data?.data?.id;
      if(newPlanId) {
        createdPlan.value = plans.value.find(p => p.id === newPlanId);
        showCreationSuccessModal.value = true;
      }
    }
  } catch (error) {} finally { saving.value = false; } 
};

const deletePlan = async (id) => { if (!window.confirm('تأكيد الحذف؟')) return; try { await api.delete(`/content-plans/${id}`); showToast('تم الحذف'); await fetchPlans(); } catch (error) {} };

const openDetailsModal = (plan) => { editId.value = plan.id; detailsForm.final_link = plan.final_link || ''; detailsForm.notes = plan.notes || ''; showDetailsModal.value = true; };
const closeDetailsModal = () => { showDetailsModal.value = false; };
const saveDetails = async () => { saving.value = true; try { await api.put(`/content-plans/${editId.value}/details`, detailsForm); closeDetailsModal(); showToast('تم التحديث'); await fetchPlans(); } catch (error) {} finally { saving.value = false; } };

const openRejectModal = (plan) => { editId.value = plan.id; rejectNotes.value = ''; showRejectModal.value = true; };
const closeRejectModal = () => { showRejectModal.value = false; editId.value = null; };

const openHistoryModal = (plan) => { selectedHistoryPlan.value = plan; showHistoryModal.value = true; };
const closeHistoryModal = () => { showHistoryModal.value = false; selectedHistoryPlan.value = null; };

const openRejectionsModal = (plan) => { selectedHistoryPlan.value = plan; selectedRejections.value = getReviewHistories(plan).filter(h => h.action === 'rejected'); showRejectionsModal.value = true; };
const closeRejectionsModal = () => { showRejectionsModal.value = false; selectedHistoryPlan.value = null; selectedRejections.value = []; };

const openFollowUpsModal = (plan) => { selectedFollowUpPlan.value = plan; cancelEditFollowUp(); showFollowUpsModal.value = true; };
const closeFollowUpsModal = () => { showFollowUpsModal.value = false; selectedFollowUpPlan.value = null; };

watch(showManagerModal, async (open) => {
  document.body.classList.toggle('modal-is-open', open)
  if (open) {
    await nextTick()
  }
})

onMounted(() => { fetchPlans(); fetchResources(); })

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  document.body.classList.remove('modal-is-open')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing:border-box; } :global(body) { margin:0; font-family:'Cairo',sans-serif; }.plans-page { min-height:100%; color:#edf0ff; font-family:'Cairo',sans-serif; }.page-topline { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }.eyebrow { color:#76e8de; font-size:10px; font-weight:700; letter-spacing:.7px; }.page-topline h2 { margin:7px 0 3px; font-size:28px; }.page-topline p { margin:0; color:#818cb9; font-size:12px; }.primary-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:43px; padding:0 17px; border:0; border-radius:11px; color:#12183f; background:linear-gradient(110deg,#7de8dc,#b28aff); font:inherit; font-size:11px; font-weight:800; cursor:pointer; box-shadow:0 9px 22px rgba(111,222,211,.13); transition:.2s; }.primary-btn span { font-size:20px; line-height:0; }.primary-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.06); }.primary-btn:disabled { opacity:.6; cursor:wait; }
.summary-strip { display:grid; grid-template-columns:repeat(3,1fr) 1.7fr; gap:1px; overflow:hidden; margin-bottom:18px; border:1px solid rgba(137,153,226,.13); border-radius:15px; background:rgba(137,153,226,.13); }.summary-strip > div { display:flex; align-items:center; gap:10px; padding:13px 17px; background:rgba(21,29,73,.68); }.summary-icon { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; font-size:16px; }.teal { color:#7de8dc; background:rgba(93,222,209,.12); }.purple { color:#c994ff; background:rgba(180,112,255,.12); }.orange { color:#ffc480; background:rgba(255,186,86,.12); }.summary-strip small,.summary-strip strong { display:block; }.summary-strip small { color:#7c87b5; font-size:9px; }.summary-strip strong { color:#eef0ff; font-size:20px; }.sync-status { justify-content:center; color:#7480ae; font-size:9px; }.sync-status i { width:6px; height:6px; border-radius:50%; background:#72e5d9; box-shadow:0 0 8px #72e5d9; }
.plans-card { overflow:hidden; border:1px solid rgba(137,153,226,.13); border-radius:18px; background:rgba(15,22,61,.65); }.card-heading { display:flex; align-items:center; justify-content:space-between; padding:20px 23px 17px; }.card-heading h3 { margin:0; font-size:15px; }.card-heading h3 span { margin-right:6px; padding:2px 7px; border-radius:7px; color:#7de8dc; background:rgba(89,220,207,.11); font-size:9px; }.card-heading p { margin:4px 0 0; color:#6e79a9; font-size:10px; }.legend { display:flex; gap:14px; color:#7e89b5; font-size:9px; }.legend i { display:inline-block; width:6px; height:6px; margin-left:4px; border-radius:50%; }.green-dot { background:#71e1d5; }.blue-dot { background:#65b5ff; }.purple-dot { background:#c994ff; }.orange-dot { background:#ffbd73; }.gray-dot { background:#97a5d0; }.table-responsive { overflow-x:auto; }.plans-table { width:100%; min-width:1250px; border-collapse:collapse; text-align:right; }.plans-table th,.plans-table td { padding:13px 18px; border-top:1px solid rgba(138,152,222,.09); vertical-align:middle; }.plans-table th { color:#6874a6; background:rgba(10,16,47,.35); font-size:9px; font-weight:600; }.plans-table td { color:#d9ddf5; font-size:10px; }.plan-cell { display:flex; align-items:center; gap:9px; }.plan-avatar { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; color:#252058; background:linear-gradient(145deg,#80e8df,#ac84fa); font-size:9px; font-weight:800; }.plan-cell strong,.plan-cell span { display:block; }.plan-cell strong { font-size:10px; }.plan-cell span,.people-cell,.muted { color:#7782b0; font-size:9px; }.milestone { min-width:145px; }.date { display:block; color:#aeb6d7; direction:ltr; text-align:right; font-size:9px; }.status-badge { display:inline-flex; align-items:center; gap:5px; margin-top:5px; padding:4px 6px; border-radius:6px; font-size:8px; }.status-badge i { width:5px; height:5px; border-radius:50%; }.status-badge small { display:block; margin-right:4px; color:#7782b0; font-size:8px; }

.status-green { color:#78e4d8; background:rgba(90,220,207,.1); } .status-green i { background:#70e1d5; }
.status-blue { color:#8fc9ff; background:rgba(101,181,255,.1); } .status-blue i { background:#65b5ff; }
.status-purple { color:#c491ff; background:rgba(180,112,255,.12); } .status-purple i { background:#b470ff; }
.status-red { color:#ff9bad; background:rgba(255,103,139,.1); } .status-red i { background:#ff8fa4; }
.status-gray { color:#aab5da; background:rgba(133,149,218,.1); } .status-gray i { background:#97a5d0; }

.wa-quick-btn { background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; border-radius: 6px; padding: 3px 6px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
.wa-quick-btn:hover { background: rgba(37, 211, 102, 0.2); transform: scale(1.05); }
.wa-actions-container { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
.wa-btn-large { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px; border:none; border-radius:10px; background:linear-gradient(110deg, #25D366, #128C7E); color:#fff; font-size:12px; font-weight:bold; cursor:pointer; font-family:inherit; transition:.2s; box-shadow:0 4px 15px rgba(37,211,102,.2); }
.wa-btn-large:hover { transform: translateY(-2px); box-shadow:0 6px 20px rgba(37,211,102,.3); }
.wa-btn-small { padding:8px 12px; border:1px solid rgba(37,211,102,.3); border-radius:8px; background:rgba(37,211,102,.05); color:#25D366; font-size:10px; font-family:inherit; cursor:pointer; transition:.2s; }
.wa-btn-small:hover { background:rgba(37,211,102,.15); }

.reject-reasons-btn { display:inline-block; margin-top:6px; padding:5px 8px; border:1px dashed rgba(255,103,139,.4); border-radius:6px; color:#ff9bad; background:rgba(255,103,139,.08); font-size:9px; cursor:pointer; transition:.2s; } .reject-reasons-btn:hover { background:rgba(255,103,139,.15); }

.details-cell { min-width:165px; }
.link-btn, .history-btn, .details-btn, .followup-btn { display:inline-block; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:9px; cursor:pointer; text-align:center; border:none; font-family:inherit; }
.link-btn { color:#78e5da; background:rgba(90,220,207,.08); margin-bottom: 6px; } .link-btn:hover { background:rgba(90,220,207,.15); }
.history-btn { color:#c491ff; background:rgba(180,112,255,.08); } .history-btn:hover { background:rgba(180,112,255,.15); }
.details-btn { border:1px solid rgba(180,112,255,.2); color:#c491ff; background:rgba(180,112,255,.08); margin-top: 6px; } .details-btn:hover { filter:brightness(1.25); }

.followup-btn { color:#8fc9ff; border: 1px solid rgba(101,181,255,.2); background:rgba(101,181,255,.08); font-weight:600; padding:6px 8px; transition: 0.2s; margin-bottom: 6px; } 
.followup-btn:hover:not(:disabled) { background:rgba(101,181,255,.15); }
.followup-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

.ref-links-btn { color:#4facfe; background:rgba(79,172,254,.08); border:1px solid rgba(79,172,254,.2); padding:4px 8px; border-radius:6px; font-size:9px; font-weight:bold; cursor:pointer; text-align:center; transition:.2s; margin-bottom: 6px; font-family: inherit; }
.ref-links-btn:hover { background:rgba(79,172,254,.15); }
.ref-links-list { display:flex; flex-direction:column; gap:10px; max-height: 300px; overflow-y: auto; padding-right: 5px; }
.ref-link-item { display:flex; align-items:center; gap:10px; padding:12px; background:rgba(6,11,37,.4); border:1px solid rgba(79,172,254,.2); border-radius:10px; text-decoration:none; color:#d9ddf5; transition:.2s; }
.ref-link-item:hover { background:rgba(79,172,254,.1); border-color:#4facfe; transform:translateY(-2px); }
.link-number { width:24px; height:24px; display:grid; place-items:center; background:#4facfe; color:#12183f; border-radius:6px; font-size:11px; font-weight:800; }
.link-url { flex-grow:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px; direction:ltr; text-align:left; color: #aeb6d7; }

.review-actions { display:flex; gap:6px; } 
.accept-btn { color:#78e4d8 !important; border-color:rgba(120,228,216,.3) !important; background:rgba(90,220,207,.08) !important; } 
.reject-btn { color:#ff9bad !important; border-color:rgba(255,155,173,.3) !important; background:rgba(255,103,139,.08) !important; }

.actions-cell { display:flex; gap:6px; }.action { width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; cursor:pointer; font-size:14px; }
/* ستايل زر الاستنساخ الجديد */
.action.duplicate { color: #65b5ff; background: rgba(101, 181, 255, .08); }
.action.edit { color:#78e4da; background:rgba(92,220,208,.08); }.action.delete { color:#ff94ab; background:rgba(255,103,139,.08); }.action:hover { filter:brightness(1.3); transform:translateY(-1px); }.state-cell { height:145px; color:#7d89b6 !important; text-align:center !important; }.spinner { display:inline-block; width:15px; height:15px; margin-left:7px; vertical-align:middle; border:2px solid rgba(125,232,220,.25); border-top-color:#7de8dc; border-radius:50%; animation:spin .7s linear infinite; }
.modal-overlay { position:fixed; inset:82px 0 0; z-index:100; display:grid; place-items:start center; padding:18px; overflow-y:auto; background:rgba(4,7,27,.78); backdrop-filter:blur(7px); }.modal-content { width:min(780px,100%); max-height:calc(100vh - 118px); overflow-y:auto; position:relative; padding:28px; border:1px solid rgba(146,160,233,.2); border-radius:20px; background:linear-gradient(145deg,#171d52,#0d143a); box-shadow:0 25px 70px rgba(0,0,0,.4); }.modal-close { position:absolute; top:12px; left:16px; border:0; color:#8994c2; background:transparent; font-size:25px; cursor:pointer; }.modal-icon { width:42px; height:42px; display:grid; place-items:center; margin-bottom:12px; border-radius:12px; color:#202057; background:linear-gradient(145deg,#80e8df,#b486fb); font-size:21px; }.modal-content h3 { margin:7px 0 2px; font-size:21px; }.modal-content > p { margin:0; color:#818cb9; font-size:11px; }.plan-form { margin-top:23px; }.form-grid,.form-grid-3 { display:grid; gap:13px; margin-bottom:14px; }.form-grid { grid-template-columns:1fr 1fr; }.form-grid-3 { grid-template-columns:repeat(3,1fr); }.form-group { min-width:0; margin-bottom:13px; }.form-group label { display:block; margin-bottom:6px; color:#b8c0e2; font-size:10px; }.form-group label small { color:#6975a7; font-size:8px; }.form-group input,.form-group select, .form-group textarea { width:100%; min-height:42px; padding:0 11px; border:1px solid rgba(145,160,230,.2); border-radius:9px; outline:0; color:#eef0ff; background:rgba(6,11,37,.46); font:inherit; font-size:10px; direction: rtl; }.form-group input[type="url"] { direction: ltr; text-align: left; }.form-group textarea { padding-top: 10px; resize: vertical; }.form-group input:focus,.form-group select:focus, .form-group textarea:focus { border-color:#76e8de; box-shadow:0 0 0 3px rgba(118,232,222,.08); }.form-group input::placeholder, .form-group textarea::placeholder { color:#626e9e; }.separator { height:1px; margin:20px 0 15px; border:0; background:rgba(143,157,226,.14); }.section-title { color:#b986ff; font-size:11px; font-weight:700; }.section-title span { color:#76e8de; margin-left:4px; }.helper-text { margin:3px 0 13px; color:#6f7baa; font-size:9px; }.modal-actions { display:flex; justify-content:flex-start; gap:9px; margin-top:18px; }.secondary-btn { min-height:43px; padding:0 18px; border:1px solid rgba(143,157,226,.2); border-radius:10px; color:#aab4dc; background:transparent; font:inherit; font-size:11px; cursor:pointer; }
.confirm-btn { margin-top:5px; padding:5px 7px; border:1px solid rgba(117,231,218,.2); border-radius:6px; color:#78e4d8; background:rgba(90,220,207,.08); font-size:8px; cursor:pointer; }.confirm-btn:hover:not(:disabled) { filter:brightness(1.3); }.confirm-btn:disabled { opacity:.5; cursor:wait; }
.toggle-group { display:flex; align-items:center; gap:10px; flex-direction:row !important; margin-top:15px; } .toggle-group label:first-child { margin-bottom:0; flex-grow:1; } .toggle-switch { position:relative; display:inline-block; width:44px; height:24px; } .toggle-switch input { opacity:0; width:0; height:0; } .slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:rgba(145,160,230,.2); transition:.4s; border-radius:34px; } .slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background-color:#7d89b6; transition:.4s; border-radius:50%; } input:checked + .slider { background-color:rgba(125,232,220,.25); } input:checked + .slider:before { transform:translateX(20px); background-color:#7de8dc; } .toggle-label { font-size:10px; color:#aeb6d7; min-width:55px; }
.checkbox-list { display:flex; flex-direction:column; gap:8px; padding:10px; border:1px solid rgba(145,160,230,.15); border-radius:9px; background:rgba(6,11,37,.25); max-height:150px; overflow-y:auto; } .custom-cb { display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:0 !important; } .custom-cb input[type="checkbox"] { width:14px !important; min-height:14px !important; margin:0; accent-color:#76e8de; } .custom-cb .cb-text { color:#d9ddf5; font-size:11px; }

/* Dynamic Reference Links Styles */
.add-link-btn { background: transparent; border: 1px dashed rgba(118,232,222,.4); color: #76e8de; border-radius: 6px; padding: 4px 8px; font-size: 9px; cursor: pointer; transition: 0.2s; }
.add-link-btn:hover { background: rgba(118,232,222,.1); }
.reference-links-container { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto; padding-right: 5px; }
.link-input-group { display: flex; gap: 8px; align-items: center; }
.link-input-group input { flex-grow: 1; }
.remove-link-btn { background: rgba(255,103,139,.1); color: #ff9bad; border: 1px solid rgba(255,155,173,.3); border-radius: 8px; width: 42px; height: 42px; display: grid; place-items: center; cursor: pointer; transition: 0.2s; font-size: 14px; }
.remove-link-btn:hover { background: rgba(255,103,139,.2); }

/* Timeline Styles */
.history-timeline { margin-top:20px; padding-right:10px; border-right:2px solid rgba(145,160,230,.15); display:flex; flex-direction:column; gap:20px; } .timeline-item { position:relative; } .tl-dot { position:absolute; right:-15px; top:3px; width:10px; height:10px; border-radius:50%; border:2px solid #171d52; } .tl-green { background:#78e4d8; } .tl-red { background:#ff9bad; } .tl-content { background:rgba(6,11,37,.4); padding:12px; border-radius:8px; border:1px solid rgba(145,160,230,.1); } .tl-header { display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#d9ddf5; } .tl-date { color:#7782b0; font-size:9px; } .tl-action { font-size:10px; font-weight:700; margin-bottom:5px; } .text-green { color:#78e4d8; } .text-red { color:#ff9bad; } .tl-notes { background:rgba(0,0,0,.2); padding:8px; border-radius:6px; font-size:10px; color:#aab5da; font-style:italic; }
.mb-0 { margin-bottom:0 !important; } .mt-2 { margin-top:15px !important; } .mt-3 { margin-top:20px !important; }

/* Follow Ups Styles */
.fu-content { background: rgba(101,181,255,.05); border-color: rgba(101,181,255,.15); } .fu-text { font-size: 11px; color: #d9ddf5; line-height: 1.6; white-space: pre-wrap; margin-bottom: 8px; } .fu-actions { display:flex; gap: 8px; justify-content: flex-end; } .fu-btn { background: transparent; border: 1px solid; border-radius: 4px; padding: 3px 8px; font-size: 9px; cursor: pointer; } .edit-fu { color: #8fc9ff; border-color: rgba(143,201,255,.3); } .edit-fu:hover { background: rgba(143,201,255,.1); } .delete-fu { color: #ff9bad; border-color: rgba(255,155,173,.3); } .delete-fu:hover { background: rgba(255,103,139,.1); }

/* File Upload & Image Preview Styles (Follow Ups) */
.mb-2 { margin-bottom: 15px !important; }
.flex-upload-group { display: flex; align-items: center; gap: 15px; }
.upload-btn { display: inline-block; padding: 8px 12px; border: 1px dashed rgba(101,181,255,.4); border-radius: 8px; color: #8fc9ff; background: rgba(101,181,255,.05); font-size: 10px; cursor: pointer; transition: 0.2s; margin-bottom: 0 !important; }
.upload-btn:hover { background: rgba(101,181,255,.15); }
.image-preview-wrapper { position: relative; width: 45px; height: 45px; border-radius: 8px; border: 1px solid rgba(145,160,230,.2); overflow: visible; }
.image-preview { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.remove-image-btn { position: absolute; top: -6px; left: -6px; width: 18px; height: 18px; background: #ff9bad; color: #12183f; border: none; border-radius: 50%; font-size: 12px; font-weight: bold; cursor: pointer; display: grid; place-items: center; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }

/* Image Viewer inside Timeline */
.fu-image-container { position: relative; display: inline-block; margin-bottom: 8px; cursor: zoom-in; border-radius: 8px; overflow: hidden; border: 1px solid rgba(145,160,230,.15); transition: 0.2s; }
.fu-image-container:hover { border-color: #65b5ff; }
.fu-thumbnail { display: block; max-height: 120px; max-width: 100%; object-fit: cover; border-radius: 8px; }
.zoom-overlay { position: absolute; inset: 0; background: rgba(10,16,47,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; color: #fff; font-size: 20px; }
.fu-image-container:hover .zoom-overlay { opacity: 1; }

/* Full Screen Image Viewer Modal */
.image-viewer-overlay { background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 999; display: grid; place-items: center; padding: 20px; }
.viewer-close { position: absolute; top: 20px; right: 25px; background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 35px; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; transition: 0.2s; display: grid; place-items: center; z-index: 1000; }
.viewer-close:hover { background: #ff9bad; color: #12183f; transform: scale(1.1); }
.viewer-image { max-width: 100%; max-height: 90vh; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.1); }

.toast-message { position:fixed; left:25px; bottom:25px; z-index:200; padding:12px 17px; border:1px solid rgba(116,232,220,.22); border-radius:10px; color:#bdf7f0; background:#182552; box-shadow:0 12px 30px rgba(0,0,0,.25); font-size:11px; }.toast-enter-active,.toast-leave-active { transition:.25s; }.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(10px); } @keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:720px) { .page-topline { align-items:flex-start; flex-direction:column; }.page-topline h2 { font-size:24px; }.primary-btn { width:100%; }.summary-strip { grid-template-columns:1fr 1fr; }.sync-status { grid-column:1 / -1; }.card-heading { padding-right:15px; padding-left:15px; }.legend { display:none; }.plans-table th,.plans-table td { padding-right:14px; padding-left:14px; }.modal-overlay { inset:70px 0 0; padding:12px; }.modal-content { max-height:calc(100vh - 82px); padding:23px 18px; }.form-grid,.form-grid-3 { grid-template-columns:1fr; gap:0; }.form-group.toggle-group { flex-direction:column !important; align-items:flex-start; margin-top:0; margin-bottom:15px; } .modal-actions { margin-top:5px; } }
</style>

<style scoped>
:global(body.modal-is-open) { overflow: hidden; }

/* Readability and proportional typography */
.plans-page { min-width: 0; }
.page-topline > div { min-width: 0; }
.eyebrow { display: inline-block; font-size: 12px !important; line-height: 1.5; letter-spacing: .35px; }
.page-topline h2 { font-size: clamp(26px, 2.5vw, 32px) !important; line-height: 1.25; font-weight: 800; }
.page-topline p { font-size: 14px !important; line-height: 1.7; }
.primary-btn, .secondary-btn { min-height: 48px; padding-inline: 19px; font-size: 14px !important; }
.summary-strip > div { min-width: 0; padding: 16px 18px; }
.summary-icon { width: 38px; height: 38px; flex: 0 0 38px; font-size: 19px; }
.summary-strip small { font-size: 12px !important; line-height: 1.5; }
.summary-strip strong { font-size: 24px !important; line-height: 1.2; }
.sync-status { font-size: 12px !important; line-height: 1.5; }
.card-heading { gap: 16px; padding: 22px 24px 18px; }
.card-heading > div:first-child { min-width: 0; }
.card-heading h3 { font-size: 19px !important; line-height: 1.4; }
.card-heading h3 span { font-size: 12px !important; }
.card-heading p { font-size: 13px !important; line-height: 1.6; }
.legend { flex-wrap: wrap; gap: 9px 14px; font-size: 12px !important; line-height: 1.5; }

/* Keep horizontal scrolling limited to the complex table. */
.table-responsive { overflow-x: auto; overflow-y: visible; overscroll-behavior-inline: contain; scrollbar-width: thin; }
.plans-table { min-width: 1280px; }
.plans-table th { font-size: 13px !important; line-height: 1.5; white-space: nowrap; }
.plans-table td { font-size: 14px !important; line-height: 1.6; }
.plan-cell { min-width: 175px; }
.plan-avatar { width: 40px; height: 40px; flex: 0 0 40px; font-size: 13px; }
.plan-cell > div:last-child { min-width: 0; }
.plan-cell strong { overflow: hidden; font-size: 14px !important; text-overflow: ellipsis; white-space: nowrap; }
.plan-cell span, .people-cell, .muted { font-size: 13px !important; }
.milestone { min-width: 175px; }
.date { font-size: 13px !important; line-height: 1.5; }
.status-badge { min-height: 32px; padding: 5px 8px; font-size: 12px !important; }
.status-badge small { font-size: 11px !important; }
.confirm-btn, .followup-btn, .link-btn, .history-btn, .details-btn, .ref-links-btn, .reject-reasons-btn, .wa-quick-btn { min-height: 40px; padding: 7px 10px; font-size: 12px !important; }
.action { width: 40px; height: 40px; font-size: 18px; }

/* Forms and overlays */
.modal-overlay { padding: 20px; }
.modal-content { max-height: calc(100vh - 122px); padding: 30px; }
.modal-content h3 { font-size: 24px !important; line-height: 1.35; }
.modal-content > p { font-size: 14px !important; line-height: 1.7; }
.form-section h4, .section-title { font-size: 16px !important; line-height: 1.5; }
.form-group label { font-size: 14px !important; line-height: 1.5; }
.form-group label small { font-size: 12px !important; }
.form-group input, .form-group select, .form-group textarea { min-height: 48px; padding-inline: 13px; font-size: 14px !important; line-height: 1.6; }
.form-group textarea { min-height: 115px; padding-block: 11px; }
.outline-btn { min-height: 42px; padding-inline: 12px; font-size: 13px !important; }
.remove-btn, .remove-link-btn { width: 40px; height: 40px; flex-basis: 40px; font-size: 20px; }
.checkbox-list { gap: 9px; padding: 12px; }
.custom-cb { min-height: 38px; }
.custom-cb input[type="checkbox"] { width: 18px !important; height: 18px; min-height: 18px !important; }
.custom-cb .cb-text { font-size: 13px !important; }
.toggle-label { font-size: 13px !important; }

/* Detail, history, upload and image controls */
.details-hero h3 { font-size: 25px !important; line-height: 1.35; }
.client-status, .links-count { font-size: 13px !important; }
.details-section h4 { font-size: 15px !important; }
.contact-card small, .finance-list small { font-size: 12px !important; }
.contact-card strong, .finance-list strong { font-size: 14px !important; }
.email-row, .fu-text { font-size: 14px !important; line-height: 1.7; }
.full-contact strong { font-size: 13px !important; }
.full-contact small, .mini-action { font-size: 12px !important; }
.detail-links strong { font-size: 13px !important; }
.detail-links small { font-size: 11px !important; }
.upload-btn { min-height: 44px; display: inline-flex; align-items: center; padding-inline: 12px; font-size: 13px !important; }
.remove-image-btn { width: 28px; height: 28px; font-size: 16px; }
.fu-btn { min-height: 38px; padding: 6px 10px; font-size: 12px !important; }
.viewer-close { width: 52px; height: 52px; }
.toast-message { max-width: min(420px, calc(100vw - 40px)); padding: 14px 18px; font-size: 14px !important; line-height: 1.6; }

.modal-close:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, .table-responsive:focus-visible { outline: 2px solid #79e6db; outline-offset: 2px; }

@media (max-width: 1050px) {
  .summary-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sync-status { grid-column: 1 / -1; justify-content: flex-start; }
  .form-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .primary-btn { width: 100%; }
  .summary-strip { grid-template-columns: 1fr 1fr; }
  .sync-status { grid-column: 1 / -1; }
  .card-heading { align-items: flex-start; flex-direction: column; padding: 20px 15px 17px; }
  .legend { width: 100%; gap: 8px 12px; }
  .plans-table th, .plans-table td { padding-right: 14px; padding-left: 14px; }
  .modal-overlay { inset: 70px 0 0; padding: 12px; }
  .modal-content { max-height: calc(100dvh - 82px); padding: 25px 18px 20px; border-radius: 16px; }
  .form-grid, .form-grid-3 { grid-template-columns: 1fr; gap: 0; }
  .form-group.toggle-group { flex-direction: column !important; align-items: flex-start; margin-top: 0; margin-bottom: 15px; }
  .dynamic-row, .contact-row, .link-input-group { align-items: stretch; flex-wrap: wrap; }
  .dynamic-row > input, .link-input-group input { flex: 1 1 70%; }
  .contact-row input, .contact-row select { flex: 1 1 42%; }
  .modal-actions, .detail-footer { flex-direction: column-reverse; }
  .modal-actions .primary-btn, .modal-actions .secondary-btn, .detail-footer .primary-btn, .detail-footer .secondary-btn { width: 100%; }
  .flex-upload-group { align-items: stretch; flex-direction: column; }
  .upload-btn { width: 100%; justify-content: center; }
  .details-grid, .detail-links { grid-template-columns: 1fr; }
  .details-hero h3 { font-size: 22px !important; }
}

@media (max-width: 390px) {
  .summary-strip { grid-template-columns: 1fr; }
  .sync-status { grid-column: auto; }
  .summary-strip > div { padding: 14px; }
  .plans-table th, .plans-table td { padding-inline: 12px; }
  .modal-content { padding-inline: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn, .secondary-btn, .action, .contact-card, .toast-enter-active, .toast-leave-active { transition: none !important; }
  .spinner { animation-duration: 1.5s; }
}
</style>