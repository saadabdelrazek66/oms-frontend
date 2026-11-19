<template>
  <Teleport to="body">
    <div v-if="show" class="payslip-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="payslip-modal-card">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <div class="bar-icon-wrap">
              <svg class="bar-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3>سند صرف الراتب المعتمد</h3>
              <p v-if="payslipData">سند رسمي رقم: <strong class="voucher-code-header">{{ payslipData.voucher_number }}</strong></p>
            </div>
          </div>

          <div class="bar-actions">
            <button
              v-if="payslipData"
              type="button"
              class="action-btn-print"
              title="تنزيل الفاتورة بصيغة PDF أو طباعتها"
              @click="printPayslip"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              <span>تحميل PDF / طباعة</span>
            </button>

            <button
              v-if="payslipData"
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

        <!-- محتوى السند الرسمي -->
        <div class="modal-scroll-content">
          <!-- حالة التحميل -->
          <div v-if="loading" class="payslip-loading-state">
            <div class="spinner-ring"></div>
            <span>جارٍ استدعاء بيانات سند الصرف المعتمد من الدفاتر المالية...</span>
          </div>

          <!-- رسالة خطأ إن وجدت -->
          <div v-else-if="error" class="payslip-error-state">
            <div class="error-icon-box">
              <svg class="error-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"></path>
              </svg>
            </div>
            <p>{{ error }}</p>
            <button type="button" class="retry-btn" @click="fetchPayslip">إعادة المحاولة</button>
          </div>

          <!-- مستند الفاتورة والسند الرسمي (الذي سيتم طباعته وتنزيله كـ PDF) -->
          <div v-else-if="payslipData" id="printable-payslip" ref="payslipRef" class="official-voucher-paper">
            <!-- ترويسة الشركة الرسمية المعتمدة -->
            <div class="voucher-header">
              <div class="company-brand">
                <div class="brand-logo-container">
                  <img src="/logo.png" alt="OctoMedia" class="company-logo-img" />
                </div>
                <div class="brand-text">
                  <h2 class="company-name-ar">{{ payslipData.company?.name || 'شركة أكتوميديا للخدمات الرقمية والتسويق' }}</h2>
                  <span class="company-name-en">{{ payslipData.company?.name_en || 'OctoMedia Digital Solutions & Marketing L.L.C' }}</span>
                  <div class="company-legal-tags">
                    <span>سجل تجاري: {{ payslipData.company?.commercial_reg || '194820' }}</span>
                    <span class="dot-separator">•</span>
                    <span>بطاقة ضريبية: {{ payslipData.company?.tax_number || '724-819-350' }}</span>
                  </div>
                </div>
              </div>

              <div class="voucher-title-block">
                <div class="voucher-title-badge">
                  <span class="voucher-title-ar">سند صرف راتب شهري</span>
                  <span class="voucher-title-en">SALARY DISBURSEMENT VOUCHER</span>
                </div>
                <div class="voucher-reference-row">
                  <span class="ref-label">رقم السند المالي:</span>
                  <strong class="ref-code">{{ payslipData.voucher_number }}</strong>
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
                <span class="meta-lbl">شهر الاستحقاق المالي</span>
                <strong class="meta-val month-tag">{{ payslipData.financials?.salary_month_label }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">تاريخ الصرف الفعلي</span>
                <strong class="meta-val">{{ payslipData.transaction_date }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">طبيعة المعاملة</span>
                <strong class="meta-val">مسير رواتب رسمي</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التحقق الرقمي</span>
                <strong class="meta-val hash font-mono">{{ payslipData.audit?.security_hash }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات الموظف المستفيد -->
            <div class="voucher-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات الموظف المستحق للراتب</h4>
                  <span class="sub-en">BENEFICIARY DETAILS</span>
                </div>
              </div>
              <div class="employee-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم الموظف</span>
                  <strong class="detail-value emp-name">{{ payslipData.employee?.name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المسمى الوظيفي</span>
                  <strong class="detail-value">{{ payslipData.employee?.job_title || 'موظف بالمنظومة' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المستوى الوظيفي</span>
                  <strong class="detail-value">{{ payslipData.employee?.role_label || 'فريق العمل' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البريد الإلكتروني</span>
                  <span class="detail-value ltr">{{ payslipData.employee?.email || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">رقم الهاتف</span>
                  <span class="detail-value ltr">{{ payslipData.employee?.phone || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">الراتب الأساسي المسجل</span>
                  <span class="detail-value">
                    {{ payslipData.employee?.base_salary ? Number(payslipData.employee.base_salary).toLocaleString() + ' ج.م' : 'مسجل بالتعاقد' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- صندوق صافي المبلغ المنصرف البارز والتفقيط المالي -->
            <div class="net-salary-highlight-box">
              <div class="highlight-main">
                <div class="amount-side">
                  <span class="amount-title">صافي الراتب المنصرف • NET PAID AMOUNT</span>
                  <div class="amount-figure">
                    <span class="val">{{ payslipData.financials?.amount_formatted }}</span>
                    <span class="currency">{{ payslipData.financials?.currency_symbol || 'ج.م' }}</span>
                  </div>
                </div>
                <div class="tafqeet-side">
                  <span class="tafqeet-title">المبلغ بالحروف العربية (التفقيط المالي القانوني):</span>
                  <p class="tafqeet-text">{{ payslipData.financials?.amount_in_words }}</p>
                </div>
              </div>

              <!-- تفاصيل عملية التحويل البنكي والحساب -->
              <div class="payment-method-row">
                <div class="pay-method-item">
                  <span class="lbl">طريقة الصرف</span>
                  <strong class="val">{{ payslipData.financials?.payment_method }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">الخزينة / الحساب المصروف منه</span>
                  <strong class="val">{{ payslipData.financials?.account_name }}</strong>
                </div>
                <div v-if="payslipData.financials?.reference_number" class="pay-method-item">
                  <span class="lbl">الرقم المرجعي للتحويل</span>
                  <strong class="val code font-mono">{{ payslipData.financials.reference_number }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">حالة السند المالي</span>
                  <strong class="val text-green">مقيد ومعتمد بالدفاتر</strong>
                </div>
              </div>

              <div v-if="payslipData.financials?.notes" class="notes-sub-box">
                <span class="lbl">بيان وملاحظات الصرف:</span>
                <p>{{ payslipData.financials.notes }}</p>
              </div>
            </div>

            <!-- توقيعات واعتمادات الإدارة والختم الرسمي المحاسبي -->
            <div class="voucher-signatures-container">
              <div class="sig-block">
                <span class="sig-title"> إعداد </span>
                <span class="sig-sub">PREPARED BY</span>
                <div class="sig-space">
                  <span class="sig-signature-name">{{ payslipData.audit?.created_by || 'المحاسب المالي' }}</span>
                  <span class="sig-date">{{ payslipData.audit?.created_at || payslipData.transaction_date }}</span>
                </div>
                <span class="sig-line">توقيع المحاسب المسئول</span>
              </div>

              <!-- الختم الرسمي الرقمي للشركة (بدون أي نجوم أو رسوم عشوائية) -->
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
                  <span class="sig-date">{{ payslipData.transaction_date }}</span>
                </div>
                <span class="sig-line">المدير العام / المدير المالي</span>
              </div>
            </div>

            <!-- تذييل الفاتورة والتحقق الأمني -->
            <div class="voucher-footer">
              <p class="disclaimer-text">
                هذا المستند سند مالي رسمي صادر إلكترونياً من نظام إدارة العمليات والمالية (OMS) لشركة أكتوميديا، وموثق برقم كودي وتاريخ صرف رسمي، ويعتبر إشعاراً نهائياً ومثبتاً بالدفاتر المحاسبية باستحقاق وصرف راتب الشهر الموضح أعلاه.
              </p>
              <div class="footer-meta-row">
                <span>شركة أكتوميديا للخدمات الرقمية • القاهرة / الجيزة</span>
                <span>تاريخ وتوقيت الطباعة: {{ currentDateTime }}</span>
                <span>الصفحة 1 من 1</span>
              </div>
            </div>
          </div>
        </div>

        <!-- الفوتر السفلي للشاشة -->
        <div class="modal-footer-bar">
          <div class="footer-summary-badge" v-if="payslipData">
            <span>المستفيد: <strong>{{ payslipData.employee?.name }}</strong></span>
            <span class="badge-dot">•</span>
            <span>صافي الراتب: <strong class="text-green">{{ payslipData.financials?.amount_formatted }} {{ payslipData.financials?.currency_symbol }}</strong></span>
          </div>

          <div class="footer-actions">
            <button
              v-if="payslipData"
              type="button"
              class="footer-btn print"
              @click="printPayslip"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              <span>تحميل PDF / طباعة</span>
            </button>

            <button type="button" class="footer-btn close" @click="$emit('close')">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  transactionId: { type: [Number, String], default: null },
  userId: { type: [Number, String], default: null },
  month: { type: String, default: null }
})

const emit = defineEmits(['close'])

const loading = ref(true)
const error = ref('')
const payslipData = ref(null)
const payslipRef = ref(null)

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

const fetchPayslip = async () => {
  if (!props.transactionId && (!props.userId || !props.month)) {
    return
  }

  loading.value = true
  error.value = ''
  payslipData.value = null

  try {
    let url = ''
    if (props.transactionId) {
      url = `/finance/salaries/payslip/${props.transactionId}`
    } else {
      url = `/finance/salaries/payslip-by-month/${props.userId}/${props.month}`
    }

    const res = await api.get(url)
    if (res.data?.data) {
      payslipData.value = res.data.data
    } else {
      error.value = 'لم يتم العثور على بيانات سند الصرف المطلوب.'
    }
  } catch (err) {
    console.error('Error fetching payslip:', err)
    error.value = err.response?.data?.message || 'تعذر جلب بيانات سند صرف الراتب. يرجى التأكد من اكتمال تسجيل المعاملة.'
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (val) => {
  if (val) {
    fetchPayslip()
  } else {
    payslipData.value = null
    error.value = ''
  }
})

watch(() => props.transactionId, () => {
  if (props.show && props.transactionId) {
    fetchPayslip()
  }
})

// نسخ النص الرسمي
const copyNotificationText = async () => {
  if (!payslipData.value?.whatsapp?.message) return
  try {
    await navigator.clipboard.writeText(payslipData.value.whatsapp.message)
    alertService.toast('تم نسخ نص إشعار وسند الراتب إلى الحافظة بنجاح.', 'success')
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alertService.toast('تعذر النسخ التلقائي إلى الحافظة.', 'error')
  }
}

// تنزيل كـ PDF / طباعة باحترافية تامة عبر iframe نظيف ومعزول
const printPayslip = () => {
  const printableEl = document.getElementById('printable-payslip')
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
  printIframe.id = 'payslip-print-iframe'
  document.body.appendChild(printIframe)

  const logoSrc = window.location.origin + '/logo.png'

  const doc = printIframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>سند صرف راتب - ${payslipData.value?.employee?.name || ''} - ${payslipData.value?.financials?.salary_month || ''}</title>
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
        .brand-logo-container {
          display: flex;
          align-items: center;
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
        .dot-separator {
          color: #cbd5e1;
        }
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
        .ref-code {
          font-family: monospace;
          color: #0f172a;
          font-size: 12px;
        }
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
        .check-svg {
          width: 13px;
          height: 13px;
        }
        .voucher-divider-rule {
          height: 3px;
          border-top: 2px solid #0f172a;
          border-bottom: 1px solid #cbd5e1;
          margin: 14px 0 16px;
        }
        .voucher-meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 14px;
          margin-bottom: 16px;
          font-size: 11.5px;
          gap: 8px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-lbl {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .meta-val {
          font-size: 12px;
          color: #0f172a;
          font-weight: 700;
        }
        .meta-val.month-tag {
          color: #0f172a;
        }
        .meta-val.hash {
          font-family: monospace;
          font-size: 10.5px;
          color: #475569;
        }
        .voucher-section-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
          background: #ffffff;
        }
        .section-card-title {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .section-title-text {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .section-title-text h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .sub-en {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .employee-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 14px;
          font-size: 11.5px;
        }
        .detail-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .detail-value {
          font-size: 12px;
          color: #0f172a;
          font-weight: 600;
        }
        .detail-value.emp-name {
          font-size: 13px;
          font-weight: 800;
        }
        .ltr {
          direction: ltr;
          text-align: right;
        }
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
        .amount-figure {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .amount-figure .val {
          font-size: 26px;
          font-weight: 900;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
        }
        .amount-figure .currency {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .tafqeet-side {
          max-width: 55%;
          text-align: right;
          direction: rtl;
        }
        .tafqeet-title {
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
          display: block;
        }
        .tafqeet-text {
          margin: 2px 0 0;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.4;
        }
        .payment-method-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 11px;
        }
        .pay-method-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pay-method-item .lbl {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
        }
        .pay-method-item .val {
          color: #0f172a;
          font-size: 11.5px;
          font-weight: 700;
        }
        .pay-method-item .val.code {
          font-family: monospace;
        }
        .text-green {
          color: #047857 !important;
        }
        .notes-sub-box {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #cbd5e1;
          font-size: 11px;
        }
        .notes-sub-box .lbl {
          font-weight: 700;
          color: #475569;
        }
        .notes-sub-box p {
          margin: 2px 0 0;
          color: #1e293b;
        }
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
        .sig-block {
          text-align: center;
          width: 32%;
        }
        .sig-title {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          display: block;
        }
        .sig-sub {
          font-size: 8px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 4px;
        }
        .sig-space {
          height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sig-signature-name {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }
        .sig-date {
          font-size: 9.5px;
          color: #64748b;
        }
        .sig-line {
          display: block;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
          font-size: 10px;
          color: #64748b;
        }
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
        .seal-company {
          font-weight: 800;
          font-size: 7px;
          letter-spacing: 0.3px;
        }
        .seal-dots {
          font-size: 7px;
          color: #475569;
          letter-spacing: 1px;
          line-height: 1;
          margin: 1px 0;
        }
        .seal-center {
          font-size: 9.5px;
          font-weight: 900;
          color: #0f172a;
          margin: 1px 0;
        }
        .seal-en-center {
          font-size: 6.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: block;
          color: #475569;
        }
        .seal-dept {
          font-size: 7px;
          color: #475569;
          font-weight: 600;
        }
        .voucher-footer {
          margin-top: 14px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .disclaimer-text {
          font-size: 9px;
          color: #64748b;
          margin: 0 0 4px;
          line-height: 1.4;
        }
        .footer-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #94a3b8;
        }
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
.payslip-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100050 !important;
  background: rgba(3, 7, 24, 0.86);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  direction: rtl;
  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
}

.payslip-modal-card {
  background: #0b1126;
  border: 1px solid rgba(135, 155, 230, 0.24);
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* شريط التحكم العلوي للمودال */
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
  letter-spacing: -0.2px;
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

/* المحتوى القابل للتمرير */
.modal-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #080d22;
}

/* حالات التحميل والخطأ */
.payslip-loading-state,
.payslip-error-state {
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

.error-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.error-svg {
  width: 28px;
  height: 28px;
}

.retry-btn {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
}

/* ================= ورقة السند والفاتورة الرسمية المعتمدة ================= */
.official-voucher-paper {
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 32px 36px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  border: 1.5px solid #cbd5e1;
  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
}

/* الترويسة المؤسسية */
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

.dot-separator {
  color: #cbd5e1;
}

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

.ref-label {
  color: #64748b;
}

.ref-code {
  font-family: monospace;
  color: #0f172a;
  font-size: 12px;
}

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

.check-svg {
  width: 13px;
  height: 13px;
}

/* فاصل خطي مؤسسي */
.voucher-divider-rule {
  height: 3px;
  border-top: 2px solid #0f172a;
  border-bottom: 1px solid #cbd5e1;
  margin: 16px 0 18px;
}

/* شريط البيانات الأساسية */
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

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-lbl {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 600;
}

.meta-val {
  font-size: 12.5px;
  color: #0f172a;
  font-weight: 700;
}

.meta-val.month-tag {
  color: #0f172a;
}

.meta-val.hash {
  font-family: monospace;
  font-size: 11px;
  color: #475569;
}

/* بطاقة بيانات الموظف المستفيد */
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
}

.section-title-text {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.section-title-text h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.sub-en {
  font-size: 9.5px;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.employee-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 18px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  font-size: 12.5px;
  color: #0f172a;
  font-weight: 600;
}

.detail-value.emp-name {
  font-size: 13.5px;
  font-weight: 800;
}

.ltr {
  direction: ltr;
  text-align: right;
}

/* صندوق صافي المبلغ المنصرف */
.net-salary-highlight-box {
  border: 1.5px solid #0f172a;
  background: #f8fafc;
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 18px;
}

.highlight-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 12px;
  margin-bottom: 12px;
  gap: 20px;
}

.amount-title {
  font-size: 11px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 2px;
}

.amount-figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.amount-figure .val {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.amount-figure .currency {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}

.tafqeet-side {
  max-width: 55%;
  text-align: right;
  direction: rtl;
}

.tafqeet-title {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 700;
  display: block;
}

.tafqeet-text {
  margin: 3px 0 0;
  font-size: 12.5px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.45;
}

.payment-method-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.pay-method-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pay-method-item .lbl {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
}

.pay-method-item .val {
  font-size: 12px;
  color: #0f172a;
  font-weight: 700;
}

.pay-method-item .val.code {
  font-family: monospace;
}

.text-green {
  color: #047857 !important;
}

.notes-sub-box {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
  font-size: 11.5px;
}

.notes-sub-box .lbl {
  font-weight: 700;
  color: #475569;
}

.notes-sub-box p {
  margin: 2px 0 0;
  color: #1e293b;
}

/* التوقيعات والاعتمادات المحاسبية الرسمية */
.voucher-signatures-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 20px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
}

.sig-block {
  text-align: center;
  width: 32%;
}

.sig-title {
  font-size: 11.5px;
  font-weight: 800;
  color: #0f172a;
  display: block;
}

.sig-sub {
  font-size: 8.5px;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}

.sig-space {
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sig-signature-name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.sig-date {
  font-size: 10px;
  color: #64748b;
}

.sig-line {
  display: block;
  border-top: 1px solid #cbd5e1;
  padding-top: 4px;
  font-size: 10px;
  color: #64748b;
}

.sig-approved-stamp {
  border: 1.5px solid #047857;
  color: #047857;
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  display: inline-block;
}

/* الختم المؤسسي الرسمي */
.official-seal-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30%;
}

.circular-seal {
  width: 84px;
  height: 84px;
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

.seal-company {
  font-weight: 800;
  font-size: 7px;
  letter-spacing: 0.3px;
}

.seal-dots {
  font-size: 7px;
  color: #475569;
  letter-spacing: 1px;
  line-height: 1;
  margin: 1px 0;
}

.seal-center {
  font-size: 10px;
  font-weight: 900;
  color: #0f172a;
  margin: 1px 0;
}

.seal-en-center {
  font-size: 6.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: block;
  color: #475569;
}

.seal-dept {
  font-size: 7.5px;
  color: #475569;
  font-weight: 600;
}

/* تذييل الفاتورة القانوني */
.voucher-footer {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.disclaimer-text {
  font-size: 9.5px;
  color: #64748b;
  margin: 0 0 4px;
  line-height: 1.45;
}

.footer-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #94a3b8;
}

/* الفوتر السفلي للمودال */
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

.footer-summary-badge strong {
  color: #ffffff;
}

.badge-dot {
  color: #64748b;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-btn {
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}

.footer-btn.print {
  background: #0284c7;
  color: #ffffff;
}

.footer-btn.print:hover {
  background: #0369a1;
}

.footer-btn.close {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.footer-btn.close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* التجاوب مع الشاشات المختلفة */
@media (max-width: 768px) {
  .voucher-meta-strip,
  .payment-method-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .employee-details-grid {
    grid-template-columns: 1fr;
  }

  .highlight-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .tafqeet-side {
    max-width: 100%;
    margin-top: 10px;
  }

  .voucher-signatures-container {
    flex-direction: column;
    gap: 16px;
  }

  .sig-block {
    width: 100%;
  }

  .modal-top-bar,
  .modal-footer-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .bar-actions,
  .footer-actions {
    justify-content: stretch;
  }

  .action-btn-print,
  .footer-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
