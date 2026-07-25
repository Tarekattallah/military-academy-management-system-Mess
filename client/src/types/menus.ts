export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MenuStatus = 'draft' | 'published' | 'closed';

export interface MenuItem {
  recipe: { _id: string; name: string; recipeNumber: string; yield: number };
  plannedServings: number;
  notes?: string;
}

export interface Menu {
  _id: string;
  menuNumber: string;
  menuDate: string;
  mealType: MealType;
  status: MenuStatus;
  notes?: string;
  createdBy: { _id: string; displayName: string };
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemFormValues {
  recipe: string;
  plannedServings: number;
  notes?: string;
}

export interface MenuFormValues {
  menuDate: string;
  mealType: MealType;
  notes?: string;
  items: MenuItemFormValues[];
}

export interface MenuStatusUpdate {
  status: MenuStatus;
}

export interface MenuQuery {
  menuDate?: string;
  mealType?: MealType;
  status?: MenuStatus;
  search?: string;
}
