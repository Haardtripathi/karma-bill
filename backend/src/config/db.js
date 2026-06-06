const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/karma_automobiles_billing";

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

module.exports = connectDB;
