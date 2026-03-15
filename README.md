# EduSync

**EduSync** is a platform that bridges formal (school) and non-formal (club/extracurricular) education in Ukraine. It lets parents request official school recognition for what their children learn in clubs, while giving schools the AI-powered tools to evaluate those programs against government standards.

---

## The Problem

In Ukraine, children often attend after-school clubs (music, robotics, art, coding, sports) but schools have no standardized way to recognize that learning. Parents have to manually negotiate with schools, clubs have no visibility into the approval process, and schools lack tools to compare club curricula against official requirements.

## The Solution

EduSync connects all three parties — **parents**, **clubs**, and **schools** — in a single workflow:

1. **Clubs** register their educational programs with structured metadata and PDF documents
2. **Schools** upload their government-approved model plans (standards)
3. The platform uses **AI to compare** club programs against school standards and produce alignment reports
4. **Parents** can enroll their children in club programs and request formal school recognition
5. **Schools** make informed decisions backed by AI analysis, not guesswork

---

## How It Works — Step by Step

### For Clubs

1. **Register** as a club and set up your profile (name, city, subjects)
2. **Create programs** — enter a name, select a subject, specify the target audience (e.g. "grades 5-11"), and upload your program PDF
3. **Send programs for school review** — select a school from the platform and submit your program. If the school has uploaded a model plan for that subject, AI automatically compares your program against it and generates an alignment report
4. **Manage enrolled students** — when parents enroll their children, you approve or reject the enrollment
5. **Track student progress** — open a student's journal and record marks (subject, score X out of Y, comments, dates)
6. **Provide evidence** for recognition requests — when a school reviews a recognition request, you can add attendance rates, performance data, and evidence summaries

### For Parents

1. **Register** as a parent and add your children (name, age, grade, school)
2. **Browse the program catalog** — filter by subject, city, age, or grade to find programs
3. **Enroll your child** in a club program — the club will approve or reject the enrollment
4. **Submit recognition requests** — select a program, a school, and a target subject/grade. The system generates an AI advisory analysis automatically
5. **Track request status** — see whether the school has approved, partially approved, requested changes, or rejected your request

### For Schools

1. **Register** as a school
2. **Upload model plans (standards)** — upload the government-approved curriculum PDF for each subject. These are used by AI to compare club programs
3. **Review program submissions** — when clubs send their programs for review, see the AI comparison report (coverage %, alignment details, violations, recommendations) and approve, reject, or return with comments
4. **Review recognition requests** — see the full evidence package (program details, club evidence, AI analysis) and make a final decision: approve, partially approve, request changes, or reject
5. **View enrolled students** — see all students who have submitted requests to your school

---

## AI Integration

EduSync uses AI in two ways:

### 1. Program-to-Standard Comparison
When a club submits a program to a school for review, the system compares the club's program (PDF + metadata) against the school's uploaded government model plan using **OpenAI GPT**. The AI generates:
- A **verdict** (Fully Suitable / Partially Suitable / Not Suitable)
- **Coverage percentage** of curriculum requirements
- **Alignment details** — requirement-by-requirement matching
- **Violations** — areas where the program contradicts standards
- **Recommendations** for improvement

### 2. Recognition Request Advisory
When a parent submits a recognition request, the system generates an advisory analysis:
- **Recommendation band** (Strong / Possible / Weak match)
- **Compatibility score** (0-100)
- **Matched outcomes**, gaps, and suggested evidence

> **Important**: AI is advisory only. Schools always make the final decision.

If no OpenAI API key is configured, the system falls back to a deterministic heuristic based on keyword matching and subject alignment.

---

## Tech Stack & Tools Used

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, React 18, TailwindCSS | Dashboard and marketing site (static export) |
| **Backend** | Hono 4, Node.js 20 | Lightweight, fast API server |
| **Database** | PostgreSQL 16, Prisma 6 ORM | Data storage with type-safe queries |
| **Auth** | jose (JWT), bcrypt | Access tokens (15min) + refresh tokens (7d, HTTP-only cookie) |
| **Validation** | Zod | Request/response schema validation |
| **AI** | OpenAI API (GPT) | Program comparison and recommendation analysis |
| **Containerization** | Docker, Docker Compose | Local dev and production deployment |
| **Reverse Proxy** | Caddy 2 | TLS termination and routing in production |
| **Icons** | lucide-react | UI icons |
| **Build** | tsup, Next.js | API bundling and static site generation |

### AI Tools Used During Development

| Tool | How It Was Used |
|------|----------------|
| **Claude Sonnet / Opus** (Anthropic) | Architecture design, code generation, comprehensive codebase auditing, security review, documentation |
| **ChatGPT** (OpenAI) | Feature ideation, UI/UX brainstorming, prompt engineering for the AI comparison system |
| **GitHub Copilot / Codex** | Inline code completion, boilerplate generation, test scaffolding |

---

## Project Structure

