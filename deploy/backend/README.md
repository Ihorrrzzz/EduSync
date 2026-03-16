# EduSync Backend Restore Bundle

This folder is a generic backend-only restore scaffold for EduSync. It is not a record of a live production host and it should not contain committed production secrets, fixed IPs, or real hostnames.

It can bring back:

- PostgreSQL
- the Hono + Prisma API
- an optional Caddy reverse proxy

It does not deploy:

- the public marketing site
- the dashboard frontend

Those frontends are static exports built from `apps/site` and `apps/app` and should be deployed separately after you restore the backend.

For the full project recovery path, start with [`docs/restore-guide.md`](../../docs/restore-guide.md).

## Files in This Folder

- `docker-compose.yml`: PostgreSQL + API + optional Caddy stack
- `Caddyfile`: placeholder hostname for a public reverse proxy
- `README.md`: usage notes for this scaffold

The scaffold also expects copied source files from the repo root:

- `package.json`
- `package-lock.json`
- `.dockerignore`
- `apps/api/`

## Generic Environment Template

Create a local `.env` next to this bundle with your own values.

```dotenv
DB_USER=postgres
DB_PASSWORD=replace-with-a-strong-password
NODE_ENV=production
CORS_ORIGIN=https://app.example.com,https://www.example.com
JWT_SECRET=replace-with-a-random-secret-at-least-16-characters
JWT_REFRESH_SECRET=replace-with-a-different-random-secret-at-least-16-characters
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Notes:

- `DB_USER` and `DB_PASSWORD` are used by both Postgres and the API connection string
- `CORS_ORIGIN` must include every browser origin that will call the API
- `OPENAI_API_KEY` is optional
- if `OPENAI_API_KEY` is empty, the API still works via the heuristic fallback

## Hostname Placeholder

`Caddyfile` ships with `api.example.com` as a placeholder. Replace it before exposing the stack publicly.

## Restore Steps

### 1. Prepare a Working Directory

Create a directory on any Docker-capable host and copy in:

- this folder's `docker-compose.yml`
- this folder's `Caddyfile`
- root `package.json`
- root `package-lock.json`
- root `.dockerignore`
- `apps/api/`
- a local `.env` created from your own values

### 2. Adjust the Public Hostname

Edit `Caddyfile` and replace `api.example.com` with your hostname.

If you are restoring the API only for private/local use, you can skip Caddy entirely and expose the API through another reverse proxy or direct port mapping.

### 3. Start the Stack

```bash
docker compose up -d --build
```

### 4. Verify the Backend

```bash
docker compose ps
docker compose logs -f api
```

Health check examples:

- behind Caddy: `curl -s https://api.example.com/health`
- direct host port: `curl -s http://127.0.0.1:3001/health`

Expected response:

```json
{"status":"ok"}
```

### 5. Align the Static Frontends

Before rebuilding `apps/app` and `apps/site`, set:

- `apps/app/.env`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`
- `apps/site/.env`: `NEXT_PUBLIC_APP_URL`

Then build the static exports from the repository and deploy them to your preferred static host, such as Cloudflare Pages, Netlify, or Vercel.

## Persistence Notes

- PostgreSQL data persists in `./data/postgres`
- Caddy data persists in `./data/caddy`
- the API container runs `prisma migrate deploy` on startup
- the API binds to `127.0.0.1:3001` on the host, with Caddy optionally handling public TLS

## Updating a Restored Backend

When the API changes:

1. sync the updated `apps/api` source into the deployment directory
2. keep your local `.env` and `data/` directories intact
3. rebuild the stack

```bash
docker compose up -d --build
```
