<template>
  <div v-if="accessDenied" class="access-denied-wrapper" dir="rtl">
    <div class="access-denied-card">
      <div class="lock-icon-badge">🔒</div>
      <h2>الوصول غير متاح حالياً</h2>
      <p class="denied-text">
        {{
          accessDeniedMessage ||
          'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.'
        }}
      </p>
      <div class="denied-actions">
        <router-link to="/plan-contents" class="return-plans-btn">
          <span>العودة إلى محتويات الخطط</span>
          <span style="font-size: 16px">↩️</span>
        </router-link>
      </div>
    </div>
  </div>

  <section v-else class="spreadsheet-page" dir="rtl">
    <SpreadsheetHeader
      :urgent-count="urgentPosts.length"
      :urgent-text="urgentText"
      :review-folder-link="reviewFolderLink"
      :final-delivery-folder-link="finalDeliveryFolderLink"
      :saving="saving"
      :add-disabled="isReviewerCheck"
      @scroll-urgent="scrollToUrgent"
      @open-archive="openArchive('plan_posts')"
      @add-row="showAddRowModal = true"
    />

    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تحميل اللوحة...
    </div>

    <div
      v-else
      ref="spreadsheetContainer"
      class="spreadsheet-container"
      @mousedown="onMouseDown"
      @mouseleave="onMouseLeave"
      @mouseup="onMouseUp"
      @mousemove="onMouseMove"
    >
      <table class="spreadsheet-table">
        <thead>
          <tr>
            <th rowspan="2" class="group-header row-num-header" style="width: 45px; text-align: center; vertical-align: middle; z-index: 10">
              #
            </th>
            <th :colspan="isDesignerOrEditor ? 1 : isMediaBuyer ? 3 : 5" class="group-header red-group">
              حالة المنشور
            </th>
            <th v-if="!isMediaBuyer" :colspan="isDesignerOrEditor ? 5 : 6" class="group-header admin-group">
              الإدارة والتكليف والمراجعة
            </th>
            <th v-if="!isDesignerOrEditor" colspan="4" class="group-header dark-red-group">موقف التمويل</th>
            <th v-if="!isMediaBuyer" colspan="8" class="group-header blue-group">محتوى المنشور</th>
            <th colspan="1" class="group-header light-blue-group">التسليم</th>
            <th colspan="1" class="group-header pink-group">ملاحظات</th>
            <th v-if="canDeletePosts || canArchivePosts" colspan="1" class="group-header admin-group">إجراءات</th>
          </tr>
          <tr>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th">تاريخ النشر المخطط</th>
            <th v-if="!isMediaBuyer && !isDesignerOrEditor" class="sub-th red-th">النشر الفعلي</th>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th">توقيت النشر</th>
            <th v-if="!isMediaBuyer" class="sub-th red-th">منصة النشر</th>
            <th v-if="!isDesignerOrEditor" class="sub-th red-th">روابط النشر</th>

            <th v-if="!isMediaBuyer && !isDesignerOrEditor" class="sub-th admin-th">المنفذ</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">بدء التنفيذ</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th" style="min-width: 145px">الديدلاين</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">المراجعين (متعدد)</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th">مراجعة القسم</th>
            <th v-if="!isMediaBuyer" class="sub-th admin-th" style="background: #cfd8dc">اعتماد المدير</th>

            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">منصة الإعلان</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">حالة التمويل</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">تكلفة التمويل ($)</th>
            <th v-if="!isDesignerOrEditor" class="sub-th dark-red-th">أيام التمويل</th>

            <th v-if="!isMediaBuyer" class="sub-th blue-th">نوع المنشور</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">الهدف</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">شرح الفكرة تفصيلياً</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Caption</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">TOV</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Call to Action</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Hashtag</th>
            <th v-if="!isMediaBuyer" class="sub-th blue-th">Reference Link</th>

            <th class="sub-th light-blue-th" style="min-width: 330px">روابط ووقت التسليم</th>
            <th class="sub-th pink-th">Note</th>
            <th v-if="canDeletePosts || canArchivePosts" class="sub-th admin-th">أرشفة / حذف</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredPosts.length === 0">
            <td
              :colspan="isMediaBuyer ? 10 : isDesignerOrEditor ? 17 : canDeletePosts || canArchivePosts ? 27 : 26"
              class="text-center py-4 muted"
            >
              لا توجد منشورات. قم بإضافة منشور جديد.
            </td>
          </tr>
          <PostRow
            v-for="(post, index) in filteredPosts"
            :key="post.id"
            :post="post"
            :index="index"
            :current-plan="currentPlan"
            :current-user="currentUser"
            :all-users="allUsers"
            :available-post-types="availablePostTypes"
            :is-manager="isManager"
            :is-account-manager="isAccountManager"
            :is-plan-delivered="isPlanDelivered"
            :is-media-buyer="isMediaBuyer"
            :is-designer-or-editor="isDesignerOrEditor"
            :can-delete-posts="canDeletePosts"
            :can-archive-posts="canArchivePosts"
            @view="openViewModal"
            @toggle-urgent="toggleUrgent"
            @target-date-change="handleTargetDateChange"
            @unlock-field="unlockField"
            @publish-status-change="handlePublishStatusChange"
            @auto-save="autoSave"
            @open-links="openLinksModal"
            @start-execution="startExecution"
            @restore-deadline="(p) => restorePostDeadline(p, selectedPostForViewRef)"
            @approve="approvePost"
            @reject="openRejectModal"
            @reset-review="resetReview"
            @open-history="openHistoryModal"
            @resubmit="resubmitPost"
            @mark-delivered="markAsDelivered"
            @open-archive="openArchiveModal"
            @archive-post="archivePost"
            @delete-post="deletePost"
          />
        </tbody>
      </table>
    </div>

    <PostAddRowModal
      v-model="showAddRowModal"
      :plan-id="planId"
      :min-date="planStartDate"
      :max-date="planEndDate"
      @created="handlePostCreated"
    />

    <PostMessagesModal
      :reject-post="rejectModalPost"
      :review-type="activeReviewType"
      :review-title="activeReviewTitle"
      :history-array="activeHistoryArray"
      :history-title="activeHistoryTitle"
      :show-wa="showWaModal"
      :wa-payload="waPayload"
      :is-manager="isManager"
      :format-wa-phone="formatWaPhone"
      @close-reject="rejectModalPost = null"
      @close-history="activeHistoryArray = null"
      @close-wa="showWaModal = false"
      @wa-payload="openWaModal"
    />

    <PostLinksAndArchiveModals
      :show-links-modal="showLinksModal"
      :links-post="currentPostForLinks"
      :pending-publish-status="pendingPublishStatus"
      :is-media-buyer="isMediaBuyer"
      :archive-post="archiveModalPost"
      :archive-row-index="archiveRowIndex"
      @close-links="showLinksModal = false"
      @close-archive="archiveModalPost = null"
      @save-publishing-time="(p) => autoSave(p, 'publishing_time')"
      @archive-saved="syncArchiveUpdate"
    />

    <PostDetailsReportModal
      v-model="isViewModalOpen"
      :post="selectedPostForView"
      :all-users="allUsers"
      :current-user="currentUser"
      :is-manager="isManager"
      :is-account-manager="isAccountManager"
      :is-plan-delivered="isPlanDelivered"
      :is-media-buyer="isMediaBuyer"
      :is-designer-or-editor="isDesignerOrEditor"
      @target-date-change="handleTargetDateChange"
      @restore-deadline="(p) => restorePostDeadline(p, selectedPostForViewRef)"
      @auto-save="autoSave"
      @resubmit="resubmitPost"
      @mark-delivered="markAsDelivered"
      @open-archive="openArchiveModal"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostAddRowModal from '@/modules/content-plans/board/components/PostAddRowModal.vue'
