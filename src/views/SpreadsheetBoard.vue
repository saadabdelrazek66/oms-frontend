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

    <div v-else class="spreadsheet-container">
      <table class="spreadsheet-table">
        <thead>
          <tr>
            <th colspan="6" class="group-header admin-group">الإدارة والتكليف والمراجعة</th>
            <th colspan="4" class="group-header red-group">حالة المنشور</th>
            <th colspan="2" class="group-header dark-red-group">موقف التمويل</th>
            <th colspan="8" class="group-header blue-group">محتوى المنشور</th>
            <th colspan="1" class="group-header light-blue-group">التسليم</th>
            <th colspan="1" class="group-header pink-group">ملاحظات</th>
          </tr>
          <tr>
            <th class="sub-th admin-th">المنفذ</th>
            <th class="sub-th admin-th">بدء التنفيذ</th>
            <th class="sub-th admin-th">الديدلاين</th>
            <th class="sub-th admin-th">المراجعين (متعدد)</th>
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

            <th class="sub-th light-blue-th">روابط ووقت التسليم</th>
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
              <select v-model="post.designer_id" @change="autoSave(post, 'designer_id')" :disabled="!canEditFields(post)">
                <option :value="null">لم يحدد</option>
                <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
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
              <VueDatePicker 
                v-model="post.deadline" 
                :disabled="!canEditFields(post)"
                auto-apply
                @closed="autoSave(post, 'deadline')"
                time-picker-inline
                position="left"
                placeholder="تاريخ ووقت"
              ></VueDatePicker>
            </td>
            
            <!-- حقل المراجعين (Multi-Select) -->
            <td>
              <CustomMultiSelect
                v-model="post.reviewer_ids"
                :options="allUsers.map(u => ({ label: u.name, value: u.id }))"
                @change="autoSave(post, 'reviewer_ids')"
                :disabled="!canEditFields(post)"
                placeholder="اختر مراجع..."
              />
            </td>

 <!-- مراجعة القسم (إجماع المراجعين) -->
            <td class="review-cell">
              <!-- 1. معتمد كلياً -->
              <template v-if="post.review_status === 'معتمد'">
                <span class="badge approved">🟢 معتمد</span>
                <span v-if="post.department_approved_at" class="approval-time">
                  🕒 {{ new Date(post.department_approved_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </template>
              
              <!-- 2. مرفوض -->
              <template v-else-if="post.review_status === 'مرفوض'">
                <span class="badge pending" style="color: #d32f2f;">🔴 مرفوض</span>
                <!-- زر تراجع وإعادة فتح المراجعة (يظهر للمدير والمراجعين فقط) -->
                <button v-if="isManager || (post.reviewer_ids && post.reviewer_ids.includes(currentUser?.id))" 
                        class="reset-btn" @click="resetReview(post, 'reviewer')" title="إعادة فتح المراجعة بعد التعديل">
                  🔄 تراجع
                </button>
              </template>

              <!-- 3. قيد الانتظار -->
              <template v-else>
                <!-- إذا كان المراجع الحالي قد وافق بالفعل (لكن ينتظر الباقين) تختفي الأزرار وتظهر هذه الشارة -->
                <span v-if="post.reviewers_statuses && post.reviewers_statuses[currentUser?.id] === 'معتمد' && !isManager" class="badge" style="background: #e3f2fd; color: #1976d2;">
                  ✅ تمت موافقتك
                </span>
                
                <!-- الأزرار تظهر فقط لمن لم يوافق بعد أو للمدير -->
                <div v-else-if="(post.reviewer_ids && post.reviewer_ids.includes(currentUser?.id)) || isManager" class="review-actions">
                  <button class="approve-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="approvePost(post, 'reviewer')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن المراجعة بدون روابط التسليم' : 'موافقة'">✅ موافقة</button>
                  <button class="reject-btn" :disabled="!post.delivery_links || !post.delivery_links.trim()" @click="openRejectModal(post, 'reviewer')" :title="(!post.delivery_links || !post.delivery_links.trim()) ? 'لا يمكن المراجعة بدون روابط التسليم' : 'رفض'">❌ رفض</button>
                </div>
                
                <!-- المنفذ أو أي شخص آخر -->
                <span v-else class="badge pending">⏳ قيد الانتظار</span>
              </template>

              <!-- سجل الرفض -->
              <button v-if="post.rejection_history && post.rejection_history.length > 0" 
                      class="history-btn mt-1" @click="openHistoryModal(post.rejection_history, 'القسم')">
                📜 سجل الرفض
              </button>
            </td>

            <!-- مراجعة المدير -->
            <td class="review-cell" style="background: #eceff1;">
              <!-- 1. معتمد -->
              <template v-if="post.manager_review_status === 'معتمد'">
                <span class="badge approved">🟢 معتمد</span>
                <span v-if="post.manager_approved_at" class="approval-time">
                  🕒 {{ new Date(post.manager_approved_at).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </template>
              
              <!-- 2. مرفوض -->
              <template v-else-if="post.manager_review_status === 'مرفوض'">
                <span class="badge pending" style="color: #d32f2f;">🔴 مرفوض</span>
                <button v-if="isManager" 
                        class="reset-btn" @click="resetReview(post, 'manager')" title="إعادة فتح المراجعة">
                  🔄 تراجع
                </button>
              </template>
              
              <!-- 3. قيد الانتظار -->
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

            <!-- 2. حالة المنشور -->
            <td class="readonly-cell">
              <strong>{{ getDayName(post.target_date) }}</strong>
              <small>{{ formatDate(post.target_date) }}</small>
            </td>
            <td>
              <select v-model="post.actual_publish_status" @change="handlePublishStatusChange(post)" :class="post.actual_publish_status === 'لم يتم' ? 'text-red' : 'text-green'" :disabled="!canEditPublishAndNotes(post)">
                <option value="لم يتم">لم يتم</option>
                <option value="تم النشر">تم النشر</option>
              </select>
            </td>
            <td><input type="text" v-model="post.publishing_time" @blur="autoSave(post, 'publishing_time')" placeholder="--:--" dir="ltr" :disabled="!canEditFields(post)" /></td>
            <td>
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
                :disabled="!canEditFields(post)"
                placeholder="اختر منصة..."
              />
            </td>

            <!-- 3. التمويل -->
            <td>
              <CustomMultiSelect
                v-model="post.ad_platform"
                :options="[
                  { label: 'Facebook Ads', value: 'Facebook Ads' },
                  { label: 'Google Ads', value: 'Google Ads' },
                  { label: 'Snapchat Ads', value: 'Snapchat Ads' },
                  { label: 'TikTok Ads', value: 'TikTok Ads' }
                ]"
                @change="autoSave(post, 'ad_platform')"
                :disabled="!canEditFields(post)"
                placeholder="اختر منصة..."
              />
            </td>
            <td>
              <select v-model="post.finance_status" @change="autoSave(post, 'finance_status')" :disabled="!canEditFields(post)">
                <option value="غير ممول">غير ممول</option>
                <option value="ممول">ممول</option>
              </select>
            </td>

            <!-- 4. محتوى المنشور -->
            <td>
              <select v-model="post.post_type" @change="autoSave(post, 'post_type')" :disabled="!canEditFields(post)">
                <option value="">اختيار...</option>
                <option value="Infograph">Infograph</option>
                <option value="Video">Video</option>
                <option value="Reel/Shorts">Reel / Shorts</option>
                <option value="Text Only">Text Only</option>
                <option value="Carousel">Carousel</option>
              </select>
            </td>
            <td><input type="text" v-model="post.objective" @blur="autoSave(post, 'objective')" placeholder="..." :disabled="!canEditFields(post)" /></td>
            <td><textarea v-model="post.detailed_idea" @blur="autoSave(post, 'detailed_idea')" rows="1" :disabled="!canEditFields(post)"></textarea></td>
            <td><textarea v-model="post.caption" @blur="autoSave(post, 'caption')" rows="1" :disabled="!canEditFields(post)"></textarea></td>
            <td><input type="text" v-model="post.tov" @blur="autoSave(post, 'tov')" placeholder="..." :disabled="!canEditFields(post)" /></td>
            <td><input type="text" v-model="post.call_to_action" @blur="autoSave(post, 'call_to_action')" placeholder="..." :disabled="!canEditFields(post)" /></td>
            <td><input type="text" v-model="post.hashtags" @blur="autoSave(post, 'hashtags')" placeholder="#..." :disabled="!canEditFields(post)" /></td>
            <td><input type="url" v-model="post.reference_link" @blur="autoSave(post, 'reference_link')" placeholder="Link..." dir="ltr" :disabled="!canEditFields(post)" /></td>

            <!-- 5. التسليم والملاحظات -->
            <td class="delivery-cell">
              <textarea 
                v-model="post.delivery_links" 
                @blur="autoSave(post, 'delivery_links')" 
                placeholder="روابط التسليم (Drive/Notion)..." 
                dir="ltr" 
                rows="2"
                :disabled="!canEditDelivery(post)"
              ></textarea>
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
            <td><input type="text" v-model="post.notes" @blur="autoSave(post, 'notes')" placeholder="..." :disabled="!canEditPublishAndNotes(post)" /></td>
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
    
    <!-- Modal إشعارات الواتساب -->
    <div v-if="showWaModal" class="modal-overlay" @click.self="showWaModal = false">
      <div class="modal-content" style="width: min(500px, 100%)">
        <h3 style="color: #25D366; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/></svg>
          إرسال إشعار واتساب
        </h3>
        <p>تم إعداد الرسالة تلقائياً. يمكنك تعديلها قبل الإرسال.</p>
        
        <div class="form-group mt-3">
          <label>نص الرسالة</label>
          <textarea v-model="waMessage" rows="6" dir="auto" style="border: 1px solid #25d366; font-size: 13px;"></textarea>
        </div>

        <div class="form-group mt-2" v-if="waPayload.manager_phone" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="ccManagerCheck" v-model="ccManager" style="width: auto; height: auto;" />
          <label for="ccManagerCheck" style="margin: 0; cursor: pointer; color: #555;">إرسال نسخة للمدير (CC) للعلم</label>
        </div>

        <div class="mt-4" style="border-top: 1px solid #eee; padding-top: 15px;">
          <label style="font-size: 11px; font-weight: bold; color: #444;">المستلمون:</label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
            <button v-for="(rec, idx) in waPayload.recipients" :key="idx" 
                    @click="sendWhatsApp(rec.phone)" 
                    class="primary-btn" style="background: #25D366; color: white;">
              إرسال لـ {{ rec.name }} ({{ rec.role }})
            </button>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 20px;">
          <button type="button" class="secondary-btn" @click="showWaModal = false">إغلاق / تجاهل</button>
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
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import CustomMultiSelect from '../components/CustomMultiSelect.vue';

const route = useRoute();
const planId = route.params.id;

const posts = ref([]);
const allUsers = ref([]);
const currentUser = ref(null);

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

// متغيرات الواتساب
const showWaModal = ref(false);
const waPayload = ref(null);
const waMessage = ref('');
const ccManager = ref(true); // افتراضياً نعم

// دالة فتح النافذة
const openWaModal = (payload) => {
  if (!payload || !payload.recipients || payload.recipients.length === 0) return;
  waPayload.value = payload;
  waMessage.value = payload.message;
  showWaModal.value = true;
};

// دالة إرسال الواتساب وتوجيه المستخدم
const sendWhatsApp = (phone) => {
  if (!phone) {
    if (typeof showToast === 'function') showToast('رقم الهاتف غير متوفر');
    return;
  }
  const text = encodeURIComponent(waMessage.value);
  // تنظيف الرقم من أي رموز (يفترض أن يكون بالصيغة الدولية)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  
  // إذا كان إرسال نسخة للمدير مفعلاً، نفتح نافذة أخرى للمدير
  if (ccManager.value && waPayload.value.manager_phone && cleanPhone !== waPayload.value.manager_phone.replace(/[^0-9]/g, '')) {
    setTimeout(() => {
      const ccText = encodeURIComponent(`*نسخة للمدير للعلم:*\n\n` + waMessage.value);
      window.open(`https://wa.me/${waPayload.value.manager_phone.replace(/[^0-9]/g, '')}?text=${ccText}`, '_blank');
    }, 1000);
  }
};

const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 4000); };

// تحديد المدير
const isManager = computed(() => {
  if (!currentUser.value) return false;
  return currentUser.value.role === 'manager';
});

const canEditFields = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true; // المدير له صلاحية دائمًا
  
  if (isPlanResponsible.value) {
    const isDelivered = !!post.delivered_at;
    const isRejected = post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض';
    
    // قفل الحقول إذا تم التسليم ولم يتم الرفض (أي أنها قيد المراجعة أو معتمدة)
    if (isDelivered && !isRejected) {
      return false;
    }
    return true; // مسموح بالتعديل (لم تُسلم بعد، أو رُفضت وتحتاج تعديل)
  }
  
  return false;
};

const canEditPublishAndNotes = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  if (isPlanResponsible.value) return true; // دائمًا مفتوحة للمسئول
  
  return canEditFields(post); // لباقي الأشخاص تخضع لقفل المراجعة
};

