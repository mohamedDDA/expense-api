# LEARNING.md — My Personal Notebook

## Milestone 1 — Project Planning

**New concepts:**
- Nullable ownership pattern (`owner: null` vs `owner: userId`) to model shared + user-owned resources in a single schema, avoiding duplicated models.
- Why ownership/authorization checks belong in the **service layer**, not the controller: it's a business rule, and business rules need to be enforced consistently no matter what entry point (HTTP route, CLI, background job) triggers them.

**Vocabulary:**
- **Ownership enforcement** — verifying a user is allowed to modify a specific resource, not just that they're logged in.
- **Authentication vs Authorization** — authentication = "who are you," authorization = "are you allowed to do this."

**Questions I should ask myself:**
- When I add a new mutation (update/delete) to any resource, have I checked *both* "is this default/shared data" and "is this someone else's data"?

---

## Milestone 2 — Folder Structure

**New concepts:**
- Feature-based (`modules/`) vs layer-based (`/controllers`, `/services`) folder organization, and why feature-based scales better past a handful of resources.
- The "does this belong to one feature or many?" test for deciding whether a file lives inside a module or in a shared top-level folder (`middleware/`, `utils/`, `config/`).
- Cross-module coupling as a folder-structure smell: if one module imports internals from a sibling module, that file probably doesn't belong to either.

**Best practices:**
- Don't add an abstraction (like a repository layer) unless there's an actual requirement driving it — in our case, the `owner: null OR owner: userId` query pattern.

**Common mistakes to avoid:**
- Copy-pasting authorization checks into every controller instead of centralizing them in the service layer.
- Importing directly across sibling modules instead of promoting shared code up a level.

**Questions I should ask myself:**
- "If I deleted this file, would only one feature break, or would several unrelated features break?"

---

## Milestone 3 — Project Bootstrap

**New concepts:**
- `"type": "module"` in package.json and why it must be set before any ES module syntax will run.
- Fail-fast environment validation: crash on startup if required env vars are missing, rather than defaulting silently.
- Why a logging abstraction (even a tiny one) beats scattered `console.log` calls — swappable later without touching call sites.

**Vocabulary:**
- **Fail fast** — surfacing configuration/setup errors immediately at startup instead of letting them cause confusing failures later, deeper in the app.
- **Native addon vs pure JS package** (`bcrypt` vs `bcryptjs`) — native is faster but requires compilation; pure JS trades some speed for portability.

**Best practices:**
- Never provide a fallback default for secrets (e.g. `JWT_SECRET`) — a working fallback in production is a silent security hole.
- Document *why* a simpler tool was chosen (inline comments), so it isn't "fixed" into unnecessary complexity later by someone who assumes it was an oversight.

**Common mistakes to avoid:**
- `process.env.SECRET || 'fallback'` — feels helpful, is actually a vulnerability.
- Installing testing/linting tools before there's a real need for them.

**Questions I should ask myself:**
- Am I adding this dependency/tool because I need it right now, or because "every project has it"?

---

## Milestone 4 — Express Server Foundation

**New concepts:**
- Splitting `app.js` (defines the app) from `server.js` (runs the app) for testability — `app.js` can be imported by tests without opening a real network port.
- Express treats any middleware with exactly 4 parameters `(err, req, res, next)` as error-handling middleware, and routes thrown/forwarded errors to it automatically.
- `asyncHandler` pattern — Express does NOT catch rejected promises in async route handlers by default; unhandled ones fail silently unless wrapped.
- Principle of least information: never expose more detail in an error response than the client needs — applies to `err.message` from unexpected (non-operational) errors, which may leak infrastructure details.

**Vocabulary:**
- **Operational error** — an expected, deliberately-thrown error we authored ourselves (e.g. "Category not found"), safe to show a client.
- **Non-operational error** — an unexpected failure from a dependency/bug, whose raw message may leak internal details and should never reach the client directly.

**Common mistakes to avoid:**
- Wrapping every controller in repetitive try/catch instead of using a single `asyncHandler` wrapper.
- Always showing the real `err.message` to clients "to be transparent" — this leaks infrastructure/internal details for errors we didn't author.

**Questions I should ask myself:**
- Did I author this exact error message, or is it coming from a library/dependency I don't fully control?

---

