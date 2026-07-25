import type { Recipe } from './recipes';
import type { Batch } from './batches';
import type { Product } from './products';
import type { Warehouse } from './warehouses';
import type { MealRequest } from './mealRequests';
import type { Menu } from './menus';

export interface ReservationItem {
  recipe: Recipe;
  batch: Batch;
  product: Product;
  reservedQuantity: number;
  consumedQuantity: number;
}

export interface Reservation {
  _id: string;
  reservationNumber: string;
  mealRequest: MealRequest;
  warehouse: Warehouse;
  requestingUnit?: string;
  menu?: Menu;
  status: 'draft' | 'reserved' | 'released' | 'consumed';
  reservedBy?: { _id: string; displayName: string };
  reservedAt?: string;
  releasedBy?: { _id: string; displayName: string } | null;
  releasedAt?: string | null;
  notes?: string;
  items: ReservationItem[];
  createdAt: string;
  updatedAt: string;
}
