const Invoice = require("../models/Invoice.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const twilioStatusWebhook = asyncHandler(async (req, res) => {
  const { MessageSid, SmsSid, MessageStatus, SmsStatus, ErrorCode, ErrorMessage } = req.body;
  const sid = MessageSid || SmsSid;
  const status = MessageStatus || SmsStatus;

  if (!sid) {
    return errorResponse(res, "Missing MessageSid", [], 400);
  }

  // Find invoice with this message SID
  const invoice = await Invoice.findOne({ "whatsapp.lastMessageSid": sid });
  if (!invoice) {
    // Return success to Twilio since retrying is unnecessary if invoice doesn't exist
    return successResponse(res, "Invoice not found for this MessageSid", { found: false });
  }

  // Update status
  invoice.whatsapp.lastStatus = status || "unknown";
  
  if (status === "failed" || status === "undelivered" || ErrorCode) {
    invoice.whatsapp.lastError = ErrorMessage || `Error Code: ${ErrorCode || "unknown"}`;
  } else {
    invoice.whatsapp.lastError = "";
  }

  await invoice.save();
  successResponse(res, "Twilio status webhook received and updated", { 
    received: true, 
    invoiceId: invoice._id, 
    status 
  });
});

const twilioInboundWebhook = asyncHandler(async (req, res) => {
  // Return a valid empty TwiML response to indicate we received the inbound message
  res.type("text/xml");
  res.send("<Response></Response>");
});

module.exports = {
  twilioStatusWebhook,
  twilioInboundWebhook
};
