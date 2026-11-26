import api from '@/axios'

export const contentPlansApi = {
  list(paramsString) {
    return api.get(`/content-plans?${paramsString}`)
  },
  create(payload) {
    return api.post('/content-plans', payload)
  },
  update(id, payload) {
    return api.put(`/content-plans/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/content-plans/${id}`)
  },
  duplicate(id, payload) {
    return api.post(`/content-plans/${id}/duplicate`, payload)
  },
  approve(id) {
    return api.post(`/content-plans/${id}/approve`)
  },
  reject(id, notes) {
    return api.post(`/content-plans/${id}/reject`, { notes })
  },
  toggleClientApproval(id) {
    return api.post(`/content-plans/${id}/client-approval`)
  },
  submitReview(id, payload) {
    return api.post(`/content-plans/${id}/submit-review`, payload)
  },
  finalDelivery(id, payload) {
    return api.post(`/content-plans/${id}/final-delivery`, payload)
  },
  addFollowUp(planId, formData) {
    return api.post(`/content-plans/${planId}/follow-ups`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  updateFollowUp(followUpId, formData) {
    return api.post(`/follow-ups/${followUpId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteFollowUp(followUpId) {
    return api.delete(`/follow-ups/${followUpId}`)
  },
  fetchUsers() {
    return api.get('/users/options')
  },
  fetchPlanCategories() {
    return api.get('/plan-categories/options')
  },
  fetchClients() {
    return api.get('/clients/options', { params: { with_group_links: 1 } })
  },
}
