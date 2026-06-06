import { screen } from "@testing-library/react";
import { vi } from "vitest";
import CustomersPage from "../pages/CustomersPage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

vi.mock("../api/customerApi.js", () => ({
  getCustomers: vi.fn(() => Promise.resolve({ items: [{ _id: "1", name: "Rahul Patel", phone: "9876543210", vehicleNumber: "GJ01AB1234", address: "Ahmedabad", isActive: true }], total: 1, page: 1, pages: 1 })),
  deleteCustomer: vi.fn()
}));

test("CustomersPage shows customer list, search input and add button", async () => {
  renderWithProviders(<CustomersPage />, { route: "/customers" });
  expect(screen.getByPlaceholderText(/Search customers/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Add customer/i })).toBeInTheDocument();
  expect(await screen.findByText("Rahul Patel")).toBeInTheDocument();
});
