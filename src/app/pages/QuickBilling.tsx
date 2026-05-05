import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Minus, Trash2, ShoppingCart, ArrowLeft, Tag, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAppData } from "../context/AppDataContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export function QuickBilling() {
  const navigate = useNavigate();
  const { products, checkout, loading, error, formatCurrency } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !cart.find((item) => item.id === product.id)
  );

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.stock === 0) {
      toast.error("Product out of stock");
      return;
    }

    setCart([
      ...cart,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        availableStock: product.stock,
      },
    ]);
    setSearchQuery("");
    setShowSuggestions(false);
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          if (newQuantity > item.availableStock) {
            toast.error("Quantity exceeds available stock");
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    setCart(cart.filter((item) => item.id !== itemId));
    if (item) {
      toast.success(`${item.name} removed from cart`);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setShowPaymentModal(true);
  };

  if (loading && products.length === 0) {
    return <div className="text-slate-600 dark:text-slate-400">Loading products...</div>;
  }

  if (error && products.length === 0) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate("/app")}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Quick Billing</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Fast checkout for your customers</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Search Products</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />

              <AnimatePresence>
                {showSuggestions && searchQuery && filteredProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                  >
                    {filteredProducts.slice(0, 5).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                      >
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Stock: {product.stock}</p>
                        </div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(product.price)}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cart</h2>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                {cart.length} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Your cart is empty</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Search and add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => {
                  const afterSaleStock = item.availableStock - item.quantity;
                  const hasStockWarning = item.quantity > item.availableStock;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        hasStockWarning
                          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(item.price)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-medium text-slate-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.availableStock}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Available: {item.availableStock} | After sale: {afterSaleStock}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-slate-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {hasStockWarning && (
                        <div className="flex items-start gap-2 mt-3 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p className="text-xs">Quantity exceeds available stock</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm sticky top-24"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">Discount (%)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount || ""}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount Applied</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-600 dark:text-slate-400">Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tax || ""}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {tax > 0 && (
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Tax Amount</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={cart.length === 0 || cart.some((item) => item.quantity > item.availableStock)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-blue-500/30"
                >
                  Complete Billing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={total}
          subtotal={subtotal}
          discount={discount}
          discountAmount={discountAmount}
          tax={tax}
          taxAmount={taxAmount}
          cart={cart}
          onCheckout={checkout}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setCart([]);
            setDiscount(0);
            setTax(0);
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}

type BillingStatus = "paid" | "unpaid";

interface PaymentModalProps {
  total: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  taxAmount: number;
  cart: CartItem[];
  onCheckout: (payload: {
    items: Array<{ id: string; quantity: number; price: number }>;
    paymentMethod: "manual";
    paymentStatus: BillingStatus;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    total: number;
  }) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ total, subtotal, discount, discountAmount, tax, taxAmount, cart, onCheckout, onClose, onSuccess }: PaymentModalProps) {
  const { formatCurrency } = useAppData();
  const [selectedStatus, setSelectedStatus] = useState<BillingStatus>("paid");
  const [processing, setProcessing] = useState(false);

  const billingStatuses = [
    { id: "paid", name: "Paid", description: "Stock sold and payment received" },
    { id: "unpaid", name: "Unpaid", description: "Stock sold but payment is pending" },
  ];

  const handleConfirmPayment = async () => {
    setProcessing(true);

    try {
      await onCheckout({
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity, price: item.price })),
        paymentMethod: "manual",
        paymentStatus: selectedStatus,
        subtotal,
        discountPercent: discount,
        discountAmount,
        taxPercent: tax,
        taxAmount,
        total,
      });
      setProcessing(false);
      toast.success(`Bill marked as ${selectedStatus} for ${formatCurrency(total)}.`);
      onSuccess();
    } catch (error) {
      setProcessing(false);
      toast.error(error instanceof Error ? error.message : "Billing update failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Billing Status</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Bill Total</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(total)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Set bill status</p>
            <div className="grid grid-cols-1 gap-3">
              {billingStatuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id as BillingStatus)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedStatus === status.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      selectedStatus === status.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {status.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{status.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={processing}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-green-500/30"
          >
            {processing ? "Saving..." : `Save as ${selectedStatus === "paid" ? "Paid" : "Unpaid"}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


