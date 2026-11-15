# Viva preparation guide

Read this with the code open. Every claim here can be shown in a file; the file is named each time.
If an examiner asks something you do not know, say so and point to where you would look. Do not invent numbers.

## Who explains what

| Area | Lead | Backup | Files to know by heart |
|---|---|---|---|
| Authentication, authorization, security | Abhinav Singla | Devansh | `src/lib/auth/*`, `src/middleware.ts`, `src/lib/http.ts`, `next.config.js` |
| Database, Prisma, seeds, deployment | Ankit Singh | Abhinav Singla | `prisma/schema.prisma`, `prisma/seed*.ts`, `src/lib/complaints/submit.ts`, README "Deploy" |
| Upload, AI pipeline, duplicates, fraud, routing, evaluation | Devansh | Ankit Singh | `src/lib/images/*`, `src/lib/ai/*`, `eval/dataset.ts`, `scripts/eval.ts` |
| Next.js routing, rendering strategies, Server Actions, UI | shared: Abhinav (rendering), Ankit (Server Actions), Devansh (UI and accessibility) | | `src/app/**`, `src/actions/*`, `src/components/**` |

Everyone must be able to walk through the full life of one complaint (section 0).

## Recommended reading order

1. `README.md` (what the app does, how the analysis works)
2. `prisma/schema.prisma` (the data model: read the comments)
3. `src/lib/ai/config.ts` (every number in one place)
4. `src/lib/auth/guards.ts`, then `token.ts`, `session.ts`, `src/middleware.ts`
5. `src/lib/images/dhash.ts`, `process.ts`, then `src/app/api/upload/route.ts`
6. `src/lib/ai/text.ts`, `categories.ts`, `classification.ts`, `gemini.ts`
7. `src/lib/ai/duplicates.ts`, `fraud.ts`, `routing.ts`
8. `src/lib/complaints/submit.ts` (the pipeline that ties 5-7 together), then `workflow.ts`
9. `src/actions/complaints.ts`, `src/app/citizen/submit/SubmitWizard.tsx`
10. `src/app/page.tsx`, `src/app/how-it-works/page.tsx`, `src/app/citizen/page.tsx` (three rendering strategies)
11. `src/components/complaints/StaffComplaintView.tsx` (what the officer sees)
12. `tests/*.test.ts` and `scripts/eval.ts`

## 0. One complaint from start to finish

1. Citizen signs in: `POST /api/auth/login` checks the bcrypt hash and sets a JWT cookie.
2. Citizen opens `/citizen/submit`. `middleware.ts` checks the cookie and role; the layout checks again against the database.
3. Step 2 of the wizard: the map sets coordinates only when the citizen clicks or uses GPS. `/api/geocode` suggests an address.
4. Step 3: the browser shrinks the photo (`client-resize.ts`) and posts it to `/api/upload`. The server checks the bytes, reads EXIF facts, strips metadata, computes the dHash, stores the file and returns an image id.
5. Step 4: the citizen ticks consent and submits. The Server Action `submitComplaintAction` calls `submitComplaint()`.
6. `submitComplaint()` validates with zod, checks the image id belongs to this user, classifies (rules, then Gemini if configured), then in one transaction finds duplicates, scores risk, routes, and writes everything.
7. The citizen is redirected to the complaint page with the reference number.
8. The assigned officer sees it in `/officer/complaints`, reads the analysis and updates the status (`updateStatusAction`). The citizen gets a notification.
9. If the citizen is not satisfied after "Resolved", they reopen it (`reopenAction`).

---

## 1. Authentication

**Plain explanation.** When you log in, the server checks your password against a stored bcrypt hash. If it matches, the server creates a signed token (JWT) containing your user id and role and puts it in a cookie. On every later request the server verifies the signature, then loads your user from the database.

