const InventoryItem = require("../models/InventoryItem.model");
const InventoryItemType = require("../models/InventoryItemType.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const {
  ensureInventoryItemTypes,
  normalizeInventoryItemTypeKey,
  normalizeInventoryItemTypeName
} = require("../services/inventoryItemType.service");

const throwNotFound = () => {
  const error = new Error("Inventory item type not found");
  error.statusCode = 404;
  throw error;
};

const throwDuplicate = (name) => {
  const error = new Error(`Inventory item type "${name}" already exists`);
  error.statusCode = 409;
  throw error;
};

const listInventoryItemTypes = asyncHandler(async (req, res) => {
  await ensureInventoryItemTypes();

  const filter = {};
  if (req.query.status === "active" || !req.query.status) filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ name: regex }, { description: regex }];
  }

  const items = await InventoryItemType.find(filter).sort({ name: 1 });
  successResponse(res, "Inventory item types fetched", { items, total: items.length });
});

const createInventoryItemType = asyncHandler(async (req, res) => {
  const normalizedName = normalizeInventoryItemTypeName(req.validated.body.name);
  const normalizedKey = normalizeInventoryItemTypeKey(normalizedName);
  const existing = await InventoryItemType.findOne({ normalizedName: normalizedKey });

  if (existing?.isActive) {
    throwDuplicate(normalizedName);
  }

  if (existing) {
    existing.name = normalizedName;
    existing.description = req.validated.body.description || "";
    existing.isActive = true;
    await existing.save();
    successResponse(res, "Inventory item type restored", existing);
    return;
  }

  const itemType = await InventoryItemType.create(req.validated.body);
  successResponse(res, "Inventory item type created", itemType, 201);
});

const getInventoryItemTypeById = asyncHandler(async (req, res) => {
  const itemType = await InventoryItemType.findById(req.params.id);
  if (!itemType) throwNotFound();
  successResponse(res, "Inventory item type fetched", itemType);
});

const updateInventoryItemType = asyncHandler(async (req, res) => {
  const itemType = await InventoryItemType.findById(req.params.id);
  if (!itemType) throwNotFound();
  if (itemType.isSystem) {
    const error = new Error("System inventory item types cannot be edited");
    error.statusCode = 400;
    throw error;
  }

  const oldName = itemType.name;
  if (req.validated.body.name !== undefined) {
    const nextName = normalizeInventoryItemTypeName(req.validated.body.name);
    const nextKey = normalizeInventoryItemTypeKey(nextName);
    const duplicate = await InventoryItemType.findOne({ normalizedName: nextKey, _id: { $ne: itemType._id } });
    if (duplicate) throwDuplicate(nextName);
    itemType.name = nextName;
  }
  if (req.validated.body.description !== undefined) itemType.description = req.validated.body.description;
  if (req.validated.body.isActive !== undefined) itemType.isActive = req.validated.body.isActive;

  await itemType.save();

  if (oldName !== itemType.name) {
    await InventoryItem.updateMany({ type: oldName }, { $set: { type: itemType.name } });
  }

  successResponse(res, "Inventory item type updated", itemType);
});

const deleteInventoryItemType = asyncHandler(async (req, res) => {
  const itemType = await InventoryItemType.findById(req.params.id);
  if (!itemType) throwNotFound();
  if (itemType.isSystem) {
    const error = new Error("System inventory item types cannot be deleted");
    error.statusCode = 400;
    throw error;
  }

  const usageCount = await InventoryItem.countDocuments({ type: itemType.name });
  if (usageCount > 0) {
    const error = new Error("Inventory item type is used by inventory items");
    error.statusCode = 409;
    throw error;
  }

  await itemType.deleteOne();
  successResponse(res, "Inventory item type deleted", itemType);
});

module.exports = {
  listInventoryItemTypes,
  createInventoryItemType,
  getInventoryItemTypeById,
  updateInventoryItemType,
  deleteInventoryItemType
};
