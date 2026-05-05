import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, ArrowUpDown, Plus, Package, TrendingUp, TrendingDown, Minus, ShoppingCart, PackagePlus, Clock } from "lucide-react";
import { motion } from "motion/react";
import { RecordSaleModal } from "../components/RecordSaleModal";
import { AddStockModal } from "../components/AddStockModal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { toast } from "sonner";
import { useAppData } from "../context/AppDataContext";

export function Inventory() {
  const { products, transactions, addStock, recordSale, loading, error, formatCurrency } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [activeTab, setActiveTab] = useState<"products" | "transactions">("products");
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; stock: number; price: number } | null>(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [animatedProductId, setAnimatedProductId] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stock") return a.stock - b.stock;
      if (sortBy === "price") return a.price - b.price;
      return 0;
    });

  const statusColors = {
    low: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    optimal: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    overstock: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  const getStockPercentage = (stock: number, optimal: number) => {
    return Math.min((stock / optimal) * 100, 100);
  };

  const getStockBarColor = (status: string) => {
    if (status === "low") return "bg-red-500";
    if (status === "optimal") return "bg-green-500";
    return "bg-amber-500";
  };

  const handleRecordSale = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct({ id: product.id, name: product.name, stock: product.stock, price: product.price });
      setSaleModalOpen(true);
    }
  };

  const handleAddStock = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct({ id: product.id, name: product.name, stock: product.stock, price: product.price });
      setStockModalOpen(true);
    }
  };

  const onRecordSale = async (productId: string, quantity: number, totalPrice: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      await recordSale(productId, quantity, totalPrice);
      setAnimatedProductId(productId);
      setTimeout(() => setAnimatedProductId(null), 600);
      toast.success(`Recorded sale of ${quantity} ${product.name}`);
    }
  };

  const onAddStock = async (productId: string, quantity: number, supplier: string, purchasePrice: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      await addStock(productId, quantity, supplier, purchasePrice);
      setAnimatedProductId(productId);
      setTimeout(() => setAnimatedProductId(null), 600);
      toast.success(`Added ${quantity} units to ${product.name}`);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading && products.length === 0) {
    return <div className="text-slate-600 dark:text-slate-400">Loading inventory...</div>;
  }

  if (error && products.length === 0) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and monitor your product stock levels
          </p>
        </div>
        <Link
          to="/app/add-product"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm inline-flex gap-1"
      >
        <button
          onClick={() => setActiveTab("products")}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === "products"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </div>
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === "transactions"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Stock Activity
          </div>
        </button>
      </motion.div>

      {/* Products View */}
      {activeTab === "products" && (
        <>
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="low">Low Stock</option>
                  <option value="optimal">Optimal</option>
                  <option value="overstock">Overstock</option>
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                >
                  <option value="name">Sort by Name</option>
                  <option value="stock">Sort by Stock</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: animatedProductId === product.id ? [1, 1.02, 1] : 1,
                }}
                transition={{ 
                  delay: index * 0.05,
                  scale: { duration: 0.3 }
                }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <Link to={`/app/product/${product.id}`}>
                  <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <ImageWithFallback
                      src={product.imageUrl ?? undefined}
                      alt={product.name}
                      className="h-44 w-full object-contain p-3"
                    />
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{product.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusColors[product.status]}`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Price</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(product.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">SKU</p>
                      <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">{product.sku}</p>
                    </div>
                  </div>

                  {/* Stock Level */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">Stock Level</span>
                      <motion.span 
                        key={`${product.id}-${product.stock}`}
                        initial={{ scale: 1.2, color: "#2563EB" }}
                        animate={{ scale: 1, color: undefined }}
                        transition={{ duration: 0.3 }}
                        className="font-medium text-slate-900 dark:text-white"
                      >
                        {product.stock} / {product.optimalStock}
                      </motion.span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getStockBarColor(product.status)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getStockPercentage(product.stock, product.optimalStock)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Trend and Revenue */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mb-4">
                    <div className="flex items-center gap-2">
                      {product.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {product.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {product.trend === "stable" && <Minus className="w-4 h-4 text-slate-400" />}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {product.trend === "up" && "Trending up"}
                        {product.trend === "down" && "Trending down"}
                        {product.trend === "stable" && "Stable"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(product.monthlyRevenue, 0)}/mo
                    </span>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleRecordSale(e, product.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
                  >
                    <Minus className="w-4 h-4" />
                    Record Sale
                  </button>
                  <button
                    onClick={(e) => handleAddStock(e, product.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add Stock
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No products found</h3>
              <p className="text-slate-600 dark:text-slate-400">Try adjusting your filters</p>
            </motion.div>
          )}
        </>
      )}

      {/* Transactions View */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center"
            >
              <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No transactions yet</h3>
              <p className="text-slate-600 dark:text-slate-400">Record sales or add stock to see activity here</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          txn.action === "sale" 
                            ? "bg-blue-100 dark:bg-blue-900/30" 
                            : "bg-green-100 dark:bg-green-900/30"
                        }`}>
                          {txn.action === "sale" ? (
                            <ShoppingCart className={`w-5 h-5 ${
                              txn.action === "sale" 
                                ? "text-blue-600 dark:text-blue-400" 
                                : "text-green-600 dark:text-green-400"
                            }`} />
                          ) : (
                            <PackagePlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{txn.productName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {txn.action === "sale" ? "Sale Recorded" : "Stock Added"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            txn.action === "sale" 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-green-600 dark:text-green-400"
                          }`}>
                            {txn.action === "sale" ? "-" : "+"}{txn.quantity}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">units</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateTime(txn.timestamp)}</span>
                          </div>
                          {txn.price && txn.price > 0 && (
                            <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                              <span className="font-medium">{formatCurrency(txn.price)}</span>
                            </div>
                          )}
                        </div>
                        {txn.supplier && (
                          <div className="text-slate-600 dark:text-slate-400 text-xs">
                            Supplier: {txn.supplier}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <>
          <RecordSaleModal
            isOpen={saleModalOpen}
            onClose={() => {
              setSaleModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onRecordSale={onRecordSale}
          />
          <AddStockModal
            isOpen={stockModalOpen}
            onClose={() => {
              setStockModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onAddStock={onAddStock}
          />
        </>
      )}
    </div>
  );
}

