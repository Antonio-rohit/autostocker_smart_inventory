import mongoose from "mongoose";

const salesPointSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    month: { type: String, required: true },
    sales: { type: Number, required: true },
    revenue: { type: Number, required: true },
  },
  { _id: false }
);

const demandPointSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    month: { type: String, required: true },
    demand: { type: Number, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    optimalStock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, trim: true },
    salesHistory: { type: [salesPointSchema], default: [] },
    predictedDemand: { type: [demandPointSchema], default: [] },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
