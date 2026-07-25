export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  _id: string;
  name: string;
  abbreviation: string;
  category: 'weight' | 'volume' | 'quantity' | 'length' | 'other';
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: Category;
  unit: Unit;
  unitPrice: number;
  taxRate: number;
  supplier?: Supplier;
  minStockLevel: number;
  maxStockLevel?: number;
  sku?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
