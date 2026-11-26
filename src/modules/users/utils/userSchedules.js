/**
 * Shared user work-schedule, department, work-type, and salary normalization helpers.
 * Reused across UsersManagement, UserFormModal, and UserProfileModal.
 */

export const jobTitles = [
  'Video Editor',
  'Graphic Designer',
  'Developer',
  'Media Buyer',
  'Account Manager',
  'Sales',
]

export const availableDays = [
  { key: 'saturday', label: 'السبت' },
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الإثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
]

export const getDayLabel = (key) => {
  const found = availableDays.find((d) => d.key === key)
  return found ? found.label : key
}

export const formatDaysRange = (startKey, endKey) => {
  if (!startKey || !endKey) return ''
  return `من ${getDayLabel(startKey)} إلى ${getDayLabel(endKey)}`
}

export const formatTimeLabel = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.slice(0, 5).split(':')
  let h = parseInt(parts[0], 10)
  const m = parts[1] || '00'
  if (isNaN(h)) return timeStr
  const ampm = h >= 12 ? 'م' : 'ص'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

export const getWorkTypeInfo = (type) => {
  switch (type) {
    case 'remote':
      return { text: 'عن بعد', class: 'remote' }
    case 'onsite':
      return { text: 'من الشركة', class: 'onsite' }
    case 'per_task':
      return { text: 'بالتاسك', class: 'per-task' }
    case 'commission':
      return { text: 'بالعمولة', class: 'commission' }
    default:
      return { text: 'غير محدد', class: 'default' }
  }
}

export const getPrimaryDepartmentName = (user) => {
  if (!user?.departments?.length) return '—'
  const primary = user.departments.find((dept) => dept.pivot?.is_primary)
  return primary ? primary.name : '—'
}

export const getAdditionalDepartments = (user) => {
  if (!user?.departments?.length) return []
  return user.departments.filter((dept) => !dept.pivot?.is_primary)
}

export const cleanAndNormalizeSalary = (val) => {
  if (val === null || val === undefined || val === '') return ''
  let s = String(val).trim()
  const arabicEastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٫']
  const latinWestern = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.']
  for (let i = 0; i < arabicEastern.length; i++) {
    s = s.replaceAll(arabicEastern[i], latinWestern[i])
  }
  s = s.replace(/[,\s٬،]/g, '')
  s = s.replace(/EGP|egp|L\.?E\.?|ج\.?م\.?|جنيه/gi, '')
  return s
}
