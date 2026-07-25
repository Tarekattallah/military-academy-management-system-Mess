export type ReceivingStatus = 'draft' | 'completed' | 'cancelled';

export interface ReceivingItem {
  product: { _id: string; name: string; sku: string };
  batchNumber: string;
  quantity: number;
  unitCost: number;
  manufacturingDate?: string;
  expiryDate?: string;
}

export interface Receiving {
  _id: string;
  receivingNumber: string;
  supplier: { _id: string; name: string };
  warehouse: { _id: string; name: string; code: string };
  receivingDate: string;
  status: ReceivingStatus;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: ReceivingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingItemFormValues {
  product: string;
  batchNumber: string;
  quantity: number;
  unitCost?: number;
  manufacturingDate?: string;
  expiryDate?: string;
}

export interface ReceivingFormValues {
  supplier: string;
  warehouse: string;
  receivingDate?: string;
  notes?: string;
  items: ReceivingItemFormValues[];
}

export interface ReceivingQuery {
  supplier?: string;
  warehouse?: string;
  status?: ReceivingStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}
