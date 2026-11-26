/**
 * Shared formatting, status badges, countdown, linkification, and file metadata helpers
 * for the Quick Tasks module.
 */

export const getStatusColor = (status) => {
  const map = {
    pending: {
      text: 'قيد الانتظار',
      badge: 'bg-slate-800/90 text-slate-300 border-slate-700/70',
      dot: 'bg-slate-400',
      accentBar: 'bg-slate-500/60',
      glow: 'bg-slate-500/5',
    },
    in_progress: {
      text: 'جاري التنفيذ',
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
      dot: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-pulse',
      accentBar: 'bg-sky-500',
      glow: 'bg-sky-500/10',
    },
    under_review: {
      text: 'قيد المراجعة',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
      dot: 'bg-amber-400',
      accentBar: 'bg-amber-500',
      glow: 'bg-amber-500/10',
    },
    rejected: {
      text: 'مرفوضة',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      dot: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]',
      accentBar: 'bg-rose-500',
      glow: 'bg-rose-500/10',
    },
    completed: {
      text: 'مكتملة',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
      accentBar: 'bg-emerald-500',
      glow: 'bg-emerald-500/10',
    },
  }
  return map[status] || map.pending
}

export const getStatusText = (status) => {
  const map = {
    pending: 'قيد الانتظار',
    in_progress: 'جاري التنفيذ',
    under_review: 'قيد المراجعة',
    rejected: 'مرفوضة (تحتاج تعديل)',
    completed: 'مكتملة',
  }
  return map[status] || status
}

export const getStatusBadgeInfo = (status) => {
  switch (status) {
    case 'under_review':
      return {
        label: 'قام بالتسليم للمراجعة 🚀',
        badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      }
    case 'completed':
      return {
        label: 'تم الاعتماد بنجاح ✅',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      }
    case 'rejected':
      return {
        label: 'طلب تعديل وملاحظات ⚠️',
        badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      }
    case 'in_progress':
      return {
        label: 'بدء التنفيذ ⏳',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      }
    default:
      return {
        label: status ? `تحديث: ${status}` : 'ملاحظة ومتابعة',
        badgeClass: 'bg-[#8999e2]/15 text-[#a8b5f0] border border-[#8999e2]/25',
      }
  }
}

export const getCountdown = (dueDate, nowMs) => {
  if (!dueDate) return { text: 'غير محدد', colorClass: 'text-[#6e79a9]' }
  const due = new Date(dueDate).getTime()
  const diff = due - nowMs

  if (diff < 0) return { text: 'متأخر', colorClass: 'text-[#ff4757] font-extrabold' }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  let text = ''
  if (days > 0) text += `${days} يوم `
  if (hours > 0) text += `${hours} ساعة `
  if (days === 0 && minutes > 0) text += `${minutes} دقيقة`
  if (text === '') text = 'أقل من دقيقة'

  let colorClass = 'text-[#7de8dc]'
  if (days === 0) colorClass = 'text-[#ffc107]'

  return { text: text.trim(), colorClass }
}

export const getCountdownBadgeStyle = (dueDate, nowMs) => {
  if (!dueDate) return 'border-slate-800 text-slate-500 bg-slate-900/60'
  const due = new Date(dueDate).getTime()
  const diff = due - nowMs
  if (diff < 0) return 'border-rose-500/30 text-rose-400 bg-rose-500/10 font-bold animate-pulse'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'border-amber-500/30 text-amber-400 bg-amber-500/10 font-bold'
  return 'border-slate-700/60 text-slate-300 bg-slate-800/70 font-medium'
}

export const parseLogTimestamp = (val) => {
  if (!val) return null
  if (typeof val === 'number') return val
  const str = String(val).trim()
  if (!str || str === 'Invalid Date') return null

  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str)
    return str.length === 10 ? num * 1000 : num
  }

  let d = new Date(str)
  if (!isNaN(d.getTime())) return d.getTime()

  if (str.includes(' ')) {
    d = new Date(str.replace(' ', 'T'))
    if (!isNaN(d.getTime())) return d.getTime()
  }

  return null
}

