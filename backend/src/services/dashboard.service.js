const Invoice = require("../models/Invoice.model");
const { startOfToday, endOfToday } = require("../utils/date.util");

const isConfirmedInvoice = (invoice) => !["draft", "cancelled"].includes(invoice.status);

const getDashboardSummary = async () => {
  const activeFilter = { isDeleted: false };
  const [invoices, recentInvoices] = await Promise.all([
    Invoice.find(activeFilter).lean(),
    Invoice.find(activeFilter).sort({ invoiceDate: -1, createdAt: -1 }).limit(8).lean()
  ]);

  const totals = invoices.reduce(
    (acc, invoice) => {
      const isToday = invoice.invoiceDate >= startOfToday() && invoice.invoiceDate <= endOfToday();
      const grandTotal = Number(invoice.grandTotal || 0);
      const receivedAmount = Number(invoice.receivedAmount || 0);
      const balanceAmount = Number(invoice.balanceAmount || 0);

      if (isToday) acc.todayInvoices += 1;
      if (invoice.status === "paid") acc.paidInvoices += 1;
      if (invoice.status === "unpaid") acc.unpaidInvoices += 1;
      if (invoice.status === "partial") acc.partialInvoices += 1;
      if (invoice.status === "draft") {
        acc.draftInvoices += 1;
        acc.draftAmount += grandTotal;
      }
      if (invoice.status === "cancelled") acc.cancelledInvoices += 1;

      if (isConfirmedInvoice(invoice)) {
        acc.confirmedInvoices += 1;
        acc.totalSales += grandTotal;
        acc.totalReceived += receivedAmount;
        acc.totalBalance += balanceAmount;
      }

      return acc;
    },
    {
      totalInvoices: invoices.length,
      todayInvoices: 0,
      confirmedInvoices: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      partialInvoices: 0,
      draftInvoices: 0,
      cancelledInvoices: 0,
      totalSales: 0,
      totalReceived: 0,
      totalBalance: 0,
      draftAmount: 0
    }
  );

  return {
    ...totals,
    totalSales: Number(totals.totalSales.toFixed(2)),
    totalReceived: Number(totals.totalReceived.toFixed(2)),
    totalBalance: Number(totals.totalBalance.toFixed(2)),
    draftAmount: Number(totals.draftAmount.toFixed(2)),
    recentInvoices
  };
};

module.exports = {
  getDashboardSummary
};
