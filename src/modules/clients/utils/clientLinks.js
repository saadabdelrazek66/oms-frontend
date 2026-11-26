/**
 * Shared client link options, normalization, platform labels, and URL validators.
 * Reused across ClientsManager, ClientFormModal, and ClientDetailsModal.
 */

export const socialPlatformOptions = [
  { value: 'Facebook', label: 'Facebook (فيسبوك)' },
  { value: 'Instagram', label: 'Instagram (إنستغرام)' },
  { value: 'Twitter/X', label: 'Twitter / X (تويتر)' },
  { value: 'LinkedIn', label: 'LinkedIn (لينكد إن)' },
  { value: 'TikTok', label: 'TikTok (تيك توك)' },
  { value: 'Snapchat', label: 'Snapchat (سناب شات)' },
  { value: 'YouTube', label: 'YouTube (يوتيوب)' },
  { value: 'Pinterest', label: 'Pinterest (بينترست)' },
  { value: 'Threads', label: 'Threads (ثريدز)' },
  { value: 'Telegram', label: 'Telegram (تيليجرام)' },
  { value: 'WhatsApp', label: 'WhatsApp (واتساب)' },
  { value: 'Website', label: 'Website (موقع إلكتروني)' },
  { value: 'Other', label: 'أخرى (Other)' },
]

export const driveTitleOptions = [
  'رابط مراجعة خطط',
  'رابط تسليم نهائي خطط',
  'رابط مراجعة بوستات',
  'رابط تسليم نهائي بوستات',
]

export const groupPlatformOptions = [
  { value: 'whatsapp', label: 'واتساب (WhatsApp Group)', icon: '💬' },
  { value: 'telegram', label: 'تليجرام (Telegram Group)', icon: '✈️' },
  { value: 'facebook', label: 'فيسبوك (Facebook Group)', icon: '👥' },
  { value: 'discord', label: 'ديسكورد (Discord Server)', icon: '🎮' },
  { value: 'slack', label: 'سلاك (Slack Workspace)', icon: '💼' },
  { value: 'teams', label: 'مايكروسوفت تيمز (MS Teams)', icon: '👥' },
  { value: 'other', label: 'منصة أخرى (Other)', icon: '🔗' },
]

export const normalizePlatform = (platform) => {
  if (!platform) return ''
  const p = platform.trim().toLowerCase()
  if (['فيسبوك', 'facebook', 'fb'].includes(p)) return 'Facebook'
  if (['إنستغرام', 'انستغرام', 'انستجرام', 'instagram', 'insta'].includes(p)) return 'Instagram'
  if (['تويتر', 'إكس', 'اكس', 'twitter', 'x', 'twitter/x'].includes(p)) return 'Twitter/X'
  if (['لينكد إن', 'لينكد ان', 'لينكدان', 'linkedin'].includes(p)) return 'LinkedIn'
  if (['تيك توك', 'تيكتوك', 'tiktok'].includes(p)) return 'TikTok'
  if (['سناب شات', 'سناب', 'snapchat'].includes(p)) return 'Snapchat'
  if (['يوتيوب', 'youtube', 'yt'].includes(p)) return 'YouTube'
  if (['بينترست', 'pinterest'].includes(p)) return 'Pinterest'
  if (['ثريدز', 'threads'].includes(p)) return 'Threads'
  if (['تيليجرام', 'تليجرام', 'telegram'].includes(p)) return 'Telegram'
  if (['واتساب', 'واتس', 'whatsapp'].includes(p)) return 'WhatsApp'
  if (['موقع', 'موقع إلكتروني', 'موقع الكتروني', 'website', 'web'].includes(p)) return 'Website'
  return platform
}

const SOCIAL_PLATFORM_RULES = {
  Facebook: {
    name: 'Facebook (فيسبوك)',
    domains: ['facebook.com', 'fb.com', 'fb.watch', 'm.facebook.com'],
  },
  Instagram: {
    name: 'Instagram (إنستغرام)',
    domains: ['instagram.com', 'instagr.am'],
  },
  'Twitter/X': {
    name: 'Twitter / X (تويتر)',
    domains: ['twitter.com', 'x.com', 't.co'],
  },
  LinkedIn: {
    name: 'LinkedIn (لينكد إن)',
    domains: ['linkedin.com'],
  },
  TikTok: {
    name: 'TikTok (تيك توك)',
    domains: ['tiktok.com', 'vm.tiktok.com'],
  },
  Snapchat: {
    name: 'Snapchat (سناب شات)',
    domains: ['snapchat.com'],
  },
  YouTube: {
    name: 'YouTube (يوتيوب)',
    domains: ['youtube.com', 'youtu.be'],
  },
  Pinterest: {
    name: 'Pinterest (بينترست)',
    domains: ['pinterest.com', 'pin.it'],
  },
  Threads: {
    name: 'Threads (ثريدز)',
    domains: ['threads.net'],
  },
  Telegram: {
    name: 'Telegram (تيليجرام)',
    domains: ['t.me', 'telegram.me', 'telegram.org'],
  },
  WhatsApp: {
    name: 'WhatsApp (واتساب)',
    domains: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
  },
}

