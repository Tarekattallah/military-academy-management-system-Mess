import api from '../api';

























export async function getProducts() {
  const { data } = await api.get('/products');
  return data.data;
}

export async function getAllProducts() {
  const { data } = await api.get('/products/all');
  return data.data;
}

export async function getProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data.data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.data;
}

export async function getCategoryById(id) {
  const { data } = await api.get(`/categories/${id}`);
  return data.data;
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data.data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}

export async function getUnits() {
  const { data } = await api.get('/units');
  return data.data;
}

export async function getUnitById(id) {
  const { data } = await api.get(`/units/${id}`);
  return data.data;
}

export async function createUnit(payload) {
  const { data } = await api.post('/units', payload);
  return data.data;
}

export async function updateUnit(id, payload) {
  const { data } = await api.patch(`/units/${id}`, payload);
  return data.data;
}

export async function deleteUnit(id) {
  const { data } = await api.delete(`/units/${id}`);
  return data;
}

export async function getSuppliers() {
  const { data } = await api.get('/suppliers');
  return data.data;
}

export async function getSupplierById(id) {
  const { data } = await api.get(`/suppliers/${id}`);
  return data.data;
}

export async function createSupplier(payload) {
  const { data } = await api.post('/suppliers', payload);
  return data.data;
}

export async function updateSupplier(id, payload) {
  const { data } = await api.patch(`/suppliers/${id}`, payload);
  return data.data;
}

export async function deleteSupplier(id) {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}

// ── Permissions API ───────────────────────────────────────────────────

export async function getPermissions() {
  const { data } = await api.get('/permissions');
  return data.data;
}

// ── Roles API ─────────────────────────────────────────────────────────

export async function getRoles() {
  const { data } = await api.get('/roles');
  return data.data;
}

export async function getRoleById(id) {
  const { data } = await api.get(`/roles/${id}`);
  return data.data;
}

export async function createRole(payload) {
  const { data } = await api.post('/roles', payload);
  return data.data;
}

