# EduSync MVP

EduSync is a hackathon-ready decision-support platform for school review of
extracurricular learning evidence. Parents create a recognition request,
clubs provide structured program evidence, AI produces an advisory
compatibility analysis, and the school stores the final decision.

The product does not automate grade transfer, does not claim official
government integration, and does not replace the final school decision.

## Stack

- `apps/site`: public Next.js site
- `apps/app`: authenticated Next.js dashboard
- `apps/api`: Hono API with Prisma and PostgreSQL
- Monorepo with TypeScript and Tailwind CSS

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create env files:

```bash
cp apps/api/.env.example apps/api/.env
cp .env.example .env
```

3. Start PostgreSQL:

```bash
npm run db:up
```

4. Run the Prisma migration:

```bash
npm run prisma:migrate
```

5. Seed demo data:

```bash
npm run prisma:seed
```

6. Start all apps:

```bash
npm run dev
```

Local URLs:

- Site: `http://localhost:3000`
- API: `http://localhost:3001`
- App: `http://localhost:3002`

## Environment variables

Root `.env` for Docker Compose:

- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV`
- `CORS_ORIGIN`
- `OPENAI_API_KEY` optional
- `OPENAI_MODEL` optional, defaults to `gpt-4.1-mini`

`apps/api/.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `OPENAI_API_KEY` optional
- `OPENAI_MODEL` optional
- `NODE_ENV`
- `PORT`
- `HOST`

`OPENAI_API_KEY` is optional. If it is missing, EduSync still works and uses a
deterministic fallback heuristic for the AI recommendation band.

## AI recommendation band

The API stores structured AI output with:

- compatibility score
- recommendation band
- recommended school action
- confidence
- summary
- matched outcomes
- gaps
- suggested evidence
- safe-band explanation

If OpenAI is configured, the API performs a server-side structured request.
If not, the fallback heuristic compares the target subject and grade with the
program title, description, modules, learning outcomes, and evaluation method.

AI is advisory only. The final school decision is always stored separately.

## MVP features

- Parent account/profile editing
- Child CRUD
- Program catalog with filters
- Recognition request creation and tracking
- Club account/profile editing
- Club program CRUD
- Club evidence submission for linked requests
- School account/profile editing
- School review queue and final decision flow
- Persistent PostgreSQL storage for the full request lifecycle

## Intentionally out of scope

- Official school MIS or journal integrations
- Automatic grade conversion
- Attendance sync from external systems
- File uploads
- Messaging or chat
- Payments
- E-signatures or contracts
- Government registry integrations
- Multi-school network agreements

## Database changes

The MVP adds clean domain models on top of the existing auth schema:

- `ParentProfile`
- `Child`
- `ClubProgram`
- `RecognitionRequest`
- `RecognitionAiAnalysis`
- `RecognitionDecision`

Legacy institutional tables remain in the schema but are not used for the
active MVP workflow.

## Demo seed accounts

Seed password for all demo accounts:

```text
Demo12345!
```

Parents:

- `parent.olena@example.com`
- `parent.andriy@example.com`

Schools:

- `school.lyceum127@example.com`
- `school.constellation@example.com`

Clubs:

- `club.crescendo@example.com`
- `club.horizon@example.com`
- `club.vector@example.com`

The seed includes:

- 2 schools
- 3 clubs
- 5 programs
- 2 parent accounts
- 3 children
- 4 recognition requests in different statuses

## Verification

Run the standard checks:

```bash
npm run typecheck
npm run build
```
