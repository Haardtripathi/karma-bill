const express = require("express");
const controller = require("../controllers/report.controller");

const router = express.Router();

router.get("/sales", controller.getSalesReport);
router.get("/customers", controller.getCustomerBalancesReport);
router.get("/items", controller.getItemSalesReport);

module.exports = router;
