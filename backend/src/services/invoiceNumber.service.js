const Counter = require("../models/Counter.model");

const getInvoicePrefix = () => process.env.INVOICE_PREFIX || "KA";

const getNextInvoiceNumber = async () => {
  const startNumber = Number(process.env.INVOICE_START_NUMBER || 107);
  const incremented = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { value: 1 } },
    { new: true }
  );

  if (incremented) {
    return incremented.value;
  }

  try {
    const created = await Counter.create({ name: "invoice", value: startNumber });
    return created.value;
  } catch (error) {
    if (error.code === 11000) {
      const retried = await Counter.findOneAndUpdate(
        { name: "invoice" },
        { $inc: { value: 1 } },
        { new: true }
      );
      return retried.value;
    }
    throw error;
  }
};

const makeInvoiceCode = (invoiceNumber, prefix = getInvoicePrefix()) => `${prefix}-${invoiceNumber}`;

module.exports = {
  getNextInvoiceNumber,
  makeInvoiceCode,
  getInvoicePrefix
};
