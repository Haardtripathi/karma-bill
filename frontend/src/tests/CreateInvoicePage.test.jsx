import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import CreateInvoicePage from "../pages/CreateInvoicePage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

const mocks = vi.hoisted(() => ({
  createInvoice: vi.fn(() => Promise.resolve({ _id: "inv1", invoiceCode: "KA-107" })),
  getCustomers: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pages: 1 }))
}));

vi.mock("../api/customerApi.js", () => ({ getCustomers: (...args) => mocks.getCustomers(...args) }));
vi.mock("../api/inventoryItemApi.js", () => ({ getInventoryItems: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, pages: 1 })) }));
vi.mock("../api/invoiceApi.js", () => ({
  createInvoice: (...args) => mocks.createInvoice(...args),
  generateInvoicePdf: vi.fn(),
  invoicePdfUrl: vi.fn((id) => `http://localhost:5001/api/invoices/${id}/pdf`),
  sendInvoiceWhatsapp: vi.fn()
}));
vi.mock("../api/uploadApi.js", () => ({ uploadInvoiceImage: vi.fn() }));

beforeEach(() => {
  mocks.createInvoice.mockClear();
  mocks.getCustomers.mockReset();
  mocks.getCustomers.mockResolvedValue({ items: [], total: 0, page: 1, pages: 1 });
});

test("CreateInvoicePage can add/remove line items, calculates totals and calls API", async () => {
  const user = userEvent.setup();
  renderWithProviders(<CreateInvoicePage />, { route: "/invoices/new" });
  await screen.findByText("Customer");
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Kiran Shah" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
  fireEvent.change(screen.getByLabelText("Item name"), { target: { value: "Engine oil" } });
  fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "500" } });
  expect(screen.getAllByText("₹1,000.00").length).toBeGreaterThan(0);

  await user.click(screen.getByRole("button", { name: /Add item/i }));
  expect(screen.getAllByLabelText("Item name")).toHaveLength(2);
  await user.click(screen.getAllByLabelText("Remove item")[1]);
  expect(screen.getAllByLabelText("Item name")).toHaveLength(1);

  await user.click(screen.getByRole("button", { name: /Save invoice/i }));
  expect(mocks.createInvoice).toHaveBeenCalled();
});

test("selected customer stays editable and saves invoice-specific vehicle details", async () => {
  const user = userEvent.setup();
  mocks.getCustomers.mockResolvedValue({
    items: [{ _id: "cust1", name: "Rahul Patel", phone: "9876543210", email: "rahul@example.com", address: "Old address", vehicleNumber: "GJ01AA1111", vehicleKm: "45000" }],
    total: 1,
    page: 1,
    pages: 1
  });

  renderWithProviders(<CreateInvoicePage />, { route: "/invoices/new" });
  await screen.findByText("Customer");
  await user.click(screen.getByRole("combobox", { name: "Search Existing Customer" }));
  await user.click(await screen.findByRole("option", { name: /Rahul Patel/ }));

  expect(screen.getByLabelText("Name")).toHaveValue("Rahul Patel");
  expect(screen.getByLabelText("Phone")).toHaveValue("9876543210");
  expect(screen.getByLabelText("Vehicle Number")).toHaveValue("GJ01AA1111");
  expect(screen.getByLabelText("Vehicle KM")).toHaveValue("45000");

  fireEvent.change(screen.getByLabelText("Vehicle Number"), { target: { value: "GJ02BB2222" } });
  fireEvent.change(screen.getByLabelText("Vehicle KM"), { target: { value: "48200" } });
  fireEvent.change(screen.getByLabelText("Delivery date"), { target: { value: "2026-06-22" } });
  fireEvent.change(screen.getByLabelText("Car name"), { target: { value: "City" } });
  fireEvent.change(screen.getByLabelText("Car brand"), { target: { value: "Honda" } });
  fireEvent.change(screen.getByLabelText("Year of manufacture"), { target: { value: "2021" } });
  fireEvent.change(screen.getByLabelText("Next service kilometer"), { target: { value: "53000" } });
  fireEvent.change(screen.getByLabelText("PUC expiry"), { target: { value: "2026-12-31" } });
  fireEvent.change(screen.getByLabelText("Insurance expiry"), { target: { value: "2027-01-31" } });
  fireEvent.change(screen.getByLabelText("Remarks"), { target: { value: "Next service after 5000 KM" } });
  fireEvent.change(screen.getByLabelText("Item name"), { target: { value: "Wheel alignment" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "700" } });

  await user.click(screen.getByRole("button", { name: /Save invoice/i }));

  expect(mocks.createInvoice).toHaveBeenCalled();
  expect(mocks.createInvoice.mock.calls[0][0]).toMatchObject({
    customerId: "cust1",
    customer: { customerId: "cust1", name: "Rahul Patel", phone: "9876543210", vehicleNumber: "GJ02BB2222", vehicleKm: "48200" },
    carName: "City",
    carBrand: "Honda",
    yearOfManufacture: 2021,
    nextServiceKilometer: 53000,
    remarks: "Next service after 5000 KM"
  });
  expect(mocks.createInvoice.mock.calls[0][0].deliveryDate).toBeTruthy();
  expect(mocks.createInvoice.mock.calls[0][0].pucExpiryDate).toBeTruthy();
  expect(mocks.createInvoice.mock.calls[0][0].insuranceExpiryDate).toBeTruthy();
});
