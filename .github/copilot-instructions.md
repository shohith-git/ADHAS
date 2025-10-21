# Copilot instructions for ADHAS

This file tells AI coding agents what developers expect when editing the ADHAS codebase. Keep entries short and actionable; reference files below when in doubt.

Core architecture
- Backend: Node/Express app in `backend/` using PostgreSQL via `backend/db.js` (pg Pool). Entry: `backend/server.js` which mounts routes under `/api/*` (see `routes/`).
- Frontend: Expo React Native app in `frontend/` (file-based routing under `app/`). Entry via Expo: `frontend/package.json` scripts (`npm run start`, `npm run android`).

Auth & security patterns
- JWT auth is used. Tokens are expected in the HTTP `Authorization` header as `Bearer <token>` (see `backend/middleware/authMiddleware.js`).
- Role-based checks: `admin`, `warden`, `student`. Use `authMiddleware` then role checks (e.g. `isAdmin`) for protected routes (`backend/routes/userRoutes.js`, `controllers/userController.js`).

Database / data flow
- PostgreSQL connection is configured through env vars used by `backend/db.js` (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).
- SQL queries use parameterized queries with `pg` Pool (examples in `controllers/*.js`). Prefer this pattern when adding DB access.

Developer workflows (how to run locally)
- Backend:
  - Install: run `npm install` inside `backend/`.
  - Start: `npm run start` (or `npm run dev` to use nodemon).
  - Requires environment variables (`.env`) for DB and `JWT_SECRET`.
- Frontend (Expo):
  - Install: run `npm install` inside `frontend/`.
  - Start dev server: `npm run start` (uses `expo start`).
  - Run on Android: `npm run android` (requires Android emulator or device).

Project conventions and examples
- Error handling: controllers log errors with `console.error(err)` and respond with 5xx and a short message (see `controllers/*`). Follow this concise pattern.
- Routes: keep route handlers in `backend/routes/*.js` and business logic in `backend/controllers/*.js`.
- Request/response shape examples:
  - Login returns `{ message, token, user }` (see `routes/authRoutes.js` and `controllers/userController.js`).
  - Mark attendance: POST `attendance` expects `{ student_id, method, location }` and returns created row (see `controllers/attendanceController.js`).

Integration points
- Frontend talks to backend REST endpoints under `/api/*`. Typical endpoints: `/api/auth/*`, `/api/users/*`, `/api/rooms/*`, `/api/attendance/*`, `/api/complaints/*` (mounted in `backend/server.js`).
- Use JWT token returned from login for authenticated requests in `Authorization: Bearer <token>` header.

When editing code
- Preserve existing patterns: keep SQL parameterization, keep JWT usage and role checks, keep controllers thin and focused on DB + request validation.
- If adding new env vars, document them in README or add a `.env.example` (none currently present).

Files to inspect for examples
- `backend/server.js`, `backend/db.js`, `backend/middleware/authMiddleware.js`
- `backend/routes/*.js`, `backend/controllers/*.js`
- `frontend/package.json`, `frontend/app/` (file-based routes)

If something is unclear
- Ask the maintainers for expected env values and database schema before making breaking changes. Where behavior can't be inferred from code (for example, expected DB table columns), prefer adding a migration or `.sql` description and request review.

Request feedback below after reading this file so we can iterate.
