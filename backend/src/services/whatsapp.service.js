const { getTwilioClient, isTwilioConfigured } = require("../config/twilio");
const { normalizeWhatsAppPhone } = require("../utils/phone.util");
const { formatCurrency } = require("../utils/currency.util");

const isPublicHttpUrl = (value) => {
  try {
    const url = new URL(value || "");
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase();
    if (["localhost", "0.0.0.0", "127.0.0.1", "::1"].includes(hostname)) return false;
    if (/^127\./.test(hostname)) return false;
    if (/^10\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return false;

    return true;
  } catch (error) {
    return false;
  }
};

const getBackendInvoicePdfUrl = (invoice) => {
  if (!invoice?._id || !process.env.BACKEND_PUBLIC_URL) return "";
  const candidate = `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/api/invoices/${invoice._id}/pdf`;
  return isPublicHttpUrl(candidate) ? candidate : "";
};

const getInvoiceMessageLink = (invoice, invoiceLink) => getBackendInvoicePdfUrl(invoice) || invoiceLink;

const getStatusCallbackUrl = () => {
  const explicit = process.env.TWILIO_STATUS_CALLBACK_URL;
  const base = process.env.BACKEND_PUBLIC_URL;
  const candidate = explicit || (base ? `${base.replace(/\/$/, "")}/api/webhooks/twilio/status` : "");
  return isPublicHttpUrl(candidate) ? candidate : "";
};

const buildInvoiceMessage = ({ invoice, company, invoiceLink }) => {
  const companyName = company?.businessName || "KARMA AUTOMOBILES";
  const location = invoice?.mapsLink || company?.mapsLink || process.env.DEFAULT_GOOGLE_MAPS_LINK || "";
  
  return `Greetings from ${companyName}
We are pleased to have you as a valuable customer. Please find the details of your transaction.

Sale Invoice : ${invoice.invoiceCode}
Invoice Amount: ${formatCurrency(invoice.grandTotal)}
Balance: ${formatCurrency(invoice.balanceAmount)}

Thanks for doing business with us.
Regards,
${companyName}

Invoice Link:
${getInvoiceMessageLink(invoice, invoiceLink)}

Location:
${location}`;
};

const buildTwilioMessagePayload = ({ invoice, company, invoiceLink }) => {
  const to = normalizeWhatsAppPhone(invoice.customer?.phone);
  if (!to) {
    const error = new Error("Customer phone is not a valid WhatsApp number");
    error.statusCode = 400;
    throw error;
  }

  const from = normalizeWhatsAppPhone(process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886");
  if (!from) {
    const error = new Error("TWILIO_WHATSAPP_FROM must be a WhatsApp E.164 sender such as whatsapp:+14155238886.");
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    from,
    to,
    body: buildInvoiceMessage({ invoice, company, invoiceLink })
  };

  console.log("TWILIO DEBUG - FROM:", from);
  console.log("TWILIO DEBUG - TO:", to);

  const mediaPdfUrl = getBackendInvoicePdfUrl(invoice) || (isPublicHttpUrl(invoice.pdfUrl) ? invoice.pdfUrl : "");
  if (process.env.SEND_PDF_AS_MEDIA === "true" && mediaPdfUrl) {
    payload.mediaUrl = [mediaPdfUrl];
  }

  const statusCallback = getStatusCallbackUrl();
  if (statusCallback) {
    payload.statusCallback = statusCallback;
  }

  return payload;
};

const sendInvoiceWhatsapp = async ({ invoice, company, invoiceLink }) => {
  if (!invoice.customer?.phone) {
    const error = new Error("Customer phone is required to send WhatsApp message");
    error.statusCode = 400;
    throw error;
  }

  if (!isTwilioConfigured()) {
    const error = new Error("Twilio credentials are missing. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend .env.");
    error.statusCode = 400;
    throw error;
  }

  const payload = buildTwilioMessagePayload({ invoice, company, invoiceLink });

  if (process.env.NODE_ENV === "test" && process.env.TWILIO_ACCOUNT_SID === "test-sid") {
    return { sid: "SM_TEST_INVOICE", status: "queued", body: payload.body, payload };
  }

  const client = getTwilioClient();
  return client.messages.create(payload);
};

module.exports = {
  buildInvoiceMessage,
  buildTwilioMessagePayload,
  getBackendInvoicePdfUrl,
  getInvoiceMessageLink,
  getStatusCallbackUrl,
  isPublicHttpUrl,
  sendInvoiceWhatsapp
};
