const { MongoClient } = require('mongodb');
require('dotenv').config();

async function readInvoice() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('db1');
    const invoices = database.collection('invoices');

    const invoice = await invoices.findOne({}, { sort: { _id: -1 } });
    if (invoice) {
      console.log("Found Invoice:", JSON.stringify(invoice, null, 2));
    } else {
      console.log("No invoices found in db1.");
    }
  } catch (error) {
    console.error("Error reading from MongoDB:", error);
  } finally {
    await client.close();
  }
}

readInvoice();
