/**
 * utility to validate published links for social media platforms
 */

export function normalizePlatform(platform) {
  if (!platform) return '';
  const p = String(platform).trim().toLowerCase();
  if (p.includes('facebook') || p.includes('فيسبوك') || p === 'fb') return 'facebook';
  if (p.includes('instagram') || p.includes('انستق') || p.includes('إنستغ') || p.includes('انستج') || p === 'ig') return 'instagram';
  if (p.includes('twitter') || p.includes('تويتر') || p === 'x' || p.includes('twitter/x') || p.includes('منصة x') || p.includes('منصة إكس')) return 'twitter';
  if (p.includes('linkedin') || p.includes('لينكد') || p.includes('لينكدان') || p.includes('لينكدين')) return 'linkedin';
  if (p.includes('tiktok') || p.includes('تيك') || p.includes('توك')) return 'tiktok';
  if (p.includes('snapchat') || p.includes('سناب')) return 'snapchat';
  if (p.includes('youtube') || p.includes('يوتيوب')) return 'youtube';
  if (p.includes('threads') || p.includes('ثريدز')) return 'threads';
  if (p.includes('pinterest') || p.includes('بينترست')) return 'pinterest';
  if (p.includes('telegram') || p.includes('تليجرام') || p.includes('تيليجرام')) return 'telegram';
  return p;
}

export function detectPlatformFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.toLowerCase().trim();
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'Facebook';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'Instagram';
  if (u.includes('twitter.com') || u.includes('x.com') || u.includes('t.co/')) return 'Twitter/X';
  if (u.includes('linkedin.com') || u.includes('lnkd.in')) return 'LinkedIn';
  if (u.includes('tiktok.com')) return 'TikTok';
  if (u.includes('snapchat.com') || u.includes('snap.com')) return 'Snapchat';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('threads.net') || u.includes('threads.com')) return 'Threads';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'Pinterest';
  if (u.includes('t.me') || u.includes('telegram.me') || u.includes('telegram.org')) return 'Telegram';
  if (u.includes('drive.google.com') || u.includes('docs.google.com')) return 'Google Drive';
  return null;
}

export function getPlatformAllowedDomains(platform) {
  const norm = normalizePlatform(platform);
  const platformDomainMap = {
    facebook: ['facebook.com', 'fb.com', 'fb.watch'],
    instagram: ['instagram.com', 'instagr.am'],
    twitter: ['twitter.com', 'x.com', 't.co'],
    linkedin: ['linkedin.com', 'lnkd.in'],
    tiktok: ['tiktok.com'],
    snapchat: ['snapchat.com', 'snap.com'],
    youtube: ['youtube.com', 'youtu.be'],
    threads: ['threads.net', 'threads.com'],
    pinterest: ['pinterest.com', 'pin.it'],
    telegram: ['t.me', 'telegram.me', 'telegram.org']
  };
  return platformDomainMap[norm] || null;
}

export function validatePlatformLink(platform, url) {
  if (!url || !String(url).trim()) {
    return { valid: false, message: 'يرجى إدخال الرابط', formattedUrl: '' };
  }

  let raw = String(url).trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = 'https://' + raw;
  }

  let hostname = '';
  try {
    const parsed = new URL(raw);
    hostname = parsed.hostname.toLowerCase();
  } catch (e) {
    return { valid: false, message: 'صيغة الرابط غير صحيحة، يرجى كتابة رابط إنترنت صحيح (URL)', formattedUrl: raw };
  }

  const allowedDomains = getPlatformAllowedDomains(platform);

  // إذا كانت المنصة غير معروفة أو مخصصة (مثل موقع إلكتروني)
  if (!allowedDomains) {
    if (hostname.includes('.')) {
      return { valid: true, message: '', formattedUrl: raw };
    }
    return { valid: false, message: 'صيغة الرابط غير صحيحة', formattedUrl: raw };
  }

  const isMatch = allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));

  if (isMatch) {
    return { valid: true, message: '', formattedUrl: raw };
  }

  const detected = detectPlatformFromUrl(raw);
  if (detected) {
    return {
      valid: false,
      message: `الرابط المدخل يخص منصة (${detected}) وليس (${platform})! يرجى إدخال رابط يخص ${platform}.`,
      formattedUrl: raw
    };
  }

  const exampleDomain = allowedDomains[0];
  return {
    valid: false,
    message: `رابط غير صالح لمنصة ${platform}! يجب أن يحتوي الرابط على نطاق المنصة (مثل: ${exampleDomain}).`,
    formattedUrl: raw
  };
}
