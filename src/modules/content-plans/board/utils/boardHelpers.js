import { validateDriveFolderLink, validatePostDriveLink } from '@/utils/driveValidation'

export const predefinedObjectives = [
  'Awareness',
  'Educational',
  'Engagement',
  'Storytelling',
  'Conversion',
  'Social Proof',
]

export const objectiveOptions = [
  { label: 'Awareness', value: 'Awareness' },
  { label: 'Educational', value: 'Educational' },
  { label: 'Engagement', value: 'Engagement' },
  { label: 'Storytelling', value: 'Storytelling' },
  { label: 'Conversion', value: 'Conversion' },
  { label: 'Social Proof', value: 'Social Proof' },
  { label: 'آخر (كتابة يدوية)', value: 'آخر' },
]

export const publishingPlatformOptions = [
  { label: 'Facebook', value: 'Facebook' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Twitter/X', value: 'Twitter/X' },
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'TikTok', value: 'TikTok' },
  { label: 'Snapchat', value: 'Snapchat' },
]

export const adPlatformOptions = [
  { label: 'Facebook Ads', value: 'Facebook Ads' },
  { label: 'Google Ads', value: 'Google Ads' },
  { label: 'Snapchat Ads', value: 'Snapchat Ads' },
  { label: 'TikTok Ads', value: 'TikTok Ads' },
]

export const getObjectiveClass = (obj) => {
  const mapping = {
    Awareness: 'obj-awareness',
    Educational: 'obj-educational',
    Engagement: 'obj-engagement',
    Storytelling: 'obj-storytelling',
    Conversion: 'obj-conversion',
    'Social Proof': 'obj-social-proof',
  }
  return mapping[obj] || ''
}

export const extractUrls = (text) => {
  if (!text) return []
  return text.match(/(https?:\/\/[^\s]+)/g) || []
}

export const getUrlLabel = (url, index) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    let name = domain.split('.')[0]
    name = name.charAt(0).toUpperCase() + name.slice(1)
    if (name.toLowerCase() === 'drive') name = 'Google Drive'
    if (name.toLowerCase() === 'docs') name = 'Google Docs'
    if (name.toLowerCase() === 'trello') name = 'Trello'
    if (name.length > 12) name = `${name.substring(0, 10)}...`
    return `🔗 ${name}`
  } catch {
    return `🔗 رابط ${index + 1}`
  }
}