**Design choices and why.**
- *JWT in an httpOnly cookie:* JavaScript on the page cannot read it, so a script-injection bug cannot steal the session. `SameSite=Lax` stops other sites sending it on POST requests.
- *No fallback secret:* the old code had a secret written in the source. Anyone who read the repository could forge an admin token. Now the server refuses to start without `JWT_SECRET` (`src/lib/env.ts`, `src/instrumentation.ts`).
- *Database lookup on every request:* the token alone would stay valid for 7 days even after an admin deactivates the account. Loading the user each time makes deactivation immediate.
- *`jose` library:* middleware runs in the Edge runtime, where the older `jsonwebtoken` library does not work.

**Alternatives rejected.** Auth.js/NextAuth (fixed decision: keep custom auth, and it hides the mechanism we need to explain). Token in `localStorage` (readable by any script). Server-side session table (more moving parts; the per-request user lookup already gives us revocation).

**Likely questions.**

1. *What is inside the JWT and can the user change it?*
   The user id (`sub`), the role, issue time and expiry. The user can read it (it is only base64), but cannot change it: the signature is computed with a secret only the server knows, and `jwtVerify` rejects a token whose content does not match its signature. Test: `tests/authorization.test.ts`, "rejects tampered tokens".
2. *Why bcrypt and not SHA-256?*
   SHA-256 is fast, so an attacker with a leaked database can try billions of guesses per second. bcrypt is deliberately slow (cost 12) and salts every hash, so identical passwords have different hashes.
3. *How do you stop someone finding out which emails are registered?*
   Login returns one message for every failure and compares against a dummy hash when the email is unknown, so timing is similar. Registration always answers "if this email was not registered, your account is ready" and never signs the user in.
4. *Trap: "The middleware protects the routes, so why check again in the page?"*
   Middleware only verifies the token. It cannot know the account was deactivated, and it does not cover Server Actions or API routes called directly. Defence in depth: middleware, then `requireRole`, then `canAccessComplaint`.
5. *What happens on logout? Is the token destroyed?*
   The cookie is deleted. The token itself would still verify until it expires if someone had copied it; that is a known property of JWTs. Our per-request database check limits the damage (deactivate the account), and a production system could add a token version column to revoke all sessions.

## 2. Authorization

**Plain explanation.** Authentication answers "who are you"; authorization answers "may you do this". Two small pure functions in `src/lib/auth/guards.ts` hold all the rules: `assertRole` (deny unless your role is on the list) and `canAccessComplaint` (citizen: own; officer: own department; admin: all).

**Design choices.** Deny by default. An officer without an active profile, or a complaint without a department, matches nothing. Lists use `complaintScope`, the same rule written as a database filter, so a list can never show what the detail page would refuse. Denied detail pages answer "not found", so ids cannot be probed.

**Alternatives rejected.** Checking roles inline in each route (the old code did; three routes had three different, wrong versions). A permissions library (too heavy for three roles).

**Likely questions.**

1. *An officer changes the id in the URL to a complaint of another department. What happens?*
   The page loads the complaint, `canAccessComplaint` returns false, and `notFound()` is rendered. The API returns 404. Verified with HTTP calls (see PROGRESS.md).
2. *Can an officer reassign a complaint?*
   No. `reassignComplaint` starts with `assertRole(user, ['ADMIN'])`.
3. *Could a citizen call the status-update Server Action directly?*
   They can send the request, but `updateStatus` calls `assertRole(user, ['OFFICER', 'ADMIN'])` first. Server Actions are public HTTP endpoints, so each one checks the user itself.
4. *Why are these functions "pure" and why does that matter?*
   They take a user object and a complaint object and return a boolean; no database, no cookies. That makes them trivial to unit-test (17 tests) and impossible to bypass by calling a different code path.
5. *Trap: "Does the citizen see the fraud score?"*
   No. The citizen page uses a `select` that does not include risk fields, and the API strips them for citizens. Telling a submitter their score would teach them how to avoid the checks and would accuse honest people.

## 3. Database and Prisma

