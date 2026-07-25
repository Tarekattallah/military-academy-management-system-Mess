export type TransferStatus = 'draft' | 'completed' | 'cancelled';

export interface TransferItem {
  product: { _id: string; name: string; sku: string };
  sourceBatch: { _id: string; batchNumber: string };
  destinationBatchNumber: string;
  quantity: number;
  unitCost: number;
}

export interface Transfer {
  _id: string;
  transferNumber: string;
  sourceWarehouse: { _id: string; name: string; code: string };
  destinationWarehouse: { _id: string; name: string; code: string };
  transferDate: string;
  status: TransferStatus;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferItemFormValues {
  product: string;
  sourceBatch: string;
  destinationBatchNumber: string;
  quantity: number;
}

export interface TransferFormValues {
  sourceWarehouse: string;
  destinationWarehouse: string;
  transferDate?: string;
  notes?: string;
  items: TransferItemFormValues[];
}

export interface TransferQuery {
  sourceWarehouse?: string;
  destinationWarehouse?: string;
  status?: TransferStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}