const canEditDelivery = (post) => {
  if (!currentUser.value) return false;
  if (isManager.value) return true;
  
  if (currentUser.value.id === post.designer_id) {
    const isDelivered = !!post.delivered_at;
    const isRejected = post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض';
    
    if (isDelivered && !isRejected) {
      return false; // قفل التعديل على الروابط أثناء المراجعة
    }
    return true;
  }
  
  return false;
};

const startExecution = async (post) => {
  if (!window.confirm('هل أنت متأكد من تكليف المنفذ وبدء العمل؟ (تأكد من استكمال كافة بيانات الـ Brief)')) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/start-execution`);
    
    // تحديث وقت البدء في الواجهة
    post.execution_started_at = res.data.data.execution_started_at;
    
    if (res.data?.whatsapp_payload) openWaModal(res.data.whatsapp_payload);
    
    if (typeof showToast === 'function') {
      showToast(res.data.message || 'تم إعطاء إشارة البدء بنجاح 🚀');
    }
  } catch (error) {
    if (typeof showToast === 'function') {
      // إظهار رسالة الخطأ القادمة من الباك إند (والتي تحتوي على أسماء الحقول الناقصة)
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
    
    // التحديث الفوري للواجهة بالبيانات القادمة من الباك إند
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

// تحديد ما إذا كان المستخدم الحالي من ضمن المراجعين (لحظر تعديل الحقول)
const isReviewerOnly = (post) => {
  if (!currentUser.value) return true;
  if (isManager.value) return false; 
  return post.reviewer_ids && post.reviewer_ids.includes(currentUser.value.id);
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

const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/content-plans/${planId}/posts`);
    posts.value = res.data.data.map(p => ({
      ...p,
      ad_platform: Array.isArray(p.ad_platform) ? p.ad_platform : (p.ad_platform ? JSON.parse(p.ad_platform) : []),
      reviewer_ids: Array.isArray(p.reviewer_ids) ? p.reviewer_ids : (p.reviewer_ids ? JSON.parse(p.reviewer_ids) : []),
      deadline: formatDateTimeLocal(p.deadline)
    }));
    
    isPlanResponsible.value = res.data.is_responsible || false;
    
  } catch (error) {
    showToast('تعذر تحميل بيانات اللوحة.');
  } finally {
    loading.value = false;
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

// --- دوال الاعتماد المزدوج وتعدد المراجعين ---
const approvePost = async (post, type) => {
  if (!window.confirm('هل أنت متأكد من الاعتماد؟')) return;
  try {
    const res = await api.post(`/plan-posts/${post.id}/review`, { 
      review_type: type,
      status: 'معتمد' 
    });
    
    // التحديث الفوري للواجهة
    post.review_status = res.data.data.review_status;
    post.manager_review_status = res.data.data.manager_review_status;
    post.reviewers_statuses = res.data.data.reviewers_statuses; // تحديث حالة المراجعين الفردية
    post.department_approved_at = res.data.data.department_approved_at;
    post.manager_approved_at = res.data.data.manager_approved_at;
    
    showToast(res.data.data.review_status === 'معتمد' ? 'تم الاعتماد بنجاح 🟢' : 'تم تسجيل موافقتك، بانتظار باقي المراجعين ⏳');
  } catch (error) {
    showToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ');
  }
};

// --- دالة التراجع (إعادة فتح المراجعة بعد الرفض) ---
const resetReview = async (post, type) => {
  if (!window.confirm('هل أنت متأكد من التراجع وإعادة فتح المراجعة لهذا المنشور؟')) return;
  
  try {
    if (type === 'manager') {
      await api.put(`/plan-posts/${post.id}`, { manager_review_status: 'قيد الانتظار' });
      post.manager_review_status = 'قيد الانتظار';
      post.manager_approved_at = null;
    } else {
      // إرجاع القسم لقيد الانتظار، وتفريغ حالات المراجعين ليبدأوا التصويت من جديد
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

// حماية النشر من الفرونت إند
const handlePublishStatusChange = (post) => {
  if (post.actual_publish_status === 'تم النشر') {
    
    // منع النشر قبل الموافقتين
    if (post.review_status !== 'معتمد' || post.manager_review_status !== 'معتمد') {
      showToast('⚠️ لا يمكن النشر قبل الحصول على موافقة جميع المراجعين واعتماد المدير النهائي.');
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
</style>