**Plain explanation.** PostgreSQL stores everything. Prisma is the layer that turns TypeScript calls like `prisma.complaint.findMany(...)` into SQL and gives typed results. The schema file is the single description of the tables; migrations are the SQL files that create them.

**Design choices.**
- *Transaction for submit:* the complaint, its links, analysis, history and notifications are written together or not at all.
- *`select` instead of `include`:* `include: { citizen: true }` returned the password hash to the page. `select` lists the exact columns.
- *Pooled vs direct URL:* serverless functions open many short connections, so the app uses Neon's pooler; migrations need a direct connection.
- *Analysis in its own table:* the complaint row keeps a short summary; `ComplaintAnalysis` keeps what was decided, by which provider, and why.
- *Image row before complaint:* the upload creates the row; submit attaches it. The client never sends a URL or hash.

**Alternatives rejected.** MongoDB (the data is relational and we need transactions). Raw SQL everywhere (no type safety). `prisma db push` instead of migrations (no history, unsafe for production).

**Likely questions.**

1. *What is a migration and why not just edit the database?*
   A migration is a versioned SQL file generated from a schema change. Committed migrations mean every environment gets exactly the same tables in the same order; `prisma migrate deploy` applies only the missing ones.
2. *What happens if two complaints get the same reference number?*
   The column is unique, so the second insert fails with Prisma error P2002. The code catches exactly that error and retries the transaction with a new random number (up to 3 times).
3. *Why is the Gemini call outside the transaction?*
   A transaction holds a database connection. The model call can take 10 seconds; holding connections that long would exhaust the pool. So: slow network call first, then one fast transaction.
4. *Show a query that uses an index.*
   The officer queue filters by `departmentId` and `status`; the schema has `@@index([departmentId, status])`. The duplicate pre-filter uses `@@index([latitude, longitude])`.
5. *Trap: "Your seed deletes all data. What if someone runs it on production?"*
   `prisma/seed.ts` refuses when `NODE_ENV=production` and separately refuses when the database host is not localhost. Production uses `seed-production.ts`, which only creates missing rows.

## 4. Upload

**Plain explanation.** The browser shrinks the photo and sends it. The server trusts nothing about it: it looks at the first bytes to see what the file really is, reads a few facts from the metadata, re-encodes the picture (which throws the metadata away), computes a fingerprint, stores the result and remembers it in the database.

**Design choices.**
- *Magic bytes, not MIME type or extension:* those are just text the client sends.
- *Re-encode with sharp:* removes GPS and device data (privacy) and neutralises files that are only pretending to be images.
- *Read EXIF before stripping:* the risk checks need capture time and GPS, but we store only those facts.
- *Storage adapter (`storage.ts`):* two functions, `putImage` and `getImage`. Vercel Blob in production, a folder in development. Nothing else knows where files live.
- *Browser resize + EXIF copy:* Vercel rejects bodies over 4.5 MB; a canvas loses EXIF; `copyExif` puts it back.

**Alternatives rejected.** Saving to `public/uploads` (read-only on Vercel, and lost on every deploy). Direct browser-to-Blob uploads (the server would never see the original bytes, so no EXIF check or hash from real content). Trusting a client-computed hash (a cheater would simply send a different one).

**Likely questions.**

1. *I rename `virus.exe` to `photo.jpg` and upload it. What happens?*
   `sniffImageType` sees it does not start with a JPEG, PNG or WebP signature and the request gets a 400. Even a file with a valid header but broken content fails at the `sharp` decode step. Tests: `tests/hashing.test.ts`.
2. *What is EXIF and why remove it?*
   Metadata a camera writes into the file: time, GPS position, device. Publishing it would leak where and when a citizen took the photo. We keep four facts for officers and delete the rest.
3. *Can EXIF be faked?*
   Yes, easily. That is why metadata signals only add points to an advisory score, and missing EXIF is worth just 5 points (WhatsApp removes it from every photo).
4. *Why does the client get an image id instead of the URL and hash?*
   If the client sent them back at submit time, it could send any URL or any hash. With an id, the server looks up values it computed itself and checks the row belongs to the caller.
