// src/utils/AppError.js
//
// WHY THIS FILE EXISTS:
// By default, JavaScript's built-in Error class doesn't carry an
// HTTP status code, and doesn't distinguish between errors we
// EXPECT to happen (a user sends an invalid email -> 400) versus
// errors we DON'T expect (a bug, a crashed DB connection -> 500).
//
// AppError lets us throw errors from anywhere in the app (services,
// controllers, middleware) that already carry the correct HTTP
// status code and a flag marking them as "operational" -- meaning
// "this is a known, expected failure case, not a bug." Our global
// error handler (built later this milestone) uses that flag to
// decide how much detail is safe to send back to the client.
//
// Placed in utils/ (not middleware/) because it's not middleware
// itself -- it's a plain class used BY middleware and by every
// module's service layer.

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from bugs

    // Excludes the constructor call itself from the stack trace,
    // keeping stack traces focused on where the error actually
    // originated in application code.
    Error.captureStackTrace(this, this.constructor);
  }
}
