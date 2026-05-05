export interface SalesHistoryPoint {
  id: string;
  month: string;
  sales: number;
  revenue: number;
}

export interface PredictedDemandPoint {
  id: string;
  month: string;
  demand: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  optimalStock: number;
  sku: string;
  imageUrl: string | null;
  status: "low" | "optimal" | "overstock";
  trend: "up" | "down" | "stable";
  monthlyRevenue: number;
  salesHistory: SalesHistoryPoint[];
  predictedDemand: PredictedDemandPoint[];
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  action: "sale" | "stock_added";
  quantity: number;
  price?: number;
  supplier?: string;
  paymentStatus?: "paid" | "unpaid" | null;
  billNumber?: string | null;
  timestamp: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  paymentMethod: "cash" | "upi" | "card" | "manual";
  paymentStatus: "paid" | "unpaid";
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  items: BillItem[];
  transactionIds: string[];
  issuedAt: string;
}

export interface NotificationItem {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  product: string | null;
  productId: string | null;
  timestamp: string;
  priority: "high" | "medium" | "low";
  isRead?: boolean;
}

export interface Recommendation {
  id: string;
  type: "restock" | "reduce" | "optimize";
  urgency: "high" | "medium" | "low";
  title: string;
  description: string;
  product: string | null;
  productId: string | null;
  action: string;
  impact: string;
  reason: string;
}

export interface SalesOverTimePoint {
  id: string;
  date: string;
  sales: number;
  revenue: number;
}

export interface CategoryPerformancePoint {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyStat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export interface TopProductSummary {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface AnalyticsData {
  salesOverTime: SalesOverTimePoint[];
  topProducts: TopProductSummary[];
  categoryPerformance: CategoryPerformancePoint[];
  seasonalData: Array<{ month: string; sales: number; revenue: number }>;
  monthlyStats: MonthlyStat[];
  insights: {
    bestCategory: string;
    revenueGrowth: string;
    inventoryTurnover: string;
  };
}

export interface DashboardData {
  totalProducts: number;
  lowStockAlerts: number;
  topSellingProduct: string;
  topSellingProducts: TopProductSummary[];
  monthlyRevenue: number;
  todaysSales: {
    count: number;
    revenue: number;
  };
  salesOverTime: SalesOverTimePoint[];
}

export interface BootstrapResponse {
  products: Product[];
  transactions: Transaction[];
  bills: Bill[];
  dashboard: DashboardData;
  notifications: NotificationItem[];
  recommendations: Recommendation[];
  analytics: AnalyticsData;
}
