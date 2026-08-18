import api from '../api';

export async function getPurchaseRequests(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const { data } = await api.get(`/purchase-requests?${params.toString()}`);
  return data.data;
}

export async function getPurchaseRequestById(id) {
  const { data } = await api.get(`/purchase-requests/${id}`);
  return data.data;
}

export async function createPurchaseRequest(payload) {
  const { data } = await api.post('/purchase-requests', payload);
  return data.data;
}

export async function updatePurchaseRequest(id, payload) {
  const { data } = await api.patch(`/purchase-requests/${id}`, payload);
  return data.data;
}

export async function deletePurchaseRequest(id) {
  const { data } = await api.delete(`/purchase-requests/${id}`);
  return data.data;
}

export async function submitPurchaseRequest(id) {
  const { data } = await api.post(`/purchase-requests/${id}/submit`);
  return data.data;
}

export async function approvePurchaseRequest(id) {
  const { data } = await api.post(`/purchase-requests/${id}/approve`);
  return data.data;
}

export async function rejectPurchaseRequest(id, reason) {
  const { data } = await api.post(`/purchase-requests/${id}/reject`, { reason });
  return data.data;
}

export async function cancelPurchaseRequest(id) {
  const { data } = await api.post(`/purchase-requests/${id}/cancel`);
  return data.data;
}
