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
        <!-- إضافة منشور جديد متاحة للجميع ما عدا المراجع -->
        <button class="primary-btn" type="button" @click="showAddRowModal = true" :disabled="!canAddRow">
          <span>＋</span> منشور إضافي
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تحميل اللوحة...
    </div>

    <div v-else class="spreadsheet-container">
      <table class="spreadsheet-table">
        <thead>
          <tr>
            <th colspan="5" class="group-header admin-group">الإدارة والتكليف والمراجعة</th>
            <th colspan="4" class="group-header red-group">حالة المنشور</th>
            <th colspan="2" class="group-header dark-red-group">موقف التمويل</th>
            <th colspan="8" class="group-header blue-group">محتوى المنشور</th>
            <th colspan="1" class="group-header light-blue-group">التسليم</th>
            <th colspan="1" class="group-header pink-group">ملاحظات</th>
          </tr>
          <tr>
            <th class="sub-th admin-th">المنفذ</th>
            <th class="sub-th admin-th">الديدلاين</th>
            <th class="sub-th admin-th">المراجع</th>
            <th class="sub-th admin-th">مراجعة القسم</th>
            <th class="sub-th admin-th" style="background: #cfd8dc;">اعتماد المدير</th>

            <th class="sub-th red-th">تاريخ النشر المخطط</th>
            <th class="sub-th red-th">النشر الفعلي</th>
            <th class="sub-th red-th">توقيت النشر</th>
            <th class="sub-th red-th">منصة النشر</th>

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

            <th class="sub-th light-blue-th">روابط المحتوى</th>
            <th class="sub-th pink-th">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="posts.length === 0">
            <td colspan="21" class="text-center py-4 muted">لا توجد منشورات. قم بإضافة منشور جديد.</td>
          </tr>
          <tr v-for="post in posts" :key="post.id" class="post-row">
            
            <!-- 1. الإدارة والتكليف -->
            <td>
              <select v-model="post.designer_id" @change="autoSave(post, 'designer_id')" :disabled="!canEditField(post, 'designer_id')">
                <option :value="null">لم يحدد</option>
                <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
            </td>
            <td>
              <input type="datetime-local" v-model="post.deadline" @blur="autoSave(post, 'deadline')" :disabled="!canEditField(post, 'deadline')" />
            </td>
            <td>
              <select v-model="post.reviewer_id" @change="autoSave(post, 'reviewer_id')" :disabled="!canEditField(post, 'reviewer_id')">
                <option :value="null">لم يحدد</option>
                <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
            </td>
            
            <!-- مراجعة القسم -->
            <td class="review-cell">
              <span v-if="post.review_status === 'معتمد'" class="badge approved">🟢 معتمد</span>
              
              <div v-else-if="currentUser?.id === post.reviewer_id || isManager" class="review-actions">
                <button class="approve-btn" @click="approvePost(post, 'reviewer')" title="موافقة">✅ موافقة</button>
                <button class="reject-btn" @click="openRejectModal(post, 'reviewer')" title="رفض">❌ رفض</button>
              </div>
              
              <span v-else class="badge pending">
                {{ post.review_status === 'مرفوض' ? '🔴 مرفوض' : '⏳ قيد الانتظار' }}
              </span>

              <button v-if="post.rejection_history && post.rejection_history.length > 0" 
                      class="history-btn" @click="openHistoryModal(post.rejection_history, 'القسم')">
                📜 سجل الرفض
              </button>
            </td>

            <!-- مراجعة المدير -->
            <td class="review-cell" style="background: #eceff1;">
              <span v-if="post.manager_review_status === 'معتمد'" class="badge approved">🟢 معتمد</span>
              
              <div v-else-if="isManager" class="review-actions">
                <button class="approve-btn" @click="approvePost(post, 'manager')" title="اعتماد نهائي">✅ اعتماد</button>
                <button class="reject-btn" @click="openRejectModal(post, 'manager')" title="رفض">❌ رفض</button>
              </div>
              
              <span v-else class="badge pending">
                {{ post.manager_review_status === 'مرفوض' ? '🔴 مرفوض' : '⏳ قيد الانتظار' }}
              </span>

              <button v-if="post.manager_rejection_history && post.manager_rejection_history.length > 0" 
                      class="history-btn" @click="openHistoryModal(post.manager_rejection_history, 'المدير')">
                📜 سجل الرفض
              </button>
            </td>

            <!-- 2. حالة المنشور -->
            <td class="readonly-cell">
              <strong>{{ getDayName(post.target_date) }}</strong>
              <small>{{ formatDate(post.target_date) }}</small>
            </td>
            <td>
              <select v-model="post.actual_publish_status" @change="handlePublishStatusChange(post)" :class="post.actual_publish_status === 'لم يتم' ? 'text-red' : 'text-green'" :disabled="!canEditField(post, 'actual_publish_status')">
                <option value="لم يتم">لم يتم</option>
                <option value="تم النشر">تم النشر</option>
              </select>
            </td>
            <td><input type="text" v-model="post.publishing_time" @blur="autoSave(post, 'publishing_time')" placeholder="--:--" dir="ltr" :disabled="!canEditField(post, 'publishing_time')" /></td>
            <td>
              <select v-model="post.publishing_platform" @change="autoSave(post, 'publishing_platform')" :disabled="!canEditField(post, 'publishing_platform')">
                <option value="">اختيار...</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter/X">Twitter/X</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
              </select>
            </td>

            <!-- 3. التمويل -->
            <td>
               <select multiple v-model="post.ad_platform" @change="autoSave(post, 'ad_platform')" class="multi-select" title="اضغط Ctrl أو Cmd لاختيار أكثر من منصة" :disabled="!canEditField(post, 'ad_platform')">
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Snapchat Ads">Snapchat Ads</option>
                <option value="TikTok Ads">TikTok Ads</option>
              </select>
            </td>
            <td>
              <select v-model="post.finance_status" @change="autoSave(post, 'finance_status')" :disabled="!canEditField(post, 'finance_status')">
                <option value="غير ممول">غير ممول</option>
                <option value="ممول">ممول</option>
              </select>
            </td>

            <!-- 4. محتوى المنشور -->
            <td>
              <select v-model="post.post_type" @change="autoSave(post, 'post_type')" :disabled="!canEditField(post, 'post_type')">
                <option value="">اختيار...</option>
                <option value="Infograph">Infograph</option>
                <option value="Video">Video</option>
                <option value="Reel/Shorts">Reel / Shorts</option>
                <option value="Text Only">Text Only</option>
                <option value="Carousel">Carousel</option>
              </select>
            </td>
            <td><input type="text" v-model="post.objective" @blur="autoSave(post, 'objective')" placeholder="..." :disabled="!canEditField(post, 'objective')" /></td>
            <td><textarea v-model="post.detailed_idea" @blur="autoSave(post, 'detailed_idea')" rows="1" :disabled="!canEditField(post, 'detailed_idea')"></textarea></td>
            <td><textarea v-model="post.caption" @blur="autoSave(post, 'caption')" rows="1" :disabled="!canEditField(post, 'caption')"></textarea></td>
            <td><input type="text" v-model="post.tov" @blur="autoSave(post, 'tov')" placeholder="..." :disabled="!canEditField(post, 'tov')" /></td>
            <td><input type="text" v-model="post.call_to_action" @blur="autoSave(post, 'call_to_action')" placeholder="..." :disabled="!canEditField(post, 'call_to_action')" /></td>
            <td><input type="text" v-model="post.hashtags" @blur="autoSave(post, 'hashtags')" placeholder="#..." :disabled="!canEditField(post, 'hashtags')" /></td>
            <td><input type="url" v-model="post.reference_link" @blur="autoSave(post, 'reference_link')" placeholder="Link..." dir="ltr" :disabled="!canEditField(post, 'reference_link')" /></td>

            <!-- 5. الروابط النهائية والملاحظات -->
            <td><input type="text" v-model="post.content_links" @blur="autoSave(post, 'content_links')" placeholder="Drive/Notion link..." dir="ltr" :disabled="!canEditField(post, 'content_links')" /></td>
            <td><input type="text" v-model="post.notes" @blur="autoSave(post, 'notes')" placeholder="..." :disabled="!canEditField(post, 'notes')" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal إضافة صف -->
    <div v-if="showAddRowModal" class="modal-overlay" @click.self="showAddRowModal = false">
      <div class="modal-content" style="width: min(400px, 100%)">
        <h3>إضافة منشور إضافي</h3>
        <p>حدد تاريخ اليوم الذي تريد إضافة صف جديد فيه.</p>
        <form @submit.prevent="addNewRow">
          <div class="form-group mt-3">
            <label>تاريخ المنشور</label>
            <input type="date" v-model="newRowDate" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="secondary-btn" @click="showAddRowModal = false">إلغاء</button>
            <button type="submit" class="primary-btn" :disabled="addingRow">إضافة الصف</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal رفض المنشور -->
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

    <!-- Modal سجل الرفض -->
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
    
    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '../axios';

