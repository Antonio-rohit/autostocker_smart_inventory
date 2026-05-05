const currency = (value) => Number(value.toFixed(2));

const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RECENT_MONTH_COUNT = 6;
const FORECAST_MONTH_COUNT = 3;

const getMonthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (year, monthIndex) => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString("en-US", { month: "short" });
};

const getRecentMonths = (count = RECENT_MONTH_COUNT) => {
  const months = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    months.push({
      key: getMonthKey(date),
      label: getMonthLabel(date.getUTCFullYear(), date.getUTCMonth()),
      year: date.getUTCFullYear(),
      monthIndex: date.getUTCMonth(),
    });
  }

  return months;
};

const getForecastMonths = (count = FORECAST_MONTH_COUNT) => {
  const months = [];
  const now = new Date();

  for (let offset = 1; offset <= count; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    months.push({
      key: getMonthKey(date),
      label: getMonthLabel(date.getUTCFullYear(), date.getUTCMonth()),
    });
  }

  return months;
};

const groupSalesByMonth = (transactions = []) => {
  const grouped = new Map();

  transactions
    .filter((transaction) => transaction.action === "sale")
    .forEach((transaction) => {
      const date = new Date(transaction.timestamp);
      const key = getMonthKey(date);
      const current = grouped.get(key) ?? { sales: 0, revenue: 0 };
      current.sales += Number(transaction.quantity ?? 0);
      current.revenue += Number(transaction.price ?? 0);
      grouped.set(key, current);
    });

  return grouped;
};

const buildSalesHistory = (transactions = []) => {
  const grouped = groupSalesByMonth(transactions);

  return getRecentMonths().map((month, index) => {
    const totals = grouped.get(month.key) ?? { sales: 0, revenue: 0 };
    return {
      id: `${month.key}-${index}`,
      month: month.label,
      sales: totals.sales,
      revenue: currency(totals.revenue),
    };
  });
};

const buildPredictedDemand = (salesHistory = []) => {
  const recentSales = salesHistory.map((point) => point.sales);
  const nonZeroSales = recentSales.filter((value) => value > 0);
  const average = nonZeroSales.length > 0 ? nonZeroSales.reduce((sum, value) => sum + value, 0) / nonZeroSales.length : 0;
  const latest = recentSales.at(-1) ?? 0;
  const previous = recentSales.at(-2) ?? latest;
  const trendDelta = Math.max(latest - previous, 0);
  const baseline = average > 0 ? average : latest;

  return getForecastMonths().map((month, index) => ({
    id: `forecast-${month.key}-${index}`,
    month: month.label,
    demand: Math.max(1, Math.round(baseline + trendDelta * (index + 1) * 0.5)),
  }));
};

export const getStatus = (stock, optimalStock) => {
  if (stock <= optimalStock * 0.5) return "low";
  if (stock >= optimalStock * 1.2) return "overstock";
  return "optimal";
};

export const getTrend = (salesHistory = []) => {
  if (salesHistory.length < 2) return "stable";
  const first = salesHistory[0].sales;
  const last = salesHistory[salesHistory.length - 1].sales;
  if (last > first) return "up";
  if (last < first) return "down";
  return "stable";
};

export const serializeProduct = (product, relatedTransactions = []) => {
  const salesHistory = buildSalesHistory(relatedTransactions);
  const predictedDemand = buildPredictedDemand(salesHistory);
  const monthlyRevenue = salesHistory.at(-1)?.revenue ?? 0;

  return {
    id: product._id.toString(),
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    optimalStock: product.optimalStock,
    sku: product.sku,
    imageUrl: product.imageUrl ?? null,
    status: getStatus(product.stock, product.optimalStock),
    trend: getTrend(salesHistory),
    monthlyRevenue,
    salesHistory,
    predictedDemand,
  };
};

export const serializeTransaction = (transaction, billInfo = null) => ({
  id: transaction._id.toString(),
  productId: transaction.productId.toString(),
  productName: transaction.productName,
  action: transaction.action,
  quantity: transaction.quantity,
  price: transaction.price,
  supplier: transaction.supplier,
  paymentStatus: billInfo?.paymentStatus ?? null,
  billNumber: billInfo?.billNumber ?? null,
  timestamp: transaction.timestamp.toISOString(),
});

