<template>
  <section class="plans-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة الإدارة / العملاء</span>
        <h2>إدارة خطط المحتوى</h2>
        <p>تابع مراحل العمل، دورات المراجعة، ومواعيد التسليم من مكان واحد.</p>
      </div>
      <button class="primary-btn" type="button" @click="openModal()"><span>＋</span> إضافة خطة جديدة</button>
    </div>

    <!-- الإحصائيات -->
    <div class="summary-strip">
      <div><span class="summary-icon teal">◈</span><div><small>إجمالي الخطط</small><strong>{{ plans.length }}</strong></div></div>
      <div><span class="summary-icon purple">◌</span><div><small>قيد المراجعة</small><strong>{{ underReviewCount }}</strong></div></div>
      <div><span class="summary-icon orange">◷</span><div><small>مرفوضة / متأخرة</small><strong>{{ delayedCount }}</strong></div></div>
      <div class="sync-status"><i></i> بيانات محدثة من مساحة العمل</div>
    </div>

    <div class="plans-card">
      <div class="card-heading">
        <div><h3>خطط العملاء <span>{{ plans.length }}</span></h3><p>حالة التسليم والمراجعة الحالية</p></div>
        <div class="legend">
          <span><i class="green-dot"></i> مكتملة</span>
          <span><i class="blue-dot"></i> جاهزة للتسليم</span>
          <span><i class="purple-dot"></i> قيد المراجعة</span>
          <span><i class="gray-dot"></i> قيد التنفيذ</span>
          <span><i class="orange-dot"></i> مرفوضة</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="plans-table">
          <thead>
            <tr>
              <th>العميل والخطة</th>
              <th>المسؤول</th>
              <th>التسليم النهائي</th>
              <th>المراجعة وحالة الخطة</th>
              <th>المراجع الداخلي</th>
              <th>القائم بالخطة</th>
              <th>السجل والملفات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" class="state-cell"><span class="spinner"></span> جارٍ تحميل الخطط...</td></tr>
            <tr v-else-if="plans.length === 0"><td colspan="8" class="state-cell">لا توجد خطط مسجلة حاليًا</td></tr>
            <tr v-for="plan in plans" v-else :key="plan.id">
              <td>
                <div class="plan-cell">
                  <div class="plan-avatar">{{ getInitials(plan.client?.name || '؟') }}</div>
                  <div><strong>{{ plan.client?.name || 'عميل محذوف' }}</strong><span>{{ plan.plan_type }}</span></div>
                </div>
              </td>
              
              <td><span class="people-cell">{{ getRoleNames(plan.users, 'responsible') }}</span></td>
              
              <!-- التسليم النهائي -->
              <td>
                <div class="milestone">
                  <span class="date">{{ formatDate(plan.planned_delivery_date) }}</span>
                  <div v-if="plan.status === 'completed'" class="status-badge" style="color:#78e4d8; background:rgba(90,220,207,.1);">
                    <i style="background:#70e1d5;"></i> تم التسليم <small>{{ formatDate(plan.actual_delivery_date) }}</small>
                  </div>
                  <!-- يظهر زر التسليم النهائي لو كانت الخطة تمت مراجعتها، أو لو لا تتطلب مراجعة وهي لسه قيد التنفيذ أو الرفض -->
                  <button v-else-if="plan.status === 'reviewed' || (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected'))" class="confirm-btn" type="button" :disabled="actionLoading === `delivery-${plan.id}`" @click="submitFinalDelivery(plan.id)">
                    {{ actionLoading === `delivery-${plan.id}` ? 'جارٍ...' : 'تأكيد التسليم النهائي' }}
                  </button>
                  <span v-else class="muted">بانتظار دورة المراجعة</span>
                </div>
              </td>
              
              <!-- المراجعة وحالة الخطة -->
              <td>
                <div class="milestone" style="min-width: 165px;">
                  <span v-if="plan.requires_review" class="date">{{ formatDate(plan.planned_review_date) }}</span>
                  <span v-else class="muted mb-1" style="display:block;">— لا تتطلب مراجعة —</span>
                  
                  <!-- زر إرسال للمراجعة (لو الخطة محتاجة مراجعة ولسه ماترسلتش أو اترفضت) -->
                  <div v-if="plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')" class="mt-1 mb-1">
                    <button class="confirm-btn review" type="button" :disabled="actionLoading === `submit-review-${plan.id}`" @click="submitForReview(plan.id)">
                      {{ actionLoading === `submit-review-${plan.id}` ? 'جارٍ...' : 'إرسال للمراجعة الداخلية' }}
                    </button>
                  </div>
                  
                  <!-- أزرار قبول ورفض المراجع -->
                  <div v-if="plan.status === 'under_review'" class="review-actions mt-1 mb-1">
                    <button class="confirm-btn accept-btn" :disabled="actionLoading === `approve-${plan.id}`" @click="approvePlan(plan.id)">قبول ✅</button>
                    <button class="confirm-btn reject-btn" :disabled="actionLoading === `reject-${plan.id}`" @click="openRejectModal(plan)">رفض ❌</button>
                  </div>

                  <!-- حالة الخطة (تظهر دايما) -->
                  <div :class="['status-badge', getPlanStatusInfo(plan.status).class]">
                    <i></i>{{ getPlanStatusInfo(plan.status).text }}
                    <small v-if="plan.requires_review && (plan.status === 'reviewed' || plan.status === 'completed')">{{ formatDate(plan.actual_review_date) }}</small>
                  </div>
                </div>
              </td>
              
              <td>
                <span v-if="plan.requires_review" class="people-cell">{{ getRoleNames(plan.users, 'reviewer') }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td><span class="people-cell">{{ getRoleNames(plan.users, 'executor') }}</span></td>
              
              <td>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <a v-if="plan.final_link" :href="plan.final_link" target="_blank" rel="noopener" class="link-btn">فتح البلان ↗</a>
                  <button v-if="plan.review_histories && plan.review_histories.length" @click="openHistoryModal(plan)" class="history-btn">سجل المراجعات 📋</button>
                  <span v-if="!plan.final_link && (!plan.review_histories || !plan.review_histories.length)" class="muted">لا توجد داتا</span>
                </div>
              </td>
              
              <td>
                <div class="actions-cell">
                  <button class="action edit" type="button" title="تعديل" @click="openModal(plan)">✎</button>
                  <button class="action delete" type="button" title="حذف" @click="deletePlan(plan.id)">⌫</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal إنشاء وتعديل الخطة -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" aria-label="إغلاق" @click="closeModal">×</button>
        <div class="modal-icon">◈</div><span class="eyebrow">مساحة التخطيط</span>
        <h3 id="modal-title">{{ isEditing ? 'تعديل الخطة' : 'إنشاء خطة جديدة' }}</h3>
        <p>أدخل تفاصيل الخطة ووزّع المهام على أعضاء الفريق.</p>
        
        <form class="plan-form" @submit.prevent="savePlan">
          <div class="form-grid">
            <div class="form-group">
              <label>العميل المستهدف</label>
              <select v-model="form.client_id" required>
                <option value="" disabled>اختر العميل...</option>
                <option v-for="client in allClients" :key="client.id" :value="client.id">{{ client.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>نوع الخطة</label>
              <select v-model="form.plan_type" required>
                <option value="" disabled>اختر نوع الخطة...</option>
                <option value="استراتيجية (Strategic)">استراتيجية (Strategic)</option>
                <option value="محتوى (Content)">محتوى (Content)</option>
                <option value="تسويق عبر السوشيال ميديا">تسويق عبر السوشيال ميديا</option>
                <option value="إعلانات ممولة (Media Buying)">إعلانات ممولة (Media Buying)</option>
                <option value="تحسين محركات البحث (SEO)">تحسين محركات البحث (SEO)</option>
                <option value="خطة شاملة">خطة شاملة</option>
              </select>
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label>موعد التسليم النهائي</label>
              <input v-model="form.planned_delivery_date" type="datetime-local" required />
            </div>
            <div class="form-group toggle-group">
              <label>هل تتطلب مراجعة داخلية؟</label>
              <label class="toggle-switch">
                <input type="checkbox" v-model="form.requires_review">
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{{ form.requires_review ? 'نعم، تتطلب' : 'لا تتطلب' }}</span>
            </div>
          </div>

          <div class="form-grid" v-if="form.requires_review">
            <div class="form-group">
              <label>موعد إنهاء المراجعة</label>
              <input v-model="form.planned_review_date" type="datetime-local" required />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group"><label>رابط البلان <small>اختياري</small></label><input v-model="form.final_link" type="url" placeholder="https://..." /></div>
            <div class="form-group"><label>ملاحظات <small>اختياري</small></label><input v-model="form.notes" type="text" placeholder="أي ملاحظات إضافية..." /></div>
          </div>
          
          <div class="separator"></div><div class="section-title"><span>⌁</span> توزيع المهام</div>
          <p class="helper-text">اختر الموظفين المسئولين عن كل دور (يمكنك اختيار أكثر من موظف).</p>
          
          <div class="form-grid-3 users-grid">
            <div class="form-group">
              <label>المسؤول</label>
              <div class="checkbox-list">
                <label v-for="user in allUsers" :key="'resp_'+user.id" class="custom-cb">
                  <input type="checkbox" :value="user.id" v-model="form.responsible_ids" />
                  <span class="cb-text">{{ user.name }}</span>
                </label>
              </div>
            </div>

            <div class="form-group" v-if="form.requires_review">
              <label>المراجع الداخلي</label>
              <div class="checkbox-list">
                <label v-for="user in allUsers" :key="'rev_'+user.id" class="custom-cb">
                  <input type="checkbox" :value="user.id" v-model="form.reviewer_ids" />
                  <span class="cb-text">{{ user.name }}</span>
                </label>
              </div>
            </div>
            
            <div class="form-group" :style="form.requires_review ? '' : 'grid-column: span 2;'">
              <label>المنفذ</label>
              <div class="checkbox-list" :style="form.requires_review ? '' : 'display:grid; grid-template-columns:1fr 1fr;'">
                <label v-for="user in allUsers" :key="'exec_'+user.id" class="custom-cb">
                  <input type="checkbox" :value="user.id" v-model="form.executor_ids" />
                  <span class="cb-text">{{ user.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions"><button type="button" class="secondary-btn" @click="closeModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ الخطة' }}</button></div>
        </form>
      </div>
    </div>

    <!-- Modal رفض الخطة -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-content reject-modal" role="dialog">
        <button class="modal-close" type="button" @click="closeRejectModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b);">❌</div>
        <span class="eyebrow" style="color: #ff9bad;">إجراء مراجعة</span>
        <h3 style="color: #ff9bad;">رفض الخطة وطلب تعديل</h3>
        <p>يرجى كتابة أسباب الرفض والملاحظات المطلوبة ليتمكن المسئول من تعديلها.</p>
        <form class="plan-form" @submit.prevent="submitRejectPlan">
          <div class="form-group">
            <label>ملاحظات الرفض (إجبارية)</label>
            <textarea v-model="rejectNotes" rows="5" required placeholder="مثال: التصميم يحتاج تعديل في الألوان، يرجى مراجعة العميل..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="closeRejectModal">إلغاء</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #ff8fa4, #ff678b);" :disabled="actionLoading.startsWith('reject-')">تأكيد الرفض والإرسال</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal سجل المراجعات (History) -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal-content history-modal">
        <button class="modal-close" type="button" @click="closeHistoryModal">×</button>
        <div class="modal-icon">📋</div>
        <h3>سجل المراجعات</h3>
        <p>تاريخ دورة المراجعة للعميل: <strong>{{ selectedHistoryPlan?.client?.name }}</strong></p>
        
        <div class="history-timeline">
          <div v-for="(history, index) in selectedHistoryPlan.review_histories" :key="index" class="timeline-item">
            <div class="tl-dot" :class="history.action === 'approved' ? 'tl-green' : 'tl-red'"></div>
            <div class="tl-content">
              <div class="tl-header">
                <strong>{{ history.reviewer?.name || 'مجهول' }}</strong>
                <span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span>
              </div>
              <div class="tl-action" :class="history.action === 'approved' ? 'text-green' : 'text-red'">
                {{ history.action === 'approved' ? '✅ وافق على الخطة' : '❌ رفض الخطة وطلب تعديلات' }}
              </div>
              <div class="tl-notes" v-if="history.notes">
                {{ history.notes }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions mt-3">
          <button type="button" class="secondary-btn" @click="closeHistoryModal">إغلاق</button>
        </div>
      </div>
    </div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../axios';

const plans = ref([]); 
const allUsers = ref([]); 
const allClients = ref([]); 
const loading = ref(true); 
const saving = ref(false); 
const showModal = ref(false); 
const isEditing = ref(false); 
const editId = ref(null); 
const actionLoading = ref('');
const toastMessage = ref('');

// متغيرات الـ Reject والـ History
const showRejectModal = ref(false);
const rejectPlanId = ref(null);
const rejectNotes = ref('');
const showHistoryModal = ref(false);
const selectedHistoryPlan = ref(null);

const form = reactive({ 
  client_id: '', plan_type: '', requires_review: true, 
  planned_delivery_date: '', planned_review_date: '', 
  final_link: '', notes: '', 
  responsible_ids: [], reviewer_ids: [], executor_ids: [] 
});

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const getRoleNames = (users = [], role) => { const matches = users.filter(user => user.pivot?.task_role === role); return matches.length ? matches.map(user => user.name).join('، ') : '—'; };
const formatDate = (value) => value ? new Date(value).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const toDatetimeLocal = (value) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 3200); };

// تحديد الألوان والنصوص بناءً على حالة الخطة
const getPlanStatusInfo = (status) => {
  switch(status) {
    case 'completed': return { text: 'مكتملة ومُعتمدة', class: 'status-green' };
    case 'reviewed': return { text: 'جاهزة للتسليم النهائي', class: 'status-blue' };
    case 'under_review': return { text: 'قيد المراجعة', class: 'status-purple' };
    case 'rejected': return { text: 'مرفوضة (تتطلب تعديل)', class: 'status-red' };
    case 'pending': default: return { text: 'قيد التنفيذ', class: 'status-gray' };
  }
};

const underReviewCount = computed(() => plans.value.filter(plan => plan.status === 'under_review').length);
const delayedCount = computed(() => plans.value.filter(plan => plan.status === 'rejected' || (plan.status === 'pending' && new Date() > new Date(plan.planned_delivery_date))).length);

const fetchPlans = async () => { loading.value = true; try { const response = await api.get('/content-plans'); plans.value = response.data.data || response.data || []; } catch (error) { showToast('تعذر تحميل الخطط'); } finally { loading.value = false; } };
const fetchUsers = async () => { try { const response = await api.get('/users?per_page=100'); allUsers.value = response.data.data || []; } catch (error) {} };
const fetchClients = async () => { try { const response = await api.get('/clients?per_page=100'); allClients.value = response.data.data || []; } catch (error) {} };
const refreshPlans = async () => { await fetchPlans(); };

const resetForm = () => Object.assign(form, { client_id: '', plan_type: '', requires_review: true, planned_delivery_date: '', planned_review_date: '', final_link: '', notes: '', responsible_ids: [], reviewer_ids: [], executor_ids: [] });

const openModal = (plan = null) => { 
  isEditing.value = Boolean(plan); 
  editId.value = plan?.id || null; 
  if (plan) {
    Object.assign(form, { 
      client_id: plan.client_id, 
      plan_type: plan.plan_type, 
      requires_review: Boolean(plan.requires_review),
      planned_delivery_date: toDatetimeLocal(plan.planned_delivery_date), 
      planned_review_date: toDatetimeLocal(plan.planned_review_date), 
      final_link: plan.final_link || '', 
      notes: plan.notes || '', 
      responsible_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'responsible').map(user => user.id), 
      reviewer_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'reviewer').map(user => user.id), 
      executor_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'executor').map(user => user.id) 
    }); 
  } else {
    resetForm(); 
  }
  showModal.value = true; 
};
const closeModal = () => { showModal.value = false; };

const savePlan = async () => { 
  saving.value = true; 
  if (!form.requires_review) { form.planned_review_date = ''; form.reviewer_ids = []; }
  try { 
    if (isEditing.value) await api.put(`/content-plans/${editId.value}`, form); 
    else await api.post('/content-plans', form); 
    closeModal(); 
    showToast(isEditing.value ? 'تم تحديث الخطة بنجاح' : 'تم إنشاء الخطة بنجاح'); 
    await fetchPlans(); 
  } catch (error) { showToast('حدث خطأ أثناء الحفظ'); } finally { saving.value = false; } 
};
const deletePlan = async (id) => { if (!window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) return; try { await api.delete(`/content-plans/${id}`); showToast('تم حذف الخطة بنجاح'); await fetchPlans(); } catch (error) { showToast('حدث خطأ أثناء الحذف'); } };

// الأفعال (Actions)
const submitForReview = async (id) => {
  if (!window.confirm('إرسال الخطة للمراجعة الداخلية؟')) return;
  actionLoading.value = `submit-review-${id}`;
  try {
    await api.post(`/content-plans/${id}/submit-review`);
    showToast('تم إرسال الخطة للمراجعة');
    await refreshPlans();
  } catch (error) { showToast('حدث خطأ أثناء الإرسال'); } finally { actionLoading.value = ''; }
};

const submitFinalDelivery = async (id) => {
  if (!window.confirm('تأكيد التسليم النهائي للعميل؟')) return;
  actionLoading.value = `delivery-${id}`;
  try {
    await api.post(`/content-plans/${id}/final-delivery`);
    showToast('تم التسليم النهائي بنجاح');
    await refreshPlans();
  } catch (error) { showToast('حدث خطأ أثناء التسليم'); } finally { actionLoading.value = ''; }
};

const approvePlan = async (id) => {
  if (!window.confirm('تأكيد الموافقة على الخطة لتصبح جاهزة للتسليم النهائي؟')) return;
  actionLoading.value = `approve-${id}`;
  try {
    await api.post(`/content-plans/${id}/approve`);
    showToast('تم اعتماد الخطة وهي جاهزة للتسليم');
    await refreshPlans();
  } catch (error) { showToast('حدث خطأ أثناء الاعتماد'); } finally { actionLoading.value = ''; }
};

const openRejectModal = (plan) => { rejectPlanId.value = plan.id; rejectNotes.value = ''; showRejectModal.value = true; };
const closeRejectModal = () => { showRejectModal.value = false; rejectPlanId.value = null; };
const submitRejectPlan = async () => {
  actionLoading.value = `reject-${rejectPlanId.value}`;
  try {
    await api.post(`/content-plans/${rejectPlanId.value}/reject`, { notes: rejectNotes.value });
    showToast('تم رفض الخطة وإرسال الملاحظات');
    closeRejectModal();
    await refreshPlans();
  } catch (error) { showToast('حدث خطأ أثناء الرفض'); } finally { actionLoading.value = ''; }
};

// إدارة الـ History
const openHistoryModal = (plan) => { selectedHistoryPlan.value = plan; showHistoryModal.value = true; };
const closeHistoryModal = () => { showHistoryModal.value = false; selectedHistoryPlan.value = null; };

onMounted(() => { fetchPlans(); fetchUsers(); fetchClients(); });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing:border-box; } :global(body) { margin:0; font-family:'Cairo',sans-serif; }.plans-page { min-height:100%; color:#edf0ff; font-family:'Cairo',sans-serif; }.page-topline { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }.eyebrow { color:#76e8de; font-size:10px; font-weight:700; letter-spacing:.7px; }.page-topline h2 { margin:7px 0 3px; font-size:28px; }.page-topline p { margin:0; color:#818cb9; font-size:12px; }.primary-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:43px; padding:0 17px; border:0; border-radius:11px; color:#12183f; background:linear-gradient(110deg,#7de8dc,#b28aff); font:inherit; font-size:11px; font-weight:800; cursor:pointer; box-shadow:0 9px 22px rgba(111,222,211,.13); transition:.2s; }.primary-btn span { font-size:20px; line-height:0; }.primary-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.06); }.primary-btn:disabled { opacity:.6; cursor:wait; }
.summary-strip { display:grid; grid-template-columns:repeat(3,1fr) 1.7fr; gap:1px; overflow:hidden; margin-bottom:18px; border:1px solid rgba(137,153,226,.13); border-radius:15px; background:rgba(137,153,226,.13); }.summary-strip > div { display:flex; align-items:center; gap:10px; padding:13px 17px; background:rgba(21,29,73,.68); }.summary-icon { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; font-size:16px; }.teal { color:#7de8dc; background:rgba(93,222,209,.12); }.purple { color:#c994ff; background:rgba(180,112,255,.12); }.orange { color:#ffc480; background:rgba(255,186,86,.12); }.summary-strip small,.summary-strip strong { display:block; }.summary-strip small { color:#7c87b5; font-size:9px; }.summary-strip strong { color:#eef0ff; font-size:20px; }.sync-status { justify-content:center; color:#7480ae; font-size:9px; }.sync-status i { width:6px; height:6px; border-radius:50%; background:#72e5d9; box-shadow:0 0 8px #72e5d9; }
.plans-card { overflow:hidden; border:1px solid rgba(137,153,226,.13); border-radius:18px; background:rgba(15,22,61,.65); }.card-heading { display:flex; align-items:center; justify-content:space-between; padding:20px 23px 17px; }.card-heading h3 { margin:0; font-size:15px; }.card-heading h3 span { margin-right:6px; padding:2px 7px; border-radius:7px; color:#7de8dc; background:rgba(89,220,207,.11); font-size:9px; }.card-heading p { margin:4px 0 0; color:#6e79a9; font-size:10px; }.legend { display:flex; gap:14px; color:#7e89b5; font-size:9px; }.legend i { display:inline-block; width:6px; height:6px; margin-left:4px; border-radius:50%; }.green-dot { background:#71e1d5; }.blue-dot { background:#65b5ff; }.purple-dot { background:#c994ff; }.orange-dot { background:#ffbd73; }.gray-dot { background:#97a5d0; }.table-responsive { overflow-x:auto; }.plans-table { width:100%; min-width:1180px; border-collapse:collapse; text-align:right; }.plans-table th,.plans-table td { padding:13px 18px; border-top:1px solid rgba(138,152,222,.09); vertical-align:middle; }.plans-table th { color:#6874a6; background:rgba(10,16,47,.35); font-size:9px; font-weight:600; }.plans-table td { color:#d9ddf5; font-size:10px; }.plan-cell { display:flex; align-items:center; gap:9px; }.plan-avatar { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; color:#252058; background:linear-gradient(145deg,#80e8df,#ac84fa); font-size:9px; font-weight:800; }.plan-cell strong,.plan-cell span { display:block; }.plan-cell strong { font-size:10px; }.plan-cell span,.people-cell,.muted { color:#7782b0; font-size:9px; }.milestone { min-width:145px; }.date { display:block; color:#aeb6d7; direction:ltr; text-align:right; font-size:9px; }.status-badge { display:inline-flex; align-items:center; gap:5px; margin-top:5px; padding:4px 6px; border-radius:6px; font-size:8px; }.status-badge i { width:5px; height:5px; border-radius:50%; }.status-badge small { display:block; margin-right:4px; color:#7782b0; font-size:8px; }

/* ألوان الحالات الجديدة */
.status-green { color:#78e4d8; background:rgba(90,220,207,.1); } .status-green i { background:#70e1d5; }
.status-blue { color:#8fc9ff; background:rgba(101,181,255,.1); } .status-blue i { background:#65b5ff; }
.status-purple { color:#c491ff; background:rgba(180,112,255,.12); } .status-purple i { background:#b470ff; }
.status-red { color:#ff9bad; background:rgba(255,103,139,.1); } .status-red i { background:#ff8fa4; }
.status-gray { color:#aab5da; background:rgba(133,149,218,.1); } .status-gray i { background:#97a5d0; }

.link-btn, .history-btn { display:inline-block; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:9px; cursor:pointer; text-align:center; border:none; font-family:inherit; }
.link-btn { color:#78e5da; background:rgba(90,220,207,.08); } .link-btn:hover { background:rgba(90,220,207,.15); }
.history-btn { color:#c491ff; background:rgba(180,112,255,.08); } .history-btn:hover { background:rgba(180,112,255,.15); }

.review-actions { display:flex; gap:6px; } 
.accept-btn { color:#78e4d8 !important; border-color:rgba(120,228,216,.3) !important; background:rgba(90,220,207,.08) !important; } 
.reject-btn { color:#ff9bad !important; border-color:rgba(255,155,173,.3) !important; background:rgba(255,103,139,.08) !important; }

.actions-cell { display:flex; gap:6px; }.action { width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; cursor:pointer; font-size:14px; }.action.edit { color:#78e4da; background:rgba(92,220,208,.08); }.action.delete { color:#ff94ab; background:rgba(255,103,139,.08); }.action:hover { filter:brightness(1.3); transform:translateY(-1px); }.state-cell { height:145px; color:#7d89b6 !important; text-align:center !important; }.spinner { display:inline-block; width:15px; height:15px; margin-left:7px; vertical-align:middle; border:2px solid rgba(125,232,220,.25); border-top-color:#7de8dc; border-radius:50%; animation:spin .7s linear infinite; }
.modal-overlay { position:fixed; inset:82px 0 0; z-index:100; display:grid; place-items:start center; padding:18px; overflow-y:auto; background:rgba(4,7,27,.78); backdrop-filter:blur(7px); }.modal-content { width:min(780px,100%); max-height:calc(100vh - 118px); overflow-y:auto; position:relative; padding:28px; border:1px solid rgba(146,160,233,.2); border-radius:20px; background:linear-gradient(145deg,#171d52,#0d143a); box-shadow:0 25px 70px rgba(0,0,0,.4); }.modal-close { position:absolute; top:12px; left:16px; border:0; color:#8994c2; background:transparent; font-size:25px; cursor:pointer; }.modal-icon { width:42px; height:42px; display:grid; place-items:center; margin-bottom:12px; border-radius:12px; color:#202057; background:linear-gradient(145deg,#80e8df,#b486fb); font-size:21px; }.modal-content h3 { margin:7px 0 2px; font-size:21px; }.modal-content > p { margin:0; color:#818cb9; font-size:11px; }.plan-form { margin-top:23px; }.form-grid,.form-grid-3 { display:grid; gap:13px; margin-bottom:14px; }.form-grid { grid-template-columns:1fr 1fr; }.form-grid-3 { grid-template-columns:repeat(3,1fr); }.form-group { min-width:0; margin-bottom:13px; }.form-group label { display:block; margin-bottom:6px; color:#b8c0e2; font-size:10px; }.form-group label small { color:#6975a7; font-size:8px; }.form-group input,.form-group select, .form-group textarea { width:100%; min-height:42px; padding:0 11px; border:1px solid rgba(145,160,230,.2); border-radius:9px; outline:0; color:#eef0ff; background:rgba(6,11,37,.46); font:inherit; font-size:10px; }.form-group textarea { padding-top: 10px; resize: vertical; }.form-group input:focus,.form-group select:focus, .form-group textarea:focus { border-color:#76e8de; box-shadow:0 0 0 3px rgba(118,232,222,.08); }.form-group input::placeholder, .form-group textarea::placeholder { color:#626e9e; }.separator { height:1px; margin:20px 0 15px; border:0; background:rgba(143,157,226,.14); }.section-title { color:#b986ff; font-size:11px; font-weight:700; }.section-title span { color:#76e8de; margin-left:4px; }.helper-text { margin:3px 0 13px; color:#6f7baa; font-size:9px; }.modal-actions { display:flex; justify-content:flex-start; gap:9px; margin-top:18px; }.secondary-btn { min-height:43px; padding:0 18px; border:1px solid rgba(143,157,226,.2); border-radius:10px; color:#aab4dc; background:transparent; font:inherit; font-size:11px; cursor:pointer; }
.confirm-btn { margin-top:5px; padding:5px 7px; border:1px solid rgba(117,231,218,.2); border-radius:6px; color:#78e4d8; background:rgba(90,220,207,.08); font:inherit; font-size:8px; cursor:pointer; }.confirm-btn.review { color:#c491ff; border-color:rgba(190,130,255,.22); background:rgba(180,112,255,.08); }.confirm-btn:hover:not(:disabled) { filter:brightness(1.3); }.confirm-btn:disabled { opacity:.5; cursor:wait; }

/* Toggle Switch CSS */
.toggle-group { display:flex; align-items:center; gap:10px; flex-direction:row !important; margin-top:15px; }
.toggle-group label:first-child { margin-bottom:0; flex-grow:1; }
.toggle-switch { position:relative; display:inline-block; width:44px; height:24px; }
.toggle-switch input { opacity:0; width:0; height:0; }
.slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:rgba(145,160,230,.2); transition:.4s; border-radius:34px; }
.slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background-color:#7d89b6; transition:.4s; border-radius:50%; }
input:checked + .slider { background-color:rgba(125,232,220,.25); }
input:checked + .slider:before { transform:translateX(20px); background-color:#7de8dc; }
.toggle-label { font-size:10px; color:#aeb6d7; min-width:55px; }

/* Checkbox lists */
.checkbox-list { display:flex; flex-direction:column; gap:8px; padding:10px; border:1px solid rgba(145,160,230,.15); border-radius:9px; background:rgba(6,11,37,.25); max-height:150px; overflow-y:auto; }
.custom-cb { display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:0 !important; }
.custom-cb input[type="checkbox"] { width:14px !important; min-height:14px !important; margin:0; accent-color:#76e8de; }
.custom-cb .cb-text { color:#d9ddf5; font-size:11px; }

/* History & Reject Modals */
.history-modal, .reject-modal { width:min(500px, 100%) !important; }
.history-timeline { margin-top:20px; padding-right:10px; border-right:2px solid rgba(145,160,230,.15); display:flex; flex-direction:column; gap:20px; }
.timeline-item { position:relative; }
.tl-dot { position:absolute; right:-15px; top:3px; width:10px; height:10px; border-radius:50%; border:2px solid #171d52; }
.tl-green { background:#78e4d8; } .tl-red { background:#ff9bad; }
.tl-content { background:rgba(6,11,37,.4); padding:12px; border-radius:8px; border:1px solid rgba(145,160,230,.1); }
.tl-header { display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#d9ddf5; }
.tl-date { color:#7782b0; font-size:9px; }
.tl-action { font-size:10px; font-weight:700; margin-bottom:5px; }
.text-green { color:#78e4d8; } .text-red { color:#ff9bad; }
.tl-notes { background:rgba(0,0,0,.2); padding:8px; border-radius:6px; font-size:10px; color:#aab5da; font-style:italic; }
.mt-3 { margin-top:20px; }

.toast-message { position:fixed; left:25px; bottom:25px; z-index:200; padding:12px 17px; border:1px solid rgba(116,232,220,.22); border-radius:10px; color:#bdf7f0; background:#182552; box-shadow:0 12px 30px rgba(0,0,0,.25); font-size:11px; }.toast-enter-active,.toast-leave-active { transition:.25s; }.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(10px); } @keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:720px) { .page-topline { align-items:flex-start; flex-direction:column; }.page-topline h2 { font-size:24px; }.primary-btn { width:100%; }.summary-strip { grid-template-columns:1fr 1fr; }.sync-status { grid-column:1 / -1; }.card-heading { padding-right:15px; padding-left:15px; }.legend { display:none; }.plans-table th,.plans-table td { padding-right:14px; padding-left:14px; }.modal-overlay { inset:70px 0 0; padding:12px; }.modal-content { max-height:calc(100vh - 82px); padding:23px 18px; }.form-grid,.form-grid-3 { grid-template-columns:1fr; gap:0; }.form-group.toggle-group { flex-direction:column !important; align-items:flex-start; margin-top:0; margin-bottom:15px; } .modal-actions { margin-top:5px; } }
</style>