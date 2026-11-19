<template>
  <Teleport to="body">
    <div v-if="show" class="finance-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="finance-modal-card">
      <div class="modal-header">
        <div class="header-title">
          <span class="modal-badge" :class="form.type === 'income' ? 'badge-income' : 'badge-expense'">
            {{ form.type === 'income' ? '📥 مقبوضات (إيراد)' : '📤 مدفوعات (مصروف)' }}
          </span>
          <h3>{{ isEditing ? 'تعديل المعاملة المالية' : (form.type === 'income' ? 'تسجيل إيراد / قبض جديد' : 'تسجيل مصروف / سداد جديد') }}</h3>
        </div>
        <button class="close-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <!-- نوع المعاملة كـ Segmented Control مدمج وعصري -->
        <div v-if="!isEditing" class="segmented-control">
          <button
            type="button"
            class="seg-btn seg-expense"
            :class="{ active: form.type === 'expense' }"
            @click="setType('expense')"
          >
            <span class="seg-icon">📤</span>
            <span class="seg-label">مصروف / مدفوعات</span>
          </button>
          <button
            type="button"
            class="seg-btn seg-income"
            :class="{ active: form.type === 'income' }"
            @click="setType('income')"
          >
            <span class="seg-icon">📥</span>
            <span class="seg-label">إيراد / مقبوضات</span>
          </button>
        </div>

        <!-- 1. الصف الأول: الخزينة والتصنيف -->
        <div class="form-grid">
          <!-- الخزينة / الحساب المالي -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label required">الخزينة / الحساب المالي</label>
              <span
                v-if="selectedAccount"
                class="badge-balance"
                :class="isInsufficientBalance ? 'balance-insufficient' : 'balance-ok'"
              >
                <span class="badge-label">المتاح:</span>
                <bdi class="badge-amount">{{ Number(availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ selectedAccount.currency }}</bdi>
              </span>
            </div>
            <select v-model="form.account_id" required class="form-select" @change="validateAmount(true)">
              <option value="" disabled>اختر الخزينة أو الحساب</option>
              <option v-for="acc in activeAccounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} [{{ Number(acc.current_balance || acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ acc.currency }}]
              </option>
            </select>
          </div>

          <!-- القسم / التصنيف -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label required">القسم / التصنيف</label>
            </div>
            <select v-model="form.category_id" required class="form-select" @change="onCategoryChanged">
              <option value="" disabled>اختر القسم المالي</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.icon || '📁' }} {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- ================= قسم خاص بالرواتب والأجور ================= -->
        <div v-if="form.type === 'expense' && isSalaryCategory" class="contextual-box salary-box">
          <div class="box-title">
            <span>💼</span>
            <h4>بيانات صرف الراتب والأجور</h4>
          </div>

          <div class="form-grid">
            <!-- اختيار نوع الموظف -->
            <div class="form-group full-width">
              <div class="form-label-row">
                <label class="form-label required">نوع المستفيد</label>
              </div>
              <div class="radio-toggle-group">
                <label class="radio-pill" :class="{ selected: salaryEntityType === 'system' }">
                  <input type="radio" value="system" v-model="salaryEntityType" />
                  <span>👤 موظف مسجل بالنظام</span>
                </label>
                <label class="radio-pill" :class="{ selected: salaryEntityType === 'external' }">
                  <input type="radio" value="external" v-model="salaryEntityType" />
                  <span>🤝 مستفيد / متعاقد خارجي (فريلانسر)</span>
                </label>
              </div>
            </div>

            <!-- اختيار الموظف أو كتابة الاسم الخارجي (اليمين) -->
            <div v-if="salaryEntityType === 'system'" class="form-group">
              <div class="form-label-row">
                <label class="form-label required">اسم الموظف</label>
              </div>
              <select v-model="selectedUserId" required class="form-select" @change="onUserSelected">
                <option value="" disabled>اختر الموظف من القائمة</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.job_title || user.email }}){{ (user.salary || user.base_salary) ? ' — [الراتب: ' + Number(user.salary || user.base_salary).toLocaleString() + ' ج.م]' : '' }}
                </option>
              </select>
              <div v-if="selectedUserId && isSalaryCategory" class="employee-salary-meta">
                <span v-if="selectedUserSalaryInfo" class="salary-detected-tag">
                  💵 الراتب المعتمد: <strong>{{ selectedUserSalaryInfo }}</strong>
                </span>
                <span v-else class="salary-missing-tag">
                  ⚠️ لم يتم تسجيل راتب أساسي لهذا الموظف في ملفه الوظيفي
                </span>
              </div>
            </div>
            <div v-else class="form-group">
              <div class="form-label-row">
                <label class="form-label required">اسم المستفيد الخارجي</label>
              </div>
              <input
                v-model="form.beneficiary_name"
                type="text"
                maxlength="200"
                required
                class="form-input"
                placeholder="الاسم الثلاثي أو اسم الجهة"
              />
            </div>

            <!-- شهر الراتب المستحق (اليسار) -->
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label required">شهر الراتب المستحق</label>
              </div>
              <input
                v-model="form.salary_month"
                type="month"
                required
                class="form-input"
                @change="checkSalaryDuplicate"
              />
            </div>
          </div>

          <!-- تنبيه وقفل الازدواجية الحاسم -->
          <div v-if="isSalaryDuplicate" class="alert-box alert-blocked-danger">
            <span class="danger-icon">⛔</span>
            <div>
              <strong>محظور: تم صرف راتب هذا الشهر مسبقاً!</strong>
              <p>{{ salaryDuplicateWarning }}</p>
              <div v-if="salaryDuplicateDetails" class="duplicate-pills">
                <span class="dup-pill">📄 رقم السند: <b>{{ salaryDuplicateDetails.transaction_number }}</b></span>
                <span v-if="salaryDuplicateDetails.transaction_date" class="dup-pill">📅 التاريخ: <b>{{ salaryDuplicateDetails.transaction_date }}</b></span>
                <span v-if="salaryDuplicateDetails.amount" class="dup-pill">💰 المبلغ: <b>{{ Number(salaryDuplicateDetails.amount).toLocaleString() }} ج.م</b></span>
                <span v-if="salaryDuplicateDetails.payment_method" class="dup-pill">💳 وسيلة الدفع: <b>{{ salaryDuplicateDetails.payment_method }}</b></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= قسم خاص بمقبوضات العملاء ================= -->
        <div v-if="form.type === 'income'" class="contextual-box income-box">
          <div class="box-title">
            <span>🏢</span>
            <h4>بيانات العميل والإيراد</h4>
          </div>

          <div class="form-grid">
            <!-- نوع الجهة الدافعة -->
            <div class="form-group full-width">
              <div class="form-label-row">
                <label class="form-label required">مصدر الإيراد</label>
              </div>
              <div class="radio-toggle-group">
                <label class="radio-pill" :class="{ selected: clientEntityType === 'system' }">
                  <input type="radio" value="system" v-model="clientEntityType" />
                  <span>🏢 عميل مسجل بالنظام</span>
                </label>
                <label class="radio-pill" :class="{ selected: clientEntityType === 'external' }">
                  <input type="radio" value="external" v-model="clientEntityType" />
                  <span>🌐 جهة أو عميل خارجي</span>
                </label>
              </div>
            </div>

            <!-- اختيار العميل أو كتابة الاسم (اليمين) -->
            <div v-if="clientEntityType === 'system'" class="form-group">
              <div class="form-label-row">
                <label class="form-label required">اسم العميل / الشركة</label>
              </div>
              <select v-model="selectedClientId" required class="form-select" @change="onClientSelected">
                <option value="" disabled>اختر العميل من القائمة</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }}
                </option>
              </select>
            </div>
            <div v-else class="form-group">
              <div class="form-label-row">
                <label class="form-label required">اسم الجهة أو المستفيد</label>
              </div>
              <input
                v-model="form.beneficiary_name"
                type="text"
                maxlength="200"
                required
                class="form-input"
                placeholder="اسم الشخص أو الشركة الدافعة"
              />
            </div>

            <!-- طبيعة الإيراد (اليسار) -->
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label required">طبيعة الإيراد</label>
              </div>
              <select v-model="form.revenue_nature" required class="form-select">
                <option value="recurring_retainer">عقد شهري مستمر (Retainer)</option>
                <option value="project_milestone">دفعة مشروع محدد (Milestone)</option>
                <option value="consultation">استشارة / خدمة إضافية</option>
                <option value="other">إيراد آخر</option>
              </select>
            </div>
          </div>

          <!-- تنبيه سداد العقد الشهري المستمر وتأكيد الإضافة -->
          <div v-if="hasRetainerDuplicate" class="alert-box alert-retainer-warning">
            <div class="warning-header">
              <span class="warning-icon">⚠️</span>
              <div>
                <strong>تنبيه: تم سداد العقد الشهري لهذا العميل مسبقاً!</strong>
                <p class="warning-desc">{{ retainerDuplicateWarning }}</p>
              </div>
            </div>

            <div v-if="retainerDuplicateDetails" class="duplicate-pills">
              <span class="dup-pill dup-pill-amber">📄 رقم السند: <b>{{ retainerDuplicateDetails.transaction_number }}</b></span>
              <span class="dup-pill dup-pill-amber">📅 التاريخ: <b>{{ retainerDuplicateDetails.transaction_date }}</b></span>
              <span class="dup-pill dup-pill-amber">💰 المبلغ المسدد: <b>{{ Number(retainerDuplicateDetails.amount || 0).toLocaleString() }} ج.م</b></span>
              <span v-if="retainerDuplicateDetails.account_name" class="dup-pill dup-pill-amber">🏦 الخزينة: <b>{{ retainerDuplicateDetails.account_name }}</b></span>
            </div>

            <!-- شريط اتخاذ القرار -->
            <div class="retainer-decision-bar">
              <div class="decision-text">
                <span class="decision-prompt">❓ هل أنت متأكد من رغبتك في إضافة دفعة أخرى لهذا العميل عن نفس الشهر؟</span>
                <small v-if="retainerConfirmedByUser" class="confirmed-tag">✓ تم التأكيد من قِبلك: مسموح لك بالمتابعة وحفظ الدفعة الثانية.</small>
              </div>

              <div class="decision-actions">
                <button
                  type="button"
                  class="btn-decision btn-confirm"
                  :class="{ 'btn-confirmed': retainerConfirmedByUser }"
                  @click="confirmRetainerDuplicate"
                >
                  <span v-if="retainerConfirmedByUser">✓ نعم، متأكد (تم التأكيد)</span>
                  <span v-else>نعم، متأكد وأرغب في الإضافة</span>
                </button>
                <button
                  type="button"
                  class="btn-decision btn-cancel-close"
                  @click="cancelAndCloseModal"
                >
                  ✕ لا، تراجع وإغلاق
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- المستفيد لأي مصروف آخر غير الرواتب -->
        <div v-if="form.type === 'expense' && !isSalaryCategory" class="form-group">
          <div class="form-label-row">
            <label class="form-label">الجهة / المستفيد من السداد</label>
            <span class="text-hint">(اختياري)</span>
          </div>
          <input
            v-model="form.beneficiary_name"
            type="text"
            maxlength="200"
            class="form-input"
            placeholder="مثال: شركة الكهرباء، أدوبي، فندق، اسم المورد..."
          />
        </div>

        <!-- 2. الصف المالي: المبلغ وتاريخ المعاملة -->
        <div class="form-grid">
          <!-- المبلغ المالي (اليمين) -->
          <div class="form-group amount-group">
            <div class="form-label-row">
              <label class="form-label required">المبلغ المالي</label>
              <span v-if="isFixedCategory" class="locked-amount-badge">🔒 مصروف ثابت محدد</span>
            </div>
            <div class="input-with-currency">
              <input
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                max="999999999.99"
                required
                :readonly="isFixedCategory"
                :class="{ 'readonly-locked': isFixedCategory }"
                class="form-input amount-input"
                placeholder="0.00"
                @input="validateAmount(true)"
              />
              <span class="currency-tag">{{ form.currency || 'EGP' }}</span>
            </div>
            <small v-if="isFixedCategory" class="fixed-category-hint">
              🔒 تم استدعاء المبلغ تلقائياً وفقاً لإعدادات قسم ({{ selectedCategory?.name }}). لتعديل القيمة الثابتة، يرجى التوجه لتبويب "أقسام وتصنيفات الحسابات".
            </small>
            <small v-else-if="amountError" class="field-error">{{ amountError }}</small>
          </div>

          <!-- تاريخ المعاملة (اليسار) -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label required">تاريخ المعاملة</label>
              <span class="text-hint">(سابق أو حالي)</span>
            </div>
            <input
              v-model="form.transaction_date"
              type="date"
              required
              class="form-input"
            />
          </div>
        </div>

        <!-- تنبيه الرصيد غير الكافي ومنع الرصيد السالب -->
        <div v-if="isInsufficientBalance" class="alert-box alert-danger">
          <span class="danger-icon">🚫</span>
          <div>
            <strong>غير مسموح برصيد سالب (الرصيد غير كافٍ):</strong>
            <p>
              رصيد الحساب / المحفظة المحددة (<strong>{{ selectedAccount?.name }}</strong>) هو
              <strong>{{ Number(availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ selectedAccount?.currency }}</strong>،
              بينما المبلغ المطلوب صرفه هو <strong>{{ Number(form.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} {{ selectedAccount?.currency }}</strong>.
              يرجى اختيار وسيلة دفع أخرى يتوفر بها رصيد كافٍ أو شحن الحساب.
            </p>
          </div>
        </div>

        <!-- 3. الصف الإضافي: رقم المرجع والبيان -->
        <div class="form-grid">
          <!-- رقم الإيصال / المرجع (اليمين) -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">رقم المرجع / الإيصال</label>
              <span class="text-hint">(اختياري)</span>
            </div>
            <input
              v-model="form.reference_number"
              type="text"
              maxlength="100"
              class="form-input"
              placeholder="مثال: REF-98432 أو رقم الشيك"
            />
          </div>

          <!-- البيان / ملاحظات إضافية (اليسار) -->
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">البيان / ملاحظات</label>
              <span class="text-hint">(اختياري)</span>
            </div>
            <input
              v-model="form.notes"
              type="text"
              maxlength="1000"
              class="form-input"
              placeholder="أي تفاصيل توضيحية للمعاملة..."
            />
          </div>
        </div>

        <!-- المرفقات والمستندات (شريط مدمج وأنيق) -->
        <div class="form-group">
          <div class="file-dropzone compact-dropzone" @click="triggerFileInput">
            <input
              ref="fileInputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              class="hidden-file-input"
              @change="onFileSelected"
            />
            <div v-if="!attachmentFile && !form.existing_attachment_name" class="dropzone-content">
              <span class="upload-icon">📎</span>
              <span>إرفاق مستند أو إيصال تحويل (PDF أو صورة حتى 10MB - اختياري)</span>
            </div>
            <div v-else class="file-chosen-bar">
              <div class="chosen-meta">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ attachmentFile ? attachmentFile.name : form.existing_attachment_name }}</span>
              </div>
              <button type="button" class="remove-file-btn" @click.stop="clearFile">✕ حذف الملف</button>
            </div>
          </div>
        </div>

        <!-- أزرار الإجراءات -->
        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
          <button
            type="submit"
            class="save-btn"
            :class="form.type === 'income' ? 'btn-income' : (isSalaryDuplicate ? 'btn-blocked' : 'btn-expense')"
            :disabled="submitting || isInsufficientBalance || isSalaryDuplicate"
          >
            <span v-if="submitting" class="spinner"></span>
            <span v-else-if="isSalaryDuplicate">محظور: تم صرف الراتب مسبقاً ⛔</span>
            <span v-else-if="form.type === 'income' && hasRetainerDuplicate && !retainerConfirmedByUser">تأكيد وتسجيل القبض ⚠️</span>
            <span v-else>{{ isEditing ? 'حفظ التعديلات 💾' : (form.type === 'income' ? 'تسجيل القبض 📥' : 'تسجيل الصرف 📤') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  transaction: { type: Object, default: null },
  defaultType: { type: String, default: 'expense' },
  accounts: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  clients: { type: Array, default: () => [] },
  prefilledUser: { type: Object, default: null },
  prefilledClient: { type: Object, default: null },
  prefilledCategory: { type: [Object, Number, String], default: null },
  prefilledAccount: { type: [Object, Number, String], default: null },
  prefilledMonth: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.transaction && !!props.transaction.id)
const submitting = ref(false)
const amountError = ref('')
const fileInputRef = ref(null)
const attachmentFile = ref(null)

const salaryEntityType = ref('system')
const clientEntityType = ref('system')
const selectedUserId = ref('')
const selectedClientId = ref('')
const salaryDuplicateWarning = ref('')
const isSalaryDuplicate = ref(false)
const salaryDuplicateDetails = ref(null)

const retainerDuplicateWarning = ref('')
const hasRetainerDuplicate = ref(false)
const retainerDuplicateDetails = ref(null)
const retainerConfirmedByUser = ref(false)
const isCheckingRetainer = ref(false)

// دوال مساعدة لتواريخ محلية دقيقة وتجنب مشاكل الـ Timezone
const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getLocalMonthString = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const form = reactive({
  type: 'expense',
  amount: '',
  currency: 'EGP',
  account_id: '',
  category_id: '',
  payment_method: 'cash',
  transaction_date: getLocalDateString(),
  reference_number: '',
  notes: '',
  beneficiary_name: '',
  entity_type: null,
  entity_id: null,
  revenue_nature: 'recurring_retainer',
  salary_month: getLocalMonthString(),
  existing_attachment_name: '',
})

const activeAccounts = computed(() => {
  return props.accounts.filter(a => a.is_active !== false)
})

const selectedAccount = computed(() => {
  return props.accounts.find(a => a.id == form.account_id)
})

const availableBalance = computed(() => {
  if (!selectedAccount.value) return 0
  let bal = Number(selectedAccount.value.current_balance ?? selectedAccount.value.balance ?? 0)
  if (isEditing.value && props.transaction && props.transaction.account_id == form.account_id && props.transaction.status === 'completed') {
    if (props.transaction.type === 'expense') {
      bal += Number(props.transaction.amount || 0)
    } else {
      bal -= Number(props.transaction.amount || 0)
    }
  }
  return bal
})

const isInsufficientBalance = computed(() => {
  if (form.type !== 'expense') return false
  if (!form.account_id || !form.amount) return false
  const amt = Number(form.amount)
  if (isNaN(amt) || amt <= 0) return false
  return amt > availableBalance.value
})

const mapAccountToPaymentMethod = (account) => {
  if (!account) return 'cash'
  const type = account.type?.value || account.type || ''
  const name = (account.name || '').toLowerCase()
  if (name.includes('insta') || name.includes('إنستا')) return 'instapay'
  if (name.includes('voda') || name.includes('فودافون') || name.includes('كاش')) return 'vodafone_cash'
  if (type === 'bank' || name.includes('بنك') || name.includes('bank')) return 'bank_transfer'
  if (type === 'pos' || name.includes('فيزا') || name.includes('visa') || name.includes('card')) return 'credit_card'
  if (type === 'cash') return 'cash'
  if (type === 'wallet') return 'vodafone_cash'
  return 'other'
}

watch(() => form.account_id, (newId) => {
  const acc = props.accounts.find(a => a.id == newId)
  if (acc) {
    form.payment_method = mapAccountToPaymentMethod(acc)
  }
}, { immediate: true })

const filteredCategories = computed(() => {
  return props.categories.filter(c => c.type === form.type && c.is_active !== false)
})

const selectedCategory = computed(() => {
  return props.categories.find(c => c.id == form.category_id)
})

const isFixedCategory = computed(() => {
  if (form.type !== 'expense') return false
  const cat = selectedCategory.value
  if (!cat) return false
  const isCostFixed = cat.cost_type === 'fixed' || cat.slug === 'office_rent'
  const hasFixedAmt = cat.fixed_amount !== null && cat.fixed_amount !== undefined && Number(cat.fixed_amount) > 0
  return isCostFixed && hasFixedAmt
})

const isSalaryCategory = computed(() => {
  const cat = selectedCategory.value
  return cat && (cat.slug === 'salaries' || cat.name?.includes('رواتب') || cat.name?.includes('أجور'))
})

const isRetainerCategory = computed(() => {
  const cat = selectedCategory.value
  if (!cat) return false
  const slug = (cat.slug || '').toLowerCase()
  const name = (cat.name || '').toLowerCase()
  return slug === 'client_monthly_retainers' || slug.includes('retainer') || name.includes('عقود شهرية') || name.includes('عقد شهري') || name.includes('retainer')
})

const setType = (type) => {
  form.type = type
  // Reset category if not matching
  const matchingCat = props.categories.find(c => c.type === type && c.is_active !== false)
  form.category_id = matchingCat ? matchingCat.id : ''
  if (isFixedCategory.value && selectedCategory.value?.fixed_amount) {
    form.amount = String(selectedCategory.value.fixed_amount)
    validateAmount(false)
  }
}

const onCategoryChanged = () => {
  if (isSalaryCategory.value) {
    if (!form.salary_month) {
      form.salary_month = getLocalMonthString()
    }
  }

  if (isFixedCategory.value && selectedCategory.value?.fixed_amount) {
    form.amount = String(selectedCategory.value.fixed_amount)
    validateAmount(false)
  }
}

watch(() => form.category_id, () => {
  onCategoryChanged()
})

const selectedUserSalaryInfo = computed(() => {
  if (salaryEntityType.value !== 'system' || !selectedUserId.value) return null
  const u = props.users.find(usr => Number(usr.id) === Number(selectedUserId.value))
  if (!u) return null
  const sal = u.salary ?? u.base_salary
  if (sal !== null && sal !== undefined && sal !== '' && Number(sal) > 0) {
    return Number(sal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م'
  }
  return null
})

const onUserSelected = () => {
  const u = props.users.find(usr => Number(usr.id) === Number(selectedUserId.value))
  if (u) {
    form.entity_type = 'App\\Models\\User'
    form.entity_id = u.id
    form.beneficiary_name = u.name
    // عند اختيار أو تغيير الموظف، يتم تحديث المبلغ فورياً إلى راتب هذا الموظف الحقيقي
    const userSalary = u.salary ?? u.base_salary
    if (userSalary !== null && userSalary !== undefined && userSalary !== '' && Number(userSalary) > 0) {
      form.amount = String(userSalary)
    } else {
      // تفريغ الحقل إذا لم يكن للموظف راتب مسجل لمنع صرف راتب موظف آخر بالخطأ
      form.amount = ''
    }
    validateAmount(false)
    checkSalaryDuplicate()
  }
}

const onClientSelected = () => {
  if (!selectedClientId.value) {
    form.entity_type = null
    form.entity_id = null
    form.beneficiary_name = ''
    return
  }
  const c = props.clients.find(cl => Number(cl.id) === Number(selectedClientId.value))
  if (c) {
    form.entity_type = 'App\\Models\\Client'
    form.entity_id = c.id
    form.beneficiary_name = c.name
  } else if (props.prefilledClient && Number(props.prefilledClient.id || props.prefilledClient.client_id) === Number(selectedClientId.value)) {
    form.entity_type = 'App\\Models\\Client'
    form.entity_id = props.prefilledClient.id || props.prefilledClient.client_id
    form.beneficiary_name = props.prefilledClient.name || props.prefilledClient.client_name || ''
  }
}

const checkSalaryDuplicate = async () => {
  if (!props.show) return
  if (form.type !== 'expense' || !isSalaryCategory.value || salaryEntityType.value !== 'system' || !selectedUserId.value || !form.salary_month) {
    salaryDuplicateWarning.value = ''
    isSalaryDuplicate.value = false
    salaryDuplicateDetails.value = null
    return
  }

  try {
    const params = {
      user_id: selectedUserId.value,
      salary_month: form.salary_month,
    }
    if (isEditing.value && props.transaction?.id) {
      params.transaction_id = props.transaction.id
    }

    const res = await api.get('/finance/salaries/check-status', { params })
    const data = res.data?.data

    if (data?.is_paid) {
      isSalaryDuplicate.value = true
      const existing = data.existing_transaction || data
      salaryDuplicateDetails.value = existing
      const amountFormatted = Number(existing.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      salaryDuplicateWarning.value = `تم بالفعل صرف وتسجيل راتب هذا الموظف لشهر (${form.salary_month}) مسبقاً بموجب المعاملة رقم [${existing.transaction_number || ''}] بمبلغ ${amountFormatted} ج.م. يمنع النظام صرف الراتب مرتين لنفس الشهر منعاً للازدواجية المالية.`
    } else {
      isSalaryDuplicate.value = false
      salaryDuplicateDetails.value = null
      salaryDuplicateWarning.value = ''
    }
  } catch (err) {
    console.error('Error checking salary status:', err)
  }
}

watch(salaryEntityType, () => {
  checkSalaryDuplicate()
})

watch(() => form.salary_month, () => {
  checkSalaryDuplicate()
})

watch(selectedUserId, () => {
  checkSalaryDuplicate()
})

const checkClientRetainer = async () => {
  if (!props.show) return

  if (form.type !== 'income' || clientEntityType.value !== 'system' || !selectedClientId.value) {
    hasRetainerDuplicate.value = false
    retainerDuplicateWarning.value = ''
    retainerDuplicateDetails.value = null
    retainerConfirmedByUser.value = false
    return
  }

  const isRetainer = (form.revenue_nature === 'recurring_retainer' || isRetainerCategory.value)
  if (!isRetainer || !form.transaction_date) {
    hasRetainerDuplicate.value = false
    retainerDuplicateWarning.value = ''
    retainerDuplicateDetails.value = null
    retainerConfirmedByUser.value = false
    return
  }

  const month = form.transaction_date.slice(0, 7)
  try {
    isCheckingRetainer.value = true
    const params = { month }
    if (isEditing.value && props.transaction?.id) {
      params.transaction_id = props.transaction.id
    }

    const res = await api.get(`/finance/clients/${selectedClientId.value}/check-retainer`, { params })
    const data = res.data?.data

    if (data?.has_paid_retainer && data?.existing_transaction) {
      hasRetainerDuplicate.value = true
      retainerDuplicateDetails.value = data.existing_transaction
      const amt = Number(data.existing_transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      retainerDuplicateWarning.value = `تم سداد إيراد العقد الشهري المستمر لهذا العميل مسبقاً لشهر (${month}) بموجب المعاملة رقم [${data.existing_transaction.transaction_number}] بمبلغ ${amt} ج.م بتاريخ ${data.existing_transaction.transaction_date}.`
    } else {
      hasRetainerDuplicate.value = false
      retainerDuplicateWarning.value = ''
      retainerDuplicateDetails.value = null
      retainerConfirmedByUser.value = false
    }
  } catch (err) {
    console.error('Error checking client retainer status:', err)
  } finally {
    isCheckingRetainer.value = false
  }
}

const confirmRetainerDuplicate = () => {
  retainerConfirmedByUser.value = true
  alertService.toast('✓ تم تأكيد رغبتك في إضافة دفعة ثانية، يمكنك الآن حفظ المعاملة.', 'info')
}

const cancelAndCloseModal = () => {
  hasRetainerDuplicate.value = false
  retainerConfirmedByUser.value = false
  retainerDuplicateWarning.value = ''
  retainerDuplicateDetails.value = null
  emit('close')
}

watch([
  () => form.type,
  clientEntityType,
  selectedClientId,
  () => form.revenue_nature,
  () => form.category_id,
  () => form.transaction_date,
], () => {
  if (!props.show) return
  retainerConfirmedByUser.value = false
  checkClientRetainer()
})

const validateAmount = (touched = false) => {
  if (!form.amount || Number(form.amount) <= 0) {
    if (touched || (form.amount !== '' && form.amount !== null && form.amount !== undefined)) {
      amountError.value = 'يرجى إدخال مبلغ مالي أكبر من صفر.'
    } else {
      amountError.value = ''
    }
  } else if (Number(form.amount) > 999999999.99) {
    amountError.value = 'المبلغ يتجاوز الحد الأقصى المسموح به.'
  } else if (isInsufficientBalance.value) {
    amountError.value = `رصيد (${selectedAccount.value?.name || 'وسيلة الدفع'}) غير كافٍ! المتاح: ${Number(availableBalance.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedAccount.value?.currency || 'EGP'}`
  } else {
    amountError.value = ''
  }
}

watch([() => form.type, () => form.amount, () => form.account_id], () => {
  validateAmount(false)
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    alertService.toast('⚠️ حجم الملف يجب ألا يتجاوز 10 ميجابايت', 'warning')
    return
  }
  attachmentFile.value = file
}

const clearFile = () => {
  attachmentFile.value = null
  form.existing_attachment_name = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const initForm = () => {
  amountError.value = ''
  attachmentFile.value = null
  salaryDuplicateWarning.value = ''
  isSalaryDuplicate.value = false
  salaryDuplicateDetails.value = null
  retainerDuplicateWarning.value = ''
  hasRetainerDuplicate.value = false
  retainerDuplicateDetails.value = null
  retainerConfirmedByUser.value = false
  isCheckingRetainer.value = false
  selectedClientId.value = ''
  clientEntityType.value = 'system'
  selectedUserId.value = ''
  salaryEntityType.value = 'system'

  if (props.transaction) {
    const t = props.transaction
    form.type = t.type || 'expense'
    form.amount = t.amount || ''
    form.currency = t.currency || 'EGP'
    form.account_id = t.account_id || ''
    form.category_id = t.category_id || ''
    form.payment_method = t.payment_method || 'cash'
    form.transaction_date = t.transaction_date || getLocalDateString()
    form.reference_number = t.reference_number || ''
    form.notes = t.notes || ''
    form.beneficiary_name = t.beneficiary_name || ''
    form.entity_type = t.entity_type || null
    form.entity_id = t.entity_id || null
    form.revenue_nature = t.revenue_nature || 'recurring_retainer'
    form.salary_month = t.salary_month || getLocalMonthString()
    form.existing_attachment_name = t.attachment_name || ''

    if (t.entity_type?.includes('User')) {
      salaryEntityType.value = 'system'
      selectedUserId.value = t.entity_id
    } else if (t.entity_type?.includes('Client')) {
      clientEntityType.value = 'system'
      selectedClientId.value = t.entity_id
    } else {
      salaryEntityType.value = 'external'
      clientEntityType.value = 'external'
    }
  } else {
    form.type = props.defaultType || 'expense'
    form.amount = (props.prefilledUser?.salary || props.prefilledUser?.base_salary) ? String(props.prefilledUser.salary || props.prefilledUser.base_salary) : ''
    form.currency = 'EGP'

    // 1. تحديد الحساب المالي الافتراضي (البنك في حالة الرواتب)
    if (props.prefilledAccount) {
      const acc = typeof props.prefilledAccount === 'object' ? props.prefilledAccount : props.accounts.find(a => a.id == props.prefilledAccount)
      form.account_id = acc ? acc.id : (props.accounts[0]?.id || '')
    } else if (props.prefilledUser) {
      // عند صرف الراتب، اختيار الحساب البنكي بصورة افتراضية
      const bankAcc = props.accounts.find(a =>
        a.is_active !== false &&
        ((a.type?.value || a.type) === 'bank' || (a.name || '').includes('بنك') || (a.name || '').toLowerCase().includes('bank'))
      )
      form.account_id = bankAcc ? bankAcc.id : (props.accounts[0]?.id || '')
    } else {
      form.account_id = props.accounts[0]?.id || ''
    }

    // 2. تحديد القسم المالي الافتراضي (الرواتب والأجور في حالة صرف الراتب)
    if (props.prefilledCategory) {
      const cat = typeof props.prefilledCategory === 'object' ? props.prefilledCategory : props.categories.find(c => c.id == props.prefilledCategory)
      form.category_id = cat ? cat.id : ''
    } else if (props.prefilledUser) {
      // عند صرف الراتب، اختيار قسم الرواتب والأجور بصورة افتراضية
      const salCat = props.categories.find(c =>
        c.type === 'expense' &&
        (c.slug === 'salaries' || (c.name || '').includes('رواتب') || (c.name || '').includes('أجور'))
      )
      form.category_id = salCat ? salCat.id : ''
    } else {
      const defaultCat = props.categories.find(c => c.type === form.type && c.is_active !== false)
      form.category_id = defaultCat ? defaultCat.id : ''
    }

    const currentAcc = props.accounts.find(a => a.id == form.account_id) || props.accounts[0]
    form.payment_method = mapAccountToPaymentMethod(currentAcc)
    form.transaction_date = getLocalDateString()
    form.reference_number = ''
    form.notes = ''
    form.beneficiary_name = ''
    form.entity_type = null
    form.entity_id = null
    form.revenue_nature = 'recurring_retainer'
    form.salary_month = props.prefilledMonth || getLocalMonthString()
    form.existing_attachment_name = ''

    if (props.prefilledUser) {
      salaryEntityType.value = 'system'
      const matchedUser = props.users.find(u => Number(u.id) === Number(props.prefilledUser.id))
      selectedUserId.value = matchedUser ? matchedUser.id : props.prefilledUser.id
      form.entity_type = 'App\\Models\\User'
      form.entity_id = selectedUserId.value
      form.beneficiary_name = matchedUser?.name || props.prefilledUser.name || ''
      const effectiveSalary = props.prefilledUser.salary ?? props.prefilledUser.base_salary ?? matchedUser?.salary ?? matchedUser?.base_salary
      if (effectiveSalary !== null && effectiveSalary !== undefined && effectiveSalary !== '' && Number(effectiveSalary) > 0) {
        form.amount = String(effectiveSalary)
      }
      checkSalaryDuplicate()
    } else if (props.prefilledClient) {
      clientEntityType.value = 'system'
      const cId = props.prefilledClient.id || props.prefilledClient.client_id
      selectedClientId.value = cId
      form.entity_type = 'App\\Models\\Client'
      form.entity_id = cId
      form.beneficiary_name = props.prefilledClient.name || props.prefilledClient.client_name || ''
      const matchedClient = props.clients.find(c => Number(c.id) === Number(cId))
      if (matchedClient) {
        form.beneficiary_name = matchedClient.name
      }
      checkClientRetainer()
    }

    onCategoryChanged()
  }
}

watch(() => props.show, (val) => {
  if (val) initForm()
})

const submitForm = async () => {
  validateAmount(true)
  if (amountError.value || isInsufficientBalance.value) {
    alertService.toast(`❌ رصيد (${selectedAccount.value?.name || 'وسيلة الدفع'}) غير كافٍ لإتمام عملية الصرف، وغير مسموح بأن يصبح الرصيد سالباً!`, 'error')
    return
  }

  if (isSalaryDuplicate.value) {
    alertService.toast(`❌ محظور: تم صرف راتب شهر (${form.salary_month}) لهذا الموظف مسبقاً، ويمنع النظام ازدواجية صرف الراتب!`, 'error')
    return
  }

  // إذا كان فحص العقد الشهري جارياً، انتظر حتى يكتمل الفحص لتفادي أي سباق برمجياً
  if (isCheckingRetainer.value) {
    let waitCount = 0
    while (isCheckingRetainer.value && waitCount < 30) {
      await new Promise(r => setTimeout(r, 100))
      waitCount++
    }
  }

  // التأكد من فحص العقد الشهري قبل المتابعة في حال لم يكن قد فُحص بعد
  const isRetainer = (form.revenue_nature === 'recurring_retainer' || isRetainerCategory.value)
  if (form.type === 'income' && clientEntityType.value === 'system' && selectedClientId.value && isRetainer && !retainerConfirmedByUser.value && !hasRetainerDuplicate.value) {
    await checkClientRetainer()
  }

  // فحص تنبيه تكرار سداد العقد الشهري المستمر للعميل وتأكيده مع المستخدم
  if (hasRetainerDuplicate.value && !retainerConfirmedByUser.value) {
    const month = form.transaction_date ? form.transaction_date.slice(0, 7) : ''
    const existingNum = retainerDuplicateDetails.value?.transaction_number || ''
    const existingAmt = Number(retainerDuplicateDetails.value?.amount || 0).toLocaleString()
    const existingDate = retainerDuplicateDetails.value?.transaction_date || ''

    const confirmed = await alertService.confirm({
      title: 'تنبيه مالي: سداد العقد الشهري مسبقاً',
      message: `تم سداد إيراد العقد الشهري المستمر لهذا العميل مسبقاً لشهر (${month})${existingNum ? ` بموجب المعاملة رقم [${existingNum}]` : ''}${existingAmt ? ` بمبلغ ${existingAmt} ج.م` : ''}${existingDate ? ` بتاريخ ${existingDate}` : ''}.\n\nهل أنت متأكد من رغبتك في إضافة دفعة أخرى لهذا العميل عن نفس الشهر؟`,
      type: 'warning',
      confirmText: 'نعم، متأكد وأرغب في الإضافة',
      cancelText: 'لا، تراجع وإغلاق'
    })

    if (confirmed) {
      retainerConfirmedByUser.value = true
    } else {
      emit('close')
      return
    }
  }

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('type', form.type)
    formData.append('amount', form.amount)
    formData.append('currency', form.currency)
    formData.append('account_id', form.account_id)
    formData.append('category_id', form.category_id)
    formData.append('payment_method', form.payment_method || mapAccountToPaymentMethod(selectedAccount.value) || 'cash')
    formData.append('transaction_date', form.transaction_date)

    if (form.reference_number) formData.append('reference_number', form.reference_number)
    if (form.notes) formData.append('notes', form.notes)

    // Salary specific
    if (form.type === 'expense' && isSalaryCategory.value) {
      formData.append('salary_month', form.salary_month)
      if (salaryEntityType.value === 'system') {
        formData.append('entity_type', 'App\\Models\\User')
        formData.append('entity_id', selectedUserId.value)
        formData.append('user_id', selectedUserId.value)
        if (form.beneficiary_name) formData.append('beneficiary_name', form.beneficiary_name)
      } else {
        formData.append('beneficiary_name', form.beneficiary_name)
      }
    } else if (form.type === 'income') {
      // Income specific
      formData.append('revenue_nature', form.revenue_nature)
      if (retainerConfirmedByUser.value) {
        formData.append('allow_duplicate_retainer', '1')
      }
      if (clientEntityType.value === 'system' && selectedClientId.value) {
        formData.append('entity_type', 'App\\Models\\Client')
        formData.append('entity_id', selectedClientId.value)
        formData.append('client_id', selectedClientId.value)
        if (form.beneficiary_name) formData.append('beneficiary_name', form.beneficiary_name)
      } else {
        formData.append('beneficiary_name', form.beneficiary_name)
      }
    } else {
      if (form.beneficiary_name) formData.append('beneficiary_name', form.beneficiary_name)
    }

    if (attachmentFile.value) {
      formData.append('attachment', attachmentFile.value)
    }

    let res
    if (isEditing.value) {
      res = await api.post(`/finance/transactions/${props.transaction.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alertService.toast('✅ تم تحديث المعاملة بنجاح', 'success')
    } else {
      res = await api.post('/finance/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alertService.toast('✅ تم تسجيل المعاملة المالية بنجاح', 'success')
    }

    emit('saved', res.data?.data)
    emit('close')
  } catch (err) {
    const errorData = err.response?.data
    let msg = ''

    if (errorData?.errors && typeof errorData.errors === 'object') {
      if (errorData.errors.revenue_nature) {
        hasRetainerDuplicate.value = true
        msg = Array.isArray(errorData.errors.revenue_nature) ? errorData.errors.revenue_nature[0] : errorData.errors.revenue_nature
      } else if (errorData.errors.salary_month) {
        msg = Array.isArray(errorData.errors.salary_month) ? errorData.errors.salary_month[0] : errorData.errors.salary_month
      } else if (errorData.errors.amount) {
        msg = Array.isArray(errorData.errors.amount) ? errorData.errors.amount[0] : errorData.errors.amount
      } else if (errorData.errors.beneficiary_name) {
        msg = Array.isArray(errorData.errors.beneficiary_name) ? errorData.errors.beneficiary_name[0] : errorData.errors.beneficiary_name
      } else if (errorData.errors.category_id) {
        msg = Array.isArray(errorData.errors.category_id) ? errorData.errors.category_id[0] : errorData.errors.category_id
      } else if (errorData.errors.account_id) {
        msg = Array.isArray(errorData.errors.account_id) ? errorData.errors.account_id[0] : errorData.errors.account_id
      } else {
        const firstErr = Object.values(errorData.errors).flat()[0]
        if (firstErr) msg = firstErr
      }
    }

    if (!msg && errorData?.message) {
      msg = errorData.message
    }

    // تنقية الرسالة ومنع ظهور أي شفرات برمجية أو رسائل خطأ غير مفهومة للمستخدم نهائياً
    const isTechnical = !msg ||
      msg.includes('SQLSTATE') ||
      msg.includes('QueryException') ||
      msg.includes('syntax error') ||
      msg.includes('The given data was invalid') ||
      msg.includes('The selected revenue nature is invalid') ||
      msg.includes('The revenue nature field is invalid') ||
      msg.includes('App\\') ||
      msg.includes('vendor/') ||
      msg.includes('.php') ||
      msg.includes('at line') ||
      msg.includes('Stack trace')

    if (isTechnical) {
      msg = 'تعذر إتمام العملية المالية، يرجى مراجعة البيانات المدخلة والمحاولة مجدداً.'
    }

    alertService.toast(`❌ ${msg}`, 'error', 4500)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.finance-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000 !important;
  background: rgba(3, 7, 24, 0.82);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  direction: rtl;
}

.finance-modal-card {
  width: min(800px, 95vw);
  background: linear-gradient(165deg, #10183b 0%, #0a0f29 100%);
  border: 1px solid rgba(135, 155, 230, 0.24);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.16);
  background: rgba(14, 22, 60, 0.55);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.badge-income {
  background: rgba(16, 185, 129, 0.18);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-expense {
  background: rgba(244, 63, 94, 0.18);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.35);
}

.header-title h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 17px;
  font-weight: 800;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.close-btn:hover {
  background: rgba(244, 63, 94, 0.22);
  color: #f43f5e;
  border-color: rgba(244, 63, 94, 0.4);
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: calc(88vh - 120px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(135, 155, 230, 0.28) rgba(14, 22, 60, 0.2);
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(14, 22, 60, 0.2);
  border-radius: 8px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(135, 155, 230, 0.28);
  border-radius: 8px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}

/* نوع المعاملة كـ Segmented Control أنيق ومدمج */
.segmented-control {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(6, 11, 35, 0.65);
  border: 1px solid rgba(135, 155, 230, 0.18);
  border-radius: 12px;
  padding: 4px;
  gap: 6px;
  height: 44px;
  box-sizing: border-box;
}

.seg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.seg-btn:hover:not(.active) {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.04);
}

.seg-btn.seg-expense.active {
  background: rgba(244, 63, 94, 0.18);
  color: #f43f5e;
  border-color: rgba(244, 63, 94, 0.38);
  box-shadow: 0 2px 8px rgba(244, 63, 94, 0.2);
}

.seg-btn.seg-income.active {
  background: rgba(16, 185, 129, 0.18);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.38);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.seg-icon {
  font-size: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 24px;
  margin-bottom: 2px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.2;
}

.form-label.required::after {
  content: " *";
  color: #f43f5e;
}

.text-hint {
  color: #64748b;
  font-size: 11px;
  font-weight: 500;
}

.form-input, .form-select, .form-textarea {
  background: rgba(7, 12, 34, 0.7);
  border: 1px solid rgba(135, 155, 230, 0.22);
  border-radius: 10px;
  padding: 8px 13px;
  color: #f8fafc;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  height: 42px;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #38bdf8;
  background: rgba(10, 18, 48, 0.9);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  background-size: 15px;
  padding-left: 36px;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="month"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
  cursor: pointer;
}

.input-with-currency {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.amount-input {
  width: 100%;
  padding-left: 55px;
  font-size: 15px;
  font-weight: 800;
  color: #38bdf8;
  height: 42px;
}

.amount-input.readonly-locked {
  background: rgba(14, 22, 60, 0.75) !important;
  border-color: rgba(56, 189, 248, 0.45) !important;
  color: #38bdf8 !important;
  cursor: not-allowed;
  font-weight: 800;
  box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.05);
}

.locked-amount-badge {
  font-size: 11px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.fixed-category-hint {
  display: block;
  font-size: 11.5px;
  color: #38bdf8;
  line-height: 1.5;
  margin-top: 5px;
  background: rgba(56, 189, 248, 0.06);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px dashed rgba(56, 189, 248, 0.25);
}

.currency-tag {
  position: absolute;
  left: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  pointer-events: none;
}

.field-error {
  color: #f43f5e;
  font-size: 11px;
  margin-top: 2px;
}

/* السياق المخصص للرواتب والعملاء */
.contextual-box {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.2);
  border-right: 4px solid #38bdf8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.salary-box {
  border-right-color: #f59e0b;
}

.income-box {
  border-right-color: #10b981;
}

.box-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 700;
}

.box-title h4 {
  margin: 0;
  font-size: 13px;
}

.radio-toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.radio-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(14, 22, 60, 0.45);
  border: 1px solid rgba(135, 155, 230, 0.18);
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  height: 38px;
  box-sizing: border-box;
}

.radio-pill input {
  display: none;
}

.radio-pill:hover {
  border-color: rgba(56, 189, 248, 0.35);
  color: #e2e8f0;
}

.radio-pill.selected {
  background: rgba(56, 189, 248, 0.12);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 12px;
}

.alert-warning {
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

.alert-warning p {
  margin: 3px 0 0;
  line-height: 1.45;
}

.alert-danger {
  background: rgba(244, 63, 94, 0.14);
  border: 1px solid rgba(244, 63, 94, 0.45);
  color: #fecdd3;
}

.alert-danger strong {
  color: #fda4af;
  font-size: 12.5px;
}

.alert-danger p {
  margin: 4px 0 0;
  line-height: 1.45;
  color: #ffe4e6;
}

.alert-blocked-danger {
  background: rgba(239, 68, 68, 0.16);
  border: 1.5px solid rgba(239, 68, 68, 0.6);
  color: #fee2e2;
}

.alert-blocked-danger strong {
  color: #fca5a5;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
}

.alert-blocked-danger p {
  margin: 0 0 8px;
  line-height: 1.5;
  color: #fecaca;
  font-size: 12px;
}

.duplicate-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.dup-pill {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  color: #f87171;
}

.dup-pill b {
  color: #ffffff;
}

.btn-blocked {
  background: #dc2626 !important;
  color: #ffffff !important;
  opacity: 0.65;
  cursor: not-allowed !important;
}

.alert-retainer-warning {
  margin-top: 14px;
  background: rgba(245, 158, 11, 0.12);
  border: 1.5px solid rgba(245, 158, 11, 0.55);
  color: #fef3c7;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
}

.alert-retainer-warning .warning-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.alert-retainer-warning .warning-icon {
  font-size: 20px;
  line-height: 1;
}

.alert-retainer-warning strong {
  color: #fbbf24;
  font-size: 13.5px;
  display: block;
  margin-bottom: 4px;
}

.alert-retainer-warning .warning-desc {
  margin: 0;
  line-height: 1.5;
  color: #fde68a;
  font-size: 12px;
}

.dup-pill-amber {
  background: rgba(15, 23, 42, 0.7) !important;
  border: 1px solid rgba(245, 158, 11, 0.45) !important;
  color: #fbbf24 !important;
}

.dup-pill-amber b {
  color: #ffffff !important;
}

.retainer-decision-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(245, 158, 11, 0.35);
}

.retainer-decision-bar .decision-prompt {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
}

.retainer-decision-bar .confirmed-tag {
  display: block;
  color: #34d399;
  font-weight: 600;
  margin-top: 3px;
  font-size: 11.5px;
}

.retainer-decision-bar .decision-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-decision {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-decision.btn-confirm {
  background: #f59e0b;
  color: #0f172a;
}

.btn-decision.btn-confirm:hover {
  background: #d97706;
}

.btn-decision.btn-confirm.btn-confirmed {
  background: #10b981;
  color: #ffffff;
}

.btn-decision.btn-cancel-close {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.btn-decision.btn-cancel-close:hover {
  background: rgba(239, 68, 68, 0.35);
  color: #ffffff;
}

.danger-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.badge-balance {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  direction: rtl;
  unicode-bidi: isolate;
  line-height: 1.25;
}

.badge-balance bdi {
  direction: ltr;
  unicode-bidi: isolate;
  font-weight: 800;
}

.badge-balance.balance-ok {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
}

.badge-balance.balance-insufficient {
  background: rgba(244, 63, 94, 0.25);
  border: 1px solid rgba(244, 63, 94, 0.5);
  color: #fb7185;
  animation: pulse-danger 1.5s infinite;
}

@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

/* الشريط المدمج لرفع الملفات */
.compact-dropzone {
  border: 1px dashed rgba(135, 155, 230, 0.3);
  border-radius: 10px;
  padding: 8px 14px;
  background: rgba(7, 12, 34, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  height: 42px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.compact-dropzone:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
}

.hidden-file-input {
  display: none;
}

.dropzone-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  width: 100%;
}

.upload-icon {
  font-size: 15px;
}

.file-chosen-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
}

.chosen-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #38bdf8;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
}

.remove-file-btn {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: #f43f5e;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s;
}

.remove-file-btn:hover {
  background: rgba(244, 63, 94, 0.28);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px;
  border-top: 1px solid rgba(135, 155, 230, 0.16);
  background: rgba(8, 13, 36, 0.65);
}

.cancel-btn {
  padding: 9px 18px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  transition: all 0.2s;
  height: 40px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.save-btn {
  padding: 9px 24px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
  transition: all 0.2s;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-income {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
}

.btn-income:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
}

.btn-expense {
  background: linear-gradient(135deg, #f43f5e, #e11d48);
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.28);
}

.btn-expense:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(244, 63, 94, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* التجاوب الفائق مع الشاشات الصغيرة والهواتف */
@media (max-width: 640px) {
  .finance-modal-overlay {
    padding: 8px;
  }
  .finance-modal-card {
    max-height: 96vh;
    border-radius: 14px;
  }
  .modal-header {
    padding: 12px 16px;
  }
  .header-title h3 {
    font-size: 15px;
  }
  .modal-body {
    padding: 14px 16px;
    gap: 12px;
    max-height: calc(96vh - 110px);
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .form-label-row {
    flex-wrap: wrap;
    gap: 6px;
  }
  .radio-toggle-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .modal-footer {
    padding: 12px 16px;
  }
  .save-btn, .cancel-btn {
    flex: 1;
  }
}

@media (max-width: 420px) {
  .finance-modal-overlay {
    padding: 4px;
  }
  .header-title h3 {
    font-size: 14px;
  }
  .modal-badge {
    font-size: 10.5px;
    padding: 2px 7px;
  }
  .seg-btn {
    font-size: 11.5px;
    padding: 6px 8px;
  }
  .form-label {
    font-size: 12px;
  }
  .badge-balance {
    font-size: 10.5px;
    padding: 1px 6px;
  }
  .save-btn, .cancel-btn {
    font-size: 12.5px;
    padding: 7px 12px;
  }
}

.employee-salary-meta {
  margin-top: 6px;
  font-size: 11.5px;
}

.salary-detected-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.salary-detected-tag strong {
  color: #ffffff;
}

.salary-missing-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
</style>
