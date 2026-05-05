// Product store for managing product stock updates
import { products as initialProducts } from "./mockData";

class ProductStore {
  private products = [...initialProducts];
  private listeners: Array<() => void> = [];

  getProducts() {
    return [...this.products];
  }

  getProductById(id: string) {
    return this.products.find((p) => p.id === id);
  }

  updateStock(productId: string, quantityChange: number) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      product.stock += quantityChange;
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const productStore = new ProductStore();
