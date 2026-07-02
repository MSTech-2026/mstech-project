# GIAL Daily Service Reporting (DSR) System — Project Foundation

**Status:** Draft for review  
**Derived from:** PRD.docx v1.0, Technical Design Document (TDD).docx  
**Audience:** Engineers, designers, and stakeholders preparing to build

---

## 1. Problem Statement

Security screening equipment at Guwahati International Airport requires daily pre-operational verification mandated by BCAS and enforced by CISF, but the current paper-based logging of 29 ETD machines across passenger and cargo terminals produces transcription errors, creates 5% log gaps from lost sheets, delays fault detection by 12–24 hours, and requires 2–3 days to compile audit responses — all of which the DSR system eliminates by digitizing capture, enforcing completeness, and providing real-time visibility.

---

## 2. Core Requirements Extracted from the PRD

### 2.1 What the System Must Do

| # | Requirement | Source | Must / Should |
|---|------------|--------|---------------|
| R1 | Authenticate field technicians via Supabase Auth on a React Native mobile app | PRD §User Personas | Must |
| R2 | Let technicians search and select ETD machines by location, serial number, or machine ID | PRD §Field Technician Workflow | Must |
| R3 | Accept numeric sample counts and EVK status (verified/failed/bypass) per machine per day with auto-populated server date/time | PRD §Field Technician Workflow, §daily_reports schema | Must |
| R4 | Operate offline in areas with weak cellular coverage (baggage halls, cargo warehouses) — cache entries locally and sync when reconnected | PRD §Offline Caching, §Operational Risks | Must |
| R5 | Provide admins a real-time dashboard on the React.js web portal showing percentage of validated machines, average sample counts, and active faults | PRD §Admin Workflow | Must |
| R6 | Export filtered compliance data to pre-formatted Excel (.xlsx) spreadsheets matching BCAS templates | PRD §Admin Workflow, §Compliance Export | Must |
| R7 | Enforce multi-tenant data isolation via `site_id` on every transaction table, starting with GIAL and scaling to Mumbai, Navi Mumbai, Ahmedabad | PRD §Multi-Site, §RLS Policies | Must |
| R8 | Enforce role-based access: Technician (write own site logs), Admin (read/manage site data), SysAdmin (cross-site provisioning) | PRD §User Personas, §RLS Policies | Must |
| R9 | Keep transaction logs immutable (read-only after entry) for audit integrity | PRD §Regulatory Compliance | Must |
| R10 | Host all data in AWS Asia Pacific (Mumbai) for India DPDP Act compliance | PRD §Data Residency | Must |
| R11 | Support a 2-hour technician edit window after submission (TDD), with admin override for corrections beyond that window | TDD §RLS Policies, §Correction Workflow | Must |
| R12 | Track wipe test schedules and license verification for radioactive-source machines (IONSCAN 500DT Ni-63) | PRD §Wipe Test Log | Should |

### 2.2 Who Uses It

| Persona | Device | Core Actions | Auth Method |
|----------|--------|-------------|-------------|
| Field Technician | Handheld mobile (iOS/Android via Expo) | Login → Search machine → Enter metrics → Submit (online/offline) | Email/password via Supabase Auth |
| Admin (Lead Security Officer, Duty Manager, CSO) | Desktop browser (React.js portal) | View dashboard → Filter reports → Export Excel → Manage machines | Email/password via Supabase Auth |
| SysAdmin (AAHL Central IT) | Desktop browser (React.js portal) | Create sites → Provision machines → Manage user profiles → Assign site-role mappings | Email/password via Supabase Auth |

### 2.3 Constraints from the PRD

- **Single-site launch, multi-site schema:** GIAL only at launch but schema must not require migration to add airports (C: site_id on all tables from day one)
- **AI-assisted vibe coding:** The PRD explicitly states prototyping uses AI code generation — this means package lock must be strict, every feature must be committed immediately, and automated test suites must validate core modules (C: PRD §Project Dependencies)
- **8-week phased timeline:** Phase 1 (Weeks 1–2) prototype, Phase 2 (Weeks 3–5) hardening, Phase 3 (Weeks 6–8) deployment/shadow ops (C: PRD §Program Timeline)
- **No live machine integrations in Phase 1:** All data is manually keyed; direct API integration with Smiths/Rapiscan SDKs is a Phase 2+ future item (C: PRD §System Integrations)
- **Excel export must match BCAS format:** Pre-formatted templates required, not generic CSV (C: PRD §Audit Layout Mismatches)

