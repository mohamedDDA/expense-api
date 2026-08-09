// src/config/db.js
//
// WHY THIS FILE EXISTS:
// The database connection is infrastructure every feature module
// depends on, so it belongs in config/ alongside env.js and
// logger.js -- not inside any single feature module.
//
// We export a single connectDB() function rather than connecting
// automatically when this file is imported. Why: an explicit
// function call makes the connection attempt visible and
// intentional in server.js, and (more importantly) means this file
// can be imported safely in a future test setup without
// side-effecting a real connection just by importing it.

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDB = async () => {
  try {
    // Mongoose's default server-selection timeout is 30 seconds --
    // fine for production (transient network blips), but painfully
    // slow during local development when the DB simply isn't
    // running yet. We shorten it so connection failures surface
    // almost immediately while iterating locally.
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected successfully');
  } catch (err) {
    // We deliberately do NOT let the app continue running without a
    // database connection. An API that "starts successfully" but
    // can't actually serve any data-backed request is worse than
    // one that fails to start at all -- it would accept traffic and
    // then fail confusingly on the first real request.
    logger.error('MongoDB connection failed', { message: err.message });
    process.exit(1);
  }
};
