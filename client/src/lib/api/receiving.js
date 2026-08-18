import api from '../api';

export async function getReceivings(params = {}) {
  const { data } = await api.get('/receiving', { params });
  return data.data;
}

export async function getReceivingById(id) {
  const { data } = await api.get(`/receiving/${id}`);
  return data.data;
}

export async function createReceiving(payload) {
  const { data } = await api.post('/receiving', payload);
  return data.data;
}

export async function cancelReceiving(id, reason) {
  const payload = reason ? { reason } : {};
  const { data } = await api.post(`/receiving/${id}/cancel`, payload);
  return data.data;
}