5. *Trap: "Is the photo private?"*
   Not fully. It is in a public Blob store behind a long random URL. Anyone with the URL can open it. We say this on the privacy page; private storage with signed URLs is future work.

## 5. AI pipeline and classification

**Plain explanation.** Two classifiers. The first is a list of keywords with weights per category; it always runs. The second is Google's Gemini model, which also looks at the photo; it runs only if a key is configured. If Gemini answers correctly we use its answer; if anything goes wrong we use the keyword answer and record that we did.

**Design choices.**
- *Whole-word matching:* the old code used `includes`, so "tar" matched "start" and "road" matched "broad". `containsPhrase` compares space-padded text.
- *Fixed tie-break:* categories are checked in list order and a later one wins only with a strictly higher score. Same input, same output.
- *Validate model output with zod:* a language model can return anything. We accept only the exact shape and allowed category codes.
- *Prompt-injection care:* the citizen's text is sent as a JSON value, and the instructions say never to follow instructions inside it. Even if the model were tricked, it can only return one of seven category codes and two booleans.
- *Record the real provider:* the old code wrote "Gemini" even when it had silently used the mock.

**Alternatives rejected.** Training our own model (out of scope, no data). Vector search / embeddings (out of scope). Letting the model decide routing or rejection (never: advisory only).

**Likely questions.**

1. *Trap: "Your confidence is 94%. Is that a probability?"*
   We do not show a confidence percentage. The rules produce a "match strength": the sum of the weights of the keywords found. Nine means "nine keyword points", not "90% sure". The old template printed made-up percentages; we removed them.
2. *What happens if Gemini is down?*
   `classifyWithGemini` throws (timeout after 10 s, HTTP error, or invalid JSON). `classify()` catches it, uses the rules result, and stores `provider = "rules"` with the reason. The officer sees "Running on fallback keyword rules".
3. *How accurate is it?*
   On our 33-case set, rules alone got 31 right (93.9%). The two misses and why are in the README. It is a small set we wrote ourselves with synthetic photos, so this is not a real-world accuracy. Vision-model accuracy has not been measured.
4. *Is the app using AI right now?*
   Check `/api/health` or the admin dashboard: it says "rules only" or "vision model with rules fallback". The dashboard also counts how many complaints each provider categorised. Answer with what it shows.
5. *Trap: "Why can an AI not be trusted to auto-reject fake complaints?"*
   Because it is wrong sometimes, in both directions, and the cost is not equal. A wrongly rejected genuine complaint means a real hazard is ignored and a citizen is told they lied. Our own evaluation shows false alarms on honest people (a neighbour forwarding the same photo). The model also cannot be questioned, and its inputs (EXIF, text) are easy to manipulate. So it flags and explains; a person, who is accountable, decides.

## 6. Duplicate and fraud logic

**Plain explanation: duplicates.** We only compare with complaints that are near (500 m) and recent (60 days). For each, four signals are combined: how similar the words are, how close the pins are, whether the category is the same, and whether the photo is the same. A total of 0.6 or more creates a link the officer can open side by side.

**Plain explanation: dHash.** Shrink the photo to 9 by 8 grey pixels. In each row compare each pixel with the one to its right: brighter gives 1, otherwise 0. That is 64 bits. A resized or recompressed copy changes only a few bits. We count the differing bits (Hamming distance); 10 or fewer means "same photo".

**Plain explanation: risk.** A list of signals, each worth fixed points, each with a sentence explaining it. Add them up, cap at 100. 30+ is medium, 60+ is high.

**Design choices.** SQL pre-filter instead of "the 50 newest" (the old code missed anything older). One threshold constant used everywhere (the old code used 60 in one file and 65 in another). Pure scoring functions (`scoreDuplicate`, `assessFraud`) so the app, the tests and the evaluation run the same code. Links, never deletes.

**Alternatives rejected.** MD5/SHA hash of the file (changes completely after one re-save). Face or object recognition (out of scope and a privacy problem). Auto-merging duplicates (an officer may know they are two different potholes).

