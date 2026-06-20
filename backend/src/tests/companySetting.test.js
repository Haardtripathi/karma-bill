const request = require("supertest");
const app = require("../app");

describe("Company settings", () => {
  test("saves payment details used on invoices", async () => {
    const payload = {
      upiId: "karma@upi",
      bankAccountName: "Karma Automobiles",
      bankName: "HDFC Bank",
      bankAccountNumber: "1234567890",
      bankIfsc: "HDFC0001234",
      bankBranch: "Vasna"
    };

    const res = await request(app).put("/api/company-settings").send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject(payload);
  });
});