---

## 3. Assumptions and Gaps

### 3.1 Assumptions the PRD Makes Without Justification

| Assumption | Risk if Wrong | Needs Decision By |
|------------|--------------|-------------------|
| "29 ETD machines" is static — no machine addition/removal workflow defined beyond SysAdmin manual provisioning | Machine count changes during build; unclear if Phase 1 needs a machine CRUD UI in the admin portal | Sprint 0 |
| Technicians each have a dedicated handheld device with Expo Go installed | MDM/device provisioning is out of scope but blocks real deployment | Phase 2 |
| Email is sufficient for notifications on status changes | PRD mentions "immediate email notifications" but no email provider, template design, or triggering logic is specified | Phase 2 |
| Excel export is client-side only | PRD says "client-side standard library" — may fail for large date ranges or audit requests spanning years; TDD suggests server-side option | Phase 2 |
| Wi-Fi/cellular is available at shift start for auth, even if spotty during logging | If a technician cannot authenticate at all due to no connectivity, the offline queue can't establish user identity for RLS | Phase 1 design |
| BCAS reporting format is stable | If BCAS changes the template mid-build, the export engine needs rework (PRD acknowledges this risk) | Ongoing |

### 3.2 Gaps That Block Execution

| Gap | Why It Matters | Suggested Resolution |
|-----|---------------|---------------------|
| **No error code taxonomy defined** | The TDD mentions "error codes for retries" but doesn't specify error categories (auth expired, network timeout, RLS rejection, constraint violation). Mobile UI error messages will be inconsistent without this. | Define error codes in Sprint 0: `AUTH_EXPIRED`, `NETWORK_OFFLINE`, `RLS_FORBIDDEN`, `DUPLICATE_REPORT`, `INVALID_EVK`, `SYNC_CONFLICT` |
| **Correction workflow beyond 2 hours is unresolved** | TDD says "pending final decision" — options are admin direct update or separate corrections table. This affects RLS policy design and audit trail. | Decide in Sprint 0: separate `corrections` table with `original_report_id` FK and `reason` field, admin-only INSERT |
| **No notification architecture** | PRD says "immediate email notifications routed on status changes" but no trigger logic, email template, or provider (AWS SES? Supabase Edge Function?) is defined | Design in Phase 2: DB trigger on `evk_status = 'failed'` → Supabase Edge Function → AWS SES |
| **Wipe test/license tracking schema undefined** | PRD mentions tracking for Ni-63 sources but no table structure, fields, or workflow | Add `machine_compliance` table: `machine_id`, `last_wipe_test_date`, `wipe_test_due_date`, `license_expiry`, `leak_check_status` |
| **No session timeout / token refresh specification** | TDD says "Supabase SDK auto-refreshes tokens" but doesn't define session duration. In offline scenarios, a stale token blocks sync. | Define 1-hour access token, 7-day refresh token; mobile app checks token validity before sync flush |
| **No backup/DR strategy** | 99.9% uptime target requires a recovery plan. Supabase managed backups exist but RTO/RPO aren't stated. | Supabase daily backups (default); define RPO ≤ 1 hour, RTO ≤ 4 hours |

---

## 4. Core Features — Prioritized by User Need

Priority is driven by: (1) what a technician needs to replace paper logging, (2) what an admin needs for oversight, (3) what compliance requires.

### P0 — Must Ship in Phase 1 (Weeks 1–2 Prototype)

| Feature | User Story | Justification |
|---------|-----------|--------------|
| **Auth + Session** | Technician logs in with email/password, session persists on mobile | Without auth, no RLS, no site isolation. Entry point for all workflows. |
| **Machine Search & Select** | Technician searches by serial/location/ID from a list of 29 machines, cached locally | Replaces manual lookup of complex codes (PRD pain point). Cached for offline availability. |
| **Report Entry Form** | Numeric keyboard for sample count, EVK status picker, auto-populated date | Core replacement for paper logbook. Auto-date prevents backdating (PRD compliance requirement). |
| **Local Offline Save** | Report saved to SQLite with pending flag when offline | Required for basement/cargo areas (PRD: signal attenuation risk). Must work without any connectivity. |
| **Online Submit + Sync** | Pending reports flushed to Supabase in original order when connectivity restored | Closes the loop. Without sync, data stays trapped on device. |
| **Admin Dashboard** | Real-time grid showing today's reports: machine, technician, sample count, EVK status | Replaces manual paper collection — the primary admin pain point (PRD: 4–6 hour compilation time). |

