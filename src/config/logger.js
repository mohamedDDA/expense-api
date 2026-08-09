// src/config/logger.js
//
// WHY THIS FILE EXISTS:
// console.log works, but it gives no structure: no severity level,
// no consistent timestamp, no easy way to later redirect output to
// a file or a log-aggregation service (e.g. Datadog, CloudWatch)
// without touching every call site in the codebase.
//
// By wrapping logging behind our own small `logger` object now,
// every other file calls logger.info(...) / logger.error(...)
// instead of console.log(...) directly. If we later swap in a
// production-grade library like Pino or Winston, only this file
// changes -- nothing else in the app needs to know or care.
//
// We are NOT reaching for Winston/Pino yet. For a project this size,
// that would be premature -- extra configuration and dependency
// weight for a benefit we don't need until we have real production
// log volume or need structured JSON logs for a log pipeline.

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${timestamp()} - ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${timestamp()} - ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${timestamp()} - ${message}`, meta);
  },
};
