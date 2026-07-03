const InventoryItem = require("../models/InventoryItem.model");
const InventoryItemType = require("../models/InventoryItemType.model");

const DEFAULT_INVENTORY_ITEM_TYPES = ["service", "part", "other"];

const normalizeInventoryItemTypeName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeInventoryItemTypeKey = (value) => normalizeInventoryItemTypeName(value).toLowerCase();

const ensureInventoryItemType = async (name, options = {}) => {
  const normalizedName = normalizeInventoryItemTypeName(name);
  if (!normalizedName) return null;

  const normalizedKey = normalizeInventoryItemTypeKey(normalizedName);
  const setOnInsert = {
    name: normalizedName,
    normalizedName: normalizedKey,
    description: options.description || ""
  };
  const set = {
    isActive: true,
    ...(options.isSystem ? { isSystem: true } : {})
  };

  try {
    return await InventoryItemType.findOneAndUpdate(
      { normalizedName: normalizedKey },
      { $setOnInsert: setOnInsert, $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      return InventoryItemType.findOne({ normalizedName: normalizedKey });
    }
    throw error;
  }
};

const ensureDefaultInventoryItemTypes = async () => {
  await Promise.all(DEFAULT_INVENTORY_ITEM_TYPES.map((type) => ensureInventoryItemType(type, { isSystem: true })));
};

const syncInventoryItemTypesFromItems = async () => {
  const itemTypes = await InventoryItem.distinct("type", { type: { $nin: [null, ""] } });
  await Promise.all(itemTypes.map((type) => ensureInventoryItemType(type)));
};

const ensureInventoryItemTypes = async () => {
  await ensureDefaultInventoryItemTypes();
  await syncInventoryItemTypesFromItems();
};

module.exports = {
  DEFAULT_INVENTORY_ITEM_TYPES,
  ensureDefaultInventoryItemTypes,
  ensureInventoryItemType,
  ensureInventoryItemTypes,
  normalizeInventoryItemTypeKey,
  normalizeInventoryItemTypeName
};