### P1 — Must Ship in Phase 2 (Weeks 3–5)

| Feature | User Story | Justification |
|---------|-----------|--------------|
| **Excel Export** | Admin filters reports by date/machine and downloads .xlsx matching BCAS template | Directly solves 2–3 day audit compilation pain. Client-side SheetJS for MVP; server-side for scale. |
| **RLS Enforcement Verification** | Automated tests confirm technician-A at site-X cannot see site-Y data | Security non-negotiable. Must be proven before shadow ops. |
| **Offline Stress Testing** | Simulated dropouts during logging, verify queue integrity and sync order | PRD risk: "if offline storage is not properly handled, synchronizations could fail and compromise log sequences." |
| **2-Hour Edit Window** | Technician can edit own report within 2 hours of submission; locked after | TDD requirement. Balances error correction with audit integrity. |
| **Machine Management (Admin)** | Admin adds/edits/deactivates machines for their site | Needed before go-live; machines change. |

### P2 — Must Ship in Phase 3 (Weeks 6–8) or Post-Launch

| Feature | User Story | Justification |
|---------|-----------|--------------|
| **Correction Workflow** | Admin creates a correction record linked to original report with reason | Resolves TDD open question. Needed for real ops. |
| **Email Notifications** | Automatic email to admin on EVK=failed status | PRD success metric: immediate notification vs. 12–24 hour delay. |
| **Wipe Test Tracking** | Compliance dashboard shows upcoming wipe test due dates for Ni-63 machines | Regulatory requirement (PRD). |
| **SysAdmin Multi-Site View** | SysAdmin can switch between airport sites, provision new sites | Required before onboarding second airport. |
| **Shadow Logging Period** | Parallel paper + digital logging with reconciliation report | PRD Phase 3 requirement before sign-off. |

---

## 5. Architecture Sketch

### 5.1 Technology Choices — With Justification

| Layer | Choice | Why (Not Just Preference) |
|-------|--------|--------------------------|
| **Mobile Client** | React Native 0.74 + Expo ~51 | PRD and TDD mandate this. Expo Go enables on-device testing without builds, critical for the "vibe coding" rapid iteration pattern. Single codebase for iOS/Android matches technician device heterogeneity. |
| **State Management** | Zustand ^4.5 (PRD specifies) + expo-sqlite ~14.0 for local persistence | PRD explicitly locks these versions. Zustand is lighter than Redux for this scope (essentially a machine list cache + auth state + sync queue). expo-sqlite provides synchronous local DB without native bridge overhead. |
| **Web Admin** | React.js (no framework specified — assume Vite + React 18) | TDD specifies React.js. No Next.js needed — this is a client-side SPA behind Supabase Auth. Vite minimizes build complexity. |
| **Backend** | Supabase (PostgreSQL 15, GoTrue Auth, PostgREST API, Realtime) | PRD and TDD mandate this. Eliminates custom API server; RLS replaces application-level authorization; PostgREST auto-generates endpoints from schema. Data residency enforced at project creation (Mumbai region). |
| **Database** | PostgreSQL via Supabase — shared schema, RLS-isolated per site | Single DB avoids per-site provisioning overhead. RLS at the database level means even a compromised API token can't bypass access controls. |
| **Excel Export** | Client-side: SheetJS (xlsx library). Server-side fallback: Supabase Edge Function (Deno) | Client-side works for GIAL's 29-machine × 365-day = ~10K rows/year. Server-side needed if exporting multi-year or multi-site data. |
| **Offline Queue** | expo-sqlite table (`pending_sync`) with sequential processing | TDD specifies this approach. No need for WatermelonDB — the sync queue is simple enough for raw SQLite. |
| **Hosting** | Mobile: EAS Build/Submit. Web: Static export to S3 + CloudFront or Netlify. Backend: Supabase managed. | Matches TDD guidance. All within AWS Mumbai region. |

