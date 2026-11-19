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

const currentDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const getLocalDate = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const form = reactive({
  account_id: '',
  payment_method: '',
  reference_number: '',
  transaction_date: getLocalDate(),
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
        form.transaction_date = getLocalDate()
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

  try {
    await navigator.clipboard.writeText(text)
    alertService.toast('تم نسخ نص إشعار السند إلى الحافظة بنجاح.', 'success')
  } catch (err) {
    alertService.toast('تعذر النسخ إلى الحافظة.', 'error')
  }
}

const printVoucher = () => {
  const printableEl = document.getElementById('printable-commission-voucher')
  if (!printableEl) {
    window.print()
    return
  }

  const printIframe = document.createElement('iframe')
  printIframe.style.position = 'fixed'
  printIframe.style.right = '0'
  printIframe.style.bottom = '0'
  printIframe.style.width = '0'
  printIframe.style.height = '0'
  printIframe.style.border = 'none'
  printIframe.id = 'comm-voucher-print-iframe'
  document.body.appendChild(printIframe)

  const doc = printIframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>سند صرف عمولة - ${voucherData.value?.beneficiary_name || ''} - ${voucherData.value?.client_name || ''}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
          background: #ffffff;
          color: #0f172a;
          direction: rtl;
          line-height: 1.45;
        }
        .official-voucher-paper {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 24px 28px;
        }
        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .company-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .company-logo-img {
          height: 52px;
          width: auto;
          max-width: 170px;
          object-fit: contain;
          display: block;
        }
        .brand-text h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
          font-weight: 800;
        }
        .company-name-en {
          display: block;
          font-size: 11px;
          color: #475569;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-top: 1px;
        }
        .company-legal-tags {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot-separator { color: #cbd5e1; }
        .voucher-title-block {
          text-align: left;
          direction: ltr;
        }
        .voucher-title-badge {
          background: #0f172a;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 4px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .voucher-title-ar {
          font-size: 13.5px;
          font-weight: 800;
          direction: rtl;
        }
        .voucher-title-en {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #94a3b8;
        }
        .voucher-reference-row {
          margin-top: 6px;
          font-size: 11px;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }
        .ref-label { color: #64748b; }
        .ref-code { font-family: monospace; color: #0f172a; font-size: 12px; }
        .voucher-status-stamp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          color: #047857;
          font-weight: 700;
          margin-top: 3px;
          direction: rtl;
        }
        .check-svg { width: 13px; height: 13px; }
        .voucher-divider-rule {
          height: 3px;
          border-top: 2px solid #0f172a;
          border-bottom: 1px solid #cbd5e1;
          margin: 16px 0 18px;
        }
        .voucher-meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 9px 16px;
          margin-bottom: 16px;
          gap: 12px;
        }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-lbl { font-size: 10.5px; color: #64748b; font-weight: 600; }
        .meta-val { font-size: 12.5px; color: #0f172a; font-weight: 700; }
        .meta-val.hash { font-family: monospace; font-size: 11px; color: #475569; }
        .voucher-section-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 14px 18px;
          margin-bottom: 16px;
          background: #ffffff;
        }
        .section-card-title {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .section-title-text { display: flex; align-items: baseline; gap: 8px; }
        .section-title-text h4 { margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; }
        .sub-en { font-size: 9.5px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
        .employee-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 14px;
          font-size: 11.5px;
        }
        .detail-cell { display: flex; flex-direction: column; gap: 2px; }
        .detail-label { font-size: 10px; color: #64748b; font-weight: 600; }
        .detail-value { font-size: 12px; color: #0f172a; font-weight: 600; }
        .detail-value.emp-name { font-size: 13px; font-weight: 800; }
        .text-blue { color: #0284c7; }
        .net-salary-highlight-box {
          border: 1.5px solid #0f172a;
          background: #f8fafc;
          border-radius: 6px;
          padding: 14px 18px;
          margin-bottom: 16px;
        }
        .highlight-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 10px;
          margin-bottom: 10px;
          gap: 16px;
        }
        .amount-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
        }
        .amount-figure { display: flex; align-items: baseline; gap: 6px; }
        .amount-figure .val { font-size: 26px; font-weight: 900; color: #0f172a; font-variant-numeric: tabular-nums; }
        .amount-figure .currency { font-size: 13px; font-weight: 800; color: #0f172a; }
        .tafqeet-side { max-width: 55%; text-align: right; direction: rtl; }
        .tafqeet-title { font-size: 10px; color: #64748b; font-weight: 700; display: block; }
        .tafqeet-text { margin: 2px 0 0; font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.4; }
        .payment-method-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 11px;
        }
        .pay-method-item { display: flex; flex-direction: column; gap: 2px; }
        .pay-method-item .lbl { font-size: 9.5px; color: #64748b; font-weight: 600; }
        .pay-method-item .val { color: #0f172a; font-size: 11.5px; font-weight: 700; }
        .pay-method-item .val.code { font-family: monospace; }
        .text-green { color: #047857 !important; }
        .voucher-signatures-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          padding: 14px 18px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #ffffff;
        }
        .sig-block { text-align: center; width: 32%; }
        .sig-title { font-size: 11px; font-weight: 800; color: #0f172a; display: block; }
        .sig-sub { font-size: 8px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
        .sig-space {
          height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sig-signature-name { font-size: 14px; font-weight: 800; color: #0f172a; }
        .sig-date { font-size: 9.5px; color: #64748b; }
        .sig-line { display: block; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 10px; color: #64748b; }
        .sig-approved-stamp {
          border: 1.5px solid #047857;
          color: #047857;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          display: inline-block;
        }
        .official-seal-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30%;
        }
        .circular-seal {
          width: 82px;
          height: 82px;
          border: 1.5px solid #0f172a;
          border-radius: 50%;
          padding: 2.5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seal-inner-circle {
          width: 100%;
          height: 100%;
          border: 1px dashed #334155;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 7.5px;
          color: #0f172a;
          line-height: 1.15;
          padding: 2px;
        }
        .seal-company { font-weight: 800; font-size: 7px; letter-spacing: 0.3px; }
        .seal-dots { font-size: 7px; color: #475569; letter-spacing: 1px; line-height: 1; margin: 1px 0; }
        .seal-center { font-size: 9.5px; font-weight: 900; color: #0f172a; margin: 1px 0; }
        .seal-en-center { font-size: 6.5px; font-weight: 700; letter-spacing: 0.5px; display: block; color: #475569; }
        .seal-dept { font-size: 7px; color: #475569; font-weight: 600; }
        .voucher-footer {
          margin-top: 14px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .disclaimer-text { font-size: 9px; color: #64748b; margin: 0 0 4px; line-height: 1.4; }
        .footer-meta-row { display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }
      </style>
    </head>
    <body>
      ${printableEl.outerHTML}
    </body>
    </html>
  `)
  doc.close()

  const imgs = printIframe.contentWindow.document.getElementsByTagName('img')
  let loadedCount = 0
  const totalImgs = imgs.length

  const triggerPrint = () => {
    setTimeout(() => {
      printIframe.contentWindow.focus()
      printIframe.contentWindow.print()
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe)
        }
      }, 2500)
    }, 250)
  }

  if (totalImgs === 0) {
    triggerPrint()
  } else {
    for (let i = 0; i < totalImgs; i++) {
      if (imgs[i].complete) {
        loadedCount++
        if (loadedCount === totalImgs) triggerPrint()
      } else {
        imgs[i].onload = () => {
          loadedCount++
          if (loadedCount === totalImgs) triggerPrint()
        }
        imgs[i].onerror = () => {
          loadedCount++
          if (loadedCount === totalImgs) triggerPrint()
        }
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 24, 0.82);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  direction: rtl;
}

.commission-payout-modal {
  width: 100%;
  max-width: 650px;
  background: #0b1129;
  border: 1px solid rgba(135, 155, 230, 0.22);
  border-radius: 18px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
  color: #f1f5f9;
  transition: max-width 0.3s ease;
}

.commission-payout-modal.voucher-mode-active {
  max-width: 900px;
}

.modal-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #0f1638;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
  gap: 14px;
  flex-wrap: wrap;
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
}

.bar-svg {
  width: 20px;
  height: 20px;
}

.bar-title h3 {
  margin: 0;
  font-size: 16px;
  color: #f1f5f9;
  font-weight: 800;
}

.bar-title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.voucher-code-header {
  color: #38bdf8;
  font-family: monospace;
  font-size: 12.5px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn-print,
.action-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

.action-btn-print {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
}

.action-btn-print:hover {
  background: #0369a1;
  transform: translateY(-1px);
}

.action-btn-copy {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.action-btn-copy:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.close-bar-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-bar-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.modal-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #080d22;
}

.voucher-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  gap: 16px;
  text-align: center;
}

.spinner-ring {
  width: 44px;
  height: 44px;
  border: 3.5px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.official-voucher-paper {
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 32px 36px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  border: 1.5px solid #cbd5e1;
  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
}

.voucher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.company-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-logo-img {
  height: 54px;
  width: auto;
  max-width: 175px;
  object-fit: contain;
  display: block;
}

.brand-text h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.company-name-en {
  display: block;
  font-size: 11px;
  color: #475569;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-top: 1px;
}

.company-legal-tags {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.dot-separator { color: #cbd5e1; }

.voucher-title-block {
  text-align: left;
  direction: ltr;
}

.voucher-title-badge {
  background: #0f172a;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 4px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.voucher-title-ar {
  font-size: 14px;
  font-weight: 800;
  direction: rtl;
}

.voucher-title-en {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #94a3b8;
}

.voucher-reference-row {
  margin-top: 6px;
  font-size: 11px;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.ref-label { color: #64748b; }
.ref-code { font-family: monospace; color: #0f172a; font-size: 12px; }

.voucher-status-stamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: #047857;
  font-weight: 700;
  margin-top: 3px;
  direction: rtl;
}

.check-svg { width: 13px; height: 13px; }

.voucher-divider-rule {
  height: 3px;
  border-top: 2px solid #0f172a;
  border-bottom: 1px solid #cbd5e1;
  margin: 16px 0 18px;
}

.voucher-meta-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 9px 16px;
  margin-bottom: 18px;
  gap: 12px;
}

.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-lbl { font-size: 10.5px; color: #64748b; font-weight: 600; }
.meta-val { font-size: 12.5px; color: #0f172a; font-weight: 700; }
.meta-val.hash { font-family: monospace; font-size: 11px; color: #475569; }

.voucher-section-card {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 14px 18px;
  margin-bottom: 18px;
  background: #ffffff;
}

.section-card-title {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title-text { display: flex; align-items: baseline; gap: 8px; }
.section-title-text h4 { margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; }
.sub-en { font-size: 9.5px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }

.employee-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 14px;
  font-size: 11.5px;
}

.detail-cell { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: 10px; color: #64748b; font-weight: 600; }
.detail-value { font-size: 12px; color: #0f172a; font-weight: 600; }
.detail-value.emp-name { font-size: 13px; font-weight: 800; }
.text-blue { color: #0284c7; }

.net-salary-highlight-box {
  border: 1.5px solid #0f172a;
  background: #f8fafc;
  border-radius: 6px;
  padding: 14px 18px;
  margin-bottom: 18px;
}

.highlight-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 10px;
  margin-bottom: 10px;
  gap: 16px;
}

.amount-title {
  font-size: 10.5px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 2px;
}

.amount-figure { display: flex; align-items: baseline; gap: 6px; }
.amount-figure .val { font-size: 26px; font-weight: 900; color: #0f172a; font-variant-numeric: tabular-nums; }
.amount-figure .currency { font-size: 13px; font-weight: 800; color: #0f172a; }

.tafqeet-side { max-width: 55%; text-align: right; direction: rtl; }
.tafqeet-title { font-size: 10px; color: #64748b; font-weight: 700; display: block; }
.tafqeet-text { margin: 2px 0 0; font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.4; }

.payment-method-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  font-size: 11px;
}

.pay-method-item { display: flex; flex-direction: column; gap: 2px; }
.pay-method-item .lbl { font-size: 9.5px; color: #64748b; font-weight: 600; }
.pay-method-item .val { color: #0f172a; font-size: 11.5px; font-weight: 700; }
.pay-method-item .val.code { font-family: monospace; }
.text-green { color: #047857 !important; }

.notes-sub-box {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
  font-size: 11px;
}

.notes-sub-box .lbl { font-weight: 700; color: #475569; }
.notes-sub-box p { margin: 2px 0 0; color: #1e293b; }

.voucher-signatures-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
  padding: 14px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
}

.sig-block { text-align: center; width: 32%; }
.sig-title { font-size: 11px; font-weight: 800; color: #0f172a; display: block; }
.sig-sub { font-size: 8px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }

.sig-space {
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sig-signature-name { font-size: 14px; font-weight: 800; color: #0f172a; }
.sig-date { font-size: 9.5px; color: #64748b; }
.sig-line { display: block; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 10px; color: #64748b; }

.sig-approved-stamp {
  border: 1.5px solid #047857;
  color: #047857;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  display: inline-block;
}

.official-seal-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30%;
}

.circular-seal {
  width: 82px;
  height: 82px;
  border: 1.5px solid #0f172a;
  border-radius: 50%;
  padding: 2.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-inner-circle {
  width: 100%;
  height: 100%;
  border: 1px dashed #334155;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 7.5px;
  color: #0f172a;
  line-height: 1.15;
  padding: 2px;
}

.seal-company { font-weight: 800; font-size: 7px; letter-spacing: 0.3px; }
.seal-dots { font-size: 7px; color: #475569; letter-spacing: 1px; line-height: 1; margin: 1px 0; }
.seal-center { font-size: 9.5px; font-weight: 900; color: #0f172a; margin: 1px 0; }
.seal-en-center { font-size: 6.5px; font-weight: 700; letter-spacing: 0.5px; display: block; color: #475569; }
.seal-dept { font-size: 7px; color: #475569; font-weight: 600; }

.voucher-footer {
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.disclaimer-text { font-size: 9px; color: #64748b; margin: 0 0 4px; line-height: 1.4; }
.footer-meta-row { display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }

.modal-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: #0f1638;
  border-top: 1px solid rgba(135, 155, 230, 0.15);
  gap: 14px;
  flex-wrap: wrap;
}

.footer-summary-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
}

.badge-dot { color: #64748b; }
.footer-actions { display: flex; align-items: center; gap: 10px; }

/* عناصر نموذج الصرف */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}

.commission-highlight-card {
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.25);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 20px;
}

.highlight-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.highlight-amount {
  font-size: 24px;
  color: #38bdf8;
  font-weight: 900;
}

.highlight-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  border-top: 1px solid rgba(14, 165, 233, 0.15);
  padding-top: 10px;
}

.payout-fields-box {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  color: #cbd5e1;
}

.form-label.required::after {
  content: ' *';
  color: #f43f5e;
}

.form-select,
.form-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(135, 155, 230, 0.25);
  border-radius: 8px;
  padding: 9px 12px;
  color: #f8fafc;
  font-size: 12.5px;
  outline: none;
}

.form-select:focus,
.form-input:focus {
  border-color: #38bdf8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.save-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  padding: 9px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
