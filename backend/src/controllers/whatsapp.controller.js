const Invoice = require("../models/Invoice.model");
const CompanySetting = require("../models/CompanySetting.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { sendInvoiceWhatsapp } = require("../services/whatsapp.service");

const sendInvoiceByWhatsapp = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.invoiceId || req.params.id);
  if (!invoice || invoice.isDeleted) {
    return errorResponse(res, "Invoice not found", [], 404);
  }
  if (invoice.status === "cancelled" && req.body?.allowCancelled !== true) {
    return errorResponse(res, "Cancelled invoice cannot be sent unless allowCancelled is true", [], 400);
  }

  const company = await CompanySetting.getDefaultSetting();
  const invoiceLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/invoices/${invoice._id}`;

  try {
    const message = await sendInvoiceWhatsapp({ invoice, company, invoiceLink });
    invoice.whatsapp.lastSentAt = new Date();
    invoice.whatsapp.sentCount = (invoice.whatsapp.sentCount || 0) + 1;
    invoice.whatsapp.lastMessageSid = message.sid;
    invoice.whatsapp.lastStatus = message.status || "queued";
    invoice.whatsapp.lastError = "";
    await invoice.save();
    successResponse(res, "WhatsApp invoice message sent", { invoice, messageSid: message.sid, status: message.status });
  } catch (error) {
    invoice.whatsapp.lastError = error.message;
    invoice.whatsapp.lastStatus = "failed";
    await invoice.save();
    errorResponse(res, error.message, [], error.statusCode || 400);
  }
});

module.exports = {
  sendInvoiceByWhatsapp
};
