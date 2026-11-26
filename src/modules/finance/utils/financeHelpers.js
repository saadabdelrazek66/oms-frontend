import alertService from '@/services/alertService'

/**
 * Formats a Date instance as local YYYY-MM-DD (avoids UTC shift from toISOString).
 */
export function formatLocalDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Formats a Date instance as local YYYY-MM.
 */
export function formatLocalMonth(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Formats current date/time in formal Arabic locale for printed finance documents.
 */
export function formatArabicDateTime(d = new Date()) {
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Copies official notification/voucher text to clipboard and displays toast feedback.
 */
export async function copyToClipboard(
  text,
  successMsg = 'تم النسخ إلى الحافظة بنجاح.',
  errorMsg = 'تعذر النسخ التلقائي إلى الحافظة.',
) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    alertService.toast(successMsg, 'success')
    return true
  } catch (err) {
    console.error('Clipboard copy failed:', err)
    alertService.toast(errorMsg, 'error')
    return false
  }
}

/**
 * Triggers a browser file download from an Axios blob response, extracting filename
 * from Content-Disposition when provided.
 */
export function downloadBlobResponse(
  response,
  fallbackFilename,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
) {
  let fileName = fallbackFilename
  const disposition = response?.headers?.['content-disposition']
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (match && match[1]) {
      try {
        fileName = decodeURIComponent(match[1].replace(/['"]/g, ''))
      } catch {
        fileName = match[1].replace(/['"]/g, '')
      }
    }
  }

  const blob = mimeType ? new Blob([response.data], { type: mimeType }) : new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
