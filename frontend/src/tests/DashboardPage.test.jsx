import { screen } from "@testing-library/react";
import { vi } from "vitest";
import DashboardPage from "../pages/DashboardPage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

vi.mock("../api/dashboardApi.js", () => ({
  getDashboardSummary: vi.fn(() => Promise.resolve({
    totalInvoices: 2,
    todayInvoices: 1,
    totalSales: 1500,
    totalReceived: 1000,
    totalBalance: 500,
    paidInvoices: 1,
    partialInvoices: 1,
    unpaidInvoices: 0,
    recentInvoices: [{ _id: "1", invoiceCode: "KA-107", invoiceDate: "2025-07-11", customer: { name: "Rahul" }, grandTotal: 1500, receivedAmount: 1000, balanceAmount: 500, status: "partial" }]
  }))
}));
vi.mock("../api/invoiceApi.js", () => ({
  invoicePdfUrl: vi.fn((id) => `http://localhost:5001/api/invoices/${id}/pdf`),
  sendInvoiceWhatsapp: vi.fn()
}));

test("DashboardPage shows loading, stat cards and recent invoices", async () => {
  renderWithProviders(<DashboardPage />, { route: "/dashboard" });
  expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  expect(await screen.findByText("Total invoices")).toBeInTheDocument();
  expect(screen.getByText("KA-107")).toBeInTheDocument();
});
