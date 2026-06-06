const request = require("supertest");
const app = require("../app");

const payload = { name: "Rahul Patel", phone: "9876543210", vehicleNumber: "GJ01AB1234", address: "Ahmedabad" };

describe("Customer API", () => {
  test("GET /api/health returns success true", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("creates, lists, searches, updates and soft deletes a customer", async () => {
    const created = await request(app).post("/api/customers").send(payload);
    expect(created.statusCode).toBe(201);
    expect(created.body.data.name).toBe(payload.name);

    const list = await request(app).get("/api/customers");
    expect(list.body.data.items).toHaveLength(1);

    const search = await request(app).get("/api/customers?search=Rahul");
    expect(search.body.data.total).toBe(1);

    const updated = await request(app).put(`/api/customers/${created.body.data._id}`).send({ vehicleKm: "20000" });
    expect(updated.body.data.vehicleKm).toBe("20000");

    const deleted = await request(app).delete(`/api/customers/${created.body.data._id}`);
    expect(deleted.body.data.isActive).toBe(false);
  });

  test("rejects customer without name or phone", async () => {
    const noName = await request(app).post("/api/customers").send({ phone: "9876543210" });
    expect(noName.statusCode).toBe(400);

    const noPhone = await request(app).post("/api/customers").send({ name: "Rahul" });
    expect(noPhone.statusCode).toBe(400);
  });
});
