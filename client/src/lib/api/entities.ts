import api from '../api';
import type { Product, Category, Unit, Supplier } from '../types/products';

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
