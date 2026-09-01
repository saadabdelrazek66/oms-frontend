<template>
  <section class="vault-page" dir="rtl">
    <!-- التحقق من الصلاحيات -->
    <div v-if="!isManager" class="unauthorized">
      <div class="icon">🚫</div>
      <h2>غير مصرح بالدخول</h2>
      <p>هذه الصفحة مخصصة لمديري النظام فقط.</p>
    </div>

    <!-- شاشة القفل (Lock Screen) -->
    <div v-else-if="!vaultUnlocked" class="lock-screen">
      <div class="lock-card">
        <div class="lock-icon" :class="{ 'shake': wrongPin }">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 8V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9zm3 4.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5z"/></svg>
        </div>
        
        <h2>خزنة بيانات العملاء</h2>
        <p v-if="loadingStatus">جارٍ التحقق من حالة الخزنة...</p>
        <div v-else>
          <p class="lock-desc">{{ hasPin ? 'أدخل الرقم السري لفتح الخزنة' : 'قم بتعيين رقم سري جديد (4 أرقام) لحماية الخزنة' }}</p>
          
          <form @submit.prevent="submitPin" class="pin-form">
            <div class="pin-inputs">
              <input type="password" v-model="pinForm" maxlength="4" placeholder="••••" required class="pin-box" @input="pinForm = pinForm.replace(/[^0-9]/g, '')" />
            </div>
            <button type="submit" class="primary-btn unlock-btn" :disabled="loadingAction || pinForm.length !== 4">
              {{ loadingAction ? 'جارٍ...' : (hasPin ? 'فتح الخزنة 🔓' : 'تعيين الرمز وحفظ 🔐') }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- واجهة الخزنة بعد الفتح (Unlocked Vault) -->
    <div v-else class="vault-dashboard">
      <div class="page-topline">
        <div>
          <span class="eyebrow" style="color:#ffc480;">مساحة آمنة المشفرة</span>
          <h2>خزنة العملاء (Vault)</h2>
          <p>إدارة حسابات السوشيال ميديا والمنصات الخاصة بعملائك بسرية تامة.</p>
        </div>
        <button class="secondary-btn lock-action-btn" type="button" @click="lockVault">
          قفل الخزنة 🔒
        </button>
      </div>

      <div v-if="loadingData" class="state-cell"><span class="spinner"></span> جلب البيانات المشفرة...</div>
      
      <div v-else class="clients-grid">
        <!-- كارت العميل -->
        <div v-for="client in clients" :key="client.id" class="client-vault-card">
          <div class="cv-header">
            <div class="cv-title">
              <div class="cv-avatar">{{ getInitials(client.name) }}</div>
              <div><h3>{{ client.name }}</h3><span class="cv-count">{{ client.credentials?.length || 0 }} حسابات مسجلة</span></div>
            </div>
            <button class="add-cred-btn" @click="openCredModal(client.id)">+ إضافة حساب</button>
          </div>

          <div class="cv-body">
            <div v-if="!client.credentials || client.credentials.length === 0" class="muted text-center mt-2">لا توجد حسابات مسجلة لهذا العميل.</div>
            
            <!-- حسابات العميل -->
            <div v-for="cred in client.credentials" :key="cred.id" class="cred-item">
              <div class="cred-main">
                <div class="cred-platform"><strong>{{ cred.platform }}</strong></div>
                <div class="cred-actions">
                  <button type="button" @click="openCredModal(client.id, cred)" class="icon-btn edit-icon" title="تعديل">✎</button>
                  <button type="button" @click="deleteCred(cred.id)" class="icon-btn delete-icon" title="حذف">⌫</button>
                </div>
              </div>
              
              <div class="cred-details">
                <div class="data-row">
                  <span class="data-label">المستخدم/الإيميل:</span>
                  <div class="data-val-group">
                    <span class="data-val">{{ cred.username }}</span>
                    <button class="copy-btn" @click="copyToClipboard(cred.username, 'تم نسخ اسم المستخدم')">📋</button>
                  </div>
                </div>
                
                <div class="data-row">
                  <span class="data-label">كلمة المرور:</span>
                  <div class="data-val-group">
                    <span class="data-val pwd">••••••••</span>
                    <button class="copy-btn copy-pwd" @click="copyToClipboard(cred.password, 'تم نسخ كلمة المرور السريّة')">نسخ الباسورد 🔐</button>
                  </div>
                </div>

                <div v-if="cred.login_url" class="data-row">
                  <span class="data-label">رابط الدخول:</span>
                  <a :href="cred.login_url" target="_blank" class="cred-link">فتح الرابط ↗</a>
                </div>

                <div v-if="cred.two_factor_notes" class="data-row two-factor">
                  <span class="data-label">2FA/ملاحظات:</span>
                  <span class="data-val notes">{{ cred.two_factor_notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal إضافة/تعديل حساب -->
    <div v-if="showCredModal" class="modal-overlay" @click.self="closeCredModal">
      <div class="modal-content cred-modal" role="dialog" style="width: min(450px, 100%) !important;">
        <button class="modal-close" type="button" @click="closeCredModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #ffc480, #ffb359); color:#12183f;">🔑</div>
        <span class="eyebrow" style="color: #ffc480;">تشفير البيانات</span>
        <h3>{{ isEditing ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد للعميل' }}</h3>
        
        <form class="plan-form mt-2" @submit.prevent="saveCredential">
          <div class="form-group">
            <label>المنصة (مثال: Facebook, Hostinger)</label>
            <input v-model="credForm.platform" type="text" required placeholder="اسم المنصة..." />
          </div>
          <div class="form-group">
            <label>رابط تسجيل الدخول (اختياري)</label>
            <input v-model="credForm.login_url" type="url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>اسم المستخدم أو الإيميل</label>
            <input v-model="credForm.username" type="text" required dir="ltr" style="text-align:left;" />
          </div>
          <div class="form-group">
            <label>كلمة المرور (سيتم تشفيرها بالكامل)</label>
            <input v-model="credForm.password" type="text" required dir="ltr" style="text-align:left; font-family:monospace;" />
          </div>
          <div class="form-group">
            <label>ملاحظات المصادقة (2FA / أرقام احتياطية)</label>
            <textarea v-model="credForm.two_factor_notes" rows="2" placeholder="ملاحظات حول طريقة التخطي..."></textarea>
          </div>
          <div class="modal-actions mt-3">
            <button type="button" class="secondary-btn" @click="closeCredModal">إلغاء</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #ffc480, #ffaa42); color:#12183f;" :disabled="loadingAction">
              {{ loadingAction ? 'جارٍ الحفظ...' : 'حفظ مشفر 🔒' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <transition name="toast"><div v-if="toastMessage" class="toast-message">{{ toastMessage }}</div></transition>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../axios';

// التحقق من أن المستخدم مدير
const userRole = ref(localStorage.getItem('role') || 'employee'); 
const isManager = ref(userRole.value === 'manager');

// حالات الخزنة
const hasPin = ref(false);
const vaultUnlocked = ref(false);
const pinForm = ref('');
const savedPin = ref(''); // نحتفظ به في الذاكرة فقط لتمريره في الـ Headers
const wrongPin = ref(false);

const clients = ref([]);
const loadingStatus = ref(true);
const loadingAction = ref(false);
const loadingData = ref(false);
const toastMessage = ref('');

// CRUD States
const showCredModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const selectedClientId = ref(null);
const credForm = reactive({ platform: '', login_url: '', username: '', password: '', two_factor_notes: '' });

const showToast = (message) => { toastMessage.value = message; setTimeout(() => { toastMessage.value = ''; }, 3200); };
const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

// --- 1. التحقق من حالة الخزنة ---
const checkVaultStatus = async () => {
  if (!isManager.value) return;
  try {
    const res = await api.get('/vault/status');
    hasPin.value = res.data.has_pin;
  } catch (error) {
    showToast('خطأ في الاتصال بالخادم.');
  } finally {
    loadingStatus.value = false;
  }
};

// --- 2. إرسال/إنشاء الرقم السري ---
const submitPin = async () => {
  if (pinForm.value.length !== 4) return;
  loadingAction.value = true;
  wrongPin.value = false;

  try {
    if (hasPin.value) {
      // فتح الخزنة
      await api.post('/vault/verify-pin', { pin: pinForm.value });
      savedPin.value = pinForm.value; // حفظ مؤقت
      vaultUnlocked.value = true;
      pinForm.value = '';
      fetchVaultClients();
    } else {
      // إنشاء لأول مرة
      await api.post('/vault/setup-pin', { pin: pinForm.value });
      showToast('تم حفظ الرقم السري بنجاح!');
      hasPin.value = true;
      pinForm.value = '';
    }
  } catch (error) {
    wrongPin.value = true;
    showToast(error.response?.data?.message || 'الرقم السري خاطئ');
    setTimeout(() => { wrongPin.value = false; pinForm.value = ''; }, 600);
  } finally {
    loadingAction.value = false;
  }
};

// --- دالة مساعدة لتمرير الـ Header الأمن ---
const getVaultConfig = () => {
  return { headers: { 'X-Vault-Pin': savedPin.value } };
};

// --- 3. جلب بيانات العملاء السرية ---
const fetchVaultClients = async () => {
  loadingData.value = true;
  try {
    const res = await api.get('/vault/clients', getVaultConfig());
    clients.value = res.data.data;
  } catch (error) {
    showToast('تعذر جلب البيانات. ربما انتهت الجلسة.');
    lockVault();
  } finally {
    loadingData.value = false;
  }
};

// --- 4. إدارة حسابات العميل (CRUD) ---
const openCredModal = (clientId, cred = null) => {
  selectedClientId.value = clientId;
  if (cred) {
    isEditing.value = true;
    editId.value = cred.id;
    Object.assign(credForm, { 
      platform: cred.platform, login_url: cred.login_url || '', 
      username: cred.username, password: cred.password, 
      two_factor_notes: cred.two_factor_notes || '' 
    });
  } else {
    isEditing.value = false;
    editId.value = null;
    Object.assign(credForm, { platform: '', login_url: '', username: '', password: '', two_factor_notes: '' });
  }
  showCredModal.value = true;
};

const closeCredModal = () => { showCredModal.value = false; };

const saveCredential = async () => {
  loadingAction.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/vault/credentials/${editId.value}`, credForm, getVaultConfig());
      showToast('تم تحديث البيانات بنجاح.');
    } else {
      await api.post(`/vault/clients/${selectedClientId.value}/credentials`, credForm, getVaultConfig());
      showToast('تمت إضافة الحساب بنجاح.');
    }
    closeCredModal();
    fetchVaultClients(); // تحديث العرض
  } catch (error) {
    showToast('حدث خطأ أثناء الحفظ.');
  } finally {
    loadingAction.value = false;
  }
};

const deleteCred = async (id) => {
  if (!window.confirm('متأكد من حذف هذا الحساب نهائياً؟')) return;
  try {
    await api.delete(`/vault/credentials/${id}`, getVaultConfig());
    showToast('تم حذف الحساب.');
    fetchVaultClients();
  } catch (error) {
    showToast('حدث خطأ أثناء الحذف.');
  }
};

// --- نسخ النصوص ---
const copyToClipboard = async (text, successMsg) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (err) {
    showToast('فشل النسخ التلقائي.');
  }
};

// --- قفل الخزنة ---
const lockVault = () => {
  vaultUnlocked.value = false;
  savedPin.value = '';
  clients.value = [];
};

onMounted(() => {
  checkVaultStatus();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing:border-box; } :global(body) { margin:0; font-family:'Cairo',sans-serif; background:#04071b; color:#edf0ff; }
.vault-page { min-height:100%; font-family:'Cairo',sans-serif; padding-bottom: 50px; }
.unauthorized { text-align: center; margin-top: 20vh; } .unauthorized .icon { font-size: 50px; margin-bottom: 15px; } .unauthorized p { color: #818cb9; }

/* شاشة القفل (Lock Screen) */
.lock-screen { display: grid; place-items: center; min-height: 80vh; }
.lock-card { background: linear-gradient(145deg,#171d52,#0d143a); border: 1px solid rgba(146,160,233,.2); border-radius: 20px; padding: 40px; text-align: center; width: 100%; max-width: 400px; box-shadow: 0 25px 70px rgba(0,0,0,.4); }
.lock-icon { width: 80px; height: 80px; background: rgba(255,196,128,.1); color: #ffc480; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 20px; border: 2px solid rgba(255,196,128,.3); }
.lock-desc { color: #818cb9; font-size: 12px; margin-bottom: 25px; }
.pin-form { display: flex; flex-direction: column; gap: 20px; }
.pin-box { background: rgba(6,11,37,.6); border: 2px solid rgba(145,160,230,.3); border-radius: 12px; color: #fff; font-size: 28px; text-align: center; padding: 10px; letter-spacing: 15px; outline: none; transition: 0.3s; width: 100%; font-family: monospace; }
.pin-box:focus { border-color: #ffc480; box-shadow: 0 0 15px rgba(255,196,128,.2); }
.unlock-btn { background: linear-gradient(110deg, #ffc480, #ffaa42) !important; color: #12183f !important; font-size: 14px !important; padding: 12px !important; width: 100%; border-radius: 12px !important; }

@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
.shake { animation: shake 0.5s; color: #ff678b; border-color: rgba(255,103,139,.4); background: rgba(255,103,139,.1); }

/* واجهة الخزنة */
.page-topline { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:30px; }
.eyebrow { font-size:10px; font-weight:700; letter-spacing:.7px; } .page-topline h2 { margin:7px 0 3px; font-size:28px; } .page-topline p { margin:0; color:#818cb9; font-size:12px; }
.lock-action-btn { color: #ff9bad !important; border-color: rgba(255,103,139,.3) !important; background: rgba(255,103,139,.08) !important; }

.clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.client-vault-card { background: rgba(15,22,61,.65); border: 1px solid rgba(137,153,226,.15); border-radius: 16px; overflow: hidden; }
.cv-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(10,16,47,.35); border-bottom: 1px solid rgba(137,153,226,.1); }
.cv-title { display: flex; align-items: center; gap: 12px; }
.cv-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(145deg, #ffc480, #ffaa42); color: #12183f; display: grid; place-items: center; font-weight: bold; font-size: 12px; }
.cv-title h3 { margin: 0; font-size: 13px; color: #fff; } .cv-count { font-size: 10px; color: #7782b0; }
.add-cred-btn { background: rgba(255,196,128,.1); border: 1px solid rgba(255,196,128,.3); color: #ffc480; border-radius: 8px; padding: 5px 10px; font-size: 10px; cursor: pointer; transition: 0.2s; font-family: inherit; } .add-cred-btn:hover { background: rgba(255,196,128,.2); }

.cv-body { padding: 15px; display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
.cred-item { background: rgba(6,11,37,.4); border: 1px solid rgba(145,160,230,.1); border-radius: 12px; padding: 12px; }
.cred-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed rgba(145,160,230,.15); padding-bottom: 8px; }
.cred-platform { color: #fff; font-size: 12px; } 
.cred-actions { display: flex; gap: 5px; }
.icon-btn { background: transparent; border: none; cursor: pointer; font-size: 12px; padding: 3px; border-radius: 4px; } .edit-icon { color: #8fc9ff; } .delete-icon { color: #ff9bad; } .icon-btn:hover { background: rgba(255,255,255,.05); }

.cred-details { display: flex; flex-direction: column; gap: 8px; }
.data-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
.data-label { color: #7782b0; width: 95px; flex-shrink: 0; }
.data-val-group { display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-grow: 1; overflow: hidden; }
.data-val { color: #d9ddf5; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: ltr; }
.pwd { color: #ffc480; letter-spacing: 2px; }
.notes { font-family: 'Cairo', sans-serif; white-space: normal; text-align: left; direction: rtl; font-size: 10px; color: #aeb6d7; background: rgba(0,0,0,.2); padding: 5px; border-radius: 4px; }
.copy-btn { background: rgba(145,160,230,.1); border: 1px solid rgba(145,160,230,.2); color: #fff; border-radius: 6px; padding: 3px 6px; cursor: pointer; font-size: 10px; transition: 0.2s; font-family: inherit; flex-shrink: 0; }
.copy-pwd { background: rgba(255,196,128,.15); border-color: rgba(255,196,128,.3); color: #ffc480; } .copy-pwd:hover { background: #ffc480; color: #12183f; }
.cred-link { color: #7de8dc; text-decoration: none; background: rgba(125,232,220,.1); padding: 2px 6px; border-radius: 4px; font-size: 9px; }

/* Modal Styles */
.modal-overlay { position:fixed; inset:0; z-index:100; display:grid; place-items:center; padding:18px; overflow-y:auto; background:rgba(4,7,27,.85); backdrop-filter:blur(7px); }
.modal-content { max-height:calc(100vh - 40px); overflow-y:auto; position:relative; padding:28px; border:1px solid rgba(146,160,233,.2); border-radius:20px; background:linear-gradient(145deg,#171d52,#0d143a); box-shadow:0 25px 70px rgba(0,0,0,.4); }
.modal-close { position:absolute; top:12px; left:16px; border:0; color:#8994c2; background:transparent; font-size:25px; cursor:pointer; }
.modal-icon { width:42px; height:42px; display:grid; place-items:center; margin-bottom:12px; border-radius:12px; font-size:21px; }
.modal-content h3 { margin:7px 0 2px; font-size:21px; color:#fff; }
.form-group { margin-bottom:13px; } .form-group label { display:block; margin-bottom:6px; color:#b8c0e2; font-size:10px; }
.form-group input, .form-group textarea { width:100%; min-height:42px; padding:10px 11px; border:1px solid rgba(145,160,230,.2); border-radius:9px; outline:0; color:#eef0ff; background:rgba(6,11,37,.46); font:inherit; font-size:11px; }
.form-group input:focus, .form-group textarea:focus { border-color:#ffc480; }
.modal-actions { display:flex; justify-content:flex-start; gap:9px; }
.primary-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:43px; padding:0 17px; border:0; border-radius:11px; font:inherit; font-size:11px; font-weight:800; cursor:pointer; transition:.2s; }
.primary-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.06); } .primary-btn:disabled { opacity:.6; cursor:wait; }
.secondary-btn { min-height:43px; padding:0 18px; border:1px solid rgba(143,157,226,.2); border-radius:10px; color:#aab4dc; background:transparent; font:inherit; font-size:11px; cursor:pointer; }
.state-cell { text-align:center; padding: 40px; color: #7d89b6; } .spinner { display:inline-block; width:15px; height:15px; margin-left:7px; vertical-align:middle; border:2px solid rgba(125,232,220,.25); border-top-color:#7de8dc; border-radius:50%; animation:spin .7s linear infinite; } @keyframes spin { to { transform:rotate(360deg); } }
.toast-message { position:fixed; left:25px; bottom:25px; z-index:200; padding:12px 17px; border:1px solid rgba(255,196,128,.22); border-radius:10px; color:#ffc480; background:#182552; box-shadow:0 12px 30px rgba(0,0,0,.3); font-size:11px; } .toast-enter-active,.toast-leave-active { transition:.25s; } .toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(10px); }
.mt-2 { margin-top: 15px; } .mt-3 { margin-top: 20px; }
@media (max-width:720px) { .page-topline { flex-direction: column; align-items: flex-start; } .lock-action-btn { width: 100%; } .clients-grid { grid-template-columns: 1fr; } }
</style>