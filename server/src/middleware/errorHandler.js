import AppError from "../utils/AppError.js";

export function notFound(req, res, next) {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Last middleware in the chain, every error ends up here
export function errorHandler(err, req, res, next) {
  // bad ObjectId in the URL
  if (err.name === "CastError") {
    err = new AppError("Invalid id", 400);
  }

  const status = err.statusCode || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    error: status === 500 ? "Something went wrong on our side" : err.message,
    details: err.details || undefined,
  });
}
