<template>
  <Teleport to="body">
    <div v-if="showLinksModal" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-links')">
        <div class="modal-content links-modal-card" style="width: min(540px, 95%); border-radius: 14px; padding: 22px" dir="rtl">
          <div class="d-flex align-items-center justify-content-between mb-3" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px">
            <h3 style="margin: 0; font-size: 17px; color: #1e293b; display: flex; align-items: center; gap: 8px">
              <span>🔗</span>
              <span>روابط النشر الفعلية</span>
            </h3>
            <button type="button" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; line-height: 1" @click="$emit('close-links')">✕</button>
          </div>

          <p
            v-if="pendingPublishStatus"
            style="color: #c2410c; font-weight: bold; font-size: 12.5px; background: #fff7ed; padding: 10px 12px; border-radius: 8px; border: 1px solid #ffedd5; margin-bottom: 15px"
          >
            ⚠️ لا يمكن إتمام عملية النشر قبل إرفاق الروابط الفعلية الصحيحة لكل منصة مطلوبة!
          </p>
          <p v-else style="font-size: 12px; color: #64748b; margin-bottom: 15px">
            أدخل رابط المنشور الفعلي لكل منصة من المنصات المحددة أدناه (يتم التحقق تلقائياً من تطابق الرابط مع المنصة).
          </p>

          <form @submit.prevent="savePublishedLinks">
            <div
              v-for="(link, platform) in tempLinks"
              :key="platform"
              class="form-group mb-3"
              style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0"
            >
              <div class="d-flex align-items-center justify-content-between mb-2">
                <label class="mb-0" style="font-size: 12px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px">
                  <span>🌐 منصة:</span>
                  <span style="color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe">{{ platform }}</span>
                  <span class="required" style="color: #ef4444">*</span>
                </label>

                <a
                  v-if="tempLinks[platform] && validatePlatformLink(platform, tempLinks[platform]).valid"
                  :href="validatePlatformLink(platform, tempLinks[platform]).formattedUrl"
                  target="_blank"
                  class="test-platform-link-btn"
                  style="font-size: 11px; color: #2563eb; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 3px"
                  title="فتح الرابط للتجربة في نافذة جديدة"
                >
                  <span>🔗 تجربة الرابط ↗</span>
                </a>
              </div>

              <input
                v-model="tempLinks[platform]"
                type="text"
                :placeholder="`أدخل رابط منشور ${platform} (مثال: https://...)`"
                dir="ltr"
                required
                style="width: 100%; padding: 9px 12px; border-radius: 6px; font-size: 12.5px; box-sizing: border-box; font-family: monospace; transition: all 0.2s"
                :style="{
                  border:
                    !tempLinks[platform] || !tempLinks[platform].trim()
                      ? '1.5px solid #cbd5e1'
                      : validatePlatformLink(platform, tempLinks[platform]).valid
                        ? '1.5px solid #10b981'
                        : '1.5px solid #ef4444',
                  background:
                    !tempLinks[platform] || !tempLinks[platform].trim()
                      ? '#fff'
                      : validatePlatformLink(platform, tempLinks[platform]).valid
                        ? '#f0fdf4'
                        : '#fef2f2',
                }"
              />

              <div
                v-if="tempLinks[platform] && tempLinks[platform].trim() && !validatePlatformLink(platform, tempLinks[platform]).valid"
                style="color: #dc2626; font-size: 11px; margin-top: 5px; font-weight: 600; line-height: 1.35"
              >
                ⚠️ {{ validatePlatformLink(platform, tempLinks[platform]).message }}
              </div>
              <div
                v-else-if="tempLinks[platform] && tempLinks[platform].trim() && validatePlatformLink(platform, tempLinks[platform]).valid"
                style="color: #059669; font-size: 11px; margin-top: 5px; font-weight: 600"
              >
                ✅ رابط صالح ومطابق لمنصة {{ platform }}
              </div>
            </div>

            <div class="modal-actions mt-4" style="display: flex; gap: 10px; justify-content: flex-end">
              <button type="button" class="secondary-btn" @click="$emit('close-links')">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="savingLinks || !areAllTempLinksValid">
                {{ savingLinks ? '⏳ جارٍ الحفظ...' : '💾 حفظ الروابط' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="archivePost" class="spreadsheet-modal-root" dir="rtl">
      <div class="modal-overlay" @click.self="$emit('close-archive')">
        <div class="modal-content archive-modal-card" style="width: min(520px, 95%); border-radius: 14px; padding: 22px" dir="rtl">
          <div class="d-flex align-items-center justify-content-between mb-3" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px">
            <h3 style="margin: 0; font-size: 17px; color: #1e293b; display: flex; align-items: center; gap: 8px">
              <span>📁</span>
              <span>{{ archivePost.final_delivery_link ? 'تعديل رابط مجلد الأرشفة' : 'إضافة رابط مجلد الأرشفة' }}</span>
            </h3>
            <button type="button" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; line-height: 1" @click="$emit('close-archive')">✕</button>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 15px">
            منشور #{{ archiveRowIndex }} | تاريخ النشر: {{ formatDate(archivePost.target_date) }}
          </p>

          <form @submit.prevent="saveArchiveModalLink">
            <div class="form-group mb-3">
              <label style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; display: block">
                رابط مجلد الأرشفة على Google Drive <span style="color: #ef4444">*</span>
              </label>
              <input
                v-model="archiveModalLink"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                dir="ltr"
                required
                style="width: 100%; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; box-sizing: border-box"
                :style="{ borderColor: archiveModalError ? '#ef4444' : archiveModalValid ? '#10b981' : '#cbd5e1' }"
                @input="handleArchiveModalInput"
              />
              <div v-if="archiveModalError" style="color: #ef4444; font-size: 11px; margin-top: 5px; font-weight: 600">
                ⚠️ {{ archiveModalError }}
              </div>
              <div v-else-if="archiveModalValid" style="color: #059669; font-size: 11px; margin-top: 5px; font-weight: 600">
                ✅ رابط مجلد Google Drive صالح
              </div>
            </div>

            <div v-if="archiveModalValid && archiveModalLink" class="mb-3">
              <a
                :href="formatExternalUrl(archiveModalLink)"
                target="_blank"
                class="extracted-link-btn final-folder-link"
                style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 11.5px"
              >
                <span>🔗 فتح الرابط للتجربة والتأكد ↗</span>
              </a>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px 12px; border-radius: 8px; font-size: 11px; color: #64748b; margin-bottom: 20px">
              🔒 <strong>تنبيه:</strong> بمجرد التأكيد، يتم تثبيت رابط الأرشفة للموظفين والمنفذ. التعديل لاحقاً متاح للمدير فقط.
            </div>

            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px">
              <button type="button" class="secondary-btn" :disabled="savingArchiveModal" @click="$emit('close-archive')">
                إلغاء
              </button>
              <button
                type="submit"
                class="primary-btn"
                :disabled="!archiveModalValid || savingArchiveModal"
                style="padding: 8px 18px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; border-radius: 6px; cursor: pointer"
              >
                {{ savingArchiveModal ? '⏳ جارٍ الحفظ...' : archivePost.final_delivery_link ? '💾 حفظ التعديل' : '✅ تأكيد الإضافة وقفل الرابط' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import { formatExternalUrl, validateDriveFolderLink } from '@/utils/driveValidation'
import { validatePlatformLink } from '@/utils/platformValidation'
import { formatDate, parsePlatforms } from '../utils/boardHelpers'

const props = defineProps({
  showLinksModal: { type: Boolean, default: false },
  linksPost: { type: Object, default: null },
  pendingPublishStatus: { type: Boolean, default: false },
  isMediaBuyer: { type: Boolean, default: false },
  archivePost: { type: Object, default: null },
  archiveRowIndex: { type: [Number, String], default: '' },
})

const emit = defineEmits(['close-links', 'close-archive', 'save-publishing-time', 'archive-saved'])

const tempLinks = ref({})
const savingLinks = ref(false)

const archiveModalLink = ref('')
const archiveModalError = ref('')
const archiveModalValid = ref(false)
const savingArchiveModal = ref(false)

watch(
  () => [props.showLinksModal, props.linksPost],
  ([open, post]) => {
    if (!open || !post) return
    const next = {}
    parsePlatforms(post.publishing_platform).forEach((platform) => {
      next[platform] = post.published_links?.[platform] || ''
    })
    tempLinks.value = next
  },
)

watch(
  () => props.archivePost,
  (post) => {
    if (!post) {
      archiveModalLink.value = ''
      archiveModalError.value = ''
      archiveModalValid.value = false
      savingArchiveModal.value = false
      return
    }
    archiveModalLink.value = post.final_delivery_link || ''
    archiveModalError.value = ''
    archiveModalValid.value = Boolean(
      post.final_delivery_link && validateDriveFolderLink(post.final_delivery_link).valid,
    )
  },
)

const areAllTempLinksValid = computed(() => {
  const keys = Object.keys(tempLinks.value || {})
  if (keys.length === 0) return false
  return keys.every((platform) => {
    const link = tempLinks.value[platform]
    return link && String(link).trim() && validatePlatformLink(platform, link).valid
  })
})

const savePublishedLinks = async () => {
  if (props.isMediaBuyer || !props.linksPost) return
  const post = props.linksPost
  const platforms = parsePlatforms(post.publishing_platform)

  const missingPlatforms = platforms.filter(
    (platform) => !tempLinks.value[platform] || String(tempLinks.value[platform]).trim() === '',
  )
  if (missingPlatforms.length > 0) {
    alertService.error(`عذراً، يجب إدخال روابط لجميع المنصات المحددة: ${missingPlatforms.join('، ')}`)
    return
  }

  const formattedLinks = {}
  for (const platform of platforms) {
    const valResult = validatePlatformLink(platform, tempLinks.value[platform])
    if (!valResult.valid) {
      alertService.error(valResult.message)
      return
    }
    formattedLinks[platform] = valResult.formattedUrl
  }

  const payload = { published_links: formattedLinks }
  if (props.pendingPublishStatus) payload.actual_publish_status = 'تم النشر'

  savingLinks.value = true
  try {
    const res = await api.put(`/plan-posts/${post.id}`, payload)
    post.published_links = res.data.data ? res.data.data.published_links : formattedLinks
    if (props.pendingPublishStatus) {
      post.actual_publish_status = 'تم النشر'
      const now = new Date()
      const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (!post.publishing_time) post.publishing_time = nowStr
      else if (!post.publishing_time.includes(nowStr)) post.publishing_time = `${post.publishing_time} - ${nowStr}`
      emit('save-publishing-time', post)
    }
    emit('close-links')
    alertService.success('تم التحقق من الروابط وحفظها بنجاح ✅')
  } catch (error) {
    alertService.error(error.response?.data?.message || 'حدث خطأ أثناء حفظ الروابط!')
    if (props.pendingPublishStatus) post.actual_publish_status = 'لم يتم'
  } finally {
    savingLinks.value = false
  }
}

const handleArchiveModalInput = () => {
  const val = archiveModalLink.value ? archiveModalLink.value.trim() : ''
  if (!val) {
    archiveModalValid.value = false
    archiveModalError.value = 'يرجى إدخال الرابط'
    return
  }
  const res = validateDriveFolderLink(val)
  archiveModalValid.value = res.valid
  archiveModalError.value = res.valid ? '' : res.message
}

const saveArchiveModalLink = async () => {
  if (!props.archivePost) return
  const post = props.archivePost
  const trimmed = String(archiveModalLink.value || '').trim()
  if (!trimmed) {
    archiveModalError.value = 'يرجى إدخال رابط مجلد الأرشفة أولاً.'
    return
  }
  const res = validateDriveFolderLink(trimmed)
  if (!res.valid) {
    archiveModalError.value = res.message || 'يجب أن يكون الرابط عبارة عن رابط مجلد صحيح على Google Drive.'
    return
  }

  savingArchiveModal.value = true
  try {
    const apiRes = await api.put(`/plan-posts/${post.id}`, { final_delivery_link: trimmed })
    const updatedData = apiRes.data?.data || {}
    post.final_delivery_link = updatedData.final_delivery_link || trimmed
    post.final_delivered_at = updatedData.final_delivered_at || new Date().toISOString()
    post._isFinalDeliveryValid = true
    post._finalDeliveryError = null

    alertService.success('تم تأكيد وحفظ رابط الأرشفة بنجاح ✅')
    emit('archive-saved', post)
    emit('close-archive')
  } catch (err) {
    const errMsg = err.response?.data?.message || 'تعذر حفظ رابط الأرشفة!'
    archiveModalError.value = errMsg
    alertService.error(errMsg)
  } finally {
    savingArchiveModal.value = false
  }
}
</script>
