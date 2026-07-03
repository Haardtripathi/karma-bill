const { z } = require("zod");

const typeName = z.string().trim().min(1, "Type name is required").max(60, "Type name must be 60 characters or less");

const inventoryItemTypeBody = z.object({
  name: typeName,
  description: z.string().trim().optional().default(""),
  isActive: z.boolean().optional()
});

const createInventoryItemTypeSchema = z.object({
  body: inventoryItemTypeBody,
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

const updateInventoryItemTypeSchema = z.object({
  body: inventoryItemTypeBody.partial(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).passthrough()
});

module.exports = {
  createInventoryItemTypeSchema,
  updateInventoryItemTypeSchema
};