const route = useRoute();
const planId = route.params.id;

const posts = ref([]);
const allUsers = ref([]);
const currentUser = ref(null);
const planDetails = ref(null);

const loading = ref(true);
const saving = ref(false);
const toastMessage = ref('');

const showAddRowModal = ref(false);
const newRowDate = ref('');
const addingRow = ref(false);

const rejectModalPost = ref(null);
const rejectReason = ref('');
const activeReviewType = ref(''); 
const activeReviewTitle = ref('');

const activeHistoryArray = ref(null);
const activeHistoryTitle = ref('');

const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 4000); };

// تحديد ما إذا كان المستخدم الحالي مديراً أم لا
// ⚠️ هام: تأكد أن قيمة 'manager' تطابق نوع دور المدير في جدول users الخاص بك
const isManager = computed(() => {
  if (!currentUser.value) return false;
  return currentUser.value.role === 'manager'; // عدلها إلى currentUser.value.type مثلاً إذا كان حقلك type
});

const isPlanExecutor = computed(() => {
  if (!currentUser.value || !planDetails.value) return false;
  const executors = planDetails.value.users?.filter(u => u.pivot?.task_role === 'executor') || [];
  return executors.some(u => u.id === currentUser.value.id);
});

const isRowExecutor = (post) => {
  if (!currentUser.value) return false;
  return currentUser.value.id === post.designer_id;
};

