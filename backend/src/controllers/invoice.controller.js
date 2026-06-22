const Customer = require("../models/Customer.model");
const InventoryItem = require("../models/InventoryItem.model");
const Invoice = require("../models/Invoice.model");
const CompanySetting = require("../models/CompanySetting.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { calculateInvoiceTotals } = require("../services/invoiceCalculation.service");
const { getNextInvoiceNumber, makeInvoiceCode } = require("../services/invoiceNumber.service");
const { generatePdfBuffer, generateAndUploadInvoicePdf } = require("../services/invoicePdf.service");
const { sendInvoiceWhatsapp } = require("../services/whatsapp.service");

const mongoose = require("mongoose");

const getInvoiceOrThrow = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid invoice ID format");
    error.statusCode = 400;
    throw error;
  }
  const invoice = await Invoice.findById(id);
  if (!invoice || invoice.isDeleted) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }
  return invoice;
};

const valueOrDefault = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback || "";
  const normalized = String(value).trim();
  return normalized || fallback || "";
};

const buildCustomerSnapshot = async (body) => {
  const source = body.customer || {};
  const customerId = body.customerId || source.customerId || source._id;

  if (customerId) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      const error = new Error("Selected customer not found");
      error.statusCode = 404;
      throw error;
    }
    let isUpdated = false;
    const snapshot = {
      customerId: customer._id,
      name: valueOrDefault(source.name, customer.name),
      phone: valueOrDefault(source.phone, customer.phone),
      email: valueOrDefault(source.email, customer.email),
      address: valueOrDefault(source.address, customer.address),
      vehicleNumber: valueOrDefault(source.vehicleNumber, customer.vehicleNumber),
      vehicleKm: valueOrDefault(source.vehicleKm, customer.vehicleKm)
    };

    const fieldsToSync = ["name", "phone", "email", "address", "vehicleNumber", "vehicleKm"];
    for (const field of fieldsToSync) {
      const snapVal = snapshot[field] || "";
      const custVal = customer[field] || "";
      if (snapVal !== custVal) {
        customer[field] = snapVal;
        isUpdated = true;
      }
    }

    if (isUpdated) {
      await customer.save();
    }

    return snapshot;
  }

  if (!source.name || !source.phone) {
    const error = new Error("Customer is required");
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findOneAndUpdate(
    { phone: source.phone },
    {
      $setOnInsert: {
        name: source.name,
        phone: source.phone,
        email: source.email || "",
        address: source.address || "",
        vehicleNumber: source.vehicleNumber || "",
        vehicleKm: source.vehicleKm || ""
      }
    },
    { new: true, upsert: true }
  );

  return {
    customerId: customer._id,
    name: source.name || customer.name,
    phone: source.phone || customer.phone,
    email: source.email || customer.email || "",
    address: source.address || customer.address || "",
    vehicleNumber: source.vehicleNumber || customer.vehicleNumber || "",
    vehicleKm: source.vehicleKm || customer.vehicleKm || ""
  };
};

const prepareLineItems = async (items) => {
  const prepared = [];
  for (const item of items || []) {
    const itemId = item.itemId || undefined;
    let inventory = null;
    if (itemId) {
      inventory = await InventoryItem.findById(itemId);
      if (!inventory) {
        const error = new Error(`Inventory item not found: ${item.itemName}`);
        error.statusCode = 404;
        throw error;
      }
    }
    prepared.push({
      itemId,
      itemName: item.itemName || inventory?.name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice ?? inventory?.defaultPrice ?? 0),
      amount: Number(item.amount || 0),
      imageUrl: item.imageUrl || "",
      imagePublicId: item.imagePublicId || "",
      imageNote: item.imageNote || ""
    });
  }
  return prepared;
};

const quantityMap = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    if (item.itemId) {
      const id = String(item.itemId);
      map.set(id, (map.get(id) || 0) + Number(item.quantity || 0));
    }
  });
  return map;
};

const adjustStockDiff = async (oldItems = [], newItems = []) => {
  const oldMap = quantityMap(oldItems);
  const newMap = quantityMap(newItems);
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const id of ids) {
    const delta = (newMap.get(id) || 0) - (oldMap.get(id) || 0);
    if (delta === 0) continue;
    const item = await InventoryItem.findById(id);
    if (!item || item.type === "service") continue;
    const nextStock = Number(item.stockQty || 0) - delta;
    if (nextStock < 0) {
      const error = new Error(`Stock cannot go negative for ${item.name}`);
      error.statusCode = 400;
      throw error;
    }
    item.stockQty = nextStock;
    await item.save();
  }
};

