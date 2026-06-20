const express = require("express");
const controller = require("../controllers/companySetting.controller");
const validate = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");
const { updateCompanySettingSchema } = require("../validations/companySetting.validation");

const router = express.Router();

router.get("/", controller.getCompanySettings);
router.put("/", validate(updateCompanySettingSchema), controller.updateCompanySettings);
router.post("/logo", upload.single("image"), controller.uploadCompanyLogo);
router.post("/signature", upload.single("image"), controller.uploadCompanySignature);
router.post("/payment-qr", upload.single("image"), controller.uploadCompanyPaymentQr);

module.exports = router;