### 5.2 System Topology

```
┌─────────────────────────┐       ┌─────────────────────────┐
│   REACT NATIVE MOBILE    │       │    REACT.JS WEB PORTAL   │
│   (Expo Go / EAS Build)  │       │    (Vite SPA)            │
│                          │       │                          │
│  ┌───────────────────┐   │       │  ┌───────────────────┐   │
│  │  Zustand Store    │   │       │  │  React State      │   │
│  │  - auth token     │   │       │  │  - auth token     │   │
│  │  - machine cache  │   │       │  │  - site context   │   │
│  │  - sync queue     │   │       │  │  - report cache   │   │
│  └───────┬───────────┘   │       │  └───────┬───────────┘   │
│  ┌───────┴───────────┐   │       │          │               │
│  │  expo-sqlite      │   │       │          │               │
│  │  - pending_sync   │   │       │          │               │
│  │  - machine_cache  │   │       │          │               │
│  └───────────────────┘   │       │          │               │
└──────────┬──────────────┘       └──────────┬──────────────┘
           │                                 │
           │  TLS 1.3 + Supabase Anon Key    │
           │  (RLS-enforced queries)         │
           ▼                                 ▼
┌─────────────────────────────────────────────────────────┐
│               SUPABASE (AWS Mumbai)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ GoTrue   │  │PostgREST │  │ PostgreSQL 15          │  │
│  │ Auth     │  │ API      │  │                        │  │
│  │          │  │          │  │  RLS Policies:         │  │
│  │ JWT with │  │ Auto-    │  │  - site_id isolation   │  │
│  │ site_id  │  │ generated│  │  - role-based CRUD     │  │
│  │ + role   │  │ REST     │  │  - 2-hr edit window    │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Edge Functions (Deno) — optional                 │    │
│  │  - Excel export (server-side fallback)            │    │
│  │  - Email notification trigger                     │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Request Flow Example: Technician Submits a Report

```
1. Technician opens app → Zustand checks local auth token
2. If no token or expired → supabase.auth.signIn({ email, password })
3. GoTrue returns JWT with app_metadata: { site_id, role }
4. App caches token, fetches machines: supabase.from('machines').select().eq('site_id', siteId)
5. Machine list cached in Zustand AND expo-sqlite for offline
6. Technician searches, selects machine, enters sample_count + evk_status
7. On submit:
   a. App constructs report object: { site_id, machine_id, technician_id, report_date (CURRENT_DATE), sample_count, evk_status }
   b. NetInfo.fetch() → check connectivity
   c. IF ONLINE: supabase.from('daily_reports').insert(report) → RLS validates site_id + role → success/error
   d. IF OFFLINE: INSERT INTO pending_sync (report_data JSON, created_at) → UI shows sync badge
8. On reconnect (NetInfo listener): syncManager.flush() processes pending_sync in FIFO order
9. Each flush: supabase.from('daily_reports').insert() → on success, DELETE FROM pending_sync
```

---

## 6. Data Model

### 6.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    sites     │       │  profiles    │       │   machines   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ PK id        │◄──────│ FK site_id   │       │ PK id        │
│    name      │       │ PK id (auth) │       │ FK site_id   │◄─┐
│    code      │       │    role      │       │    serial_no │  │
│    created_at│       │    updated_at│       │    model     │  │
└──────────────┘       └──────────────┘       │    location  │  │
                            │                  │    is_active │  │
                            │                  │    created_at│  │
                            │                  └──────────────┘  │
                            │                                     │
                            ▼                                     │
                     ┌──────────────┐                             │
                     │daily_reports │                             │
                     ├──────────────┤                             │
                     │ PK id        │                             │
                     │ FK site_id   │─────────────────────────────┘
                     │ FK machine_id│
                     │ FK tech_id   │──► profiles.id
                     │    report_date│
                     │    sample_cnt │
                     │    evk_status │
                     │    fail_reason│ (nullable)
                     │    created_at │
                     │    updated_at │
                     │  UNIQUE(site_id, machine_id, report_date)
                     └──────────────┘

                     ┌──────────────┐
                     │  corrections │ (Phase 2 — proposed)
                     ├──────────────┤
                     │ PK id        │
                     │ FK report_id │──► daily_reports.id
                     │ FK admin_id  │──► profiles.id
                     │    reason    │
                     │    old_sample│
                     │    old_evk   │
                     │    created_at│
                     └──────────────┘

                     ┌──────────────────┐
                     │ machine_compliance│ (Phase 2 — proposed)
                     ├──────────────────┤
                     │ PK id            │
                     │ FK machine_id    │──► machines.id
                     │    wipe_test_date│
                     │    wipe_test_due │
                     │    license_expiry│
                     │    leak_check    │
                     │    updated_at    │
                     └──────────────────┘
```

