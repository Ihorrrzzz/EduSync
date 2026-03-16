# Local Development

This document describes how to run the current monorepo locally, what each env file does, and which scripts are actually wired up today.

For the full end-to-end restore path, including hosted recovery guidance, start with [`docs/restore-guide.md`](restore-guide.md).

## Prerequisites

Required:

- Node.js 20 or newer
- npm
- Docker Desktop or another Docker + Compose runtime

Optional:

- an OpenAI API key if you want the AI route to call OpenAI instead of the built-in heuristic

## Environment Files

Create all env files before starting the stack:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/site/.env.example apps/site/.env
```

These generated `.env` files are local runtime files and should stay untracked.

### Root `.env`

Used by root `docker-compose.yml`.

Current example values:

```dotenv
DB_USER=postgres
DB_PASSWORD=change-me
JWT_SECRET=replace-with-a-long-random-secret-at-least-16-characters
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret-at-least-16-characters
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Use this file when running the Dockerized API and database stack.

### `apps/api/.env`

Used by:

- `npm run dev --workspace @edusync/api`
- Prisma CLI commands in `apps/api`
- `npm run prisma:*` root scripts

Current example values:

```dotenv
DATABASE_URL=postgresql://postgres:change-me@localhost:5432/edusync
JWT_SECRET=replace-with-a-random-secret-at-least-16-characters
JWT_REFRESH_SECRET=replace-with-a-different-random-secret-at-least-16-characters
CORS_ORIGIN=http://localhost:3002
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NODE_ENV=development
PORT=3001
HOST=localhost
```

Notes:

- `CORS_ORIGIN` must include every browser origin that will call the API
- for normal dashboard development, `http://localhost:3002` is the critical origin
- `OPENAI_API_KEY` can stay empty; the fallback heuristic will be used

### `apps/app/.env`

Used by the authenticated dashboard app.

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notes:

- `NEXT_PUBLIC_API_URL` is required in production builds
- `NEXT_PUBLIC_SITE_URL` is optional in local development and mainly used for links back to the public site
- production validation requires HTTPS unless the hostname is local

### `apps/site/.env`

Used by the public marketing site.

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

The site uses this value to generate links into dashboard login, registration, and guest/demo pages.

## Standard Local Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Postgres

```bash
npm run db:up
```

This starts only the database container from root `docker-compose.yml`.

### 3. Apply Migrations

```bash
npm run prisma:migrate
```

This runs `prisma migrate dev` in `apps/api`, using `apps/api/.env`.

### 4. Seed Demo Data

```bash
npm run prisma:seed
```

### 5. Start All Apps

```bash
npm run dev
```

This launches:

- `npm run dev:site` on port `3000`
- `npm run dev:api` on port `3001`
- `npm run dev:app` on port `3002`

## Alternative Local Workflows

### Backend in Docker, Frontends Locally

If you want the API in Docker as well:

```bash
docker compose up -d db api
npm run dev:site
npm run dev:app
```

When using this mode:

- the root `.env` controls the API container
- the dashboard app should still point to `http://localhost:3001`

### Frontend-Only Work

For UI work against an already running API:

```bash
npm run dev:site
npm run dev:app
```

Make sure `NEXT_PUBLIC_API_URL` points to a reachable API instance.

## Root Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | starts site, API, and dashboard in parallel |
| `npm run dev:site` | starts `@edusync/site` on port 3000 |
| `npm run dev:api` | starts `@edusync/api` on port 3001 |
| `npm run dev:app` | starts `@edusync/app` on port 3002 |
| `npm run db:up` | starts only the Postgres container |
| `npm run db:down` | stops the local Docker compose stack |
| `npm run build` | builds site, API, and app |
| `npm run typecheck` | runs TypeScript checks for all three workspaces |
| `npm run verify` | runs typecheck, build, and `npm audit` |
| `npm run prisma:generate` | runs Prisma client generation |
| `npm run prisma:migrate` | runs Prisma migrations in dev mode |
| `npm run prisma:seed` | seeds demo data |

## Workspace Scripts

### `@edusync/api`

- `dev`: `node --watch --env-file=.env --import tsx src/index.ts`
- `build`: bundles `src/index.ts` with `tsup`
- `start`: runs the bundled API
- `typecheck`: TypeScript only
- `prisma:generate`
- `prisma:migrate`
- `prisma:seed`

### `@edusync/app`

- `dev`: Next dev server on port `3002`
- `build`: static export build
- `start`: `next start`
- `typecheck`

### `@edusync/site`

- `dev`: Next dev server on port `3000`
- `build`: static export build
- `start`: `next start`
- `typecheck`

## URLs During Local Development

- public site: `http://localhost:3000`
- API health: `http://localhost:3001/health`
- dashboard app: `http://localhost:3002`

Useful direct pages:

- `http://localhost:3002/auth/login`
- `http://localhost:3002/auth/register`
- `http://localhost:3002/dashboard?guest=parent`
- `http://localhost:3002/dashboard?guest=club`
- `http://localhost:3002/dashboard?guest=school`

## Demo Seed Data

Seed password:

```text
Demo12345!
```

Seeded accounts:

- `parent.olena@example.com`
- `parent.andriy@example.com`
- `school.lyceum127@example.com`
- `school.constellation@example.com`
- `club.crescendo@example.com`
- `club.horizon@example.com`
- `club.vector@example.com`

Seeded sample records:

- 2 schools
- 3 clubs
- 5 programs
- 3 children
- 4 recognition requests
- stored AI analyses for all seeded requests
- stored school decisions for approved/partially approved/changes requested examples

## Build and Export Behavior

```bash
npm run build
```

Outputs:

- `apps/site/out`: static marketing site export
- `apps/app/out`: static dashboard export
- `apps/api/dist`: bundled API output

Important notes:

- both Next apps use `output: "export"`
- frontend environment values are embedded at build time
- the repo includes a generic backend restore scaffold in `deploy/backend`, but no active hosted environment is documented here

## Troubleshooting

### CORS errors

Cause:

- `apps/api/.env` or root `.env` does not include the browser origin calling the API

Fix:

- include the dashboard origin in `CORS_ORIGIN`
- use a comma-separated list if multiple origins need access

### Session disappears after reload

Check:

- whether `/api/auth/refresh` is succeeding
- whether the refresh cookie exists
- whether the API origin and cookie path are correct

Relevant implementation details:

- access token is stored only in client memory
- refresh cookie is HTTP-only and scoped to `/api/auth`

### AI calls fail without an API key

Expected behavior:

- if `OPENAI_API_KEY` is empty, EduSync should still work
- the API should use the deterministic heuristic instead

### `npm run verify` fails on audit

Expected cause:

- `verify` runs `npm audit`
- that step depends on registry/network availability and package state

### Static frontend build fails in production

Check:

- `NEXT_PUBLIC_API_URL` for `apps/app`
- `NEXT_PUBLIC_SITE_URL` for `apps/app` if you rely on back-links
- `NEXT_PUBLIC_APP_URL` for `apps/site`

## Current Gaps in the Development Tooling

The repo does not currently include:

- a test suite
- a lint script
- a full local Docker stack for the public site and dashboard app
- a turnkey full-stack hosted deployment preset
