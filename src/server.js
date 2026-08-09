import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { seedDefaultCategories } from './config/seed.js';

let dbInitialized = false;

const initializeDatabase = async () => {
  if (dbInitialized) {
    return;
  }

  await connectDB();
  await seedDefaultCategories();

  dbInitialized = true;
};

const startServer = async () => {
  await initializeDatabase();

  const server = app.listen(env.port, () => {
    logger.info(
      `Server running in ${env.nodeEnv} mode on port ${env.port}`
    );
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection - shutting down', {
      message: err.message,
    });

    server.close(() => process.exit(1));
  });
};

if (process.env.VERCEL) {
  // Vercel/serverless initialization
  await initializeDatabase();
} else {
  // Local development
  startServer();
}

export default app;