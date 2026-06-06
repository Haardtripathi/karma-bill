const { roundMoney } = require("../utils/currency.util");

const calculateInvoiceTotals = (invoiceLike) => {
  const discountAmount = roundMoney(invoiceLike.discountAmount || 0);
  const lineItems = (invoiceLike.lineItems || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const amount = roundMoney(quantity * unitPrice);
    return {
      ...item,
      quantity,
      unitPrice,
      amount
    };
  });

  if (!lineItems.length) {
    const error = new Error("At least one line item is required");
    error.statusCode = 400;
    throw error;
  }

  const subTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  if (discountAmount > subTotal) {
    const error = new Error("Discount amount cannot be more than subtotal");
    error.statusCode = 400;
    throw error;
  }

  const grandTotal = roundMoney(subTotal - discountAmount);
  const receivedFromPayments = Array.isArray(invoiceLike.payments) && invoiceLike.payments.length
    ? invoiceLike.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    : invoiceLike.receivedAmount || 0;
  const receivedAmount = roundMoney(receivedFromPayments);

  if (receivedAmount > grandTotal) {
    const error = new Error("Received amount cannot be more than invoice total");
    error.statusCode = 400;
    throw error;
  }

  const balanceAmount = roundMoney(grandTotal - receivedAmount);
  let status = invoiceLike.status;

  if (status === "cancelled") {
    status = "cancelled";
  } else if (status === "draft") {
    status = "draft";
  } else if (balanceAmount === 0) {
    status = "paid";
  } else if (receivedAmount > 0 && balanceAmount > 0) {
    status = "partial";
  } else {
    status = "unpaid";
  }

  return {
    lineItems,
    subTotal,
    discountAmount,
    grandTotal,
    receivedAmount,
    balanceAmount,
    status
  };
};

module.exports = {
  calculateInvoiceTotals
};
