export interface DashboardSummary {
  totalProducts: number;
  totalWarehouses: number;
  totalSuppliers: number;
  totalRecipes: number;
  totalMenus: number;
  totalReservations: number;
  totalMealDistributions: number;
  totalCurrentStock: number;
  totalInventoryValue: number;
}

export interface InventoryOverview {
  lowStockCount: number;
  outOfStockCount: number;
  expiredBatchCount: number;
  nearExpiryBatchCount: number;
  totalBatchCount: number;
}

export interface TodayOperations {
  receivingsToday: number;
  transfersToday: number;
  wasteRecordsToday: number;
  reservationsToday: number;
  mealDistributionsToday: number;
}

export interface TopConsumedProduct {
  productId: string;
  productName: string;
  productSku?: string;
  totalConsumed: number;
  totalCost: number;
}

export interface TopRecipe {
  recipeId: string;
  recipeName: string;
  recipeNumber?: string;
  totalDistributed: number;
  totalIngredientsUsed: number;
}

export interface ConsumptionSummary {
  totalQuantity: number;
  totalCost: number;
}

export interface ConsumptionAnalytics {
  topConsumedProducts: TopConsumedProduct[];
  topRecipes: TopRecipe[];
  totalConsumptionToday: ConsumptionSummary;
  totalConsumptionThisMonth: ConsumptionSummary;
}

export interface TopWastedProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
}

export interface WasteAnalytics {
  totalWasteToday: number;
  totalWasteThisMonth: number;
  topWastedProducts: TopWastedProduct[];
}

export interface ReservationAnalytics {
  draft: number;
  reserved: number;
  consumed: number;
  released: number;
  cancelled: number;
}

export interface DistributionAnalytics {
  draft: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface WarehouseStat {
  _id: string;
  name: string;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
}

export type WarehouseStatistics = WarehouseStat[];
