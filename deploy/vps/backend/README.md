# EduSync Backend VPS Bundle

This folder documents the backend-only deployment bundle for EduSync.

It deploys:

- PostgreSQL
- the Hono + Prisma API
- Caddy as the public TLS reverse proxy

It does not deploy:

- the public marketing site
- the dashboard frontend

Those frontends are static exports built from `apps/site` and `apps/app` and must be hosted separately.

## Intended Server Layout

Recommended target directory:

```text
/srv/workers/edusync-backend
├── .env
├── .dockerignore
├── Caddyfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── apps/
│   └── api/
└── data/
    ├── caddy/
    │   ├── config/
    │   └── data/
    └── postgres/
```

Files to copy from this repository:

- root `package.json`
- root `package-lock.json`
- root `.dockerignore`
- `apps/api/`
- `deploy/vps/backend/docker-compose.yml`
- `deploy/vps/backend/Caddyfile`
- a production `.env`

## What the Bundle Does

### `docker-compose.yml`

Starts three services:

- `db`: PostgreSQL 16
- `api`: API container built from `apps/api/Dockerfile`
- `proxy`: Caddy 2

Runtime behavior:

- PostgreSQL data persists in `./data/postgres`
- Caddy certificates and config persist in `./data/caddy`
- the API binds to `127.0.0.1:3001` on the host
- Caddy exposes ports `80` and `443`
- the API container runs `prisma migrate deploy` on startup

### `Caddyfile`

Current host configuration:

```caddy
api.educationsync.org {
  encode gzip zstd
  reverse_proxy api:3001
}
```

This means:

- TLS is terminated by Caddy
- the public API hostname is `https://api.educationsync.org`
- Caddy forwards traffic to the internal Docker service `api:3001`

## Required Environment Variables

Create `.env` in the deployment directory.

Recommended production template:

```dotenv
DB_USER=postgres
DB_PASSWORD=replace-with-a-strong-password
NODE_ENV=production
CORS_ORIGIN=https://educationsync.org,https://dashboard.educationsync.org
JWT_SECRET=replace-with-a-random-secret-at-least-16-characters
JWT_REFRESH_SECRET=replace-with-a-different-random-secret-at-least-16-characters
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Variable notes:

- `DB_USER` and `DB_PASSWORD` are used by both Postgres and the API connection string
- `CORS_ORIGIN` must include every frontend origin that will call the API from a browser
- `OPENAI_API_KEY` is optional
- if `OPENAI_API_KEY` is omitted, the API still works and uses the built-in heuristic fallback

## Deployment Steps

### 1. Prepare the Directory

```bash
mkdir -p /srv/workers/edusync-backend
cd /srv/workers/edusync-backend
```

### 2. Copy the Bundle Files

Copy:

- `package.json`
- `package-lock.json`
- `.dockerignore`
- `apps/api/`
- `docker-compose.yml` from `deploy/vps/backend/`
- `Caddyfile` from `deploy/vps/backend/`
- production `.env`

### 3. Start the Stack

```bash
docker compose up -d --build
```

### 4. Verify Containers

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f proxy
```

Useful health check:

```bash
curl -s https://api.educationsync.org/health
```

Expected response:

```json
{"status":"ok"}
```

## Update Workflow

When the API changes:

1. sync updated source files into the deployment directory
2. keep `.env` and `data/` untouched
3. rebuild and restart

Command:

```bash
docker compose up -d --build
```

## Stop and Restart Commands

```bash
cd /srv/workers/edusync-backend
docker compose ps
docker compose logs -f api
docker compose logs -f proxy
docker compose restart api
docker compose down
```

## Operational Notes

- this bundle is for the backend only
- frontend static files should be deployed elsewhere
- the API is intentionally not exposed directly on a public host port other than through Caddy
- TLS state lives in `./data/caddy`, so keep that directory persistent
- database state lives in `./data/postgres`, so keep that directory persistent
- if DNS for `api.educationsync.org` is not pointed at the server, Caddy cannot obtain certificates

## Frontend Alignment

The deployed frontends should point at:

- API base URL: `https://api.educationsync.org`
- site URL: `https://educationsync.org`
- dashboard URL: `https://dashboard.educationsync.org`

Build-time env values should be set accordingly when exporting:

- `apps/app`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`
- `apps/site`: `NEXT_PUBLIC_APP_URL`