export async function updateRole(id, payload) {
  const { data } = await api.patch(`/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id) {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
}

// ── Users API ─────────────────────────────────────────────────────────

export async function getUsers() {
  const { data } = await api.get('/users');
  return data.data;
}

export async function getUserById(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
}

export async function createUser(payload) {
  const { confirmPassword, ...body } = payload;
  const { data } = await api.post('/users', body);
  return data.data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

// ── Warehouses API ────────────────────────────────────────────────────

export async function getWarehouses() {
  const { data } = await api.get('/warehouses');
  return data.data;
}

export async function getWarehouseById(id) {
  const { data } = await api.get(`/warehouses/${id}`);
  return data.data;
}

export async function createWarehouse(payload) {
  const { data } = await api.post('/warehouses', payload);
  return data.data;
}

export async function updateWarehouse(id, payload) {
  const { data } = await api.patch(`/warehouses/${id}`, payload);
  return data.data;
}

export async function deleteWarehouse(id) {
  const { data } = await api.delete(`/warehouses/${id}`);
  return data;
}

// ── Recipes API ────────────────────────────────────────────────────────

export async function getRecipes() {
  const { data } = await api.get('/recipes');
  return data.data;
}

export async function getRecipeById(id) {
  const { data } = await api.get(`/recipes/${id}`);
  return data.data;
}

export async function createRecipe(payload) {
  const { data } = await api.post('/recipes', payload);
  return data.data;
}

export async function updateRecipe(id, payload) {
  const { data } = await api.put(`/recipes/${id}`, payload);
  return data.data;
}

export async function updateRecipeStatus(id, payload) {
  const { data } = await api.patch(`/recipes/${id}/status`, payload);
  return data.data;
}

// ── Current Stock API ─────────────────────────────────────────────────

export async function getCurrentStock(query) {
  const { data } = await api.get('/current-stock', { params: query });
  return data.data;
}

export async function getCurrentStockById(id) {
  const { data } = await api.get(`/current-stock/${id}`);
  return data.data;
}

export async function getCurrentStockByProductAndWarehouse(productId, warehouseId) {
  const { data } = await api.get(`/current-stock/by-product/${productId}/warehouse/${warehouseId}`);
  return data.data;
}

export async function refreshCurrentStock() {
  const { data } = await api.get('/current-stock/refresh');
  return data;
}

// ── Meal Requests API ─────────────────────────────────────────────────

export async function getMealRequests(query) {
  const { data } = await api.get('/meal-requests', { params: query });
  return data.data;
}

export async function getMealRequestById(id) {
  const { data } = await api.get(`/meal-requests/${id}`);
  return data.data;
}

export async function createMealRequest(payload) {
  const { data } = await api.post('/meal-requests', payload);
  return data.data;
}

export async function updateMealRequest(id, payload) {
  const { data } = await api.put(`/meal-requests/${id}`, payload);
  return data.data;
}

export async function approveMealRequest(id) {
  const { data } = await api.post(`/meal-requests/${id}/approve`);
  return data.data;
}

export async function rejectMealRequest(id, reason) {
  const { data } = await api.post(`/meal-requests/${id}/reject`, { reason });
  return data.data;
}

export async function updateMealRequestStatus(id, payload) {
  const { data } = await api.patch(`/meal-requests/${id}/status`, payload);
  return data.data;
}

// ── Reservations API ───────────────────────────────────────────────────

export async function getReservations(query) {
  const { data } = await api.get('/reservations', { params: query });
  return data.data;
}

export async function getReservationById(id) {
  const { data } = await api.get(`/reservations/${id}`);
  return data.data;
}

export async function createReservation(payload) {
  const { data } = await api.post('/reservations', payload);
  return data.data;
}

export async function releaseReservation(id, notes) {
  const { data } = await api.post(`/reservations/${id}/release`, { notes });
  return data.data;
}

export async function consumeReservation(id, notes) {
  const { data } = await api.post(`/reservations/${id}/consume`, { notes });
  return data.data;
}

export async function updateReservationStatus(id, payload) {
  const { data } = await api.patch(`/reservations/${id}/status`, payload);
  return data.data;
}

// ── Meal Distributions API ─────────────────────────────────────────────

export async function getMealDistributions(query) {
  const { data } = await api.get('/meal-distributions', { params: query });
  return data.data;
}

export async function getMealDistributionById(id) {
  const { data } = await api.get(`/meal-distributions/${id}`);
  return data.data;
}

export async function createMealDistribution(payload) {
  const { data } = await api.post('/meal-distributions', payload);
  return data.data;
}

export async function completeMealDistribution(id, notes) {
  const { data } = await api.post(`/meal-distributions/${id}/complete`, { notes });
  return data.data;
}

export async function cancelMealDistribution(id, reason) {
  const { data } = await api.post(`/meal-distributions/${id}/cancel`, { reason });
  return data.data;
}

export async function updateMealDistributionStatus(id, payload) {
  const { data } = await api.patch(`/meal-distributions/${id}/status`, payload);
  return data.data;
}

// ── Reports API ────────────────────────────────────────────────────────

export async function getInventoryReport(query) {
  const { data } = await api.get('/reports/inventory', { params: query });
  return data.data;
}

export async function getBatchReport(query) {
  const { data } = await api.get('/reports/batches', { params: query });
  return data.data;
}

export async function getReceivingReport(query) {
  const { data } = await api.get('/reports/receiving', { params: query });
  return data.data;
}

export async function getTransferReport(query) {
  const { data } = await api.get('/reports/transfers', { params: query });
  return data.data;
}

export async function getWasteReport(query) {
  const { data } = await api.get('/reports/wastes', { params: query });
  return data.data;
}

export async function getReservationReport(query) {
  const { data } = await api.get('/reports/reservations', { params: query });
  return data.data;
}

export async function getMealDistributionReport(query) {
  const { data } = await api.get('/reports/meal-distributions', { params: query });
  return data.data;
}

export async function getConsumptionReport(query) {
  const { data } = await api.get('/reports/consumption', { params: query });
  return data.data;
}

// ── Menus API ─────────────────────────────────────────────────────────

export async function getMenus(query) {
  const { data } = await api.get('/menus', { params: query });
  return data.data;
}

export async function getMenuById(id) {
  const { data } = await api.get(`/menus/${id}`);
  return data.data;
}

export async function createMenu(payload) {
  const { data } = await api.post('/menus', payload);
  return data.data;
}

export async function updateMenu(id, payload) {
  const { data } = await api.put(`/menus/${id}`, payload);
  return data.data;
}

export async function updateMenuStatus(id, payload) {
  const { data } = await api.patch(`/menus/${id}/status`, payload);
  return data.data;
}

// ── Dashboard API ──────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data.data;
}

export async function getDashboardInventory() {
  const { data } = await api.get('/dashboard/inventory');
  return data.data;
}

export async function getDashboardToday() {
  const { data } = await api.get('/dashboard/today');
  return data.data;
}

export async function getDashboardConsumption() {
  const { data } = await api.get('/dashboard/consumption');
  return data.data;
}

export async function getDashboardWaste() {
  const { data } = await api.get('/dashboard/waste');
  return data.data;
}

export async function getDashboardReservations() {
  const { data } = await api.get('/dashboard/reservations');
  return data.data;
}

export async function getDashboardDistributions() {
  const { data } = await api.get('/dashboard/distributions');
  return data.data;
}

export async function getDashboardWarehouses() {
  const { data } = await api.get('/dashboard/warehouses');
  return data.data;
}

// ── Inventory Transactions API ─────────────────────────────────────────

export async function getBatches(query) {
  const { data } = await api.get('/batches', { params: query });
  return data.data;
}

export async function getInventoryTransactions(query) {
  const { data } = await api.get('/inventory-transactions', { params: query });
  return data.data;
}

export async function getInventoryTransactionById(id) {
  const { data } = await api.get(`/inventory-transactions/${id}`);
  return data.data;
}

export async function createInventoryTransaction(payload) {
  const { data } = await api.post('/inventory-transactions', payload);
  return data.data;
}

// ── Receiving API ────────────────────────────────────────────────────

export async function getReceivings(query) {
  const { data } = await api.get('/receiving', { params: query });
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
  const { data } = await api.post(`/receiving/${id}/cancel`, { reason });
  return data.data;
}

// ── Transfers API ───────────────────────────────────────────────────

export async function getTransfers(query) {
  const { data } = await api.get('/transfers', { params: query });
  return data.data;
}

export async function getTransferById(id) {
  const { data } = await api.get(`/transfers/${id}`);
  return data.data;
}

export async function createTransfer(payload) {
  const { data } = await api.post('/transfers', payload);
  return data.data;
}

export async function cancelTransfer(id, reason) {
  const { data } = await api.post(`/transfers/${id}/cancel`, { reason });
  return data.data;
}

// ── Returns API ─────────────────────────────────────────────────────

export async function getReturns(query) {
  const { data } = await api.get('/returns', { params: query });
  return data.data;
}

export async function getReturnById(id) {
  const { data } = await api.get(`/returns/${id}`);
  return data.data;
}

export async function createReturn(payload) {
  const { data } = await api.post('/returns', payload);
  return data.data;
}

export async function cancelReturn(id, reason) {
  const { data } = await api.post(`/returns/${id}/cancel`, { reason });
  return data.data;
}

// ── Waste API ───────────────────────────────────────────────────────

export async function getWasteRecords(query) {
  const { data } = await api.get('/wastes', { params: query });
  return data.data;
}

export async function getWasteById(id) {
  const { data } = await api.get(`/wastes/${id}`);
  return data.data;
}

export async function createWaste(payload) {
  const { data } = await api.post('/wastes', payload);
  return data.data;
}

export async function cancelWaste(id, reason) {
  const { data } = await api.post(`/wastes/${id}/cancel`, { reason });
  return data.data;
}

// ── Stock Counts API ─────────────────────────────────────────────────

export async function getStockCounts(query) {
  const { data } = await api.get('/stock-counts', { params: query });
  return data.data;
}

export async function getStockCountById(id) {
  const { data } = await api.get(`/stock-counts/${id}`);
  return data.data;
}

export async function createStockCount(payload) {
  const { data } = await api.post('/stock-counts', payload);
  return data.data;
}

export async function approveStockCount(id, approvedBy) {
  const { data } = await api.post(`/stock-counts/${id}/approve`, { approvedBy });
  return data.data;
}

export async function cancelStockCount(id, reason) {
  const { data } = await api.post(`/stock-counts/${id}/cancel`, { reason });
  return data.data;
}

// ── Batches API (full CRUD) ─────────────────────────────────────────

export async function createBatch(payload) {
  const { data } = await api.post('/batches', payload);
  return data.data;
}

export async function updateBatch(id, payload) {
  const { data } = await api.patch(`/batches/${id}`, payload);
  return data.data;
}

export async function deleteBatch(id) {
  const { data } = await api.delete(`/batches/${id}`);
  return data;
}

// ── Notifications API ──────────────────────────────────────────────────












export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data.data;
}

// ── Audit Log API ──────────────────────────────────────────────────────

























export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.append(k, String(v));
  });
  const { data } = await api.get(`/audit-logs?${params.toString()}`);
  return data;
}

export async function deleteAuditLog(id) {
  const { data } = await api.delete(`/audit-logs/${id}`);
  return data;
}

export async function clearAuditLogs() {
  const { data } = await api.delete('/audit-logs/all');
  return data;
}

// ── Settings API ───────────────────────────────────────────────────────








export async function getSystemSettings() {
  const { data } = await api.get('/settings');
  return data.data;
}

export async function updateSystemSettings(payload) {
  const { data } = await api.put('/settings', payload);
  return data.data;
}