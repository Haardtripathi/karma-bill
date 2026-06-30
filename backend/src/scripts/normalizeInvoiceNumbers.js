require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const CompanySetting = require("../models/CompanySetting.model");
const Counter = require("../models/Counter.model");
const Invoice = require("../models/Invoice.model");

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");

const makeTargetCode = (invoiceNumber) => String(invoiceNumber);
const makeTempCode = (id) => `__invoice_normalize_${id}`;

const summarize = (invoices) => {
  const updates = invoices
    .map((invoice) => ({
      id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      currentCode: invoice.invoiceCode,
      targetCode: makeTargetCode(invoice.invoiceNumber)
    }))
    .filter((invoice) => invoice.currentCode !== invoice.targetCode);

  const seenTargets = new Map();
  const duplicateTargets = [];
  for (const invoice of invoices) {
    const targetCode = makeTargetCode(invoice.invoiceNumber);
    if (seenTargets.has(targetCode)) {
      duplicateTargets.push({
        targetCode,
        invoiceIds: [seenTargets.get(targetCode), String(invoice._id)]
      });
    } else {
      seenTargets.set(targetCode, String(invoice._id));
    }
  }

  const maxInvoiceNumber = invoices.reduce((max, invoice) => Math.max(max, Number(invoice.invoiceNumber || 0)), 0);

  return {
    totalInvoices: invoices.length,
    invoicesToUpdate: updates.length,
    maxInvoiceNumber,
    updates,
    duplicateTargets
  };
};

const printSummary = (summary) => {
  console.log(`Invoices found: ${summary.totalInvoices}`);
  console.log(`Invoice codes to normalize: ${summary.invoicesToUpdate}`);
  console.log(`Highest invoice number: ${summary.maxInvoiceNumber}`);

  if (summary.updates.length) {
    console.table(summary.updates.slice(0, 20));
    if (summary.updates.length > 20) {
      console.log(`...and ${summary.updates.length - 20} more`);
    }
  }
};

const run = async () => {
  await connectDB();

  const invoices = await Invoice.find({}, { _id: 1, invoiceNumber: 1, invoiceCode: 1 })
    .sort({ invoiceNumber: 1, createdAt: 1 })
    .lean();
  const summary = summarize(invoices);

  printSummary(summary);

  if (summary.duplicateTargets.length) {
    console.error("Cannot normalize because multiple invoices would receive the same invoice code:");
    console.table(summary.duplicateTargets);
    process.exitCode = 1;
    return;
  }

  if (!execute) {
    console.log("Dry run only. Re-run with --execute to update invoice codes, company prefix, and counter.");
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (summary.updates.length) {
        await Invoice.bulkWrite(
          summary.updates.map((invoice) => ({
            updateOne: {
              filter: { _id: invoice.id },
              update: { $set: { invoiceCode: makeTempCode(invoice.id) } }
            }
          })),
          { session }
        );

        await Invoice.bulkWrite(
          summary.updates.map((invoice) => ({
            updateOne: {
              filter: { _id: invoice.id },
              update: { $set: { invoiceCode: invoice.targetCode } }
            }
          })),
          { session }
        );
      }

      await CompanySetting.updateMany(
        { isDefault: true },
        {
          $set: {
            invoicePrefix: "",
            nextInvoiceNumber: summary.maxInvoiceNumber + 1
          }
        },
        { session }
      );

      await Counter.findOneAndUpdate(
        { name: "invoice" },
        { $set: { value: summary.maxInvoiceNumber } },
        { upsert: true, new: true, session }
      );
    });

    console.log("Invoice number normalization complete.");
    console.log(`Next invoice will be ${summary.maxInvoiceNumber + 1}.`);
  } finally {
    await session.endSession();
  }
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
