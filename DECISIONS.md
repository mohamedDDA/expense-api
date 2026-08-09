# DECISIONS.md — Architectural Decision Log

---

### Decision: Category ownership modeled with a nullable `owner` field, not two separate models.

**Reason:** A default category and a user-created category have identical shape and behavior — the only difference is who (if anyone) owns it. Splitting into two models would duplicate schema and force queries to merge two collections for something as simple as "list categories available to this user."

**Alternative:** Separate `DefaultCategory` and `UserCategory` models.

**Why rejected:** No architectural benefit, only duplication. Violates DRY without solving a real problem.

---

### Decision: Ownership/authorization checks live in the service layer, not controllers.

**Reason:** Ownership checks are business rules, not HTTP concerns. If they lived in controllers, they'd need to be duplicated anywhere else the same operation could be triggered (e.g. an admin tool, background job).

**Alternative:** Perform ownership checks inline in each controller.

**Why rejected:** Leads to duplicated, inconsistent logic scattered across the codebase as the app grows.

---

### Decision: Feature-based folder structure (`modules/<feature>/`) instead of layer-based (`/controllers`, `/services` at root).

**Reason:** Keeps everything related to one feature in one place, reducing the number of folders touched per change and making features easier to reason about or remove cleanly.

**Alternative:** Classic layered MVC folders.

**Why rejected:** Scales poorly past a handful of resources — layer folders become large, unsorted collections of unrelated files.

---

### Decision: Shared cross-cutting code (`authenticate.js`, `errorHandler.js`, `validate.js`) lives in a top-level `middleware/` folder, not inside any feature module.

**Reason:** These are used by multiple modules, not owned by one. Placing them inside a single module would create cross-module coupling — other modules importing another module's internals.

**Alternative:** Place `authenticate.js` inside `modules/auth/`.

**Why rejected:** Would force `categories/` and `expenses/` to import from `auth/`'s internals, coupling unrelated features together.

---

### Decision: Repository layer included, separate from service layer.

**Reason:** We anticipate non-trivial queries (e.g. `owner: null OR owner: userId`) and want business logic (services) decoupled from the specific database technology (Mongoose/MongoDB), so a future DB or ORM change wouldn't touch business logic.

**Alternative:** Query the database directly from services.

**Why rejected (for this project):** We have a concrete, known need for query abstraction. Note: if the project had only trivial `findById`-style queries, we would reject the repository layer as unnecessary indirection — the decision is justified by actual complexity, not by habit.

---

### Decision: Use `bcryptjs` instead of native `bcrypt`.

**Reason:** Pure JavaScript implementation avoids native compilation issues across environments (e.g. different OS/Docker base images), at the cost of some raw speed.

**Alternative:** Native `bcrypt`.

**Why rejected (for now):** Reliability and portability matter more than marginal speed for a project at this scale. Would reconsider for a high-throughput production auth service.

---

### Decision: No default fallback value for `JWT_SECRET` or `MONGODB_URI`; app throws on startup if missing.

**Reason:** A working fallback secret is a silent security vulnerability if it ever reaches production. Failing fast at startup surfaces the problem immediately instead of allowing a misconfigured deployment to run.

**Alternative:** `process.env.JWT_SECRET || 'some-default'`.

**Why rejected:** Extremely common real-world vulnerability pattern — never acceptable for secrets.

---

### Decision: Explicit `serverSelectionTimeoutMS: 5000` on MongoDB connection.

**Reason:** Mongoose's default server-selection timeout is 30 seconds. Discovered via testing (not planning) that this makes local development painfully slow when the database isn't running yet -- every restart during iteration would hang for 30s before failing. 5s gives fast feedback locally while still being generous enough to tolerate brief network blips in production.

**Alternative:** Leave the 30s default.

**Why rejected:** No benefit to the long default during local development; a real production outage lasting more than 5s would fail regardless of whether the timeout is 5s or 30s, so we lose little by shortening it.

---

### Decision: Authenticate middleware fetches the full User from the database on every request, rather than trusting the decoded JWT payload alone.

