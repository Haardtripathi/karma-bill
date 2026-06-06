require("dotenv").config();

const connectDB = require("../config/db");
const InventoryItem = require("../models/InventoryItem.model");

const items = [
  ["PETROL AND CNG SERVICE WITH WASHING", "service", 1250],
  ["Engine oil", "part", 364.3],
  ["Oil filter", "part", 150],
  ["Air filter", "part", 380],
  ["Ac filter", "part", 360],
  ["Coolant", "part", 260],
  ["WHEEL ALIGNMENT AND WHEEL BALANCING", "service", 800],
  ["BRAKE PAD [SYNTHETIC]", "part", 2100],
  ["BRAKE DISC CUTTING", "service", 350],
  ["CALIPER PIN NEW", "part", 200]
];

const run = async () => {
  await connectDB();
  for (const [name, type, defaultPrice] of items) {
    await InventoryItem.findOneAndUpdate(
      { name },
      { name, type, defaultPrice, unit: "pcs", stockQty: type === "service" ? 0 : 20, isActive: true },
      { upsert: true, new: true }
    );
  }
  console.log("Default inventory/service items seeded");
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
