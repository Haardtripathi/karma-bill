import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate.jsx";

const company = { businessName: "KARMA AUTOMOBILES", invoiceTitle: "Tax Invoice", defaultTerms: "Thank you", phone: "7698633516" };
const invoice = {
  invoiceNumber: 107,
  invoiceCode: "KA-107",
  invoiceDate: "2025-07-11",
  customer: { name: "Rahul Patel", phone: "9876543210", vehicleNumber: "GJ01AB1234", vehicleKm: "40000" },
  lineItems: [{ itemName: "Engine oil", hsnSac: "", quantity: 1, unitPrice: 364.3, amount: 364.3, imageUrl: "https://example.com/image.jpg" }],
  subTotal: 364.3,
  discountAmount: 0,
  grandTotal: 364.3,
  receivedAmount: 100,
  balanceAmount: 264.3,
  paymentMode: "Cash",
  status: "partial"
};

test("InvoiceTemplate renders business, customer, invoice, line item, total, balance and image link", () => {
  render(<InvoiceTemplate invoice={invoice} company={company} />);
  expect(screen.getByText("KARMA AUTOMOBILES")).toBeInTheDocument();
  expect(screen.getByText("Rahul Patel")).toBeInTheDocument();
  expect(screen.getByText(/KA-107/)).toBeInTheDocument();
  expect(screen.getByText("Engine oil")).toBeInTheDocument();
  expect(screen.getAllByText("₹ 364.3").length).toBeGreaterThan(0);
  expect(screen.getByText("₹ 264.3")).toBeInTheDocument();
  expect(screen.getAllByText(/View Image/i).length).toBeGreaterThan(0);
});

test("InvoiceTemplate uses uploaded logo without duplicating the business name in the header", () => {
  const { container } = render(<InvoiceTemplate invoice={invoice} company={{ ...company, logoUrl: "https://example.com/logo.png" }} />);
  expect(screen.getByAltText("Company logo")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "KARMA AUTOMOBILES" })).not.toBeInTheDocument();
  expect(container.querySelector(".invoice-logo-text")).toBeNull();
});
