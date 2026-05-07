import { Link } from "react-router";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
  Sparkles,
  ArrowUp,
  ShoppingBag,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { useAppData } from "../context/AppDataContext";

export function Dashboard() {
  const { dashboard, recommendations, loading, error, formatCurrency, settings, unreadNotificationCount } = useAppData();

  if (loading && !dashboard) {
    return <div className="text-slate-600 dark:text-slate-400">Loading dashboard...</div>;
  }

  if (error || !dashboard) {
    return <div className="text-red-600 dark:text-red-400">{error || "Dashboard data is unavailable."}</div>;
  }

  const stats = [
    {
      name: "Total Products",
      value: dashboard.totalProducts,
      icon: Package,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "Today's Sales",
      value: dashboard.todaysSales.count,
      icon: ShoppingBag,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      subtitle: `${formatCurrency(dashboard.todaysSales.revenue)} revenue`,
    },
    {
      name: "Low Stock Alerts",
      value: dashboard.lowStockAlerts,
      icon: AlertTriangle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      subtitle: `${unreadNotificationCount} unread notifications`,
      href: "/app/alerts",
    },
    {
      name: "Top Selling Product",
      value: dashboard.topSellingProduct,
      icon: TrendingUp,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      isText: true,
      href: "/app/top-selling",
      helper: "View top sold items",
    },
    {
      name: "Monthly Revenue",
      value: formatCurrency(dashboard.monthlyRevenue),
      icon: DollarSign,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      isText: true,
    },
  ];

  const urgencyColors = {
    high: "border-red-500 bg-red-50 dark:bg-red-900/10",
    medium: "border-amber-500 bg-amber-50 dark:bg-amber-900/10",
    low: "border-blue-500 bg-blue-50 dark:bg-blue-900/10",
  };

  const urgencyBadgeColors = {
    high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    low: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome back to {settings.businessInfo.businessName}. Here&apos;s what is happening with your inventory.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Link
          to="/app/quick-billing"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Quick Billing</h3>
              <p className="text-sm text-green-100">Fast checkout for customers</p>
            </div>
            <ShoppingBag className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        <Link
          to="/app/add-product"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Add New Product</h3>
              <p className="text-sm text-blue-100">Expand your inventory</p>
            </div>
            <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
        <Link
          to="/app/history"
          className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Transaction History</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">View every stock movement</p>
            </div>
            <ArrowRight className="w-8 h-8 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const card = (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all h-full"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.name}</p>
                  <p className={`text-2xl font-bold text-slate-900 dark:text-white ${stat.isText ? "text-lg" : ""}`}>
                    {stat.value}
                  </p>
                  {stat.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{stat.subtitle}</p>}
                  {stat.helper && <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">{stat.helper}</p>}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );

          if (stat.href) {
            return (
              <Link key={stat.name} to={stat.href} className="block">
                {card}
              </Link>
            );
          }

          return card;
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sales Overview</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Recent sales based on recorded transactions</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <ArrowUp className="w-4 h-4" />
              Live updates
            </span>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboard.salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(value: number) => formatCurrency(Number(value))}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ fill: "#2563EB", r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Stock Recommendations
            </h2>
          </div>
          <Link
            to="/app/alerts"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.slice(0, 4).map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`border-l-4 ${urgencyColors[rec.urgency]} rounded-xl p-5 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">{rec.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyBadgeColors[rec.urgency]}`}>
                  {rec.urgency}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{rec.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">{rec.action}</span>
                  <span className="text-green-600 dark:text-green-400 ml-2">{rec.impact}</span>
                </div>
                {rec.productId && (
                  <Link
                    to={`/app/product/${rec.productId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View details
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
