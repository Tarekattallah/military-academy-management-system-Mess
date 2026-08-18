import api from '../api';

export async function getPurchaseOrders(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const { data } = await api.get(`/purchase-orders?${params.toString()}`);
  return data.data;
}

export async function getPurchaseOrderById(id) {
  const { data } = await api.get(`/purchase-orders/${id}`);
  return data.data;
}

export async function createPurchaseOrder(payload) {
  const { data } = await api.post('/purchase-orders', payload);
  return data.data;
}

export async function updatePurchaseOrder(id, payload) {
  const { data } = await api.patch(`/purchase-orders/${id}`, payload);
  return data.data;
}

export async function deletePurchaseOrder(id) {
  const { data } = await api.delete(`/purchase-orders/${id}`);
  return data.data;
}

export async function submitPurchaseOrder(id) {
  const { data } = await api.post(`/purchase-orders/${id}/submit`);
  return data.data;
}

export async function approvePurchaseOrder(id) {
  const { data } = await api.post(`/purchase-orders/${id}/approve`);
  return data.data;
}

export async function rejectPurchaseOrder(id, reason) {
  const { data } = await api.post(`/purchase-orders/${id}/reject`, { reason });
  return data.data;
}

export async function cancelPurchaseOrder(id) {
  const { data } = await api.post(`/purchase-orders/${id}/cancel`);
  return data.data;
}