export const formatDeadline = (dateStr) => {
  if (!dateStr || dateStr === 'Invalid Date') return ''
  if (typeof dateStr === 'string' && (dateStr.includes('ago') || dateStr.includes('منذ'))) {
    return dateStr
  }
  try {
    const t = parseLogTimestamp(dateStr)
    if (t !== null) {
      return new Date(t).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  } catch {
    // Fallback to raw string
  }
  return String(dateStr)
}

export const formatTaskCreatedTime = (taskObj) => {
  if (!taskObj) return 'بداية التكليف'
  if (taskObj.created_at_human) return taskObj.created_at_human
  const raw = taskObj.created_at || taskObj.created_date
  if (raw) {
    const formatted = formatDeadline(raw)
    if (formatted && formatted !== 'Invalid Date') return formatted
  }
  return 'بداية التكليف'
}

export const formatLogTime = (log) => {
  if (!log) return ''
  if (log.created_at_human) return log.created_at_human
  const raw = log.created_at || log.created_date
  if (raw) {
    const formatted = formatDeadline(raw)
    if (formatted && formatted !== 'Invalid Date') return formatted
  }
  return 'الآن'
}

const escapeHtml = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const linkifyText = (text) => {
  if (!text) return ''
  const escaped = escapeHtml(text).replace(/\n/g, '<br>')
  const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi

  return escaped.replace(urlRegex, (match) => {
    let url = match
    let trailing = ''
    const punct = /[.,!?:;؟،)\]]+$/
    const punctMatch = url.match(punct)
    if (punctMatch) {
      trailing = punctMatch[0]
      url = url.slice(0, -trailing.length)
    }
    const href = url.toLowerCase().startsWith('www.') ? `https://${url}` : url
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-clickable-link" title="فتح الرابط: ${url}"><span>${url}</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>${trailing}`
  })
}

export const getAudioExtension = (mimeType) => {
  if (!mimeType) return 'webm'
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) return 'mp4'
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3'
  return 'webm'
}

export const getFileCategory = (filename, mimeType = '') => {
  if (mimeType && mimeType.startsWith('audio/')) return 'audio'
  if (mimeType && mimeType.startsWith('image/')) return 'image'
  if (mimeType && mimeType.startsWith('video/')) return 'video'

  if (!filename) return 'file'
  const ext = filename.split('.').pop().toLowerCase()

  const groups = {
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'aac', 'flac', 'wma', 'amr'],
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'wmv'],
    pdf: ['pdf'],
    document: ['doc', 'docx', 'txt', 'rtf'],
    spreadsheet: ['xls', 'xlsx', 'csv'],
    presentation: ['ppt', 'pptx'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  }

  for (const [category, exts] of Object.entries(groups)) {
    if (exts.includes(ext)) return category
  }
  return 'file'
}

export const getAttachmentCategory = (url, type) => {
  if (type && type !== 'none') return type
  if (!url) return 'file'
  return getFileCategory(url)
}

export const getFileExt = (filename) => {
  if (!filename) return 'ملف'
  const parts = filename.split('?')[0].split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : 'ملف'
}

export const getFileNameFromUrl = (url) => {
  if (!url) return 'ملف مرفق'
  const parts = url.split('?')[0].split('/')
  return parts.pop() || 'ملف مرفق'
}

export const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

export const getFileBadgeLabel = (type) => {
  const labels = {
    audio: 'ملف صوتي',
    image: 'صورة',
    video: 'فيديو',
    pdf: 'مستند PDF',
    document: 'مستند Word',
    spreadsheet: 'جدول بيانات',
    presentation: 'عرض تقديمي',
    archive: 'ملف مضغوط',
  }
  return labels[type] || 'ملف مرفق'
}
