# Backend API

This document describes the implemented API surface and the behavior behind it.

## Stack

- Hono HTTP server
- Prisma ORM
- PostgreSQL
- Zod validation
- `jose` for JWT handling
- `bcrypt` for password hashing

Entry point:

- `apps/api/src/index.ts`

## Runtime Overview

The API applies the following global middleware and behavior:

- `secureHeaders()` for baseline response headers
- CORS with an allowlist derived from `CORS_ORIGIN`
- centralized error handling returning `{ error: string }`
- JSON `404` responses

Base health endpoint:

- `GET /health` -> `{ "status": "ok" }`

## Authentication Model

Auth implementation lives mainly in:

- `apps/api/src/routes/auth.ts`
- `apps/api/src/lib/tokens.ts`
- `apps/api/src/lib/refresh-tokens.ts`
- `apps/api/src/middleware/auth.ts`

### Session Design

- access token: JWT, 15 minute lifetime
- refresh token: JWT, 7 day lifetime
- refresh token storage: hashed in the database
- cookie name: `refresh_token`
- cookie path: `/api/auth`
- cookie policy: `httpOnly`, `sameSite=Strict`, `secure` in production
- max active refresh sessions per profile: 5

### Access Token Payload

The signed access token includes:

- `sub`: profile id
- `email`
- `role`
- `fullName`
- `type: "access"`

The dashboard sends this token as `Authorization: Bearer <token>`.

### Refresh Flow

1. Client calls `POST /api/auth/refresh`.
2. API reads the refresh cookie.
3. API verifies the JWT and checks the stored token hash.
4. Old refresh token row is deleted.
5. A new access token and refresh token pair is issued.
6. A new refresh cookie is set.

If refresh verification fails:

- the cookie is cleared
- the API returns `401`

## Actor Model

Every authenticated `Profile` has one role:

- `parent`
- `school`
- `club`

Role-specific records are stored separately:

- `ParentProfile`
- `School`
- `Club`

`apps/api/src/lib/actors.ts` will auto-create a missing role-specific row when the authenticated user first accesses role-scoped endpoints.

## Public vs Authenticated Endpoints

Public:

- `GET /health`
- `GET /api/catalog/schools`
- `GET /api/catalog/programs`
- auth endpoints under `/api/auth/*`

Authenticated:

- `/api/me/*`
- `/api/children*`
- `/api/requests*`
- `/api/programs*`
- `/api/club/requests*`
- `/api/school/requests*`
- `/api/ai/recommendation-band`

## Route Inventory

### Auth Routes

Base path: `/api/auth`

#### `POST /api/auth/register`

Creates a new `Profile`, the associated role entity, and an initial session.

Accepted roles:

- `parent`
- `school`
- `club`

Important validation rules:

- email is normalized to lowercase
- password must be 8-72 characters
- `school` requires `schoolName`
- `club` requires `fullName`
- `club` requires at least one subject

For `parent` registration:

- `fullName` is required

Response:

- `201`
- `{ accessToken, profile }`
- also sets the refresh cookie

#### `POST /api/auth/login`

Validates credentials and creates a new session.

Response:

- `{ accessToken, profile }`
- also sets the refresh cookie

#### `POST /api/auth/refresh`

Uses the refresh cookie to mint a new access token and rotate the refresh token.

Response:

- `{ accessToken }`

#### `POST /api/auth/logout`

- deletes the matching stored refresh token hash if present
- clears the refresh cookie
- returns `{ ok: true }`

### Profile Routes

Base path: `/api/me`

#### `GET /api/me`

Returns:

- the basic `Profile`
- role-specific account data
- a role-specific summary block for dashboard metrics

Parent summary fields:

- `childrenCount`
- `activeRequests`
- `approvedRequests`
- `pendingRequests`

Club summary fields:

- `programsCount`
- `publishedProgramsCount`
- `requestsNeedingEvidenceCount`
- `studentsCount`

School summary fields:

- `pendingReviews`
- `approvedRequests`
- `attentionRequired`

#### `PATCH /api/me/profile`

Updates role-specific profile data.

Supported input:

- `displayName`
- `city`
- `subjects` for clubs only

Behavior:

- always updates `Profile.fullName`
- updates the matching role-specific entity
- rejects `subjects` for non-club users

### Public Catalog Routes

Base path: `/api/catalog`

#### `GET /api/catalog/schools`

Optional query params:

