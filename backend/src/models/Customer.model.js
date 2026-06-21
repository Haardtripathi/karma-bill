const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    vehicleNumber: { type: String, trim: true, uppercase: true, default: "" },
    vehicleKm: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 });
customerSchema.index({ name: "text", phone: "text", vehicleNumber: "text" });

module.exports = mongoose.model("Customer", customerSchema);
