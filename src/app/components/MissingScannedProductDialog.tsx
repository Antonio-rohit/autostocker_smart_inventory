import { AlertCircle, X } from "lucide-react";

interface MissingScannedProductDialogProps {
  isOpen: boolean;
  sku: string;
  onClose: () => void;
  onAddProduct: () => void;
}

export function MissingScannedProductDialog({ isOpen, sku, onClose, onAddProduct }: MissingScannedProductDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Product not found</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                No product is linked to scanned SKU <span className="font-semibold text-slate-900 dark:text-white">{sku}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          The scanner keeps the SKU so the new product form can start with the scanned value instead of asking the user to type it again.
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAddProduct}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Add New Product
          </button>
        </div>
      </div>
    </div>
  );
}