const buildInitialPayments = (body) => {
  if (Array.isArray(body.payments) && body.payments.length) return body.payments;
  if (Number(body.receivedAmount || 0) > 0) {
    return [{ amount: Number(body.receivedAmount), mode: body.paymentMode || "Cash", paymentDate: new Date(), note: "Initial payment" }];
  }
  return [];
};

const listInvoices = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const filter = { isDeleted: false };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.fromDate || req.query.toDate) {
    filter.invoiceDate = {};
    if (req.query.fromDate) filter.invoiceDate.$gte = new Date(req.query.fromDate);
    if (req.query.toDate) filter.invoiceDate.$lte = new Date(req.query.toDate);
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ invoiceCode: regex }, { "customer.name": regex }, { "customer.phone": regex }, { "customer.vehicleNumber": regex }, { carName: regex }, { carBrand: regex }];
  }

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Invoice.countDocuments(filter)
  ]);

  successResponse(res, "Invoices fetched", { items, total, page, limit, pages: Math.ceil(total / limit) });
});

const createInvoice = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const company = await CompanySetting.getDefaultSetting();
  const customer = await buildCustomerSnapshot(body);
  const lineItems = await prepareLineItems(body.lineItems);
  const payments = buildInitialPayments(body);
  const totals = calculateInvoiceTotals({ ...body, lineItems, payments });
  const invoiceNumber = await getNextInvoiceNumber();
  const invoiceCode = makeInvoiceCode(invoiceNumber, company.invoicePrefix || process.env.INVOICE_PREFIX || "KA");

  await adjustStockDiff([], totals.lineItems);

  const invoice = await Invoice.create({
    invoiceNumber,
    invoiceCode,
    invoiceDate: body.invoiceDate || new Date(),
    deliveryDate: body.deliveryDate,
    carName: body.carName || "",
    carBrand: body.carBrand || "",
    fuelType: body.fuelType || "",
    yearOfManufacture: body.yearOfManufacture,
    nextServiceKilometer: body.nextServiceKilometer,
    pucExpiryDate: body.pucExpiryDate,
    insuranceExpiryDate: body.insuranceExpiryDate,
    customer,
    lineItems: totals.lineItems,
    subTotal: totals.subTotal,
    discountAmount: totals.discountAmount,
    grandTotal: totals.grandTotal,
    receivedAmount: totals.receivedAmount,
    balanceAmount: totals.balanceAmount,
    paymentMode: body.paymentMode || company.defaultPaymentMode || "Cash",
    payments,
    status: totals.status,
    remarks: body.remarks ?? body.description ?? "",
    description: "",
    terms: body.terms || company.defaultTerms,
    mapsLink: body.mapsLink || company.mapsLink
  });

  successResponse(res, "Invoice created", invoice, 201);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  successResponse(res, "Invoice fetched", invoice);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  if (invoice.status === "cancelled") {
    return errorResponse(res, "Cancelled invoice cannot be edited", [], 400);
  }

  const body = req.validated.body;
  const invoicePatch = { ...body };
  if (body.remarks === undefined && body.description !== undefined) {
    invoicePatch.remarks = body.description;
    invoicePatch.description = "";
  }
  if (body.remarks !== undefined) {
    invoicePatch.description = "";
  }
  const customer = body.customer || body.customerId ? await buildCustomerSnapshot({ ...invoice.toObject(), ...body }) : invoice.customer;
  const rawLineItems = body.lineItems ? await prepareLineItems(body.lineItems) : invoice.lineItems.map((item) => item.toObject());
  const payments = body.payments || invoice.payments.map((payment) => payment.toObject());
  const totals = calculateInvoiceTotals({
    ...invoice.toObject(),
    ...body,
    customer,
    lineItems: rawLineItems,
    payments,
    receivedAmount: body.receivedAmount ?? invoice.receivedAmount
  });

  await adjustStockDiff(invoice.lineItems, totals.lineItems);

  Object.assign(invoice, {
    ...invoicePatch,
    customer,
    lineItems: totals.lineItems,
    payments,
    subTotal: totals.subTotal,
    discountAmount: totals.discountAmount,
    grandTotal: totals.grandTotal,
    receivedAmount: totals.receivedAmount,
    balanceAmount: totals.balanceAmount,
    status: totals.status
  });
  await invoice.save();
  successResponse(res, "Invoice updated", invoice);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  await adjustStockDiff(invoice.lineItems, []);
  invoice.isDeleted = true;
  await invoice.save();
  successResponse(res, "Invoice deleted", invoice);
});

