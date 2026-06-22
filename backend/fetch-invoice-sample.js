const { MongoClient } = require('mongodb');

async function readInvoice() {
  const uri = "mongodb+srv://haardtripathi:Kakarot%401231@cluster0.5eph1ze.mongodb.net/db1";
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
