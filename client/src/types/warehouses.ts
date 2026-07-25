export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  location?: string;
  manager?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseFormValues {
  name: string;
  code: string;
  location?: string;
  manager?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}