**Reason:** JWTs cannot be revoked before their natural expiry. If we trusted only the payload, a deleted or otherwise invalidated user's token would keep working perfectly until it expired on its own. One indexed `findById` query per request buys immediate correctness when a user is deleted.

**Alternative:** Trust the decoded JWT payload (`{ userId }`) directly, skip the DB lookup.

**Why rejected (for now):** We have no scale pressure that would make an extra indexed lookup per request costly, and the correctness guarantee (deletions take effect immediately) is worth more than the marginal performance at this stage. Revisit if/when this becomes a measured bottleneck — not before.

---

### Decision: `authenticate` middleware is NOT applied globally (`app.use(authenticate)`); it will be mounted selectively on protected route groups only.

**Reason:** Public routes (`/api/auth/register`, `/api/auth/login`) must work without a token by definition. Applying auth globally would require an exception list of unprotected paths, which is fragile and easy to misconfigure as routes grow. Selective mounting makes "this route is protected" visible directly at the route-registration site.

**Alternative:** Global middleware with a path-exclusion list.

**Why rejected:** Exclusion lists are a common source of accidental security holes -- forgetting to add a new public route to the list silently makes it require auth, or worse, forgetting to add a new PROTECTED route means it stays open.

---

### Decision: Lightweight custom logger instead of Winston/Pino, for now.

**Reason:** Current project scale doesn't justify the configuration overhead of a full logging library. A thin wrapper still gives us the ability to swap implementations later without touching call sites elsewhere in the app.

**Alternative:** Adopt Pino or Winston immediately.

**Why rejected (for now):** Premature — no current need for structured JSON logs or log-level filtering by environment. Revisit if/when observability requirements grow.

---

### Decision: Category deletion reassigns referencing expenses to a seeded default "Others" category rather than blocking the delete or cascading.

**Reason:** Blocking forces users into a dead end with no path forward. Cascading (deleting the expenses too) destroys financial history, which is unacceptable for an expense tracker. Reassignment preserves data while still letting users clean up their category list.

**Alternative:** Block delete if expenses reference the category; or cascade-delete those expenses.

**Why rejected:** Block has no resolution path for the user; cascade silently destroys real financial data, a worse failure mode than a category disappearing.

---

### Decision: Default categories (including the fallback "Others") are created via an idempotent startup seed script, not manually inserted into the database.

