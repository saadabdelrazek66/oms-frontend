<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="modal-card commission-payout-modal" :class="{ 'voucher-mode-active': mode === 'voucher' }">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <div class="bar-icon-wrap">
              <svg class="bar-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3>{{ mode === 'voucher' ? 'سند صرف عمولة مبيعات معتمد' : 'صرف وسداد عمولة مبيعات' }}</h3>
              <p v-if="mode === 'voucher' && voucherData">سند رسمي رقم: <strong class="voucher-code-header">{{ voucherData.voucher_number || voucherData.transaction_number }}</strong></p>
              <p v-else-if="commission">المستفيد: <strong>{{ commission.user_name }}</strong> | العميل: <strong>{{ commission.client_name }}</strong></p>
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
          <div v-else-if="voucherData" class="official-voucher-paper" id="printable-commission-voucher">
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
                  <span class="voucher-title-ar">سند صرف عمولة مبيعات</span>
                  <span class="voucher-title-en">SALES COMMISSION VOUCHER</span>
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
                <strong class="meta-val">صرف عمولة مبيعات وتعاقدات</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">العميل المتعاقد</span>
                <strong class="meta-val">{{ voucherData.client_name }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التحقق الرقمي</span>
                <strong class="meta-val hash font-mono">{{ voucherData.audit?.security_hash || 'AUDIT-VERIFIED' }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات مسؤول المبيعات والعميل -->
            <div class="voucher-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات مسؤول المبيعات والتعاقد</h4>
                  <span class="sub-en">SALES REPRESENTATIVE & CONTRACT DETAILS</span>
                </div>
              </div>
              <div class="employee-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم مسؤول المبيعات (المستفيد)</span>
                  <strong class="detail-value emp-name">{{ voucherData.employee?.name || voucherData.beneficiary_name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المسمى الوظيفي</span>
                  <strong class="detail-value">{{ voucherData.employee?.job_title || 'مسؤول مبيعات وتعاقدات' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">العميل صاحب الإيراد</span>
                  <strong class="detail-value text-blue">{{ voucherData.client_name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">إجمالي الإيراد المحصل من العميل</span>
                  <strong class="detail-value">{{ Number(voucherData.source_revenue_amount).toLocaleString() }} ج.م</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">طريقة احتساب العمولة</span>
                  <span class="detail-value">{{ voucherData.commission_type_label }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">نسبة / قيمة العمولة المعتمدة</span>
                  <span class="detail-value font-bold">{{ voucherData.financials?.commission_rate || voucherData.commission_rate }}</span>
                </div>
              </div>
            </div>

            <!-- صندوق صافي المبلغ المنصرف البارز والتفقيط المالي -->
            <div class="net-salary-highlight-box">
              <div class="highlight-main">
                <div class="amount-side">
                  <span class="amount-title">صافي العمولة المنصرفة • NET PAID COMMISSION</span>
                  <div class="amount-figure">
                    <span class="val">{{ Number(voucherData.financials?.amount || voucherData.amount).toLocaleString() }}</span>
                    <span class="currency">{{ voucherData.financials?.currency_symbol || 'ج.م' }}</span>
                  </div>
                </div>
                <div class="tafqeet-side">
                  <span class="tafqeet-title">المبلغ بالحروف العربية (التفقيط المالي القانوني):</span>
                  <p class="tafqeet-text">{{ voucherData.financials?.amount_in_words || 'فقط خمسون ومائتان وألف جنيه مصري لا غير' }}</p>
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

              <!-- الختم الرسمي الرقمي للشركة المعتمد -->
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
                هذا المستند سند مالي رسمي صادر إلكترونياً من نظام إدارة العمليات والمالية (OMS) لشركة أكتوميديا، وموثق برقم كودي وتاريخ صرف رسمي، ويعتبر إشعاراً نهائياً ومثبتاً بالدفاتر المحاسبية باستحقاق وصرف عمولة المبيعات عن العميل الموضح أعلاه.
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
              <span>صافي العمولة: <strong class="text-green">{{ Number(voucherData.amount).toLocaleString() }} ج.م</strong></span>
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

        <!-- وضع تأكيد وصرف العمولة (Payout Mode) -->
        <div v-else class="modal-body">
          <div class="commission-highlight-card">
            <div class="highlight-row">
              <span>قيمة العمولة المستحقة:</span>
              <strong class="highlight-amount">{{ Number(commission?.commission_amount || 0).toLocaleString() }} ج.م</strong>
            </div>
            <div class="highlight-meta">
              <span>إيراد العميل: <strong>{{ Number(commission?.revenue_amount || 0).toLocaleString() }} ج.م</strong></span>
              <span>نوع العمولة: <strong>{{ commission?.commission_type_label }}</strong> ({{ commission?.commission_rate }}{{ commission?.commission_type === 'percentage' ? '%' : ' ج.م' }})</span>
            </div>
          </div>

          <form @submit.prevent="submitPayout">
            <div class="payout-fields-box">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">الخزينة / الحساب المالي المسدد منه</label>
                  <select v-model="form.account_id" required class="form-select">
                    <option value="">اختر الحساب المالي / الخزينة</option>
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
                :disabled="submitting || !form.account_id"
              >
                <span v-if="submitting" class="spinner"></span>
                <span v-else>
                  تأكيد وصرف العمولة ({{ Number(commission?.commission_amount || 0).toLocaleString() }} ج.م)
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
  commission: { type: Object, default: null },
  accounts: { type: Array, default: () => [] },
  viewCommissionId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'paid'])

const mode = ref('payout')
const loadingVoucher = ref(false)
const submitting = ref(false)
const voucherData = ref(null)

const currentDateTime = computed(() => formatArabicDateTime())

const form = reactive({
  account_id: '',
  payment_method: '',
  reference_number: '',
  transaction_date: formatLocalDate(),
})

const fetchVoucher = async (commId) => {
  loadingVoucher.value = true
  try {
    const res = await api.get(`/finance/compensations/commissions/voucher/${commId}`)
    voucherData.value = res.data?.data || null
  } catch (err) {
    alertService.toast('فشل استدعاء سند صرف العمولة', 'error')
  } finally {
    loadingVoucher.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.viewCommissionId) {
        mode.value = 'voucher'
        fetchVoucher(props.viewCommissionId)
      } else {
        mode.value = 'payout'
        form.transaction_date = formatLocalDate()
        form.account_id = props.accounts?.[0]?.id || ''
      }
    }
  },
  { immediate: true }
)

const submitPayout = async () => {
  if (!form.account_id) {
    alertService.toast('يرجى اختيار الحساب المالي / الخزينة', 'warning')
    return
  }
  if (!props.commission?.id) return

  submitting.value = true
  try {
    const payload = {
      account_id: form.account_id,
      payment_method: form.payment_method || undefined,
      reference_number: form.reference_number || undefined,
      transaction_date: form.transaction_date,
    }

    const res = await api.post(`/finance/compensations/commissions/${props.commission.id}/payout`, payload)
    alertService.toast(res.data?.message || 'تم صرف العمولة بنجاح', 'success')

    mode.value = 'voucher'
    fetchVoucher(props.commission.id)
    emit('paid')
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء صرف العمولة'
    alertService.toast(msg, 'error')
  } finally {
    submitting.value = false
  }
}

const copyNotificationText = async () => {
  if (!voucherData.value) return
  const v = voucherData.value
  const text = `شركة أكتوميديا للخدمات الرقمية والتسويق
سند صرف عمولة مبيعات معتمد
رقم السند: ${v.voucher_number || v.transaction_number}
مسؤول المبيعات: ${v.employee?.name || v.beneficiary_name}
العميل المتعاقد: ${v.client_name}
مبلغ الإيراد: ${Number(v.source_revenue_amount).toLocaleString()} ج.م
صافي العمولة: ${Number(v.amount).toLocaleString()} ج.م (${v.financials?.amount_in_words || ''})
طريقة الدفع: ${v.financials?.payment_method || v.payment_method}
الحساب: ${v.financials?.account_name || v.account_name}
حالة السند: معتمد ومقيد بالدفاتر المالية`

  await copyToClipboard(text, 'تم نسخ نص إشعار السند إلى الحافظة بنجاح.')
}

const printVoucher = () => {
  printFinanceDocument({
    elementId: 'printable-commission-voucher',
    title: `سند صرف عمولة - ${voucherData.value?.beneficiary_name || ''} - ${voucherData.value?.client_name || ''}`,
    variant: 'slate',
    fallbackToWindowPrint: true,
  })
}
</script>

<style scoped src="@/modules/finance/styles/commission-payout-modal.css"></style>
