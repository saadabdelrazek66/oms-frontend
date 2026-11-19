<template>
  <Teleport to="body">
    <div v-if="show" class="receipt-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="receipt-modal-card">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <div class="bar-icon-wrap">
              <svg class="bar-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3>سند قبض إيراد مالي معتمد</h3>
              <p v-if="receiptData">سند رسمي رقم: <strong class="voucher-code-header">{{ receiptData.voucher_number }}</strong> — العميل: <strong>{{ receiptData.client?.name }}</strong></p>
            </div>
          </div>

          <div class="bar-actions">
            <button
              v-if="receiptData"
              type="button"
              class="action-btn-print"
              title="تنزيل سند القبض بصيغة PDF أو طباعته"
              @click="printReceipt"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              <span>تحميل PDF / طباعة</span>
            </button>

            <button
              v-if="receiptData"
              type="button"
              class="action-btn-copy"
              title="نسخ نص الإشعار الرسمي للعميل"
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
          <div v-if="loading" class="receipt-loading-state">
            <div class="spinner-ring"></div>
            <span>جارٍ استدعاء بيانات سند القبض المعتمد من الدفاتر المالية...</span>
          </div>

          <!-- رسالة خطأ إن وجدت -->
          <div v-else-if="error" class="receipt-error-state">
            <div class="error-icon-box">
              <svg class="error-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"></path>
              </svg>
            </div>
            <p>{{ error }}</p>
            <button type="button" class="retry-btn" @click="fetchReceipt">إعادة المحاولة</button>
          </div>

          <!-- ورقة سند القبض الرسمية المعتمدة -->
          <div v-else-if="receiptData" id="printable-client-receipt" ref="receiptRef" class="official-voucher-paper">
            <!-- ترويسة الشركة الرسمية المعتمدة -->
            <div class="voucher-header">
              <div class="company-brand">
                <div class="brand-logo-container">
                  <img src="/logo.png" alt="OctoMedia" class="company-logo-img" />
                </div>
                <div class="brand-text">
                  <h2 class="company-name-ar">{{ receiptData.company?.name || 'شركة أكتوميديا للخدمات الرقمية والتسويق' }}</h2>
                  <span class="company-name-en">{{ receiptData.company?.name_en || 'OctoMedia Digital Solutions & Marketing L.L.C' }}</span>
                  <div class="company-legal-tags">
                    <span>سجل تجاري: {{ receiptData.company?.commercial_reg || '194820' }}</span>
                    <span class="dot-separator">•</span>
                    <span>بطاقة ضريبية: {{ receiptData.company?.tax_number || '724-819-350' }}</span>
                  </div>
                </div>
              </div>

              <div class="voucher-title-block">
                <div class="voucher-title-badge receipt-badge">
                  <span class="voucher-title-ar">سند قبض إيراد معتمد</span>
                  <span class="voucher-title-en">OFFICIAL RECEIPT VOUCHER</span>
                </div>
                <div class="voucher-reference-row">
                  <span class="ref-label">رقم سند القبض:</span>
                  <strong class="ref-code">{{ receiptData.voucher_number }}</strong>
                </div>
                <span class="voucher-status-stamp receipt-stamp">
                  <svg class="check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  تم التحصيل وقيد بالدفاتر
                </span>
              </div>
            </div>

            <!-- خط الفاصل المؤسسي المزدوج -->
            <div class="voucher-divider-rule"></div>

            <!-- شريط بيانات السند الأساسية -->
            <div class="voucher-meta-strip">
              <div class="meta-item">
                <span class="meta-lbl">تاريخ التحصيل الفعلي</span>
                <strong class="meta-val font-mono">{{ receiptData.transaction_date }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">نوع المعاملة</span>
                <strong class="meta-val text-emerald">إيراد ومقبوضات (Income)</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">طبيعة الإيراد</span>
                <strong class="meta-val">{{ receiptData.financials?.nature_label }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التدقيق المالي</span>
                <strong class="meta-val hash font-mono">{{ receiptData.audit?.security_hash }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات العميل / الجهة الدافعة -->
            <div class="voucher-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات العميل / الجهة الدافعة</h4>
                  <span class="sub-en">CLIENT & PAYER DETAILS</span>
                </div>
                <span v-if="receiptData.client?.total_paid_lifetime" class="ltv-pill">
                  إجمالي مقبوضات العميل: <strong>{{ Number(receiptData.client.total_paid_lifetime).toLocaleString() }} ج.م</strong>
                </span>
              </div>
              <div class="employee-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم العميل / الشركة</span>
                  <strong class="detail-value emp-name">{{ receiptData.client?.name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">رقم الهاتف والتواصل</span>
                  <span class="detail-value ltr">{{ receiptData.client?.phone || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البريد الإلكتروني</span>
                  <span class="detail-value ltr">{{ receiptData.client?.email || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المشروع المرتبط</span>
                  <strong class="detail-value">{{ receiptData.financials?.project_name || 'خدمات / عقد مباشر' }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">عدد الدفعات المسجلة</span>
                  <span class="detail-value font-mono">{{ receiptData.client?.payments_count || 1 }} دفعة</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">حالة الحساب</span>
                  <span class="detail-value text-emerald font-semibold verified-tag">
                    <svg class="inline-check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>حساب نشط ومسدد</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- صندوق صافي المبلغ المقبوض البارز والتفقيط المالي -->
            <div class="net-receipt-highlight-box">
              <div class="highlight-main-row">
                <div class="highlight-info-group">
                  <span class="highlight-sub-title">المبلغ المقبوض الفعلي (صافي المحصل)</span>
                  <div class="highlight-big-amount">
                    <span class="currency-tag">{{ receiptData.financials?.currency_symbol || 'ج.م' }}</span>
                    <strong class="amount-number">{{ receiptData.financials?.amount_formatted }}</strong>
                  </div>
                </div>

                <div class="highlight-details-group">
                  <div class="detail-item">
                    <span class="item-label">طريقة الدفع:</span>
                    <strong class="item-value">{{ receiptData.financials?.payment_method }}</strong>
                  </div>
                  <div class="detail-item">
                    <span class="item-label">أودع في الخزينة:</span>
                    <strong class="item-value">{{ receiptData.financials?.account_name }}</strong>
                  </div>
                  <div v-if="receiptData.financials?.reference_number" class="detail-item">
                    <span class="item-label">رقم المرجع / الإيصال:</span>
                    <strong class="item-value font-mono">{{ receiptData.financials.reference_number }}</strong>
                  </div>
                </div>
              </div>

              <!-- سطر الإقرار المالي والتفقيط القانوني الواضح -->
              <div class="tafqeet-legal-box">
                <div class="tafqeet-row">
                  <span class="tafqeet-prefix">وصلنا من السادة:</span>
                  <strong class="tafqeet-client-name">« {{ receiptData.client?.name }} »</strong>
                </div>
                <div class="tafqeet-row">
                  <span class="tafqeet-prefix">مبلغاً وقدره:</span>
                  <strong class="tafqeet-text">« {{ receiptData.financials?.amount_in_words }} »</strong>
                </div>
                <div class="tafqeet-row">
                  <span class="tafqeet-prefix">وذلك نظير:</span>
                  <span class="tafqeet-description">{{ receiptData.financials?.description }}</span>
                </div>
              </div>
            </div>

            <!-- ختم الاعتماد الرسمي والتوقيعات المؤسسية -->
            <div class="voucher-authorization-strip">
              <div class="signature-column">
                <span class="sig-title">أمين الخزينة / الحسابات</span>
                <span class="sig-name">{{ receiptData.audit?.created_by || 'الشؤون المالية' }}</span>
                <div class="sig-line"></div>
                <span class="sig-hint">توقيع مسؤول الاستلام</span>
              </div>

              <!-- الختم المالي الرقمي لشركة أكتوميديا -->
              <div class="official-seal-wrap">
                <div class="corporate-digital-seal receipt-seal">
                  <div class="seal-inner-circle">
                    <div class="seal-top-text">OCTOMEDIA DIGITAL</div>
                    <div class="seal-dots">• • •</div>
                    <div class="seal-badge-box">معتمد رسمي</div>
                    <div class="seal-status-en">RECEIVED & VERIFIED</div>
                    <div class="seal-bottom-text">الخزينة والشؤون المالية</div>
                  </div>
                </div>
                <span class="seal-sub-caption">معتمد رسمياً بنظام ERP</span>
              </div>

              <div class="signature-column">
                <span class="sig-title">الاعتماد المالي / الإدارة</span>
                <span class="sig-name">إدارة شركة أكتوميديا</span>
                <div class="sig-line"></div>
                <span class="sig-hint">خاتم وتوقيع الإدارة المالية</span>
              </div>
            </div>

            <!-- تذييل السند القانوني -->
            <div class="voucher-footer-notes">
              <div class="footer-legal-notice">
                <p>
                  <strong>إشعار قانوني:</strong> يعتبر هذا السند إيصال استلام مالي رسمي معتمد ومقيد بالدفاتر والحسابات المالية المعتمدة لشركة أكتوميديا للحلول الرقمية والتسويق L.L.C، وتم إثبات حركة المقبوضات في سجلات الخزينة المذكورة أعلاه.
                </p>
              </div>
              <div class="footer-meta-row">
                <span>تاريخ ووقت إصدار السند: <strong>{{ receiptData.issue_date }}</strong></span>
                <span class="dot-separator">•</span>
                <span>المستخدم المنشئ: <strong>{{ receiptData.audit?.created_by }}</strong></span>
                <span class="dot-separator">•</span>
                <span>رقم المعاملة الفريد: <strong>TRX-ID #{{ receiptData.transaction_id }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  transactionId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref(null)
const receiptData = ref(null)
const receiptRef = ref(null)

const fetchReceipt = async () => {
  if (!props.transactionId) return
  loading.value = true
  error.value = null

  try {
    const res = await api.get(`/finance/clients/receipt/${props.transactionId}`)
    receiptData.value = res.data?.data || null
  } catch (err) {
    console.error('Error fetching client receipt:', err)
    error.value = err.response?.data?.message || 'تعذر تحميل بيانات سند القبض المعتمد، يرجى المحاولة مرة أخرى.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    if (val && props.transactionId) {
      fetchReceipt()
    } else if (!val) {
      receiptData.value = null
      error.value = null
    }
  },
  { immediate: true }
)

// نسخ نص الإشعار الرسمي
const copyNotificationText = async () => {
  if (!receiptData.value) return

  const text = receiptData.value.notification_text || `سند وإيصال استلام مالي معتمد
السادة الكرام / ${receiptData.value.client?.name || 'العميل'}
• رقم سند القبض: ${receiptData.value.voucher_number}
• المبلغ المستلم: ${receiptData.value.financials?.amount_formatted} ${receiptData.value.financials?.currency_symbol || 'ج.م'}
• المبلغ بالحروف: ${receiptData.value.financials?.amount_in_words || ''}
• البيان: ${receiptData.value.financials?.description || ''}
• طريقة الدفع: ${receiptData.value.financials?.payment_method || ''}
• تم الإيداع في: ${receiptData.value.financials?.account_name || ''}
• تاريخ الاستلام: ${receiptData.value.transaction_date}

شركة أكتوميديا للخدمات الرقمية والتسويق L.L.C`

  try {
    await navigator.clipboard.writeText(text)
    alertService.toast('تم نسخ نص إيصال القبض المعتمد للحافظة بنجاح', 'success')
  } catch (err) {
    console.error('Copy failed:', err)
    alertService.toast('تعذر نسخ النص تلقائياً، يرجى التحديد والنسخ اليدوي', 'error')
  }
}

// طباعة السند وتصدير PDF عبر Isolated Iframe
const printReceipt = () => {
  const printableEl = document.getElementById('printable-client-receipt')
  if (!printableEl) {
    alertService.toast('تعذر العثور على وثيقة السند للطباعة', 'error')
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.zIndex = '-9999'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  const voucherHtml = printableEl.outerHTML

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>سند قبض معتمد - ${receiptData.value?.voucher_number || ''}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #ffffff !important;
          color: #0f172a !important;
          padding: 12px;
          line-height: 1.5;
        }
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        .official-voucher-paper {
          background: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          max-width: 820px !important;
          margin: 0 auto !important;
          padding: 24px 28px !important;
          border: 1.5px solid #cbd5e1 !important;
          border-radius: 8px !important;
        }
        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 16px;
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
        .company-name-ar {
          font-size: 17px;
          font-weight: 800;
          color: #020617;
          margin-bottom: 2px;
        }
        .company-name-en {
          font-size: 11px;
          color: #475569;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .company-legal-tags {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        .dot-separator {
          color: #cbd5e1;
        }
        .voucher-title-block {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .voucher-title-badge {
          background: #ecfdf5 !important;
          border: 1.5px solid #059669 !important;
          border-radius: 8px;
          padding: 5px 12px;
          text-align: center;
          display: inline-block;
        }
        .voucher-title-ar {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #065f46 !important;
        }
        .voucher-title-en {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: #047857 !important;
          letter-spacing: 0.8px;
        }
        .voucher-reference-row {
          font-size: 12px;
          color: #334155;
          margin-top: 4px;
        }
        .ref-code {
          font-family: 'JetBrains Mono', monospace;
          color: #047857 !important;
          font-weight: 800;
          font-size: 13px;
        }
        .voucher-status-stamp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #d1fae5 !important;
          color: #065f46 !important;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid #10b981 !important;
        }
        .voucher-divider-rule {
          height: 3px;
          background: linear-gradient(90deg, #059669 0%, #cbd5e1 50%, #059669 100%) !important;
          margin: 14px 0 16px 0;
          border-radius: 2px;
        }
        .voucher-meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
          gap: 12px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-lbl {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        .meta-val {
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
        }
        .text-emerald {
          color: #047857 !important;
        }
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        .voucher-section-card {
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 16px;
          background: #ffffff !important;
        }
        .section-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 12px;
        }
        .section-title-text h4 {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .sub-en {
          font-size: 9px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .ltv-pill {
          font-size: 11px;
          color: #065f46;
          background: #ecfdf5 !important;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #a7f3d0 !important;
        }
        .employee-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px 14px;
        }
        .detail-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .detail-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        .detail-value {
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
        }
        .emp-name {
          color: #047857 !important;
          font-size: 14px;
        }
        .ltr {
          direction: ltr;
          text-align: right;
        }
        .net-receipt-highlight-box {
          background: #ecfdf5 !important;
          border: 1.5px solid #10b981 !important;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 18px;
        }
        .highlight-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #a7f3d0;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .highlight-sub-title {
          font-size: 12px;
          font-weight: 700;
          color: #065f46;
          display: block;
          margin-bottom: 4px;
        }
        .highlight-big-amount {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .amount-number {
          font-size: 26px;
          font-weight: 900;
          color: #064e3b;
          font-family: 'JetBrains Mono', monospace;
        }
        .currency-tag {
          font-size: 14px;
          font-weight: 800;
          color: #047857;
        }
        .highlight-details-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
        }
        .detail-item {
          font-size: 12px;
        }
        .item-label {
          color: #065f46;
          font-weight: 600;
          margin-left: 6px;
        }
        .item-value {
          color: #064e3b;
          font-weight: 700;
        }
        .tafqeet-legal-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #ffffff !important;
          border: 1px solid #a7f3d0 !important;
          border-radius: 6px;
          padding: 10px 14px;
        }
        .tafqeet-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 13px;
        }
        .tafqeet-prefix {
          font-weight: 700;
          color: #047857;
          min-width: 90px;
        }
        .tafqeet-client-name {
          font-weight: 800;
          color: #0f172a;
        }
        .tafqeet-text {
          font-weight: 800;
          color: #065f46;
        }
        .tafqeet-description {
          font-weight: 600;
          color: #334155;
        }
        .voucher-authorization-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 10px 6px 10px;
          margin-bottom: 12px;
        }
        .signature-column {
          width: 170px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sig-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 4px;
        }
        .sig-name {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 18px;
        }
        .sig-line {
          width: 100%;
          border-bottom: 1.5px dashed #94a3b8;
          margin-bottom: 4px;
        }
        .sig-hint {
          font-size: 10px;
          color: #94a3b8;
        }
        .official-seal-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .corporate-digital-seal {
          width: 90px;
          height: 90px;
          border: 2px dashed #059669 !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
        }
        .seal-inner-circle {
          width: 100%;
          height: 100%;
          border: 1px solid #10b981 !important;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3px;
        }
        .seal-top-text {
          font-size: 7px;
          font-weight: 800;
          color: #065f46;
          letter-spacing: 0.5px;
        }
        .seal-dots {
          font-size: 6px;
          color: #10b981;
          line-height: 1;
          letter-spacing: 2px;
        }
        .verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .inline-check-svg {
          width: 11px;
          height: 11px;
          color: #059669 !important;
        }
        .seal-badge-box {
          background: #059669 !important;
          color: #ffffff !important;
          font-size: 8px;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 3px;
          margin: 1px 0;
        }
        .seal-status-en {
          font-size: 6px;
          font-weight: 700;
          color: #047857;
        }
        .seal-bottom-text {
          font-size: 6px;
          font-weight: 700;
          color: #065f46;
        }
        .seal-sub-caption {
          font-size: 9px;
          color: #64748b;
          font-weight: 600;
        }
        .voucher-footer-notes {
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-size: 10px;
          color: #64748b;
        }
        .footer-legal-notice p {
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .footer-meta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 10px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      ${voucherHtml}
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1500)
  }, 450)
}
</script>

<style scoped>
.receipt-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.receipt-modal-card {
  background: #0f172a;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(16, 185, 129, 0.15);
  overflow: hidden;
}

/* شريط التحكم العلوي */
.modal-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1e293b;
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.bar-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.bar-svg {
  width: 22px;
  height: 22px;
}

.bar-title h3 {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.bar-title p {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.voucher-code-header {
  color: #34d399;
  font-family: 'JetBrains Mono', monospace;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn-print {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #059669;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.action-btn-print:hover {
  background: #047857;
  transform: translateY(-1px);
}

.action-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-copy:hover {
  background: rgba(148, 163, 184, 0.22);
  color: #ffffff;
}

.close-bar-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-bar-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-svg {
  width: 16px;
  height: 16px;
}

/* التمرير الداخلي */
.modal-scroll-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  justify-content: center;
}

/* ورقة السند الرسمية */
.official-voucher-paper {
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 820px;
  padding: 28px 32px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
}

.voucher-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.company-name-ar {
  font-size: 18px;
  font-weight: 800;
  color: #020617;
  margin: 0 0 2px 0;
}

.company-name-en {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.company-legal-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.dot-separator {
  color: #cbd5e1;
}

.voucher-title-block {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.voucher-title-badge.receipt-badge {
  background: #ecfdf5;
  border: 1.5px solid #10b981;
  border-radius: 8px;
  padding: 6px 14px;
  text-align: center;
}

.voucher-title-ar {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #065f46;
}

.voucher-title-en {
  display: block;
  font-size: 9px;
  font-weight: 700;
  color: #047857;
  letter-spacing: 0.8px;
}

.voucher-reference-row {
  font-size: 12px;
  color: #334155;
  margin-top: 4px;
}

.ref-code {
  font-family: 'JetBrains Mono', monospace;
  color: #047857;
  font-weight: 800;
  font-size: 13px;
  margin-right: 4px;
}

.voucher-status-stamp.receipt-stamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #d1fae5;
  color: #065f46;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid #10b981;
}

.check-svg {
  width: 14px;
  height: 14px;
}

.voucher-divider-rule {
  height: 3px;
  background: linear-gradient(90deg, #10b981 0%, #cbd5e1 50%, #10b981 100%);
  margin: 16px 0 18px 0;
  border-radius: 2px;
}

.voucher-meta-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 18px;
  gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-lbl {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.meta-val {
  font-size: 13px;
  color: #0f172a;
  font-weight: 700;
}

.text-emerald {
  color: #047857 !important;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* بطاقة العميل */
.voucher-section-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 18px;
  background: #ffffff;
}

.section-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}

.section-title-text h4 {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.sub-en {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.ltv-pill {
  font-size: 11px;
  color: #065f46;
  background: #ecfdf5;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #a7f3d0;
}

.employee-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  font-size: 13px;
  color: #0f172a;
  font-weight: 700;
}

.emp-name {
  color: #047857 !important;
  font-size: 14px;
}

.ltr {
  direction: ltr;
  text-align: right;
}

/* صندوق المبلغ البارز */
.net-receipt-highlight-box {
  background: #ecfdf5;
  border: 1.5px solid #10b981;
  border-radius: 10px;
  padding: 18px 22px;
  margin-bottom: 20px;
}

.highlight-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #a7f3d0;
  padding-bottom: 14px;
  margin-bottom: 14px;
}

.highlight-sub-title {
  font-size: 12px;
  font-weight: 700;
  color: #065f46;
  display: block;
  margin-bottom: 4px;
}

.highlight-big-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.amount-number {
  font-size: 28px;
  font-weight: 900;
  color: #064e3b;
  font-family: 'JetBrains Mono', monospace;
}

.currency-tag {
  font-size: 15px;
  font-weight: 800;
  color: #047857;
}

.highlight-details-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.detail-item {
  font-size: 12px;
}

.item-label {
  color: #065f46;
  font-weight: 600;
  margin-left: 6px;
}

.item-value {
  color: #064e3b;
  font-weight: 700;
}

.tafqeet-legal-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 12px 16px;
}

.tafqeet-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
}

.tafqeet-prefix {
  font-weight: 700;
  color: #047857;
  min-width: 95px;
}

.tafqeet-client-name {
  font-weight: 800;
  color: #0f172a;
}

.tafqeet-text {
  font-weight: 800;
  color: #065f46;
}

.tafqeet-description {
  font-weight: 600;
  color: #334155;
}

/* التوقيعات والختم */
.voucher-authorization-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 12px 8px 12px;
  margin-bottom: 14px;
}

.signature-column {
  width: 180px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sig-title {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.sig-name {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 22px;
}

.sig-line {
  width: 100%;
  border-bottom: 1.5px dashed #94a3b8;
  margin-bottom: 4px;
}

.sig-hint {
  font-size: 10px;
  color: #94a3b8;
}

.official-seal-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.corporate-digital-seal.receipt-seal {
  width: 96px;
  height: 96px;
  border: 2px dashed #059669;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
}

.seal-inner-circle {
  width: 100%;
  height: 100%;
  border: 1px solid #10b981;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px;
}

.seal-top-text {
  font-size: 7.5px;
  font-weight: 800;
  color: #065f46;
  letter-spacing: 0.5px;
}

.seal-dots {
  font-size: 7px;
  color: #10b981;
  line-height: 1;
  letter-spacing: 2px;
}

.verified-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.inline-check-svg {
  width: 14px;
  height: 14px;
  color: #059669;
}

.seal-badge-box {
  background: #059669;
  color: #ffffff;
  font-size: 8.5px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 3px;
  margin: 1px 0;
}

.seal-status-en {
  font-size: 6.5px;
  font-weight: 700;
  color: #047857;
}

.seal-bottom-text {
  font-size: 6.5px;
  font-weight: 700;
  color: #065f46;
}

.seal-sub-caption {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
}

/* تذييل السند */
.voucher-footer-notes {
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  font-size: 10px;
  color: #64748b;
}

.footer-legal-notice p {
  margin-bottom: 6px;
  line-height: 1.4;
}

.footer-meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 10px;
  color: #94a3b8;
}

/* حالات التحميل والخطأ */
.receipt-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  gap: 16px;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.receipt-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #ef4444;
  gap: 12px;
}

.error-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-svg {
  width: 24px;
  height: 24px;
}

.retry-btn {
  padding: 8px 16px;
  background: #1e293b;
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 8px;
}

.retry-btn:hover {
  background: #334155;
}
</style>

