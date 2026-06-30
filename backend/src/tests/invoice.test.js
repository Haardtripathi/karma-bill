const request = require("supertest");
const app = require("../app");
const CompanySetting = require("../models/CompanySetting.model");

const customer = { name: "Kiran Shah", phone: "9876543210", vehicleNumber: "gj01zz1111", vehicleKm: "45000" };

const createInvoice = () =>
  request(app).post("/api/invoices").send({
    customer,
    lineItems: [{ itemName: "PETROL AND CNG SERVICE WITH WASHING", quantity: 1, unitPrice: 1250 }],
    invoiceDate: "2026-06-20T09:15:00.000Z",
    deliveryDate: "2026-06-21T13:30:00.000Z",
    carName: "City",
    carBrand: "Honda",
    fuelType: "Petrol-CNG",
    yearOfManufacture: 2021,
    nextServiceKilometer: 50000,
    pucExpiryDate: "2026-12-31T00:00:00.000Z",
    insuranceExpiryDate: "2027-01-31T00:00:00.000Z",
    paymentMode: "Cash",
    receivedAmount: 250,
    remarks: "Next service after 5000 KM"
  });

describe("Invoice API", () => {
  test("creates invoice with customer snapshot and KA-107 code", async () => {
    const res = await createInvoice();
    expect(res.statusCode).toBe(201);
    expect(res.body.data.invoiceCode).toBe("KA-107");
    expect(res.body.data.customer.name).toBe(customer.name);
    expect(res.body.data.customer.vehicleNumber).toBe("GJ01ZZ1111");
    expect(res.body.data.carName).toBe("City");
    expect(res.body.data.carBrand).toBe("Honda");
    expect(res.body.data.fuelType).toBe("Petrol-CNG");
    expect(res.body.data.yearOfManufacture).toBe(2021);
    expect(res.body.data.nextServiceKilometer).toBe(50000);
    expect(res.body.data.remarks).toBe("Next service after 5000 KM");
    expect(res.body.data.status).toBe("partial");
  });

  test("creates numeric invoice code when company prefix is blank", async () => {
    const setting = await CompanySetting.getDefaultSetting();
    setting.invoicePrefix = "";
    await setting.save();

    const res = await createInvoice();

    expect(res.statusCode).toBe(201);
    expect(res.body.data.invoiceNumber).toBe(107);
    expect(res.body.data.invoiceCode).toBe("107");
  });

  test("creates invoice from existing customer with edited invoice vehicle snapshot", async () => {
    const createdCustomer = await request(app).post("/api/customers").send({
      name: "Existing Customer",
      phone: "9876543211",
      email: "existing@example.com",
      address: "Original address",
      vehicleNumber: "GJ01AA1111",
      vehicleKm: "45000"
    });
    const customerId = createdCustomer.body.data._id;

    const res = await request(app).post("/api/invoices").send({
      customerId,
      customer: {
        customerId,
        name: "Existing Customer",
        phone: "9876543211",
        email: "existing@example.com",
        address: "Invoice address",
        vehicleNumber: "gj02bb2222",
        vehicleKm: "48200"
      },
      lineItems: [{ itemName: "Wheel alignment", quantity: 1, unitPrice: 700 }],
      paymentMode: "Cash",
      receivedAmount: 0
    });

    expect(res.statusCode).toBe(201);
    expect(String(res.body.data.customer.customerId)).toBe(customerId);
    expect(res.body.data.customer.vehicleNumber).toBe("GJ02BB2222");
    expect(res.body.data.customer.vehicleKm).toBe("48200");
    expect(res.body.data.customer.address).toBe("Invoice address");

    const storedCustomer = await request(app).get(`/api/customers/${customerId}`);
    expect(storedCustomer.body.data.vehicleNumber).toBe("GJ02BB2222");
    expect(storedCustomer.body.data.vehicleKm).toBe("48200");
  });

  test("gets, lists, filters, adds payment, streams PDF, cancels and soft deletes invoice", async () => {
    const created = await createInvoice();
    const id = created.body.data._id;

    const get = await request(app).get(`/api/invoices/${id}`);
    expect(get.body.data.invoiceCode).toBe("KA-107");

    const list = await request(app).get("/api/invoices");
    expect(list.body.data.total).toBe(1);

    const filtered = await request(app).get("/api/invoices?status=partial");
    expect(filtered.body.data.total).toBe(1);

    const payment = await request(app).post(`/api/invoices/${id}/payments`).send({ amount: 1000, mode: "UPI", note: "Final" });
    expect(payment.body.data.status).toBe("paid");

    const pdf = await request(app).get(`/api/invoices/${id}/pdf`);
    expect(pdf.statusCode).toBe(200);
    expect(pdf.headers["content-type"]).toContain("application/pdf");

    const generated = await request(app).post(`/api/invoices/${id}/generate-pdf`);
    expect(generated.body.success).toBe(true);
    expect(generated.body.data.pdfUrl).toContain("/uploads/invoices/");

    const cancelled = await request(app).patch(`/api/invoices/${id}/cancel`);
    expect(cancelled.body.data.status).toBe("cancelled");

    const deleted = await request(app).delete(`/api/invoices/${id}`);
    expect(deleted.body.data.isDeleted).toBe(true);
  });
});