import PostDetailsReportModal from '@/modules/content-plans/board/components/PostDetailsReportModal.vue'
import PostLinksAndArchiveModals from '@/modules/content-plans/board/components/PostLinksAndArchiveModals.vue'
import PostMessagesModal from '@/modules/content-plans/board/components/PostMessagesModal.vue'
import PostRow from '@/modules/content-plans/board/components/PostRow.vue'
import SpreadsheetHeader from '@/modules/content-plans/board/components/SpreadsheetHeader.vue'
import { useSpreadsheetBoard } from '@/modules/content-plans/board/composables/useSpreadsheetBoard'
import { computeAndEnrichPost } from '@/modules/content-plans/board/utils/boardHelpers'

const route = useRoute()
const planId = route.params.id

const showWaModal = ref(false)
const waPayload = ref(null)

const showLinksModal = ref(false)
const currentPostForLinks = ref(null)
const pendingPublishStatus = ref(false)

const openWaModal = (payload) => {
  if (!payload?.recipients?.length) return
  waPayload.value = payload
  showWaModal.value = true
}

const openLinksModal = (post, fromPublishAction = false) => {
  if (isMediaBuyer.value) return
  currentPostForLinks.value = post
  pendingPublishStatus.value = fromPublishAction
  showLinksModal.value = true
}

