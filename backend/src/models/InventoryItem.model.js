const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["service", "part", "other"], default: "service" },
    unit: { type: String, trim: true, default: "pcs" },
    defaultPrice: { type: Number, min: 0, default: 0 },
    stockQty: { type: Number, min: 0, default: 0 },
    lowStockQty: { type: Number, min: 0, default: 0 },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

inventoryItemSchema.index({ name: "text", description: "text" });
inventoryItemSchema.index({ type: 1 });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
