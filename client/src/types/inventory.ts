export type TransactionType =
  | 'receiving'
  | 'transfer_out'
  | 'transfer_in'
  | 'return'
  | 'return_to_supplier'
  | 'waste'
  | 'adjustment'
  | 'issue'
  | 'reservation'
  | 'reservation_cancel';

export type TransactionModule =
  | 'receiving'
  | 'transfers'
  | 'returns'
  | 'waste'
  | 'stock-count'
  | 'meal-issue'
  | 'manual';

export interface InventoryTransaction {
  _id: string;
  batch: { _id: string; batchNumber: string };
  product: { _id: string; name: string; sku: string };
  warehouse: { _id: string; name: string; code: string };
  transactionType: TransactionType;
  module: TransactionModule;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy: { _id: string; displayName: string };
  notes?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionFormValues {
  batch: string;
  product: string;
  warehouse: string;
  transactionType: TransactionType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  notes?: string;
  currentQuantity?: number;
}

export interface InventoryTransactionQuery {
  batch?: string;
  product?: string;
  warehouse?: string;
  transactionType?: TransactionType;
  module?: TransactionModule;
  referenceType?: string;
  referenceId?: string;
  startDate?: string;
  endDate?: string;
}
