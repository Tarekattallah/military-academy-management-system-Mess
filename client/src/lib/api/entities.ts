import api from '../api';
import type { Product, Category, Unit, Supplier } from '../../types/products';
import type { SupplierFormValues } from '../../types/suppliers';
import type {
  DashboardSummary,
  InventoryOverview,
  TodayOperations,
  ConsumptionAnalytics,
  WasteAnalytics,
  ReservationAnalytics,
  DistributionAnalytics,
  WarehouseStatistics,
} from '../../types/dashboard';
import type { User, UserFormValues, UserUpdateValues } from '../../types/users';
import type { Role, Permission } from '../../types/roles';
import type { Warehouse, WarehouseFormValues } from '../../types/warehouses';
import type { InventoryTransaction, InventoryTransactionQuery } from '../../types/inventory';
import type { Batch } from '../../types/batches';
import type { Receiving, ReceivingFormValues, ReceivingQuery } from '../../types/receiving';
import type { Transfer, TransferFormValues, TransferQuery } from '../../types/transfers';
import type { Return, ReturnFormValues, ReturnQuery } from '../../types/returns';
import type { Waste, WasteFormValues, WasteQuery } from '../../types/waste';
import type { StockCount, StockCountFormValues, StockCountQuery } from '../../types/stockCounts';
import type { BatchFormValues } from '../../types/batches';
import type { Menu, MenuFormValues, MenuQuery, MenuStatusUpdate } from '../../types/menus';

export async function getProducts() {
  const { data } = await api.get('/products');
  return data.data as Product[];
}

export async function getAllProducts() {
  const { data } = await api.get('/products/all');
  return data.data as Product[];
}

export async function getProductById(id: string) {
  const { data } = await api.get(`/products/${id}`);
  return data.data as Product;
}

export async function createProduct(payload: any) {
  const { data } = await api.post('/products', payload);
  return data.data as Product;
}

export async function updateProduct(id: string, payload: any) {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data.data as Product;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.data as Category[];
}

export async function getCategoryById(id: string) {
  const { data } = await api.get(`/categories/${id}`);
  return data.data as Category;
}

export async function createCategory(payload: Partial<Category>) {
  const { data } = await api.post('/categories', payload);
  return data.data as Category;
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  const { data } = await api.patch(`/categories/${id}`, payload);
  return data.data as Category;
}

export async function deleteCategory(id: string) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}

export async function getUnits() {
  const { data } = await api.get('/units');
  return data.data as Unit[];
}

export async function getUnitById(id: string) {
  const { data } = await api.get(`/units/${id}`);
  return data.data as Unit;
}

export async function createUnit(payload: Partial<Unit>) {
  const { data } = await api.post('/units', payload);
  return data.data as Unit;
}

export async function updateUnit(id: string, payload: Partial<Unit>) {
  const { data } = await api.patch(`/units/${id}`, payload);
  return data.data as Unit;
}

export async function deleteUnit(id: string) {
  const { data } = await api.delete(`/units/${id}`);
  return data;
}

export async function getSuppliers() {
  const { data } = await api.get('/suppliers');
  return data.data as Supplier[];
}

export async function getSupplierById(id: string) {
  const { data } = await api.get(`/suppliers/${id}`);
  return data.data as Supplier;
}

export async function createSupplier(payload: SupplierFormValues) {
  const { data } = await api.post('/suppliers', payload);
  return data.data as Supplier;
}

export async function updateSupplier(id: string, payload: Partial<SupplierFormValues>) {
  const { data } = await api.patch(`/suppliers/${id}`, payload);
  return data.data as Supplier;
}

export async function deleteSupplier(id: string) {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
}

// ── Permissions API ───────────────────────────────────────────────────

export async function getPermissions() {
  const { data } = await api.get('/permissions');
  return data.data as Permission[];
}

// ── Roles API ─────────────────────────────────────────────────────────

export async function getRoles() {
  const { data } = await api.get('/roles');
  return data.data as Role[];
}

export async function getRoleById(id: string) {
  const { data } = await api.get(`/roles/${id}`);
  return data.data as Role;
}

export async function createRole(payload: { name: string; description?: string; permissions: string[] }) {
  const { data } = await api.post('/roles', payload);
  return data.data as Role;
}

export async function updateRole(id: string, payload: { name?: string; description?: string; permissions?: string[] }) {
  const { data } = await api.patch(`/roles/${id}`, payload);
  return data.data as Role;
}

export async function deleteRole(id: string) {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
}

// ── Users API ─────────────────────────────────────────────────────────

export async function getUsers() {
  const { data } = await api.get('/users');
  return data.data as User[];
}

