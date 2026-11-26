<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="modal-card task-settlement-modal" :class="{ 'voucher-mode-active': mode === 'voucher' }">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <div class="bar-icon-wrap">
              <svg class="bar-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3>{{ mode === 'voucher' ? 'سند صرف مستحقات المهام المعتمد' : 'تسوية وصرف مستحقات المهام (بالتاسك)' }}</h3>
              <p v-if="mode === 'voucher' && voucherData">سند رسمي رقم: <strong class="voucher-code-header">{{ voucherData.voucher_number || voucherData.transaction_number }}</strong></p>
              <p v-else-if="user">الموظف / الفريلانسر: <strong>{{ user.name }}</strong></p>
            </div>
          </div>

          <div class="bar-actions">
            <button
              v-if="mode === 'voucher' && voucherData"
              type="button"
              class="action-btn-print"
              title="تنزيل السند بصيغة PDF أو طباعته"
              @click="printVoucher"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              <span>تحميل PDF / طباعة</span>
            </button>

            <button
              v-if="mode === 'voucher' && voucherData"
              type="button"
              class="action-btn-copy"
              title="نسخ نص الإشعار الرسمي للحافظة"
              @click="copyNotificationText"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              <span>نسخ النص</span>
            </button>

            <button class="close-bar-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- وضع السند الرسمي المعتمد (Voucher Mode) -->
        <div v-if="mode === 'voucher'" class="modal-scroll-content">
          <!-- حالة التحميل -->
          <div v-if="loadingVoucher" class="voucher-loading-state">
            <div class="spinner-ring"></div>
            <span>جاري استدعاء بيانات سند الصرف المعتمد من الدفاتر المالية...</span>
          </div>

          <!-- ورقة السند والفاتورة الرسمية المعتمدة -->
          <div v-else-if="voucherData" class="official-voucher-paper" id="printable-task-voucher">
            <!-- ترويسة الشركة الرسمية المعتمدة -->
            <div class="voucher-header">
              <div class="company-brand">
                <div class="brand-logo-container">
                  <img src="/logo.png" alt="OctoMedia" class="company-logo-img" />
                </div>
                <div class="brand-text">
                  <h2 class="company-name-ar">{{ voucherData.company?.name || 'شركة أكتوميديا للخدمات الرقمية والتسويق' }}</h2>
                  <span class="company-name-en">{{ voucherData.company?.name_en || 'OctoMedia Digital Solutions & Marketing L.L.C' }}</span>
                  <div class="company-legal-tags">
                    <span>سجل تجاري: {{ voucherData.company?.commercial_reg || '194820' }}</span>
                    <span class="dot-separator">•</span>
                    <span>بطاقة ضريبية: {{ voucherData.company?.tax_number || '724-819-350' }}</span>
                  </div>
                </div>
              </div>

              <div class="voucher-title-block">
                <div class="voucher-title-badge">
                  <span class="voucher-title-ar">سند صرف مستحقات مهام</span>
                  <span class="voucher-title-en">FREELANCER PAYOUT VOUCHER</span>
                </div>
                <div class="voucher-reference-row">
                  <span class="ref-label">رقم السند المالي:</span>
                  <strong class="ref-code">{{ voucherData.voucher_number || voucherData.transaction_number }}</strong>
                </div>
                <span class="voucher-status-stamp">
                  <svg class="check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  معتمد ومقيد بالدفاتر
                </span>
              </div>
            </div>

            <!-- خط الفاصل المؤسسي المزدوج -->
            <div class="voucher-divider-rule"></div>

            <!-- شريط بيانات السند الأساسية -->
            <div class="voucher-meta-strip">
              <div class="meta-item">
                <span class="meta-lbl">تاريخ الصرف الفعلي</span>
                <strong class="meta-val">{{ voucherData.transaction_date }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">طبيعة المعاملة</span>
                <strong class="meta-val">تسوية أتعاب مهام مستقل</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">عدد المهام المسددة</span>
                <strong class="meta-val font-mono">{{ voucherData.task_count }} مهام معتمدة</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التحقق الرقمي</span>
                <strong class="meta-val hash font-mono">{{ voucherData.audit?.security_hash || 'AUDIT-VERIFIED' }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات الموظف المستفيد -->
            <div class="voucher-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات المستفيد المستحق للصرف</h4>
                  <span class="sub-en">BENEFICIARY DETAILS</span>
                </div>
              </div>
              <div class="employee-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم المستفيد / الفريلانسر</span>
                  <strong class="detail-value emp-name">{{ voucherData.employee?.name || voucherData.beneficiary_name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المسمى الوظيفي والتخصص</span>
                  <strong class="detail-value">{{ voucherData.employee?.job_title || 'مصمم / فريلانسر معتمد' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">نظام العمل والتعاقد</span>
                  <strong class="detail-value">بالتاسك / بالقطعة (Freelancer)</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">رقم الهاتف</span>
                  <span class="detail-value ltr">{{ voucherData.employee?.phone || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البريد الإلكتروني</span>
                  <span class="detail-value ltr">{{ voucherData.employee?.email || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">الأتعاب الافتراضية للمهمة</span>
                  <span class="detail-value">{{ voucherData.employee?.default_task_rate ? Number(voucherData.employee.default_task_rate).toLocaleString() + ' ج.م' : 'حسب الاتفاق' }}</span>
                </div>
              </div>
            </div>

            <!-- صندوق صافي المبلغ المنصرف البارز والتفقيط المالي -->
            <div class="net-salary-highlight-box">
              <div class="highlight-main">
                <div class="amount-side">
                  <span class="amount-title">صافي المبلغ المنصرف • NET PAID AMOUNT</span>
                  <div class="amount-figure">
                    <span class="val">{{ Number(voucherData.financials?.amount || voucherData.amount).toLocaleString() }}</span>
                    <span class="currency">{{ voucherData.financials?.currency_symbol || 'ج.م' }}</span>
                  </div>
                </div>
                <div class="tafqeet-side">
                  <span class="tafqeet-title">المبلغ بالحروف العربية (التفقيط المالي القانوني):</span>
                  <p class="tafqeet-text">{{ voucherData.financials?.amount_in_words || 'فقط خمسون وخمسمائة جنيه مصري لا غير' }}</p>
                </div>
              </div>

              <!-- تفاصيل عملية التحويل والخزينة -->
              <div class="payment-method-row">
                <div class="pay-method-item">
                  <span class="lbl">طريقة الصرف</span>
                  <strong class="val">{{ voucherData.financials?.payment_method || voucherData.payment_method }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">الخزينة / الحساب المصروف منه</span>
                  <strong class="val">{{ voucherData.financials?.account_name || voucherData.account_name }}</strong>
                </div>
                <div v-if="voucherData.reference_number || voucherData.financials?.reference_number" class="pay-method-item">
                  <span class="lbl">الرقم المرجعي للتحويل</span>
                  <strong class="val code font-mono">{{ voucherData.financials?.reference_number || voucherData.reference_number }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">حالة السند المالي</span>
                  <strong class="val text-green">مقيد ومعتمد بالدفاتر</strong>
                </div>
              </div>

              <div v-if="voucherData.financials?.notes || voucherData.notes" class="notes-sub-box">
                <span class="lbl">بيان وملاحظات الصرف:</span>
                <p>{{ voucherData.financials?.notes || voucherData.notes }}</p>
              </div>
            </div>

            <!-- جدول تفاصيل المهام المسددة بالسند -->
            <div class="voucher-section-card" style="margin-top: 14px;">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات وتفاصيل المهام المسددة بالسند</h4>
                  <span class="sub-en">SETTLED TASKS BREAKDOWN</span>
                </div>
                <span class="tasks-count-pill">{{ voucherData.task_count }} مهام معتمدة</span>
              </div>
              <div class="voucher-table-wrapper">
                <table class="official-voucher-table">
                  <thead>
                    <tr>
                      <th style="width: 44px; text-align: center;">#</th>
                      <th>عنوان المهمة</th>
                      <th style="width: 140px; text-align: center;">نوع المهمة</th>
                      <th style="width: 180px;">المشروع / القسم</th>
                      <th style="width: 130px; text-align: left;">القيمة المستحقة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(t, idx) in voucherData.tasks" :key="idx">
                      <td style="text-align: center;" class="num-cell">{{ idx + 1 }}</td>
                      <td class="title-cell font-bold">{{ t.title }}</td>
                      <td style="text-align: center;">
                        <span class="task-type-tag" :class="t.type === 'project_task' ? 'tag-project' : 'tag-quick'">
                          {{ t.type === 'project_task' ? 'مهمة مشروع' : 'مهمة سريعة' }}
                        </span>
                      </td>
                      <td class="muted-cell">{{ t.project_name || '—' }}</td>
                      <td class="cost-cell text-left font-bold">{{ Number(t.cost || 0).toLocaleString() }} ج.م</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="total-label-cell">إجمالي المستحقات المسددة للمهام:</td>
                      <td class="total-val-cell text-left font-bold">{{ Number(voucherData.amount).toLocaleString() }} ج.م</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- توقيعات واعتمادات الإدارة والختم الرسمي المحاسبي -->
            <div class="voucher-signatures-container">
              <div class="sig-block">
                <span class="sig-title">إعداد</span>
                <span class="sig-sub">PREPARED BY</span>
                <div class="sig-space">
                  <span class="sig-signature-name">{{ voucherData.audit?.created_by || 'المحاسب المالي' }}</span>
                  <span class="sig-date">{{ voucherData.audit?.created_at || voucherData.transaction_date }}</span>
                </div>
                <span class="sig-line">توقيع المحاسب المسئول</span>
              </div>

              <!-- الختم الرسمي الرقمي للشركة (مطابق لمسير الرواتب بدون أي رسوم عشوائية) -->
              <div class="official-seal-wrapper">
                <div class="circular-seal">
                  <div class="seal-inner-circle">
                    <span class="seal-company">OCTOMEDIA DIGITAL</span>
                    <span class="seal-dots">• • •</span>
                    <strong class="seal-center">معتمد رسمي<br /><span class="seal-en-center">PAID & AUDITED</span></strong>
                    <span class="seal-dept">الشؤون المالية</span>
                  </div>
                </div>
              </div>

              <div class="sig-block">
                <span class="sig-title">اعتماد الإدارة العامة</span>
                <span class="sig-sub">AUTHORIZED BY</span>
                <div class="sig-space">
                  <span class="sig-approved-stamp">معتمد رسمياً</span>
                  <span class="sig-date">{{ voucherData.transaction_date }}</span>
                </div>
                <span class="sig-line">المدير العام / المدير المالي</span>
              </div>
            </div>

            <!-- تذييل الفاتورة والتحقق الأمني -->
            <div class="voucher-footer">
              <p class="disclaimer-text">
                هذا المستند سند مالي رسمي صادر إلكترونياً من نظام إدارة العمليات والمالية (OMS) لشركة أكتوميديا، وموثق برقم كودي وتاريخ صرف رسمي، ويعتبر إشعاراً نهائياً ومثبتاً بالدفاتر المحاسبية باستحقاق وصرف أتعاب المهام المنجزة الموضحة أعلاه.
              </p>
              <div class="footer-meta-row">
                <span>شركة أكتوميديا للخدمات الرقمية • القاهرة / الجيزة</span>
                <span>تاريخ وتوقيت الطباعة: {{ currentDateTime }}</span>
                <span>الصفحة 1 من 1</span>
              </div>
            </div>
          </div>

          <!-- الفوتر السفلي لشاشة السند -->
          <div class="modal-footer-bar" v-if="voucherData">
            <div class="footer-summary-badge">
              <span>المستفيد: <strong>{{ voucherData.employee?.name || voucherData.beneficiary_name }}</strong></span>
              <span class="badge-dot">•</span>
              <span>المبلغ المنصرف: <strong class="text-green">{{ Number(voucherData.amount).toLocaleString() }} ج.م</strong></span>
            </div>

            <div class="footer-actions">
              <button type="button" class="action-btn-print" @click="printVoucher">
                <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                <span>طباعة / تنزيل PDF</span>
              </button>
              <button type="button" class="cancel-btn" @click="$emit('close')">إغلاق</button>
            </div>
          </div>
        </div>

        <!-- وضع تسوية واختيار المهام (Payout Mode) -->
        <div v-else class="modal-body">
          <div v-if="loadingTasks" class="loading-state">
            <span class="spinner"></span> جاري جلب المهام المنجزة المعتمدة...
          </div>

          <div v-else-if="unsettledTasks.length === 0" class="empty-tasks-state">
            <div class="empty-icon">
              <svg class="w-12 h-12 text-[#38bdf8] mx-auto opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h4>لا توجد مهام معلقة بانتظار الصرف</h4>
            <p>جميع المهام المكتملة لهذا الموظف تم تسويتها وصرفها بالكامل مسبقاً.</p>
          </div>

          <form v-else @submit.prevent="submitSettlement">
            <!-- شريط تحديد المهام -->
            <div class="selection-control-strip">
              <label class="select-all-label">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                <span>تحديد جميع المهام ({{ unsettledTasks.length }})</span>
              </label>

              <div class="selection-summary">
                <span>المحدد: <strong>{{ selectedKeys.length }}</strong> من {{ unsettledTasks.length }}</span>
                <span class="total-selected-badge">
                  الإجمالي: <strong>{{ Number(selectedTotalCost).toLocaleString() }} ج.م</strong>
                </span>
              </div>
            </div>

            <!-- جدول المهام المتاحة للصرف -->
            <div class="tasks-scroll-table-wrap">
              <table class="compact-tasks-table">
                <thead>
                  <tr>
                    <th style="width: 40px;"></th>
                    <th>المهمة</th>
                    <th>المشروع / المصدر</th>
                    <th>حالة الإنجاز</th>
                    <th>تاريخ التحديث</th>
                    <th style="width: 100px;">القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in unsettledTasks"
                    :key="item.key"
                    :class="{ 'row-selected': selectedKeys.includes(item.key) }"
                    @click="toggleKey(item.key)"
                  >
                    <td>
                      <input
                        type="checkbox"
                        :value="item.key"
                        v-model="selectedKeys"
                        @click.stop
                      />
                    </td>
                    <td>
                      <strong>{{ item.title }}</strong>
                    </td>
                    <td>
                      <span class="proj-badge">{{ item.project_name }}</span>
                    </td>
                    <td>
                      <span
                        class="task-status-pill"
                        :class="item.is_completed ? 'status-done' : 'status-ongoing'"
                      >
                        {{ item.status_label }}
                      </span>
                    </td>
                    <td class="date-col">
                      <bdi>{{ item.completed_at || '—' }}</bdi>
                    </td>
                    <td>
                      <strong class="cost-text">{{ Number(item.cost).toLocaleString() }} ج.م</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- تفاصيل الدفع والخزينة -->
            <div class="payout-fields-box">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">الخزينة / الحساب المالي المسدد منه</label>
                  <select v-model="form.account_id" required class="form-select">
                    <option value="">اختر الحساب المالي / وسيلة الصرف</option>
                    <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                      {{ acc.name }} (الرصيد: {{ Number(acc.current_balance || 0).toLocaleString() }} {{ acc.currency }})
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">طريقة الدفع</label>
                  <select v-model="form.payment_method" class="form-select">
                    <option value="">استنتاج تلقائي من نوع الحساب</option>
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="vodafone_cash">محفظة إلكترونية (فودافون كاش)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">تاريخ الصرف</label>
                  <input v-model="form.transaction_date" type="date" class="form-input" required />
                </div>

                <div class="form-group">
                  <label class="form-label">الرقم المرجعي للتحويل (اختياري)</label>
                  <input v-model="form.reference_number" type="text" placeholder="Ref # / رقم الإيصال" class="form-input" />
                </div>
              </div>
            </div>

            <!-- أزرار الحفظ -->
            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="$emit('close')">إلغاء</button>
              <button
                type="submit"
                class="save-btn"
                :disabled="submitting || selectedKeys.length === 0 || !form.account_id"
              >
                <span v-if="submitting" class="spinner"></span>
                <span v-else>
                  صرف المستحقات الآن ({{ Number(selectedTotalCost).toLocaleString() }} ج.م)
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import { copyToClipboard, formatArabicDateTime, formatLocalDate } from '@/modules/finance/utils/financeHelpers'
import { printFinanceDocument } from '@/modules/finance/utils/voucherPrint'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null },
  accounts: { type: Array, default: () => [] },
  viewTransactionId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'settled'])

const mode = ref('settle') // 'settle' | 'voucher'
const loadingTasks = ref(false)
const loadingVoucher = ref(false)
const submitting = ref(false)
const unsettledTasks = ref([])
const selectedKeys = ref([])
const voucherData = ref(null)

const currentDateTime = computed(() => formatArabicDateTime())

const form = reactive({
  account_id: '',
  payment_method: '',
  reference_number: '',
  transaction_date: formatLocalDate(),
})

// جلب المهام غير المسددة
const fetchUnsettledTasks = async () => {
  const targetId = props.user?.id || props.user?.user_id
  if (!targetId) return
  loadingTasks.value = true
  try {
    const res = await api.get(`/finance/compensations/freelancers/${targetId}/unsettled-tasks`)
    unsettledTasks.value = res.data?.data?.items || []
    // تحديد المهام المكتملة افتراضياً، أو الكل إن لم تكن هناك مهام مكتملة
    const completedKeys = unsettledTasks.value.filter(t => t.is_completed).map(t => t.key)
    selectedKeys.value = completedKeys.length > 0 ? completedKeys : unsettledTasks.value.map(t => t.key)
  } catch (err) {
    alertService.toast('فشل استدعاء مهام الموظف غير المسددة', 'error')
  } finally {
    loadingTasks.value = false
  }
}

// جلب بيانات السند في حال فتح السند مباشرة
const fetchVoucher = async (trxId) => {
  loadingVoucher.value = true
  try {
    const res = await api.get(`/finance/compensations/tasks/voucher/${trxId}`)
    voucherData.value = res.data?.data || null
  } catch (err) {
    alertService.toast('فشل استدعاء سند الصرف', 'error')
  } finally {
    loadingVoucher.value = false
  }
}

watch(
  [() => props.show, () => props.user],
  ([showVal, userVal]) => {
    if (showVal) {
      if (props.viewTransactionId) {
        mode.value = 'voucher'
        fetchVoucher(props.viewTransactionId)
      } else if (userVal) {
        mode.value = 'settle'
        form.transaction_date = formatLocalDate()
        form.account_id = props.accounts?.[0]?.id || ''
        fetchUnsettledTasks()
      }
    }
  },
  { immediate: true }
)

const isAllSelected = computed(() => {
  return unsettledTasks.value.length > 0 && selectedKeys.value.length === unsettledTasks.value.length
})

const selectedTotalCost = computed(() => {
  return unsettledTasks.value
    .filter(t => selectedKeys.value.includes(t.key))
    .reduce((sum, t) => sum + Number(t.cost || 0), 0)
})

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedKeys.value = unsettledTasks.value.map(t => t.key)
  } else {
    selectedKeys.value = []
  }
}

const toggleKey = (key) => {
  const idx = selectedKeys.value.indexOf(key)
  if (idx > -1) {
    selectedKeys.value.splice(idx, 1)
  } else {
    selectedKeys.value.push(key)
  }
}

const submitSettlement = async () => {
  if (selectedKeys.value.length === 0) {
    alertService.toast('يرجى تحديد مهمة واحدة على الأقل للصرف', 'warning')
    return
  }
  if (!form.account_id) {
    alertService.toast('يرجى اختيار الحساب المالي / الخزينة', 'warning')
    return
  }

  const targetId = props.user?.id || props.user?.user_id
  if (!targetId) {
    alertService.toast('تعذر تحديد هوية الموظف', 'error')
    return
  }

  submitting.value = true
  try {
    const payload = {
      item_keys: selectedKeys.value,
      account_id: form.account_id,
      payment_method: form.payment_method || undefined,
      reference_number: form.reference_number || undefined,
      transaction_date: form.transaction_date,
    }

    const res = await api.post(`/finance/compensations/freelancers/${targetId}/settle`, payload)
    alertService.toast(res.data?.message || 'تم صرف مستحقات المهام بنجاح', 'success')
    
    // التبديل لعرض السند الرسمي
    const trxId = res.data?.data?.transaction?.id
    if (trxId) {
      mode.value = 'voucher'
      fetchVoucher(trxId)
    } else {
      emit('close')
    }
    emit('settled')
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء صرف مستحقات المهام'
    alertService.toast(msg, 'error')
  } finally {
    submitting.value = false
  }
}

// نسخ النص الرسمي للحافظة
const copyNotificationText = async () => {
  if (!voucherData.value) return
  const v = voucherData.value
  const text = `شركة أكتوميديا للخدمات الرقمية والتسويق
سند صرف مستحقات مهام معتمد
رقم السند: ${v.voucher_number || v.transaction_number}
المستفيد: ${v.employee?.name || v.beneficiary_name}
تاريخ الصرف: ${v.transaction_date}
المبلغ المنصرف: ${Number(v.amount).toLocaleString()} ج.م (${v.financials?.amount_in_words || ''})
عدد المهام: ${v.task_count} مهام
طريقة الدفع: ${v.financials?.payment_method || v.payment_method}
الحساب: ${v.financials?.account_name || v.account_name}
حالة السند: معتمد ومقيد بالدفاتر المالية`

  await copyToClipboard(text, 'تم نسخ نص إشعار السند إلى الحافظة بنجاح.')
}

const printVoucher = () => {
  printFinanceDocument({
    elementId: 'printable-task-voucher',
    title: `سند صرف مستحقات مهام - ${voucherData.value?.beneficiary_name || ''} - ${voucherData.value?.voucher_number || voucherData.value?.transaction_number || ''}`,
    variant: 'slate',
    fallbackToWindowPrint: true,
  })
}
</script>

<style scoped src="@/modules/finance/styles/task-settlement-modal.css"></style>