export const getSocialLinkError = (link) => {
  if (!link || !link.url || !link.url.trim() || !link.platform) return ''
  if (link.platform === 'Website' || link.platform === 'Other') return ''

  const rawUrl = link.url.trim().toLowerCase()

  for (const [key, rule] of Object.entries(SOCIAL_PLATFORM_RULES)) {
    if (key !== link.platform && rule.domains.some((d) => rawUrl.includes(d))) {
      const selectedName = SOCIAL_PLATFORM_RULES[link.platform]?.name || link.platform
      return `⚠️ الرابط المدخل يخص منصة ${rule.name} وليس منصة ${selectedName}!`
    }
  }

  const currentRule = SOCIAL_PLATFORM_RULES[link.platform]
  if (currentRule) {
    const isDomainMatch = currentRule.domains.some((d) => rawUrl.includes(d))
    if (!isDomainMatch && (rawUrl.includes('.') || rawUrl.startsWith('http'))) {
      return `⚠️ الرابط المدخل لا ينتمي لنطاق منصة ${currentRule.name}.`
    }
  }

  return ''
}

export const ensureHttpsPrefix = (obj) => {
  if (obj && obj.url && obj.url.trim()) {
    const u = obj.url.trim()
    if (!/^https?:\/\//i.test(u)) {
      obj.url = `https://${u}`
    }
  }
}

export const getGroupPlatformIcon = (platform) => {
  const p = (platform || '').toLowerCase()
  if (p.includes('whatsapp') || p.includes('واتس')) return '💬'
  if (p.includes('telegram') || p.includes('تليجرام') || p.includes('تيليجرام')) return '✈️'
  if (p.includes('facebook') || p.includes('فيسبوك')) return '👥'
  if (p.includes('discord') || p.includes('ديسكورد')) return '🎮'
  if (p.includes('slack') || p.includes('سلاك')) return '💼'
  if (p.includes('teams') || p.includes('تيمز')) return '👥'
  return '🔗'
}

export const getGroupPlatformLabel = (platform) => {
  const match = groupPlatformOptions.find((o) => o.value === platform || o.label === platform)
  return match ? match.label.split(' ')[0] : platform || 'جروب'
}

export const getGroupPlatformPlaceholder = (platform) => {
  switch (platform) {
    case 'whatsapp':
      return 'https://chat.whatsapp.com/AbCdEf12345...'
    case 'telegram':
      return 'https://t.me/+AbCdEf... أو https://t.me/group_name'
    case 'facebook':
      return 'https://www.facebook.com/groups/group_name...'
    case 'discord':
      return 'https://discord.gg/inviteCode أو discord.com/invite/...'
    case 'slack':
      return 'https://workspace.slack.com أو https://join.slack.com/t/...'
    case 'teams':
      return 'https://teams.microsoft.com/l/meetup-join/...'
    default:
      return 'https://example.com/group-or-workspace'
  }
}

export const getGroupPlatformHint = (platform) => {
  switch (platform) {
    case 'whatsapp':
      return 'يجب أن يكون رابط دعوة لجروب (chat.whatsapp.com) وليس رابط رقم شخصي (wa.me).'
    case 'telegram':
      return 'يجب أن يكون رابط دعوة لمجموعة تليجرام (t.me/+ أو t.me/joinchat أو اسم الجروب).'
    case 'facebook':
      return 'يجب أن يكون رابط مجموعة فيسبوك يحتوي على (/groups/) وليس صفحة أو بروفايل شخصي أو فيديو.'
    case 'discord':
      return 'يجب أن يكون رابط دعوة لسيرفر ديسكورد (discord.gg أو discord.com/invite).'
    case 'slack':
      return 'يجب أن يكون رابط مساحة عمل أو دعوة سلاك (slack.com).'
    case 'teams':
      return 'يجب أن يكون رابط فريق أو اجتماع مايكروسوفت تيمز (teams.microsoft.com).'
    default:
      return 'أدخل رابط مجموعة العمل أو مساحة التعاون (يُمنع روابط منصات الفيديو مثل يوتيوب وتيك توك).'
  }
}

