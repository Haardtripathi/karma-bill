const express = require("express");
const controller = require("../controllers/inventoryItem.controller");
const validate = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");
const { createInventoryItemSchema, updateInventoryItemSchema } = require("../validations/inventoryItem.validation");

const router = express.Router();

router.post("/", validate(createInventoryItemSchema), controller.createInventoryItem);
router.get("/", controller.listInventoryItems);
router.get("/:id", controller.getInventoryItemById);
router.put("/:id", validate(updateInventoryItemSchema), controller.updateInventoryItem);
router.delete("/:id", controller.deleteInventoryItem);
router.post("/:id/image", upload.single("image"), controller.uploadInventoryItemImage);

module.exports = router;