const canEditField = (post, field) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanExecutor.value) return true;
  if (isRowExecutor(post)) {
    return ['content_links', 'notes'].includes(field);
  }
  return false;
};

const canAddRow = computed(() => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanExecutor.value) return true;
  return false;
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
  return `${new Date(dateString).getDate()}`; 
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

const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/content-plans/${planId}/posts`);
    posts.value = res.data.data.map(p => ({
      ...p,
      ad_platform: Array.isArray(p.ad_platform) ? p.ad_platform : (p.ad_platform ? JSON.parse(p.ad_platform) : []),
      deadline: formatDateTimeLocal(p.deadline)
    }));
  } catch (error) {
    showToast('تعذر تحميل بيانات اللوحة.');
  } finally {
    loading.value = false;
  }
};

const autoSave = async (post, field) => {
  saving.value = true;
  try {
    await api.put(`/plan-posts/${post.id}`, { [field]: post[field] });
  } catch (error) {
    showToast('حدث خطأ أثناء الحفظ التلقائي!');
  } finally {
    setTimeout(() => { saving.value = false; }, 500);
  }
};

// --- لوجيك الاعتماد المزدوج ---
const approvePost = async (post, type) => {
  if (!window.confirm('هل أنت متأكد من الاعتماد؟')) return;
  try {
    await api.post(`/plan-posts/${post.id}/review`, { 
      review_type: type,
      status: 'معتمد' 
    });
    
    if (type === 'manager') post.manager_review_status = 'معتمد';
    else post.review_status = 'معتمد';
    
    showToast('تم الاعتماد بنجاح 🟢');
  } catch (error) {
    showToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ');
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
    
    if (activeReviewType.value === 'manager') {
      rejectModalPost.value.manager_review_status = 'مرفوض';
      rejectModalPost.value.manager_rejection_history = res.data.data.manager_rejection_history;
    } else {
      rejectModalPost.value.review_status = 'مرفوض';
      rejectModalPost.value.rejection_history = res.data.data.rejection_history;
    }
    
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

// حماية النشر من الفرونت إند
const handlePublishStatusChange = (post) => {
  if (post.actual_publish_status === 'تم النشر') {
    
    // منع النشر قبل الموافقتين
    if (post.review_status !== 'معتمد' || post.manager_review_status !== 'معتمد') {
      showToast('⚠️ لا يمكن النشر قبل الحصول على موافقة المراجع واعتماد المدير النهائي.');
      post.actual_publish_status = 'لم يتم'; 
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

const fetchPlanDetails = async () => {
  try {
    const res = await api.get(`/content-plans/${planId}`);
    planDetails.value = res.data.data || res.data;
  } catch (error) {
    console.error('تعذر جلب تفاصيل الخطة', error);
  }
};

onMounted(() => {
  fetchPlanDetails();
  fetchCurrentUser(); 
  fetchUsers();
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

.spreadsheet-container { flex-grow: 1; overflow: auto; background: #f8f9fa; padding-bottom: 50px; }
.spreadsheet-table { border-collapse: collapse; min-width: max-content; background: #fff; }

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
.readonly-cell { background: #f1f3f4; padding: 0 10px; white-space: nowrap; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; border:none; }
.readonly-cell strong { font-size: 11px; }
.readonly-cell small { font-size: 10px; color: #555; }

/* أزرار وشارات المراجعة */
.review-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #f9f9f9; padding: 5px !important; border:none; height: 100%; }
.review-actions { display: flex; gap: 4px; }
.review-actions button { border: none; padding: 4px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; color: #fff; transition: 0.2s; }
.approve-btn { background: #388e3c; } .approve-btn:hover { background: #2e7d32; }
.reject-btn { background: #d32f2f; } .reject-btn:hover { background: #c62828; }
.badge { font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 4px; }
.badge.approved { background: #e8f5e9; color: #2e7d32; }
.badge.pending { background: #fff3e0; color: #e65100; }
.history-btn { background: #f1f3f4; border: 1px solid #ccc; font-size: 9px; padding: 3px 6px; border-radius: 4px; cursor: pointer; color: #555; transition: 0.2s; }
.history-btn:hover { background: #e0e0e0; }

/* تنسيق الحقول المقفلة للمراجع */
input:disabled, select:disabled, textarea:disabled {
  background-color: #f1f3f4 !important;
  color: #9e9e9e !important;
  cursor: not-allowed;
  opacity: 0.7;
}

input, select, textarea { width: 100%; height: 100%; min-height: 33px; border: none; outline: none; background: transparent; padding: 4px 6px; font-family: inherit; font-size: 11px; color: #222; text-align: center; resize: none; transition: 0.15s; }
textarea { padding-top: 8px; }
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

/* تنسيق سجل الرفض */
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { background: #fdf2f2; border-right: 3px solid #d32f2f; padding: 10px; border-radius: 4px; }
.history-meta { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 5px; }
.history-meta strong { color: #d32f2f; }
.history-reason { margin: 0; font-size: 12px; color: #333; line-height: 1.5; }

.toast-message { position: fixed; bottom: 20px; left: 20px; background: #323232; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast-enter-active, .toast-leave-active { transition: 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>