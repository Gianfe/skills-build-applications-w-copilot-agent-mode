# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep each route's view in its existing React component and use the shared API client with relative `/api` paths. Render explicit loading, success, empty, and accessible error states; leave API behavior in the logic tier.
- Logic tier decision: Keep Express route handlers thin and delegate validation and persistence behavior to `octofitService.ts`. Return deliberate 4xx responses for invalid input and missing records; never expose Mongoose cast or validation errors as 500 responses.
- Data tier decision: Enforce required fields and sensible defaults in the Mongoose schemas, including an empty default for team members. Keep database access in the existing models and service layer.
- Activity tracking approach: Validate the activity type, positive minutes, and well-formed IDs that refer to an existing user and team. Store the references and submitted values, calculate points as one point per minute, and set `occurredAt` when creating the record.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and validate any supplied member IDs before storing them in the team's `members` array. Keep demo membership consistent when seeding, without deleting unrelated records.
- Leaderboard approach: Sum activity points per team, order totals from highest to lowest, and assign ranks starting at 1 after ordering. Use team name as a stable tie-breaker.
- Workout suggestions approach: Find the user by email and return a deliberate 4xx if no user matches. Prefer workouts matching the user's fitness goal, use recent activity as a fallback, and include a reason that identifies the matching goal or activity.

## Test plan

- Run the narrowest relevant contract test after each change, then run both backend contract suites and the frontend suite before considering the implementation complete.
- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`. A failure points to schema validation/defaults or to seed coverage, idempotence, preservation of unrelated records, or membership reconciliation.
- API command: `npm run test:api --prefix octofit-tracker/backend`. A failure points to request validation/status codes, persisted response fields, point calculations, ranking, or workout recommendation behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend`. A failure points to API-client usage, rendering API data, the requested user, or accessible loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`. A failure indicates TypeScript errors in the backend implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`. A failure indicates TypeScript or Vite production-build errors in the frontend.
- Initial baseline observed on 2026-10-19: the data suite had 4 validation failures while the seed test passed; all 4 API tests failed; all 15 frontend tests failed because the views were still placeholders. Re-run the commands above after implementation; this baseline is diagnostic, not the expected final result.
