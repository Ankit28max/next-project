# Project Report

**Course:** INT257, Modern Web Application Development
**Project:** JanSetu: Smart Grievance Redressal & Fake Complaint Detection System

## 1. Team details

| Name | Registration number |
|---|---|
| Abhinav Singla | 12408467 |
| Ankit Singh | 12407308 |
| Devansh | 12407745 |

Contact: abhikathsingla135@gmail.com

## 2. Title and description

**JanSetu: Smart Grievance Redressal & Fake Complaint Detection System.**

A grievance portal in which citizens submit complaints with a photo and a map location. The system analyses the complaint photo and text, detects possible duplicate or manipulated submissions, categorises the grievance and routes it to the appropriate department. All automatic results are advisory: a human officer makes every decision.

This is an academic project. It is not affiliated with any government body.

## 3. Objectives

1. Let a citizen report a civic problem in under two minutes, from a phone, with an exact location and one photo.
2. Reduce manual sorting: suggest a category and route each complaint to the right department and officer automatically.
3. Stop the same incident being handled several times: link likely duplicates so an officer can compare them.
4. Help officers spot misleading submissions (reused photos, photos that do not match the place or time, filler text) with a score and written reasons.
5. Keep humans in charge: software never rejects a complaint.
6. Demonstrate the course outcomes: Next.js architecture and routing, rendering strategies, API routes and Server Actions, authentication, database operations, performance analysis and production deployment.

## 4. Overview

Three roles use the application:

- **Citizen:** registers, submits complaints through a 4-step wizard (details, location, photo, review and consent), follows a status timeline, can reopen a closed complaint, receives notifications. Anyone can check a complaint's status with its reference number.
- **Officer:** sees only their department's complaints; reviews the report, photo, map, automatic analysis, risk reasons and a side-by-side comparison with possible duplicates; updates the status; adds internal notes.
- **Administrator:** sees everything; reassigns complaints; creates and deactivates officers; edits routing rules; reads the audit log.

Flow of one complaint:

```
photo upload  ->  validate bytes, read EXIF facts, strip metadata, compute dHash, store
submit        ->  classify (rules, plus vision model if configured)
              ->  ONE database transaction:
                    find duplicates -> assess risk -> choose department and officer
                    -> save complaint, links, analysis, history, notifications, audit entry
officer       ->  reviews and updates the status; the citizen is notified
citizen       ->  may reopen a resolved or rejected complaint
```

## 5. Technologies used

| Area | Technology | Why |
|---|---|---|
| Framework | Next.js 14.2 (App Router), React 18, TypeScript | Required by the course; Server Components and Server Actions keep data access on the server |
| Database | PostgreSQL (Neon in production, Docker locally) with Prisma 5 | Relational data with transactions; typed queries; migrations |
| Styling | Tailwind CSS | Design tokens in one config file; responsive utilities |
| Authentication | Custom JWT session (`jose`), `bcryptjs` | Small and fully explainable in a viva |
| Validation | `zod` | One schema validates and types every input |
| Images | `sharp`, `exifr` | Re-encoding, metadata removal, hashing; reading EXIF |
| Storage | Vercel Blob (production), local folder (development) | Vercel's file system is read-only at runtime |
| Maps | Leaflet, OpenStreetMap tiles, Nominatim | Free and open; no API key |
| Vision model | Google Gemini (optional) | Looks at the photo; rules are the fallback |
| Testing | Vitest | Fast unit tests of the real logic |
| Hosting | Vercel | First-class Next.js hosting with git integration |

## 6. Implementation details

### 6.1 Authentication

Files: `src/lib/auth/token.ts`, `session.ts`, `guards.ts`, `password.ts`, `src/middleware.ts`, `src/app/api/auth/*`.

- **Registration** (`POST /api/auth/register`): input validated with zod (password at least 10 characters with a letter and a number); the password is hashed with bcrypt (cost 12). The response is the same whether or not the email already exists, and the user is not signed in automatically, so the endpoint cannot be used to discover registered emails.
- **Login** (`POST /api/auth/login`): rate-limited per IP and per email. One generic error for unknown email, wrong password and deactivated account. When the email is unknown the password is still compared against a dummy hash so the response time does not reveal anything. Failed logins are written to the audit log.
- **Session:** a JWT (HS256) holding the user id and role, in a cookie that is `httpOnly` (JavaScript cannot read it), `SameSite=Lax`, `Secure` in production, valid 7 days.
- **No fallback secret:** `JWT_SECRET` must be at least 32 characters. `src/instrumentation.ts` checks it when the server starts and stops the server if it is missing.
- **Three layers of protection:**
  1. `middleware.ts` (Edge runtime) verifies the token and the role for `/citizen`, `/officer`, `/admin` before the page code runs.
  2. Every layout, page, API route and Server Action calls `requireRole(...)` / `requireRolePage(...)`, which loads the user from the database (so a deactivated account stops working immediately).
  3. Every complaint read or write passes `canAccessComplaint(user, complaint)`: citizens only their own, officers only their department, admins all. Lists use the same rule as a query filter (`complaintScope`).
