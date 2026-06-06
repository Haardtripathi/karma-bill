import { screen } from "@testing-library/react";
import { vi } from "vitest";
import InventoryItemsPage from "../pages/InventoryItemsPage.jsx";
import { renderWithProviders } from "./testUtils.jsx";

vi.mock("../api/inventoryItemApi.js", () => ({
  getInventoryItems: vi.fn(() => Promise.resolve({ items: [{ _id: "1", name: "Engine oil", type: "part", hsnSac: "", defaultPrice: 364.3, stockQty: 10 }], total: 1, page: 1, pages: 1 })),
  deleteInventoryItem: vi.fn()
}));

test("InventoryItemsPage shows item list, type filter and add button", async () => {
  renderWithProviders(<InventoryItemsPage />, { route: "/inventory-items" });
  expect(screen.getByPlaceholderText(/Search items/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Filter by type/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Add item/i })).toBeInTheDocument();
  expect(await screen.findByText("Engine oil")).toBeInTheDocument();
});
