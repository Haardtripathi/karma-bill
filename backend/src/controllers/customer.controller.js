const Customer = require("../models/Customer.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const filter = {};

  if (req.query.status === "active" || !req.query.status) filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ name: regex }, { phone: regex }, { vehicleNumber: regex }, { address: regex }];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Customer.countDocuments(filter)
  ]);

  successResponse(res, "Customers fetched", { items, total, page, limit, pages: Math.ceil(total / limit) });
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.validated.body);
  successResponse(res, "Customer created", customer, 201);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Customer fetched", customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.validated.body, { new: true, runValidators: true });
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Customer updated", customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }
  successResponse(res, "Customer deactivated", customer);
});

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
