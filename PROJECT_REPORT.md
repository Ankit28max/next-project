# ACADEMIC PROJECT REPORT

## Smart Grievance Redressal & Fake Complaint Detection System (JanSetu)

---

### Project & Submission Metadata

| Field | Details |
| :--- | :--- |
| **Project Title** | Smart Grievance Redressal & Fake Complaint Detection System |
| **Application Name** | JanSetu Civic Portal |
| **Academic Program** | Bachelor of Technology / Master of Computer Applications (Capstone Project) |
| **Academic Session** | 2025 – 2026 |
| **Team Members** | [Student Name 1 - Roll No: XXXXXX]<br/>[Student Name 2 - Roll No: XXXXXX]<br/>[Student Name 3 - Roll No: XXXXXX] |
| **Project Guide / Supervisor** | [Faculty Name / Department] |
| **Repository Link** | `https://github.com/ankit/smart-grievance-redressal-system` |
| **Live Demonstration URL** | `https://jansetu-grievance-portal.demo.local` |

---

### 1. Executive Summary

Municipal grievance portals serve as the critical conduit between citizens and urban local bodies. However, traditional e-governance platforms suffer from high operational latency caused by manual department routing, redundant dispatches for duplicate complaints, and spam submissions.

This project delivers **JanSetu**, a production-minded web application engineered with **Next.js 14 App Router**, **Prisma ORM**, **PostgreSQL**, and a modular **Multimodal AI Service Layer**. The platform automatically classifies civic grievances, clusters geographic duplicates using the Haversine formula and TF-IDF token cosine similarity, scores suspicious submissions across 5 distinct risk vectors, and assigns tickets to department officers using an automated workload-balancing algorithm.

---

### 2. Problem Statement & Objectives

#### 2.1 Problem Statement
1. **Routing Inefficiencies**: Citizens filing complaints often lack administrative knowledge of municipal jurisdiction (e.g., misclassifying stormwater flooding between Public Works and Sewerage Board), resulting in prolonged multi-department bouncing.
2. **Duplicate Inundation**: A single public infrastructure failure (such as a burst water trunk line or a cave-in on an arterial road) triggers dozens of separate complaints from independent citizens. Without geographic and semantic clustering, field teams duplicate inspection efforts.
3. **Malicious & Fabricated Claims**: Unverified digital portals are susceptible to stock photos, outdated photographs, and keyboard-smash spam submissions that compromise data integrity and consume municipal resources.

#### 2.2 System Objectives
- Provide a multi-step, mobile-responsive portal for citizens to submit grievances with geo-coordinates and photo evidence.
- Build an explainable AI pipeline that classifies complaint taxonomy with $\ge 90\%$ accuracy and routes it to the correct department.
- Implement a multi-signal duplicate detection algorithm combining Haversine spatial radius ($\le 2\text{km}$), text overlap, category matching, and photo hash matching.
- Introduce an advisory fraud risk assessment engine (0–100 score) that guides human officer verification without automated citizen penalization.
- Support strict Role-Based Access Control (RBAC) across Citizens, Department Officers, and Administrators.

---

### 3. System Architecture & Relational Database Design

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  [Citizen Portal]             [Officer Workspace]            [Admin Analytics Hub]  |
|  - Submission Wizard (Map+GPS)- Triage Queue                 - Live Database Stats  |
|  - Live Status Timeline       - AI Insights & Duplicates     - Department Routing   |
|  - In-App Notifications       - Status Action Console        - Immutable Audit Logs |
+-----------------------------------------------------------------------------------+
                                         │
                         HTTPS / JSON / JWT Session Cookies
                                         ▼
+-----------------------------------------------------------------------------------+
|                            NEXT.JS APP ROUTER TIER                                |
|  [Route Handlers & Server Actions]            [Role Security Guards]             |
|  - /api/complaints                            - requireAuth(['CITIZEN', etc.])   |
|  - /api/upload (MIME & Hash Generation)       - Scoped Database Query Filters    |
|  - /api/stats (Real Database Aggregations)    - Session Validation & Cookies     |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴────────────────────────┐
                 ▼                                                ▼
