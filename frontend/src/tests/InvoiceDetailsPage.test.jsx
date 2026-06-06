import { screen } from "@testing-library/react";
import { vi } from "vitest";
import InvoiceDetailsPage from "../pages/InvoiceDetailsPage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ id: "inv1" }) };
});
vi.mock("../api/invoiceApi.js", () => ({
  getInvoicePrintData: vi.fn(() => Promise.resolve({ invoice: { _id: "inv1", invoiceNumber: 107, invoiceCode: "KA-107", invoiceDate: "2025-07-11", customer: { name: "Rahul" }, lineItems: [], subTotal: 0, discountAmount: 0, grandTotal: 0, receivedAmount: 0, balanceAmount: 0, paymentMode: "Cash", status: "unpaid" }, company: { businessName: "KARMA AUTOMOBILES", invoiceTitle: "Tax Invoice" } })),
  addInvoicePayment: vi.fn(),
  cancelInvoice: vi.fn(),
  generateInvoicePdf: vi.fn(),
  sendInvoiceWhatsapp: vi.fn(),
  invoicePdfUrl: vi.fn((id) => `http://localhost:5001/api/invoices/${id}/pdf`)
}));

test("InvoiceDetailsPage shows print, PDF, WhatsApp and add payment buttons", async () => {
  renderWithProviders(<InvoiceDetailsPage />, { route: "/invoices/inv1" });
  expect((await screen.findAllByText("KA-107")).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /Print/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /PDF/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /WhatsApp/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add payment/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Open PDF/i })).toHaveAttribute("href", "http://localhost:5001/api/invoices/inv1/pdf");
});
