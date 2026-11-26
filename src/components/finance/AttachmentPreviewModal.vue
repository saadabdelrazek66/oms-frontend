<template>
  <Teleport to="body">
    <Transition name="preview-fade">
      <div
        v-if="show"
        class="preview-modal-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="closeModal"
      >
        <div class="preview-modal-card" :class="{ 'fullscreen-mode': isFullscreen }">
          <!-- شريط التحكم العلوي -->
          <div class="preview-top-bar">
            <!-- 1. معلومات المعاملة والمستفيد (يمين) -->
            <div class="bar-info">
              <span class="bar-icon">📎</span>
              <div class="bar-text-group">
                <div class="title-with-badge">
                  <h3 class="modal-title">معاينة إيصال التحويل</h3>
                  <span v-if="transaction" class="trx-pill">
                    {{ transaction.transaction_number }}
                  </span>
                </div>
                <p v-if="transaction" class="sub-text">
                  المستفيد: <strong>{{ transaction.beneficiary_name || '—' }}</strong>
                  <span class="divider-dot">•</span>
                  المبلغ: <strong :class="transaction.type === 'income' ? 'text-green' : 'text-rose'">
                    {{ Number(transaction.amount || 0).toLocaleString() }} {{ transaction.currency || 'ج.م' }}
                  </strong>
                </p>
              </div>
            </div>

            <!-- 2. أدوات التحكم بالصورة (منتصف) -->
            <div v-if="isImage && !mediaFailed" class="bar-center-tools">
              <button
                type="button"
                class="tool-btn"
                title="تصغير (-)"
                :disabled="zoomLevel <= 0.5"
                @click="zoomOut"
              >
                <span>🔍-</span>
              </button>
              <span class="zoom-indicator">{{ Math.round(zoomLevel * 100) }}%</span>
              <button
                type="button"
                class="tool-btn"
                title="تكبير (+)"
                :disabled="zoomLevel >= 3"
                @click="zoomIn"
              >
                <span>🔍+</span>
              </button>
              <button
                type="button"
                class="tool-btn"
                title="تدوير الصورة"
                @click="rotateImage"
              >
                <span>↻</span>
              </button>
              <button
                v-if="zoomLevel !== 1 || rotation !== 0"
                type="button"
                class="tool-btn reset-btn"
                title="إعادة تعيين الأبعاد"
                @click="resetView"
              >
                ⟲
              </button>
              <button
                type="button"
                class="tool-btn"
                :title="isFullscreen ? 'إنهاء وضع ملء الشاشة' : 'ملء الشاشة'"
                @click="toggleFullscreen"
              >
                <span>{{ isFullscreen ? '⤢' : '⤡' }}</span>
              </button>
            </div>

            <!-- 3. إجراءات التحميل والطباعة والإغلاق (يسار) -->
            <div class="bar-end-actions">
              <!-- زر تنزيل المرفق مباشرة -->
              <button
                type="button"
                class="download-btn"
                :disabled="downloading"
                title="تنزيل المرفق على جهازك"
                @click="downloadAttachment"
              >
                <span v-if="downloading" class="mini-spinner"></span>
                <span v-else class="icon">📥</span>
                <span>تحميل المرفق</span>
              </button>

              <!-- زر الطباعة -->
              <button
                v-if="isImage && !mediaFailed"
                type="button"
                class="print-btn"
                title="طباعة الإيصال"
                @click="printAttachment"
              >
                <span>🖨️</span>
              </button>

              <div class="actions-divider"></div>

              <!-- زر الإغلاق دائماً في أقصى الطرف اليسار -->
              <button
                type="button"
                class="close-btn"
                aria-label="إغلاق المعاينة"
                title="إغلاق (Esc)"
                @click="closeModal"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- منطقة المعاينة المركزية -->
          <div class="preview-viewport" :class="{ 'pdf-viewport': isPdf }">
            <!-- مؤشر جلب الصورة -->
            <div v-if="mediaLoading" class="viewport-loader">
              <div class="pulse-ring"></div>
              <span>جارٍ تحميل مستند الإيصال بجودة كاملة...</span>
            </div>

            <!-- حالة تعذر التحميل مع خيار إعادة المحاولة -->
            <div v-if="mediaFailed" class="media-error-state">
              <span class="error-large-icon">⚠️</span>
              <h4>تعذر عرض المرفق مباشرة</h4>
              <p>قد يتطلب الملف مصادقة إضافية أو لم يكتمل رفعه في التخزين المؤقت.</p>
              <div class="error-actions">
                <button type="button" class="retry-btn" @click="fetchImageViaApi">
                  🔄 محاولة العرض عبر الخادم المالي
                </button>
                <button type="button" class="download-btn" :disabled="downloading" @click="downloadAttachment">
                  📥 تنزيل الملف للجهاز
                </button>
              </div>
            </div>

            <!-- 1. عرض الصور (Screenshots, Receipts, JPG, PNG, WebP) -->
            <div
              v-else-if="isImage"
              class="image-canvas-wrapper"
              @mousedown="startPan"
              @mousemove="onPan"
              @mouseup="endPan"
              @mouseleave="endPan"
            >
              <img
                :src="activeImageSrc"
                :alt="`إيصال تحويل ${transaction?.transaction_number || ''}`"
                class="preview-img"
                :style="imageTransformStyle"
                @load="mediaLoading = false"
                @error="onMediaError"
              />
            </div>

            <!-- 2. عرض ملفات PDF (مستندات الدفع والفواتير بصيغة PDF) -->
            <div v-else-if="isPdf" class="pdf-container">
              <iframe
                :src="activeImageSrc"
                class="pdf-iframe"
                frameborder="0"
                @load="mediaLoading = false"
              ></iframe>
            </div>

            <!-- 3. ملفات أخرى -->
            <div v-else class="generic-file-view">
              <span class="file-large-icon">📄</span>
              <h4>{{ fileName || 'مستند مالي' }}</h4>
              <p>الملف جاهز للتحميل والاطلاع</p>
              <button type="button" class="download-btn large" @click="downloadAttachment">
                📥 تنزيل الملف الآن
              </button>
            </div>
          </div>

          <!-- شريط البيانات المالية السريعة أسفل المودال -->
          <div v-if="transaction" class="preview-footer-strip">
            <div class="footer-meta-item">
              <span class="lbl">رقم المعاملة:</span>
              <strong class="val code">{{ transaction.transaction_number }}</strong>
            </div>

            <div class="footer-meta-item">
              <span class="lbl">تاريخ المعاملة:</span>
              <strong class="val">{{ transaction.transaction_date }}</strong>
            </div>

            <div class="footer-meta-item">
              <span class="lbl">القسم / البند:</span>
              <strong class="val">{{ transaction.category?.name || '—' }}</strong>
            </div>

            <div class="footer-meta-item">
              <span class="lbl">طريقة الدفع والخزينة:</span>
              <strong class="val">{{ transaction.account?.name ? `${transaction.account.name}` : (transaction.payment_method || '—') }}</strong>
            </div>

            <div v-if="transaction.reference_number" class="footer-meta-item">
              <span class="lbl">الرقم المرجعي:</span>
              <strong class="val code">{{ transaction.reference_number }}</strong>
            </div>

            <div v-if="transaction.notes" class="footer-meta-item notes-item">
              <span class="lbl">ملاحظات:</span>
              <span class="val notes">{{ transaction.notes }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import { downloadBlobResponse } from '@/modules/finance/utils/financeHelpers'

const props = defineProps({
  show: { type: Boolean, default: false },
  transaction: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const zoomLevel = ref(1)
const rotation = ref(0)
const isFullscreen = ref(false)
const mediaLoading = ref(true)
const mediaFailed = ref(false)
const downloading = ref(false)
const imageBlobUrl = ref(null)

// إزاحة الصورة عند السحب (Pan)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const startX = ref(0)
const startY = ref(0)

const attachmentUrl = computed(() => {
  return props.transaction?.attachment_url || ''
})

// الرابط الفعلي المستخدم للعرض (Blob URL كأولوية في حال تم جلبه، أو الرابط المباشر)
const activeImageSrc = computed(() => {
  if (imageBlobUrl.value) return imageBlobUrl.value
  return attachmentUrl.value
})

const fileName = computed(() => {
  if (props.transaction?.attachment_name) return props.transaction.attachment_name
  if (!attachmentUrl.value) return 'receipt'
  return attachmentUrl.value.split('/').pop() || 'receipt'
})

const fileExtension = computed(() => {
  const parts = fileName.value.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
})

const isImage = computed(() => {
  const ext = fileExtension.value
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext) || !ext
})

const isPdf = computed(() => {
  return fileExtension.value === 'pdf'
})

const imageTransformStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg) translate(${panX.value}px, ${panY.value}px)`,
    transition: isPanning.value ? 'none' : 'transform 0.2s ease',
    cursor: zoomLevel.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default',
  }
})

const resetView = () => {
  zoomLevel.value = 1
  rotation.value = 0
  panX.value = 0
  panY.value = 0
}

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Number((zoomLevel.value + 0.25).toFixed(2))
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Number((zoomLevel.value - 0.25).toFixed(2))
  }
}

const rotateImage = () => {
  rotation.value = (rotation.value + 90) % 360
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// السحب والتنقل في الصورة (Pan)
const startPan = (e) => {
  if (zoomLevel.value <= 1) return
  isPanning.value = true
  startX.value = e.clientX - panX.value
  startY.value = e.clientY - panY.value
}

const onPan = (e) => {
  if (!isPanning.value) return
  panX.value = e.clientX - startX.value
  panY.value = e.clientY - startY.value
}

const endPan = () => {
  isPanning.value = false
}

// إغلاق المودال وتنظيف الذاكرة
const closeModal = () => {
  resetView()
  isFullscreen.value = false
  if (imageBlobUrl.value) {
    window.URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = null
  }
  mediaFailed.value = false
  emit('close')
}

// جلب الصورة كـ Blob من الـ API المحمي في حال تعذر الوصول المباشر
const fetchImageViaApi = async () => {
  if (!props.transaction?.id) return
  mediaLoading.value = true
  mediaFailed.value = false
  try {
    const res = await api.get(`/finance/transactions/${props.transaction.id}/attachment?inline=1`, {
      responseType: 'blob',
    })
    if (imageBlobUrl.value) {
      window.URL.revokeObjectURL(imageBlobUrl.value)
    }
    imageBlobUrl.value = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] || 'image/png' }))
    mediaLoading.value = false
  } catch (err) {
    console.error('Fetch image via API failed:', err)
    mediaLoading.value = false
    mediaFailed.value = true
  }
}

// التعامل مع فشل تحميل الصورة المباشر
const onMediaError = () => {
  if (!imageBlobUrl.value && props.transaction?.id) {
    fetchImageViaApi()
  } else {
    mediaLoading.value = false
    mediaFailed.value = true
  }
}

// تنزيل المرفق باحترافية وبدون فتح نوافذ بيضاء أو روابط خارجية
const downloadAttachment = async () => {
  if (!props.transaction?.id && !attachmentUrl.value) return

  downloading.value = true
  try {
    const cleanNumber = (props.transaction?.transaction_number || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '')
    const targetName = `Receipt-${cleanNumber}.${fileExtension.value || 'png'}`

    if (props.transaction?.id) {
      const res = await api.get(`/finance/transactions/${props.transaction.id}/attachment`, {
        responseType: 'blob',
      })
      downloadBlobResponse(res, targetName, '')
    } else {
      // في حال عدم وجود id: تنزيل عبر fetch المباشر
      const res = await fetch(attachmentUrl.value)
      if (!res.ok) throw new Error('فشل جلب الملف من الخادم')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = targetName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }

    alertService.toast('✅ تم تنزيل المرفق بنجاح!', 'success')
  } catch (err) {
    console.error('Download error:', err)
    alertService.error('فشل تحميل المرفق، يرجى التأكد من اتصال الخادم والصلاحيات.')
  } finally {
    downloading.value = false
  }
}

// طباعة الإيصال
const printAttachment = () => {
  const src = activeImageSrc.value
  if (!src) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    window.print()
    return
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>إيصال تحويل - ${props.transaction?.transaction_number || ''}</title>
      <style>
        body { margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; background: #fff; }
        img { max-width: 100%; max-height: 88vh; object-fit: contain; }
        .info { margin-top: 15px; font-size: 13px; color: #334155; text-align: center; }
      </style>
    </head>
    <body>
      <img src="${src}" onload="window.print(); window.close();" />
      <div class="info">
        <strong>${props.transaction?.transaction_number || ''}</strong> • 
        المستفيد: ${props.transaction?.beneficiary_name || '—'} • 
        المبلغ: ${Number(props.transaction?.amount || 0).toLocaleString()} ${props.transaction?.currency || 'ج.م'}
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// إغلاق بـ Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) {
    closeModal()
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      resetView()
      mediaLoading.value = true
      mediaFailed.value = false
      if (imageBlobUrl.value) {
        window.URL.revokeObjectURL(imageBlobUrl.value)
        imageBlobUrl.value = null
      }
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (imageBlobUrl.value) {
    window.URL.revokeObjectURL(imageBlobUrl.value)
  }
})
</script>

<style scoped src="@/modules/finance/styles/attachment-preview-modal.css"></style>
