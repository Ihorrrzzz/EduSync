FROM node:20-slim AS base

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma

RUN npm ci --workspace @edusync/api

FROM deps AS builder

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

RUN npm run build --workspace @edusync/api

FROM base AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma

RUN npm ci --omit=dev --workspace @edusync/api

COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER node
WORKDIR /app/apps/api

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
