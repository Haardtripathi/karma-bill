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

  test("creates and filters inventory items with a custom type", async () => {
    const type = await request(app).post("/api/inventory-item-types").send({ name: "accessory" });
    expect(type.statusCode).toBe(201);

    const item = await request(app).post("/api/inventory-items").send({ name: "Seat cover", type: "accessory", defaultPrice: 900 });
    expect(item.statusCode).toBe(201);
    expect(item.body.data.type).toBe("accessory");

    const filtered = await request(app).get("/api/inventory-items?type=accessory");
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].name).toBe("Seat cover");
  });

  test("renames custom types and protects used types from deletion", async () => {
    const created = await request(app).post("/api/inventory-item-types").send({ name: "consumable" });
    const typeId = created.body.data._id;
    await request(app).post("/api/inventory-items").send({ name: "Grease", type: "consumable", defaultPrice: 100 });

    const renamed = await request(app).put(`/api/inventory-item-types/${typeId}`).send({ name: "fluid" });
    expect(renamed.statusCode).toBe(200);
    expect(renamed.body.data.name).toBe("fluid");

    const filtered = await request(app).get("/api/inventory-items?type=fluid");
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].type).toBe("fluid");

    const removeUsed = await request(app).delete(`/api/inventory-item-types/${typeId}`);
    expect(removeUsed.statusCode).toBe(409);

    const unused = await request(app).post("/api/inventory-item-types").send({ name: "temporary" });
    const removeUnused = await request(app).delete(`/api/inventory-item-types/${unused.body.data._id}`);
    expect(removeUnused.statusCode).toBe(200);
  });

  test("rejects negative price and stock", async () => {
    const price = await request(app).post("/api/inventory-items").send({ name: "Bad", defaultPrice: -1 });
    expect(price.statusCode).toBe(400);

    const stock = await request(app).post("/api/inventory-items").send({ name: "Bad stock", type: "part", stockQty: -1 });
    expect(stock.statusCode).toBe(400);
  });
});
