export type ReturnType = 'return_to_supplier' | 'internal_return';

export type ReturnStatus = 'draft' | 'completed' | 'cancelled';

export interface ReturnItem {
  product: { _id: string; name: string; sku: string };
  batch: { _id: string; batchNumber: string };
  quantity: number;
}

export interface Return {
  _id: string;
  returnNumber: string;
  returnType: ReturnType;
  warehouse: { _id: string; name: string; code: string };
  supplier?: { _id: string; name: string };
  referenceType?: string;
  referenceId?: string;
  returnDate: string;
  status: ReturnStatus;
  reason?: string;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItemFormValues {
  product: string;
  batch: string;
  quantity: number;
}

export interface ReturnFormValues {
  returnType: ReturnType;
  warehouse: string;
  supplier?: string;
  referenceType?: string;
  referenceId?: string;
  returnDate?: string;
  reason?: string;
  notes?: string;
  items: ReturnItemFormValues[];
}

export interface ReturnQuery {
  warehouse?: string;
  returnType?: ReturnType;
  status?: ReturnStatus;
  referenceType?: string;
  referenceId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
