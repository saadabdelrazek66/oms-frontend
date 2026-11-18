<template>
  <Teleport to="body">
    <div v-if="show" class="payslip-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="payslip-modal-card">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <span class="bar-icon">🧾</span>
            <div>
              <h3>سند وفاتورة صرف الراتب الرسمي</h3>
              <p v-if="payslipData">سند معتمد رقم: <strong>{{ payslipData.voucher_number }}</strong></p>
            </div>
          </div>

          <div class="bar-actions">
            <button
              v-if="payslipData"
              type="button"
              class="action-btn-whatsapp"
              title="إرسال إشعار الراتب عبر واتساب الموظف"
              @click="shareViaWhatsApp"
            >
              <span class="btn-icon">💬</span>
              <span>مشاركة واتساب</span>
            </button>

            <button
              v-if="payslipData"
              type="button"
              class="action-btn-print"
              title="تنزيل الفاتورة بصيغة PDF أو طباعتها"
              @click="printPayslip"
            >
              <span class="btn-icon">📄</span>
              <span>تنزيل PDF / طباعة</span>
            </button>

            <button
              v-if="payslipData"
              type="button"
              class="action-btn-copy"
              title="نسخ نص الإشعار الرسمي للحافظة"
              @click="copyNotificationText"
            >
              <span class="btn-icon">📋</span>
              <span>نسخ النص</span>
            </button>

            <button class="close-bar-btn" type="button" aria-label="إغلاق" @click="$emit('close')">✕</button>
          </div>
        </div>

        <!-- محتوى السند -->
        <div class="modal-scroll-content">
          <!-- حالة التحميل -->
          <div v-if="loading" class="payslip-loading-state">
            <div class="spinner-ring"></div>
            <span>جارٍ استدعاء بيانات سند الصرف المعتمد من الدفاتر المالية...</span>
          </div>

          <!-- رسالة خطأ إن وجدت -->
          <div v-else-if="error" class="payslip-error-state">
            <span class="error-icon">⚠️</span>
            <p>{{ error }}</p>
            <button type="button" class="retry-btn" @click="fetchPayslip">إعادة المحاولة</button>
          </div>

          <!-- مستند الفاتورة والسند الرسمي (الذي سيتم طباعته وتنزيله كـ PDF) -->
          <div v-else-if="payslipData" id="printable-payslip" ref="payslipRef" class="official-voucher-paper">
            <!-- ترويسة الشركة الرسمية -->
            <div class="voucher-header">
              <div class="company-brand">
                <div class="brand-logo-emblem">
                  <span>OM</span>
                </div>
                <div class="brand-text">
                  <h2 class="company-name-ar">{{ payslipData.company?.name || 'شركة أكتوميديا للحلول الرقمية والتسويق' }}</h2>
                  <span class="company-name-en">{{ payslipData.company?.name_en || 'OctoMedia Digital Agency' }}</span>
                  <div class="company-legal-tags">
                    <span>س.ت: {{ payslipData.company?.commercial_reg || '194820' }}</span>
                    <span>•</span>
                    <span>ب.ض: {{ payslipData.company?.tax_number || '724-819-350' }}</span>
                  </div>
                </div>
              </div>

              <div class="voucher-title-block">
                <div class="voucher-title-pill">سند صرف راتب شهري</div>
                <span class="voucher-title-sub">SALARY PAYMENT VOUCHER</span>
                <span class="voucher-verified-stamp">
                  <span class="stamp-icon">✓</span> معتمد ومقيد بالدفاتر
                </span>
              </div>
            </div>

            <div class="voucher-divider-gold"></div>

            <!-- شريط بيانات السند الأساسية -->
            <div class="voucher-meta-strip">
              <div class="meta-item">
                <span class="meta-lbl">رقم السند المالي:</span>
                <strong class="meta-val code">{{ payslipData.voucher_number }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">شهر الاستحقاق:</span>
                <strong class="meta-val month-tag">{{ payslipData.financials?.salary_month_label }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">تاريخ الصرف الفعلي:</span>
                <strong class="meta-val">{{ payslipData.transaction_date }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التحقق الرقمي:</span>
                <strong class="meta-val hash">{{ payslipData.audit?.security_hash }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات الموظف المستفيد -->
            <div class="voucher-section-card">
              <div class="section-card-title">
                <span class="icon">👤</span>
                <h4>بيانات الموظف المستحق للراتب</h4>
              </div>
              <div class="employee-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم الموظف:</span>
                  <strong class="detail-value emp-name">{{ payslipData.employee?.name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المسمى الوظيفي:</span>
                  <strong class="detail-value">{{ payslipData.employee?.job_title || 'موظف بالمنظومة' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المستوى الوظيفي:</span>
                  <strong class="detail-value">{{ payslipData.employee?.role_label || 'فريق العمل' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البريد الإلكتروني:</span>
                  <span class="detail-value ltr">{{ payslipData.employee?.email || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">رقم الهاتف / واتساب:</span>
                  <span class="detail-value ltr">{{ payslipData.employee?.phone || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">الراتب الأساسي المسجل:</span>
                  <span class="detail-value">
                    {{ payslipData.employee?.base_salary ? Number(payslipData.employee.base_salary).toLocaleString() + ' ج.م' : 'مسجل بالاتفاق' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- صندوق صافي المبلغ المنصرف البارز -->
            <div class="net-salary-highlight-box">
              <div class="highlight-main">
                <div class="amount-side">
                  <span class="amount-title">صافي الراتب المنصرف (Net Paid Amount)</span>
                  <div class="amount-figure">
                    <span class="val">{{ payslipData.financials?.amount_formatted }}</span>
                    <span class="currency">{{ payslipData.financials?.currency_symbol || 'ج.م' }}</span>
                  </div>
                </div>
                <div class="tafqeet-side">
                  <span class="tafqeet-title">المبلغ بالحروف العربية (التفقيط المالي الرسمي):</span>
                  <p class="tafqeet-text">{{ payslipData.financials?.amount_in_words }}</p>
                </div>
              </div>

              <!-- تفاصيل عملية التحويل -->
              <div class="payment-method-row">
                <div class="pay-method-item">
                  <span class="lbl">طريقة الصرف:</span>
                  <strong class="val">💳 {{ payslipData.financials?.payment_method }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">الخزينة / الحساب المالي:</span>
                  <strong class="val">🏦 {{ payslipData.financials?.account_name }}</strong>
                </div>
                <div v-if="payslipData.financials?.reference_number" class="pay-method-item">
                  <span class="lbl">الرقم المرجعي / كود التحويل:</span>
                  <strong class="val code">{{ payslipData.financials.reference_number }}</strong>
                </div>
                <div class="pay-method-item">
                  <span class="lbl">حالة السند:</span>
                  <strong class="val text-green">✅ {{ payslipData.status_label }}</strong>
                </div>
              </div>

              <div v-if="payslipData.financials?.notes" class="notes-sub-box">
                <span class="lbl">ملاحظات وبيان الصرف:</span>
                <p>{{ payslipData.financials.notes }}</p>
              </div>
            </div>

            <!-- توقيعات واعتمادات الإدارة والختم الرسمي -->
            <div class="voucher-signatures-container">
              <div class="sig-block">
                <span class="sig-title">إعداد ومراجعة الحسابات</span>
                <div class="sig-space">
                  <span class="sig-signature-name">{{ payslipData.audit?.created_by || 'المحاسب المالي' }}</span>
                  <span class="sig-date">{{ payslipData.audit?.created_at || payslipData.transaction_date }}</span>
                </div>
                <span class="sig-line">توقيع المحاسب المسئول</span>
              </div>

              <!-- الختم الرسمي الرقمي للشركة -->
              <div class="official-seal-wrapper">
                <div class="circular-seal">
                  <div class="seal-inner-circle">
                    <span class="seal-company">OCTOMEDIA DIGITAL</span>
                    <span class="seal-star">★ ★ ★</span>
                    <strong class="seal-center">معتمد رسمي<br />PAID</strong>
                    <span class="seal-dept">الإدارة المالية</span>
                  </div>
                </div>
              </div>

              <div class="sig-block">
                <span class="sig-title">اعتماد الإدارة العامة</span>
                <div class="sig-space">
                  <span class="sig-approved-stamp">معتمد إلكترونياً</span>
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
            <span>•</span>
            <span>صافي الراتب: <strong class="text-green">{{ payslipData.financials?.amount_formatted }} {{ payslipData.financials?.currency_symbol }}</strong></span>
          </div>

          <div class="footer-actions">
            <button
              v-if="payslipData"
              type="button"
              class="footer-btn whatsapp"
              @click="shareViaWhatsApp"
            >
              💬 إرسال إلى واتساب الموظف
            </button>

            <button
              v-if="payslipData"
              type="button"
              class="footer-btn print"
              @click="printPayslip"
            >
              📄 تحميل PDF / طباعة
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
import { ref, watch, computed } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: { type: Boolean, default: false },
  transactionId: { type: [Number, String], default: null },
  userId: { type: [Number, String], default: null },
  month: { type: String, default: null },
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

// مشاركة الفاتورة عبر واتساب الموظف
const shareViaWhatsApp = () => {
  if (!payslipData.value) return

  const wa = payslipData.value.whatsapp
  if (wa?.url) {
    window.open(wa.url, '_blank')
    alertService.toast('🚀 تم فتح محادثة واتساب مع الموظف مرفقاً بها نص الإشعار الرسمي!', 'success')
  } else {
    // في حال عدم وجود رقم هاتف مسجل، نطلب إدخال الرقم أو ننسخ النص
    copyNotificationText()
    alertService.alert({
      title: 'رقم هاتف الموظف غير مسجل',
      message: 'لم يتم تسجيل رقم هاتف للموظف في ملفه الشخصي. تم نسخ نص إشعار الراتب الرسمي إلى الحافظة بنجاح، يمكنك لصقه مباشرة في واتساب.',
      type: 'info',
      confirmText: 'حسناً فهمت',
    })
  }
}

// نسخ النص الرسمي
const copyNotificationText = async () => {
  if (!payslipData.value?.whatsapp?.message) return
  try {
    await navigator.clipboard.writeText(payslipData.value.whatsapp.message)
    alertService.toast('📋 تم نسخ نص إشعار وسند الراتب إلى الحافظة بنجاح!', 'success')
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    alertService.toast('❌ تعذر النسخ التلقائي إلى الحافظة.', 'error')
  }
}

// تنزيل كـ PDF / طباعة باحترافية تامة عبر iframe نظيف ومعزول
const printPayslip = () => {
  const printableEl = document.getElementById('printable-payslip')
  if (!printableEl) {
    window.print()
    return
  }

  // إنشاء نافذة / iframe مخفي ومعزول تماماً لتوليد PDF فائق النقاء بدقة A4
  const printIframe = document.createElement('iframe')
  printIframe.style.position = 'fixed'
  printIframe.style.right = '0'
  printIframe.style.bottom = '0'
  printIframe.style.width = '0'
  printIframe.style.height = '0'
  printIframe.style.border = 'none'
  printIframe.id = 'payslip-print-iframe'
  document.body.appendChild(printIframe)

  const doc = printIframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>سند صرف راتب - ${payslipData.value?.employee?.name || ''} - ${payslipData.value?.financials?.salary_month || ''}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #ffffff;
          color: #0f172a;
          direction: rtl;
          line-height: 1.4;
        }
        .official-voucher-paper {
          width: 100%;
          background: #ffffff;
          border: 2px solid #0f172a;
          border-radius: 8px;
          padding: 24px;
        }
        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 16px;
          margin-bottom: 12px;
        }
        .company-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-logo-emblem {
          width: 52px;
          height: 52px;
          background: #0f172a;
          color: #38bdf8;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          border: 2px solid #38bdf8;
        }
        .brand-text h2 {
          margin: 0;
          font-size: 19px;
          color: #0f172a;
          font-weight: 800;
        }
        .company-name-en {
          font-size: 12px;
          color: #475569;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .company-legal-tags {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
        }
        .voucher-title-block {
          text-align: left;
          direction: ltr;
        }
        .voucher-title-pill {
          background: #0f172a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 6px;
          display: inline-block;
          direction: rtl;
        }
        .voucher-title-sub {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-top: 4px;
          letter-spacing: 1px;
        }
        .voucher-verified-stamp {
          display: inline-block;
          font-size: 11px;
          color: #059669;
          font-weight: 700;
          margin-top: 4px;
          direction: rtl;
        }
        .voucher-meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-lbl {
          font-size: 10.5px;
          color: #64748b;
        }
        .meta-val {
          font-size: 12.5px;
          color: #0f172a;
        }
        .meta-val.code {
          font-family: monospace;
          font-weight: 700;
          color: #0284c7;
        }
        .meta-val.month-tag {
          font-weight: 800;
          color: #4338ca;
        }
        .voucher-section-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
          background: #ffffff;
        }
        .section-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        .employee-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px 16px;
          font-size: 12px;
        }
        .detail-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-label {
          font-size: 10.5px;
          color: #64748b;
        }
        .detail-value {
          font-size: 12px;
          color: #0f172a;
        }
        .detail-value.emp-name {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }
        .ltr {
          direction: ltr;
          text-align: right;
        }
        .net-salary-highlight-box {
          border: 2px solid #0284c7;
          background: #f0f9ff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 18px;
        }
        .highlight-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed #7dd3fc;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .amount-title {
          font-size: 11px;
          font-weight: 700;
          color: #0369a1;
          display: block;
        }
        .amount-figure {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .amount-figure .val {
          font-size: 28px;
          font-weight: 900;
          color: #0c4a6e;
        }
        .amount-figure .currency {
          font-size: 14px;
          font-weight: 800;
          color: #0284c7;
        }
        .tafqeet-side {
          max-width: 55%;
          text-align: left;
          direction: rtl;
        }
        .tafqeet-title {
          font-size: 10.5px;
          color: #475569;
          font-weight: 700;
          display: block;
        }
        .tafqeet-text {
          margin: 3px 0 0;
          font-size: 13px;
          font-weight: 800;
          color: #0369a1;
          line-height: 1.4;
        }
        .payment-method-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 11.5px;
        }
        .pay-method-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pay-method-item .lbl {
          font-size: 10px;
          color: #64748b;
        }
        .pay-method-item .val {
          color: #0f172a;
          font-size: 12px;
        }
        .pay-method-item .val.code {
          font-family: monospace;
          color: #0284c7;
        }
        .voucher-signatures-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding: 16px 20px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
        }
        .sig-block {
          text-align: center;
          width: 30%;
        }
        .sig-title {
          font-size: 11.5px;
          font-weight: 700;
          color: #334155;
          display: block;
          margin-bottom: 8px;
        }
        .sig-space {
          height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sig-signature-name {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          font-family: cursive, 'Segoe UI';
        }
        .sig-date {
          font-size: 9.5px;
          color: #64748b;
        }
        .sig-line {
          display: block;
          border-top: 1px dashed #94a3b8;
          padding-top: 4px;
          font-size: 10px;
          color: #64748b;
        }
        .sig-approved-stamp {
          background: #ecfdf5;
          border: 1px solid #10b981;
          color: #047857;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
        }
        .circular-seal {
          width: 78px;
          height: 78px;
          border: 2px dashed #0284c7;
          border-radius: 50%;
          padding: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seal-inner-circle {
          width: 100%;
          height: 100%;
          border: 1px solid #0284c7;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 8px;
          color: #0369a1;
          line-height: 1.1;
        }
        .seal-center {
          font-size: 10px;
          font-weight: 900;
          color: #0284c7;
          margin: 1px 0;
        }
        .voucher-footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .disclaimer-text {
          font-size: 9.5px;
          color: #64748b;
          margin: 0 0 6px;
          line-height: 1.45;
        }
        .footer-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
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

  setTimeout(() => {
    printIframe.contentWindow.focus()
    printIframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(printIframe)
    }, 1500)
  }, 400)
}
</script>

<style scoped>
.payslip-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999999 !important;
  background: rgba(3, 7, 24, 0.86);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  direction: rtl;
}

.payslip-modal-card {
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.15);
  border-radius: 18px;
  width: 100%;
  max-width: 880px;
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
  padding: 14px 20px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
  flex-wrap: wrap;
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-icon {
  font-size: 24px;
}

.bar-title h3 {
  margin: 0;
  font-size: 16px;
  color: #ffffff;
  font-weight: 800;
}

.bar-title p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: #94a3b8;
}

.bar-title p strong {
  color: #38bdf8;
  font-family: monospace;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn-whatsapp,
.action-btn-print,
.action-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.action-btn-whatsapp {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
}

.action-btn-whatsapp:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.action-btn-print {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
}

.action-btn-print:hover {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: translateY(-1px);
}

.action-btn-copy {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.action-btn-copy:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.close-bar-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-bar-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* المحتوى القابل للتمرير */
.modal-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #0b1120;
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

.payslip-error-state .error-icon {
  font-size: 40px;
}

.retry-btn {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
}

/* ================= ورقة السند والفاتورة الرسمية ================= */
.official-voucher-paper {
  background: #ffffff;
  color: #0f172a;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  border: 1px solid #e2e8f0;
}

/* الترويسة */
.voucher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 20px;
}

.company-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo-emblem {
  width: 54px;
  height: 54px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #38bdf8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 22px;
  border: 2px solid #38bdf8;
  box-shadow: 0 4px 10px rgba(56, 189, 248, 0.2);
}

.brand-text h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.company-name-en {
  display: block;
  font-size: 11.5px;
  color: #475569;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.company-legal-tags {
  font-size: 11px;
  color: #64748b;
  margin-top: 3px;
  display: flex;
  gap: 6px;
}

.voucher-title-block {
  text-align: left;
  direction: ltr;
}

.voucher-title-pill {
  background: #0f172a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  padding: 6px 16px;
  border-radius: 6px;
  display: inline-block;
  direction: rtl;
  letter-spacing: 0.2px;
}

.voucher-title-sub {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  margin-top: 3px;
  letter-spacing: 1px;
}

.voucher-verified-stamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #059669;
  font-weight: 700;
  margin-top: 4px;
  direction: rtl;
}

.voucher-divider-gold {
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #6366f1, #eab308, #10b981);
  border-radius: 2px;
  margin-bottom: 16px;
}

/* شريط البيانات الفوري */
.voucher-meta-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 18px;
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-lbl {
  font-size: 11px;
  color: #64748b;
}

.meta-val {
  font-size: 12.5px;
  color: #0f172a;
}

.meta-val.code {
  font-family: monospace;
  font-weight: 800;
  color: #0284c7;
}

.meta-val.month-tag {
  font-weight: 800;
  color: #4338ca;
}

.meta-val.hash {
  font-family: monospace;
  font-size: 11px;
  color: #64748b;
}

/* بطاقة بيانات الموظف */
.voucher-section-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 18px;
  background: #ffffff;
}

.section-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.section-card-title h4 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  color: #1e293b;
}

.employee-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 18px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #64748b;
}

.detail-value {
  font-size: 12.5px;
  color: #0f172a;
}

.detail-value.emp-name {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.ltr {
  direction: ltr;
  text-align: right;
}

/* صندوق صافي المبلغ */
.net-salary-highlight-box {
  border: 1.5px solid #38bdf8;
  background: #f0f9ff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.highlight-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #bae6fd;
  padding-bottom: 14px;
  margin-bottom: 14px;
  gap: 20px;
}

.amount-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #0369a1;
  display: block;
  margin-bottom: 2px;
}

.amount-figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.amount-figure .val {
  font-size: 30px;
  font-weight: 900;
  color: #0c4a6e;
}

.amount-figure .currency {
  font-size: 14px;
  font-weight: 800;
  color: #0284c7;
}

.tafqeet-side {
  max-width: 55%;
  text-align: left;
  direction: rtl;
}

.tafqeet-title {
  font-size: 11px;
  color: #475569;
  font-weight: 700;
  display: block;
}

.tafqeet-text {
  margin: 3px 0 0;
  font-size: 13.5px;
  font-weight: 800;
  color: #0369a1;
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
  font-size: 10.5px;
  color: #64748b;
}

.pay-method-item .val {
  font-size: 12.5px;
  color: #0f172a;
}

.pay-method-item .val.code {
  font-family: monospace;
  color: #0284c7;
}

.text-green {
  color: #059669 !important;
}

.notes-sub-box {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #bae6fd;
  font-size: 11.5px;
}

.notes-sub-box .lbl {
  font-weight: 700;
  color: #64748b;
}

.notes-sub-box p {
  margin: 2px 0 0;
  color: #334155;
}

/* التوقيعات والختم */
.voucher-signatures-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.sig-block {
  text-align: center;
  width: 30%;
}

.sig-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  display: block;
  margin-bottom: 6px;
}

.sig-space {
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sig-signature-name {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
  font-family: cursive, 'Segoe UI';
}

.sig-date {
  font-size: 10px;
  color: #64748b;
}

.sig-line {
  display: block;
  border-top: 1px dashed #94a3b8;
  padding-top: 4px;
  font-size: 10.5px;
  color: #64748b;
}

.sig-approved-stamp {
  background: #ecfdf5;
  border: 1px solid #10b981;
  color: #047857;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 800;
}

.circular-seal {
  width: 82px;
  height: 82px;
  border: 2px dashed #0284c7;
  border-radius: 50%;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-inner-circle {
  width: 100%;
  height: 100%;
  border: 1px solid #0284c7;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 8px;
  color: #0369a1;
  line-height: 1.15;
}

.seal-company {
  font-weight: 800;
}

.seal-star {
  font-size: 7px;
  color: #0284c7;
  letter-spacing: 2px;
}

.seal-center {
  font-size: 11px;
  font-weight: 900;
  color: #0284c7;
  margin: 1px 0;
}

.seal-dept {
  font-size: 8px;
  color: #475569;
}

/* تذييل الفاتورة */
.voucher-footer {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.disclaimer-text {
  font-size: 10px;
  color: #64748b;
  margin: 0 0 6px;
  line-height: 1.45;
}

.footer-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  color: #94a3b8;
}

/* الفوتر السفلي للمودال */
.modal-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #1e293b;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
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

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.footer-btn.whatsapp {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}

.footer-btn.whatsapp:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.footer-btn.print {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #ffffff;
}

.footer-btn.print:hover {
  background: linear-gradient(135deg, #0284c7, #0369a1);
}

.footer-btn.close {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.footer-btn.close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* التجاوب مع الشاشات الصغيرة */
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

  .action-btn-whatsapp,
  .action-btn-print,
  .footer-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
