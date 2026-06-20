const { z } = require("zod");
const { isValidIndianPhone } = require("../utils/phone.util");

const paymentMode = z.enum(["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"]);
const fuelType = z.enum(["", "Petrol", "Diesel", "Petrol-CNG"]);

const emptyToUndefined = (value) => value === "" || value === null ? undefined : value;
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalYear = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1900).max(2100).optional());
const optionalKilometer = z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional());

const customerSnapshot = z.object({
  customerId: z.string().optional().or(z.literal("")),
  _id: z.string().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Customer name is required").optional(),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Email must be valid").or(z.literal("")).optional(),
  address: z.string().optional().default(""),
  vehicleNumber: z.string().optional().default(""),
  vehicleKm: z.string().optional().default("")
});

const lineItem = z.object({
  itemId: z.string().optional().or(z.literal("")),
  itemName: z.string().trim().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be more than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  imageUrl: z.string().optional().default(""),
  imagePublicId: z.string().optional().default(""),
  imageNote: z.string().optional().default("")
});

const payment = z.object({
  amount: z.coerce.number().positive("Payment amount must be more than 0"),
  mode: paymentMode.default("Cash"),
  paymentDate: optionalDate,
  note: z.string().optional().default("")
});

const invoiceObject = z.object({
  customerId: z.string().optional().or(z.literal("")),
  customer: customerSnapshot.optional(),
  invoiceDate: optionalDate,
  deliveryDate: optionalDate,
  carName: z.string().trim().optional().default(""),
  carBrand: z.string().trim().optional().default(""),
  fuelType: fuelType.optional().default(""),
  yearOfManufacture: optionalYear,
  nextServiceKilometer: optionalKilometer,
  pucExpiryDate: optionalDate,
  insuranceExpiryDate: optionalDate,
  lineItems: z.array(lineItem).min(1, "At least one line item is required"),
  discountAmount: z.coerce.number().min(0).default(0),
  receivedAmount: z.coerce.number().min(0).default(0),
  paymentMode: paymentMode.default("Cash"),
  payments: z.array(payment).optional().default([]),
  status: z.enum(["draft", "unpaid", "partial", "paid", "cancelled"]).optional(),
  remarks: z.string().optional().default(""),
  description: z.string().optional().default(""),
  terms: z.string().optional().default(""),
  mapsLink: z.string().optional().default("")
});

const invoicePhoneRefinement = (value, ctx) => {
  const phone = value.customer?.phone;
  if (phone && !isValidIndianPhone(phone)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customer", "phone"], message: "Customer phone must be a valid Indian number" });
  }
};

const invoiceBody = invoiceObject.superRefine(invoicePhoneRefinement);

const createInvoiceSchema = z.object({
  body: invoiceBody,
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

const updateInvoiceSchema = z.object({
  body: invoiceObject.partial().extend({ lineItems: z.array(lineItem).min(1).optional() }).superRefine(invoicePhoneRefinement),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough()
});

const addPaymentSchema = z.object({
  body: payment,
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough()
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  addPaymentSchema
};
