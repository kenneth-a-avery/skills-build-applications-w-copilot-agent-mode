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

Record your plan here before editing code.

- Presentation tier decision: Keep route components focused on rendering and UI state; use the shared API client for relative `/api` requests and React Router for the four capability views.
- Logic tier decision: Keep request validation and business rules in Express routes/services, return deliberate 4xx responses for invalid input, and keep the API under `/api` on port `8000`.
- Data tier decision: Use Mongoose schemas with required fields, references, defaults, and validation; keep repeatable representative fixtures in the seed script without replacing unrelated records.
- Activity tracking approach: Validate `userId` and `teamId` as existing MongoDB references, calculate points when creating an activity, persist `occurredAt`, and return the stored activity from the create and list endpoints.
- Team management approach: Require a team name and mascot, default members to an empty array, preserve submitted member references, and expose created and listed teams through the API.
- Leaderboard approach: Aggregate activity points by team, join each total to its team name, sort totals descending, and assign 1-based ranks in the service layer.
- Workout suggestions approach: Find the user by email, use the user's goal and recent activity pattern to select matching workouts, include a human-readable reason, and return a deliberate 4xx for unknown users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies schema validation, relationships, and idempotent representative seed data.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies request validation, status codes, activity/team behavior, leaderboard ordering, and workout suggestions.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies API usage and loading, empty, success, and error states for each route.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — verifies the TypeScript backend type-checks.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — verifies the TypeScript frontend type-checks and Vite production build succeeds.
