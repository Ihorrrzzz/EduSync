# EduSync Backend VPS Bundle

This folder is intended to be deployed as a self-contained backend stack under
`/srv/workers/edusync-backend`.

Contents to sync with it:

- `package.json`
- `package-lock.json`
- `apps/api/`
- `docker-compose.yml`
- `Caddyfile`
- `.dockerignore`
- `.env`

Common commands on the VPS:

```bash
cd /srv/workers/edusync-backend
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose logs -f proxy
docker compose down
```

The PostgreSQL data directory is kept inside the same folder at
`./data/postgres` so the whole backend stack can be moved or removed as one unit.
The TLS proxy state is also stored alongside it under `./data/caddy`.

Recommended `.env` values for the production deployment:

```dotenv
NODE_ENV=production
CORS_ORIGIN=https://educationsync.org,https://dashboard.educationsync.org
```

This bundle is intended to expose the API through `https://api.educationsync.org`
with the application server bound only to `127.0.0.1:3001`.
