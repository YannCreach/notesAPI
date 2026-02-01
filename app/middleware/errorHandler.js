export class ApiError extends Error {
  constructor(
    statusCode = 500,
    code = "internal_error",
    message = "Internal Server Error",
    details = undefined,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFound(req, res, next) {
  res
    .status(404)
    .json({ error: { code: "not_found", message: "Route not found" } });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 500 ? "internal_error" : "error");
  const message = err.message || "Internal Server Error";
  const payload = { error: { code, message } };
  if (err.details) payload.error.details = err.details;

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && err.stack) {
    payload.error.stack = err.stack;
  }

  // Minimal logging, avoid noisy traces in production
  if (isProd) {
    console.error(`[${code}] ${message}`);
  } else {
    console.error(err);
  }

  res.status(status).json(payload);
}

// Helpers
export const errors = {
  badRequest: (message = "Bad Request", details) =>
    new ApiError(400, "bad_request", message, details),
  unauthorized: (message = "Unauthorized", details) =>
    new ApiError(401, "unauthorized", message, details),
  forbidden: (message = "Forbidden", details) =>
    new ApiError(403, "forbidden", message, details),
  notFound: (message = "Not Found", details) =>
    new ApiError(404, "not_found", message, details),
  conflict: (message = "Conflict", details) =>
    new ApiError(409, "conflict", message, details),
  internal: (message = "Internal Server Error", details) =>
    new ApiError(500, "internal_error", message, details),
};
