/**
 * نظام تصنيف وتخصيص شارات أنواع خطط المحتوى (Plan Types Visual Engine)
 * يوفر لكل نوع خطة هوية بصرية متميزة (أيقونة، تدرج لوني، إطار متوهج، وفئة CSS)
 */

export const getPlanTypeInfo = (type) => {
  if (!type) {
    return {
      key: 'general',
      class: 'type-general',
      icon: '📋',
      label: 'خطة عامة',
      color: '#94a3b8'
    };
  }

  const raw = String(type).trim();
  const lower = raw.toLowerCase();

  // 1. Digital Marketing Strategy Plan (استراتيجية وتسويق شامل)
  if (lower.includes('strategy') || lower.includes('استراتيج') || lower.includes('تخطيط')) {
    return {
      key: 'strategy',
      class: 'type-strategy',
      icon: '♟️',
      label: raw,
      color: '#818cf8'
    };
  }

  // 2. Content Marketing Plan (خطة تسويق بالمحتوى الشاملة)
  if (lower.includes('content marketing') || (lower.includes('تسويق') && lower.includes('محتوى'))) {
    return {
      key: 'content-marketing',
      class: 'type-content-marketing',
      icon: '💡',
      label: raw,
      color: '#22d3ee'
    };
  }

  // 3. محتوى عادي / Content
  if (lower.includes('content') || lower.includes('محتوى') || lower.includes('كتابة') || lower.includes('copywriting')) {
    return {
      key: 'content',
      class: 'type-content',
      icon: '✍️',
      label: raw,
      color: '#34d399'
    };
  }

  // 4. Media Buying Plan / إعلانات ممولة
  if (
    lower.includes('media buying') || 
    lower.includes('إعلان') || 
    lower.includes('اعلان') || 
    lower.includes('ads') || 
    lower.includes('ممول') || 
    lower.includes('حملات') ||
    lower.includes('advertising')
  ) {
    return {
      key: 'media-buying',
      class: 'type-media-buying',
      icon: '🎯',
      label: raw,
      color: '#fbbf24'
    };
  }

  // 5. Media Production Plan / إنتاج مرئي وتصوير ومونتاج
  if (
    lower.includes('production') || 
    lower.includes('إنتاج') || 
    lower.includes('انتاج') || 
    lower.includes('فيديو') || 
    lower.includes('video') || 
    lower.includes('تصوير') || 
    lower.includes('مونتاج') || 
    lower.includes('reels') ||
    lower.includes('ريلز')
  ) {
    return {
      key: 'media-production',
      class: 'type-media-production',
      icon: '🎬',
      label: raw,
      color: '#fb7185'
    };
  }

  // 6. SEO Plan / تحسين محركات البحث
  if (lower.includes('seo') || lower.includes('سيو') || lower.includes('محركات البحث') || lower.includes('search engine')) {
    return {
      key: 'seo',
      class: 'type-seo',
      icon: '🚀',
      label: raw,
      color: '#38bdf8'
    };
  }

  // 7. Reporting & Analytics Plan / تقارير وتحليلات
  if (
    lower.includes('report') || 
    lower.includes('analytic') || 
    lower.includes('تقرير') || 
    lower.includes('تقارير') || 
    lower.includes('تحليل') || 
    lower.includes('احصائ')
  ) {
    return {
      key: 'analytics',
      class: 'type-analytics',
      icon: '📊',
      label: raw,
      color: '#a3e635'
    };
  }

  // 8. تسويق عبر السوشيال ميديا / Social Media
  if (
    lower.includes('social') || 
    lower.includes('سوشيال') || 
    lower.includes('تواصل') || 
    lower.includes('instagram') || 
    lower.includes('facebook') || 
    lower.includes('tiktok')
  ) {
    return {
      key: 'social-media',
      class: 'type-social-media',
      icon: '📱',
      label: raw,
      color: '#c084fc'
    };
  }

  // 9. تصاميم وهوية / Graphic Design
  if (lower.includes('design') || lower.includes('تصميم') || lower.includes('جرافيك') || lower.includes('هوية') || lower.includes('brand')) {
    return {
      key: 'design',
      class: 'type-design',
      icon: '🎨',
      label: raw,
      color: '#f472b6'
    };
  }

  // 10. خطة شهرية / Monthly
  if (lower.includes('month') || lower.includes('شهر')) {
    return {
      key: 'monthly',
      class: 'type-monthly',
      icon: '🗓️',
      label: raw,
      color: '#2dd4bf'
    };
  }

  // Fallback: توليد لون مميز متناسق لأي إدخال حر مخصص
  const hash = Math.abs([...raw].reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const fallbackThemes = [
    { class: 'type-amber', icon: '⚡', color: '#fcd34d' },
    { class: 'type-indigo', icon: '◈', color: '#a5b4fc' },
    { class: 'type-rose', icon: '★', color: '#fda4af' },
    { class: 'type-sky', icon: '◎', color: '#7dd3fc' },
    { class: 'type-teal', icon: '✦', color: '#5eead4' },
  ];
  const chosen = fallbackThemes[hash % fallbackThemes.length];

  return {
    key: 'custom',
    class: chosen.class,
    icon: chosen.icon,
    label: raw,
    color: chosen.color
  };
};
