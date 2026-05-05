import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { getAuthToken } from "../lib/auth";
import type {
  AnalyticsData,
  Bill,
  BootstrapResponse,
  DashboardData,
  NotificationItem,
  Product,
  Recommendation,
  Transaction,
} from "../types";

const APP_SETTINGS_KEY = "smart_inventory_settings";
const ALERT_STATE_KEY = "smart_inventory_alert_state";
const LEGACY_BUSINESS_NAME = "Apex Retail Store";

interface CreateProductPayload {
  name: string;
  category: string;
  price: number;
  stock: number;
  optimalStock: number;
  sku: string;
  imageUrl?: string | null;
}

interface CheckoutPayload {
  items: Array<{ id: string; quantity: number; price: number }>;
  paymentMethod: "manual";
  paymentStatus: "paid" | "unpaid";
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

interface NotificationPreferences {
  lowStock: boolean;
  overstock: boolean;
  demandSpike: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface BusinessInfo {
  businessName: string;
  email: string;
  phone: string;
  website: string;
}

interface AppSettings {
  darkMode: boolean;
  currency: CurrencyCode;
  notifications: NotificationPreferences;
  businessInfo: BusinessInfo;
}

interface AlertState {
  readIds: string[];
  ignoredIds: string[];
}

const defaultSettings: AppSettings = {
  darkMode: false,
  currency: "INR",
  notifications: {
    lowStock: true,
    overstock: true,
    demandSpike: true,
    emailNotifications: true,
    pushNotifications: false,
  },
  businessInfo: {
    businessName: "Akshata Agency",
    email: "akshata.agency@gmail.com",
    phone: "+91 9890383835",
    website: "akshata-agencies.local",
  },
};

const currencyLocaleMap: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

interface AppDataContextValue {
  products: Product[];
  transactions: Transaction[];
  bills: Bill[];
  dashboard: DashboardData | null;
  notifications: NotificationItem[];
  recommendations: Recommendation[];
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createProduct: (payload: CreateProductPayload) => Promise<void>;
  updateProductPrice: (productId: string, price: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addStock: (productId: string, quantity: number, supplier: string, purchasePrice: number) => Promise<void>;
  recordSale: (productId: string, quantity: number, totalPrice: number) => Promise<void>;
  checkout: (payload: CheckoutPayload) => Promise<void>;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateBusinessInfo: (updates: Partial<BusinessInfo>) => void;
  updateNotifications: (updates: Partial<NotificationPreferences>) => void;
  setDarkMode: (enabled: boolean) => void;
  formatCurrency: (value: number, maximumFractionDigits?: number) => string;
  currencyCode: CurrencyCode;
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  ignoreNotification: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const normalizeSettings = (rawSettings: Partial<AppSettings> | null | undefined): AppSettings => {
  const businessInfo = rawSettings?.businessInfo ?? {};
  const legacyBusinessName = businessInfo.businessName === LEGACY_BUSINESS_NAME || !businessInfo.businessName;

  return {
    ...defaultSettings,
    ...rawSettings,
    notifications: {
      ...defaultSettings.notifications,
      ...rawSettings?.notifications,
    },
    businessInfo: {
      ...defaultSettings.businessInfo,
      ...businessInfo,
      businessName: legacyBusinessName ? defaultSettings.businessInfo.businessName : businessInfo.businessName,
      email: !businessInfo.email || businessInfo.email === "admin@apexretail.com" ? defaultSettings.businessInfo.email : businessInfo.email,
      phone: !businessInfo.phone || businessInfo.phone === "+1 (555) 123-4567" ? defaultSettings.businessInfo.phone : businessInfo.phone,
      website: !businessInfo.website || businessInfo.website === "www.apexretail.com" ? defaultSettings.businessInfo.website : businessInfo.website,
    },
  };
};

const loadSettings = (): AppSettings => {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) {
      return defaultSettings;
    }

    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
};

const loadAlertState = (): AlertState => {
  if (typeof window === "undefined") {
    return { readIds: [], ignoredIds: [] };
  }

  try {
    const raw = window.localStorage.getItem(ALERT_STATE_KEY);
    if (!raw) {
      return { readIds: [], ignoredIds: [] };
    }

    const parsed = JSON.parse(raw);
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      ignoredIds: Array.isArray(parsed.ignoredIds) ? parsed.ignoredIds : [],
    };
  } catch {
    return { readIds: [], ignoredIds: [] };
  }
};

const shouldIncludeNotification = (notification: NotificationItem, preferences: NotificationPreferences) => {
  if (notification.id.startsWith("low-") || notification.type === "critical") {
    return preferences.lowStock;
  }

  if (notification.id.startsWith("overstock-")) {
    return preferences.overstock;
  }

  if (notification.id.startsWith("demand-")) {
    return preferences.demandSpike;
  }

  return true;
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [alertState, setAlertState] = useState<AlertState>(loadAlertState);

  useEffect(() => {
    window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(alertState));
  }, [alertState]);

