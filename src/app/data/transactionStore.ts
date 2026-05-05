// Transaction store for managing stock activity
export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  action: "sale" | "stock_added";
  quantity: number;
  price?: number;
  supplier?: string;
  timestamp: string;
}

class TransactionStore {
  private transactions: Transaction[] = [];
  private listeners: Array<() => void> = [];

  getTransactions(): Transaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  addTransaction(transaction: Omit<Transaction, "id" | "timestamp">) {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.transactions.push(newTransaction);
    this.notifyListeners();
  }

  getTodaysSales(): { count: number; revenue: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = this.transactions.filter((t) => {
      const txDate = new Date(t.timestamp);
      txDate.setHours(0, 0, 0, 0);
      return t.action === "sale" && txDate.getTime() === today.getTime();
    });

    return {
      count: todaySales.reduce((sum, t) => sum + t.quantity, 0),
      revenue: todaySales.reduce((sum, t) => sum + (t.price || 0), 0),
    };
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

export const transactionStore = new TransactionStore();
