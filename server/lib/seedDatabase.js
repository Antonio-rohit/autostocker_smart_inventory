import bcrypt from "bcryptjs";
import { Product } from "../models/Product.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { seedProducts, seedTransactions } from "../data/seedData.js";

export const seedDatabase = async () => {
  const existingProducts = await Product.find({}, "sku name");
  const existingSkuSet = new Set(existingProducts.map((product) => product.sku));
  const missingProducts = seedProducts.filter((product) => !existingSkuSet.has(product.sku));

  if (missingProducts.length > 0) {
    await Product.insertMany(missingProducts);
  }

  const transactionCount = await Transaction.countDocuments();
  if (transactionCount === 0) {
    const allProducts = await Product.find({}, "_id sku name");
    const productMap = new Map(allProducts.map((product) => [product.sku, product]));

    await Transaction.insertMany(
      seedTransactions
        .map((transaction) => {
          const product = productMap.get(transaction.sku);
          if (!product) return null;

          return {
            productId: product._id,
            productName: product.name,
            action: transaction.action,
            quantity: transaction.quantity,
            price: transaction.price,
            supplier: transaction.supplier,
            timestamp: transaction.timestamp,
          };
        })
        .filter(Boolean)
    );
  }

  const existingUser = await User.findOne({ email: "admin@smartinventory.in" });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "Admin User",
      email: "admin@smartinventory.in",
      passwordHash,
    });
  }
};
