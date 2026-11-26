import api from '@/axios'
import { validateDriveLink } from '@/utils/driveValidation'

export const availableBriefFields = {
  reviewer_ids: 'المراجعين',
  deadline: 'الديدلاين',
  finance_status: 'موقف التمويل',
  publishing_platform: 'منصة النشر',
  post_type: 'نوع المنشور',
  objective: 'الهدف',
  detailed_idea: 'شرح الفكرة تفصيلياً',
  caption: 'Caption',
  tov: 'TOV',
  call_to_action: 'Call to Action',
  hashtags: 'Hashtag',
}

export const getPlanDisplayName = (plan) => {
  if (!plan) return 'خطة غير محددة'
  if (plan.name && String(plan.name).trim()) return plan.name.trim()
  if (plan.title && String(plan.title).trim()) return plan.title.trim()
  if (plan.plan_name && String(plan.plan_name).trim()) return plan.plan_name.trim()
  if (plan.plan_type && plan.client?.name) return `${plan.plan_type} - ${plan.client.name}`
  if (plan.plan_type) return `خطة ${plan.plan_type}`
  return `خطة ${plan.client?.name || `#${plan.id}`}`
}

export const enrichPlan = (plan) => {
  if (!plan) return plan
  plan._histories = plan.review_histories || plan.reviewHistories || []
  plan._followUps = plan.client_follow_ups || plan.clientFollowUps || []
  plan._executors = plan.users ? plan.users.filter((u) => u.pivot?.task_role === 'executor') : []
  plan._responsibles = plan.users
    ? plan.users.filter((u) => u.pivot?.task_role === 'responsible')
    : []
  plan._fileLink = plan.final_link || plan.final_plan_link || plan.plan_link || ''
  plan._hasLink =
    plan._fileLink && String(plan._fileLink).trim()
      ? validateDriveLink(plan._fileLink).valid
      : false
  plan._planFolders = null
  plan._stageStates = null
  plan._displayName = getPlanDisplayName(plan)
  return plan
}

export const enrichPlans = (plansList) => {
  if (!Array.isArray(plansList)) return
  for (let i = 0; i < plansList.length; i++) enrichPlan(plansList[i])
}

export const getReviewHistories = (plan) =>
  plan ? plan._histories || plan.review_histories || plan.reviewHistories || [] : []

export const getFollowUps = (plan) =>
  plan ? plan._followUps || plan.client_follow_ups || plan.clientFollowUps || [] : []

export const getExecutors = (plan) =>
  !plan || !plan.users
    ? []
    : plan._executors || plan.users.filter((u) => u.pivot?.task_role === 'executor')

export const getResponsibles = (plan) =>
  !plan || !plan.users
    ? []
    : plan._responsibles || plan.users.filter((u) => u.pivot?.task_role === 'responsible')

export const getPlanFileLink = (plan) => {
  if (!plan) return ''
  if (plan._fileLink !== undefined) return plan._fileLink
  return plan.final_link || plan.final_plan_link || plan.plan_link || ''
}

export const getPlanFolders = (plan) => {
  if (!plan) return { review_link: null, final_delivery_link: null }
  if (plan._planFolders) return plan._planFolders

  let review_link = plan.folders?.review_link || null
  let final_delivery_link = plan.folders?.final_delivery_link || null

  const driveLinks = plan.client?.drive_links || plan.client?.driveLinks || []
  if (Array.isArray(driveLinks)) {
    if (!review_link) {
      const rf = driveLinks.find(
        (d) => d.title === 'رابط مراجعة خطط' || d.title?.includes('مراجعة خطط'),
      )
      if (rf) review_link = rf.url || rf.link || null
    }
    if (!final_delivery_link) {
      const ff = driveLinks.find(
        (d) => d.title === 'رابط تسليم نهائي خطط' || d.title?.includes('تسليم نهائي خطط'),
      )
      if (ff) final_delivery_link = ff.url || ff.link || null
    }
  }

  const res = { review_link, final_delivery_link }
  plan._planFolders = res
  return res
}

