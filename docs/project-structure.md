# Project Structure

This document describes the repository as it exists in the current workspace, with emphasis on source-of-truth directories and the runtime role of each part.

## Top-Level Layout

```text
.
├── apps/
│   ├── api/
│   ├── app/
│   └── site/
├── deploy/
│   └── vps/backend/
├── docs/
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .dockerignore
└── .env.example
```

Top-level responsibilities:

- `apps/`: all application code
- `deploy/vps/backend/`: production bundle for the backend only
- `docs/`: detailed project documentation
- `docker-compose.yml`: local Docker stack for Postgres plus the API container
- `package.json`: npm workspaces and root scripts
- `.dockerignore`: build context exclusions for the API image
- `.env.example`: root env file for Docker-based backend runs

## Source vs Generated Artifacts

The workspace currently contains generated directories:

- `apps/api/dist`
- `apps/app/.next`
- `apps/app/out`
- `apps/site/.next`
- `apps/site/out`
- `dist`

These are outputs from build/export workflows. The editable source of truth lives in:

- `apps/api/src`
- `apps/api/prisma`
- `apps/app/app`
- `apps/app/components`
- `apps/app/lib`
- `apps/site/app`
- `apps/site/lib`

## `apps/api`

Purpose: backend API, AI orchestration, Prisma schema/migrations, and demo seeding.

### Layout

```text
apps/api/
├── .env.example
├── Dockerfile
├── package.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── lib/
│   ├── middleware/
│   └── routes/
└── tsconfig.json
```

### Key Files

- `src/index.ts`
  Registers Hono middleware and mounts all route groups.
  Also defines `GET /health`.

- `src/lib/env.ts`
  Validates runtime env variables with Zod.
  Splits `CORS_ORIGIN` into the allowlist used by Hono CORS middleware.

- `src/lib/prisma.ts`
  Creates the Prisma client and reuses it in non-production environments.

- `src/lib/tokens.ts`
  Signs and verifies JWT access/refresh tokens.
  Access tokens live for 15 minutes.
  Refresh tokens live for 7 days.

- `src/lib/refresh-tokens.ts`
  Hashes refresh tokens with SHA-256 before persisting them.

- `src/lib/actors.ts`
  Auto-provisions missing `ParentProfile`, `School`, or `Club` rows for authenticated users if needed.

- `src/lib/recommendation-band.ts`
  Contains both the OpenAI-backed structured analysis call and the deterministic fallback heuristic.

- `src/lib/serializers.ts`
  Normalizes Prisma entities into consistent API response shapes.

- `src/middleware/auth.ts`
  Requires a Bearer token and exposes the authenticated user in Hono bindings.

- `src/middleware/rate-limit.ts`
  Implements an in-memory per-IP-plus-path limiter.
  This is process-local and resets when the API restarts.

### Route Groups

- `src/routes/auth.ts`: register, login, refresh, logout
- `src/routes/me.ts`: current profile/account info and profile updates
- `src/routes/catalog.ts`: public school and published-program catalog
- `src/routes/parent.ts`: child CRUD and parent request creation/detail
- `src/routes/club.ts`: club program CRUD, AI preview, club request detail, evidence updates
- `src/routes/school.ts`: school review queue, detail, and decision submission
- `src/routes/ai.ts`: authenticated standalone recommendation-band preview
- `src/routes/utils.ts`: shared parsing and role helper utilities

### Prisma Layer

`apps/api/prisma/schema.prisma` contains two broad groups of models:

- active MVP models used by the current app flows
- legacy institutional reference tables kept for future research/import work

Active MVP models:

- `Profile`
- `ParentProfile`
- `School`
- `Club`
- `Child`
- `ClubProgram`
- `RecognitionRequest`
- `RecognitionAiAnalysis`
- `RecognitionDecision`
- `RefreshToken`

`apps/api/prisma/migrations/` contains the migration history used by both local development and the Docker runtime.

`apps/api/prisma/seed.ts` inserts demo accounts, clubs, programs, children, requests, AI analyses, and school decisions.

### Dockerfile

`apps/api/Dockerfile` is a multi-stage build that:

1. installs API dependencies
2. builds the API bundle into `apps/api/dist`
3. creates a production image with only runtime dependencies
4. runs `npx prisma migrate deploy` before starting the bundled server

## `apps/app`

Purpose: authenticated dashboard for parents, clubs, and schools.

### Layout

```text
apps/app/
├── .env.example
├── app/
│   ├── auth/
│   ├── dashboard/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Runtime Model

Important architectural details:

- Next.js app router
- `output: "export"` in `next.config.mjs`
- client-side auth and data fetching
- no server-rendered API proxy layer inside this app
- the app talks directly to `NEXT_PUBLIC_API_URL`

### Core Bootstrap Files

- `app/layout.tsx`
  Wraps the application in `AuthProvider`.

- `app/page.tsx`
  Redirects authenticated users to their default dashboard home and unauthenticated users to `/auth/login`.

- `lib/auth-context.tsx`
  Restores the session on app load by calling `/api/auth/refresh`.

- `lib/api.ts`
  Central fetch wrapper, in-memory session store, automatic refresh flow on `401`, and logout logic.

- `lib/dashboard-data-context.tsx`
  Loads `/api/me` after auth and keeps the role-specific dashboard summary available to protected pages.

- `lib/dashboard-role-config.ts`
  Centralizes each role's default dashboard landing route and guest/demo route.

- `lib/public-env.ts`
  Validates `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, enforcing HTTPS in production unless the host is local.