export const buildNotifications = (products) => {
  const notifications = [];

  products.forEach((product) => {
    if (product.status === "low") {
      notifications.push({
        id: `low-${product.id}`,
        type: product.stock <= product.optimalStock * 0.3 ? "critical" : "warning",
        title: product.stock <= product.optimalStock * 0.3 ? "Critical Stock Alert" : "Low Stock Warning",
        message:
          product.stock <= product.optimalStock * 0.3
            ? `${product.name} is critically low (${product.stock} units). Restock immediately.`
            : `${product.name} stock is below optimal level (${product.stock}/${product.optimalStock} units).`,
        product: product.name,
        productId: product.id,
        timestamp: new Date().toISOString(),
        priority: product.stock <= product.optimalStock * 0.3 ? "high" : "medium",
      });
    }

    if (product.status === "overstock") {
      notifications.push({
        id: `overstock-${product.id}`,
        type: "warning",
        title: "Overstock Alert",
        message: `${product.name} is above its target stock level. Consider moving ${product.stock - product.optimalStock} excess units.`,
        product: product.name,
        productId: product.id,
        timestamp: new Date().toISOString(),
        priority: "low",
      });
    }

    if (product.trend === "up" && product.predictedDemand[0]) {
      notifications.push({
        id: `demand-${product.id}`,
        type: "info",
        title: "Demand Spike Predicted",
        message: `${product.name} is projected to hit ${product.predictedDemand[0].demand} units next month.`,
        product: product.name,
        productId: product.id,
        timestamp: new Date().toISOString(),
        priority: "medium",
      });
    }
  });

  return notifications.slice(0, 8);
};

export const buildRecommendations = (products) =>
  products
    .filter((product) => product.status !== "optimal" || product.trend === "up")
    .map((product) => {
      if (product.status === "low") {
        const target = product.predictedDemand[0]?.demand ?? product.optimalStock;
        const orderAmount = Math.max(target - product.stock, product.optimalStock - product.stock);
        return {
          id: `restock-${product.id}`,
          type: "restock",
          urgency: product.stock <= product.optimalStock * 0.3 ? "high" : "medium",
          title: `Restock ${product.name}`,
          description: "Demand is outpacing current inventory.",
          product: product.name,
          productId: product.id,
          action: `Order ${orderAmount} units`,
          impact: `Protect up to Rs ${currency(orderAmount * product.price)}`,
          reason: "Current stock is below the recommended safety threshold.",
        };
      }

      if (product.status === "overstock") {
        return {
          id: `reduce-${product.id}`,
          type: "reduce",
          urgency: "medium",
          title: `Reduce ${product.name} stock`,
          description: "Inventory is above the planned target level.",
          product: product.name,
          productId: product.id,
          action: "Run a promotion or bundle",
          impact: `Free ${product.stock - product.optimalStock} units of shelf space`,
          reason: "Sell-through is slower than the current stocking pace.",
        };
      }

      return {
        id: `optimize-${product.id}`,
        type: "optimize",
        urgency: "low",
        title: `Watch ${product.name} closely`,
        description: "Sales momentum is improving and may justify higher allocation.",
        product: product.name,
        productId: product.id,
        action: "Monitor weekly sell-through",
        impact: `Potential upside of Rs ${currency(product.price * (product.predictedDemand[0]?.demand ?? 0))}`,
        reason: "Trend analysis shows increasing customer demand.",
      };
    })
    .slice(0, 6);

export const buildSalesOverTime = (transactions) => {
  const sales = transactions.filter((transaction) => transaction.action === "sale");
  const grouped = new Map();

  sales.forEach((transaction) => {
    const date = new Date(transaction.timestamp);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = grouped.get(label) ?? { id: label, date: label, sales: 0, revenue: 0, sortKey: date.getTime() };
    entry.sales += transaction.quantity;
    entry.revenue += transaction.price ?? 0;
    grouped.set(label, entry);
  });

  return [...grouped.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-8)
    .map(({ sortKey, ...entry }) => ({ ...entry, revenue: currency(entry.revenue) }));
};

export const buildSeasonalData = (products) => {
  const byMonth = new Map();
  monthOrder.forEach((month) => byMonth.set(month, { month, sales: 0, revenue: 0 }));

  products.forEach((product) => {
    product.salesHistory.forEach((point) => {
      const monthEntry = byMonth.get(point.month) ?? { month: point.month, sales: 0, revenue: 0 };
      monthEntry.sales += point.sales;
      monthEntry.revenue += point.revenue;
      byMonth.set(point.month, monthEntry);
    });
  });

  return monthOrder
    .map((month) => byMonth.get(month))
    .filter((entry) => entry.sales > 0 || entry.revenue > 0)
    .map((entry) => ({
      ...entry,
      revenue: currency(entry.revenue),
    }));
};

