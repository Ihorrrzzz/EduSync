# EduSync

EduSync is a role-based MVP for handling school review of extracurricular learning.
The repository currently contains:

- a public marketing site
- an authenticated dashboard for parents, clubs, and schools
- a Hono + Prisma API backed by PostgreSQL
- a backend-only Docker deployment bundle for VPS hosting

The implemented workflow is:

1. A club creates and publishes a structured program.
2. A parent adds a child, selects a school and a club program, and submits a recognition request.
3. The API generates and stores an AI advisory analysis, then moves the request to `AI_READY`.
4. The club can add evidence, attendance, and an external performance band for the same request.
5. The school reviews the package and stores the final decision.

The product is deliberately conservative. AI is advisory only, school decisions are final, and the current MVP does not automate grade transfer or government/school-system integrations.

## Documentation Map

- [`docs/project-structure.md`](docs/project-structure.md): detailed directory map and source layout
- [`docs/local-development.md`](docs/local-development.md): setup, env files, scripts, and demo data
- [`docs/backend-api.md`](docs/backend-api.md): API routes, auth model, request lifecycle, and data model
- [`deploy/vps/backend/README.md`](deploy/vps/backend/README.md): backend VPS deployment bundle

## Current Repository Layout

```text
.
├── README.md
├── docs/
│   ├── backend-api.md
│   ├── local-development.md
│   └── project-structure.md
├── apps/
│   ├── api/
│   ├── app/
│   └── site/
├── deploy/
│   └── vps/backend/
├── docker-compose.yml
├── package.json
└── .env.example
```

At the moment the workspace also contains generated output directories such as `apps/api/dist`, `apps/app/.next`, `apps/app/out`, `apps/site/.next`, `apps/site/out`, and root `dist/`. Those are build artifacts, not the primary source of truth.

## What Exists Today

### Public Site

`apps/site` is a statically exported Next.js landing page. It does not implement the authenticated product workflow itself; instead it:

- explains the product and role model
- links users to the dashboard login and registration pages
- exposes guest/demo entry points such as `/dashboard?guest=parent`

### Authenticated Dashboard

`apps/app` is a statically exported Next.js dashboard that runs entirely on the client and talks to the API over HTTP. The UI language is Ukrainian.

Implemented dashboard areas:

- `/auth/login`
- `/auth/register`
- `/dashboard` guest/demo entry or authenticated redirect
- `/dashboard/account`
- `/dashboard/children` for parents
- `/dashboard/discover` for parents
- `/dashboard/programs` for clubs
- `/dashboard/requests` for parents and clubs
- `/dashboard/requests/detail?id=...` for parents and clubs
- `/dashboard/review` for schools
- `/dashboard/review/detail?id=...` for schools

### API

`apps/api` is a Hono service with Prisma and PostgreSQL.

Implemented route groups:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `PATCH /api/me/profile`
- `GET /api/catalog/schools`
- `GET /api/catalog/programs`
- parent routes under `/api/children` and `/api/requests`
- club routes under `/api/programs`, `/api/club/requests`, and `/api/requests/:id/evidence`
- school routes under `/api/school/requests`
- authenticated AI preview route at `/api/ai/recommendation-band`

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create local env files.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/site/.env.example apps/site/.env
```

3. Start PostgreSQL.

```bash
npm run db:up
```

4. Apply Prisma migrations.

```bash
npm run prisma:migrate
```

5. Seed demo data.

```bash
npm run prisma:seed
```

6. Start all three apps.

```bash
npm run dev
```

Local URLs:

- public site: `http://localhost:3000`
- API: `http://localhost:3001`
- dashboard app: `http://localhost:3002`

## Environment Files

| File | Used by | Purpose |
| --- | --- | --- |
| `.env` | root `docker-compose.yml` | local Docker values for Postgres and the API container |
| `apps/api/.env` | API dev server and Prisma | database URL, JWT secrets, CORS origins, OpenAI settings, host/port |
| `apps/app/.env` | dashboard app | `NEXT_PUBLIC_API_URL` and optional `NEXT_PUBLIC_SITE_URL` |
| `apps/site/.env` | public site | `NEXT_PUBLIC_APP_URL` for links into the dashboard |

Important details:

- `OPENAI_API_KEY` is optional.
- if `OPENAI_API_KEY` is missing, the API falls back to a deterministic heuristic
- `CORS_ORIGIN` is a comma-separated list
- in production, the dashboard app requires `NEXT_PUBLIC_API_URL`
- both Next apps build with `output: "export"`, so public env values must be correct at build time

## Demo Data

Seed password for all demo accounts:

```text
Demo12345!
```

Seeded accounts:

- parents: `parent.olena@example.com`, `parent.andriy@example.com`
- schools: `school.lyceum127@example.com`, `school.constellation@example.com`
- clubs: `club.crescendo@example.com`, `club.horizon@example.com`, `club.vector@example.com`

Seeded records:

- 2 schools
- 3 clubs
- 5 club programs
- 2 parent accounts
- 3 children
- 4 recognition requests in different statuses

## Build Outputs

```bash
npm run typecheck
npm run build
```

Current build behavior:

- `apps/site` exports static files into `apps/site/out`
- `apps/app` exports static files into `apps/app/out`
- `apps/api` bundles into `apps/api/dist`

The repository does not currently include a frontend hosting bundle. The only deployment bundle in the repo is the backend stack in [`deploy/vps/backend/README.md`](deploy/vps/backend/README.md).

## Important Implementation Notes

- The API access token lives in memory on the dashboard client and expires after 15 minutes.
- A hashed refresh token is stored server-side and sent as an HTTP-only cookie with a 7-day lifetime.
- Refresh cookies are scoped to `/api/auth`.
- The dashboard restores the session by calling `/api/auth/refresh` on load.
- Catalog endpoints are public; most other API routes require a Bearer access token.
- The schema contains `DRAFT`, but the current parent flow creates a request and immediately advances it to `AI_READY` after analysis generation.
- Club evidence updates request metadata, but the current implementation only creates a new AI analysis if the request does not already have one.
- Role-specific actor records are auto-created on first authenticated access if a related row is missing.
- There is no automated test suite or lint script configured yet.

## Current MVP Boundaries

Out of scope in the current codebase:

- official school MIS or journal integrations
- automatic grade conversion
- attendance sync from third-party systems
- file uploads
- messaging/chat
- payments
- e-signatures
- government registry integrations
- multi-school network agreements
