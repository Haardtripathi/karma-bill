const { z } = require("zod");
const { isValidIndianPhone } = require("../utils/phone.util");

const paymentMode = z.enum(["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"]);

const customerSnapshot = z.object({
  customerId: z.string().optional().or(z.literal("")),
  _id: z.string().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Customer name is required").optional(),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().default(""),
  vehicleNumber: z.string().optional().default(""),
  vehicleKm: z.string().optional().default("")
});

const lineItem = z.object({
  itemId: z.string().optional().or(z.literal("")),
  itemName: z.string().trim().min(1, "Item name is required"),
  hsnSac: z.string().optional().default(""),
  quantity: z.coerce.number().positive("Quantity must be more than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  imageUrl: z.string().optional().default(""),
  imagePublicId: z.string().optional().default(""),
  imageNote: z.string().optional().default("")
});

const payment = z.object({
  amount: z.coerce.number().positive("Payment amount must be more than 0"),
  mode: paymentMode.default("Cash"),
  paymentDate: z.coerce.date().optional(),
  note: z.string().optional().default("")
});

const invoiceObject = z.object({
  customerId: z.string().optional().or(z.literal("")),
  customer: customerSnapshot.optional(),
  invoiceDate: z.coerce.date().optional(),
  lineItems: z.array(lineItem).min(1, "At least one line item is required"),
  discountAmount: z.coerce.number().min(0).default(0),
  receivedAmount: z.coerce.number().min(0).default(0),
  paymentMode: paymentMode.default("Cash"),
  payments: z.array(payment).optional().default([]),
  status: z.enum(["draft", "unpaid", "partial", "paid", "cancelled"]).optional(),
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
