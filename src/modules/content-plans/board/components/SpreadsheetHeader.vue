<template>
  <div class="page-topline">
    <div class="topline-info">
      <div class="breadcrumbs">
        <router-link to="/plan-contents">محتويات الخطط</router-link>
        <span>/</span>
        <span>لوحة المحتوى التفصيلية</span>
      </div>
      <h2>مصنع المحتوى (Spreadsheet)</h2>
      <p>تعديل فوري، تعبئة سريعة، وحفظ تلقائي لجميع خلايا الخطة.</p>
    </div>

    <div
      v-if="urgentCount > 0"
      class="urgent-top-banner"
      title="اضغط للانتقال إلى المنشورات العاجلة"
      @click="$emit('scroll-urgent')"
    >
      <div class="urgent-banner-icon">
        <span class="beacon-pulse"></span>
        🚨
      </div>
      <div class="urgent-banner-text">
        <span class="urgent-banner-badge">{{ urgentCount }}</span>
        <span class="urgent-banner-label">
          يوجد <strong>{{ urgentText }}</strong> بحاجة لمتابعة عاجلة
        </span>
      </div>
      <button
        type="button"
        class="urgent-jump-btn"
        title="التمرير إلى المنشور العاجل التالي"
        @click.stop="$emit('scroll-urgent')"
      >
        <span>انتقال</span>
        <span class="jump-arrow">⬇️</span>
      </button>
    </div>

    <div class="header-actions">
      <div v-if="reviewFolderLink || finalDeliveryFolderLink" class="drive-folders-group">
        <a
          v-if="reviewFolderLink"
          :href="formatExternalUrl(reviewFolderLink)"
          target="_blank"
          rel="noopener noreferrer"
          class="drive-folder-btn review-btn"
          title="فتح مجلد رفع المراجعة على Google Drive للعميل"
        >
          <GoogleDriveIcon :size="15" class="drive-icon" />
          <span class="btn-text">مجلد رفع المراجعة</span>
          <span class="external-arrow" aria-hidden="true">↗</span>
        </a>

        <a
          v-if="finalDeliveryFolderLink"
          :href="formatExternalUrl(finalDeliveryFolderLink)"
          target="_blank"
          rel="noopener noreferrer"
          class="drive-folder-btn final-btn"
          title="فتح مجلد التسليم النهائي على Google Drive للعميل"
        >
          <GoogleDriveIcon :size="15" class="drive-icon" />
          <span class="btn-text">مجلد التسليم النهائي</span>
          <span class="external-arrow" aria-hidden="true">↗</span>
        </a>
      </div>

      <span v-if="saving" class="saving-indicator">
        <i class="spinner"></i> جارٍ الحفظ...
      </span>

      <button
        v-permission="'archive.view'"
        type="button"
        class="drive-folder-btn"
        style="background: rgba(99, 102, 241, 0.16); border-color: rgba(129, 140, 248, 0.35); color: #c7d2fe"
        title="فتح أرشيف المنشورات"
        @click="$emit('open-archive')"
      >
        <span>🗄️</span>
        <span class="btn-text">أرشيف المنشورات</span>
      </button>

      <button class="primary-btn" type="button" :disabled="addDisabled" @click="$emit('add-row')">
        <span>＋</span> منشور إضافي
      </button>
    </div>
  </div>
</template>

<script setup>
import GoogleDriveIcon from '@/components/ui/GoogleDriveIcon.vue'
import { formatExternalUrl } from '@/utils/driveValidation'

defineProps({
  urgentCount: { type: Number, default: 0 },
  urgentText: { type: String, default: '' },
  reviewFolderLink: { type: String, default: null },
  finalDeliveryFolderLink: { type: String, default: null },
  saving: { type: Boolean, default: false },
  addDisabled: { type: Boolean, default: false },
})

defineEmits(['scroll-urgent', 'open-archive', 'add-row'])
</script>