  const refreshData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const bootstrap = await api.getBootstrap();
      setData(bootstrap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const createProduct = useCallback(
    async (payload: CreateProductPayload) => {
      await api.createProduct(payload);
      await refreshData();
    },
    [refreshData]
  );

  const updateProductPrice = useCallback(
    async (productId: string, price: number) => {
      await api.updateProduct(productId, { price });
      await refreshData();
    },
    [refreshData]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      await api.deleteProduct(productId);
      await refreshData();
    },
    [refreshData]
  );

  const addStock = useCallback(
    async (productId: string, quantity: number, supplier: string, purchasePrice: number) => {
      await api.addStock(productId, { quantity, supplier, purchasePrice });
      await refreshData();
    },
    [refreshData]
  );

  const recordSale = useCallback(
    async (productId: string, quantity: number, totalPrice: number) => {
      await api.recordSale(productId, { quantity, totalPrice });
      await refreshData();
    },
    [refreshData]
  );

  const checkout = useCallback(
    async (payload: CheckoutPayload) => {
      await api.checkout(payload);
      await refreshData();
    },
    [refreshData]
  );

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((current) =>
      normalizeSettings({
        ...current,
        ...updates,
        notifications: {
          ...current.notifications,
          ...updates.notifications,
        },
        businessInfo: {
          ...current.businessInfo,
          ...updates.businessInfo,
        },
      })
    );
  }, []);

  const updateBusinessInfo = useCallback((updates: Partial<BusinessInfo>) => {
    setSettings((current) =>
      normalizeSettings({
        ...current,
        businessInfo: {
          ...current.businessInfo,
          ...updates,
        },
      })
    );
  }, []);

  const updateNotifications = useCallback((updates: Partial<NotificationPreferences>) => {
    setSettings((current) =>
      normalizeSettings({
        ...current,
        notifications: {
          ...current.notifications,
          ...updates,
        },
      })
    );
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setSettings((current) =>
      normalizeSettings({
        ...current,
        darkMode: enabled,
      })
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setAlertState((current) => {
      if (current.readIds.includes(id)) {
        return current;
      }

      return {
        ...current,
        readIds: [...current.readIds, id],
      };
    });
  }, []);

  const ignoreNotification = useCallback((id: string) => {
    setAlertState((current) => ({
      readIds: current.readIds.includes(id) ? current.readIds : [...current.readIds, id],
      ignoredIds: current.ignoredIds.includes(id) ? current.ignoredIds : [...current.ignoredIds, id],
    }));
  }, []);

  const formatCurrency = useCallback(
    (value: number, maximumFractionDigits = 2) =>
      new Intl.NumberFormat(currencyLocaleMap[settings.currency], {
        style: "currency",
        currency: settings.currency,
        maximumFractionDigits,
        minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
      }).format(value),
    [settings.currency]
  );

  const visibleNotifications = useMemo(() => {
    const sourceNotifications = data?.notifications ?? [];

    return sourceNotifications
      .filter((notification) => shouldIncludeNotification(notification, settings.notifications))
      .filter((notification) => !alertState.ignoredIds.includes(notification.id))
      .map((notification) => ({
        ...notification,
        isRead: alertState.readIds.includes(notification.id),
      }));
  }, [alertState.ignoredIds, alertState.readIds, data?.notifications, settings.notifications]);

  const unreadNotificationCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.isRead).length,
    [visibleNotifications]
  );

  const derivedDashboard = useMemo(() => {
    if (!data?.dashboard) {
      return null;
    }

    const activeLowStockAlerts = visibleNotifications.filter(
      (notification) => notification.id.startsWith("low-") || notification.type === "critical"
    ).length;

    return {
      ...data.dashboard,
      lowStockAlerts: activeLowStockAlerts,
    };
  }, [data?.dashboard, visibleNotifications]);

  const value = useMemo(
    () => ({
      products: data?.products ?? [],
      transactions: data?.transactions ?? [],
      bills: data?.bills ?? [],
      dashboard: derivedDashboard,
      notifications: visibleNotifications,
      recommendations: data?.recommendations ?? [],
      analytics: data?.analytics ?? null,
      loading,
      error,
      refreshData,
      createProduct,
      updateProductPrice,
      deleteProduct,
      addStock,
      recordSale,
      checkout,
      settings,
      updateSettings,
      updateBusinessInfo,
      updateNotifications,
      setDarkMode,
      formatCurrency,
      currencyCode: settings.currency,
      unreadNotificationCount,
      markNotificationRead,
      ignoreNotification,
    }),
    [
      addStock,
      checkout,
      createProduct,
      data?.analytics,
      data?.bills,
      data?.products,
      data?.recommendations,
      data?.transactions,
      deleteProduct,
      derivedDashboard,
      error,
      formatCurrency,
      ignoreNotification,
      loading,
      markNotificationRead,
      recordSale,
      refreshData,
      setDarkMode,
      settings,
      unreadNotificationCount,
      updateBusinessInfo,
      updateNotifications,
      updateProductPrice,
      updateSettings,
      visibleNotifications,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
