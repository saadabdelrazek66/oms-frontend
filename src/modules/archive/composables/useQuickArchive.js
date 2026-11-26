import { ref } from 'vue';
import { useRouter } from 'vue-router';
import archiveApi from '../api/archiveApi';
import { useAlert } from '@/composables/useAlert';

/**
 * Shared composable for quick one-click archiving & navigating to the module folder in Archive Drive.
 */
export function useQuickArchive() {
  const router = useRouter();
  const { confirm, success, error } = useAlert();
  const archivingId = ref(null);

  async function archiveItem({ moduleKey, id, title, defaultReason = 'أرشفة يدوية سريعة', onSuccess }) {
    if (!moduleKey || !id || archivingId.value) return false;

    const ok = await confirm({
      title: 'أرشفة العنصر ونقله للأرشيف المركزي',
      message: `هل تريد أرشفة "${title || `#${id}`}"؟ سيختفي من الشاشة التشغيلية الحالية ويُنقل إلى مجلد الأرشيف ويمكنك استعادته في أي وقت.`,
      type: 'warning',
      confirmText: 'نعم، أرشفة 🗄️',
      cancelText: 'إلغاء',
    });
    if (!ok) return false;

    archivingId.value = `${moduleKey}:${id}`;
    try {
      const { data } = await archiveApi.archiveItems({
        module_key: moduleKey,
        id,
        reason: defaultReason,
      });
      success(data?.message || 'تم نقل العنصر إلى الأرشيف بنجاح');
      if (typeof onSuccess === 'function') {
        onSuccess(id);
      }
      return true;
    } catch (err) {
      error(err?.response?.data?.message || 'تعذر أرشفة العنصر');
      return false;
    } finally {
      archivingId.value = null;
    }
  }

  function openArchive(moduleKey = null) {
    router.push({
      path: '/archive',
      query: moduleKey ? { module: moduleKey } : undefined,
    });
  }

  return {
    archivingId,
    archiveItem,
    openArchive,
  };
}

export default useQuickArchive;