- `city`
- `search`

Returns:

- `id`
- `name`
- `city`

#### `GET /api/catalog/programs`

Optional query params:

- `city`
- `subject`
- `age`
- `grade`
- `clubId`
- `search`

Behavior:

- returns only `isPublished = true` programs
- can filter by club city through the related `Club`
- can filter against age and grade ranges
- returns each program with embedded club metadata

### Parent Routes

Base path: `/api`

These routes require the authenticated role `parent`.

#### `GET /api/children`

Returns all children for the authenticated parent.

#### `POST /api/children`

Creates a child record.

Important validation:

- age: 4-19
- grade: 1-12
- `schoolId` is optional
- if `schoolId` is provided, the school must exist

The API stores both:

- `schoolId`
- `schoolNameSnapshot`

#### `PATCH /api/children/:id`

Updates a parent-owned child record with the same validation rules as creation.

#### `DELETE /api/children/:id`

Deletes a child only if that child has no recognition requests.

If the child already has requests:

- returns `409`

#### `GET /api/requests`

Returns all requests owned by the authenticated parent, including:

- child
- school
- club
- program
- AI analysis
- final decision

#### `POST /api/requests`

Creates a new recognition request and immediately generates an AI analysis.

Flow:

1. validate parent ownership of the selected child
2. validate target school
3. validate target program and ensure it is published
4. create request with status `SUBMITTED`
5. generate AI analysis
6. upsert `RecognitionAiAnalysis`
7. update request status to `AI_READY`
8. return the fully hydrated request

Important consequence:

- the current parent flow does not leave requests in `DRAFT`
- the client receives the request already in `AI_READY`

#### `GET /api/requests/:id`

Returns one parent-owned request with full detail.

### Club Routes

Base path: `/api`

These routes require the authenticated role `club`.

#### `GET /api/programs`

Returns all programs belonging to the authenticated club.

#### `POST /api/programs`

Creates a club program.

Important validation:

- `title`: 2-160 chars
- `subjectArea`: 2-120 chars
- `shortDescription`: 10-320 chars
- `fullDescription`: 20-3000 chars
- `modules`: 1-12 items
- `learningOutcomes`: 1-12 items
- `evaluationMethod`: 10-800 chars
- age and grade ranges cannot be inverted

#### `PATCH /api/programs/:id`

Updates a club-owned program with the same validation rules.

#### `GET /api/programs/:id`

Returns:

- the club-owned program
- all recognition requests linked to that program

#### `POST /api/programs/:id/ai-preview`

Runs AI preview for an existing program against:

- `targetSubject`
- `targetGrade`
- `recognitionScope`

This is useful for clubs before parents create requests.

#### `GET /api/club/requests`

Returns all recognition requests linked to the authenticated club.

The response includes parent display data, child data, AI analysis, and final decision if present.

#### `GET /api/club/requests/:id`

Returns one club-owned request with detail.

#### `POST /api/requests/:id/evidence`

Updates evidence fields for a request linked to the authenticated club.

Input:

- `clubEvidenceSummary`
- `attendanceRate`
- `externalPerformanceBand`

Important behavior:

- closed requests (`APPROVED`, `PARTIALLY_APPROVED`, `REJECTED`) cannot be changed
- if the request status is `SUBMITTED` or `CHANGES_REQUESTED`, evidence submission moves it to `AI_READY`
- if the request has no `aiAnalysis`, the API creates one here
- if an `aiAnalysis` already exists, the current implementation does not recalculate it after evidence updates

### School Routes

Base path: `/api/school`

These routes require the authenticated role `school`.

#### `GET /api/school/requests`

Optional query param:

- `status`

Returns the school's review queue with full request detail.

#### `GET /api/school/requests/:id`

Returns one school-owned request.

#### `POST /api/school/requests/:id/mark-under-review`

If the current status is `SUBMITTED` or `AI_READY`, transitions the request to `UNDER_REVIEW`. Otherwise returns the request unchanged.

#### `POST /api/school/requests/:id/decision`

Stores or updates the final school decision. Only allowed when the request status is `AI_READY` or `UNDER_REVIEW`; returns `409` otherwise.

Accepted decision values:

- `APPROVE`
- `PARTIAL`
- `REQUEST_CHANGES`
- `REJECT`

The route:

- upserts `RecognitionDecision`
- updates the request status to the matching terminal or follow-up state

Status mapping:

- `APPROVE` -> `APPROVED`
- `PARTIAL` -> `PARTIALLY_APPROVED`
- `REQUEST_CHANGES` -> `CHANGES_REQUESTED`
- `REJECT` -> `REJECTED`

### Standalone AI Route

Base path: `/api/ai`

#### `POST /api/ai/recommendation-band`

Requires authentication.

Input includes raw program details plus:

- `targetSubject`
- `targetGrade`
- `recognitionScope`

This route does not persist anything by itself.
It just returns a computed analysis.

## Recognition Request Lifecycle

The schema contains these statuses:

- `DRAFT`
- `SUBMITTED`
- `AI_READY`
- `UNDER_REVIEW`
- `APPROVED`
- `PARTIALLY_APPROVED`
- `CHANGES_REQUESTED`
- `REJECTED`

Current implemented transitions:

1. Parent submits request:
   `SUBMITTED` -> `AI_READY` during the same request cycle

2. School calls `POST /mark-under-review`:
   `SUBMITTED` or `AI_READY` -> `UNDER_REVIEW`

3. School saves a decision (only from `AI_READY` or `UNDER_REVIEW`):
   -> final mapped status

4. Club updates evidence:
   `SUBMITTED` or `CHANGES_REQUESTED` -> `AI_READY`

Current accuracy note:

- `DRAFT` exists in the enum but is not created by the current UI/API flow

## AI Analysis Model

Persisted analysis fields:

- `provider`
- `modelName`
- `compatibilityScore`
- `recommendationBand`
- `recommendedSchoolAction`
- `confidence`
- `summary`
- `matchedOutcomes`
- `gaps`
- `suggestedEvidence`
- `safeBandExplanation`
- `rawResponse`

Recommendation band values:

- `strong`
- `possible`
- `weak`

Recommended school actions:

- `full_candidate`
- `partial_candidate`
- `manual_review`

Confidence values:

- `high`
- `medium`
- `low`

### OpenAI vs Heuristic

If `OPENAI_API_KEY` is configured:

- the API sends a structured request to OpenAI
- it validates the returned JSON against a schema

If `OPENAI_API_KEY` is missing:

- the API uses the deterministic heuristic in `recommendation-band.ts`

The fallback logic inspects:

- program title
- subject area
- short/full descriptions
- modules
- learning outcomes
- evaluation method
- report format summary
- club evidence summary if provided
- requested subject and grade
- age/grade ranges

## Rate Limits

Implemented in `apps/api/src/middleware/rate-limit.ts`.

Current limits:

| Route group | Limit |
| --- | --- |
| auth | 20 requests / 15 minutes |
| catalog | 180 requests / 15 minutes |
| AI | 60 requests / 15 minutes |
| me | 120 requests / 15 minutes |
| parent | 120 requests / 15 minutes |
| club | 120 requests / 15 minutes |
| school | 120 requests / 15 minutes |

Important implementation detail:

- storage is in-memory
- the key is `clientIp + path`
- the limiter is not shared across processes or hosts

## Data Model Summary

### Identity and Role Layer

- `Profile`
  Root auth entity with email, password hash, role, display name, and refresh tokens.

- `ParentProfile`
  One-to-one extension of `Profile` for parent accounts.

- `School`
  One-to-one extension of `Profile` for school accounts.

- `Club`
  One-to-one extension of `Profile` for club accounts, including subject tags.

### Learning and Request Layer

- `Child`
  Belongs to `ParentProfile`, may reference a `School`.

- `ClubProgram`
  Belongs to a `Club` and stores structured program data.

- `RecognitionRequest`
  Ties together parent, child, school, club, and club program.

- `RecognitionAiAnalysis`
  One-to-one with `RecognitionRequest`.

- `RecognitionDecision`
  One-to-one with `RecognitionRequest`.

### Session Layer

- `RefreshToken`
  Stores hashed refresh tokens and expiration timestamps.

### Legacy Schema

The Prisma schema also contains legacy institutional reference tables after the active MVP models.
Those tables are intentionally not part of the current request workflow.

## Standard Error Shape

Errors are returned as:

```json
{ "error": "Message" }
```

Common statuses:

- `400` validation error
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `429` rate limited
- `500` internal server error

## Current Backend Gaps

The current backend does not implement:

- file upload storage
- messaging between actors
- payments
- official integrations with school systems
- distributed rate limiting
- background job processing
- automated test coverage
