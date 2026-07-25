import type { Category, Product, Unit } from './products';

export interface RecipeItem {
  product: Product;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  _id: string;
  recipeNumber: string;
  name: string;
  description?: string;
  category?: Category;
  yield: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: RecipeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItemFormValues {
  product: string;
  quantity: number;
  unit: string;
}

export interface RecipeFormValues {
  recipeNumber: string;
  name: string;
  description?: string;
  category?: string;
  yield: number;
  status: 'active' | 'inactive';
  notes?: string;
  items: RecipeItemFormValues[];
}