**Likely questions.**

1. *Why 10 bits and not 0?*
   Zero would only match byte-identical images. Forwarding through a messaging app resizes and recompresses; in our evaluation set such copies differ by 1 to 4 bits, while different pictures differ by 13 or more. Ten sits in between. It is a judgment, not a law; a larger real dataset could move it.
2. *Two different people report the same pothole with different photos. Is that fraud?*
   No, it is a duplicate: linked, low risk. Fraud signal fires only when the *same photo* appears under *different citizens*.
3. *Give an example where your fraud score is wrong.*
   Case e10 in `eval/dataset.ts`: a neighbour forwards the same photo of a real burst pipe. It scores 50 (medium) although it is genuine. That is exactly why the score is advisory.
4. *What did you fix in the old fraud logic?*
   Four things. The "category mismatch" check compared the AI's own category against the text it had just classified, so it was circular: removed. The gibberish regex flagged "Plot 12345": now only repeated letters and whole filler words count. The duplicate result was passed in but never used: now a self-duplicate adds points. HIGH was 60 in one place and 65 in another: now one constant.
5. *Trap: "Precision 60%, recall 60%. Is that good?"*
   It is honest. On 5 suspicious cases, rules caught the 3 that leave traces in metadata or text and missed the 2 that require looking at the photo. With so few cases the percentages move 20 points per case. What it shows is the shape of the problem: rules need the vision model for content, and both need a human.

## 7. Routing

**Plain explanation.** First, admin rules: if the text contains one of a rule's keywords as a whole word, use that rule's department. Otherwise use the default department of the category. Then pick the active officer in that department with the fewest open cases.

**Design choices.** Open cases include REOPENED (the old code ignored them, so officers with reopened work looked free). Ties break by employee id so the result is predictable. Assignment happens inside the submit transaction. No department means "needs manual triage", visible to admins.

**Alternatives rejected.** Round-robin (ignores workload). Nearest officer by location (we have no officer locations). Letting the model choose the officer (not its job).

**Likely questions.**

1. *Two complaints arrive at the same moment. Could both go to the same officer?*
   Yes, it is possible: each transaction counts open cases before the other commits. The effect is a workload difference of one, which evens out on the next assignment. Strict fairness would need row locking; not worth it at this scale.
2. *What if the department has no active officer?*
   The complaint gets the department but no officer and stays "Submitted". Any officer who later joins, or an admin, can pick it up.
3. *An admin adds the rule "school -> Special Cell". Does "preschooler" match?*
   No. Whole-word matching. Test: `tests/routing.test.ts`.
4. *Does changing a rule move existing complaints?*
   No. Rules apply to new complaints. Existing ones are moved with the admin's Reassign form, which writes an audit entry.
5. *Why can only admins reassign?*
   Otherwise an officer could push work into another department, or pull in complaints they should not see.

## 8. Rendering strategies and Next.js

**Plain explanation.** A page can be built once (static), built once and refreshed now and then (ISR), or built for each request (dynamic). Dynamic pages can also be streamed: the frame is sent immediately and slow parts arrive when ready.

| Strategy | Page | Line that makes it so |
|---|---|---|
| Static | `/about`, `/how-it-works`, `/privacy` | `export const dynamic = 'force-static'` |
| ISR | `/` | `export const revalidate = 300` |
| Dynamic | everything under `/citizen`, `/officer`, `/admin` | the layout reads `cookies()` |
| Streaming | dashboards | `loading.tsx` and `<Suspense fallback=...>` |

In the `npm run build` output, `○` marks static pages and `ƒ` marks dynamic ones.

**Design choices.** The root layout reads no cookies; that is what lets public pages be static. Server Components fetch data directly with Prisma (no API round trip). Client components are used only where the browser is needed: forms, the wizard, maps.