- **Cross-site requests:** API routes that change data require the `Origin` header to match the host. Server Actions use Next.js's built-in origin check.

### 6.2 Database operations

Files: `prisma/schema.prisma`, `prisma/migrations/`, `src/lib/db/prisma.ts`.

- 12 models: `User`, `OfficerProfile`, `Department`, `ComplaintCategory`, `Complaint`, `ComplaintImage`, `ComplaintAnalysis`, `ComplaintMatch`, `ComplaintStatusHistory`, `Notification`, `AuditLog`, `RoutingRule`.
- **Create:** registration, photo upload (image row), complaint submission, officer and routing-rule creation.
- **Read:** dashboards (counts, `groupBy`), filtered and paginated lists, detail pages. Queries use `select` so only the needed columns leave the database; password hashes are never selected for display.
- **Update:** status changes, reopen, reassignment, mark notification as read, activate/deactivate officer.
- **Delete:** only the local demo seed deletes data. In the application, duplicates are linked, never deleted.
- **Transactions:** the submit pipeline writes the complaint, image link, duplicate links, analysis, history, notifications and audit entry in one interactive transaction; status changes use a batched transaction. Either everything is saved or nothing is.
- **Unique reference numbers:** `JS-<year>-<6 characters>` from a cryptographic random source (about 887 million values per year). The column is unique; on a collision the insert fails and the transaction is retried with a new number.
- **Indexes** on the columns used for filtering: citizen, department + status, officer, creation date, latitude + longitude.
- **Migrations:** real SQL migrations are committed; Vercel runs `prisma migrate deploy` before each build. Neon's pooled URL is used at runtime and the direct URL for migrations.
- **Seeds:** `seed:demo` (local only, wipes data, guarded twice) and `seed:prod` (non-destructive upserts with passwords from environment variables).

### 6.3 Upload and image processing

Files: `src/lib/images/*`, `src/lib/storage.ts`, `src/app/api/upload/route.ts`.

1. In the browser the photo is drawn on a canvas at a maximum of 1600 px and saved as JPEG, to stay under Vercel's 4.5 MB request limit. Because a canvas discards EXIF, the original EXIF block is copied into the resized file.
2. On the server the file type is taken from the magic bytes; size is limited to 4 MB; the client's file name and MIME type are ignored.
3. `exifr` reads capture time, GPS position, device and software. Only these facts are stored.
4. `sharp` decodes and re-encodes the image as JPEG. This removes all metadata.
5. A 64-bit dHash is computed from the stored image.
6. `storage.ts` saves the file (Vercel Blob in production, a local folder in development) under a server-chosen random name.
7. A `ComplaintImage` row is created and only its id is returned. On submit the server accepts that id only if the row belongs to the caller and is not yet attached to a complaint.

### 6.4 AI pipeline

Files: `src/lib/ai/*`, `src/lib/complaints/submit.ts`. All thresholds and weights are named constants in `src/lib/ai/config.ts`.

1. **Classification.** Keyword rules always run: whole-word matching of weighted English and Hinglish keywords for six categories, with a fixed tie-break. If a Gemini key is configured, the photo and text are sent to the model (key in a header, 10-second timeout). The complaint text is passed as JSON data and the instructions tell the model not to follow anything inside it. The reply must be JSON matching a zod schema. On any failure the rules result is used, and the database records which provider really answered and why the fallback happened. The category is saved to `categoryId`.
2. **Duplicates.** An SQL pre-filter selects complaints inside a bounding box of 500 m, from the last 60 days, not rejected. Each candidate is scored: text similarity 35%, distance 35%, same category 15%, same photo (Hamming distance ≤ 10) 15%. A score of 0.6 or more creates a link with the reasons.
3. **Risk.** Signals add points: photo reused by another citizen (45), image/text mismatch (25, vision model), stock image or screenshot (25, vision model), photo GPS more than 2 km from the pin (25), filler text (30), many submissions in 10 minutes (20), photo older than 30 days (15), photo reused by the same citizen (15), editing software in metadata (10), resubmission of one's own complaint (10), no EXIF (5). The result is `{score, level, reasons[]}`; 30+ is medium and 60+ is high.
4. **Routing.** Admin keyword rules first, then the category's default department; inside the department the active officer with the fewest open cases (reopened cases count as open).
5. **Failure.** If the analysis fails, the complaint is saved as "needs manual triage" with no risk level, and an administrator routes it.

The "match strength" of the rules is a sum of keyword weights. It is not a probability and the interface never shows it as a percentage.

### 6.5 Rendering strategy

| Strategy | Where | How |
|---|---|---|
| Static (SSG) | `/about`, `/how-it-works`, `/privacy` | `export const dynamic = 'force-static'`; built once at deploy |
| Incremental static regeneration | `/` | `export const revalidate = 300`; static HTML rebuilt at most every 5 minutes |
| Dynamic (per request) | `/citizen/*`, `/officer/*`, `/admin/*`, `/track` | They read the session cookie or search parameters |
| Streaming | the three dashboards | `loading.tsx` plus `<Suspense>` around each data section |
| Client-only | Leaflet maps | `next/dynamic` with `ssr: false` |

