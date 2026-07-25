export type WasteStatus = 'draft' | 'completed' | 'cancelled';

export interface WasteItem {
  product: { _id: string; name: string; sku: string };
  batch: { _id: string; batchNumber: string };
  quantity: number;
}

export interface Waste {
  _id: string;
  wasteNumber: string;
  warehouse: { _id: string; name: string; code: string };
  wasteDate: string;
  status: WasteStatus;
  reason: string;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: WasteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WasteItemFormValues {
  product: string;
  batch: string;
  quantity: number;
}

export interface WasteFormValues {
  warehouse: string;
  wasteDate?: string;
  reason: string;
  notes?: string;
  items: WasteItemFormValues[];
}

export interface WasteQuery {
  warehouse?: string;
  status?: WasteStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}