```
EduSync/
├── apps/
│   ├── api/          # Hono + Prisma backend (port 3001)
│   │   ├── prisma/   # Schema, migrations, seed data
│   │   ├── src/
│   │   │   ├── lib/          # Core utilities (auth, AI, serializers)
│   │   │   ├── middleware/   # Auth & rate limiting
│   │   │   └── routes/      # API route handlers
│   │   └── uploads/  # Uploaded PDF files
│   ├── app/          # Next.js dashboard (port 3002)
│   │   ├── app/      # Pages (auth, dashboard)
│   │   ├── components/  # Shared UI components
│   │   └── lib/      # API client, auth context, utilities
│   └── site/         # Next.js marketing site (port 3000)
├── deploy/
│   └── vps/backend/  # Docker production deployment bundle
├── docs/             # Detailed documentation
├── docker-compose.yml
└── package.json      # npm workspaces root
```

For the full file-by-file breakdown, see [`docs/project-structure.md`](docs/project-structure.md).

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/site/.env.example apps/site/.env

# 3. Start PostgreSQL
npm run db:up

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed demo data
npm run prisma:seed

# 6. Start all three apps
npm run dev
```

### Local URLs

| App | URL | Description |
|-----|-----|-------------|
| Marketing Site | http://localhost:3000 | Landing page |
| API | http://localhost:3001 | Backend (health check: `/health`) |
| Dashboard | http://localhost:3002 | Main application |

### Test Accounts

All test accounts use password: **`12345678`**

| Role | Email | What you can do |
|------|-------|-----------------|
| Parent | `parents@test.com` | Manage children, browse clubs & programs, enroll, submit requests |
| School | `school@test.com` | Upload standards, review programs & requests, manage students |
| Club | `club@test.com` | Create programs, upload PDF, manage enrollments, track student marks |

Production dashboard: **https://dashboard.educationsync.org**

---

## Environment Configuration

| File | Used By | Key Variables |
|------|---------|--------------|
| `.env` | Docker Compose | `POSTGRES_*`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| `apps/api/.env` | API server | `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `OPENAI_API_KEY` |
| `apps/app/.env` | Dashboard | `NEXT_PUBLIC_API_URL` |
| `apps/site/.env` | Marketing site | `NEXT_PUBLIC_APP_URL` |

- `OPENAI_API_KEY` is **optional** — without it, AI falls back to heuristic analysis
- `CORS_ORIGIN` supports comma-separated origins
- Both Next.js apps use `output: "export"` — env values must be correct at build time

---

## API Overview

Full API documentation: [`docs/backend-api.md`](docs/backend-api.md)

### Key Endpoint Groups

| Group | Base Path | Auth | Purpose |
|-------|-----------|------|---------|
| Auth | `/api/auth/*` | No | Register, login, refresh, logout |
| Profile | `/api/me` | Yes | Dashboard data & profile management |
| Catalog | `/api/catalog/*` | No | Public program & school browsing |
| Children | `/api/children/*` | Parent | Child CRUD |
| Requests | `/api/requests/*` | Parent | Recognition request creation & tracking |
| Programs | `/api/programs/*` | Club | Program CRUD, PDF upload, AI preview |
| Club Requests | `/api/club/requests/*` | Club | View & provide evidence for requests |
| Program Reviews | `/api/program-reviews/*` | Club | Send programs to schools for review |
| Enrollments | `/api/enrollments/*` | Parent/Club | Enrollment management |
| Journal | `/api/club/enrollments/*/journal` | Club | Student mark tracking |
| School Review | `/api/school/requests/*` | School | Review & decide on recognition requests |
| School Programs | `/api/school/program-reviews/*` | School | Review club program submissions |
| Model Plans | `/api/school/model-plans/*` | School | Upload government standard plans |
| AI | `/api/ai/*` | Yes | Standalone AI analysis |

---

## Build & Verification

```bash
# Type-check all workspaces
npm run typecheck

# Build all apps
npm run build

# Full verification (typecheck + build + audit)
npm run verify
```

Build outputs:
- `apps/site/out/` — static marketing site
- `apps/app/out/` — static dashboard
- `apps/api/dist/` — bundled API server

---

## Deployment

The production deployment bundle is in [`deploy/vps/backend/`](deploy/vps/backend/README.md). It includes:
- `docker-compose.yml` — PostgreSQL + API + Caddy reverse proxy
- `Caddyfile` — automatic TLS with Let's Encrypt
- Step-by-step setup instructions

Frontend apps are static exports and can be hosted on any CDN/static hosting (Vercel, Netlify, Cloudflare Pages, etc.).

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/project-structure.md`](docs/project-structure.md) | Complete directory map and file descriptions |
| [`docs/local-development.md`](docs/local-development.md) | Setup, env files, scripts, troubleshooting |
| [`docs/backend-api.md`](docs/backend-api.md) | All API routes, auth model, data model, rate limits |
| [`deploy/vps/backend/README.md`](deploy/vps/backend/README.md) | Production deployment guide |

---

## Security Notes

- Access tokens are stored in-memory (not localStorage) and expire after 15 minutes
- Refresh tokens are SHA-256 hashed server-side, sent as HTTP-only cookies (7-day lifetime)
- Passwords are hashed with bcrypt (cost factor 12)
- All endpoints use Zod validation with strict input constraints
- Rate limiting is applied per-IP on all routes
- CORS is configured with an explicit origin allowlist
- Login uses constant-time password comparison to prevent user enumeration

---

## Current Limitations

- No automated test suite
- In-memory rate limiting (per-process, not shared across instances)
- No official school MIS/journal integrations
- No automatic grade conversion or transfer
- No messaging/chat between parties
- No payment processing
- No government registry integrations
- No multi-language support (UI is Ukrainian only)
