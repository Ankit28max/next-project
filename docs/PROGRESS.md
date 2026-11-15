# Progress log

Running log of decisions, what was verified, what is unverified and what was cut.
Times are IST. "Verified" means I ran it and saw the result; anything else is marked unverified.

## Sun 15 Nov, 16:25 - findings after reading the whole repo

All defects listed in the brief were checked against the code and **confirmed**, except where noted:

- Confirmed: duplicate `dynamic` identifier in both `[id]` pages (build break); hard-coded JWT fallback secret (also printed in `.env.example`); uploads to `public/uploads`; upload trusts client MIME, name, hash and URL; 32-bit hash of the first 1 KB; wizard defaults to New Delhi coordinates; demo credentials on home and login pages (login page also had one-click autofill); seed wipes all tables with no guard; any officer can reassign any complaint; officers without a department see everything; duplicate scan limited to the 50 newest complaints; AI category never written to `categoryId`; substring keyword matching; Gemini provider (retired model, no image, key in URL, no validation, silent mock fallback labelled as Gemini); 5-digit random reference numbers; unvalidated page/limit/enums (500s); no rate limiting; registration reveals existing emails; 6-character passwords; `include: { citizen: true }` loading password hashes; no lockfile, no migrations, no postinstall; `commit.sh` and `test.txt`.
- Confirmed (Tier 2): Reopen button was `type="button"` inside a form posting to a PATCH-only route; "mark all read" used `<form method="PATCH">` (browsers only send GET/POST, so it never worked); admin pages read-only; hard-coded "92%" fallback and "94%+" claim; "identity verified" text; pre-checked consent; Nominatim called from the browser; Leaflet from unpkg; `remotePatterns` hostname `**`; two of four test files tested copies of logic rather than app code.

Defects **not in the brief** that I found:

1. The root layout read the session cookie, which forces every page to render dynamically. "Static" About / How-it-works pages were never static.
2. `/citizen/complaints/[id]` only checked ownership when the viewer was a citizen: an officer or admin URL-guessing that path saw any complaint.
3. Complaint creation accepted a client-supplied `preferredDepartmentId` and unvalidated foreign keys (500 on a bad id).
4. Officers could set any status, including REOPENED and SUBMITTED, with no transition rules.
5. The pipeline ran outside any transaction after the insert; on failure the complaint was stored as fraud level **LOW**.
6. Fraud score started at a made-up baseline of 10 and was clamped to 5-98 to look plausible.
7. Seed accounts used `@grievance.gov.in` addresses and `commit.sh` set a fake `ankit@grievance.gov.in` git identity. All accounts now use the reserved `.example` domain.
8. Home-page tracker posted to a login-only page.
9. `next/font`, `error.tsx`, `loading.tsx`, `not-found.tsx`, security headers: none existed.

Unrealistic items and proposed handling: none of Tier 1 or 2 was cut. See "Cut" below for Tier 3.

## Decisions

- **Rewrite vs restyle.** The data shapes changed so much (server-computed image rows, analysis table, Server Actions) that most pages were rewritten around the existing structure (same routes and roles) instead of patched. Old API routes that only fed read-only admin pages were deleted; pages now query in Server Components and mutate through Server Actions.
- **JWT library: `jose` instead of `jsonwebtoken`.** Middleware runs in the Edge runtime, where `jsonwebtoken` does not work. One library for both places.
- **No `@google/genai` SDK.** The Gemini REST endpoint is called with `fetch` and the key in the `x-goog-api-key` header: one function, no dependency.
- **Photo is required** for a complaint (the assignment is about image analysis; it also keeps the pipeline to one path).
- **Transaction boundary.** The vision-model call (slow, external) happens *before* the transaction; duplicate search, risk scoring, routing, officer assignment and all writes happen inside one `prisma.$transaction`. Holding a database transaction open across a 10-second HTTP call would exhaust the pool.
- **Browser resize strips EXIF**, which would blind the server-side EXIF checks. The browser therefore copies the original EXIF block into the resized JPEG (`copyExif`, tested); the server reads it, stores a few facts, then strips it.
- **Uploads create a database row** (`ComplaintImage` with `complaintId = NULL`); the client only receives an id. Submit accepts that id only if the row belongs to the caller and is unattached.
- **Registration never signs the user in** and always returns the same message, so it cannot be used to test whether an email exists.
- **Manual reassignment is admin-only.** Officers act only inside their own department.
- **Denied complaint pages render the 404 page.** With streaming (`loading.tsx`) the HTTP status is already 200 by then; verified that no complaint data is in the response. API routes return real 404s.
- **Category picker kept (optional).** If the citizen picks a category it is stored; the analysis suggestion is stored separately and both are shown to the officer.
- **Risk points** `spamText` 30 and `selfDuplicate` 10 were fixed before the first evaluation run and not changed afterwards.
- **Evaluation photos are synthetic SVG drawings.** First run showed same-scene drawings colliding under dHash (they were near-identical compositions). I added framing variety to the generator (mirroring, horizon, background shapes); the hash threshold (10) was not touched. Different drawings now differ by >= 13 bits, forwarded copies by 1-4.

## Packages added (one line each)

- `sharp`: decode/re-encode uploads (strips EXIF) and compute the dHash.
- `exifr`: read EXIF facts before stripping.
- `@vercel/blob`: production photo storage.
- `jose`: JWT sign/verify that works in Node and Edge.
- `tsx` (dev): run TypeScript scripts (seed, eval) with path aliases; replaces `ts-node`.
- `eslint`, `eslint-config-next` (dev): `npm run lint` had no config.
- Removed: `jsonwebtoken`, `react-hook-form`, `date-fns`, `ts-node` (unused or replaced).

## Phase 1 status (Sun 16:55)

Verified locally (production build, local Docker Postgres, local-disk storage):

- `npm run lint`, `npm run typecheck`, `npm test` (62 tests), `npm run build` all pass.
- Real migration `prisma/migrations/*_init` applied with `prisma migrate dev`.
- Demo seed runs the real pipeline; refuses with `NODE_ENV=production` and on non-local hosts.
- HTTP checks: security headers present; cross-site POST blocked; generic login error; bad JSON / enums / limits return 400; upload rejects text-as-jpg, corrupt JPEG, >4 MB, wrong role; stored file has no EXIF; client file name and MIME ignored; submit rejects missing location, missing consent, bad category, someone else's image id; officers of another department get 404; citizen API never returns risk fields; role areas redirect correctly.
- `npm run eval` (rules only): numbers recorded in README.

Unverified so far: anything on Vercel / Neon / Vercel Blob; the Gemini call (no key yet); pushing to GitHub (SSH key and `gh` login are not working on this machine).
