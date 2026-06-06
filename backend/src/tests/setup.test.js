const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.BACKEND_PUBLIC_URL = "http://localhost:5001";
process.env.INVOICE_PREFIX = "KA";
process.env.INVOICE_START_NUMBER = "107";
process.env.DEFAULT_COUNTRY_CODE = "91";
process.env.DEFAULT_GOOGLE_MAPS_LINK = "https://maps.google.com/?q=KARMA+AUTOMOBILES+Vasna+Ahmedabad";
process.env.MONGOMS_SYSTEM_BINARY = "/usr/bin/mongod";
process.env.MONGOMS_VERSION = "7.0.31";

jest.setTimeout(60000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_WHATSAPP_FROM;
  delete process.env.TWILIO_STATUS_CALLBACK_URL;
  delete process.env.SEND_PDF_AS_MEDIA;
  process.env.BACKEND_PUBLIC_URL = "http://localhost:5001";
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
