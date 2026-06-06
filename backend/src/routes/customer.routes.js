const express = require("express");
const controller = require("../controllers/customer.controller");
const validate = require("../middlewares/validate.middleware");
const { createCustomerSchema, updateCustomerSchema } = require("../validations/customer.validation");

const router = express.Router();

router.post("/", validate(createCustomerSchema), controller.createCustomer);
router.get("/", controller.listCustomers);
router.get("/:id", controller.getCustomerById);
router.put("/:id", validate(updateCustomerSchema), controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

module.exports = router;
