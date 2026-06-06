const request = require("supertest");
const app = require("../app");
const Invoice = require("../models/Invoice.model");

const createTestInvoice = async (messageSid) => {
  return Invoice.create({
    invoiceNumber: 1001,
    invoiceCode: "KA-1001",
    customer: {
      name: "Webhook Test User",
      phone: "9876543210"
    },
    lineItems: [
      {
        itemName: "Service A",
        quantity: 2,
        unitPrice: 150,
        amount: 300
      }
    ],
    subTotal: 300,
    grandTotal: 300,
    balanceAmount: 300,
    whatsapp: {
      lastMessageSid: messageSid,
      lastStatus: "queued",
      sentCount: 1,
      lastSentAt: new Date()
    }
  });
};

describe("Twilio Webhooks", () => {
  describe("POST /api/webhooks/twilio/status", () => {
    test("returns 400 if MessageSid and SmsSid are missing", async () => {
      const res = await request(app)
        .post("/api/webhooks/twilio/status")
        .send({ MessageStatus: "delivered" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Missing MessageSid");
    });

    test("returns 200 and sets found: false if no invoice matches the SID", async () => {
      const res = await request(app)
        .post("/api/webhooks/twilio/status")
        .send({ MessageSid: "SM_UNKNOWN_SID", MessageStatus: "delivered" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.found).toBe(false);
    });

    test("updates invoice status to delivered when status is successful", async () => {
      const sid = "SM_SUCCESS_123";
      const invoice = await createTestInvoice(sid);

      const res = await request(app)
        .post("/api/webhooks/twilio/status")
        .send({ MessageSid: sid, MessageStatus: "delivered" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.received).toBe(true);

      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.whatsapp.lastStatus).toBe("delivered");
      expect(updatedInvoice.whatsapp.lastError).toBe("");
    });

    test("updates invoice lastStatus and records error when status is failed", async () => {
      const sid = "SM_FAILED_123";
      const invoice = await createTestInvoice(sid);

      const res = await request(app)
        .post("/api/webhooks/twilio/status")
        .send({
          MessageSid: sid,
          MessageStatus: "failed",
          ErrorCode: "63007",
          ErrorMessage: "Channel Sandbox Limit Exceeded"
        });

      expect(res.statusCode).toBe(200);

      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.whatsapp.lastStatus).toBe("failed");
      expect(updatedInvoice.whatsapp.lastError).toBe("Channel Sandbox Limit Exceeded");
    });

    test("supports SmsSid and SmsStatus parameters", async () => {
      const sid = "SM_SMS_123";
      const invoice = await createTestInvoice(sid);

      const res = await request(app)
        .post("/api/webhooks/twilio/status")
        .send({ SmsSid: sid, SmsStatus: "read" });

      expect(res.statusCode).toBe(200);

      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.whatsapp.lastStatus).toBe("read");
    });
  });

  describe("POST /api/webhooks/twilio/inbound", () => {
    test("returns empty XML TwiML response", async () => {
      const res = await request(app)
        .post("/api/webhooks/twilio/inbound")
        .send({ Body: "Hello" });

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/xml");
      expect(res.text).toBe("<Response></Response>");
    });
  });
});
