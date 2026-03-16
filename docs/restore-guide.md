# Restore Guide

This is the canonical guide for bringing EduSync back to a working state.

## Project Status

EduSync currently lives as a source repository. The backend is not documented as an active hosted service in this repo anymore. Static frontend deployments may still exist as unsupported archives, but anyone continuing the project should treat the repository and the `.env.example` files as the source of truth.

## What You Need

- Node.js 20 or newer
- npm
- Docker Desktop or another Docker + Compose runtime
- an OpenAI API key only if you want live OpenAI-backed analysis instead of the heuristic fallback

## Restore the Local Working State

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Local Env Files From the Tracked Templates

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/site/.env.example apps/site/.env
```

Keep these generated `.env` files local and untracked.

### 3. Start PostgreSQL

```bash
npm run db:up
```

### 4. Apply Migrations

```bash
npm run prisma:migrate
```

### 5. Seed the Demo Data

```bash
npm run prisma:seed
```

### 6. Start the Full App Stack

```bash
npm run dev
```

This starts:

- marketing site on `http://localhost:3000`
- API on `http://localhost:3001`
- dashboard app on `http://localhost:3002`

## Demo Logins

All seeded demo accounts use password `Demo12345!`.

Parent accounts:

- `parent.olena@example.com`
- `parent.andriy@example.com`

School accounts:

- `school.lyceum127@example.com`
- `school.constellation@example.com`

Club accounts:

- `club.crescendo@example.com`
- `club.horizon@example.com`
- `club.vector@example.com`

Useful local routes:

- `http://localhost:3002/auth/login`
- `http://localhost:3002/auth/register`
- `http://localhost:3002/dashboard?guest=parent`
- `http://localhost:3002/dashboard?guest=club`
- `http://localhost:3002/dashboard?guest=school`

## Verification Checklist

After restore, verify:

- `curl -s http://localhost:3001/health` returns `{"status":"ok"}`
- the dashboard login works with at least one seeded account
- the public site loads at `http://localhost:3000`
- the dashboard loads at `http://localhost:3002`
- seeded requests, children, clubs, and schools appear in the dashboard flows

## Build Outputs

```bash
npm run build
```

Build artifacts:

- `apps/site/out`: static marketing site export
- `apps/app/out`: static dashboard export
- `apps/api/dist`: bundled backend build

## Hosted Restore Blueprint

If someone needs to bring EduSync back online, the recommended order is:

1. restore the local stack first
2. choose a backend host
3. rebuild and deploy the static frontends with the correct public env values

### Backend

You have two practical options:

- use the root `docker-compose.yml` for a simple local or private Docker-backed backend
- use [`deploy/backend/README.md`](../deploy/backend/README.md) as a generic backend-only Docker scaffold for a public host

For any hosted backend, you must provide your own:

- hostname
- TLS setup
- secrets
- database persistence
- CORS origin list

No active production hostname, IP, or committed secret is intentionally stored in this repository.

### Frontends

Both frontends are static exports. Before building them for a hosted restore, set:

- `apps/app/.env`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`
- `apps/site/.env`: `NEXT_PUBLIC_APP_URL`

Then run:

```bash
npm run build
```

Deploy:

- `apps/app/out`
- `apps/site/out`

Any static host works. Cloudflare Pages is a reasonable option because both frontends are pure static exports.

## Notes for the Next Maintainer

- do not commit filled `.env` files
- keep using the tracked `.env.example` files as templates
- `OPENAI_API_KEY` is optional; the app still functions with heuristic analysis if it is empty
- `verify` runs `npm audit`, so it depends on network and current registry state
- there is no automated test suite in the current repository