export const buildAnalytics = (products, transactions) => {
  const salesOverTime = buildSalesOverTime(transactions);
  const totalRevenue = salesOverTime.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = salesOverTime.reduce((sum, item) => sum + item.sales, 0);
  const orderCount = transactions.filter((item) => item.action === "sale").length || 1;

  const topProducts = [...products]
    .sort((a, b) => {
      const salesDifference = (b.salesHistory.at(-1)?.sales ?? 0) - (a.salesHistory.at(-1)?.sales ?? 0);
      if (salesDifference !== 0) return salesDifference;
      return b.monthlyRevenue - a.monthlyRevenue;
    })
    .slice(0, 10)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sales: product.salesHistory.at(-1)?.sales ?? 0,
      revenue: currency(product.monthlyRevenue),
    }));

  const categoryMap = new Map();
  products.forEach((product) => {
    categoryMap.set(product.category, (categoryMap.get(product.category) ?? 0) + product.monthlyRevenue);
  });

  const categoryTotal = [...categoryMap.values()].reduce((sum, value) => sum + value, 0) || 1;
  const categoryPerformance = [...categoryMap.entries()].map(([name, value]) => ({
    name,
    value: currency(value),
    percentage: Math.round((value / categoryTotal) * 100),
  }));

  return {
    salesOverTime,
    topProducts,
    categoryPerformance,
    seasonalData: buildSeasonalData(products),
    monthlyStats: [
      { label: "Total Revenue", value: `Rs ${currency(totalRevenue).toFixed(2)}`, change: "+12.5%", positive: true },
      { label: "Total Sales", value: totalSales.toString(), change: "+8.3%", positive: true },
      { label: "Products Sold", value: products.filter((product) => (product.salesHistory.at(-1)?.sales ?? 0) > 0).length.toString(), change: "0%", positive: true },
      { label: "Avg Order Value", value: `Rs ${currency(totalRevenue / orderCount).toFixed(2)}`, change: "+3.2%", positive: true },
    ],
    insights: {
      bestCategory: categoryPerformance.sort((a, b) => b.value - a.value)[0]?.name ?? "N/A",
      revenueGrowth: "+12.5%",
      inventoryTurnover: "6.2x",
    },
  };
};

export const buildDashboard = (products, transactions, analytics) => {
  const todaysSales = transactions
    .filter((transaction) => {
      if (transaction.action !== "sale") return false;
      const txDate = new Date(transaction.timestamp);
      const now = new Date();
      return txDate.toDateString() === now.toDateString();
    })
    .reduce(
      (acc, transaction) => {
        acc.count += transaction.quantity;
        acc.revenue += transaction.price ?? 0;
        return acc;
      },
      { count: 0, revenue: 0 }
    );

  const rankedTopProducts = [...analytics.topProducts].slice(0, 10);

  return {
    totalProducts: products.length,
    lowStockAlerts: products.filter((product) => product.status === "low").length,
    topSellingProduct: rankedTopProducts[0]?.name ?? "N/A",
    topSellingProducts: rankedTopProducts,
    monthlyRevenue: currency(products.reduce((sum, product) => sum + product.monthlyRevenue, 0)),
    todaysSales: { count: todaysSales.count, revenue: currency(todaysSales.revenue) },
    salesOverTime: analytics.salesOverTime,
  };
};

export const serializeBill = (bill) => ({
  id: bill._id.toString(),
  billNumber: bill.billNumber,
  paymentMethod: bill.paymentMethod,
  paymentStatus: bill.paymentStatus ?? "paid",
  subtotal: bill.subtotal,
  discountPercent: bill.discountPercent,
  discountAmount: bill.discountAmount,
  taxPercent: bill.taxPercent,
  taxAmount: bill.taxAmount,
  total: bill.total,
  items: bill.items.map((item) => ({
    productId: item.productId.toString(),
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
  transactionIds: bill.transactionIds.map((id) => id.toString()),
  issuedAt: bill.issuedAt.toISOString(),
});
