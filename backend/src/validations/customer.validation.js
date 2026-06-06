const { z } = require("zod");
const { isValidIndianPhone } = require("../utils/phone.util");

const customerBody = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().min(1, "Phone is required").refine(isValidIndianPhone, "Phone must be a valid Indian 10 digit or +91 number"),
  email: z.string().trim().email("Email must be valid").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  vehicleNumber: z.string().optional().default(""),
  vehicleKm: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  isActive: z.boolean().optional()
});

const createCustomerSchema = z.object({
  body: customerBody,
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

const updateCustomerSchema = z.object({
  body: customerBody.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough()
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};
