const express = require("express");
const controller = require("../controllers/upload.controller");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/image", upload.single("image"), controller.uploadGeneralImage);
router.post("/invoice-image", upload.single("image"), controller.uploadInvoiceImage);

module.exports = router;
