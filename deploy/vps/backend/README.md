# EduSync Backend VPS Bundle

This folder is intended to be deployed as a self-contained backend stack under
`/srv/workers/edusync-backend`.

Contents to sync with it:

- `package.json`
- `package-lock.json`
- `apps/api/`
- `docker-compose.yml`
- `.dockerignore`
- `.env`

Common commands on the VPS:

```bash
cd /srv/workers/edusync-backend
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose down
```

The PostgreSQL data directory is kept inside the same folder at
`./data/postgres` so the whole backend stack can be moved or removed as one unit.