const checkAndOpenQueryPost = () => {
  const targetPostId = route.query.postId || route.query.viewPost || route.query.post_id
  if (!targetPostId || !posts.value.length) return
  const foundPost = posts.value.find((p) => String(p.id) === String(targetPostId))
  if (!foundPost) return
  openViewModal(foundPost)
  nextTick(() => {
    const rowEl = document.getElementById(`post-row-${foundPost.id}`)
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      rowEl.classList.add('urgent-highlight-pulse')
      setTimeout(() => rowEl.classList.remove('urgent-highlight-pulse'), 3000)
    }
  })
}

const {
  posts,
  allUsers,
  currentUser,
  currentPlan,
  loading,
  saving,
  isPlanResponsible,
  accessDenied,
  accessDeniedMessage,
  isManager,
  isAccountManager,
  isPlanDelivered,
  isMediaBuyer,
  isDesignerOrEditor,
  isReviewerCheck,
  canDeletePosts,
  canArchivePosts,
  availablePostTypes,
  reviewFolderLink,
  finalDeliveryFolderLink,
  filteredPosts,
  formatWaPhone,
  openArchive,
  fetchPosts,
  autoSave,
  startExecution,
  markAsDelivered,
  resubmitPost,
  unlockField,
  restorePostDeadline,
  toggleUrgent,
  approvePost,
  resetReview,
  handleTargetDateChange,
  handlePublishStatusChange,
  archivePost,
  deletePost,
  initBoard,
} = useSpreadsheetBoard(planId, {
  onPostsLoaded: checkAndOpenQueryPost,
  onWaPayload: openWaModal,
  onOpenLinksModal: openLinksModal,
})

const showAddRowModal = ref(false)
const rejectModalPost = ref(null)
const activeReviewType = ref('')
const activeReviewTitle = ref('')
const activeHistoryArray = ref(null)
const activeHistoryTitle = ref('')
const archiveModalPost = ref(null)
const isViewModalOpen = ref(false)
const selectedPostForView = ref(null)
const selectedPostForViewRef = selectedPostForView

const planStartDate = computed(() => (currentPlan.value?.start_date ? new Date(currentPlan.value.start_date) : null))
const planEndDate = computed(() => (currentPlan.value?.end_date ? new Date(currentPlan.value.end_date) : null))

const currentUrgentIndex = ref(0)
const urgentPosts = computed(() => filteredPosts.value.filter((p) => Boolean(p.is_urgent)))
const urgentText = computed(() => {
  const c = urgentPosts.value.length
  if (c === 1) return 'منشور عاجل واحد'
  if (c === 2) return 'منشوران عاجلان'
  if (c >= 3 && c <= 10) return `${c} منشورات عاجلة`
  return `${c} منشوراً عاجلاً`
})

