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
import { copyToClipboard } from '@/modules/finance/utils/financeHelpers'
import { printFinanceDocument } from '@/modules/finance/utils/voucherPrint'

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

  await copyToClipboard(
    text,
    'تم نسخ نص إيصال القبض المعتمد للحافظة بنجاح',
    'تعذر نسخ النص تلقائياً، يرجى التحديد والنسخ اليدوي',
  )
}

const printReceipt = () => {
  printFinanceDocument({
    elementId: 'printable-client-receipt',
    title: `سند قبض معتمد - ${receiptData.value?.voucher_number || ''}`,
    variant: 'emerald',
    notFoundMessage: 'تعذر العثور على وثيقة السند للطباعة',
  })
}
</script>

<style scoped src="@/modules/finance/styles/client-receipt-modal.css"></style>
