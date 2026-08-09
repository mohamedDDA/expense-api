# Architecture

## Request Lifecycle

Every request to a protected endpoint (e.g. `POST /api/expenses`) flows through the same pipeline, in this order:

```
1. express.json()        → parses the request body
2. morgan                → logs the incoming request
3. authenticate           → verifies JWT, fetches the user, attaches req.user
4. validate(schema)       → checks req.body against a Zod schema, rejects malformed input
5. controller              → translates HTTP <-> service call
6. service                 → business rules (ownership, cross-resource checks)
7. repository               → database query
8. (response sent, or an error is thrown and caught by errorHandler)
```

**Why this order specifically:**

- `authenticate` runs before `validate` on every protected route. An unauthenticated request is rejected before we spend any effort checking whether its body is well-formed — cheaper, and avoids revealing validation-schema details to a caller who isn't authorized to hit the endpoint at all.
- `validate` runs before the controller, not inside it. Malformed data never reaches business logic — the controller and everything below it can assume `req.body` is already well-formed.
- If anything throws at any stage — a validation failure, an ownership rejection, a database error — it's caught by Express's error-handling convention and routed to `errorHandler.js`, which is the single place that decides the response shape, status code, and log level. No controller has its own bespoke error-handling logic.

Public routes (`/api/auth/register`, `/api/auth/login`) skip step 3 entirely — `authenticate` is mounted selectively per route group, not globally (see `DECISIONS.md` for why).

## Folder Responsibilities

| Folder | Responsibility | Knows about |
|---|---|---|
| `config/` | Startup/bootstrap concerns: env validation, DB connection, logging, default-data seeding | Nothing feature-specific — runs once, before the app accepts traffic |
| `middleware/` | Cross-cutting request-pipeline logic used by multiple modules | HTTP request/response shape; nothing about any single feature's business rules |
| `modules/<feature>/` | Everything specific to one resource/feature | Its own model, business rules, and HTTP surface. Should not import another module's service/controller directly (one narrow, documented exception — see below) |
| `utils/` | Small, dependency-free helpers used across the app | Nothing about Express, MongoDB, or any specific feature |

### Inside each module

| File | Responsibility | Should NOT contain |
|---|---|---|
| `*.model.js` | Data shape + schema-level validation (required fields, types) | Business rules, hashing, ownership logic |
| `*.repository.js` | How to query the database for this resource | Business rules, HTTP concerns |
| `*.service.js` | Business rules: ownership checks, cross-resource validation, coordinating multiple repositories | HTTP concerns (req/res), raw Mongoose queries |
| `*.controller.js` | Translating HTTP request → service call → HTTP response | Business rules, database queries |
| `*.routes.js` | Wiring URLs + HTTP methods to controller functions, mounting middleware | Business rules, request/response shaping |
| `*.validation.js` | Zod schemas describing valid request-body shape | Business rules requiring a database lookup |

## Dependency Flow

Dependencies point in one direction only: **routes → controllers → services → repositories → models.** Nothing below a layer imports from above it — a repository never imports a controller, a model never imports a service.

```
routes.js  →  controller.js  →  service.js  →  repository.js  →  model.js
                                      ↓
                              (may call another
                               module's repository —
                               see exception below)
```

**The one deliberate exception:** `category.service.js` imports `expense.repository.js` directly, to reassign expenses when their category is deleted. This is a narrow, documented exception to "modules don't import each other's internals" — justified because category deletion has a genuine side effect on expense data, and importing the repository (not the full expense service) keeps the coupling as thin as possible. See `DECISIONS.md` for the full reasoning.

Everything in `middleware/` and `utils/` is imported by multiple modules but imports nothing feature-specific back — dependencies flow inward from shared code to feature code, never the reverse.

## Why This Architecture Was Chosen

- **Feature-based over layer-based folders:** keeps everything related to one resource in one place, reducing how many folders a single change touches, and making a feature easy to reason about or remove cleanly as the project grows past a handful of resources.
- **A repository layer, even though some queries are one-liners:** the value isn't today's implementation complexity — it's the boundary it creates between business logic and persistence, so the database technology could change without touching business rules.
- **Ownership/authorization enforced server-side, never assumed from the frontend:** the frontend is not a trust boundary. Every mutation that could affect another user's data is checked independently in the service layer, regardless of what the UI does or doesn't expose.
- **Validation as its own middleware layer, not inside services:** input shape-checking needs no database lookup and has the same answer for every user — a fundamentally different kind of check than business logic, which always requires knowing who's asking and what currently exists.

## Scalability Considerations

This architecture was chosen to be *correct and clear at small-to-medium scale*, not to pre-optimize for scale we don't have evidence we'll need. Specific tradeoffs made deliberately, with the scaling path noted:

- **`authenticate` re-fetches the user from the database on every request**, trading a small performance cost for immediate correctness if a user is deleted. If this became measurably expensive, a short-lived cache (30–60s) would be the natural next step — not implemented, since there's no evidence of that cost mattering yet.
- **No pagination** on `GET /categories` or `GET /expenses`. Fine for a personal expense tracker's realistic data volume; would need cursor- or offset-based pagination if usage patterns changed significantly.
- **Category deletion's reassign-then-delete flow is not wrapped in a database transaction.** A crash between the two steps would leave a recoverable but inconsistent state (expenses reassigned, old category still present). MongoDB transactions require a replica-set-backed deployment, which isn't assumed at this project's scale — noted as a real gap, not hidden.
- **The aggregation endpoint (`/expenses/totals`) recomputes from raw data on every request.** At high read volume, this is the kind of computation that would move toward a pre-aggregated/materialized summary updated incrementally on writes, rather than recomputed live each time.

Each of these is documented here deliberately: the goal is that nothing in this system is simple *by accident* — every simplification was a choice, with a known path forward if the assumption that justified it stops holding.
