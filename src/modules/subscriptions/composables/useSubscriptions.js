import { ref, reactive, computed } from 'vue';
import { subscriptionsApi } from '../api/subscriptionsApi';
import { toast } from '@/services/alertService';

/**
 * Modular Subscriptions state & actions composable.
 */
export function useSubscriptions(apiClient = subscriptionsApi) {
  const items = ref([]);
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const summary = ref({
    total_count: 0,
    active_monitored_count: 0,
    healthy_count: 0,
    expiring_7_days_count: 0,
    expiring_30_days_count: 0,
    expired_count: 0,
    paused_count: 0,
    cancelled_count: 0,
    costs_by_currency: [],
  });
  const meta = ref({
    categories: [],
    billing_cycles: [],
    statuses: [],
    channels: [],
    urgency_levels: [],
    supported_currencies: ['USD', 'EGP', 'SAR', 'AED', 'EUR', 'GBP'],
    defaults: {},
    users: [],
  });

  const activeSubscription = ref(null);
  const logs = ref([]);

  const isLoading = ref(false);
  const isLoadingMeta = ref(false);
  const isLoadingDetails = ref(false);
  const isSubmitting = ref(false);
  const isRenewing = ref(false);
  const isTestingAlert = ref(false);

  const filters = reactive({
    search: '',
    category: '',
    status: '',
    billing_cycle: '',
    urgency: '',
    sort_by: 'next_expiry_date',
    sort_dir: 'asc',
    per_page: 15,
    page: 1,
  });

  const cleanParams = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        params[k] = v;
      }
    });
    return params;
  };

  const fetchMeta = async () => {
    isLoadingMeta.value = true;
    try {
      const res = await apiClient.getMeta();
      if (res.data?.data) {
        meta.value = res.data.data;
      }
      return meta.value;
    } catch (err) {
      console.error('[Subscriptions] Failed loading metadata:', err);
      toast('تعذر تحميل القوائم المرجعية للاشتراكات', 'error');
      return null;
    } finally {
      isLoadingMeta.value = false;
    }
  };

  const fetchSubscriptions = async () => {
    isLoading.value = true;
    try {
      const res = await apiClient.list(cleanParams());
      const payload = res.data?.data || {};
      items.value = payload.items || [];
      if (payload.pagination) {
        pagination.value = payload.pagination;
      }
      if (payload.summary) {
        summary.value = payload.summary;
      }
      return payload;
    } catch (err) {
      console.error('[Subscriptions] Failed loading list:', err);
      toast(err.response?.data?.message || 'تعذر تحميل قائمة الاشتراكات', 'error');
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDetails = async (id) => {
    isLoadingDetails.value = true;
    try {
      const res = await apiClient.show(id);
      activeSubscription.value = res.data?.data || null;
      if (activeSubscription.value?.reminder_logs) {
        logs.value = activeSubscription.value.reminder_logs;
      }
      return activeSubscription.value;
    } catch (err) {
      console.error('[Subscriptions] Failed loading details:', err);
      toast(err.response?.data?.message || 'تعذر تحميل تفاصيل الاشتراك', 'error');
      return null;
    } finally {
      isLoadingDetails.value = false;
    }
  };

  const fetchLogs = async (id) => {
    try {
      const res = await apiClient.getLogs(id);
      logs.value = res.data?.data || [];
      return logs.value;
    } catch (err) {
      console.error('[Subscriptions] Failed loading logs:', err);
      return [];
    }
  };

  const createSubscription = async (payload) => {
    isSubmitting.value = true;
    try {
      const res = await apiClient.create(payload);
      toast(res.data?.message || 'تم إضافة الاشتراك بنجاح', 'success');
      await fetchSubscriptions();
      return { ok: true, data: res.data?.data };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        message: err.response?.data?.message || 'فشل حفظ الاشتراك، راجع البيانات المدخلة.',
        errors: err.response?.data?.errors || {},
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  const updateSubscription = async (id, payload) => {
    isSubmitting.value = true;
    try {
      const res = await apiClient.update(id, payload);
      toast(res.data?.message || 'تم تحديث الاشتراك بنجاح', 'success');
      await fetchSubscriptions();
      if (activeSubscription.value?.id === id) {
        activeSubscription.value = res.data?.data || activeSubscription.value;
      }
      return { ok: true, data: res.data?.data };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        message: err.response?.data?.message || 'فشل تحديث الاشتراك، راجع البيانات المدخلة.',
        errors: err.response?.data?.errors || {},
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  const renewSubscription = async (id, payload) => {
    isRenewing.value = true;
    try {
      const res = await apiClient.renew(id, payload);
      toast(res.data?.message || 'تم تجديد الاشتراك بنجاح', 'success');
      await fetchSubscriptions();
      if (activeSubscription.value?.id === id) {
        activeSubscription.value = res.data?.data || activeSubscription.value;
      }
      return { ok: true, data: res.data?.data };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        message: err.response?.data?.message || 'تعذر تنفيذ التجديد.',
        errors: err.response?.data?.errors || {},
      };
    } finally {
      isRenewing.value = false;
    }
  };

  const testSubscriptionAlert = async (id, channels = null) => {
    isTestingAlert.value = true;
    try {
      const body = Array.isArray(channels) && channels.length > 0 ? { channels } : {};
      const res = await apiClient.testAlert(id, body);
      const result = res.data?.data;
      toast(res.data?.message || 'تم إرسال التنبيه التجريبي', result?.failed_count > 0 ? 'warning' : 'success');
      if (activeSubscription.value?.id === id) {
        await fetchLogs(id);
      }
      return { ok: true, data: result };
    } catch (err) {
      toast(err.response?.data?.message || 'فشل إرسال التنبيه التجريبي', 'error');
      return { ok: false };
    } finally {
      isTestingAlert.value = false;
    }
  };

  const deleteSubscription = async (id) => {
    try {
      const res = await apiClient.remove(id);
      toast(res.data?.message || 'تم حذف الاشتراك بنجاح', 'success');
      if (activeSubscription.value?.id === id) {
        activeSubscription.value = null;
      }
      await fetchSubscriptions();
      return true;
    } catch (err) {
      toast(err.response?.data?.message || 'تعذر حذف الاشتراك', 'error');
      return false;
    }
  };

  const resetFilters = () => {
    filters.search = '';
    filters.category = '';
    filters.status = '';
    filters.billing_cycle = '';
    filters.urgency = '';
    filters.sort_by = 'next_expiry_date';
    filters.sort_dir = 'asc';
    filters.page = 1;
  };

  const urgentSubscriptionsCount = computed(
    () => (summary.value.expiring_7_days_count || 0) + (summary.value.expired_count || 0)
  );

  return {
    items,
    pagination,
    summary,
    meta,
    activeSubscription,
    logs,
    filters,
    isLoading,
    isLoadingMeta,
    isLoadingDetails,
    isSubmitting,
    isRenewing,
    isTestingAlert,
    urgentSubscriptionsCount,
    fetchMeta,
    fetchSubscriptions,
    fetchDetails,
    fetchLogs,
    createSubscription,
    updateSubscription,
    renewSubscription,
    testSubscriptionAlert,
    deleteSubscription,
    resetFilters,
  };
}
