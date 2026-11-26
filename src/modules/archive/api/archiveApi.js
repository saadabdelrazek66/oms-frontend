import api from '@/axios';

/**
 * Archive Drive API Client
 */
export const archiveApi = {
  getStats() {
    return api.get('/archive/stats');
  },

  getTree() {
    return api.get('/archive/tree');
  },

  browse(params = {}) {
    return api.get('/archive/browse', { params });
  },

  createFolder(payload) {
    return api.post('/archive/folders', payload);
  },

  updateFolder(id, payload) {
    return api.put(`/archive/folders/${id}`, payload);
  },

  deleteFolder(id) {
    return api.delete(`/archive/folders/${id}`);
  },

  createExternalItem(payload) {
    return api.post('/archive/external-items', payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  async downloadExternalItem(id, filename = 'archive-file', inline = false) {
    const response = await api.get(`/archive/external-items/${id}/download`, {
      params: inline ? { inline: 1 } : {},
      responseType: 'blob',
    });
    const blobUrl = URL.createObjectURL(response.data);
    if (inline) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename || `archive-file-${id}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  },

  deleteExternalItem(id) {
    return api.delete(`/archive/external-items/${id}`);
  },

  archiveItems(payload) {
    return api.post('/archive/items/archive', payload);
  },

  restoreItems(payload) {
    return api.post('/archive/items/restore', payload);
  },

  moveItems(payload) {
    return api.post('/archive/items/move', payload);
  },

  runAutoArchive(payload = {}) {
    return api.post('/archive/run-auto', payload);
  },
};

export default archiveApi;