### 6.2 Key Design Decisions

**Why sample_count is INTEGER, not JSONB:** The PRD schema explicitly defines `sample_count INTEGER` and `evk_status TEXT` as separate columns. The TDD uses `data_json JSONB` as a generic catch-all. I'm aligning with the PRD because (a) structured columns enable DB-level CHECK constraints (`sample_count >= 0`, `evk_status IN ('verified','failed','bypass')`), (b) indexed columns are queryable for dashboard aggregation (average sample counts per machine), and (c) compliance exports need predictable column mappings. JSONB is a schema escape hatch, not a primary data modeling strategy.

**Why a UNIQUE constraint on (site_id, machine_id, report_date):** The PRD defines `uq_machine_report_date_per_site`. This prevents duplicate daily entries per machine — critical because offline sync retries could otherwise create duplicates if a report succeeded on the server but the ack was lost.

**Why corrections is a separate table, not an UPDATE to daily_reports:** The PRD states transaction logs are "immutable" and "read-only to safeguard raw historical compliance metrics." An audit trail that overwrites values loses the original. A corrections table preserves the original entry while adding an auditable amendment chain.

**Why machine_compliance is a separate table:** Wipe tests and license tracking are regulatory metadata, not daily operational data. Separating them avoids polluting the machines table with compliance-specific columns and allows independent access policies.

### 6.3 Data Flow Summary

```
[Technician Entry] → Local SQLite (pending_sync) → Supabase daily_reports
                                                          │
                                                          ▼
[Admin Dashboard] ← Supabase daily_reports (RLS-filtered) ← real-time queries
                                                          │
                                                          ▼
[Excel Export] ← Filtered query → SheetJS xlsx → Browser download
                                                          │
                                                          ▼
[Audit Request] ← daily_reports (immutable) + corrections (amendment chain)
```

---

## 7. Success Criteria

### 7.1 PRD-Defined Metrics

| Metric | Baseline (Paper) | Target (Digital) | How It's Measured |
|--------|-----------------|------------------|-------------------|
| DSR compilation time | 4–6 hours/week | ≤ 5 seconds from last submission to dashboard refresh | Timestamp diff: last report `created_at` to admin dashboard render |
| Log completeness | ~95% (5% lost sheets) | 100% (enforced by NOT NULL constraints + form validation) | `COUNT(daily_reports)` / (29 machines × days_in_period) |
| Fault notification speed | 12–24 hours | Immediate (≤ 60 seconds from submission) | `evk_status='failed'` → notification timestamp diff |
| Audit response time | 2–3 days | Instant download | Time from export button click to file download complete |

### 7.2 TDD-Defined Performance Targets

| Operation | Target | Max Threshold | Measurement Method |
|-----------|--------|---------------|-------------------|
| Local SQLite cache write | ≤ 10ms | 50ms | `performance.now()` around INSERT |
| RLS-filtered API query | ≤ 45ms | 150ms | Supabase query timing + network round-trip |
| Dashboard render | ≤ 200ms | 800ms | React Profiler / Lighthouse |
| Excel export (up to 10K rows) | ≤ 1.2s | 5.0s | Download completion timing |

### 7.3 Uptime & Reliability

| Goal | Target | Evidence |
|------|--------|----------|
| System availability | 99.9% (MTBF ≥ 2,190 hrs, MTTR ≤ 2.1 hrs) | Supabase status page + custom health-check monitor |
| Offline sync success rate | ≥ 99.5% of queued records sync without manual intervention | Sync log analytics (total flushed vs. failed) |
| Auth success rate | ≥ 99.9% | Supabase Auth metrics |

