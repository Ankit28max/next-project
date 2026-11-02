# JanSetu: Smart Grievance Redressal & Fake Complaint Detection System

An enterprise-grade civic grievance redressal portal built with Next.js App Router, Prisma ORM, PostgreSQL, Tailwind CSS, Leaflet OpenStreetMap, and Multimodal AI.

Designed for municipal governance and participatory civic redressing, the platform allows citizens to file grievances with photo evidence and GPS coordinates, while applying automated AI pipelines to classify categories, cluster geographic duplicates, flag suspicious submissions, and balance department officer workloads.

---

## 🏛️ System Overview & Objectives

In civic governance, traditional portals suffer from three primary bottlenecks:
1. **Misrouting Delays**: Citizens frequently select inappropriate departments, causing multi-week manual rerouting.
2. **Duplicate Fatigue**: When a water pipeline bursts or a major road develops a pothole, dozens of independent citizens report the same incident, leading to fragmented, redundant field team dispatches.
3. **Spam & Stock Photo Abuse**: False, malicious, or test submissions consume scarce field resources and compromise municipal analytics.

**JanSetu addresses these challenges via an end-to-end automated pipeline:**
- **Multimodal AI Classification**: Inspects complaint semantics and images to predict category, assign priority, and recommend the responsible municipal department.
- **Multi-Signal Duplicate Clustering**: Fuses spatial Haversine radius (<2km), TF-IDF text token similarity, category matching, and photo hash matching into a combined duplicate likelihood score.
- **Advisory Fraud Risk Scoring**: Calculates a 0–100 risk score and highlights specific anomaly flags (reused photos, keyboard-smash/spam text patterns, submission velocity bursts) for officer field verification without automated citizen penalization.
- **Workload-Balanced Routing**: Automatically assigns incoming grievances to active department officers with the lowest open ticket count.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Server Components, Server Actions & REST API Route Handlers |
| **Language** | TypeScript (Strict Mode) | Type safety across full frontend and backend data structures |
| **Database** | PostgreSQL 16 | Relational persistence with ACID transactions, constraints & indexes |
| **ORM** | Prisma ORM | Data modeling, migrations, and relational query builder |
| **Authentication** | Custom Session Tokens & bcrypt | Role-Based Access Control (RBAC) with secure HTTP-only cookies |
| **Styling & UI** | Tailwind CSS & Lucide Icons | Clean civic-tech design, responsive layouts, accessible UI |
| **Maps & Geo** | Leaflet & OpenStreetMap | Client-side interactive pin drop, GPS capture, reverse geocoding |
| **AI Layer** | Dual Provider Architecture | Deterministic Academic Engine + Google Gemini Multimodal Vision |
| **Testing** | Vitest | Automated unit and integration testing of algorithms & auth |

---

## 👥 Roles & Permissions Matrix

| Feature / Action | Citizen | Department Officer | System Administrator |
| :--- | :---: | :---: | :---: |
| Self-Registration & Profile Management | ✅ | ❌ (Seeded/Admin Created) | ❌ (Root Account) |
| File Grievance with Photo & Location | ✅ | ❌ | ❌ |
| Live Timeline Progress Tracking | ✅ (Public view) | ✅ (Full view) | ✅ (Full view) |
| Reopen Resolved Grievance | ✅ | ❌ | ✅ |
| Department Complaint Queue Access | ❌ | ✅ (Assigned Dept only) | ✅ (All Depts) |
| View Duplicate & Fraud Anomaly Telemetry | ❌ (Masked) | ✅ | ✅ |
| Update Status & Add Resolution Summary | ❌ | ✅ | ✅ |
| Post Internal Staff Notes | ❌ | ✅ | ✅ |
| Reassign Department / Officer | ❌ | ❌ | ✅ |
| Manage Departments, Rules & Audit Logs | ❌ | ❌ | ✅ |

---

## 🤖 AI Detection Methodology

### 1. Multimodal Category Classification
The system analyzes the grievance text using direct linguistic markers and contextual clustering to predict the civic department:
- **Roads & Potholes** (`ROADS`): Asphalt, crater, pavement, road cave-in $\rightarrow$ **Public Works Dept (PWD)**
- **Water Supply & Leakage** (`WATER_SUPPLY`): Pipe burst, water pressure, contamination $\rightarrow$ **Water Board (WATER)**
- **Streetlights & Electricity** (`LIGHTING`): Dark road, pole, transformer, wire $\rightarrow$ **Electricity Authority (ELEC)**
- **Sanitation & Garbage** (`SANITATION`): Waste, garbage dump, filth $\rightarrow$ **Health & Sanitation (HEALTH)**
- **Drainage & Sewage** (`DRAINAGE`): Overflowing drain, clogged manhole $\rightarrow$ **Water Board (WATER)**

Urgency tokens (`hazard`, `emergency`, `accident`, `burst`) automatically elevate priority to **URGENT** or **HIGH**.

### 2. Multi-Signal Duplicate Detection
To distinguish unique incidents from redundant citizen reports on the same issue:

$$\text{Combined Duplicate Score} = \left( 0.35 \cdot S_{\text{text}} + 0.35 \cdot S_{\text{geo}} + 0.15 \cdot S_{\text{cat}} + 0.15 \cdot S_{\text{img}} \right) \times T_{\text{decay}}$$

- **$S_{\text{text}}$**: Cosine token overlap similarity between incident descriptions.
- **$S_{\text{geo}}$**: Haversine distance over WGS84 coordinates ($1.0$ if distance $\le 50\text{m}$, scaling down to $0$ if $> 2\text{km}$).
- **$S_{\text{cat}}$**: Binary indicator ($1.0$ if matching civic categories).
- **$S_{\text{img}}$**: Perceptual/content image hash match ($0.95$ if matching evidence).
- **$T_{\text{decay}}$**: Proximity decay factor over 60 days.