const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  if (invoice.status !== "cancelled") {
    await adjustStockDiff(invoice.lineItems, []);
  }
  invoice.status = "cancelled";
  await invoice.save();
  successResponse(res, "Invoice cancelled", invoice);
});

const addPayment = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  if (invoice.status === "cancelled") {
    return errorResponse(res, "Cannot add payment to cancelled invoice", [], 400);
  }
  const payment = req.validated.body;
  const nextPayments = [...invoice.payments.map((item) => item.toObject()), payment];
  const totals = calculateInvoiceTotals({ ...invoice.toObject(), payments: nextPayments, status: invoice.status === "draft" ? "unpaid" : invoice.status });
  invoice.payments = nextPayments;
  invoice.receivedAmount = totals.receivedAmount;
  invoice.balanceAmount = totals.balanceAmount;
  invoice.status = totals.status;
  await invoice.save();
  successResponse(res, "Payment added", invoice);
});

const generatePdf = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  const company = await CompanySetting.getDefaultSetting();
  const generated = await generateAndUploadInvoicePdf(invoice.toObject(), company.toObject());
  invoice.pdfUrl = generated.url;
  invoice.pdfImageUrl = generated.imageUrl || "";
  invoice.pdfPublicId = generated.publicId;
  invoice.lastPdfGeneratedAt = new Date();
  await invoice.save();
  successResponse(res, "Invoice PDF generated", invoice);
});

const streamPdf = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  const company = await CompanySetting.getDefaultSetting();
  const buffer = await generatePdfBuffer(invoice.toObject(), company.toObject());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceCode}.pdf"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
});

const getPrintData = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  const company = await CompanySetting.getDefaultSetting();
  successResponse(res, "Invoice print data fetched", { invoice, company });
});

const sendInvoiceWhatsappController = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceOrThrow(req.params.id);
  if (invoice.status === "cancelled" && req.body?.allowCancelled !== true) {
    return errorResponse(res, "Cancelled invoice cannot be sent unless allowCancelled is true", [], 400);
  }
  const company = await CompanySetting.getDefaultSetting();

  if (!invoice.pdfUrl) {
    try {
      const generated = await generateAndUploadInvoicePdf(invoice.toObject(), company.toObject());
      invoice.pdfUrl = generated.url;
      invoice.pdfImageUrl = generated.imageUrl || "";
      invoice.pdfPublicId = generated.publicId;
      invoice.lastPdfGeneratedAt = new Date();
      await invoice.save();
    } catch (error) {
      invoice.whatsapp.lastError = error.message;
      await invoice.save();
    }
  }

  const invoiceLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/invoices/${invoice._id}`;
  try {
    const result = await sendInvoiceWhatsapp({ invoice, company, invoiceLink });

    // ── Link mode: return wa.me URL for frontend to open in new tab ──
    if (result.mode === "link") {
      return successResponse(res, "WhatsApp link generated", { mode: "link", whatsappUrl: result.whatsappUrl });
    }

    // ── Twilio mode: track delivery status ──
    invoice.whatsapp.lastSentAt = new Date();
    invoice.whatsapp.sentCount = (invoice.whatsapp.sentCount || 0) + 1;
    invoice.whatsapp.lastMessageSid = result.sid;
    invoice.whatsapp.lastStatus = result.status || "queued";
    invoice.whatsapp.lastError = "";
    await invoice.save();
    successResponse(res, "WhatsApp invoice message sent", { mode: "twilio", invoice, messageSid: result.sid, status: result.status });
  } catch (error) {
    invoice.whatsapp.lastError = error.message;
    invoice.whatsapp.lastStatus = "failed";
    await invoice.save();
    errorResponse(res, error.message, [], error.statusCode || 400);
  }
});

module.exports = {
  listInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  cancelInvoice,
  addPayment,
  generatePdf,
  streamPdf,
  getPrintData,
  sendInvoiceWhatsappController
};
