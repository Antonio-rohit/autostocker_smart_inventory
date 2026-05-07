import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, X } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onDetected: (sku: string) => Promise<void>;
}

const scannerHints = new Map([
  [DecodeHintType.TRY_HARDER, true],
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
    ],
  ],
]);

export function BarcodeScannerModal({ isOpen, title, description, onClose, onDetected }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const resolvingRef = useRef(false);
  const [manualSku, setManualSku] = useState("");
  const [status, setStatus] = useState("Point the camera at a barcode or QR code.");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    resolvingRef.current = false;
  };

  const handleResolvedSku = async (rawValue: string) => {
    const sku = rawValue.trim();
    if (!sku || resolvingRef.current) return;

    resolvingRef.current = true;
    setError("");
    setStatus(`Checking SKU ${sku}...`);
    stopScanner();

    try {
      await onDetected(sku);
    } catch (scanError) {
      resolvingRef.current = false;
      setStatus("Scanner paused. You can retry or enter the SKU manually.");
      setError(scanError instanceof Error ? scanError.message : "Unable to process scanned SKU");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setManualSku("");
      setStatus("Point the camera at a barcode or QR code.");
      setError("");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser. Enter the SKU manually below.");
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      try {
        setStarting(true);
        setError("");
        setStatus("Opening camera...");

        // Explicit barcode hints make 1D labels much more reliable than the default generic setup.
        const reader = new BrowserMultiFormatReader(scannerHints, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500,
        });
        readerRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoRef.current ?? undefined,
          (result, scanError) => {
            if (cancelled || resolvingRef.current) {
              return;
            }

            if (result) {
              void handleResolvedSku(result.getText());
              return;
            }

            if (scanError && scanError.name !== "NotFoundException") {
              setError("Camera is active, but the code could not be read clearly. Try moving slightly farther back for 1D barcodes, improve lighting, or use manual entry.");
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus("Scanning live. Hold the code steady inside the frame. For barcodes, keep a little distance so the full width fits on screen.");
      } catch (cameraError) {
        setError(cameraError instanceof Error ? cameraError.message : "Unable to access the camera.");
        setStatus("Use manual SKU entry below if camera access is unavailable.");
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
          <video ref={videoRef} className="h-[22rem] w-full object-cover" muted playsInline />
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-center gap-2 font-medium">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            <span>{status}</span>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <label className="block text-sm font-medium text-slate-900 dark:text-white">Manual SKU entry</label>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            This fallback keeps billing and inventory usable even if the camera is blocked or the barcode is damaged.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={manualSku}
              onChange={(event) => setManualSku(event.target.value)}
              placeholder="Enter or paste SKU"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => void handleResolvedSku(manualSku)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Camera className="h-4 w-4" />
              Resolve SKU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
