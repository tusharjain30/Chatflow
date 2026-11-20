const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  logger.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  logger.error(`${req.method} ${req.originalUrl}`, {
    status,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    success: false,
    message:
      status >= 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
