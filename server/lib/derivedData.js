const currency = (value) => Number(value.toFixed(2));

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_HISTORY_DAYS = 14;
const DAILY_FORECAST_DAYS = 7;
const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RECENT_MONTH_COUNT = 6;
const FORECAST_MONTH_COUNT = 3;

const getMonthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const getDayKey = (date) => date.toISOString().slice(0, 10);

const getMonthLabel = (year, monthIndex) => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString("en-US", { month: "short" });
};

const getDayLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

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

const getRecentDays = (count = DAILY_HISTORY_DAYS) => {
  const days = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    days.push({
      key: getDayKey(date),
      isoDate: date.toISOString(),
      label: getDayLabel(date),
      date,
    });
  }

  return days;
};

const getForecastDays = (count = DAILY_FORECAST_DAYS) => {
  const days = [];
  const now = new Date();

  for (let offset = 1; offset <= count; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
    days.push({
      key: getDayKey(date),
      isoDate: date.toISOString(),
      label: getDayLabel(date),
      date,
    });
  }

  return days;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const filterSaleTransactions = (transactions = []) => transactions.filter((transaction) => transaction.action === "sale");

const isWithinWindow = (timestamp, start, end) => {
  const value = new Date(timestamp).getTime();
  return value >= start.getTime() && value < end.getTime();
};

const calculatePercentChange = (current, previous) => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const groupSalesByMonth = (transactions = []) => {
  const grouped = new Map();

  filterSaleTransactions(transactions).forEach((transaction) => {
    const date = new Date(transaction.timestamp);
    const key = getMonthKey(date);
    const current = grouped.get(key) ?? { sales: 0, revenue: 0 };
    current.sales += Number(transaction.quantity ?? 0);
    current.revenue += Number(transaction.price ?? 0);
    grouped.set(key, current);
  });

  return grouped;
};

const groupSalesByDay = (transactions = []) => {
  const grouped = new Map();

  filterSaleTransactions(transactions).forEach((transaction) => {
    const date = new Date(transaction.timestamp);
    const key = getDayKey(date);
    const current = grouped.get(key) ?? { sales: 0 };
    current.sales += Number(transaction.quantity ?? 0);
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

const buildDailySalesHistory = (transactions = []) => {
  const grouped = groupSalesByDay(transactions);

  return getRecentDays().map((day, index) => ({
    id: `history-${day.key}-${index}`,
    isoDate: day.isoDate,
    label: day.label,
    sales: Math.max(0, Math.round(grouped.get(day.key)?.sales ?? 0)),
  }));
};

const predictFutureDailySales = (historyValues, count = DAILY_FORECAST_DAYS) => {
  if (historyValues.length === 0) {
    return {
      method: "moving_average",
      values: Array.from({ length: count }, () => 0),
    };
  }

  const average = historyValues.reduce((sum, value) => sum + value, 0) / historyValues.length;
  const nonZeroValues = historyValues.filter((value) => value > 0);

  if (historyValues.length >= 5 && nonZeroValues.length >= 2) {
    const n = historyValues.length;
    const sumX = historyValues.reduce((sum, _value, index) => sum + index, 0);
    const sumY = historyValues.reduce((sum, value) => sum + value, 0);
    const sumXY = historyValues.reduce((sum, value, index) => sum + index * value, 0);
    const sumXX = historyValues.reduce((sum, _value, index) => sum + index * index, 0);
    const denominator = n * sumXX - sumX * sumX;

    if (denominator !== 0) {
      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;
      const values = Array.from({ length: count }, (_value, index) => {
        const predicted = intercept + slope * (historyValues.length + index);
        return Math.max(0, Math.round(predicted));
      });

      return {
        method: "linear_regression",
        values,
      };
    }
  }

  return {
    method: "moving_average",
    values: Array.from({ length: count }, () => Math.max(0, Math.round(average))),
  };
};

const buildDemandForecast = (transactions = [], stock = 0) => {
  const history = buildDailySalesHistory(transactions);
  const historyValues = history.map((point) => point.sales);
  // We keep zero-sale days in the input so the forecast reflects quiet periods instead of over-ordering.
  const prediction = predictFutureDailySales(historyValues, DAILY_FORECAST_DAYS);
  const forecastDays = getForecastDays(DAILY_FORECAST_DAYS);

  const forecastPoints = forecastDays.map((day, index) => ({
    id: `forecast-day-${day.key}-${index}`,
    isoDate: day.isoDate,
    label: day.label,
    sales: prediction.values[index] ?? 0,
  }));

  const expectedSalesNext7Days = forecastPoints.reduce((sum, point) => sum + point.sales, 0);
  const averageDailySales = expectedSalesNext7Days > 0 ? Math.max(1, Math.round(expectedSalesNext7Days / DAILY_FORECAST_DAYS)) : 0;
  const stockRunOutDays = averageDailySales > 0 ? Number((stock / averageDailySales).toFixed(1)) : null;
  const stockRunOutDate = stockRunOutDays !== null ? new Date(Date.now() + stockRunOutDays * DAY_IN_MS).toISOString() : null;

  return {
    method: prediction.method,
    lookbackDays: DAILY_HISTORY_DAYS,
    forecastDays: DAILY_FORECAST_DAYS,
    averageDailySales,
    expectedSalesNext7Days,
    stockRunOutDays,
    stockRunOutDate,
    timeline: [
      ...history.map((point) => ({
        id: point.id,
        isoDate: point.isoDate,
        label: point.label,
        actualSales: point.sales,
        forecastSales: null,
      })),
      ...forecastPoints.map((point) => ({
        id: point.id,
        isoDate: point.isoDate,
        label: point.label,
        actualSales: null,
        forecastSales: point.sales,
      })),
    ],
  };
};

const buildDemandForecastTimeline = (products = []) => {
  const timeline = new Map();

  products.forEach((product) => {
    product.demandForecast.timeline.forEach((point) => {
      const current = timeline.get(point.isoDate) ?? {
        id: `analytics-${point.isoDate}`,
        isoDate: point.isoDate,
        label: point.label,
        actualSales: 0,
        forecastSales: 0,
      };

      current.actualSales += point.actualSales ?? 0;
      current.forecastSales += point.forecastSales ?? 0;
      timeline.set(point.isoDate, current);
    });
  });

  return [...timeline.values()]
    .sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime())
    .map((point) => ({
      ...point,
      actualSales: point.actualSales > 0 ? Math.round(point.actualSales) : null,
      forecastSales: point.forecastSales > 0 ? Math.round(point.forecastSales) : null,
    }));
};

const buildInventoryForecasts = (products = []) =>
  [...products]
    .map((product) => ({
      id: product.id,
      name: product.name,
      currentStock: product.stock,
      expectedSalesNext7Days: product.demandForecast.expectedSalesNext7Days,
      averageDailySales: product.demandForecast.averageDailySales,
      stockRunOutDays: product.demandForecast.stockRunOutDays,
    }))
    .sort((a, b) => {
      const aDays = a.stockRunOutDays ?? Number.POSITIVE_INFINITY;
      const bDays = b.stockRunOutDays ?? Number.POSITIVE_INFINITY;
      if (aDays !== bDays) {
        return aDays - bDays;
      }

      return b.expectedSalesNext7Days - a.expectedSalesNext7Days;
    })
    .slice(0, 8);

const getTrend = (salesHistory = []) => {
  if (salesHistory.length < 2) return "stable";
  const first = salesHistory[0].sales;
  const last = salesHistory[salesHistory.length - 1].sales;
  if (last > first) return "up";
  if (last < first) return "down";
  return "stable";
};

const buildSmartInsights = (products, transactions) => {
  const insights = [];
  const saleTransactions = filterSaleTransactions(transactions);

  const decliningProduct = [...products]
    .map((product) => {
      const latest = product.salesHistory.at(-1)?.sales ?? 0;
      const previous = product.salesHistory.at(-2)?.sales ?? 0;
      return {
        product,
        latest,
        previous,
        decline: previous - latest,
      };
    })
    .filter((entry) => entry.previous > 0 && entry.latest < entry.previous)
    .sort((a, b) => b.decline - a.decline)[0];

  if (decliningProduct) {
    insights.push({
      id: `declining-${decliningProduct.product.id}`,
      title: `${decliningProduct.product.name} is declining`,
      message: `Monthly unit sales fell from ${decliningProduct.previous} to ${decliningProduct.latest}. Consider a promotion or shelf repositioning before demand softens further.`,
      tone: "warning",
    });
  }

  const end = startOfToday();
  const currentWindowStart = new Date(end.getTime() - 30 * DAY_IN_MS);
  const previousWindowStart = new Date(currentWindowStart.getTime() - 30 * DAY_IN_MS);
  const productLookup = new Map(products.map((product) => [product.id, product]));
  const categoryPerformance = new Map();

  saleTransactions.forEach((transaction) => {
    const product = productLookup.get(transaction.productId);
    if (!product) return;

    const bucket = categoryPerformance.get(product.category) ?? { current: 0, previous: 0 };
    if (isWithinWindow(transaction.timestamp, currentWindowStart, end)) {
      bucket.current += transaction.quantity;
    } else if (isWithinWindow(transaction.timestamp, previousWindowStart, currentWindowStart)) {
      bucket.previous += transaction.quantity;
    }
    categoryPerformance.set(product.category, bucket);
  });

  const growingCategory = [...categoryPerformance.entries()]
    .map(([category, totals]) => ({
      category,
      current: totals.current,
      previous: totals.previous,
      change: calculatePercentChange(totals.current, totals.previous),
    }))
    .filter((entry) => entry.current > entry.previous)
    .sort((a, b) => b.change - a.change)[0];

  if (growingCategory) {
    insights.push({
      id: `growing-${growingCategory.category}`,
      title: `${growingCategory.category} is growing`,
      message: `This category sold ${growingCategory.current} units in the last 30 days, up ${growingCategory.change}% from the previous period. It may deserve extra shelf space.`,
      tone: "positive",
    });
  }

  const timeBuckets = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  saleTransactions.forEach((transaction) => {
    const hour = new Date(transaction.timestamp).getHours();
    if (hour >= 6 && hour < 12) timeBuckets.morning += transaction.quantity;
    else if (hour >= 12 && hour < 17) timeBuckets.afternoon += transaction.quantity;
    else if (hour >= 17 && hour < 22) timeBuckets.evening += transaction.quantity;
    else timeBuckets.night += transaction.quantity;
  });

  const [peakPeriod, peakSales] = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0] ?? ["day", 0];
  const periodLabelMap = {
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
    day: "day",
  };

  insights.push({
    id: `peak-${peakPeriod}`,
    title: `Peak sales time is ${periodLabelMap[peakPeriod]}`,
    message: peakSales > 0
      ? `${peakSales} units were sold during the ${periodLabelMap[peakPeriod]} window recently. That is the best time to keep fast movers visible and staff ready.`
      : "The app needs more sales history before it can confidently identify your busiest selling window.",
    tone: peakSales > 0 ? "info" : "warning",
  });

  return insights.slice(0, 3);
};

const buildGamification = (products, transactions) => {
  const saleTransactions = filterSaleTransactions(transactions);
  const today = startOfToday();
  const currentWeekStart = new Date(today.getTime() - 7 * DAY_IN_MS);
  const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * DAY_IN_MS);

  const currentWeekSales = saleTransactions.filter((transaction) => isWithinWindow(transaction.timestamp, currentWeekStart, today));
  const previousWeekSales = saleTransactions.filter((transaction) => isWithinWindow(transaction.timestamp, previousWeekStart, currentWeekStart));

  const currentWeekRevenue = currentWeekSales.reduce((sum, transaction) => sum + Number(transaction.price ?? 0), 0);
  const previousWeekRevenue = previousWeekSales.reduce((sum, transaction) => sum + Number(transaction.price ?? 0), 0);
  const salesGrowthPercent = calculatePercentChange(currentWeekRevenue, previousWeekRevenue);

  const weeklyProductMap = new Map();
  currentWeekSales.forEach((transaction) => {
    const current = weeklyProductMap.get(transaction.productId) ?? {
      id: transaction.productId,
      name: transaction.productName,
      sales: 0,
      revenue: 0,
    };
    current.sales += transaction.quantity;
    current.revenue += Number(transaction.price ?? 0);
    weeklyProductMap.set(transaction.productId, current);
  });

  const topProductOfWeek = [...weeklyProductMap.values()]
    .sort((a, b) => {
      if (b.sales !== a.sales) return b.sales - a.sales;
      return b.revenue - a.revenue;
    })[0];

  const achievements = [];

  if (topProductOfWeek) {
    achievements.push({
      id: "weekly-winner",
      title: "Weekly Winner",
      description: `${topProductOfWeek.name} led the week with ${topProductOfWeek.sales} units sold.`,
      tone: "gold",
    });
  }

  if (salesGrowthPercent >= 10) {
    achievements.push({
      id: "growth-streak",
      title: "Growth Streak",
      description: `Sales revenue grew ${salesGrowthPercent}% versus the previous 7 days.`,
      tone: "green",
    });
  }

  const lowStockCount = products.filter((product) => product.status === "low").length;
  if (lowStockCount === 0) {
    achievements.push({
      id: "shelf-guardian",
      title: "Shelf Guardian",
      description: "No products are currently below the low-stock threshold.",
      tone: "blue",
    });
  } else {
    achievements.push({
      id: "focus-mode",
      title: "Focus Mode",
      description: `${lowStockCount} product${lowStockCount === 1 ? "" : "s"} need attention to keep the streak going.`,
      tone: "amber",
    });
  }

  return {
    topProductOfWeek: topProductOfWeek
      ? {
          ...topProductOfWeek,
          revenue: currency(topProductOfWeek.revenue),
          badge: topProductOfWeek.sales >= 10 ? "Fast Mover" : "Rising Star",
        }
      : null,
    salesGrowthPercent,
    achievements,
    periodLabel: "Last 7 days",
  };
};

export const getStatus = (stock, optimalStock) => {
  if (stock <= optimalStock * 0.5) return "low";
  if (stock >= optimalStock * 1.2) return "overstock";
  return "optimal";
};

export const serializeProduct = (product, relatedTransactions = []) => {
  const salesHistory = buildSalesHistory(relatedTransactions);
  const predictedDemand = buildPredictedDemand(salesHistory);
  const demandForecast = buildDemandForecast(relatedTransactions, product.stock);
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
    demandForecast,
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
        message: `${product.name} is projected to move ${product.demandForecast.expectedSalesNext7Days} units over the next 7 days.`,
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
        const target = Math.max(Math.ceil(product.demandForecast.expectedSalesNext7Days), product.optimalStock);
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
        impact: `Potential upside of Rs ${currency(product.price * product.demandForecast.expectedSalesNext7Days)}`,
        reason: "Trend analysis shows increasing customer demand.",
      };
    })
    .slice(0, 6);

export const buildSalesOverTime = (transactions) => {
  const sales = filterSaleTransactions(transactions);
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
  const orderCount = filterSaleTransactions(transactions).length || 1;

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
    demandForecastTimeline: buildDemandForecastTimeline(products),
    inventoryForecasts: buildInventoryForecasts(products),
    insights: {
      bestCategory: [...categoryPerformance].sort((a, b) => b.value - a.value)[0]?.name ?? "N/A",
      revenueGrowth: "+12.5%",
      inventoryTurnover: "6.2x",
    },
  };
};

export const buildDashboard = (products, transactions, analytics) => {
  const todaysSales = filterSaleTransactions(transactions)
    .filter((transaction) => {
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
    smartInsights: buildSmartInsights(products, transactions),
    gamification: buildGamification(products, transactions),
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