export const hasPlanLink = (plan) => {
  if (!plan) return false
  if (plan._hasLink !== undefined) return plan._hasLink
  const link = getPlanFileLink(plan)
  return !link || !String(link).trim() ? false : validateDriveLink(link).valid
}

export const isPlanClientApproved = (plan) => {
  if (!plan) return false
  if (plan.status === 'completed') return true
  return Boolean(plan.client_approved_at || plan.is_client_approved)
}

export const canApproveClient = (plan) => {
  if (!plan) return false
  if (plan.status === 'completed') return true
  if (plan.requires_review) {
    return ['reviewed', 'completed'].includes(plan.status) || Boolean(plan.actual_review_date)
  }
  return Boolean(plan.actual_initial_delivery_date || plan.status !== 'pending')
}

export const getStageState = (plan, stageNumber) => {
  if (!plan) return { status: 'waiting', label: 'بالانتظار', icon: '⏳', class: 'state-waiting' }
  if (!plan._stageStates) plan._stageStates = {}
  if (plan._stageStates[stageNumber]) return plan._stageStates[stageNumber]

  let result
  if (stageNumber === 1) {
    if (
      plan.status === 'completed' ||
      plan.actual_initial_delivery_date ||
      ['under_review', 'reviewed'].includes(plan.status)
    ) {
      result = { status: 'completed', label: 'مكتمل', icon: '✓', class: 'state-completed' }
    } else if (plan.status === 'rejected') {
      result = { status: 'rejected', label: 'تعديل مطلوب', icon: '⚠️', class: 'state-rejected' }
    } else {
      result = { status: 'active', label: 'قيد التنفيذ', icon: '1', class: 'state-active' }
    }
  } else if (stageNumber === 2) {
    if (!plan.requires_review) {
      result = { status: 'skipped', label: 'غير مطلوبة', icon: '⊘', class: 'state-skipped' }
    } else if (plan.status === 'completed' || plan.status === 'reviewed' || plan.actual_review_date) {
      result = { status: 'completed', label: 'معتمدة', icon: '✓', class: 'state-completed' }
    } else if (plan.status === 'rejected') {
      result = { status: 'rejected', label: 'مرفوضة', icon: '❌', class: 'state-rejected' }
    } else if (plan.status === 'under_review') {
      result = { status: 'active', label: 'قيد المراجعة', icon: '2', class: 'state-active' }
    } else {
      result = { status: 'waiting', label: 'بالانتظار', icon: '2', class: 'state-waiting' }
    }
  } else if (stageNumber === 3) {
    const isApproved = isPlanClientApproved(plan)
    if (plan.status === 'completed') {
      result = { status: 'completed', label: 'مكتملة', icon: '✓', class: 'state-completed' }
    } else if (isApproved) {
      result = { status: 'completed', label: 'معتمدة من العميل', icon: '✓', class: 'state-completed' }
    } else {
      const isStageActive =
        plan.status === 'reviewed' ||
        (!plan.requires_review && (plan.actual_initial_delivery_date || plan.status !== 'pending')) ||
        getFollowUps(plan).length > 0
      result = isStageActive
        ? { status: 'active', label: 'متابعة نشطة', icon: '3', class: 'state-active' }
        : { status: 'waiting', label: 'بالانتظار', icon: '3', class: 'state-waiting' }
    }
  } else if (stageNumber === 4) {
    if (plan.status === 'completed' || plan.actual_delivery_date) {
      result = { status: 'completed', label: 'تم التسليم', icon: '✓', class: 'state-completed' }
    } else if (!isPlanClientApproved(plan)) {
      result = {
        status: 'waiting',
        label: 'بانتظار اعتماد العميل',
        icon: '🔒',
        class: 'state-locked',
      }
    } else {
      const canBeDelivered =
        plan.status === 'reviewed' ||
        (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected'))
      result = canBeDelivered
        ? { status: 'active', label: 'جاهز للتسليم', icon: '4', class: 'state-active' }
        : { status: 'waiting', label: 'بالانتظار', icon: '4', class: 'state-waiting' }
    }
  } else {
    result = { status: 'waiting', label: 'بالانتظار', icon: '⏳', class: 'state-waiting' }
  }

  plan._stageStates[stageNumber] = result
  return result
}

export const getStageName = (stageNum) => {
  const names = {
    1: 'تسليم ابتدائي',
    2: 'مراجعة داخلية',
    3: 'متابعة مع العميل',
    4: 'التسليم النهائي',
  }
  return names[stageNum] || 'المرحلة'
}

export const getActiveStageNumber = (plan) => {
  if (!plan) return 1
  if (plan.status === 'completed') return 4
  if (plan.status === 'under_review') return 2
  if (plan.status === 'rejected') return 1
  if (plan.status === 'reviewed') return isPlanClientApproved(plan) ? 4 : 3
  if (!plan.requires_review && (plan.actual_initial_delivery_date || plan.status !== 'pending')) {
    return isPlanClientApproved(plan) ? 4 : 3
  }
  return 1
}

export const getRoleNames = (users = [], role) => {
  const matches = users.filter((u) => u.pivot?.task_role === role)
  return matches.length ? matches.map((u) => u.name).join('، ') : '—'
}

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const toDatetimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export const parseDateSafe = (dStr) => {
  if (!dStr) return null
  const d = new Date(dStr.includes('T') ? dStr : `${dStr}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

export const getPlanStatusInfo = (status) => {
  switch (status) {
    case 'completed':
      return { text: 'مكتملة ومُعتمدة', class: 'status-green' }
    case 'reviewed':
      return { text: 'جاهزة لمراجعة العميل', class: 'status-blue' }
    case 'under_review':
      return { text: 'قيد المراجعة', class: 'status-purple' }
    case 'rejected':
      return { text: 'مرفوضة (تعديل)', class: 'status-red' }
    case 'pending':
    default:
      return { text: 'قيد التنفيذ', class: 'status-gray' }
  }
}

export const formatHours = (val) => {
  if (val === undefined || val === null) return '0'
  const num = Number(val)
  return num % 1 === 0 ? num.toString() : num.toFixed(1)
}

export const calculateItemsHours = (items) => {
  if (!Array.isArray(items)) return 0
  return items.reduce(
    (sum, item) =>
      sum + (Number(item.total_hours) || Number(item.quantity) * Number(item.hours_per_unit)),
    0,
  )
}

const apiBaseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : ''

export const getFollowUpImageUrl = (followUp) => {
  if (!followUp) return ''
  const path = followUp.image_path || followUp.image_url
  if (!path) return ''
  if (/^(https?:\/\/|blob:|data:)/.test(path)) return path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${apiBaseUrl}/${cleanPath}`
}

export const getClientGroupLinks = (plan, allClients = []) => {
  if (!plan) return []
  if (Array.isArray(plan.client?.group_links) && plan.client.group_links.length > 0) {
    return plan.client.group_links
  }
  const clientId = plan.client_id || plan.client?.id
  if (clientId && Array.isArray(allClients) && allClients.length > 0) {
    const found = allClients.find((c) => c.id === clientId)
    if (Array.isArray(found?.group_links)) return found.group_links
  }
  return []
}

export const getClientContactList = (plan) => {
  if (!plan || !plan.client) return []
  const list = []
  if (Array.isArray(plan.client.contacts)) {
    plan.client.contacts.forEach((c) => {
      list.push({
        id: c.id,
        name: c.contact_name || 'جهة اتصال',
        method: c.contact_method || 'whatsapp',
        details: c.contact_details || '',
        is_primary: false,
      })
    })
  }
  if (plan.client.phone) {
    const exists = list.some(
      (item) =>
        String(item.details).replace(/\D/g, '') === String(plan.client.phone).replace(/\D/g, ''),
    )
    if (!exists) {
      list.unshift({
        id: 'client_phone',
        name: `${plan.client.name} (الرقم الرئيسي)`,
        method: 'whatsapp',
        details: plan.client.phone,
        is_primary: true,
      })
    }
  }
  return list
}

export const validateManagerPlanForm = (form) => {
  const errors = []
  const fieldErrors = {}

  if (!form.client_id) {
    errors.push('العميل المستهدف مطلوب.')
    fieldErrors.client_id = 'يرجى اختيار العميل'
  }
  if (!form.plan_type) {
    errors.push('نوع الخطة مطلوب.')
    fieldErrors.plan_type = 'يرجى تحديد نوع الخطة'
  }
  if (!form.start_date) {
    errors.push('تاريخ بداية الخطة مطلوب.')
    fieldErrors.start_date = 'يرجى تحديد تاريخ البداية'
  }
  if (!form.end_date) {
    errors.push('تاريخ نهاية الخطة مطلوب.')
    fieldErrors.end_date = 'يرجى تحديد تاريخ النهاية'
  }

  const start = parseDateSafe(form.start_date)
  const end = parseDateSafe(form.end_date)
  const delivery = parseDateSafe(form.planned_delivery_date)
  const review = parseDateSafe(form.planned_review_date)
  const initialDelivery = parseDateSafe(form.planned_initial_delivery_date)

  if (start && end && end < start) {
    errors.push('تاريخ نهاية الخطة يجب أن يكون مساوياً أو بعد تاريخ البداية.')
    fieldErrors.end_date = 'تاريخ النهاية يجب ألا يسبق تاريخ البداية'
  }

  if (!form.planned_delivery_date) {
    errors.push('موعد التسليم النهائي مطلوب.')
    fieldErrors.planned_delivery_date = 'يرجى تحديد موعد التسليم النهائي'
  } else if (start && delivery && delivery >= start) {
    errors.push('التسليم النهائي يجب أن يتم قبل تاريخ بداية الخطة.')
    fieldErrors.planned_delivery_date = 'التسليم النهائي يجب أن يتم قبل تاريخ بداية الخطة'
  }

  if (form.requires_review) {
    if (!form.planned_review_date) {
      errors.push('موعد إنهاء المراجعة الداخلية مطلوب.')
      fieldErrors.planned_review_date = 'يرجى تحديد موعد إنهاء المراجعة'
    } else if (delivery && review && review >= delivery) {
      errors.push('موعد إنهاء المراجعة يجب أن يسبق موعد التسليم النهائي.')
      fieldErrors.planned_review_date = 'موعد إنهاء المراجعة يجب أن يسبق موعد التسليم النهائي'
    }
    if (!form.reviewer_ids?.length) {
      errors.push('يرجى اختيار مراجع واحد على الأقل للخطة.')
      fieldErrors.reviewer_ids = 'يرجى اختيار مراجع للخطة'
    }
  }

  if (form.planned_initial_delivery_date && initialDelivery) {
    if (form.requires_review) {
      if (review && initialDelivery >= review) {
        errors.push('موعد التسليم الابتدائي يجب أن يسبق موعد المراجعة.')
        fieldErrors.planned_initial_delivery_date = 'موعد التسليم الابتدائي يجب أن يسبق موعد المراجعة'
      } else if (!review && delivery && initialDelivery >= delivery) {
        errors.push('موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي.')
        fieldErrors.planned_initial_delivery_date =
          'موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي'
      }
    } else if (delivery && initialDelivery >= delivery) {
      errors.push('موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي.')
      fieldErrors.planned_initial_delivery_date =
        'موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي'
    }
  }

  if (!form.responsible_ids?.length) {
    errors.push('يرجى اختيار شخص مسؤول واحد على الأقل للخطة.')
    fieldErrors.responsible_ids = 'يرجى اختيار مسؤول للخطة'
  }
  if (!form.executor_ids?.length) {
    errors.push('يرجى اختيار منفذ واحد على الأقل للخطة.')
    fieldErrors.executor_ids = 'يرجى اختيار منفذ للخطة'
  }

  return { isValid: errors.length === 0, errors, fieldErrors }
}

export const translateValidationError = (field, message) => {
  if (!message) return ''
  const fieldLabels = {
    client_id: 'العميل المستهدف',
    plan_type: 'نوع الخطة',
    start_date: 'تاريخ بداية الخطة',
    end_date: 'تاريخ نهاية الخطة',
    planned_delivery_date: 'التسليم النهائي',
    planned_review_date: 'موعد إنهاء المراجعة',
    planned_initial_delivery_date: 'موعد التسليم الابتدائي',
    responsible_ids: 'المسؤول عن الخطة',
    reviewer_ids: 'المراجع',
    executor_ids: 'المنفذ',
    required_brief_fields: 'إعدادات الحقول الإلزامية للمنشورات',
    reference_links: 'الروابط المرجعية',
    final_link: 'رابط الخطة',
    notes: 'الملاحظات',
  }
  const fieldName = fieldLabels[field] || field
  if (/[\u0600-\u06FF]/.test(message)) return message

  const lower = message.toLowerCase()
  if (lower.includes('required')) return `حقل (${fieldName}) مطلوب ولا يمكن تركه فارغاً.`
  if (field === 'planned_delivery_date' && (lower.includes('before') || lower.includes('start'))) {
    return 'التسليم النهائي يجب أن يتم قبل تاريخ بداية الخطة.'
  }
  if (field === 'planned_review_date' && (lower.includes('before') || lower.includes('delivery'))) {
    return 'موعد إنهاء المراجعة يجب أن يسبق موعد التسليم النهائي.'
  }
  if (field === 'planned_initial_delivery_date') {
    if (lower.includes('review')) return 'موعد التسليم الابتدائي يجب أن يسبق موعد المراجعة.'
    if (lower.includes('delivery')) return 'موعد التسليم الابتدائي يجب أن يسبق موعد التسليم النهائي.'
    if (lower.includes('before')) {
      return 'موعد التسليم الابتدائي يجب أن يسبق موعد المراجعة أو التسليم النهائي.'
    }
  }
  if (field === 'end_date' && (lower.includes('after') || lower.includes('start'))) {
    return 'تاريخ نهاية الخطة يجب أن يكون مساوياً أو بعد تاريخ البداية.'
  }
  if (lower.includes('before or equal to') || lower.includes('before')) {
    if (lower.includes('start_date') || lower.includes('start date')) {
      return `(${fieldName}) يجب أن يكون قبل تاريخ بداية الخطة.`
    }
    if (lower.includes('planned_delivery_date') || lower.includes('delivery date')) {
      return `(${fieldName}) يجب أن يسبق موعد التسليم النهائي.`
    }
    if (lower.includes('planned_review_date') || lower.includes('review date')) {
      return `(${fieldName}) يجب أن يسبق موعد إنهاء المراجعة.`
    }
    return `(${fieldName}) يجب أن يكون تاريخاً سابقاً للمرحلة التالية.`
  }
  if (lower.includes('after or equal to') || lower.includes('after')) {
    if (lower.includes('start_date') || lower.includes('start date')) {
      return `(${fieldName}) يجب أن يكون مساوياً أو بعد تاريخ بداية الخطة.`
    }
    if (lower.includes('planned_initial_delivery_date')) {
      return `(${fieldName}) يجب أن يكون بعد موعد التسليم الابتدائي.`
    }
    if (lower.includes('planned_review_date')) {
      return `(${fieldName}) يجب أن يكون بعد موعد إنهاء المراجعة.`
    }
    return `(${fieldName}) يجب أن يكون تاريخاً لاحقاً للمرحلة السابقة.`
  }
  if (lower.includes('date')) return `(${fieldName}) يجب أن يكون تاريخاً صالحاً.`
  return `[${fieldName}]: ${message}`
}