## Milestone 5 — MongoDB Connection

**New concepts:**
- Connect to the database BEFORE calling `app.listen()` — never accept HTTP traffic before dependencies are confirmed reachable.
- Mongoose's default `serverSelectionTimeoutMS` is 30 seconds — a real, easy-to-miss detail that only surfaced by actually running the code, not by reading documentation summaries.

**Best practices:**
- Verify assumptions by running the code, not just writing it — a `str_replace` edit left a duplicate block in `server.js`; only caught it by re-viewing the file before moving on.
- Tune default library timeouts deliberately (fast for local dev, still tolerant enough for production) rather than accepting defaults unexamined.

**Questions I should ask myself:**
- After I edit a file, did I actually re-read it to confirm the edit did what I intended?
- Am I accepting a library's default configuration because I evaluated it, or just because I never looked?

---

## Milestone 6 — User Model + Auth (Register/Login)

**New concepts:**
- JWTs are self-contained and signed (not encrypted) — anyone can decode the payload, so never put sensitive data (passwords, hashes) inside one. The signature only prevents tampering, not reading.
- User enumeration vulnerability: returning different error messages for "no such user" vs "wrong password" lets attackers discover which emails have accounts. Always return an identical generic message for both.
- A thin abstraction (like `user.repository.js`) can be worth keeping even when today's implementation is trivial — the value is the *boundary* it enforces between business logic and persistence, not the current line count.
- Overriding `toJSON` on a Mongoose model to strip sensitive fields (like `passwordHash`) is defense-in-depth: it protects against every future controller forgetting to strip it manually.

**Vocabulary:**
- **Salt rounds (bcrypt)** — cost factor controlling how slow/expensive hashing is; higher = more brute-force resistant, at the cost of CPU time.
- **User enumeration** — a vulnerability class where an attacker learns which accounts exist by observing differences in error responses.

**Design decisions:**
- User model deliberately excludes speculative fields (`role`, `isVerified`, `refreshToken`) — nothing in current scope reads or acts on them. Add only when a real feature needs them.
- Password hashing happens in the service layer, never inside the model — keeps business logic out of the data layer.

**Common mistakes to avoid:**
- Returning different login error messages for bad email vs bad password.
- Storing raw passwords or accepting a raw `password` field anywhere on the model itself.
- Adding "just in case" schema fields with no current consumer.

**Questions I should ask myself:**
- If I strip this environment of its convenience (no test DB available), have I still verified everything I actually can, and been honest about what I couldn't?

---

## Milestone 7 — Auth Middleware

**New concepts:**
- Auth middleware doesn't need `express.json()` to run first, since tokens travel in the `Authorization` header, not the request body — but this raised the real question of whether auth should be global or per-route.
- Global middleware with a path-exclusion list is fragile — a forgotten route (new public OR new protected one) silently breaks security. Selective mounting per route group is safer and more visible.
- The trust-token vs. re-verify-against-DB tradeoff for JWT auth: trusting the payload alone is faster but can't reflect a user deletion until the token naturally expires.
- `jwt.verify()` throws for both invalid signatures AND expired tokens — deliberately not distinguished to the client, since the correct client action ("log in again") is identical either way.

**Vocabulary:**
- **Token revocation** — invalidating a token before its natural expiry; JWTs have no built-in way to do this, which is the core tradeoff of stateless auth.

**Best practices:**
- Test security-critical logic (signature verification, expiry) in isolation when a full integration test isn't possible — don't skip verification just because the "ideal" test setup isn't available.

**Questions I should ask myself:**
- For any tradeoff I make "for now" (like trusting a DB lookup over raw token trust), do I have a clear trigger for when I'd revisit it — not just a vague "later"?

---

## Milestone 8 — Category Resource (Ownership Enforcement in Practice)

**New concepts:**
- Never use JS Array `.filter()` on data pulled from a full `.find({})` — this loads the ENTIRE collection into memory first. Pass filter logic into the query itself (`.find({ $or: [...] })`) so the database does the filtering using its indexes.
- `{ new: true }` on `findByIdAndUpdate` — without it, Mongoose returns the PRE-update document, not the updated one.
- `{ runValidators: true }` on `findByIdAndUpdate` — without it, schema validation only runs on `.create()`, silently NOT on updates.
- Comparing a Mongoose ObjectId to a string requires `.equals()`, not `===` — they're different JS types even when they represent the same ID.
- Centralizing a repeated authorization check (`assertCanModify`) in one function instead of duplicating it in both update and delete, so the rule can't drift out of sync between the two.

