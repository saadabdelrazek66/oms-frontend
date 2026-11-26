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

            <a
              v-if="payslipData?.whatsapp?.url"
              :href="payslipData.whatsapp.url"
              target="_blank"
              class="action-btn-whatsapp"
              title="إرسال سند الصرف المعتمد للموظف عبر واتساب"
            >
              <svg class="btn-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span>إرسال واتساب</span>
            </a>

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
            <a
              v-if="payslipData?.whatsapp?.url"
              :href="payslipData.whatsapp.url"
              target="_blank"
              class="footer-btn whatsapp"
            >
              <svg class="btn-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span>إرسال عبر واتساب 🚀</span>
            </a>

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
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/axios'
import { useNotificationTemplates } from '@/composables/useNotificationTemplates'
import { copyToClipboard, formatArabicDateTime } from '@/modules/finance/utils/financeHelpers'
import { printFinanceDocument } from '@/modules/finance/utils/voucherPrint'

const { fetchTemplates: fetchNotificationTemplates } = useNotificationTemplates()

onMounted(() => {
  fetchNotificationTemplates()
})

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

const currentDateTime = computed(() => formatArabicDateTime())

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
  await copyToClipboard(
    payslipData.value.whatsapp.message,
    'تم نسخ نص إشعار وسند الراتب إلى الحافظة بنجاح.',
  )
}

const printPayslip = () => {
  printFinanceDocument({
    elementId: 'printable-payslip',
    title: `سند صرف راتب - ${payslipData.value?.employee?.name || ''} - ${payslipData.value?.financials?.salary_month || ''}`,
    variant: 'slate',
    fallbackToWindowPrint: true,
  })
}
</script>

<style scoped src="@/modules/finance/styles/salary-payslip-modal.css"></style>