---

## 8. Known Unknowns

These must be resolved before the relevant build phase begins.

| # | Unknown | Impact if Unresolved | Proposed Resolution Path | Deadline |
|---|---------|---------------------|------------------------|----------|
| U1 | **BCAS Excel template format** | Export generates wrong columns; audit rejection | Get sample BCAS report template from GIAL CSO; build export schema from it | Sprint 0 (Week 1) |
| U2 | **Machine serial number format / existing inventory data** | Can't seed machines table; search doesn't match technician mental model | Request machine inventory spreadsheet from GIAL; validate against 29-machine count | Sprint 0 (Week 1) |
| U3 | **Email notification provider and templates** | No notification delivery mechanism | Evaluate Supabase Edge Function → AWS SES vs. Resend; design templates with GIAL admin | Phase 2 (Week 3) |
| U4 | **Device provisioning (MDM, app distribution)** | Technicians can't install the app | Clarify whether EAS internal distribution or public App Store/Play Store; test Expo Go on target device | Phase 2 (Week 3) |
| U5 | **Shadow logging reconciliation methodology** | Can't prove digital matches paper | Define reconciliation criteria: 100% match on machine+date+sample_count+evk across 14-day shadow period | Phase 3 (Week 6) |
| U6 | **SSO/MFA integration details (Phase 2+)** | Architecture assumptions may need rework | Supabase supports SAML SSO; evaluate against GIAL's existing AD infrastructure post-MVP | Post-Phase 3 |
| U7 | **Scale of second airport onboarding** | Mumbai's machine count may be 10x GIAL's; export and dashboard performance needs validation | Profile with 300 simulated machines before Mumbai onboarding | Multi-site expansion |

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
        ┌─────────┐
        │   E2E   │  Detox (mobile) + Playwright (web) — critical user journeys
        │   ~10   │  Login → search → log → sync flow. Admin → export flow.
        ├─────────┤
        │Integration│  Supabase local (supabase-js mock) + RLS policy tests
        │   ~30    │  - technician cannot read other site
        │          │  - admin can read all site reports
        │          │  - 2hr window enforcement
        │          │  - duplicate report rejection
        ├─────────┤
        │   Unit   │  Jest + React Native Testing Library
        │   ~100   │  - Form validation (sample_count >= 0, valid evk_status)
        │          │  - Sync queue ordering
        │          │  - Zustand store actions
        │          │  - Excel export column mapping
        └─────────┘
```

### 9.2 Test Scenarios by Priority

**P0 — Blocking for Merge (run on every commit)**

1. Technician submits report with valid sample_count + evk_status → record appears in daily_reports
2. Technician submits report for same machine + same date → 409/duplicate constraint error
3. Offline submit → record enters pending_sync → reconnect → record appears in daily_reports
4. Technician from site-A queries machines → only site-A machines returned
5. Admin from site-A queries all reports → only site-A reports returned
6. Invalid evk_status ('bogus') → rejected at DB constraint level
7. Negative sample_count → rejected at DB constraint level
8. Auth token expiry → mobile redirects to login

**P1 — Release Gate**

9. Technician edits own report within 2-hour window → update succeeds
10. Technician edits own report after 2-hour window → update rejected (RLS)
11. Admin edits any site report → update succeeds
12. Export 30 days of reports → valid .xlsx with correct columns
13. Rapid offline-online toggling → queue processes in order, no duplicates

**P2 — Production Readiness**

14. 100 concurrent report submissions → all succeed within latency targets
15. Simulated network partition during sync → no data loss, all records eventually consistent
16. Shadow logging reconciliation: 14-day parallel run → 100% match

---

## 10. Error Handling Approach

### 10.1 Error Taxonomy

| Error Code | Category | When It Occurs | User-Facing Message | Recovery |
|------------|----------|---------------|-------------------|----------|
| `AUTH_EXPIRED` | Authentication | JWT access token expired, refresh failed | "Your session has expired. Please log in again." | Redirect to login screen; clear local auth state |
| `NETWORK_OFFLINE` | Connectivity | NetInfo reports no connection during submit | "Saved locally. Will sync when connection is restored." | Report enters pending_sync queue; sync badge shown |
| `RLS_FORBIDDEN` | Authorization | User attempts action outside their site/role | "You don't have permission to perform this action." | Log attempt; no retry (this isn't transient) |
| `DUPLICATE_REPORT` | Constraint | Same machine + same date submitted twice | "A report for this machine on [date] already exists." | No retry; show existing report |
| `INVALID_EVK` | Validation | evk_status value not in enum | "Please select a valid verification status." | Client-side validation prevents this; DB catches as failsafe |
| `SYNC_CONFLICT` | Data | Server version newer than local (admin edit during offline) | "This report was modified while you were offline. Please review." | Fetch server version; show diff; offer overwrite or discard |
| `UNKNOWN_ERROR` | General | Unexpected exception | "Something went wrong. Please try again or contact support." | Log full error to analytics; retry once |

### 10.2 Offline Sync Error Protocol

```
syncManager.flush():
  FOR EACH row IN pending_sync ORDER BY created_at ASC:
    TRY:
      result = await supabase.from('daily_reports').insert(row.report_data)
      IF result.error:
        IF result.error.code == '23505':  // unique_violation
          // Report already synced but ack lost — delete local copy
          DELETE FROM pending_sync WHERE id = row.id
        ELSE IF result.error.code IN ('42501', '42P01'):  // permission denied / RLS
          // Not transient — flag for manual review
          UPDATE pending_sync SET status = 'failed', error = result.error.message
        ELSE:
          // Transient (network, timeout) — leave pending, retry next cycle
          BREAK  // Don't process further until this succeeds
      ELSE:
        DELETE FROM pending_sync WHERE id = row.id
    CATCH (network error):
      BREAK  // Leave all remaining pending for next cycle
