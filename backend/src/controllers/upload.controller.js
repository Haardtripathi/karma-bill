const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { uploadImage } = require("../services/cloudinary.service");

const uploadGeneralImage = asyncHandler(async (req, res) => {
  const uploaded = await uploadImage(req.file, "invoice-images");
  successResponse(res, "Image uploaded", uploaded, 201);
});

const uploadInvoiceImage = asyncHandler(async (req, res) => {
  const uploaded = await uploadImage(req.file, "invoice-images");
  successResponse(res, "Invoice image uploaded", uploaded, 201);
});

module.exports = {
  uploadGeneralImage,
  uploadInvoiceImage
};
