import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Package, DollarSign, Hash, Tag, Save, X, Camera, Upload, ScanLine } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "../components/BarcodeScannerModal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAppData } from "../context/AppDataContext";

const CUSTOM_CATEGORY_KEY = "smart_inventory_custom_categories";
const ADD_NEW_CATEGORY_VALUE = "__add_new_category__";

type CameraMode = "photo" | "sku" | null;

export function AddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createProduct, currencyCode, formatCurrency, products } = useAppData();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    optimalStock: "",
    sku: "",
    imageUrl: "",
  });
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [skuScannerOpen, setSkuScannerOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(CUSTOM_CATEGORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  const categories = Array.from(
    new Set([
      "Detergent Products",
      "Confectionery & Gift Items",
      "Personal Care",
      ...products.map((product) => product.category),
      ...customCategories,
    ])
  ).sort((a, b) => a.localeCompare(b));

  const resolvedCategory = formData.category === ADD_NEW_CATEGORY_VALUE ? newCategoryName.trim() : formData.category;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => {
    if (cameraMode !== "photo") {
      stopCamera();
      setCameraError("");
      return;
    }

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (_error) {
        setCameraError("Unable to access camera. Please allow camera permission and try again.");
        setCameraReady(false);
      }
    };

    void startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraMode]);

  useEffect(() => {
    const prefillSku = typeof location.state === "object" && location.state && "prefillSku" in location.state
      ? String((location.state as { prefillSku?: string }).prefillSku || "").trim()
      : "";

    if (!prefillSku) {
      return;
    }

    // Preserve manual edits so revisiting this screen from history or navigation does not overwrite user input.
    setFormData((current) => (current.sku ? current : { ...current, sku: prefillSku }));
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedCategory) {
      toast.error("Please select or enter a category");
      return;
    }

    if (formData.category === ADD_NEW_CATEGORY_VALUE) {
      const updatedCategories = Array.from(new Set([...customCategories, resolvedCategory])).sort((a, b) => a.localeCompare(b));
      setCustomCategories(updatedCategories);
      window.localStorage.setItem(CUSTOM_CATEGORY_KEY, JSON.stringify(updatedCategories));
    }

    await createProduct({
      name: formData.name,
      category: resolvedCategory,
      price: Number(formData.price),
      stock: Number(formData.stock),
      optimalStock: Number(formData.optimalStock),
      sku: formData.sku,
      imageUrl: formData.imageUrl || null,
    });
    toast.success("Product added successfully");
    navigate("/app/inventory");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((current) => ({ ...current, category: value }));
    if (value !== ADD_NEW_CATEGORY_VALUE) {
      setNewCategoryName("");
    }
  };

  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        imageUrl: typeof reader.result === "string" ? reader.result : current.imageUrl,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openPhotoCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera access is not supported in this browser.");
      return;
    }

    setCameraMode("photo");
  };

  const openSkuScanner = () => {
    setSkuScannerOpen(true);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.92);
    setFormData((current) => ({ ...current, imageUrl }));
    setCameraMode(null);
    toast.success("Photo captured successfully");
  };

  const clearImage = () => {
    setFormData((current) => ({ ...current, imageUrl: "" }));
  };

  const handleSkuDetected = async (sku: string) => {
    setFormData((current) => ({ ...current, sku }));
    setSkuScannerOpen(false);
    toast.success(`SKU captured: ${sku}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Enter product details to add to your inventory</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Product Name *</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Kit-Kat"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Category *</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value={ADD_NEW_CATEGORY_VALUE}>Add new category</option>
              </select>
            </div>
            {formData.category === ADD_NEW_CATEGORY_VALUE && (
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Product Photo</label>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900">
              {formData.imageUrl ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                    <ImageWithFallback
                      src={formData.imageUrl}
                      alt={formData.name || "Product preview"}
                      className="h-48 w-full object-contain p-3"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Upload a product image or take a photo to make products easier to recognize in inventory.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={openPhotoCamera}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelection}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Price (INR/{currencyCode}) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">SKU *</label>
              <div className="space-y-3">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g., WBH-001"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={openSkuScanner}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ScanLine className="h-4 w-4" />
                  Capture SKU with Camera
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use the camera to scan a barcode or QR code and fill the SKU automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Current Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Optimal Stock Level *</label>
              <input
                type="number"
                name="optimalStock"
                value={formData.optimalStock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Tip:</strong> The optimal stock level helps the system detect when a product should be restocked.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
            >
              <Save className="w-5 h-5" />
              Save Product
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("/app/inventory")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>

      {(formData.name || formData.price || formData.stock) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Preview</h3>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            {formData.imageUrl && (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <ImageWithFallback
                  src={formData.imageUrl}
                  alt={formData.name || "Product preview"}
                  className="h-44 w-full object-contain p-3"
                />
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">{formData.name || "Product Name"}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{resolvedCategory || "Category"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Price</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(formData.price || 0))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">SKU</p>
                <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">{formData.sku || "SKU-000"}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Stock Level</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formData.stock || 0} / {formData.optimalStock || 0}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {cameraMode === "photo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Take Product Photo</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Use your camera to capture the product directly.</p>
              </div>
              <button
                type="button"
                onClick={() => setCameraMode(null)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
              <video ref={videoRef} className="h-[22rem] w-full object-cover" autoPlay playsInline muted />
            </div>

            {cameraError && (
              <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{cameraError}</p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCameraMode(null)}
                className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={skuScannerOpen}
        title="Capture SKU"
        description="Scan the product barcode or QR code to fill the SKU automatically for this new product."
        onClose={() => setSkuScannerOpen(false)}
        onDetected={handleSkuDetected}
      />
    </div>
  );
}