*Note: Duplicate complaints are linked in the database and flagged for officers to coordinate dispatch—never deleted automatically.*

### 3. Fake & Suspicious Complaint Scoring
Evaluates 5 risk vectors to output a score from **0 to 100** and risk level (**LOW**, **MEDIUM**, **HIGH**):
1. **Reused Photo Evidence Across Disparate Accounts**: Exact image hash match submitted by an unrelated citizen account or different location ($+45$ risk penalty).
2. **Text Spam & Keyboard Smash Patterns**: Regular expression regex matching repeated sequences (`asdfghjk`, `12345`, `qwerty`) ($+30$ risk penalty).
3. **Brevity & Information Deficit**: Descriptions under 20 characters ($+25$ risk penalty).
4. **Velocity Bursts**: Citizen submitting $\ge 4$ grievances within 10 minutes ($+35$ risk penalty).
5. **Category-Content Semantic Mismatch**: Grievance text devoid of category domain terminology ($+15$ risk penalty).

> [!IMPORTANT]
> **Academic & Civic Safeguard**: Algorithmic risk scores serve strictly as an advisory flag to guide officer on-site verification. The platform enforces zero biometric tracking and never executes automated citizen penalties.

---

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js 18.x or 20.x
- PostgreSQL 14+ running locally or managed cloud instance (e.g., Supabase / Neon)

### 1. Clone & Install Dependencies
```bash
cd /home/ankit/next-project
npm install
```

### 2. Configure Environment Variables
Copy the template and adjust if necessary:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grievance_db?schema=public"
JWT_SECRET="academic-demo-jwt-secret-key-super-secure-min-32-chars-2026"
AI_PROVIDER="mock" # Set to "gemini" if GEMINI_API_KEY is provided
```

### 3. Generate Prisma Client & Migrate Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Database with Realistic Scenarios
```bash
npm run prisma:seed
```
*This populates departments, officers, citizen accounts, realistic grievances with duplicate pairs, and suspicious test cases.*

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Accounts for University Evaluators

The database seed provides ready-to-test accounts representing each perspective. All passwords are pre-configured:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Citizen (Primary)** | `citizen@grievance.gov.in` | `Citizen@123` | Amit Patel — Has active & resolved grievances |
| **Citizen (Duplicate Reporter)** | `citizen.priya@grievance.gov.in` | `Citizen@123` | Priya Sharma — Filed duplicate water burst report |
| **Officer (PWD - Roads)** | `officer.pwd@grievance.gov.in` | `Officer@123` | Er. Rajesh Kumar — Senior Executive Engineer |
| **Officer (Water Supply)** | `officer.water@grievance.gov.in` | `Officer@123` | Smt. Sunita Verma — Water Inspector |
| **Officer (Electricity)** | `officer.elec@grievance.gov.in` | `Officer@123` | Shri Vikram Singh — Lighting Engineer |
| **System Administrator** | `admin@grievance.gov.in` | `Admin@123` | Dr. Ramesh Sharma — Root Admin with full audit control |

*Tip: The login page includes quick-fill buttons for immediate one-click testing.*

---

## 🧪 Testing

Run the automated Vitest test suite:
```bash
npm test
```
The test suite validates:
- Haversine geographic distance calculations (0 km to multi-kilometer bounds)
- TF-IDF token overlap text similarity
- Gibberish and keyboard-smash spam heuristics
- AI complaint classification across civic categories
- Urgency priority elevation
- Password hashing and JWT session role verification

---

## 📁 Repository Structure

```
├── prisma/
│   ├── schema.prisma           # Relational schema (12 models, relations & indexes)
│   └── seed.ts                 # Realistic seed data generator
├── public/
│   └── uploads/                # Local evidence storage fallback
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root civic layout with Navbar & Footer
│   │   ├── page.tsx            # Public Landing Page & Real-Time Stats
│   │   ├── login/page.tsx      # Multi-role login with demo autofill
│   │   ├── register/page.tsx   # Citizen registration
│   │   ├── citizen/            # Citizen Portal (Wizard, Tracking, Notifications)
│   │   ├── officer/            # Department Officer Workspace & Review
│   │   ├── admin/              # Admin Analytics, Departments, Rules, Audit
│   │   └── api/                # Next.js Route Handlers (Auth, Complaints, Upload, Stats)
│   ├── components/
│   │   ├── ui/                 # Reusable accessible UI components (Button, Card, Badge, etc.)
│   │   ├── layout/             # Navbar, Footer, CitizenNav, OfficerNav, AdminNav
│   │   ├── complaints/         # StatusTimeline, FraudRiskMeter, DuplicateMatchCard, ActionConsole
│   │   └── maps/               # LeafletLocationPicker & LeafletComplaintMap (SSR safe)
│   ├── lib/
│   │   ├── ai/                 # Classification, Duplicate Detection, Fraud Risk, Routing
│   │   ├── auth/               # Password hashing, JWT sessions, role guards
│   │   ├── db/                 # Prisma client singleton
│   │   ├── audit/              # Immutable audit event logger
│   │   └── utils/              # Haversine distance, text similarity, formatters
│   └── types/                  # Shared TypeScript interfaces & enums
├── tests/                      # Automated Vitest test suite
├── PROJECT_REPORT.md           # University Academic Submission Documentation
└── README.md
```

---

## 📜 Academic Project Notice
This project was developed for a university capstone engineering project under the topic **Smart Grievance Redressal & Fake Complaint Detection System**.
All simulated citizen profiles, photos, and grievances are designed for educational demonstration and research into algorithmic civic transparency.
