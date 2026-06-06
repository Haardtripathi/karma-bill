const { errorResponse } = require("../utils/apiResponse");

const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;
  const errors =
    error.errors?.map?.((item) => item.message || item) ||
    error.details ||
    [];

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  return errorResponse(
    res,
    error.message || "Something went wrong",
    errors,
    statusCode
  );
};

module.exports = errorMiddleware;