+------------------------------------+        +------------------------------------+
|         AI PIPELINE TIER           |        |        PERSISTENCE LAYER           |
|  - Deterministic Academic Engine   |        |  PostgreSQL 16 Relational Database |
|  - Google Gemini Multimodal Vision |        |  Prisma ORM Schema (12 Models)     |
|  - Haversine Spatial Distance      |        |  - User, Department, Officer       |
|  - TF-IDF Token Similarity         |        |  - Complaint, ComplaintImage       |
|  - 5-Signal Fraud Risk Scoring     |        |  - ComplaintMatch, StatusHistory   |
+------------------------------------+        +------------------------------------+
```

#### 3.1 Relational Schema Highlights
- **`User`**: Core identity table storing hashed passwords (`bcrypt`), role (`CITIZEN`, `OFFICER`, `ADMIN`), and contact details.
- **`Department`**: Municipal bodies (`PWD`, `WATER`, `ELEC`, `HEALTH`) with codes and jurisdictions.
- **`OfficerProfile`**: Links a user to a department, employee badge ID, and active case assignments.
- **`Complaint`**: Central grievance record storing title, description, category, assigned officer, coordinates (`latitude`, `longitude`), and cached AI telemetry (`aiCategory`, `aiConfidence`, `duplicateScore`, `fraudRiskScore`).
- **`ComplaintMatch`**: Relational junction table capturing duplicate links with individual signal breakdowns (`textSimilarity`, `imageSimilarity`, `geographicDistance`, `combinedScore`).
- **`ComplaintStatusHistory`**: Immutable history tracking status transitions with actor ID, timestamp, previous status, new status, and remarks.
- **`AuditLog`**: Compliance audit trail recording administrative modifications and security logins.

---

### 4. Algorithmic Implementations

#### 4.1 Great-Circle Distance via Haversine Formula
To compute geographic distance between complaint coordinates on Earth:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c \quad (\text{where } R = 6371\text{ km})$$

Implemented in `src/lib/utils/index.ts` to filter existing complaints within a configurable radius ($2.0\text{ km}$).

#### 4.2 Text Token Overlap (TF-IDF Cosine Approximation)
Linguistic similarity is computed between token frequency vectors $\vec{v}_1$ and $\vec{v}_2$:

$$\text{Similarity}(\vec{v}_1, \vec{v}_2) = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \cdot \|\vec{v}_2\|}$$

Ignores common punctuation and stop words to produce a normalized score between $0.0$ and $1.0$.

#### 4.3 Suspicious Anomaly Heuristics
The fraud scoring module assesses five discrete indicators:
1. **Reused Image Hash**: Cross-referenced against existing `ComplaintImage.imageHash` entries. If found in complaints submitted by a different user, an alert is flagged ($+45$).
2. **Keyboard-Smash & Spam Patterns**: RegEx analysis evaluating character repetition and known sequences (`asdf`, `qwerty`, `12345`) ($+30$).
3. **Brevity Penalty**: Descriptions under 20 characters lack actionable municipal context ($+25$).
4. **Velocity Anomaly**: Checks recent database submissions by the citizen ID within a 10-minute sliding window ($+35$ if $\ge 4$).
5. **Category Mismatch**: Detects absence of domain keywords for the selected civic issue ($+15$).

---

### 5. Ethical & Privacy Safeguards

The project strictly adheres to civic and academic ethics standards:
- **No Biometric Identification**: The vision models process only physical infrastructure; no facial recognition, demographic profiling, or sensitive attribute inference is performed.
- **Human-in-the-Loop Decision Making**: Algorithmic scores are advisory indicators displayed to officers. No complaint is automatically discarded or rejected without human review.
- **Role Isolation**: Fraud risk telemetry and internal officer remarks are masked from public citizen endpoints to prevent adversarial reverse-engineering.

---

### 6. Demonstration & Evaluation Scenarios

The seeded database demonstrates key real-world situations:

1. **Scenario 1: Verified Routine Pothole Grievance (`GRV-2026-10021`)**
   - Filed by Citizen Amit Patel. Classified as Roads & Potholes (PWD) with 95% confidence. Inspected, patched with bituminous macadam, and resolved with full public timeline.
2. **Scenario 2: Water Pipeline Burst & Duplicate Cluster (`GRV-2026-10045` & `GRV-2026-10048`)**
   - Complaint 1 filed for Sector 4 Market pipe burst. Complaint 2 filed 30 minutes later by Citizen Priya Sharma 40 meters away.
   - The duplicate pipeline computes an 88% duplicate likelihood score (Distance: 0.04 km, Text Sim: 76%, Identical Category, Matching photo hash). Officers can consolidate field actions.
3. **Scenario 3: Suspicious Submission Flag (`GRV-2026-10099`)**
   - Submitted with text `road broken asdfghjk test` and stock photo.
   - Flagged with Fraud Risk Score of 78/100 (HIGH). Reason: Keyboard smash pattern, description under 20 characters, lack of location detail. Held for officer field verification.

---

### 7. Conclusion & Future Enhancements

The JanSetu platform demonstrates how modern full-stack web engineering and explainable AI can modernize civic governance. By providing transparent status tracking to citizens and automated duplicate/fraud triage to municipal officers, the system reduces administrative overhead and accelerates field resolution.

**Future Enhancements:**
- Integration with municipal GIS mapping servers (Shapefiles and Ward Boundary GeoJSON).
- Multilingual citizen submission support across 22 regional Indian languages using local speech-to-text models.
- Automated SMS and WhatsApp status notification dispatch via National SMS Gateway.
