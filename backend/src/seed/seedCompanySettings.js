require("dotenv").config();

const connectDB = require("../config/db");
const CompanySetting = require("../models/CompanySetting.model");

const run = async () => {
  await connectDB();
  const existing = await CompanySetting.findOne({ isDefault: true });
  if (existing) {
    Object.assign(existing, CompanySetting.defaultCompanySettings);
    await existing.save();
    console.log("Default KARMA AUTOMOBILES settings updated");
  } else {
    await CompanySetting.create(CompanySetting.defaultCompanySettings);
    console.log("Default KARMA AUTOMOBILES settings created");
  }
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
