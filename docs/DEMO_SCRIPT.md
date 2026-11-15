# Demo video script (about 4.5 minutes)

**Before recording**

- Use the deployed site (or `npm run dev` after `npm run seed:demo`). Check `/api/health` first.
- Browser at 1280 px wide, zoom 110%. Close other tabs. Allow location when asked.
- Have these three files ready (they are in the repository under `eval/images/`):
  - `pothole-4.jpg` (first pothole report)
  - `pothole-2.jpg` (a different photo, for the duplicate report)
  - `garbage-old-elsewhere.jpg` (metadata says: taken March 2025 in Delhi)
- Accounts (from the README): `citizen@jansetu.example` / `Citizen#2026demo`, `officer.pwd@jansetu.example` / `Officer#2026demo`, `admin@jansetu.example` / `Admin#2026demo`.
- On the **deployed** site there are no complaints yet, so record shot 3 first and use that complaint as the "original" for shots 5 and 6. The duplicate and fake examples must be near it: use the same map pin.
- **Pin location matters.** The sample photos carry GPS metadata from Phagwara (near LPU). Put the map pin in Phagwara: on campus use *Use my location*; anywhere else, click the map near LPU instead. A pin more than 2 km from the photo's GPS adds "photo GPS far from the pin" to the risk reasons of the genuine complaint.
- Expected results with this data (checked against the scoring code): shot 3 risk 0 (low); shot 5 match score 0.71 with the first report; shot 6 risk 40 (medium) with two reasons.
- Say only what the screen shows. Do not quote accuracy numbers other than those in the README.

| # | Time | Screen | Do | Say |
|---|---|---|---|---|
| 1 | 0:00-0:20 | Landing page | Scroll slowly to "What the software does, and does not do" | "JanSetu is a grievance portal built with Next.js. Citizens report civic problems with a photo and location. Software sorts and routes complaints and flags possible duplicates and fakes. A human officer always decides." |
| 2 | 0:20-0:40 | Register | Open Register, fill: name `Riya Demo`, email `riya.demo@jansetu.example`, password `Riya#2026demo1`. Submit, then sign in | "Registration hashes the password with bcrypt. The session is a signed token in an httpOnly cookie." |
| 3 | 0:40-1:35 | Report a problem | **Step 1:** title `Deep pothole outside the market gate`, description `There is a deep pothole on the road outside the market gate. Two scooters slipped here this week.` **Step 2:** press Continue once without a pin to show the error, then press *Use my location* (or click the map). **Step 3:** choose `pothole-4.jpg`. **Step 4:** show the unticked consent box, tick it, Submit | "Four steps. Location is required and there is no default pin. The photo is resized in the browser, then the server checks the real bytes, removes the metadata and computes a 64-bit fingerprint. Consent is never pre-ticked." |
| 4 | 1:35-1:55 | Result screen | Point at the reference number, category, department, "Sorted by". Copy the reference number. Open *Track* in a private window and paste it | "The complaint was categorised as Roads and Potholes and routed to Public Works. This line says honestly whether the vision model or the keyword rules did the sorting. Anyone can track the status with the reference number; the tracker shows nothing personal." |
| 5 | 1:55-2:30 | Duplicate example | Still as the citizen (or sign in as a second citizen): Report a problem. Title `Big pothole near market gate`, description `Large pothole on the road near the market gate, vehicles are getting damaged.` Same map pin. Photo `pothole-2.jpg`. Submit | "A second report of the same pothole, with a different photo. The result screen tells the citizen that similar complaints exist nearby. The complaint is still registered: duplicates are linked, never deleted." |
| 6 | 2:30-3:00 | Fake example | Sign out. Register or sign in as another citizen. Report: title `Garbage dumped near the school`, description `A lot of garbage has been dumped near the school boundary wall and nobody is cleaning it.` Pin anywhere nearby. Photo `garbage-old-elsewhere.jpg`. Submit | "This photo's metadata says it was taken twenty months ago in another city. The citizen sees a normal confirmation. The warning is for the officer only." |
| 7 | 3:00-3:50 | Officer | Sign in as `officer.pwd@jansetu.example`. Show Overview, then Complaint queue. Open the duplicate from shot 5: scroll to *Possible duplicates* and show the side-by-side comparison and reasons. Then sign in as `officer.sanitation@jansetu.example`, open the garbage complaint, show *Risk signals* with the reasons and points. Back as the PWD officer on the first pothole: set status *Resolved* with remark `Pothole filled with cold mix on 16 November.` | "Officers see only their own department. Here are the two reports side by side with the match score and the reasons. For the garbage complaint the risk panel explains every point: photo GPS far from the pin, photo older than thirty days. It is advice. Nothing was rejected automatically. I resolve the first pothole with a remark." |
| 8 | 3:50-4:10 | Citizen again | Sign in as the first citizen, open the complaint: show the resolution and timeline, open Notifications and press *Mark as read*. Optionally press *Reopen* with a reason | "The citizen sees the resolution and the timeline, but not the risk score or internal notes. If the fix was not real, they can reopen the complaint." |
| 9 | 4:10-4:35 | Admin | Sign in as admin. Dashboard: counts and "Who categorised". Officers: show Create officer and Deactivate. Routing rules: add `school, hospital` to a department. Audit log | "The administrator sees everything: counts, which classifier answered, officers, keyword routing rules, and an audit log of every action." |
| 10 | 4:35-4:45 | How it works page | Scroll once | "Every threshold on this page is read from the same configuration file the code uses. Thank you." |

**If something goes wrong while recording**

- "Use my location" is denied: click the map instead.
- The address does not fill in: type it (address lookup is a convenience and is rate-limited).
- Upload says "too many requests": wait a minute; the limit is 20 uploads per 10 minutes.
- The duplicate was not linked: the two pins were more than 500 m apart. Submit again with the same pin.

**Honest phrases to use if asked on camera**

- "The match strength is a keyword score, not a probability."
- "Without a Gemini key the app runs on keyword rules and says so."
- "Our evaluation set has 33 hand-written cases with synthetic photos; results are in the README."
