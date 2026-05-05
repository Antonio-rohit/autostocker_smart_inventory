import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    action: {
      type: String,
      enum: ["sale", "stock_added"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, min: 0 },
    supplier: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
