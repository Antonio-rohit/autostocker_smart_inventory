import { useParams, Link } from "react-router";
import { ArrowLeft, Package, DollarSign, TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAppData } from "../context/AppDataContext";

export function ProductDetail() {
  const { id } = useParams();
  const { products, loading, error, formatCurrency } = useAppData();
  const product = products.find((p) => p.id === id);

  if (loading && products.length === 0) {
    return <div className="text-slate-600 dark:text-slate-400">Loading product...</div>;
  }

  if (error && products.length === 0) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Product not found</h2>
        <Link to="/app/inventory" className="text-blue-600 dark:text-blue-400 hover:underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  const statusColors = {
    low: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    optimal: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    overstock: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  const chartData = [
    ...product.salesHistory.map((item) => ({
      month: item.month,
      actualSales: item.sales,
      actualRevenue: item.revenue,
      predictedDemand: null,
    })),
    ...product.predictedDemand.map((item) => ({
      month: item.month,
      actualSales: null,
      actualRevenue: null,
      predictedDemand: item.demand,
    })),
  ];

  const getAIInsight = () => {
    if (product.status === "low") {
      return {
        title: "Restock Recommended",
        message: `Current stock (${product.stock} units) is below target. Projected demand next month is ${product.predictedDemand[0]?.demand ?? product.optimalStock} units.`,
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-500",
      };
    }
    if (product.status === "overstock") {
      return {
        title: "Excess Stock Detected",
        message: `Current stock exceeds the optimal level. Consider moving ${product.stock - product.optimalStock} excess units with a promotion.`,
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-500",
      };
    }
    return {
      title: "Stock Level Optimal",
      message: "Current stock levels are balanced against projected demand. Maintain the current inventory strategy.",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-500",
    };
  };

  const aiInsight = getAIInsight();
  const hasSales = product.salesHistory.some((item) => item.sales > 0 || item.revenue > 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/app/inventory"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{product.category}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[product.status]}`}>
            {product.status}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="bg-slate-50 dark:bg-slate-900">
          <ImageWithFallback
            src={product.imageUrl ?? undefined}
            alt={product.name}
            className="h-80 w-full object-contain p-6"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Current Stock", value: `${product.stock} units`, icon: Package },
          { label: "Optimal Stock", value: `${product.optimalStock} units`, icon: Package },
          { label: "Price", value: formatCurrency(product.price), icon: DollarSign },
          { label: "Monthly Revenue", value: formatCurrency(product.monthlyRevenue), icon: TrendingUp },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`border-l-4 ${aiInsight.borderColor} ${aiInsight.bgColor} rounded-xl p-6 shadow-sm`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Stock Insight: {aiInsight.title}
            </h3>
            <p className="text-slate-700 dark:text-slate-300">{aiInsight.message}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Sales History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={product.salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value: number, name: string) => (name === "Revenue" ? formatCurrency(Number(value)) : value)} />
                <Bar dataKey="sales" fill="#2563EB" radius={[8, 8, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!hasSales && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              No sales have been recorded for this product yet. The chart will update automatically after transactions.
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Selling Trend & Forecast</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actualSales" stroke="#2563EB" strokeWidth={3} dot={{ fill: "#2563EB", r: 4 }} name="Actual Sales" connectNulls />
                <Line
                  type="monotone"
                  dataKey="predictedDemand"
                  stroke="#22C55E"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: "#22C55E", r: 4 }}
                  name="Predicted Demand"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Product Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">SKU</p>
            <p className="font-medium text-slate-900 dark:text-white">{product.sku}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Category</p>
            <p className="font-medium text-slate-900 dark:text-white">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Price</p>
            <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(product.price)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Stock</p>
            <p className="font-medium text-slate-900 dark:text-white">{product.stock} units</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Optimal Stock</p>
            <p className="font-medium text-slate-900 dark:text-white">{product.optimalStock} units</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Stock Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[product.status]}`}>
              {product.status}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
