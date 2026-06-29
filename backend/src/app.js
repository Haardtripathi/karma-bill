const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const companySettingRoutes = require("./routes/companySetting.routes");
const customerRoutes = require("./routes/customer.routes");
const inventoryItemRoutes = require("./routes/inventoryItem.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const uploadRoutes = require("./routes/upload.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const webhookRoutes = require("./routes/webhook.routes");
const reportRoutes = require("./routes/report.routes");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");
const { successResponse } = require("./utils/apiResponse");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const configuredClientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
  origin === "capacitor://localhost";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredClientOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "test" ? "tiny" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "test" ? 1000 : 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  successResponse(res, "KARMA AUTOMOBILES billing API is healthy", {
    service: "karma-automobiles-billing",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/company-settings", companySettingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory-items", inventoryItemRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
