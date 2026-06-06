const express = require("express");
const controller = require("../controllers/invoice.controller");
const validate = require("../middlewares/validate.middleware");
const { createInvoiceSchema, updateInvoiceSchema, addPaymentSchema } = require("../validations/invoice.validation");

const router = express.Router();

router.post("/", validate(createInvoiceSchema), controller.createInvoice);
router.get("/", controller.listInvoices);
router.get("/:id", controller.getInvoiceById);
router.put("/:id", validate(updateInvoiceSchema), controller.updateInvoice);
router.delete("/:id", controller.deleteInvoice);
router.patch("/:id/cancel", controller.cancelInvoice);
router.post("/:id/payments", validate(addPaymentSchema), controller.addPayment);
router.post("/:id/generate-pdf", controller.generatePdf);
router.get("/:id/pdf", controller.streamPdf);
router.get("/:id/print-data", controller.getPrintData);
router.post("/:id/send-whatsapp", controller.sendInvoiceWhatsappController);

module.exports = router;
