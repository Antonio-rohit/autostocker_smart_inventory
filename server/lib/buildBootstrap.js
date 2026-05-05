import { Product } from "../models/Product.js";
import { Transaction } from "../models/Transaction.js";
import { Bill } from "../models/Bill.js";
import {
  buildAnalytics,
  buildDashboard,
  buildNotifications,
  buildRecommendations,
  serializeBill,
  serializeProduct,
  serializeTransaction,
} from "./derivedData.js";

export const buildBootstrap = async () => {
  const [productDocs, transactionDocs, billDocs] = await Promise.all([
    Product.find().sort({ createdAt: 1 }),
    Transaction.find().sort({ timestamp: -1 }),
    Bill.find().sort({ issuedAt: -1 }),
  ]);

  const transactionsByProductId = transactionDocs.reduce((map, transaction) => {
    const productId = transaction.productId.toString();
    const current = map.get(productId) ?? [];
    current.push(transaction);
    map.set(productId, current);
    return map;
  }, new Map());

  const products = productDocs.map((product) => serializeProduct(product, transactionsByProductId.get(product._id.toString()) ?? []));
  const transactions = transactionDocs.map(serializeTransaction);
  const bills = billDocs.map(serializeBill);
  const analytics = buildAnalytics(products, transactions);
  const dashboard = buildDashboard(products, transactions, analytics);

  return {
    products,
    transactions,
    bills,
    dashboard,
    notifications: buildNotifications(products),
    recommendations: buildRecommendations(products),
    analytics,
  };
};
