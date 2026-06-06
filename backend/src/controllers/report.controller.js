const Invoice = require("../models/Invoice.model");
const Customer = require("../models/Customer.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, search } = req.query;
  const filter = { status: { $ne: "cancelled" } };
  
  if (startDate || endDate) {
    filter.invoiceDate = {};
    if (startDate) filter.invoiceDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { invoiceCode: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } }
    ];
  }

  const invoices = await Invoice.find(filter).sort({ invoiceDate: -1 });
  
  let totalBilled = 0;
  let totalReceived = 0;
  
  invoices.forEach(inv => {
    totalBilled += inv.grandTotal || 0;
    totalReceived += inv.receivedAmount || 0;
  });

  successResponse(res, "Sales report fetched", {
    summary: {
      totalBilled,
      totalReceived,
      outstandingBalance: totalBilled - totalReceived
    },
    invoices
  });
});

const getCustomerBalancesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, search } = req.query;
  const filter = { status: { $ne: "cancelled" } };

  if (startDate || endDate) {
    filter.invoiceDate = {};
    if (startDate) filter.invoiceDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } }
    ];
  }

  const invoices = await Invoice.find(filter);
  
  const customerMap = {};
  
  invoices.forEach(inv => {
    const cid = inv.customer?.customerId?.toString();
    if (!cid) return;
    
    if (!customerMap[cid]) {
      customerMap[cid] = {
        customerId: cid,
        name: inv.customer.name,
        phone: inv.customer.phone,
        totalBilled: 0,
        totalPaid: 0
      };
    }
    
    customerMap[cid].totalBilled += inv.grandTotal || 0;
    customerMap[cid].totalPaid += inv.receivedAmount || 0;
  });

  const balances = Object.values(customerMap).map(c => ({
    ...c,
    outstandingBalance: c.totalBilled - c.totalPaid
  })).filter(c => c.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  successResponse(res, "Customer balances fetched", balances);
});

const getItemSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, search } = req.query;
  const filter = { status: { $ne: "cancelled" } };

  if (startDate || endDate) {
    filter.invoiceDate = {};
    if (startDate) filter.invoiceDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }

  const invoices = await Invoice.find(filter);
  
  const itemMap = {};
  
  invoices.forEach(inv => {
    inv.lineItems.forEach(item => {
      if (search && !new RegExp(search, "i").test(item.itemName)) return;
      const id = item.itemId?.toString() || item.itemName;
      if (!itemMap[id]) {
        itemMap[id] = {
          itemId: item.itemId,
          itemName: item.itemName,
          quantitySold: 0,
          totalRevenue: 0
        };
      }
      itemMap[id].quantitySold += item.quantity || 0;
      itemMap[id].totalRevenue += item.amount || 0;
    });
  });

  const items = Object.values(itemMap).sort((a, b) => b.quantitySold - a.quantitySold);
  
  successResponse(res, "Item sales fetched", items);
});

module.exports = {
  getSalesReport,
  getCustomerBalancesReport,
  getItemSalesReport
};