const scrollToUrgent = () => {
  if (!urgentPosts.value.length) return
  if (currentUrgentIndex.value >= urgentPosts.value.length) currentUrgentIndex.value = 0
  const targetPost = urgentPosts.value[currentUrgentIndex.value]
  const el = document.getElementById(`post-row-${targetPost.id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('urgent-highlight-pulse')
    setTimeout(() => el.classList.remove('urgent-highlight-pulse'), 2500)
  }
  currentUrgentIndex.value = (currentUrgentIndex.value + 1) % urgentPosts.value.length
}

const openViewModal = (post) => {
  if (post) {
    if (post._finalDeliveryInput === undefined) post._finalDeliveryInput = post.final_delivery_link || ''
    post._editingFinalLink = false
    post._finalDeliveryDraftTouched = false
  }
  selectedPostForView.value = post
  isViewModalOpen.value = true
}

const openRejectModal = (post, type) => {
  rejectModalPost.value = post
  activeReviewType.value = type
  activeReviewTitle.value = type === 'manager' ? 'المدير' : 'القسم'
}

const openHistoryModal = (historyArray, title) => {
  activeHistoryArray.value = historyArray
  activeHistoryTitle.value = title
}

const archiveRowIndex = computed(() => {
  if (!archiveModalPost.value) return ''
  const idx = posts.value.findIndex((p) => p.id === archiveModalPost.value.id)
  return idx >= 0 ? idx + 1 : archiveModalPost.value.id
})

const openArchiveModal = (post) => {
  archiveModalPost.value = post
}

const syncArchiveUpdate = (post) => {
  if (selectedPostForView.value?.id === post.id) {
    selectedPostForView.value.final_delivery_link = post.final_delivery_link
    selectedPostForView.value.final_delivered_at = post.final_delivered_at
  }
}

const handlePostCreated = async ({ post, isUrgent }) => {
  const prepared = computeAndEnrichPost(
    {
      objective_array: [],
      custom_objective: '',
      published_links: {},
      ...post,
    },
    {
      currentUser: currentUser.value,
      isManager: isManager.value,
      isPlanResponsible: isPlanResponsible.value,
    },
  )
  posts.value.push(prepared)
  posts.value.sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
  if (isUrgent) await fetchPosts()
}

const spreadsheetContainer = ref(null)
let isDown = false
let startX = 0
let scrollLeft = 0

const onMouseDown = (e) => {
  if (!spreadsheetContainer.value) return
  const targetTag = e.target.tagName.toLowerCase()
  if (
    ['input', 'select', 'button', 'textarea', 'a', 'path', 'svg', 'label'].includes(targetTag) ||
    e.target.closest(
      '.icon-btn, .primary-btn, .secondary-btn, .custom-multiselect, .dropdown-menu, .multiselect-toggle, .smart-deadline-cell, .deadline-active-chip, .deadline-empty-btn, .deadline-popover-card, .target-date-interactive-box',
    )
  ) {
    return
  }
  isDown = true
  spreadsheetContainer.value.classList.add('dragging')
  startX = e.pageX - spreadsheetContainer.value.offsetLeft
  scrollLeft = spreadsheetContainer.value.scrollLeft
}

const onMouseLeave = () => {
  isDown = false
  spreadsheetContainer.value?.classList.remove('dragging')
}

const onMouseUp = () => {
  isDown = false
  spreadsheetContainer.value?.classList.remove('dragging')
}

const onMouseMove = (e) => {
  if (!isDown || !spreadsheetContainer.value) return
  e.preventDefault()
  const x = e.pageX - spreadsheetContainer.value.offsetLeft
  spreadsheetContainer.value.scrollLeft = scrollLeft - (x - startX) * 1.5
}

watch(() => route.query.postId, checkAndOpenQueryPost)

onMounted(initBoard)
</script>

<style src="@/modules/content-plans/board/styles/spreadsheet-board.css"></style>
