require("dotenv").config({ path: ".env" });
const { cloudinary } = require("./src/config/cloudinary");
const fs = require("fs");

async function run() {
  try {
    const res = await cloudinary.uploader.upload("test-twilio.js", {
      folder: "karma-automobiles/test",
      resource_type: "image",
      public_id: "test.pdf"
    });
    console.log("Success:", res.secure_url);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
