export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error.details) {
    return res.status(error.status || 400).json({ message: error.message, details: error.details });
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: 'Validation failed', details });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource id.' });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Logo must be 2MB or smaller.' });
  }

  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Something went wrong.' });
}
