const express = require("express");
const { sendInvoiceByWhatsapp } = require("../controllers/whatsapp.controller");

const router = express.Router();

router.post("/send-invoice/:invoiceId", sendInvoiceByWhatsapp);

module.exports = router;
