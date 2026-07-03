const { z } = require("zod");

const inventoryItemBody = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  type: z.string().trim().min(1, "Item type is required").max(60, "Item type must be 60 characters or less").default("service"),
  unit: z.string().optional().default("pcs"),
  defaultPrice: z.coerce.number().min(0, "Default price must be 0 or more").default(0),
  stockQty: z.coerce.number().min(0, "Stock quantity must be 0 or more").default(0),
  lowStockQty: z.coerce.number().min(0, "Low stock quantity must be 0 or more").default(0),
  imageUrl: z.string().optional().default(""),
  imagePublicId: z.string().optional().default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().optional()
});

const createInventoryItemSchema = z.object({
  body: inventoryItemBody,
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

const updateInventoryItemSchema = z.object({
  body: inventoryItemBody.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough()
});

module.exports = {
  createInventoryItemSchema,
  updateInventoryItemSchema
};
