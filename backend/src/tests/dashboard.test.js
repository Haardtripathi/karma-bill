const request = require("supertest");
const app = require("../app");

describe("Dashboard summary", () => {
  test("returns confirmed totals separately from draft invoices", async () => {
    await request(app).post("/api/invoices").send({
      customer: { name: "Paid Customer", phone: "9876543210" },
      lineItems: [{ itemName: "Service", quantity: 1, unitPrice: 500 }],
      receivedAmount: 500
    });
    await request(app).post("/api/invoices").send({
      customer: { name: "Unpaid Customer", phone: "9876543211" },
      lineItems: [{ itemName: "Service", quantity: 1, unitPrice: 800 }]
    });
    await request(app).post("/api/invoices").send({
      customer: { name: "Draft Customer", phone: "9876543212" },
      lineItems: [{ itemName: "Draft Work", quantity: 1, unitPrice: 1200 }],
      status: "draft"
    });

    const res = await request(app).get("/api/dashboard/summary");
    expect(res.body.data.totalInvoices).toBe(3);
    expect(res.body.data.confirmedInvoices).toBe(2);
    expect(res.body.data.paidInvoices).toBe(1);
    expect(res.body.data.unpaidInvoices).toBe(1);
    expect(res.body.data.draftInvoices).toBe(1);
    expect(res.body.data.totalSales).toBe(1300);
    expect(res.body.data.totalBalance).toBe(800);
    expect(res.body.data.draftAmount).toBe(1200);
    expect(res.body.data.recentInvoices).toHaveLength(3);
  });
});
