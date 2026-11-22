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
      // الطريقة الأولى المعتمدة: عبر API الباك إند المحمي
      const res = await api.get(`/finance/transactions/${props.transaction.id}/attachment`, {
        responseType: 'blob',
      })
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = targetName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
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

<style scoped>
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999999 !important;
  background: rgba(3, 7, 24, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  direction: rtl;
}

.preview-modal-card {
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 18px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.12);
  width: 100%;
  max-width: 960px;
  height: 88vh;
  max-height: 850px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.preview-modal-card.fullscreen-mode {
  max-width: 98vw;
  height: 96vh;
  max-height: 96vh;
  border-radius: 12px;
}

/* شريط التحكم العلوي */
.preview-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #1e293b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
  flex-shrink: 0;
  min-height: 64px;
}

.bar-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.bar-icon {
  font-size: 22px;
  background: rgba(56, 189, 248, 0.15);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(56, 189, 248, 0.25);
  flex-shrink: 0;
}

.bar-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.modal-title {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
}

.trx-pill {
  font-family: monospace;
  font-size: 11.5px;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.sub-text {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider-dot {
  margin: 0 6px;
  color: #64748b;
}

.sub-text strong {
  color: #f1f5f9;
}

.text-green {
  color: #34d399 !important;
}

.text-rose {
  color: #fb7185 !important;
}

/* أدوات التحكم المركزية في الصورة */
.bar-center-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(15, 23, 42, 0.65);
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.tool-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #ffffff;
}

.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-indicator {
  font-size: 11.5px;
  font-weight: 800;
  color: #94a3b8;
  min-width: 42px;
  text-align: center;
  font-family: monospace;
}

/* الإجراءات في الطرف الأيسر */
.bar-end-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.download-btn {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #ffffff;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
  transition: all 0.2s ease;
  height: 32px;
  white-space: nowrap;
}

.download-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: translateY(-1px);
}

.download-btn.large {
  padding: 10px 22px;
  font-size: 14px;
  height: auto;
  margin-top: 14px;
}

.print-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  height: 32px;
}

.print-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.actions-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 4px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #ef4444;
}

.mini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* منطقة العرض والمعاينة */
.preview-viewport {
  flex: 1;
  background: #060913;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  user-select: none;
}

.viewport-loader {
  position: absolute;
  inset: 0;
  background: rgba(6, 9, 19, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 600;
  z-index: 10;
}

.pulse-ring {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

/* حالة تعذر التحميل */
.media-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px;
  color: #cbd5e1;
}

.error-large-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.media-error-state h4 {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 17px;
}

.media-error-state p {
  margin: 0 0 20px;
  color: #94a3b8;
  font-size: 13px;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.retry-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #38bdf8;
  color: #0f172a;
}

/* لوحة الصورة */
.image-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img {
  max-width: 90%;
  max-height: 85%;
  object-fit: contain;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  transform-origin: center center;
  will-change: transform;
}

/* لوحة PDF */
.pdf-container {
  width: 100%;
  height: 100%;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

/* ملفات أخرى */
.generic-file-view {
  text-align: center;
  color: #e2e8f0;
  padding: 40px;
}

.file-large-icon {
  font-size: 54px;
  display: block;
  margin-bottom: 12px;
}

/* شريط البيانات السفلي */
.preview-footer-strip {
  background: #111827;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 18px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  flex-shrink: 0;
}

.footer-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-meta-item .lbl {
  color: #64748b;
  font-weight: 600;
}

.footer-meta-item .val {
  color: #f1f5f9;
  font-weight: 700;
}

.footer-meta-item .val.code {
  font-family: monospace;
  color: #38bdf8;
}

.notes-item {
  flex-basis: 100%;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  padding-top: 6px;
  margin-top: 2px;
}

.notes-item .notes {
  color: #cbd5e1;
  font-weight: normal;
}

/* حركات الظهور */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-fade-enter-active .preview-modal-card {
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .preview-top-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px;
  }
  .bar-info {
    justify-content: space-between;
  }
  .bar-center-tools {
    justify-content: center;
  }
  .bar-end-actions {
    justify-content: flex-end;
  }
  .preview-footer-strip {
    font-size: 11px;
    gap: 10px;
  }
}
</style>
