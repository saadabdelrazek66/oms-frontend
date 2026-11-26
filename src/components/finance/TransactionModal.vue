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
import { useTransactionForm } from '@/modules/finance/composables/useTransactionForm'

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

const {
  form,
  isEditing,
  submitting,
  amountError,
  fileInputRef,
  attachmentFile,
  salaryEntityType,
  clientEntityType,
  selectedUserId,
  selectedClientId,
  salaryDuplicateWarning,
  isSalaryDuplicate,
  salaryDuplicateDetails,
  retainerDuplicateWarning,
  hasRetainerDuplicate,
  retainerDuplicateDetails,
  retainerConfirmedByUser,
  activeAccounts,
  selectedAccount,
  availableBalance,
  isInsufficientBalance,
  filteredCategories,
  selectedCategory,
  isFixedCategory,
  isSalaryCategory,
  selectedUserSalaryInfo,
  setType,
  onCategoryChanged,
  onUserSelected,
  onClientSelected,
  checkSalaryDuplicate,
  confirmRetainerDuplicate,
  cancelAndCloseModal,
  validateAmount,
  triggerFileInput,
  onFileSelected,
  clearFile,
  submitForm,
} = useTransactionForm(props, emit)
</script>

<style scoped src="@/modules/finance/styles/transaction-modal.css"></style>
