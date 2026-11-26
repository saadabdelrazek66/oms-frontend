import { computed, nextTick, ref } from 'vue'
import api from '@/axios'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/composables/usePermissions'
import { useNotificationTemplates } from '@/composables/useNotificationTemplates'
import { useQuickArchive } from '@/modules/archive/composables/useQuickArchive'
import alertService from '@/services/alertService'
import { validateDriveFolderLink, validatePostDriveLink } from '@/utils/driveValidation'
import { validatePlatformLink } from '@/utils/platformValidation'
import {
  computeAndEnrichPost,
  extractUrls,
  formatDeadlineDisplay,
  formatForDateInput,
  normalizeDeadline,
  parsePlatforms,
  predefinedObjectives,
  resolvePlanDriveFolder,
} from '../utils/boardHelpers'

let cachedPlanCategories = null
let cachedUsers = null

/**
 * Composable owning SpreadsheetBoard state, O(1) permission caching,
 * API sync, autoSave, reviews, deadline shifts, and archive triggers.
 */
export function useSpreadsheetBoard(planId, callbacks = {}) {
  const authStore = useAuthStore()
  const { can: hasArchivePerm } = usePermissions()
  const { formatPhone: formatWaPhone, fetchTemplates: fetchNotificationTemplates } =
    useNotificationTemplates()
  const { archiveItem: quickArchive, openArchive } = useQuickArchive()

  const posts = ref([])
  const allUsers = ref([])
  const fetchedUser = ref(null)
  const currentPlan = ref(null)
  const planCategories = ref([])
  const loading = ref(true)
  const saving = ref(false)
  const isPlanResponsible = ref(false)
  const accessDenied = ref(false)
  const accessDeniedMessage = ref('')

  const currentUser = computed(() => fetchedUser.value || authStore.user || {})
  const isManager = computed(() => currentUser.value?.role === 'manager' || authStore.isManager)

  const checkIfRoleFromPlan = (plan, taskRole) => {
    if (!plan || !currentUser.value) return false
    const uid = Number(currentUser.value.id)
    return Array.isArray(plan.users)
      ? plan.users.some((u) => Number(u.id) === uid && u.pivot?.task_role === taskRole)
      : false
  }

  const isAccountManager = computed(
    () =>
      currentUser.value?.job_title === 'Account Manager' ||
      isPlanResponsible.value ||
      checkIfRoleFromPlan(currentPlan.value, 'responsible'),
  )

  const isPlanDelivered = computed(
    () =>
      Boolean(currentPlan.value) &&
      (currentPlan.value.status === 'completed' || Boolean(currentPlan.value.actual_delivery_date)),
  )

  const isMediaBuyer = computed(
    () => !isPlanResponsible.value && currentUser.value?.job_title === 'Media Buyer',
  )

  const isDesignerOrEditor = computed(() => {
    if (isManager.value || isPlanResponsible.value || checkIfRoleFromPlan(currentPlan.value, 'responsible')) {
      return false
    }
    return (
      ['Graphic Designer', 'Video Editor'].includes(currentUser.value?.job_title) ||
      checkIfRoleFromPlan(currentPlan.value, 'executor')
    )
  })

  const isReviewerCheck = computed(
    () => !(currentUser.value && (isManager.value || isPlanResponsible.value)),
  )

  const canDeletePosts = computed(
    () => isManager.value || isPlanResponsible.value || checkIfRoleFromPlan(currentPlan.value, 'responsible'),
  )
  const canArchivePosts = computed(() => hasArchivePerm('archive.manage'))

  const showToast = (msg, type = 'info') => alertService.smartToast(msg, type)

  const enrichPost = (post) =>
    computeAndEnrichPost(post, {
      currentUser: currentUser.value,
      isManager: isManager.value,
      isPlanResponsible: isPlanResponsible.value,
    })

  const enrichPosts = (list) => {
    if (!Array.isArray(list)) return
    for (let i = 0; i < list.length; i++) enrichPost(list[i])
  }

  const currentPlanCategory = computed(() => {
    if (!currentPlan.value?.plan_type || !planCategories.value?.length) return null
    const targetType = String(currentPlan.value.plan_type).trim().toLowerCase()
    return (
      planCategories.value.find((c) => String(c.name || '').trim().toLowerCase() === targetType) ||
      null
    )
  })

  const availablePostTypes = computed(() => {
    const options = []
    currentPlanCategory.value?.items?.forEach((item) => {
      const name = String(item.name || '').trim()
      if (name && !options.includes(name)) options.push(name)
    })
    currentPlan.value?.items?.forEach((item) => {
      const name = String(item.item_name || item.name || '').trim()
      if (name && !options.includes(name)) options.push(name)
    })
    if (options.length === 0) {
      ['Infograph', 'Video', 'Reel/Shorts', 'Text Only', 'Carousel'].forEach((t) => options.push(t))
    }
    posts.value.forEach((p) => {
      const val = String(p.post_type || '').trim()
      if (val && !options.includes(val)) options.push(val)
    })
    return options
  })

  const reviewFolderLink = computed(() => resolvePlanDriveFolder(currentPlan.value, 'review'))
  const finalDeliveryFolderLink = computed(() =>
    resolvePlanDriveFolder(currentPlan.value, 'final_delivery'),
  )

  const filteredPosts = computed(() => {
    if (currentUser.value?.role === 'manager' || isPlanResponsible.value) return posts.value
    if (currentUser.value?.job_title === 'Media Buyer') {
      return posts.value.filter((post) => post.finance_status === 'ممول')
    }
    const uid = currentUser.value?.id
    return posts.value.filter((post) => {
      const isDesigner = post.designer_id == uid
      const isReviewer =
        Array.isArray(post.reviewer_ids) &&
        post.reviewer_ids.some((id) => String(id) === String(uid))
      return isDesigner || isReviewer
    })
  })

  const fetchPlanCategories = async () => {
    if (cachedPlanCategories && planCategories.value.length === 0) {
      planCategories.value = cachedPlanCategories
    }
    try {
      const res = await api.get('/plan-categories/options')
      const data = res.data?.data || res.data || []
      planCategories.value = data
      cachedPlanCategories = data
    } catch (error) {
      console.error('Error fetching plan categories options:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/user')
      fetchedUser.value = res.data
    } catch {
      console.error('تعذر جلب بيانات المستخدم الحالي')
    }
  }

  const fetchUsers = async () => {
    if (cachedUsers && allUsers.value.length === 0) {
      allUsers.value = cachedUsers
      return
    }
    try {
      const res = await api.get('/users/options')
      const data = res.data.data || []
      allUsers.value = data
      cachedUsers = data
    } catch {
      // ignore
    }
  }

  const fetchCurrentPlan = async () => {
    try {
      const res = await api.get(`/content-plans/${planId}`)
      currentPlan.value = res.data.data || res.data
      if (
        !isManager.value &&
        currentPlan.value?.requires_review &&
        !['reviewed', 'completed'].includes(currentPlan.value?.status)
      ) {
        accessDenied.value = true
        accessDeniedMessage.value =
          'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.'
        return
      }
      if (checkIfRoleFromPlan(currentPlan.value, 'responsible')) {
        isPlanResponsible.value = true
        if (posts.value.length) enrichPosts(posts.value)
      }
    } catch (error) {
      if (error.response?.status === 403) {
        accessDenied.value = true
        accessDeniedMessage.value =
          error.response.data?.message ||
          'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.'
        return
      }
      console.error('Error fetching plan details:', error)
    }
  }

  const fetchPosts = async () => {
    loading.value = true
    try {
      const res = await api.get(`/content-plans/${planId}/posts`)
      const rawPosts = res.data.data || []
      posts.value = rawPosts.map((p) => {
        const objArr = p.objective ? p.objective.split(', ') : []
        const custom = objArr.filter((o) => !predefinedObjectives.includes(o))
        const predefined = objArr.filter((o) => predefinedObjectives.includes(o))
        const finalObjArr = [...predefined]
        if (custom.length > 0) finalObjArr.push('آخر')

        return enrichPost({
          ...p,
          objective_array: finalObjArr,
          custom_objective: custom.join(', '),
          ad_platform: Array.isArray(p.ad_platform)
            ? p.ad_platform
            : p.ad_platform
              ? JSON.parse(p.ad_platform)
              : [],
          reviewer_ids: Array.isArray(p.reviewer_ids)
            ? p.reviewer_ids
            : p.reviewer_ids
              ? JSON.parse(p.reviewer_ids)
              : [],
          published_links:
            typeof p.published_links === 'string'
              ? JSON.parse(p.published_links || '{}')
              : p.published_links || {},
          deadline: normalizeDeadline(p.deadline),
        })
      })

      isPlanResponsible.value =
        res.data.is_responsible ||
        checkIfRoleFromPlan(currentPlan.value, 'responsible') ||
        isPlanResponsible.value ||
        false
      if (isPlanResponsible.value) enrichPosts(posts.value)
    } catch (error) {
      if (error.response?.status === 403) {
        accessDenied.value = true
        accessDeniedMessage.value =
          error.response.data?.message ||
          'عذراً، لا يمكن للموظفين فتح لوحة المحتوى قبل اعتماد الخطة داخلياً من قِبل الإدارة.'
        return
      }
      showToast('تعذر تحميل بيانات اللوحة.')
    } finally {
      loading.value = false
      nextTick(() => callbacks.onPostsLoaded?.())
    }
  }

  const autoSave = async (post, field) => {
    if (field === 'delivery_links') {
      const valResult = validatePostDriveLink(post.delivery_links, post.post_type)
      if (!valResult.valid) {
        post._deliveryTouched = true
        post._deliveryError = valResult.message
        post._isDeliveryValid = false
        showToast(valResult.message || 'رابط البوست غير صالح ولن يتم حفظه')
        return
      }
      post._deliveryError = null
      post._isDeliveryValid = true
    }

    if (field === 'post_type' && post.delivery_links && String(post.delivery_links).trim()) {
      const valResult = validatePostDriveLink(post.delivery_links, post.post_type)
      post._isDeliveryValid = valResult.valid
      post._deliveryError = valResult.valid ? null : valResult.message
    }

    if (field === 'final_delivery_link') {
      if (post.final_delivery_link && !isManager.value) {
        showToast('عذراً، تم تثبيت رابط الأرشفة مسبقاً ولا يمكن تعديله إلا من قِبل المدير.')
        return
      }
      if (post.final_delivery_link && String(post.final_delivery_link).trim()) {
        const valResult = validateDriveFolderLink(post.final_delivery_link)
        if (!valResult.valid) {
          post._finalDeliveryTouched = true
          post._finalDeliveryError = valResult.message
          post._isFinalDeliveryValid = false
          showToast(valResult.message || 'رابط مجلد الأرشفة غير صالح ولن يتم حفظه')
          return
        }
      }
      post._finalDeliveryError = null
      post._isFinalDeliveryValid = true
    }

    if (field === 'deadline' && post.deadline) {
      const deadlineDateStr = String(post.deadline).trim().substring(0, 10)
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      if (deadlineDateStr < todayStr) {
        showToast(`عذراً، لا يمكن اختيار موعد تسليم ابتدائي في يوم مضى أو تاريخ سابق (${deadlineDateStr})!`, 'error')
        return
      }
      if (post.target_date) {
        const targetDateStr = String(post.target_date).trim().substring(0, 10)
        if (deadlineDateStr > targetDateStr) {
          showToast(`عذراً، لا يمكن أن يكون موعد التسليم الابتدائي (${deadlineDateStr}) بعد تاريخ النشر المخطط (${targetDateStr})!`, 'error')
          return
        }
      }
    }

    saving.value = true
    try {
      const res = await api.put(`/plan-posts/${post.id}`, { [field]: post[field] })
      if (res.data?.whatsapp_payload) callbacks.onWaPayload?.(res.data.whatsapp_payload)
      if (['delivery_links', 'reference_link', 'final_delivery_link'].includes(field)) {
        post._extractedRefUrls = undefined
        post._extractedDelUrls = undefined
        post._extractedFinalDelUrls = undefined
      }
      if (res.data?.data) {
        if (res.data.data.final_delivered_at) post.final_delivered_at = res.data.data.final_delivered_at
        post.is_displaced = Boolean(res.data.data.is_displaced)
        post.original_deadline = res.data.data.original_deadline || null
        post.displaced_reason = res.data.data.displaced_reason || null
      }
      enrichPost(post)

      if (res.data?.cascade_warning) {
        showToast(res.data.cascade_warning, 'warning')
        await fetchPosts()
      } else if (res.data?.displaced_items?.length) {
        showToast(`تم ترحيل ${res.data.displaced_items.length} من المهام/المنشورات تلقائياً لليوم التالي لتجاوز سعة العمل 8 ساعات 🔄`, 'info')
        await fetchPosts()
      } else if (res.data?.rolled_back_items?.length) {
        showToast(`تم إرجاع ${res.data.rolled_back_items.length} من المهام/المنشورات لمواعيدها الأصلية بعد زوال حالة الطوارئ ↩️`, 'success')
        await fetchPosts()
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء الحفظ التلقائي!')
    } finally {
      setTimeout(() => {
        saving.value = false
      }, 500)
    }
  }

  const startExecution = async (post) => {
    const confirmed = await alertService.confirm({
      title: 'بدء تنفيذ المنشور',
      message: 'هل أنت متأكد من تكليف المنفذ وبدء العمل؟ (تأكد من استكمال كافة بيانات الـ Brief)',
      confirmText: 'نعم، ابدأ العمل 🚀',
      cancelText: 'إلغاء',
      type: 'info',
    })
    if (!confirmed) return
    try {
      const res = await api.post(`/plan-posts/${post.id}/start-execution`)
      post.execution_started_at = res.data.data.execution_started_at
      if (res.data?.whatsapp_payload) callbacks.onWaPayload?.(res.data.whatsapp_payload)
      showToast(res.data.message || 'تم إعطاء إشارة البدء بنجاح 🚀')
    } catch (error) {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة بدء التنفيذ.')
    }
  }

  const markAsDelivered = (post) => {
    post._deliveryTouched = true
    const valResult = validatePostDriveLink(post.delivery_links, post.post_type)
    if (!valResult.valid) {
      showToast(valResult.message || 'رابط البوست غير صالح ولن يتم حفظه')
      return
    }
    if (!post.delivery_links || extractUrls(post.delivery_links).length === 0) {
      showToast('⚠️ لا يمكن التسليم بدون إرفاق رابط صحيح (يبدأ بـ http) في خانة التسليم.')
      return
    }
    const d = new Date()
    post.delivered_at = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    autoSave(post, 'delivered_at')
  }

  const resubmitPost = async (post) => {
    post._deliveryTouched = true
    const valResult = validatePostDriveLink(post.delivery_links, post.post_type)
    if (!valResult.valid) {
      showToast(valResult.message || 'رابط البوست غير صالح ولن يتم حفظه')
      return
    }
    if (!post.delivery_links || extractUrls(post.delivery_links).length === 0) {
      showToast('⚠️ لا يمكن إعادة التسليم للمراجعة بدون إرفاق روابط صحيحة.')
      return
    }
    const confirmed = await alertService.confirm({
      title: 'إعادة إرسال للمراجعة',
      message: 'هل أنت متأكد من إعادة إرسال المنشور للمراجعة؟',
      confirmText: 'نعم، أعد الإرسال 🔄',
      cancelText: 'إلغاء',
      type: 'info',
    })
    if (!confirmed) return
    try {
      const res = await api.post(`/plan-posts/${post.id}/resubmit`)
      Object.assign(post, {
        delivered_at: res.data.data.delivered_at,
        review_status: res.data.data.review_status,
        manager_review_status: res.data.data.manager_review_status,
        reviewers_statuses: res.data.data.reviewers_statuses || {},
        manager_approved_at: res.data.data.manager_approved_at,
      })
      if (res.data?.whatsapp_payload) callbacks.onWaPayload?.(res.data.whatsapp_payload)
      showToast('تمت إعادة الإرسال للمراجعة بنجاح 🔄')
    } catch {
      showToast('حدث خطأ أثناء إعادة الإرسال.')
    }
  }

  const unlockField = async (post, fieldName) => {
    if (!isManager.value) return
    try {
      const response = await api.post(`/plan-posts/${post.id}/unlock-field`, {
        field_name: fieldName,
      })
      post.locked_fields = response.data.locked_fields || response.data.data?.locked_fields || []
      enrichPost(post)
      showToast('تم فك القفل بنجاح 🔓')
    } catch {
      showToast('حدث خطأ أثناء فك القفل')
    }
  }

  const restorePostDeadline = async (post, selectedPostForViewRef) => {
    if (!post) return
    const confirmed = await alertService.confirm({
      title: 'استرجاع موعد التسليم الأصلي',
      message: `هل أنت متأكد من استرجاع موعد التسليم الأصلي (${formatDeadlineDisplay(post.original_deadline)}) لهذا المنشور وإلغاء حالة الترحيل؟`,
      confirmText: 'نعم، استرجع الموعد ↩️',
      cancelText: 'إلغاء',
      type: 'info',
    })
    if (!confirmed) return
    try {
      const res = await api.post(`/plan-posts/${post.id}/restore-deadline`)
      showToast(res.data?.message || 'تم استرجاع موعد التسليم الأصلي بنجاح ↩️', 'success')
      if (selectedPostForViewRef?.value?.id === post.id) {
        selectedPostForViewRef.value.is_displaced = false
        selectedPostForViewRef.value.displaced_reason = null
        if (res.data?.data?.deadline) selectedPostForViewRef.value.deadline = res.data.data.deadline
      }
      await fetchPosts()
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ أثناء استرجاع الموعد!', 'error')
    }
  }

  const toggleUrgent = async (post) => {
    post.is_urgent = !post.is_urgent
    await autoSave(post, 'is_urgent')
  }

  const approvePost = async (post, type) => {
    const confirmed = await alertService.confirm({
      title: 'تأكيد اعتماد المنشور',
      message: `هل أنت متأكد من تسجيل الاعتماد (${type === 'manager' ? 'اعتماد المدير' : 'مراجعة القسم'})؟`,
      confirmText: 'نعم، اعتمد المنشور ✅',
      cancelText: 'إلغاء',
      type: 'success',
    })
    if (!confirmed) return
    try {
      const res = await api.post(`/plan-posts/${post.id}/review`, {
        review_type: type,
        status: 'معتمد',
      })
      Object.assign(post, {
        review_status: res.data.data.review_status,
        manager_review_status: res.data.data.manager_review_status,
        reviewers_statuses: res.data.data.reviewers_statuses,
        department_approved_at: res.data.data.department_approved_at,
        manager_approved_at: res.data.data.manager_approved_at,
      })
      if (res.data?.whatsapp_payload) callbacks.onWaPayload?.(res.data.whatsapp_payload)
      showToast(
        res.data.data.review_status === 'معتمد'
          ? 'تم الاعتماد بنجاح ✅'
          : 'تم تسجيل موافقتك، بانتظار باقي المراجعين ⏳',
      )
    } catch (error) {
      showToast(error.response?.data?.message || 'غير مصرح لك أو حدث خطأ')
    }
  }

  const resetReview = async (post, type) => {
    const confirmed = await alertService.confirm({
      title: 'إعادة فتح المراجعة',
      message: 'هل أنت متأكد من التراجع وإعادة فتح المراجعة لهذا المنشور؟',
      confirmText: 'نعم، أعد فتح المراجعة 🔄',
      cancelText: 'إلغاء',
      type: 'warning',
    })
    if (!confirmed) return
    try {
      if (type === 'manager') {
        await api.put(`/plan-posts/${post.id}`, { manager_review_status: 'قيد الانتظار' })
        post.manager_review_status = 'قيد الانتظار'
        post.manager_approved_at = null
      } else {
        await api.put(`/plan-posts/${post.id}`, {
          review_status: 'قيد الانتظار',
          reviewers_statuses: {},
        })
        post.review_status = 'قيد الانتظار'
        post.reviewers_statuses = {}
        post.department_approved_at = null
      }
      showToast('تم التراجع، المنشور الآن قيد الانتظار 🔄')
    } catch {
      showToast('حدث خطأ أثناء التراجع')
    }
  }

  const handleTargetDateChange = async (post, event) => {
    const newDate = event.target.value
    if (!newDate || formatForDateInput(post.target_date) === newDate) return
    if (post.deadline) {
      const deadlineDateStr = String(post.deadline).trim().substring(0, 10)
      if (deadlineDateStr > newDate) {
        showToast(
          `عذراً، لا يمكن جعل تاريخ النشر (${newDate}) قبل موعد التسليم الابتدائي للمنشور (${deadlineDateStr})! يرجى تقديم الديدلاين أولاً.`,
          'error',
        )
        event.target.value = formatForDateInput(post.target_date)
        return
      }
    }
    const oldDate = post.target_date
    post.target_date = newDate
    saving.value = true
    try {
      await api.put(`/plan-posts/${post.id}`, { target_date: newDate })
      showToast('تم تحديث تاريخ النشر المخطط بنجاح ✅', 'success')
      posts.value.sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
    } catch (error) {
      post.target_date = oldDate
      showToast(error.response?.data?.message || 'تعذر تحديث تاريخ النشر المخطط!', 'error')
    } finally {
      saving.value = false
    }
  }

  const handlePublishStatusChange = (post) => {
    if (post.actual_publish_status !== 'تم النشر') {
      autoSave(post, 'actual_publish_status')
      return
    }
    if (post.review_status !== 'معتمد' || post.manager_review_status !== 'معتمد') {
      showToast('⚠️ لا يمكن النشر قبل الحصول على موافقة جميع المراجعين واعتماد المدير النهائي.')
      post.actual_publish_status = 'لم يتم'
      return
    }
    const platforms = parsePlatforms(post.publishing_platform)
    const hasAllLinks =
      platforms.length > 0 &&
      platforms.every(
        (platform) =>
          post.published_links?.[platform] &&
          String(post.published_links[platform]).trim() !== '' &&
          validatePlatformLink(platform, post.published_links[platform]).valid,
      )
    if (!hasAllLinks) {
      post.actual_publish_status = 'لم يتم'
      callbacks.onOpenLinksModal?.(post, true)
      return
    }
    const now = new Date()
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (!post.publishing_time) post.publishing_time = nowStr
    else if (!post.publishing_time.includes(nowStr)) post.publishing_time = `${post.publishing_time} - ${nowStr}`
    autoSave(post, 'publishing_time')
    autoSave(post, 'actual_publish_status')
  }

  const archivePost = (post, index) => {
    const title = post.objective || post.post_type || `منشور #${post.id}`
    quickArchive({
      moduleKey: 'plan_posts',
      id: post.id,
      title,
      defaultReason: 'أرشفة يدوية من جدول المنشورات',
      onSuccess: (archivedId) => {
        const idx = posts.value.findIndex((p) => p.id === archivedId)
        if (idx !== -1) posts.value.splice(idx, 1)
        else if (typeof index === 'number') posts.value.splice(index, 1)
      },
    })
  }

  const deletePost = async (post, index) => {
    const confirmed = await alertService.confirm({
      title: 'تأكيد حذف المنشور',
      message: 'هل أنت متأكد من حذف هذا الصف نهائياً؟ لا يمكن التراجع عن هذه الخطوة.',
      confirmText: 'نعم، احذف الصف 🗑️',
      cancelText: 'إلغاء',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      await api.delete(`/plan-posts/${post.id}`)
      const idx = posts.value.findIndex((p) => p.id === post.id)
      if (idx !== -1) posts.value.splice(idx, 1)
      else posts.value.splice(index, 1)
      showToast('تم حذف الصف بنجاح 🗑️')
    } catch (error) {
      showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة الحذف')
    }
  }

  const initBoard = async () => {
    fetchCurrentUser()
    fetchUsers()
    fetchNotificationTemplates(true)
    await Promise.allSettled([fetchPlanCategories(), fetchCurrentPlan(), fetchPosts()])
  }

  return {
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
  }
}
