const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { getDashboardSummary } = require("../services/dashboard.service");

const getSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary();
  successResponse(res, "Dashboard summary fetched", summary);
});

module.exports = {
  getSummary
};
