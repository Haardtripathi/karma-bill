const mongoose = require("mongoose");

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    vehicleNumber: { type: String, trim: true, default: "" },
    vehicleKm: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const lineItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
    itemName: { type: String, required: true, trim: true },
    hsnSac: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    imageNote: { type: String, default: "" }
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    mode: { type: String, default: "Cash" },
    paymentDate: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: Number, required: true, unique: true },
    invoiceCode: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now },
    customer: { type: customerSnapshotSchema, required: true },
    lineItems: { type: [lineItemSchema], validate: (items) => items.length > 0 },
    subTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    receivedAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"],
      default: "Cash"
    },
    payments: { type: [paymentSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "unpaid", "partial", "paid", "cancelled"],
      default: "unpaid"
    },
    description: { type: String, default: "" },
    terms: { type: String, default: "Thank you for doing business with us." },
    mapsLink: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    pdfPublicId: { type: String, default: "" },
    lastPdfGeneratedAt: { type: Date },
    whatsapp: {
      lastSentAt: { type: Date },
      sentCount: { type: Number, default: 0 },
      lastMessageSid: { type: String, default: "" },
      lastStatus: { type: String, default: "" },
      lastError: { type: String, default: "" }
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

invoiceSchema.index({ "customer.name": "text", "customer.phone": "text", "customer.vehicleNumber": "text", invoiceCode: "text" });
invoiceSchema.index({ status: 1, invoiceDate: -1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
