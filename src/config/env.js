// src/config/env.js
//
// WHY THIS FILE EXISTS:
// Environment variables are the standard way to inject configuration
// (secrets, connection strings, ports) into an app without hardcoding
// them into source code. But process.env values are always strings,
// always optional, and always silently `undefined` if you typo a name.
//
// Instead of letting every file in the project reach into process.env
// directly, we read and validate all of it ONCE, here, at startup.
// Every other file imports the validated `env` object below.
//
// This means: if a required variable is missing, the app crashes
// immediately on boot with a clear message -- not five minutes later
// when a user tries to log in and JWT signing mysteriously fails.

import dotenv from 'dotenv';

dotenv.config();

const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Fail fast and loud. A backend that starts successfully with
  // missing critical config is far more dangerous than one that
  // refuses to start at all.
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      `Check your .env file against .env.example.`
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
