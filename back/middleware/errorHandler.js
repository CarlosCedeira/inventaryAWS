const { logUnexpectedError } = require("../utils/logger");

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  logUnexpectedError(req, "unhandled_request_error", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Error interno del servidor", requestId: req.requestId });
}

module.exports = { errorHandler };
