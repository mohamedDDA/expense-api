# Expense Tracker API

A multi-user REST API for tracking personal expenses, built with Express and MongoDB. Built as a guided learning project focused on backend architecture, not just working code — see `LEARNING.md` and `DECISIONS.md` for the reasoning behind every major choice.

## Overview

Each user registers, logs in, and manages their own expenses, organized into categories. Categories come in two flavors:

- **Default categories** (Food, Transport, Utilities, Entertainment, Others) — shared, visible to every user, seeded automatically at startup.
- **User-created categories** — private to whoever created them.

Every expense belongs to exactly one user and references one category (default or their own). Deleting a category that still has expenses attached reassigns those expenses to a fallback "Others" category rather than blocking the deletion or destroying data.

## Architecture

Feature-based, layered architecture: **routes → controllers → services → repositories → models**. See `ARCHITECTURE.md` for the full request lifecycle and the reasoning behind this structure.

```
src/
├── config/       # env validation, DB connection, logger, startup seeding
├── middleware/   # authenticate, validate, centralized error handling
├── modules/      # one folder per feature: users, auth, categories, expenses
├── utils/        # AppError, asyncHandler
├── app.js        # Express app definition (no .listen())
└── server.js     # process entry point: connects DB, seeds defaults, starts listening
```

Each module under `modules/` follows the same internal shape:
```
modules/<feature>/
├── <feature>.model.js       # Mongoose schema
├── <feature>.repository.js  # database queries only
├── <feature>.service.js     # business rules, ownership checks
├── <feature>.controller.js  # thin HTTP layer
├── <feature>.routes.js      # route wiring
└── <feature>.validation.js  # Zod request-body schemas
```

## Setup

**Requirements:** Node.js 20+, a running MongoDB instance (local or Atlas).

```bash
npm install
cp .env.example .env
# edit .env: set MONGODB_URI and a real JWT_SECRET
npm run dev
```

On startup, the server connects to MongoDB, seeds default categories (idempotent — safe on every restart), then starts listening. If `MONGODB_URI` or `JWT_SECRET` is missing from `.env`, the app refuses to start and tells you exactly what's missing (see `DECISIONS.md` for why).

## API Endpoints

All endpoints are prefixed with `/api`. Endpoints marked 🔒 require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account, returns a user object + JWT |
| POST | `/auth/login` | Authenticate, returns a user object + JWT |

### Categories 🔒
| Method | Path | Description |
|---|---|---|
| GET | `/categories` | List categories visible to you (defaults + your own) |
| POST | `/categories` | Create a category (always owned by you) |
| PUT | `/categories/:id` | Rename your own category (default categories rejected) |
| DELETE | `/categories/:id` | Delete your own category; reassigns any referencing expenses to "Others" |

### Expenses 🔒
| Method | Path | Description |
|---|---|---|
| GET | `/expenses` | List your expenses (with category populated) |
| POST | `/expenses` | Create an expense (category must exist and be visible to you) |
| PUT | `/expenses/:id` | Update your own expense |
| DELETE | `/expenses/:id` | Delete your own expense |
| GET | `/expenses/totals` | Total spent per category, computed server-side via aggregation. Defaults to the current month; accepts `?startDate=&endDate=` (ISO date strings) for a custom range |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check — confirms the process is running (does not check DB status) |

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Run the server (production) |
| `npm run dev` | Run the server with Node's built-in `--watch` (auto-restart on file changes) |

## Future Improvements

Deliberately out of scope for this project, but worth knowing about — see the "What would change in a large production system" section of each milestone's self-review in `LEARNING.md` for the full reasoning:

- Automated tests (unit + integration) — see Milestone 14
- Refresh token rotation / token revocation (JWTs currently can't be invalidated before expiry)
- Pagination on list endpoints
- MongoDB transactions around the category-delete reassignment flow
- Structured JSON logging + shipping logs to an external service
- Rate limiting (especially on `/auth/login`)

## Project Documentation

- `ARCHITECTURE.md` — request lifecycle, folder responsibilities, dependency flow
- `DECISIONS.md` — a log of every architectural decision made and why
- `LEARNING.md` — a running notebook of concepts, vocabulary, and lessons from building this project
