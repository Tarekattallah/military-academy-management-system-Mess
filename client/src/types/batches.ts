export type BatchStatus = 'active' | 'depleted' | 'expired' | 'quarantined' | 'archived';

export interface BatchFormValues {
  product: string;
  warehouse: string;
  batchNumber: string;
  lotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  initialQuantity: number;
  unitCost?: number;
  supplier?: string;
  notes?: string;
}

export interface BatchQuery {
  product?: string;
  warehouse?: string;
  status?: BatchStatus;
  search?: string;
}

export interface Batch {
  _id: string;
  product: { _id: string; name: string; sku: string };
  warehouse: { _id: string; name: string; code: string };
  batchNumber: string;
  lotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  unitCost: number;
  supplier?: { _id: string; name: string };
  status: BatchStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
