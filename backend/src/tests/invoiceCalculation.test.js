const { calculateInvoiceTotals } = require("../services/invoiceCalculation.service");

describe("Invoice calculation", () => {
  test("calculates one item and paid status", () => {
    const result = calculateInvoiceTotals({ lineItems: [{ itemName: "Service", quantity: 2, unitPrice: 500 }], receivedAmount: 1000 });
    expect(result.subTotal).toBe(1000);
    expect(result.grandTotal).toBe(1000);
    expect(result.status).toBe("paid");
  });

  test("calculates multiple items, discount and partial/unpaid status", () => {
    const partial = calculateInvoiceTotals({ lineItems: [{ itemName: "A", quantity: 1, unitPrice: 1000 }, { itemName: "B", quantity: 2, unitPrice: 250 }], discountAmount: 100, receivedAmount: 700 });
    expect(partial.grandTotal).toBe(1400);
    expect(partial.balanceAmount).toBe(700);
    expect(partial.status).toBe("partial");

    const unpaid = calculateInvoiceTotals({ lineItems: [{ itemName: "A", quantity: 1, unitPrice: 300 }] });
    expect(unpaid.status).toBe("unpaid");
  });

  test("rejects received amount greater than total", () => {
    expect(() => calculateInvoiceTotals({ lineItems: [{ itemName: "A", quantity: 1, unitPrice: 100 }], receivedAmount: 101 })).toThrow("Received amount");
  });
});
