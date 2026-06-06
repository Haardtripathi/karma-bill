const express = require("express");
const controller = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/twilio/status", controller.twilioStatusWebhook);
router.post("/twilio/inbound", controller.twilioInboundWebhook);

module.exports = router;
