// src/app.js
//
// WHY THIS FILE EXISTS:
// This file defines WHAT the Express application is -- its
// middleware pipeline, its routes, its error handling -- without
// starting it. It deliberately never calls app.listen().
//
// Why that matters: this file can be imported directly by a test
// file later (e.g. using supertest) to send fake requests through
// the full middleware/route pipeline WITHOUT opening a real network
// port. That's not possible if listen() lives in the same file as
// the app definition.
//
// Route modules are intentionally NOT wired in yet -- we haven't
// built any modules (users/categories/expenses) yet. We're building
// the skeleton first, and will mount each module's routes here as
// we build them in upcoming milestones.

import express from 'express';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import cors from 'cors'


const app = express();

// --- Global Middleware ---
//
// Order matters here. Middleware runs top-to-bottom for every
// request, so things every request needs (parsing, logging) go
// first; things specific to certain routes get mounted later.

// Parses incoming JSON request bodies into req.body.
// Without this, req.body is undefined for any POST/PUT/PATCH request
// with a JSON payload -- one of the most common beginner "why is
// req.body undefined" bugs.


app.use(cors({
  origin: 'http://localhost:5173', // your Vite dev server
  credentials: true, // harmless here since we use Bearer tokens, not cookies — but fine to include
}))


app.use(express.json());

// HTTP request logging. 'dev' format is concise and colorized --
// good for local development. We'll only enable it outside tests
// once we introduce a test suite, to keep test output clean.
app.use(morgan('dev'));

// --- Health Check Route ---
//
// A minimal route with no dependencies on the database or any
// module. Its purpose: let us (or a deployment platform, or a
// monitoring tool) verify the server process is alive and responding,
// separate from whether the database connection is healthy.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Feature Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);

// --- 404 Handler ---
// Must come AFTER all real routes -- Express matches routes in the
// order they're registered, so this only fires if nothing above matched.
app.use(notFoundHandler);

// --- Global Error Handler ---
// Must be the LAST app.use() call. Express identifies error-handling
// middleware specifically by its four-parameter signature
// (err, req, res, next), and only routes errors to middleware
// registered with that signature.
app.use(errorHandler);

export default app;
