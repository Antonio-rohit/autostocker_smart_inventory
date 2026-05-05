import { Bill } from "../models/Bill.js";

const roundCurrency = (value) => Number(value.toFixed(2));

export const createBillNumber = () =>
  `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const createBillRecord = async ({
  paymentMethod = "manual",
  paymentStatus = "paid",
  subtotal,
  discountPercent = 0,
  discountAmount = 0,
  taxPercent = 0,
  taxAmount = 0,
  total,
  items,
  transactionIds,
  issuedAt = new Date(),
}) =>
  Bill.create({
    billNumber: createBillNumber(),
    paymentMethod,
    paymentStatus,
    subtotal: roundCurrency(subtotal),
    discountPercent,
    discountAmount: roundCurrency(discountAmount),
    taxPercent,
    taxAmount: roundCurrency(taxAmount),
    total: roundCurrency(total),
    items,
    transactionIds,
    issuedAt,
  });
