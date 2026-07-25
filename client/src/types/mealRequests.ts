import type { Recipe } from './recipes';
import type { Menu } from './menus';

export interface MealRequestItem {
  recipe: Recipe;
  requestedServings: number;
}

export interface MealRequest {
  _id: string;
  requestNumber: string;
  requestDate: string;
  requestingUnit: string;
  menu: Menu;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  requestedBy: { _id: string; displayName: string };
  approvedBy?: { _id: string; displayName: string } | null;
  approvedAt?: string | null;
  items: MealRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MealRequestItemFormValues {
  recipe: string;
  requestedServings: number;
}

export interface MealRequestFormValues {
  requestingUnit: string;
  menu: string;
  notes?: string;
  items: MealRequestItemFormValues[];
}
