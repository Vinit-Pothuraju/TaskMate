export default function errorHandler(err, req, res, next) {
  // Log the error for the developer in all environments
  console.error(err.stack);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Send a more detailed error response in development
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack, // Include the stack trace for easier debugging
    });
  }

  // Send a generic error response in production
  res.status(statusCode).json({
    success: false,
    message,
  });
}