```

Key design choices:
- **FIFO ordering** ensures chronological consistency — reports appear in the order they were logged
- **Stop on transient failure** prevents out-of-order sync when a report depends on context established by the failed one
- **Dedup on unique violation** handles the ack-loss scenario without manual intervention

---

## 11. Documentation Requirements

### 11.1 Developer Documentation (Must Exist Before Phase 1 Ends)

| Document | Contents | Audience |
|----------|---------|----------|
| `README.md` | Project overview, local setup (Expo Go, Supabase CLI, env vars), `pnpm dev` commands, folder structure | New developers |
| `docs/schema.md` | Full SQL schema with comments explaining each column, constraint, and index rationale | Backend developers |
| `docs/rls-policies.md` | Every RLS policy with the SQL, what it enforces, and test cases proving it works | Security reviewer, developers |
| `docs/offline-sync.md` | Architecture of pending_sync queue, NetInfo integration, conflict resolution, edge cases | Mobile developers |
| `docs/error-codes.md` | The error taxonomy from §10.1, where each code is thrown, and the UI component that handles it | Full team |
| `docs/excel-export.md` | BCAS template mapping, column definitions, SheetJS setup, server-side fallback | Frontend developers |
| `docs/ai-coding-guide.md` | Package lock rules, commit-after-feature rule, the verification profile commands, what NOT to let AI change | All developers (PRD requirement for vibe coding) |

### 11.2 Operations Documentation (Must Exist Before Phase 3)

| Document | Contents | Audience |
|----------|---------|----------|
| `docs/deployment.md` | EAS Build/Submit for mobile, web deploy to S3/Netlify, Supabase migration commands | DevOps |
| `docs/backup-recovery.md` | Supabase backup schedule, RPO/RTO, restore procedure, dry-run log | SysAdmin |
| `docs/monitoring.md` | Health check endpoints, Supabase metrics dashboards, alert thresholds | SysAdmin |
| `docs/user-management.md` | How to add technicians, admins; role assignment; site mapping | SysAdmin |

### 11.3 User Documentation (Must Exist Before Phase 3 Shadow Ops)

| Document | Contents | Audience |
|----------|---------|----------|
| `docs/technician-guide.md` | Screenshot walkthrough: login → search → log → submit offline → sync | Field Technicians |
| `docs/admin-guide.md` | Dashboard interpretation, filtering, export, machine management, correction workflow | Admins (CSO, Duty Manager) |
| `docs/sysadmin-guide.md` | Site provisioning, user management, backup procedures, RLS policy verification | SysAdmin (AAHL IT) |

---

## 12. Cross-Check: PRD vs. TDD Conflicts and Dependencies

### 12.1 Conflicts

| Topic | PRD Says | TDD Says | Resolution |
|-------|---------|---------|------------|
| Report data shape | Structured columns: `sample_count INTEGER`, `evk_status TEXT`, `verification_failure_reason TEXT` | Generic: `data_json JSONB` | **Use PRD schema.** Structured columns are queryable, constrainable, and map directly to BCAS export templates. JSONB is an escape hatch, not a primary model. |
| Local storage | `expo-sqlite ~14.0.0` | `expo-sqlite` or `WatermelonDB` | **Use expo-sqlite.** PRD version-locks it. WatermelonDB adds complexity without benefit for a single-table sync queue. |
| State management | `zustand ^4.5.2` | Zustand or Redux | **Use Zustand.** PRD version-locks it. Sufficient for auth + machine cache + sync status. |
| Excel export | Client-side library | Client-side OR server-side Edge Function | **Client-side (SheetJS) for MVP, server-side fallback documented.** 29 machines × 365 days ≈ 10K rows — well within browser limits. |

### 12.2 PRD Features Not Addressed by TDD

| PRD Feature | TDD Status | Action |
|-------------|-----------|--------|
| Wipe test / Ni-63 license tracking | Not mentioned | Added as `machine_compliance` table in data model (§6) |
| Email notifications on EVK=failed | Not detailed | Added to P2 features; needs provider decision (U3) |
| Multi-site global map (Phase 2+) | Not mentioned | Deferred to post-Phase 3; no action needed now |
| QR/barcode scanning (Phase 2+) | Not mentioned | Deferred; no action needed now |
| AI vibe coding quality risks | Not explicitly addressed | Added `docs/ai-coding-guide.md` requirement |

### 12.3 TDD Features Not Addressed by PRD

| TDD Feature | PRD Status | Action |
|------------|-----------|--------|
| 2-hour technician edit window | Not mentioned | Added as P1 feature; RLS policy needs this from day one |
| Admin override of 2-hour window | "Pending final decision" | Proposed corrections table pattern (§6.2) |
| Version fields for retries | Not specified | Added to sync error protocol (§10.2) |

---

## 13. Local Setup Steps (Day 1)

```bash
# 1. Initialize Expo mobile app
npx create-expo-app@latest gial-dsr-mobile --template blank-typescript
cd gial-dsr-mobile
npx expo install @supabase/supabase-js@^2.43.0 expo-sqlite@~14.0.0 zustand@^4.5.2 \
  @react-native-community/netinfo expo-secure-store