export async function getUserById(id: string) {
  const { data } = await api.get(`/users/${id}`);
  return data.data as User;
}

export async function createUser(payload: UserFormValues) {
  const { confirmPassword, ...body } = payload;
  const { data } = await api.post('/users', body);
  return data.data as User;
}

export async function updateUser(id: string, payload: UserUpdateValues) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data as User;
}

export async function deleteUser(id: string) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

// ── Warehouses API ────────────────────────────────────────────────────

export async function getWarehouses() {
  const { data } = await api.get('/warehouses');
  return data.data as Warehouse[];
}

export async function getWarehouseById(id: string) {
  const { data } = await api.get(`/warehouses/${id}`);
  return data.data as Warehouse;
}

export async function createWarehouse(payload: WarehouseFormValues) {
  const { data } = await api.post('/warehouses', payload);
  return data.data as Warehouse;
}

export async function updateWarehouse(id: string, payload: Partial<WarehouseFormValues>) {
  const { data } = await api.patch(`/warehouses/${id}`, payload);
  return data.data as Warehouse;
}

export async function deleteWarehouse(id: string) {
  const { data } = await api.delete(`/warehouses/${id}`);
  return data;
}

// ── Recipes API ────────────────────────────────────────────────────────

export async function getRecipes() {
  const { data } = await api.get('/recipes');
  return data.data;
}

export async function getRecipeById(id: string) {
  const { data } = await api.get(`/recipes/${id}`);
  return data.data;
}

export async function createRecipe(payload: Record<string, unknown>) {
  const { data } = await api.post('/recipes', payload);
  return data.data;
}

export async function updateRecipe(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/recipes/${id}`, payload);
  return data.data;
}

export async function updateRecipeStatus(id: string, payload: { status: string }) {
  const { data } = await api.patch(`/recipes/${id}/status`, payload);
  return data.data;
}

// ── Current Stock API ─────────────────────────────────────────────────

export async function getCurrentStock(query?: { product?: string; warehouse?: string; search?: string }) {
  const { data } = await api.get('/current-stock', { params: query });
  return data.data;
}

export async function getCurrentStockById(id: string) {
  const { data } = await api.get(`/current-stock/${id}`);
  return data.data;
}

export async function getCurrentStockByProductAndWarehouse(productId: string, warehouseId: string) {
  const { data } = await api.get(`/current-stock/by-product/${productId}/warehouse/${warehouseId}`);
  return data.data;
}

export async function refreshCurrentStock() {
  const { data } = await api.get('/current-stock/refresh');
  return data;
}

// ── Meal Requests API ─────────────────────────────────────────────────

export async function getMealRequests(query?: Record<string, unknown>) {
  const { data } = await api.get('/meal-requests', { params: query });
  return data.data;
}

export async function getMealRequestById(id: string) {
  const { data } = await api.get(`/meal-requests/${id}`);
  return data.data;
}

export async function createMealRequest(payload: Record<string, unknown>) {
  const { data } = await api.post('/meal-requests', payload);
  return data.data;
}

export async function updateMealRequest(id: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/meal-requests/${id}`, payload);
  return data.data;
}

export async function approveMealRequest(id: string) {
  const { data } = await api.post(`/meal-requests/${id}/approve`);
  return data.data;
}

export async function rejectMealRequest(id: string, reason: string) {
  const { data } = await api.post(`/meal-requests/${id}/reject`, { reason });
  return data.data;
}

export async function updateMealRequestStatus(id: string, payload: { status: string }) {
  const { data } = await api.patch(`/meal-requests/${id}/status`, payload);
  return data.data;
}

// ── Reservations API ───────────────────────────────────────────────────

export async function getReservations(query?: Record<string, unknown>) {
  const { data } = await api.get('/reservations', { params: query });
  return data.data;
}

export async function getReservationById(id: string) {
  const { data } = await api.get(`/reservations/${id}`);
  return data.data;
}

export async function createReservation(payload: Record<string, unknown>) {
  const { data } = await api.post('/reservations', payload);
  return data.data;
}

export async function releaseReservation(id: string, notes?: string) {
  const { data } = await api.post(`/reservations/${id}/release`, { notes });
  return data.data;
}

export async function consumeReservation(id: string, notes?: string) {
  const { data } = await api.post(`/reservations/${id}/consume`, { notes });
  return data.data;
}

export async function updateReservationStatus(id: string, payload: { status: string }) {
  const { data } = await api.patch(`/reservations/${id}/status`, payload);
  return data.data;
}

// ── Meal Distributions API ─────────────────────────────────────────────