export const parsePlatforms = (publishingPlatform) => {
  if (!publishingPlatform) return []
  if (Array.isArray(publishingPlatform)) return publishingPlatform
  if (typeof publishingPlatform === 'string') {
    try {
      const parsed = JSON.parse(publishingPlatform)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export const hasPublishedLinks = (post) =>
  Boolean(
    post?.published_links &&
      Object.values(post.published_links).some((link) => link && String(link).trim() !== ''),
  )

export const isPostFullyApproved = (post) =>
  Boolean(post && post.review_status === 'معتمد' && post.manager_review_status === 'معتمد')

export const hasConfirmedFinalDelivery = (post) =>
  Boolean(post?.final_delivery_link && String(post.final_delivery_link).trim() !== '')

export const normalizeDeadline = (val) => {
  if (!val) return null
  const str = String(val).trim()
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:00`

  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d)) return ''
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export const formatForDateInput = (dateStr) => {
  if (!dateStr) return ''
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return dateStr.trim()
  }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

export const getDayName = (dateString) => {
  if (!dateString) return ''
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  return days[new Date(dateString).getDay()] || ''
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export const formatDeadlineDisplay = (val) => {
  if (!val) return 'غير محدد'
  const str = String(val).trim()
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/)
  if (match) {
    const h24 = parseInt(match[4], 10)
    const ampm = h24 >= 12 ? 'م' : 'ص'
    const h12 = h24 % 12 || 12
    return `${parseInt(match[3], 10)} ${AR_MONTHS[parseInt(match[2], 10) - 1]} ${match[1]} • ${String(h12).padStart(2, '0')}:${match[5]} ${ampm}`
  }
  return formatDate(val) || 'غير محدد'
}

export const formatDeliveryDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d)) return ''
  let hours = d.getHours()
  const ampm = hours >= 12 ? 'م' : 'ص'
  hours = hours % 12 || 12
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${hours}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`
}

export const resolvePlanDriveFolder = (plan, kind) => {
  if (!plan) return null
  const isReview = kind === 'review'
  const direct = isReview ? plan.folders?.review_link : plan.folders?.final_delivery_link
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const clientDirect = isReview ? plan.client?.review_link : plan.client?.final_delivery_link
  if (typeof clientDirect === 'string' && clientDirect.trim()) return clientDirect.trim()

  const driveLinks = plan.client?.drive_links || plan.client?.driveLinks
  if (Array.isArray(driveLinks)) {
    const match = driveLinks.find((d) => {
      if (!d) return false
      if (isReview) {
        return (
          d.title === 'رابط مراجعة خطط' ||
          d.title?.includes('مراجعة خطط') ||
          d.title?.includes('مراجعة') ||
          d.type === 'review'
        )
      }
      return (
        d.title === 'رابط تسليم نهائي خطط' ||
        d.title?.includes('تسليم نهائي خطط') ||
        d.title?.includes('تسليم نهائي') ||
        d.type === 'final_delivery'
      )
    })
    const url = match?.url || match?.link
    if (url && String(url).trim()) return String(url).trim()
  } else if (driveLinks && typeof driveLinks === 'object') {
    const objVal = isReview ? driveLinks.review_link : driveLinks.final_delivery_link
    if (objVal && String(objVal).trim()) return String(objVal).trim()
  }

  const fallback = isReview ? plan.review_link : plan.final_delivery_link
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : null
}

export const computeAndEnrichPost = (post, { currentUser, isManager, isPlanResponsible }) => {
  if (!post) return post
  post._lockedFieldsSet = new Set(Array.isArray(post.locked_fields) ? post.locked_fields : [])
  post._isDeliveryValid =
    post.delivery_links && String(post.delivery_links).trim()
      ? validatePostDriveLink(post.delivery_links, post.post_type).valid
      : false
  post._isFinalDeliveryValid =
    post.final_delivery_link && String(post.final_delivery_link).trim()
      ? validateDriveFolderLink(post.final_delivery_link).valid
      : false
  post._finalDeliveryInput = post.final_delivery_link || ''
  post._editingFinalLink = false
  post._finalDeliveryDraftTouched = false

  const isDelivered = Boolean(post.delivered_at)
  const isRejected =
    post.review_status === 'مرفوض' || post.manager_review_status === 'مرفوض'

  if (!currentUser) {
    post._canEdit = false
    post._canEditPublishAndNotes = false
    post._canEditNotes = false
    post._canEditDelivery = false
    return post
  }

  post._canEdit = isManager ? true : isPlanResponsible ? !(isDelivered && !isRejected) : false
  post._canEditPublishAndNotes = isManager || isPlanResponsible || post._canEdit

  const uidStr = String(currentUser.id)
  const isExec = post.designer_id != null && String(post.designer_id) === uidStr
  const isRev = Array.isArray(post.reviewer_ids)
    ? post.reviewer_ids.some((id) => String(id) === uidStr)
    : String(post.reviewer_ids || '') === uidStr
  post._canEditNotes = isManager || isPlanResponsible || isExec || isRev

  post._canEditDelivery = isManager
    ? true
    : Number(currentUser.id) === Number(post.designer_id)
      ? !(isDelivered && !isRejected)
      : false

  return post
}

export const isPostDeliveryValid = (post) => {
  if (!post || !post.delivery_links || !String(post.delivery_links).trim()) return false
  if (post._isDeliveryValid !== undefined) return post._isDeliveryValid
  return validatePostDriveLink(post.delivery_links, post.post_type).valid
}

export const isDeliveryInvalid = (post) => {
  if (!post) return false
  if (post.delivery_links && String(post.delivery_links).trim() !== '') {
    return !isPostDeliveryValid(post)
  }
  return Boolean(post._deliveryTouched)
}

export const getDeliveryError = (post) => {
  if (!post) return ''
  if (post._deliveryError !== undefined) return post._deliveryError || ''
  const res = validatePostDriveLink(post.delivery_links, post.post_type)
  return res.valid ? '' : res.message
}

export const handleDeliveryInput = (post) => {
  if (!post) return
  post._deliveryTouched = true
  post._extractedDelUrls = undefined
  const res = validatePostDriveLink(post.delivery_links, post.post_type)
  post._isDeliveryValid = res.valid
  post._deliveryError = res.valid ? null : res.message
}

export const isFieldDisabled = (post, fieldName, isManager) => {
  if (isManager) return false
  if (post?._lockedFieldsSet) return post._lockedFieldsSet.has(fieldName)
  return Array.isArray(post?.locked_fields) && post.locked_fields.includes(fieldName)
}

export const hasLockIcon = (post, fieldName) => {
  if (post?._lockedFieldsSet) return post._lockedFieldsSet.has(fieldName)
  return Array.isArray(post?.locked_fields) && post.locked_fields.includes(fieldName)
}

export const canEditFields = (post) => Boolean(post?._canEdit)
export const canEditPublishAndNotes = (post) => Boolean(post?._canEditPublishAndNotes)
export const canEditNotes = (post) => Boolean(post?._canEditNotes)
export const canEditDelivery = (post) => Boolean(post?._canEditDelivery)

export const canEditTargetDate = (isPlanDelivered, isManager, isAccountManager) =>
  !isPlanDelivered && (isManager || isAccountManager)

export const canAddFinalDelivery = (post, currentUser, isManager) => {
  if (!post || !currentUser || !isPostFullyApproved(post)) return false
  return Boolean(isManager) || Number(currentUser.id) === Number(post.designer_id)
}

export const canEditLinks = (post, isMediaBuyer, isManager) => {
  if (isMediaBuyer) return false
  return !hasPublishedLinks(post) || Boolean(isManager)
}

export const getExtractedRefUrls = (post) => {
  if (!post) return []
  if (post._extractedRefUrls !== undefined) return post._extractedRefUrls
  post._extractedRefUrls = extractUrls(post.reference_link)
  return post._extractedRefUrls
}

export const getExtractedDelUrls = (post) => {
  if (!post) return []
  if (post._extractedDelUrls !== undefined) return post._extractedDelUrls
  post._extractedDelUrls = extractUrls(post.delivery_links)
  return post._extractedDelUrls
}

export const syncObjectiveValue = (post) => {
  if (!post) return ''
  const finalArray = (post.objective_array || []).filter((v) => v !== 'آخر')
  if (post.objective_array?.includes('آخر') && post.custom_objective) {
    finalArray.push(post.custom_objective)
  }
  post.objective = finalArray.join(', ')
  return post.objective
}
