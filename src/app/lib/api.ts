import type { BootstrapResponse } from "../types";
import { getAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: () => request<{ user: { id: string; name: string; email: string } }>("/auth/me"),
  getBootstrap: () => request<BootstrapResponse>("/bootstrap"),
  createProduct: (payload: {
    name: string;
    category: string;
    price: number;
    stock: number;
    optimalStock: number;
    sku: string;
    imageUrl?: string | null;
  }) =>
    request<{ id: string }>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (productId: string, payload: { price?: number }) =>
    request<{ ok: boolean }>(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (productId: string) =>
    request<{ ok: boolean }>(`/products/${productId}`, {
      method: "DELETE",
    }),
  addStock: (productId: string, payload: { quantity: number; supplier: string; purchasePrice: number }) =>
    request<{ ok: boolean }>(`/products/${productId}/stock`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recordSale: (productId: string, payload: { quantity: number; totalPrice: number }) =>
    request<{ ok: boolean }>(`/products/${productId}/sales`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  checkout: (payload: {
    items: Array<{ id: string; quantity: number; price: number }>;
    paymentMethod: "manual";
    paymentStatus: "paid" | "unpaid";
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    total: number;
  }) =>
    request<{ ok: boolean }>("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
