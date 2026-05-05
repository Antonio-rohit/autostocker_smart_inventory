import { Link } from "react-router";
import { ArrowLeft, TrendingUp, Package } from "lucide-react";
import { motion } from "motion/react";
import { useAppData } from "../context/AppDataContext";

export function TopSellingProducts() {
  const { dashboard, loading, error, formatCurrency } = useAppData();

  if (loading && !dashboard) {
    return <div className="text-slate-600 dark:text-slate-400">Loading top-selling products...</div>;
  }

  if (error || !dashboard) {
    return <div className="text-red-600 dark:text-red-400">{error || "Top-selling data is unavailable."}</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Top Sold Items</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">See which products generated the highest quantity sold and monthly revenue.</p>
      </motion.div>

      <div className="grid gap-4">
        {dashboard.topSellingProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <Link to={`/app/product/${product.id}`} className="font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {product.name}
                    </Link>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Rank #{index + 1}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:text-right">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Quantity Sold</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{product.sales}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {dashboard.topSellingProducts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <Package className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No sold products yet</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Once sales are recorded, the dashboard will rank the top items here.</p>
        </motion.div>
      )}
    </div>
  );
}
