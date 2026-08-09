// src/server.js
//
// WHY THIS FILE EXISTS:
// This is the actual entry point of the running process (see
// package.json's "main" and "scripts.start"). Its job is narrow and
// specific: import the already-configured app, connect to
// dependencies the app needs (the database, in Milestone 5), and
// start listening for real network connections.
//
// Keeping this separate from app.js means app.js stays a pure,
// testable "what is this app" definition, while this file owns the
// "operate this app as a running process" concerns -- including,
// later, graceful shutdown handling.

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { seedDefaultCategories } from './config/seed.js';

// We connect to the database and THEN start listening -- in that
// order, not in parallel. If we called app.listen() first, the
// server would accept HTTP requests for a brief window before the
// database was ready, and any request arriving in that window would
// fail with a confusing error instead of the server simply not
// being reachable yet.
//
// Seeding runs AFTER the DB connects but BEFORE we accept traffic --
// guarantees the fallback "Others" category exists before any
// category-delete request could possibly need it.
const startServer = async () => {
  await connectDB();
  await seedDefaultCategories();

  const server = app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection - shutting down', { message: err.message });
    server.close(() => process.exit(1));
  });
};

startServer();