export async function getMealDistributions(query?: Record<string, unknown>) {
  const { data } = await api.get('/meal-distributions', { params: query });
  return data.data;
}

export async function getMealDistributionById(id: string) {
  const { data } = await api.get(`/meal-distributions/${id}`);
  return data.data;
}

export async function createMealDistribution(payload: Record<string, unknown>) {
  const { data } = await api.post('/meal-distributions', payload);
  return data.data;
}

export async function completeMealDistribution(id: string, notes?: string) {
  const { data } = await api.post(`/meal-distributions/${id}/complete`, { notes });
  return data.data;
}

export async function cancelMealDistribution(id: string, reason?: string) {
  const { data } = await api.post(`/meal-distributions/${id}/cancel`, { reason });
  return data.data;
}

export async function updateMealDistributionStatus(id: string, payload: { status: string }) {
  const { data } = await api.patch(`/meal-distributions/${id}/status`, payload);
  return data.data;
}

// ── Reports API ────────────────────────────────────────────────────────

export async function getInventoryReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/inventory', { params: query });
  return data.data;
}

export async function getBatchReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/batches', { params: query });
  return data.data;
}

export async function getReceivingReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/receiving', { params: query });
  return data.data;
}

export async function getTransferReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/transfers', { params: query });
  return data.data;
}

export async function getWasteReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/wastes', { params: query });
  return data.data;
}

export async function getReservationReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/reservations', { params: query });
  return data.data;
}

export async function getMealDistributionReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/meal-distributions', { params: query });
  return data.data;
}

export async function getConsumptionReport(query?: Record<string, unknown>) {
  const { data } = await api.get('/reports/consumption', { params: query });
  return data.data;
}

// ── Menus API ─────────────────────────────────────────────────────────

export async function getMenus(query?: MenuQuery) {
  const { data } = await api.get('/menus', { params: query });
  return data.data as Menu[];
}

export async function getMenuById(id: string) {
  const { data } = await api.get(`/menus/${id}`);
  return data.data as Menu;
}

export async function createMenu(payload: MenuFormValues) {
  const { data } = await api.post('/menus', payload);
  return data.data as Menu;
}

export async function updateMenu(id: string, payload: Partial<MenuFormValues>) {
  const { data } = await api.put(`/menus/${id}`, payload);
  return data.data as Menu;
}

export async function updateMenuStatus(id: string, payload: MenuStatusUpdate) {
  const { data } = await api.patch(`/menus/${id}/status`, payload);
  return data.data as Menu;
}

// ── Dashboard API ──────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data.data as DashboardSummary;
}

export async function getDashboardInventory() {
  const { data } = await api.get('/dashboard/inventory');
  return data.data as InventoryOverview;
}

export async function getDashboardToday() {
  const { data } = await api.get('/dashboard/today');
  return data.data as TodayOperations;
}

export async function getDashboardConsumption() {
  const { data } = await api.get('/dashboard/consumption');
  return data.data as ConsumptionAnalytics;
}

export async function getDashboardWaste() {
  const { data } = await api.get('/dashboard/waste');
  return data.data as WasteAnalytics;
}

export async function getDashboardReservations() {
  const { data } = await api.get('/dashboard/reservations');
  return data.data as ReservationAnalytics;
}

export async function getDashboardDistributions() {
  const { data } = await api.get('/dashboard/distributions');
  return data.data as DistributionAnalytics;
}

export async function getDashboardWarehouses() {
  const { data } = await api.get('/dashboard/warehouses');
  return data.data as WarehouseStatistics;
}

// ── Inventory Transactions API ─────────────────────────────────────────

export async function getBatches(query?: { product?: string; warehouse?: string; status?: string; search?: string }) {
  const { data } = await api.get('/batches', { params: query });
  return data.data as Batch[];
}

export async function getInventoryTransactions(query?: InventoryTransactionQuery) {
  const { data } = await api.get('/inventory-transactions', { params: query });
  return data.data as InventoryTransaction[];
}

export async function getInventoryTransactionById(id: string) {
  const { data } = await api.get(`/inventory-transactions/${id}`);
  return data.data as InventoryTransaction;
}

export async function createInventoryTransaction(payload: any) {
  const { data } = await api.post('/inventory-transactions', payload);
  return data.data as InventoryTransaction;
}

// ── Receiving API ────────────────────────────────────────────────────

export async function getReceivings(query?: ReceivingQuery) {
  const { data } = await api.get('/receiving', { params: query });
  return data.data as Receiving[];
}

export async function getReceivingById(id: string) {
  const { data } = await api.get(`/receiving/${id}`);
  return data.data as Receiving;
}

