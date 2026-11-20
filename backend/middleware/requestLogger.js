const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    logger[level](
      `${req.method} ${req.originalUrl} ${status} ${durationMs}ms`,
    );
  });

  next();
}

module.exports = requestLogger;
