const request = require("supertest");
const app = require("../app");

describe("Inventory item API", () => {
  test("creates service and part items and filters by type", async () => {
    await request(app).post("/api/inventory-items").send({ name: "Wheel alignment", type: "service", defaultPrice: 800 });
    await request(app).post("/api/inventory-items").send({ name: "Oil filter", type: "part", defaultPrice: 150, stockQty: 5 });

    const parts = await request(app).get("/api/inventory-items?type=part");
    expect(parts.body.data.items).toHaveLength(1);
    expect(parts.body.data.items[0].name).toBe("Oil filter");
  });

  test("rejects negative price and stock", async () => {
    const price = await request(app).post("/api/inventory-items").send({ name: "Bad", defaultPrice: -1 });
    expect(price.statusCode).toBe(400);

    const stock = await request(app).post("/api/inventory-items").send({ name: "Bad stock", type: "part", stockQty: -1 });
    expect(stock.statusCode).toBe(400);
  });
});
