import api from '@/axios';

/**
 * Standalone Subscriptions API client factory.
 * Accepts any preconfigured Axios instance so the module can be reused in external apps.
 */
export function createSubscriptionsApi(httpClient = api) {
  return {
    getMeta() {
      return httpClient.get('/subscriptions/meta');
    },
    getStats() {
      return httpClient.get('/subscriptions/stats');
    },
    list(params = {}) {
      return httpClient.get('/subscriptions', { params });
    },
    show(id) {
      return httpClient.get(`/subscriptions/${id}`);
    },
    create(payload) {
      return httpClient.post('/subscriptions', payload);
    },
    update(id, payload) {
      return httpClient.put(`/subscriptions/${id}`, payload);
    },
    renew(id, payload = {}) {
      return httpClient.post(`/subscriptions/${id}/renew`, payload);
    },
    testAlert(id, payload = {}) {
      return httpClient.post(`/subscriptions/${id}/test-alert`, payload);
    },
    getLogs(id) {
      return httpClient.get(`/subscriptions/${id}/logs`);
    },
    remove(id) {
      return httpClient.delete(`/subscriptions/${id}`);
    },
  };
}

export const subscriptionsApi = createSubscriptionsApi();
