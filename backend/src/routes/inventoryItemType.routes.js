const express = require("express");
const controller = require("../controllers/inventoryItemType.controller");
const validate = require("../middlewares/validate.middleware");
const { createInventoryItemTypeSchema, updateInventoryItemTypeSchema } = require("../validations/inventoryItemType.validation");

const router = express.Router();

router.post("/", validate(createInventoryItemTypeSchema), controller.createInventoryItemType);
router.get("/", controller.listInventoryItemTypes);
router.get("/:id", controller.getInventoryItemTypeById);
router.put("/:id", validate(updateInventoryItemTypeSchema), controller.updateInventoryItemType);
router.delete("/:id", controller.deleteInventoryItemType);

module.exports = router;
