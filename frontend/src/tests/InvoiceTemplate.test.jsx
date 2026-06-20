import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate.jsx";

const company = { businessName: "KARMA AUTOMOBILES", invoiceTitle: "Tax Invoice", defaultTerms: "Thank you", phone: "7698633516" };
const invoice = {
  invoiceNumber: 107,
  invoiceCode: "KA-107",
  invoiceDate: "2025-07-11T09:15:00.000Z",
  deliveryDate: "2025-07-12T10:30:00.000Z",
  carName: "City",
  carBrand: "Honda",
  fuelType: "Petrol-CNG",
  yearOfManufacture: 2021,
  nextServiceKilometer: 45000,
  pucExpiryDate: "2026-12-31T00:00:00.000Z",
  insuranceExpiryDate: "2027-01-31T00:00:00.000Z",
  remarks: "Next service after 5000 KM",
  customer: { name: "Rahul Patel", phone: "9876543210", vehicleNumber: "GJ01AB1234", vehicleKm: "40000" },
  lineItems: [{ itemName: "Engine oil", quantity: 1, unitPrice: 364.3, amount: 364.3, imageUrl: "https://example.com/image.jpg" }],
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
  expect(screen.getByRole("heading", { name: "KARMA AUTOMOBILES" })).toBeInTheDocument();
  expect(screen.getByText("Rahul Patel")).toBeInTheDocument();
  expect(screen.getByText(/KA-107/)).toBeInTheDocument();
  expect(screen.getByText("Engine oil")).toBeInTheDocument();
  expect(screen.getAllByText("₹ 364.3").length).toBeGreaterThan(0);
  expect(screen.getByText("₹ 264.3")).toBeInTheDocument();
  expect(screen.getAllByText(/View Image/i).length).toBeGreaterThan(0);
  expect(screen.getByText("Description:")).toBeInTheDocument();
  expect(screen.getByText("Remarks:")).toBeInTheDocument();
  expect(screen.getByText("Next Service KM:")).toBeInTheDocument();
  expect(screen.getByText(/Honda City/)).toBeInTheDocument();
  expect(screen.getByText(/Next service after 5000 KM/)).toBeInTheDocument();
});

test("InvoiceTemplate uses uploaded logo and keeps the bold business name", () => {
  const { container } = render(<InvoiceTemplate invoice={invoice} company={{ ...company, logoUrl: "https://example.com/logo.png" }} />);
  expect(screen.getByAltText("Company logo")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "KARMA AUTOMOBILES" })).toBeInTheDocument();
  expect(container.querySelector(".invoice-logo-text")).toBeNull();
});