**Server Actions vs API routes.** A Server Action is a server function called from a form or component; Next.js creates the endpoint for you. We use them for mutations triggered by our own UI (submit, status, reopen, admin forms). API routes are plain HTTP endpoints; we use them where a normal request is the natural shape: login, file upload, geocoding, health check, and a JSON API for complaints.

**Likely questions.**

1. *Show me one static, one dynamic and one streamed page and prove it.*
   Run `npm run build` and point at the symbols; open `how-it-works/page.tsx`, `citizen/complaints/page.tsx`, `citizen/page.tsx`.
2. *Why is the landing page ISR rather than dynamic?*
   It shows three counts. Rebuilding every 5 minutes gives almost-fresh numbers with the speed of a static file and no database query per visitor.
3. *What does `'use client'` do, and why not put it everywhere?*
   It marks a component that runs in the browser (state, events). Everything it imports is sent to the browser as JavaScript. Keeping pages as Server Components keeps the download small and lets them talk to the database safely.
4. *Are Server Actions secure? They are just functions.*
   They are POST endpoints. Next.js checks the Origin header for them, and each of ours checks the user and validates input with zod before doing anything.
5. *Trap: "After a status update, how does the page show the new data?"*
   The action calls `revalidatePath`, then redirects back with `?notice=status-updated`. The page re-renders on the server with fresh data and shows the confirmation. We redirect because a message kept only in client state was being lost when the page refreshed.

## 9. Deployment

**Plain explanation.** Code is on GitHub. Vercel builds every push to `main`. The database is on Neon, photos on Vercel Blob. Secrets live in Vercel's environment variables, never in git.

**Design choices.** `vercel-build` runs `prisma migrate deploy` before `next build`, so the database always matches the code. `postinstall` runs `prisma generate`. `/api/health` checks the database connection.

**Alternatives rejected.** A VPS with Docker (more to operate, nothing gained for the course). Storing uploads in the database (large rows, slow). SQLite (no serverless-friendly hosting, no concurrent writers).

**Likely questions.**

1. *Why two database URLs?*
   The pooled URL goes through a connection pooler that serverless functions need. Migrations must use a direct connection.
2. *Where is the JWT secret?*
   Only in Vercel's environment variables and local `.env*` files that git ignores. `.env.example` has placeholders.
3. *What runs when you push?*
   Vercel installs dependencies, generates the Prisma client, applies pending migrations, builds. If the build fails, the previous version stays live.
4. *How would you roll back?*
   In Vercel, promote the previous deployment. Database migrations are forward-only, so a schema change needs a new migration to undo it.
5. *Trap: "Next.js 14 is old. Why?"*
   Yes: it is past its support window and `npm audit` reports advisories. We pinned the latest 14.2 patch and say so in the README. A two-major-version upgrade the day before a deadline risked breaking everything; it is the first item under future work.

## 10. Security checklist (quick answers)

| Threat | What we do | Where |
|---|---|---|
| Forged session | Signed JWT, no fallback secret | `auth/token.ts`, `env.ts` |
| Stolen cookie by script | `httpOnly` cookie, CSP | `auth/session.ts`, `next.config.js` |
| Cross-site request forgery | `SameSite=Lax`, Origin check, Next.js action check | `http.ts` |
| SQL injection | Prisma parameterises every query | everywhere |
| Cross-site scripting | React escapes output; no `dangerouslySetInnerHTML` | components |
| Seeing others' data | `canAccessComplaint`, `complaintScope`, `select` | `auth/guards.ts` |
| Password guessing | bcrypt, rate limits, generic errors | `api/auth/login` |
| Malicious upload | magic bytes, size limit, re-encode, server-chosen name | `images/process.ts` |
| Bad input | zod on every input, capped pagination | routes and actions |
| Clickjacking | `X-Frame-Options: DENY`, `frame-ancestors 'none'` | `next.config.js` |

**Known gaps to admit if asked:** in-memory rate limiter (per instance), CSP allows inline scripts, photos behind unguessable public URLs, no email verification or password reset, Next.js 14 end of life.
