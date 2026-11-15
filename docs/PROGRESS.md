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

## Sun 17:20 - browser run (headless Chrome against the local production build)

Verified in a real browser: wizard validation on every step, "Use my location", server-side geocoding, photo upload with preview, consent unchecked by default, submit -> result screen with reference number (now its own URL: `/citizen/complaints/[id]?submitted=1`), officer sees the complaint.

**Open bug (not fixed yet):** after an officer's "Update status" Server Action the status DOES change in the database and the page refreshes, but the green confirmation message from `useFormState` disappears (the form is remounted by the refresh after `revalidatePath`). Removing `officer/loading.tsx` did not help. Same risk for "Save note", "Reopen", admin forms. Next step: find the remount cause or show confirmation another way (for example redirect with a `?updated=1` flag, like the submit result).

Not yet run in the browser: reopen, mark-as-read, admin create/deactivate officer, routing rule, reassign, responsive screenshots (script is ready in the session scratchpad, not in the repo).

Still to do: README, docs/REPORT.md, docs/VIVA.md, docs/DEMO_SCRIPT.md, Lighthouse, Gemini verification (needs key), push + Vercel/Neon/Blob deploy (needs working GitHub auth), production seed.

## Sun 21:40-22:15 - form feedback fix, push, docs

- **Fixed** the open bug: successful Server Actions now redirect back with a whitelisted `?notice=` code that the server renders (Post/Redirect/Get). Validation errors still return through `useFormState`.
- **Verified in headless Chrome** (local production build): full wizard, officer status update and internal note, citizen sees resolution but not the note or risk, reopen, mark one / mark all notifications read, public tracker (status shown, title hidden), admin create + deactivate officer, add routing rule, reassign (previous department's officer loses access). No console errors. No horizontal overflow at 360 / 768 / 1280 px after a 6 px nav fix.
- **Pushed.** SSH keys still fail on this machine, so pushes go over HTTPS with the `gh` login (`git -c credential.helper='!gh auth git-credential' push https://github.com/Ankit28max/next-project.git <branch>`). No git config was changed. `phase-1-foundation` merged to `main` after lint, typecheck, tests and build passed.
- **Lighthouse (local production build, not the deployed URL):** landing 99/100/100/100 mobile and 100/100/100/100 desktop; citizen dashboard the same. Deployed-URL run: not done (no deployment yet).
- **Docs written:** README, docs/REPORT.md, docs/VIVA.md, docs/DEMO_SCRIPT.md. Demo-script data was run through the real scoring functions (duplicate 0.71, fake 40/MEDIUM).
- **Tier 3:** admin dashboard has simple HTML bar charts. A CI workflow (lint, typecheck, test, eval, build) is written on the local branch `ci-workflow` but NOT pushed: the `gh` token lacks the `workflow` scope (`gh auth refresh -s workflow`, then push that branch).

## Cut (and why)

- Next.js upgrade: stayed on 14.2.35; end-of-life risk stated in the README. Too risky one day before the deadline.
- Dockerfile: not needed for Vercel; listed as future work.
- `any` cleanup: moot, the rewritten code has no `any`.
- Citizen profile page, officer workload page, admin users page from the template: removed rather than restyled (they were read-only filler; workload is now on the officer overview).
- E2E browser tests are not in the repository (they were run from a scratch folder with puppeteer-core and the system Chrome). Only unit tests are committed.

## Unverified (needs the human-only setup)

- Vercel deployment, `prisma migrate deploy` on Neon, Vercel Blob storage path of `storage.ts`, `seed:prod` against Neon.
- The Gemini call end to end, and the default model name `gemini-2.5-flash` (no key was available; if the name is retired the app falls back to rules and says so).
- Lighthouse against the deployed URL.
- The GitHub Actions workflow has never run (not pushed, see above).

## Sun 23:00-23:40 - Gemini key added, vision model verified

- The user had pasted the key into the tracked `.env.example`. It was never committed. Moved it to the git-ignored `.env.local` and restored `.env.example`.
- **Default model was wrong** (flagged earlier as unverified): `gemini-2.5-flash` answers 404 "no longer available to new users". The app fell back to rules and recorded the reason, as designed. Timed the real request against current models: `gemini-3.8-flash` and `gemini-3.5-flash` exceeded the 10 s timeout; `gemini-3.5-flash-lite` answers in 1-2.5 s. Default is now `gemini-3.5-flash-lite`.
- **Verified:** real vision calls return valid JSON that passes the zod schema; `/api/health` reports "vision model with rules fallback"; fallback on 404, timeout and 429 each recorded with the reason.
- **Eval with vision (33 cases):** category 33/33; duplicates 5/5 and 5/5; suspicious flag recall 5/5, precision 5/26. The low precision is because the synthetic drawings are (correctly) described as not real photos. Reported as measured in README and REPORT; no thresholds were changed.
- Free tier is about 15 requests/minute: `scripts/eval.ts` now pauses 5 s between vision calls. An unpaced run got 429 after 14 calls.
- Demo implication recorded in DEMO_SCRIPT: use real phone photos with the vision model on, or record in rules-only mode.
- Still unverified: everything on Vercel/Neon/Blob; vision fraud precision on real photographs.
