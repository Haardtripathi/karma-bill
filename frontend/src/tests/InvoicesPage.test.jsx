import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import InvoicesPage from "../pages/InvoicesPage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

const mocks = vi.hoisted(() => ({
  generateInvoicePdf: vi.fn(() => Promise.resolve({ _id: "inv1", invoiceCode: "KA-107" })),
  getInvoices: vi.fn(() => Promise.resolve({
    items: [{
      _id: "inv1",
      invoiceCode: "KA-107",
      invoiceDate: "2026-06-06",
      customer: { name: "Rahul", phone: "9876543210", vehicleNumber: "GJ01AB1234" },
      grandTotal: 260,
      receivedAmount: 0,
      balanceAmount: 260,
      status: "unpaid"
    }],
    total: 1,
    page: 1,
    pages: 1
  }))
}));

vi.mock("../api/invoiceApi.js", () => ({
  cancelInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
  generateInvoicePdf: (id) => mocks.generateInvoicePdf(id),
  getInvoices: (...args) => mocks.getInvoices(...args),
  invoicePdfUrl: vi.fn((id) => `http://localhost:5001/api/invoices/${id}/pdf`),
  sendInvoiceWhatsapp: vi.fn()
}));

beforeEach(() => {
  mocks.generateInvoicePdf.mockClear();
  mocks.getInvoices.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("InvoicesPage PDF button generates and opens the backend PDF stream", async () => {
  const popup = {
    closed: false,
    close: vi.fn(),
    document: { title: "", body: { innerHTML: "" } },
    location: { href: "" },
    opener: {}
  };
  vi.spyOn(window, "open").mockReturnValue(popup);
  const user = userEvent.setup();

  renderWithProviders(<InvoicesPage />, { route: "/invoices" });

  expect(await screen.findByText("KA-107")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /PDF/i }));

  await waitFor(() => expect(mocks.generateInvoicePdf).toHaveBeenCalledWith("inv1"));
  await waitFor(() => expect(popup.location.href).toBe("http://localhost:5001/api/invoices/inv1/pdf"));
  expect(popup.close).not.toHaveBeenCalled();
});

test("InvoicesPage reload button fetches the current list again", async () => {
  const user = userEvent.setup();

  renderWithProviders(<InvoicesPage />, { route: "/invoices" });

  expect(await screen.findByText("KA-107")).toBeInTheDocument();
  mocks.getInvoices.mockClear();

  await user.click(screen.getByRole("button", { name: /Reload/i }));

  await waitFor(() => expect(mocks.getInvoices).toHaveBeenCalledTimes(1));
});

test("InvoicesPage opens with draft status from the URL", async () => {
  renderWithProviders(<InvoicesPage />, { route: "/invoices?status=draft" });

  await waitFor(() => expect(mocks.getInvoices).toHaveBeenCalledWith(expect.objectContaining({ status: "draft" })));
  expect(await screen.findByLabelText("Status")).toHaveTextContent("draft");
});