The root layout reads no cookies, which is what allows the public pages to be static. The header's signed-in state is filled in by a small client component.

### 6.6 API routes and Server Actions

- **API routes** (`src/app/api`): `auth/login`, `auth/register`, `auth/logout`, `auth/me`, `upload`, `complaints` (GET list, POST create), `complaints/[id]`, `notifications`, `geocode`, `health`, `files/[name]` (development storage).
- **Server Actions** (`src/actions`): `submitComplaintAction`, `updateStatusAction`, `addNoteAction`, `reopenAction`, `markReadAction`, `createOfficerAction`, `setOfficerActiveAction`, `saveRoutingRuleAction`, `setRoutingRuleActiveAction`, `reassignAction`.
- Forms follow Post/Redirect/Get: on a validation error the action returns a message shown by `useFormState`; on success it redirects back with a `?notice=` code that the server renders as a confirmation.

### 6.7 UI and accessibility

One accent colour and neutral greys defined in `tailwind.config.ts`; status is always icon plus text; visible focus outline; labelled inputs with hints and errors linked by `aria-describedby`; skip link; mobile-first layouts checked at 360, 768 and 1280 px; loading, empty and error states on every screen.

## 7. Measured results

### 7.1 Analysis quality

`npm run eval`, 15 Nov 2026, 33 labelled cases with synthetic photos. Run twice: keyword rules only, and with the vision model `gemini-3.5-flash-lite`.

| Measure | Rules only | With vision model |
|---|---|---|
| Category accuracy | 31 / 33 = 93.9% | 33 / 33 = 100% |
| Duplicate precision | 5 / 5 = 100% | 5 / 5 = 100% |
| Duplicate recall | 5 / 5 = 100% | 5 / 5 = 100% |
| Suspicious-flag precision | 3 / 5 = 60% | 5 / 26 = 19.2% |
| Suspicious-flag recall | 3 / 5 = 60% | 5 / 5 = 100% |

- Rules alone miss the two suspicious cases that require looking at the photo (a screenshot; a photo unrelated to the text). The vision model catches both.
- With the vision model, 21 genuine cases were also flagged. The evaluation photos are drawings, and the model correctly says they are not real photographs. The vision model's fraud precision therefore **cannot be measured with this set**; it needs real photographs. We report the number as measured and do not claim it reflects real use.
- The set is small, was written by the team, and uses drawings instead of real photos. These numbers do not predict real-world performance.

### 7.2 Automated checks

`npm run lint`, `npm run typecheck`, `npm test` (62 tests) and `npm run build` pass.

### 7.3 Performance (Lighthouse)

Measured with Lighthouse 12 on 15 Nov 2026 against a **local production build** (`next start` on the development laptop), not against the deployed URL.

| Page | Mode | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| Landing `/` | mobile | 99 | 100 | 100 | 100 |
| Landing `/` | desktop | 100 | 100 | 100 | 100 |
| Citizen dashboard `/citizen` | mobile | 99 | 100 | 100 | 100 |
| Citizen dashboard `/citizen` | desktop | 100 | 100 | 100 | 100 |

Local numbers are optimistic because there is no network distance to the server or database. **Deployed-URL numbers: not measured yet.**

## 8. Deployment link

_To be added after deployment to Vercel._

## 9. GitHub link

https://github.com/Ankit28max/next-project

## 10. Challenges and limitations

- **The starting template overclaimed.** It described "multimodal AI" but used substring keyword matching and never looked at images. Most of the work was replacing claims with working, measurable code.
- **Browser resizing destroys EXIF.** Solved by copying the EXIF block into the resized JPEG before upload.
- **Serverless constraints.** No writable disk (hence Blob storage), a 4.5 MB request limit (hence browser resizing), and no shared memory (the rate limiter is per instance).
- **Transaction vs. slow network call.** The vision-model call is made before the transaction so a database connection is not held for up to 10 seconds.
- **Form feedback with Server Actions.** A success message kept in client state was lost when the page refreshed after the action; replaced with redirect plus a server-rendered notice.
- **Limitations:** Next.js 14 is past its support window; inline scripts are allowed by the CSP; photos sit in a public Blob store behind unguessable URLs; EXIF is easy to forge; dHash does not survive cropping or rotation; text similarity does not match across languages; no email verification or password reset; the evaluation set is small and synthetic.

## 11. Future work

- Upgrade to the current Next.js release and re-audit dependencies.
- Evaluate the vision model's fraud signals on real, consented photographs (the synthetic set cannot measure them).
- Shared rate limiting (Redis) and nonce-based CSP.
- Private photo storage with signed URLs.
- Multilingual text matching for duplicates (embeddings) and Hindi/Punjabi interface.
- Email or SMS notifications, password reset, email verification.
- Service-level deadlines with escalation, and charts of resolution time.
- Dockerfile and a CI pipeline that also runs the evaluation.
