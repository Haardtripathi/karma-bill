const mongoose = require("mongoose");

const defaultCompanySettings = {
  businessName: "KARMA AUTOMOBILES",
  addressLine1: "Shop-4, Sardar shopping center",
  addressLine2: "Beside Ekta Tower, Vasna barridge road",
  city: "Vasna",
  state: "Gujarat",
  pincode: "380007",
  phone: "7698633516",
  email: "keyurgupta96@gmail.com",
  mapsLink:
    process.env.DEFAULT_GOOGLE_MAPS_LINK ||
    "https://maps.google.com/?q=KARMA+AUTOMOBILES+Vasna+Ahmedabad",
  invoiceTitle: "Tax Invoice",
  defaultTerms: "Thank you for doing business with us.",
  defaultPaymentMode: "Cash",
  upiId: "",
  bankAccountName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  paymentQrUrl: "",
  paymentQrPublicId: "",
  invoicePrefix: process.env.INVOICE_PREFIX !== undefined ? process.env.INVOICE_PREFIX : "KA",
  nextInvoiceNumber: Number(process.env.INVOICE_START_NUMBER || 107),
  isDefault: true
};

const companySettingSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: defaultCompanySettings.businessName },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    addressLine1: { type: String, default: defaultCompanySettings.addressLine1 },
    addressLine2: { type: String, default: defaultCompanySettings.addressLine2 },
    city: { type: String, default: defaultCompanySettings.city },
    state: { type: String, default: defaultCompanySettings.state },
    pincode: { type: String, default: defaultCompanySettings.pincode },
    phone: { type: String, default: defaultCompanySettings.phone },
    email: { type: String, default: defaultCompanySettings.email },
    mapsLink: { type: String, default: defaultCompanySettings.mapsLink },
    invoiceTitle: { type: String, default: defaultCompanySettings.invoiceTitle },
    defaultTerms: { type: String, default: defaultCompanySettings.defaultTerms },
    defaultPaymentMode: { type: String, default: defaultCompanySettings.defaultPaymentMode },
    upiId: { type: String, default: defaultCompanySettings.upiId },
    bankAccountName: { type: String, default: defaultCompanySettings.bankAccountName },
    bankName: { type: String, default: defaultCompanySettings.bankName },
    bankAccountNumber: { type: String, default: defaultCompanySettings.bankAccountNumber },
    bankIfsc: { type: String, default: defaultCompanySettings.bankIfsc },
    bankBranch: { type: String, default: defaultCompanySettings.bankBranch },
    paymentQrUrl: { type: String, default: defaultCompanySettings.paymentQrUrl },
    paymentQrPublicId: { type: String, default: defaultCompanySettings.paymentQrPublicId },
    invoicePrefix: { type: String, default: defaultCompanySettings.invoicePrefix },
    nextInvoiceNumber: { type: Number, default: defaultCompanySettings.nextInvoiceNumber },
    signatureImageUrl: { type: String, default: "" },
    signaturePublicId: { type: String, default: "" },
    isDefault: { type: Boolean, default: true }
  },
  { timestamps: true }
);

companySettingSchema.statics.getDefaultSetting = async function getDefaultSetting() {
  let setting = await this.findOne({ isDefault: true });
  if (!setting) {
    setting = await this.create(defaultCompanySettings);
  }
  return setting;
};

module.exports = mongoose.model("CompanySetting", companySettingSchema);
module.exports.defaultCompanySettings = defaultCompanySettings;
