import api from '../api';
import type { Product, Category, Unit, Supplier } from '../types/products';
import type { SupplierFormValues } from '../types/suppliers';
import type {
  DashboardSummary,
  InventoryOverview,
  TodayOperations,
  ConsumptionAnalytics,
  WasteAnalytics,
  ReservationAnalytics,
  DistributionAnalytics,
  WarehouseStatistics,
} from '../types/dashboard';
import type { User, UserFormValues, UserUpdateValues } from '../types/users';
import type { Role, Permission } from '../types/roles';

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

export async function createProduct(payload: Partial<Product>) {
  const { data } = await api.post('/products', payload);
  return data.data as Product;
}

export async function updateProduct(id: string, payload: Partial<Product>) {
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
