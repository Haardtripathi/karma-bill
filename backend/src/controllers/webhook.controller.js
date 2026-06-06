const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const twilioStatusWebhook = asyncHandler(async (req, res) => {
  successResponse(res, "Twilio status webhook received", { received: true });
});

const twilioInboundWebhook = asyncHandler(async (req, res) => {
  successResponse(res, "Twilio inbound webhook received", { received: true });
});

module.exports = {
  twilioStatusWebhook,
  twilioInboundWebhook
};