**Reason:** Manual insertion only "works" on whichever single database it was run against — it silently fails to reproduce in any fresh environment (a teammate's clone, CI, staging, a new deployment). A seed script guarantees the same shared data exists identically everywhere the app runs.

**Alternative considered (raised, and correctly partially argued for, by the developer):** Skip the seed script; just "add Others as a default category" like any other.

**Why the alternative's conclusion doesn't follow from its premise:** The premise was correct — "Others" IS just a normal default category, no special shape needed, and is now seeded identically to Food/Transport/etc. But "just add it" still requires SOME mechanism to create it in the database — a seed script is that mechanism. The seed was kept, and generalized to a small default category list, directly incorporating the valid part of the pushback (Others deserves no special-casing) without accepting the invalid conclusion (that no seed is needed at all).

---

### Decision: `category.service.js` imports `expenseRepository` directly — a narrow, deliberate exception to the "modules don't import each other's internals" rule from Milestone 2.

**Reason:** Category deletion has a side effect on Expense records (reassignment). The repository is a thin, already-owner-scoped data access surface — importing the full `expense.service.js` would pull in unrelated business rules (like category-visibility validation on create) that don't apply to this operation.

**Alternative:** Move reassignment logic into `expense.service.js`; have `category.service.js` call that instead.

**Why rejected:** Doesn't remove the coupling, just relocates it. Deletion is fundamentally a Category-owned operation with a side effect on Expense data, so keeping the logic in `category.service.js` reflects where it conceptually belongs.

---

### Decision: Validation lives in its own middleware layer (Zod schemas + a `validate()` factory), not inside controllers or services.

**Reason:** Input validation ("is this data well-formed") is answerable without any database lookup or knowledge of who's asking — fundamentally different from business logic (like ownership checks), which requires both. Running it as middleware, before controllers execute, means malformed requests are rejected with a clean 400 before touching business logic or the database at all.

**Alternative considered (raised by the developer):** Put validation inside the service layer, reasoning it's "business logic too."

**Why rejected:** Conflates two genuinely different questions. "Is amount a positive number" has the same answer for every user, every time — no lookup needed. "Does this category belong to this user" requires a DB query and the specific requester's identity. Putting shape-validation in the service would also duplicate the same checks across every service method handling that data, and would let malformed data travel further into the app (through the controller, into the service) before being rejected.

---

### Decision: Login schema requires only a non-empty password (`min(1)`), not the same `min(8)` rule as registration.

**Reason:** Login validation must not leak information about account creation policy. If login rejected short passwords with the same message as registration, an attacker could use that response to infer password rules without ever needing a real account. The actual correctness check happens against the stored hash inside `authService.login`, not in the validation layer.

**Alternative:** Reuse the same password schema for both register and login.

**Why rejected:** Minor convenience, real information-leak risk — not worth it.

---

### Decision (bugfix): Zod's date validation uses `z.coerce.date('message')` (v4 syntax), not `z.coerce.date({ errorMap: ... })` (v3 syntax).

**Reason:** The installed version is Zod v4, which changed how custom error messages are attached to schemas. The v3-style `errorMap` option is silently ignored in v4 rather than throwing an error — meaning the bug would not have been caught by simply reading the code or by TypeScript-less linting. Caught only by actually running every validation branch and inspecting real output.

**Lesson logged, not just a fix:** "the code looks syntactically plausible" is not the same claim as "the code is verified correct" — especially across library major-version boundaries, where APIs can change silently without an error at the call site.

---

### Decision: "Total spent per category" is computed via a MongoDB aggregation pipeline, run server-side inside the database — not in the frontend, and not by pulling raw records into Node and summing in JavaScript.

**Reason:** Computing sums client-side (frontend) or in application code both repeat the same anti-pattern identified in Milestone 8 (JS `.filter()` instead of a Mongo query) at different layers of the stack. Both require transmitting every individual expense record just to produce a handful of aggregate numbers -- costing bandwidth, exposing raw transaction data unnecessarily, and forcing every client (each browser tab, each device) to redo the same computation from scratch. An aggregation pipeline lets MongoDB filter, group, and sum using its own engine and indexes, returning only the small final result set.

**Alternative considered (raised by the developer):** Compute totals in the frontend, from the full list of raw expenses.

**Why rejected:** Same class of mistake as pulling a full collection into memory to `.filter()` in JS -- just relocated to an even less capable environment (the browser, over a slower network link), and with the added cost of unnecessarily exposing every raw expense record to compute a number that doesn't require them.

---

### Decision: The `/totals` route is registered before any `/:id` route in `expense.routes.js`.

**Reason:** Express matches routes top-to-bottom, and `/:id` is a wildcard that matches any path segment, including the literal string "totals". Registering `/:id` first would cause `GET /api/expenses/totals` to be misinterpreted as "get the expense with id=totals" and fail with a confusing 404, never reaching the aggregation handler.

**Lesson logged:** route registration order is not cosmetic -- it is part of the actual routing logic, and any literal-path route that could collide with a wildcard param route must be registered first.

---

### Decision: `errorHandler.js` logs operational errors (expected, user-caused) at `warn` level without a stack trace, and non-operational errors (unexpected bugs) at `error` level with a full stack trace.

**Reason (developer-driven):** These two error categories serve different purposes for whoever reads the logs. Non-operational errors are bugs needing immediate attention. Operational errors (like "category not found" or a validation rejection) aren't incidents — they're potential UX signals. A repeated pattern of the same validation error may indicate unclear UI/UX rather than user carelessness, and that's a different kind of insight than "the app is broken."

**Alternative:** Log every error at the same level regardless of cause (the original Milestone 4 implementation).

**Why rejected:** Collapses two different signals (bugs vs. UX friction) into one noisy stream, making it harder to either react quickly to real bugs or later mine expected-error logs for product feedback.

**Note:** currently both log levels write to the same destination (stdout) — genuinely separating them (e.g., error-level to an alerting channel, warn-level to a searchable analytics store) is a real next step, not yet implemented, since no external logging service is wired up at this project's scale.