# 2. Initialize React web admin
npm create vite@latest gial-dsr-admin -- --template react-ts
cd gial-dsr-admin
npm install @supabase/supabase-js@^2.43.0 xlsx react-router-dom

# 3. Initialize Supabase local development
supabase init
supabase start  # Requires Docker — creates local Postgres + GoTrue + PostgREST

# 4. Apply schema
supabase db push  # or supabase migration new init && supabase db push

# 5. Seed GIAL site + 29 machines (from inventory spreadsheet — see U2)
#    Seed test users: 1 technician, 1 admin, 1 sysadmin

# 6. Verify
#    Mobile: npx expo start → scan QR with Expo Go
#    Web: cd gial-dsr-admin && npm run dev
#    Backend: supabase status
```

---

## 14. Summary of What's Ready and What's Not

**Ready to build (Sprint 0 — Week 0):**
- Core schema (sites, profiles, machines, daily_reports) — complete with constraints and indices
- RLS policies for site isolation and role-based access — defined in SQL
- Mobile app structure — auth → machine list → entry form → submit (online/offline)
- Admin dashboard — real-time report grid with filtering

**Needs decision before Sprint 1 (Week 1):**
- BCAS Excel template format (U1)
- Machine inventory data from GIAL (U2)
- Correction workflow design (accept proposed corrections table or define alternative)

**Needs decision before Phase 2 (Week 3):**
- Email provider and templates (U3)
- Device provisioning strategy (U4)
- Wi-Fi-less auth flow (technician can't even log in without connectivity — potential gap)

**Deferred to post-MVP:**
- SSO/MFA integration
- QR/barcode scanning
- Direct Smiths/Rapiscan SDK integration
- Multi-airport global map
