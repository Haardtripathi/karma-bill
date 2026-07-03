const mongoose = require("mongoose");

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");

const inventoryItemTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

inventoryItemTypeSchema.pre("validate", function setNormalizedName(next) {
  const normalized = normalizeName(this.name);
  this.name = normalized;
  this.normalizedName = normalized.toLowerCase();
  next();
});

inventoryItemTypeSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model("InventoryItemType", inventoryItemTypeSchema);
