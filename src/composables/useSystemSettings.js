import { ref, computed } from 'vue';
import api from '../axios';

// حالة مركزية موحدة تشارك عبر كامل مكونات النظام
const settings = ref({
  agency_name: 'Octo Media',
  agency_tagline: 'مساحة العمل الإبداعية لإدارة المحتوى والإنتاج الرقمي',
  default_currency: 'EGP',
  system_timezone: 'Africa/Cairo',
  weekend_days: ['friday'],
  sound_effects_enabled: true,
  system_freeze_mode: false,
  default_daily_hours: 8,
  overload_threshold_percentage: 100,
  root_drive_archive_folder: '',
  strict_drive_validation: true,
  auto_lock_on_approval: true,
  week_start_day: 'saturday',
});

const isLoaded = ref(false);

export function useSystemSettings() {
  const fetchSettings = async (force = false) => {
    if (isLoaded.value && !force) return;
    try {
      const res = await api.get('/settings/public');
      if (res.data && typeof res.data === 'object') {
        settings.value = { ...settings.value, ...res.data };
        isLoaded.value = true;
        
        // تحديث عنوان الصفحة في المتصفح حسب اسم الوكالة
        if (settings.value.agency_name && typeof document !== 'undefined') {
          const currentDocTitle = document.title;
          if (!currentDocTitle || currentDocTitle.includes('Octo') || currentDocTitle.includes('OMS')) {
            document.title = settings.value.agency_name;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load public settings:', e);
    }
  };

  const isSystemFrozen = computed(() => Boolean(settings.value.system_freeze_mode));
  const agencyName = computed(() => settings.value.agency_name || 'Octo Media');
  const agencyTagline = computed(() => settings.value.agency_tagline || '');
  const defaultCurrency = computed(() => settings.value.default_currency || 'EGP');
  const defaultDailyHours = computed(() => Number(settings.value.default_daily_hours) || 8);
  const overloadThreshold = computed(() => Number(settings.value.overload_threshold_percentage) || 100);
  const strictDriveValidation = computed(() => Boolean(settings.value.strict_drive_validation));

  return {
    settings,
    isLoaded,
    isSystemFrozen,
    agencyName,
    agencyTagline,
    defaultCurrency,
    defaultDailyHours,
    overloadThreshold,
    strictDriveValidation,
    fetchSettings,
  };
}

export default useSystemSettings;
