const CompanySetting = require("../models/CompanySetting.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { uploadImage } = require("../services/cloudinary.service");

const getCompanySettings = asyncHandler(async (req, res) => {
  const setting = await CompanySetting.getDefaultSetting();
  successResponse(res, "Company settings fetched", setting);
});

const updateCompanySettings = asyncHandler(async (req, res) => {
  const setting = await CompanySetting.getDefaultSetting();
  Object.assign(setting, req.validated.body);
  await setting.save();
  successResponse(res, "Company settings updated", setting);
});

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  const uploaded = await uploadImage(req.file, "logo");
  const setting = await CompanySetting.getDefaultSetting();
  setting.logoUrl = uploaded.url;
  setting.logoPublicId = uploaded.publicId;
  await setting.save();
  successResponse(res, "Company logo uploaded", setting);
});

const uploadCompanySignature = asyncHandler(async (req, res) => {
  const uploaded = await uploadImage(req.file, "signatures");
  const setting = await CompanySetting.getDefaultSetting();
  setting.signatureImageUrl = uploaded.url;
  setting.signaturePublicId = uploaded.publicId;
  await setting.save();
  successResponse(res, "Company signature uploaded", setting);
});

const uploadCompanyPaymentQr = asyncHandler(async (req, res) => {
  const uploaded = await uploadImage(req.file, "payment-qr");
  const setting = await CompanySetting.getDefaultSetting();
  setting.paymentQrUrl = uploaded.url;
  setting.paymentQrPublicId = uploaded.publicId;
  await setting.save();
  successResponse(res, "Payment QR uploaded", setting);
});

module.exports = {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  uploadCompanySignature,
  uploadCompanyPaymentQr
};