- `components/dashboard-shell.tsx`
  Provides shell layout, role-based navigation, status labels, and common dashboard UI primitives.

### Route Map

Public/auth routes:

- `app/auth/login/page.tsx`
  Login form. On success it stores the access token in client state and redirects to `/dashboard`.

- `app/auth/register/page.tsx`
  Three-step registration flow for `parent`, `school`, and `club`.
  Supports role presets via query string, for example `/auth/register?role=club`.

Dashboard entry:

- `app/dashboard/page.tsx`
  Supports unauthenticated guest/demo mode via `?guest=parent|club|school`.
  Without `guest`, it redirects based on the authenticated role.

Protected routes:

- `app/dashboard/(protected)/account/page.tsx`
  Shared profile page for all three roles.

- `app/dashboard/(protected)/children/page.tsx`
  Parent-only child CRUD and school assignment.

- `app/dashboard/(protected)/discover/page.tsx`
  Parent-only program catalog, filters, and request creation flow.

- `app/dashboard/(protected)/programs/page.tsx`
  Club-only program CRUD and AI preview runner.

- `app/dashboard/(protected)/requests/page.tsx`
  Parent request list or club request list, depending on role.

- `app/dashboard/(protected)/requests/detail/page.tsx`
  Shared detail page.
  Parents see request state, evidence, AI summary, and final decision.
  Clubs can edit evidence for their own requests.

- `app/dashboard/(protected)/review/page.tsx`
  School-only review queue with status filtering.

- `app/dashboard/(protected)/students/page.tsx`
  Club-only page listing students (children) associated with the club's requests.

- `app/dashboard/(protected)/clubs/page.tsx`
  Parent-only page listing clubs and their associated recognition requests.

- `app/dashboard/(protected)/school-students/page.tsx`
  School-only page listing students who submitted recognition requests, grouped by child.

- `app/dashboard/(protected)/review/detail/page.tsx`
  School-only review detail and decision form.
  Opening the page calls `POST /mark-under-review` to transition a `SUBMITTED` or `AI_READY` request to `UNDER_REVIEW`.

### Shared Frontend Libraries

- `lib/mvp-api.ts`
  Typed wrappers for every dashboard API call.

- `lib/use-role-access.ts`
  Client-side role gate for protected pages.

- `lib/subject-options.ts`
  Shared subject list used by registration, filtering, and forms.

- `lib/profile-utils.ts`
  Small role parsing helper used by auth and guest flows.

## `apps/site`

Purpose: public landing site and role entry point into the dashboard.

### Layout

```text
apps/site/
├── .env.example
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── legal/
│   │   └── page.tsx
│   └── page.tsx
├── lib/
│   ├── page-content.ts
│   └── public-env.ts
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Behavioral Notes

- two routed pages: `/` (landing) and `/legal` (legal information)
- statically exported via `output: "export"`
- heavy use of content configuration from `lib/page-content.ts`
- links into the dashboard app using `NEXT_PUBLIC_APP_URL`

`apps/site/app/page.tsx` contains:

- the landing page
- product explanation sections
- role cards
- guest/demo links into the dashboard app
- dashboard preview sections fed by `lib/page-content.ts`

`apps/site/lib/public-env.ts` resolves `NEXT_PUBLIC_APP_URL`, defaulting to `http://localhost:3002` in local development.

## `deploy/vps/backend`

Purpose: backend-only VPS deployment bundle for the API, PostgreSQL, and Caddy.

Files in this folder:

- `docker-compose.yml`
- `Caddyfile`
- `README.md`

The bundle expects additional files copied from the repo root, especially:

- `package.json`
- `package-lock.json`
- `.dockerignore`
- `apps/api/`

The folder does not deploy the static frontends. Those must be built from `apps/site` and `apps/app` and hosted separately.

## Root Runtime Files

- `package.json`
  Declares npm workspaces and the root scripts used for development, type-checking, builds, Prisma commands, and Docker-backed database startup.

- `docker-compose.yml`
  Local backend stack with:
  - `db`: PostgreSQL 16
  - `api`: API container built from `apps/api/Dockerfile`

  This compose file does not start the public site or dashboard app.

- `.env.example`
  Root env file consumed by `docker-compose.yml`.

- `.dockerignore`
  Prevents local `node_modules`, git metadata, build outputs, and per-app `.env` files from entering the Docker build context.

## Role-to-Feature Summary

### Parent

- maintain children
- browse published club programs
- submit recognition requests
- track AI results and school decisions

### Club

- maintain organization profile and subject tags
- create/update/publish programs
- preview AI analysis for a program
- add evidence to linked requests

### School

- review incoming requests
- see AI summaries, program data, and evidence
- store final decisions and recognized topics

## Current Structural Constraints

- frontend apps are static exports, not Node-rendered deployments
- backend deployment instructions are included only for the API stack
- rate limiting is in-memory, not shared across instances
- the dashboard relies on direct browser-to-API calls, so CORS and cookie configuration matter
- several build output directories already exist in the workspace and should not be mistaken for source directories
