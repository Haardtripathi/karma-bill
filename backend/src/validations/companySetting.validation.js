const { z } = require("zod");

const updateCompanySettingSchema = z.object({
  body: z.object({
    businessName: z.string().min(1).optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    mapsLink: z.string().optional(),
    invoiceTitle: z.string().optional(),
    defaultTerms: z.string().optional(),
    defaultPaymentMode: z.enum(["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Other"]).optional(),
    invoicePrefix: z.string().optional(),
    nextInvoiceNumber: z.coerce.number().min(1).optional()
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

module.exports = {
  updateCompanySettingSchema
};
