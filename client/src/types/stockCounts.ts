export type StockCountStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

export interface StockCountItem {
  product: { _id: string; name: string; sku: string };
  batch: { _id: string; batchNumber: string };
  systemQuantity: number;
  physicalQuantity: number;
}

export interface StockCount {
  _id: string;
  countNumber: string;
  warehouse: { _id: string; name: string; code: string };
  countDate: string;
  status: StockCountStatus;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  approvedBy?: { _id: string; displayName: string };
  items: StockCountItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockCountItemFormValues {
  product: string;
  batch: string;
  systemQuantity: number;
  physicalQuantity: number;
}

export interface StockCountFormValues {
  warehouse: string;
  countDate?: string;
  notes?: string;
  items: StockCountItemFormValues[];
}

export interface StockCountQuery {
  warehouse?: string;
  status?: StockCountStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}
