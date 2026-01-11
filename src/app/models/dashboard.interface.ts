export interface DashboardMetrics {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  lowStockProducts: number;
  recentSales: number;
  topSellingProducts: TopSellingProduct[];
  monthlyRevenue: MonthlyRevenue[];
  inventoryStatus: InventoryStatus;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  sales: number;
}

export interface InventoryStatus {
  normal: number;
  low: number;
  out: number;
  overstock: number;
}