**Vocabulary:**
- **204 No Content** — correct HTTP status for a successful response with no body (e.g. DELETE), distinct from 200 OK with an empty object.

**Design decisions:**
- Kept "default category" and "not your category" as separate error messages/checks rather than one generic rejection — specific errors are more debuggable and better UX, even though a single combined check would technically work.

**Common mistakes to avoid:**
- Filtering in application code (JS `.filter()`) what should be filtered in the database query — invisible bug at small scale, real performance problem at production scale.
- Assuming schema validation always applies — it doesn't, unless `runValidators: true` is explicitly set on update operations.

**Questions I should ask myself:**
- Is this filtering/sorting/limiting logic happening inside the database query, or did I accidentally pull everything into memory first?

---

## Milestone 9 — Expense Resource + Category Deletion Fallback

**New concepts:**
- IDOR (Insecure Direct Object Reference) — the vulnerability class where an API trusts a client-supplied ID without verifying the requester is actually allowed to access/reference it. The frontend hiding an option is NOT a security control; the backend is the only real trust boundary.
- Validation of related-resource ownership (categoryId on an Expense) has to happen at EVERY mutation point that can set/change it — not just once at creation. Missing it on update reopens the exact same hole.
- Reused visibility logic (`assertVisibleToUser`) intentionally returns 404, not 403, for "exists but not yours" — consistent with the user-enumeration principle from Milestone 6, applied to a different resource.
- Different resources can justify different implementation shapes for what looks like "the same" ownership concept — Category needed fetch-then-check (due to the nullable/shared case), Expense could fold ownership directly into the query (no shared-record case to reason about). Copying one pattern onto the other "for consistency" would have been the wrong call.
- Seed scripts are the professional mechanism for guaranteeing shared data exists identically across every environment (dev, teammate's machine, CI, prod) — manual DB inserts don't reproduce anywhere except the one database they were run against.

**Vocabulary:**
- **IDOR (Insecure Direct Object Reference)** — a vulnerability where referencing another user's resource by ID succeeds because the backend never checked ownership/visibility.
- **Idempotent (seed script)** — safe to run repeatedly without creating duplicates; achieved here by checking existence before creating.

**Design decisions:**
- Category deletion reassigns referencing expenses to a seeded "Others" fallback, rather than blocking or cascading — preserves financial history while still letting users clean up categories.
- Accepted one narrow, explicitly-justified exception to "modules don't import each other's internals": `category.service.js` imports `expenseRepository` directly for the reassignment side effect, rather than hiding the same coupling inside `expense.service.js` instead.

**Common mistakes to avoid:**
- Trusting a client-supplied foreign-key ID (like categoryId) without verifying the referenced resource exists and is visible to the requester.
- Assuming "the frontend won't show that option" is a security control — it isn't; anyone can call the API directly.
- Relying on a manually-run database command to set up "required" data instead of an idempotent seed script.

**Questions I should ask myself:**
- For any ID a client sends me that references another resource, have I verified BOTH that it exists AND that this specific user is allowed to reference it — everywhere it can be set, not just at creation?
- If I removed this piece of infrastructure (like a seed script), would the thing it guarantees still be true in a brand new environment, or only on my machine?

---

## Milestone 10 — Centralized Validation Layer

**New concepts:**
- The dividing line between validation and business logic: validation answers "is this well-formed" with no lookup needed and the same answer for everyone; business logic requires a database query and knowledge of who's asking. This distinction determines which layer a check belongs in.
- Zod schemas as reusable, composable validation definitions — `.partial()` derives an "update" schema from a "create" schema automatically, avoiding duplicated field definitions that could drift apart.
- `z.coerce.date()` converts JSON string dates into real JS Date objects during validation — necessary because JSON has no native date type.
- Login validation deliberately uses weaker rules than registration validation for the same field (password) — to avoid leaking account-policy information to an attacker probing the login endpoint.
- Synchronous middleware (like `validate.js`) can `throw` directly and Express catches it automatically — `asyncHandler` is only needed for code that returns a Promise (async functions), not synchronous throws.

**Vocabulary:**
- **Schema validation** — checking that data matches an expected shape/type/format, independent of any business rule or database state.

**Best practices:**
- Test every branch of new logic (valid case AND each distinct invalid case) rather than assuming code is correct because it reads correctly — this caught a real Zod v3-vs-v4 API mismatch that would otherwise have shipped silently.
- Order middleware deliberately: authenticate before validate on protected routes, so unauthorized requests are rejected before the server does any work checking body shape.

**Common mistakes to avoid:**
- Assuming a library's API is stable across major versions without checking — `errorMap` (Zod v3) being silently ignored in v4 is exactly the kind of change that produces no error message, just wrong behavior.
- Duplicating validation logic across create/update schemas instead of deriving one from the other.

**Questions I should ask myself:**
- Have I actually run this code against both valid AND invalid inputs, or am I trusting that it "looks right"?
- Does this check need to know WHO is asking or WHAT exists in the database? If not, it belongs in validation, not the service layer.

---

## Milestone 11 — Aggregation / Business Logic (Totals by Category)

**New concepts:**
- MongoDB aggregation pipelines (`$match`, `$group`, `$lookup`, `$unwind`, `$project`, `$sort`) let the database compute sums/groupings internally, returning only the final small result set — the correct alternative to pulling raw records into any application layer (backend OR frontend) just to sum them.
- Computing aggregates client-side isn't a valid alternative to computing them in application code — it's the exact same anti-pattern (filtering/summing outside the database) relocated to an even less capable environment, with the added cost of exposing raw records unnecessarily.
- `new Date(undefined)` produces an `Invalid Date` object silently, not `undefined` — a real footgun when converting optional query-string params to Date objects; must be handled explicitly.
- Express route ordering is functional, not cosmetic: a literal-path route (`/totals`) must be registered before a wildcard param route (`/:id`) that could otherwise swallow it.
- The "day 0 of next month" trick for computing a month's last day handles leap years correctly with no special-casing, because it delegates the actual day-counting to the Date engine itself rather than hardcoding month lengths.

**Vocabulary:**
- **Aggregation pipeline** — a sequence of data-transformation stages (filter, group, join, reshape) executed inside the database engine, rather than in application code after data is fetched.
- **$lookup** — MongoDB's aggregation-stage equivalent of a SQL join, used here to attach category names to grouped totals without a second query round-trip.

**Design decisions:**
- "Current month" defaults when no explicit date range is given — this business rule lives in the service layer, not the controller, consistent with our HTTP-concerns-vs-business-rules separation from Milestone 6.

**Common mistakes to avoid:**
- Assuming an aggregate/summary value should be computed wherever the data ends up (frontend) rather than at its source (the database) — proximity to the data, not proximity to the UI, should drive where a computation runs.
- Registering wildcard routes (`/:id`) before literal-path routes (`/totals`) that share a prefix.

**Questions I should ask myself:**
- Am I computing this aggregate as close to the data as possible, or have I let it drift toward whichever layer is easiest to write code in?
- If I introduce a new literal route, does it collide with an existing wildcard route, and is it registered first?

---

## Milestone 12 — Log Level Separation (Observability)

**New concepts:**
- Logs serve different audiences depending on level: `error` logs are for immediate action (something the app did wrong); `warn` logs on expected user errors can be mined later for product/UX insight (something users keep doing wrong, which may mean the UI isn't clear), not reacted to individually.
- This distinction was reasoned out from first principles ("what do I actually want to see in my logs, and what do I not care about per-incident") rather than applied as a rule — a good example of deriving a design choice from actual need, the same pattern used for the repository layer back in Milestone 2.

**Vocabulary:**
- **Error-driven product feedback** — using aggregated operational-error logs (repeated validation failures, repeated 404s) as a signal for UX/product issues, not just as debugging data.

**Design decisions:**
- Operational (expected) errors log at `warn`, without a stack trace — there's no bug location to report, and including one would be noise.
- Non-operational (unexpected) errors log at `error`, with a full stack trace — this is the signal that should get immediate attention in a real production setup.

**Questions I should ask myself:**
- When I log something, am I logging it for "someone needs to react to this now" or "this is worth reviewing in aggregate later" — and does my log level actually reflect that difference?
