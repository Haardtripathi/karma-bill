const request = require("supertest");
const app = require("../app");
const {
  buildTwilioMessagePayload,
  getBackendInvoicePdfUrl,
  getInvoiceMessageLink,
  isPublicHttpUrl
} = require("../services/whatsapp.service");

const makeInvoice = (phone = "9876543210") =>
  request(app).post("/api/invoices").send({
    customer: { name: "WhatsApp User", phone },
    lineItems: [{ itemName: "Service", quantity: 1, unitPrice: 500 }],
    receivedAmount: 500
  });

const makePayloadInvoice = (overrides = {}) => ({
  invoiceCode: "KA-107",
  grandTotal: 7725,
  balanceAmount: 0,
  mapsLink: "",
  customer: { phone: "9876543210" },
  ...overrides
});

const company = {
  businessName: "KARMA AUTOMOBILES",
  mapsLink: "https://maps.google.com/?q=KARMA+AUTOMOBILES"
};

describe("WhatsApp invoice", () => {
  test("returns readable error if Twilio env is missing", async () => {
    const invoice = await makeInvoice();
    const res = await request(app).post(`/api/invoices/${invoice.body.data._id}/send-whatsapp`).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Twilio credentials are missing");
  });

  test("sends invoice and saves message SID when Twilio is mocked", async () => {
    process.env.TWILIO_ACCOUNT_SID = "test-sid";
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    const invoice = await makeInvoice();
    const res = await request(app).post(`/api/invoices/${invoice.body.data._id}/send-whatsapp`).send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.data.invoice.whatsapp.lastMessageSid).toBe("SM_TEST_INVOICE");
  });

  test("builds Twilio WhatsApp payload with public PDF media and status callback", () => {
    process.env.TWILIO_WHATSAPP_FROM = "+14155238886";
    process.env.SEND_PDF_AS_MEDIA = "true";
    process.env.BACKEND_PUBLIC_URL = "https://billing.example.com";

    const pdfUrl = "https://res.cloudinary.com/demo/raw/upload/karma-automobiles/invoices/KA-107.pdf";
    const backendPdfUrl = "https://billing.example.com/api/invoices/507f1f77bcf86cd799439011/pdf";
    const payload = buildTwilioMessagePayload({
      invoice: makePayloadInvoice({ _id: "507f1f77bcf86cd799439011", pdfUrl }),
      company,
      invoiceLink: "https://app.example.com/invoices/507f1f77bcf86cd799439011"
    });

    expect(payload.from).toBe("whatsapp:+14155238886");
    expect(payload.to).toBe("whatsapp:+919876543210");
    expect(payload.mediaUrl).toEqual([backendPdfUrl]);
    expect(payload.statusCallback).toBe("https://billing.example.com/api/webhooks/twilio/status");
    expect(payload.body).toContain("Sale Invoice : KA-107");
    expect(payload.body).toContain(backendPdfUrl);
  });

  test("does not attach localhost PDF media and keeps the invoice page link in the message", () => {
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    process.env.SEND_PDF_AS_MEDIA = "true";
    process.env.BACKEND_PUBLIC_URL = "http://localhost:5001";

    const invoiceLink = "http://localhost:5173/invoices/507f1f77bcf86cd799439011";
    const payload = buildTwilioMessagePayload({
      invoice: makePayloadInvoice({ pdfUrl: "http://localhost:5001/uploads/invoices/KA-107.pdf" }),
      company,
      invoiceLink
    });

    expect(payload.mediaUrl).toBeUndefined();
    expect(payload.statusCallback).toBeUndefined();
    expect(payload.body).toContain(invoiceLink);
    expect(payload.body).not.toContain("http://localhost:5001/uploads/invoices/KA-107.pdf");
  });

  test("identifies public invoice links before using them in Twilio payloads", () => {
    expect(isPublicHttpUrl("https://res.cloudinary.com/demo/raw/upload/file.pdf")).toBe(true);
    expect(isPublicHttpUrl("http://localhost:5001/uploads/file.pdf")).toBe(false);
    expect(isPublicHttpUrl("http://192.168.1.10/file.pdf")).toBe(false);

    const fallback = "https://app.example.com/invoices/1";
    expect(getInvoiceMessageLink(makePayloadInvoice({ pdfUrl: "http://127.0.0.1/file.pdf" }), fallback)).toBe(fallback);
    process.env.BACKEND_PUBLIC_URL = "https://billing.example.com";
    expect(getBackendInvoicePdfUrl(makePayloadInvoice({ _id: "507f1f77bcf86cd799439011" }))).toBe("https://billing.example.com/api/invoices/507f1f77bcf86cd799439011/pdf");
  });
});
