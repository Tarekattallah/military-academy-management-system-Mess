import type { Recipe } from './recipes';
import type { Product } from './products';
import type { Batch } from './batches';
import type { Reservation } from './reservations';
import type { MealRequest } from './mealRequests';
import type { Menu } from './menus';

export interface IngredientSnapshot {
  product: string;
  productName: string;
  quantity: number;
  unit: string;
  unitName: string;
}

export interface RecipeSnapshot {
  recipe: string;
  recipeName: string;
  recipeNumber: string;
  recipeYield: number;
  ingredients: IngredientSnapshot[];
}

export interface MealDistributionItem {
  recipe: Recipe;
  product: Product;
  batch: Batch;
  plannedQuantity: number;
  actualQuantity: number;
  wastageQuantity: number;
  inventoryTransaction?: string;
}

export interface MealDistribution {
  _id: string;
  distributionNumber: string;
  reservation: Reservation;
  mealRequest: MealRequest;
  menu?: Menu;
  requestingUnit?: string;
  distributionDate: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  distributedBy?: { _id: string; displayName: string };
  completedBy?: { _id: string; displayName: string } | null;
  completedAt?: string | null;
  cancelledBy?: { _id: string; displayName: string } | null;
  cancelledAt?: string | null;
  cancelReason?: string;
  notes?: string;
  recipeSnapshots: RecipeSnapshot[];
  items: MealDistributionItem[];
  createdAt: string;
  updatedAt: string;
}