export async function createReceiving(payload: ReceivingFormValues) {
  const { data } = await api.post('/receiving', payload);
  return data.data as Receiving;
}

export async function cancelReceiving(id: string, reason?: string) {
  const { data } = await api.post(`/receiving/${id}/cancel`, { reason });
  return data.data as Receiving;
}

// ── Transfers API ───────────────────────────────────────────────────

export async function getTransfers(query?: TransferQuery) {
  const { data } = await api.get('/transfers', { params: query });
  return data.data as Transfer[];
}

export async function getTransferById(id: string) {
  const { data } = await api.get(`/transfers/${id}`);
  return data.data as Transfer;
}

export async function createTransfer(payload: TransferFormValues) {
  const { data } = await api.post('/transfers', payload);
  return data.data as Transfer;
}

export async function cancelTransfer(id: string, reason?: string) {
  const { data } = await api.post(`/transfers/${id}/cancel`, { reason });
  return data.data as Transfer;
}

// ── Returns API ─────────────────────────────────────────────────────

export async function getReturns(query?: ReturnQuery) {
  const { data } = await api.get('/returns', { params: query });
  return data.data as Return[];
}

export async function getReturnById(id: string) {
  const { data } = await api.get(`/returns/${id}`);
  return data.data as Return;
}

export async function createReturn(payload: ReturnFormValues) {
  const { data } = await api.post('/returns', payload);
  return data.data as Return;
}

export async function cancelReturn(id: string, reason?: string) {
  const { data } = await api.post(`/returns/${id}/cancel`, { reason });
  return data.data as Return;
}

// ── Waste API ───────────────────────────────────────────────────────

export async function getWasteRecords(query?: WasteQuery) {
  const { data } = await api.get('/wastes', { params: query });
  return data.data as Waste[];
}

export async function getWasteById(id: string) {
  const { data } = await api.get(`/wastes/${id}`);
  return data.data as Waste;
}

export async function createWaste(payload: WasteFormValues) {
  const { data } = await api.post('/wastes', payload);
  return data.data as Waste;
}

export async function cancelWaste(id: string, reason?: string) {
  const { data } = await api.post(`/wastes/${id}/cancel`, { reason });
  return data.data as Waste;
}

// ── Stock Counts API ─────────────────────────────────────────────────

export async function getStockCounts(query?: StockCountQuery) {
  const { data } = await api.get('/stock-counts', { params: query });
  return data.data as StockCount[];
}

export async function getStockCountById(id: string) {
  const { data } = await api.get(`/stock-counts/${id}`);
  return data.data as StockCount;
}

export async function createStockCount(payload: StockCountFormValues) {
  const { data } = await api.post('/stock-counts', payload);
  return data.data as StockCount;
}

export async function approveStockCount(id: string, approvedBy: string) {
  const { data } = await api.post(`/stock-counts/${id}/approve`, { approvedBy });
  return data.data as StockCount;
}

export async function cancelStockCount(id: string, reason?: string) {
  const { data } = await api.post(`/stock-counts/${id}/cancel`, { reason });
  return data.data as StockCount;
}

// ── Batches API (full CRUD) ─────────────────────────────────────────

export async function createBatch(payload: BatchFormValues) {
  const { data } = await api.post('/batches', payload);
  return data.data as Batch;
}

export async function updateBatch(id: string, payload: Partial<BatchFormValues> & { status?: string }) {
  const { data } = await api.patch(`/batches/${id}`, payload);
  return data.data as Batch;
}

export async function deleteBatch(id: string) {
  const { data } = await api.delete(`/batches/${id}`);
  return data;
}

// ── Notifications API ──────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'inventory' | 'stock' | 'meals';
  title: string;
  message: string;
  createdAt: string;
}

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data.data as Notification[];
}

// ── Audit Log API ──────────────────────────────────────────────────────

export interface AuditLogEntry {
  _id: string;
  username: string;
  action: string;
  module: string;
  documentId?: string;
  description?: string;
  ipAddress?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  username?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.append(k, String(v));
  });
  const { data } = await api.get(`/audit-logs?${params.toString()}`);
  return data as { data: AuditLogEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

// ── Settings API ───────────────────────────────────────────────────────

export interface SystemSettings {
  _id?: string;
  appName: string;
  unitCode: string;
  language: 'ar' | 'en';
}

export async function getSystemSettings() {
  const { data } = await api.get('/settings');
  return data.data as SystemSettings;
}

export async function updateSystemSettings(payload: Partial<SystemSettings>) {
  const { data } = await api.put('/settings', payload);
  return data.data as SystemSettings;
}
