const { errorResponse } = require("../utils/apiResponse");

const notFoundMiddleware = (req, res) => {
  errorResponse(res, `Route not found: ${req.originalUrl}`, [], 404);
};

module.exports = notFoundMiddleware;