export const getGroupUrlValidationError = (grp) => {
  if (!grp || !grp.url || !grp.url.trim()) return null
  const url = grp.url.trim()
  const platform = grp.platform || 'other'

  if (!/^https?:\/\//i.test(url)) {
    return 'الرابط يجب أن يبدأ بـ http:// أو https://'
  }

  const videoMediaRegex =
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|dailymotion\.com|twitch\.tv|instagram\.com|twitter\.com|x\.com|pinterest\.com)/i

  switch (platform) {
    case 'whatsapp': {
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(url)) {
        return 'هذا الرابط خاص بمحادثة رقم شخصي (wa.me) وليس رابط دعوة لجروب واتساب. يجب أن يبدأ بـ https://chat.whatsapp.com/'
      }
      const waRegex = /^https?:\/\/chat\.whatsapp\.com\/(invite\/)?[A-Za-z0-9_-]{10,}\/?(?:\?.*)?$/i
      if (!waRegex.test(url)) {
        return 'رابط جروب واتساب غير صحيح. يجب أن يكون رابط دعوة ويبدأ بـ https://chat.whatsapp.com/'
      }
      break
    }
    case 'telegram': {
      const tgRegex =
        /^https?:\/\/(www\.)?(t\.me|telegram\.me|telegram\.dog)\/(\+[a-zA-Z0-9_-]{6,}|joinchat\/[a-zA-Z0-9_-]{6,}|[a-zA-Z0-9_]{4,})\/?(?:\?.*)?$/i
      if (!tgRegex.test(url)) {
        return 'رابط تليجرام غير صحيح. يجب أن يكون رابط دعوة لمجموعة (مثال: https://t.me/+... أو https://t.me/group_name)'
      }
      break
    }
    case 'facebook': {
      const fbGroupRegex =
        /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com)\/groups\/[a-zA-Z0-9._-]{2,}\/?(?:\?.*)?$/i
      if (!fbGroupRegex.test(url)) {
        return 'رابط فيسبوك غير صحيح. يجب أن يكون رابط مجموعة جروب (facebook.com/groups/...) وليس صفحة شخصية أو فيديو.'
      }
      break
    }
    case 'discord': {
      const discordRegex =
        /^https?:\/\/((www\.)?discord\.gg\/[a-zA-Z0-9_-]{2,}|(www\.)?(discord\.com|discordapp\.com)\/invite\/[a-zA-Z0-9_-]{2,}|(www\.)?(discord\.me|discord\.io)\/[a-zA-Z0-9_-]{2,})\/?(?:\?.*)?$/i
      if (!discordRegex.test(url)) {
        return 'رابط ديسكورد غير صحيح. يجب أن يكون رابط دعوة لسيرفر (discord.gg/... أو discord.com/invite/...)'
      }
      break
    }
    case 'slack': {
      const slackRegex =
        /^https?:\/\/(join\.slack\.com\/t\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+|[a-zA-Z0-9_-]+\.slack\.com(\/[a-zA-Z0-9_./-]*)?)\/?(?:\?.*)?$/i
      if (!slackRegex.test(url)) {
        return 'رابط سلاك غير صحيح. يجب أن يكون رابط مساحة عمل أو دعوة (مثال: workspace.slack.com أو join.slack.com)'
      }
      break
    }
    case 'teams': {
      const teamsRegex = /^https?:\/\/teams\.(microsoft\.com|live\.com)\/[a-zA-Z0-9_./%?=&:@-]+\/?$/i
      if (!teamsRegex.test(url)) {
        return 'رابط مايكروسوفت تيمز غير صحيح. يجب أن يبدأ بـ https://teams.microsoft.com/'
      }
      break
    }
    case 'other':
    default: {
      if (videoMediaRegex.test(url)) {
        return 'عذراً، لا يمكن استخدام روابط منصات الفيديو والوسائط (يوتيوب، تيك توك، إلخ) كرابط لمجموعة عمل.'
      }
      try {
        new URL(url)
      } catch {
        return 'الرابط المدخل غير صالح، يرجى كتابة رابط إنترنت صحيح.'
      }
      break
    }
  }

  return null
}
