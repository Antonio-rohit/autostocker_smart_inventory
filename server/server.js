import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { buildBootstrap } from "./lib/buildBootstrap.js";
import { createBillRecord } from "./lib/billing.js";
import { seedDatabase } from "./lib/seedDatabase.js";
import { authenticateToken, signToken } from "./middleware/auth.js";
import { Product } from "./models/Product.js";
import { Transaction } from "./models/Transaction.js";
import { User } from "./models/User.js";
import { Bill } from "./models/Bill.js";

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-inventory";
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeSku = (value) => String(value || "").trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bootstrap", authenticateToken, async (_req, res, next) => {
  try {
    const data = await buildBootstrap();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/lookup", authenticateToken, async (req, res, next) => {
  try {
    const sku = normalizeSku(req.query.sku);
    if (!sku) {
      return res.status(400).json({ message: "SKU is required" });
    }

    const product = await Product.findOne({
      sku: { $regex: `^${escapeRegex(sku)}$`, $options: "i" },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found for scanned SKU" });
    }

    // Reuse bootstrap serialization so the scanner gets the same shape as the rest of the app.
    const data = await buildBootstrap();
    const serializedProduct = data.products.find((item) => item.id === product._id.toString());

    if (!serializedProduct) {
      return res.status(404).json({ message: "Product could not be prepared for response" });
    }

    res.json({ product: serializedProduct });
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      optimalStock: Number(req.body.optimalStock),
      sku: req.body.sku,
      imageUrl: typeof req.body.imageUrl === "string" ? req.body.imageUrl : undefined,
      salesHistory: [],
      predictedDemand: [],
    });

    res.status(201).json({ id: product._id.toString() });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/products/:id", authenticateToken, async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.price !== undefined) {
      updates.price = Number(req.body.price);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (updates.price !== undefined) {
      if (Number.isNaN(updates.price) || updates.price < 0) {
        return res.status(400).json({ message: "Price must be a valid positive number" });
      }
      product.price = updates.price;
    }

    await product.save();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", authenticateToken, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedTransactions = await Transaction.find({ productId: product._id }, "_id");
    const relatedTransactionIds = relatedTransactions.map((transaction) => transaction._id);

    if (relatedTransactionIds.length > 0) {
      await Bill.updateMany(
        { transactionIds: { $in: relatedTransactionIds } },
        {
          $pull: {
            transactionIds: { $in: relatedTransactionIds },
            items: { productId: product._id },
          },
        }
      );

      await Transaction.deleteMany({ _id: { $in: relatedTransactionIds } });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/products/:id/stock", authenticateToken, async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    const supplier = req.body.supplier?.trim();
    const purchasePrice = Number(req.body.purchasePrice ?? 0);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock += quantity;
    await product.save();

    await Transaction.create({
      productId: product._id,
      productName: product.name,
      action: "stock_added",
      quantity,
      price: purchasePrice,
      supplier,
      timestamp: new Date(),
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/products/:id/sales", authenticateToken, async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    const totalPrice = Number(req.body.totalPrice);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.stock -= quantity;
    await product.save();

    const transaction = await Transaction.create({
      productId: product._id,
      productName: product.name,
      action: "sale",
      quantity,
      price: totalPrice,
      timestamp: new Date(),
    });

    await createBillRecord({
      paymentMethod: "manual",
      paymentStatus: "paid",
      subtotal: totalPrice,
      total: totalPrice,
      items: [
        {
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice: Number((totalPrice / quantity).toFixed(2)),
          lineTotal: totalPrice,
        },
      ],
      transactionIds: [transaction._id],
      issuedAt: new Date(),
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/checkout", authenticateToken, async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const paymentMethod = "manual";
    const paymentStatus = req.body.paymentStatus === "unpaid" ? "unpaid" : "paid";
    const subtotal = Number(req.body.subtotal ?? 0);
    const discountPercent = Number(req.body.discountPercent ?? 0);
    const discountAmount = Number(req.body.discountAmount ?? 0);
    const taxPercent = Number(req.body.taxPercent ?? 0);
    const taxAmount = Number(req.body.taxAmount ?? 0);
    const total = Number(req.body.total ?? subtotal - discountAmount + taxAmount);
    const transactionIds = [];
    const billItems = [];

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.id} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    for (const item of items) {
      const product = await Product.findById(item.id);
      product.stock -= Number(item.quantity);
      await product.save();

      const lineTotal = Number(item.price) * Number(item.quantity);
      const transaction = await Transaction.create({
        productId: product._id,
        productName: product.name,
        action: "sale",
        quantity: Number(item.quantity),
        price: lineTotal,
        timestamp: new Date(),
      });

      transactionIds.push(transaction._id);
      billItems.push({
        productId: product._id,
        productName: product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.price),
        lineTotal,
      });
    }

    await createBillRecord({
      paymentMethod,
      paymentStatus,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      total,
      items: billItems,
      transactionIds,
      issuedAt: new Date(),
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: "A record with this value already exists" });
  }

  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const start = async () => {
  await mongoose.connect(mongoUri);
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
