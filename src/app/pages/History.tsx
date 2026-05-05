import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Clock, Search, ShoppingCart, PackagePlus, Filter } from "lucide-react";
import { motion } from "motion/react";
import { useAppData } from "../context/AppDataContext";

export function History() {
  const { transactions, loading, error, formatCurrency } = useAppData();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "sale" | "stock_added">("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesQuery = transaction.productName.toLowerCase().includes(query.toLowerCase());
      const matchesAction = actionFilter === "all" || transaction.action === actionFilter;
      return matchesQuery && matchesAction;
    });
  }, [actionFilter, query, transactions]);

  const formatDateTime = (timestamp: string) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));

  if (loading && transactions.length === 0) {
    return <div className="text-slate-600 dark:text-slate-400">Loading history...</div>;
  }

  if (error && transactions.length === 0) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Every sale and stock addition recorded in the inventory system.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by product name"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value as "all" | "sale" | "stock_added")}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">All actions</option>
              <option value="sale">Sales</option>
              <option value="stock_added">Stock added</option>
            </select>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {filteredTransactions.map((transaction, index) => {
          const isSale = transaction.action === "sale";
          const paymentStatusColor = transaction.paymentStatus === "unpaid"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-3 ${isSale ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {isSale ? <ShoppingCart className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
                  </div>
                  <div>
                    <Link to={`/app/product/${transaction.productId}`} className="font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {transaction.productName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isSale ? "Sale recorded" : "Stock added"}
                      </p>
                      {isSale && transaction.paymentStatus && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${paymentStatusColor}`}>
                          {transaction.paymentStatus}
                        </span>
                      )}
                      {isSale && transaction.billNumber && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">Bill #{transaction.billNumber}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(transaction.timestamp)}
                      </span>
                      {transaction.supplier && <span>Supplier: {transaction.supplier}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-xl font-bold ${isSale ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
                    {isSale ? "-" : "+"}{transaction.quantity} units
                  </p>
                  {typeof transaction.price === "number" && transaction.price > 0 && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{formatCurrency(transaction.price)}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTransactions.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <Clock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No matching transactions</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Try another search or filter to find the activity you need.</p>
        </motion.div>
      )}
    </div>
  );
}
