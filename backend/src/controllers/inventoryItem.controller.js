const InventoryItem = require("../models/InventoryItem.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { uploadImage } = require("../services/cloudinary.service");

const listInventoryItems = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const filter = {};

  if (req.query.status === "active" || !req.query.status) filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ name: regex }, { hsnSac: regex }, { description: regex }];
  }

  const [items, total] = await Promise.all([
    InventoryItem.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    InventoryItem.countDocuments(filter)
  ]);

  successResponse(res, "Inventory items fetched", { items, total, page, limit, pages: Math.ceil(total / limit) });
});

const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.create(req.validated.body);
  successResponse(res, "Inventory item created", item, 201);
});

const getInventoryItemById = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Inventory item fetched", item);
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.validated.body, { new: true, runValidators: true });
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Inventory item updated", item);
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Inventory item deactivated", item);
});

const uploadInventoryItemImage = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    const error = new Error("Inventory item not found");
    error.statusCode = 404;
    throw error;
  }
  const uploaded = await uploadImage(req.file, "items");
  item.imageUrl = uploaded.url;
  item.imagePublicId = uploaded.publicId;
  await item.save();
  successResponse(res, "Inventory item image uploaded", item);
});

module.exports = {
  listInventoryItems,
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  uploadInventoryItemImage
};
