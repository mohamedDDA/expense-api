// src/middleware/errorHandler.js
//
// WHY THIS FILE EXISTS:
// Without centralized error handling, every controller ends up with
// its own try/catch and its own ad-hoc res.status(...).json(...)
// error format -- meaning your API's error responses are
// inconsistent, and every developer touching a controller has to
// remember to handle errors correctly by hand.
//
// Express has a special convention: any middleware function with
// FOUR parameters (err, req, res, next) is automatically treated as
// error-handling middleware, and Express routes errors to it
// whenever next(err) is called, or a synchronous error is thrown
// inside a route handler.
//
// This file is the single place that decides: what status code to
// send, what message the client sees, and whether to leak stack
// traces (only in development, NEVER in production).

import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // If the error wasn't one of our deliberate AppError instances,
  // treat it as an unexpected bug: default to 500 and don't trust
  // its message to be safe to show a client.
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  const logMeta = {
    statusCode,
    path: req.originalUrl,
    method: req.method,
  };

  if (isOperational) {
    // Expected, user-caused failures: "category not found", a
    // validation rejection, wrong password. Not a bug -- the app
    // did exactly what it should have. Logged at `warn`, deliberately
    // WITHOUT a stack trace (there's no bug location to point to,
    // and the trace would just be noise). This is exactly the data
    // that answers "are users repeatedly hitting the same wall" --
    // a UX signal, not an incident to react to.
    logger.warn(err.message, logMeta);
  } else {
    // Unexpected failures: a bug, a crashed dependency, a null
    // reference we didn't anticipate. This is the log level that
    // would page someone in a real production setup -- it means
    // the APP did something wrong, not the user.
    logger.error(err.message, { ...logMeta, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Something went wrong on our end.',
    // Only include stack traces in development -- leaking them in
    // production hands attackers a map of your file structure and
    // internal logic.
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

// 404 handler -- catches requests to routes that don't exist at all.
// Placed AFTER all real routes are registered in app.js, so it only
// fires when nothing else matched.
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
