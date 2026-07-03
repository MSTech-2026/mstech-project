# Graph Report - .  (2026-07-02)

## Corpus Check
- Corpus is ~21,364 words - fits in a single context window. You may not need a graph.

## Summary
- 230 nodes · 280 edges · 25 communities (14 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web Package Config|Web Package Config]]
- [[_COMMUNITY_Web React Dashboard|Web React Dashboard]]
- [[_COMMUNITY_Mobile App Core|Mobile App Core]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Mobile Package Config|Mobile Package Config]]
- [[_COMMUNITY_Mobile TS Config|Mobile TS Config]]
- [[_COMMUNITY_Mobile Offline DB|Mobile Offline DB]]
- [[_COMMUNITY_System Types & Data Flow|System Types & Data Flow]]
- [[_COMMUNITY_Mobile App Config|Mobile App Config]]
- [[_COMMUNITY_Mobile Dependencies|Mobile Dependencies]]
- [[_COMMUNITY_Root Package Config|Root Package Config]]
- [[_COMMUNITY_Web Node TS Config|Web Node TS Config]]
- [[_COMMUNITY_Corrections Interface|Corrections Interface]]
- [[_COMMUNITY_Root Project Info|Root Project Info]]
- [[_COMMUNITY_Mobile Package Info|Mobile Package Info]]
- [[_COMMUNITY_Mobile App Metadata|Mobile App Metadata]]
- [[_COMMUNITY_Site Types|Site Types]]
- [[_COMMUNITY_Web Package Info|Web Package Info]]
- [[_COMMUNITY_Report Constraints|Report Constraints]]
- [[_COMMUNITY_Tech Persona|Tech Persona]]
- [[_COMMUNITY_Admin Persona|Admin Persona]]
- [[_COMMUNITY_Sysadmin Persona|Sysadmin Persona]]
- [[_COMMUNITY_RTK Agents|RTK Agents]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 14 edges
3. `expo` - 10 edges
4. `useStore (Zustand)` - 10 edges
5. `scripts` - 9 edges
6. `useStore` - 9 edges
7. `scripts` - 8 edges
8. `getDb()` - 8 edges
9. `scripts` - 7 edges
10. `App (Mobile Root)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Why sample_count is INTEGER, not JSONB` --rationale_for--> `DailyReport Interface`  [INFERRED]
  PROJECT_FOUNDATION.md → packages/web/src/types/index.ts
- `Why machine_compliance is a separate table` --rationale_for--> `MachineCompliance`  [INFERRED]
  PROJECT_FOUNDATION.md → packages/mobile/src/types/index.ts
- `Why corrections is a separate table` --rationale_for--> `Correction Interface`  [INFERRED]
  PROJECT_FOUNDATION.md → packages/web/src/types/index.ts
- `Supabase Web Client` --semantically_similar_to--> `Supabase Mobile Client`  [INFERRED] [semantically similar]
  packages/web/src/lib/supabase.ts → packages/mobile/src/lib/supabase.ts
- `App()` --calls--> `useStore`  [EXTRACTED]
  packages/mobile/App.tsx → packages/mobile/src/store/index.ts

## Hyperedges (group relationships)
- **DSR System User Personas** — prd_field_technician, prd_admin, prd_sysadmin [EXTRACTED 1.00]

## Communities (25 total, 11 thin omitted)

### Community 0 - "Web Package Config"
Cohesion: 0.08
Nodes (25): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, xlsx, devDependencies, @types/node (+17 more)

### Community 1 - "Web React Dashboard"
Cohesion: 0.14
Nodes (17): Dashboard(), DashboardProps, styles, Login(), LoginProps, styles, exportToExcel(), supabase (+9 more)

### Community 2 - "Mobile App Core"
Cohesion: 0.18
Nodes (17): flushPendingQueue(), startSyncListener(), submitReport(), App(), Stack, supabase, colors, LoginScreen() (+9 more)

### Community 3 - "Web TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 4 - "Mobile Package Config"
Cohesion: 0.11
Nodes (18): devDependencies, jest, @jest/globals, @types/react, @types/react-native, typescript, main, name (+10 more)

### Community 5 - "Mobile TS Config"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+10 more)

### Community 6 - "Mobile Offline DB"
Cohesion: 0.16
Nodes (16): cacheMachines(), deletePendingReport(), getAllPendingReports(), getCachedMachines(), getDb(), getPendingReportCount(), insertPendingReport(), updatePendingReportStatus() (+8 more)

### Community 7 - "System Types & Data Flow"
Cohesion: 0.22
Nodes (16): exportToExcel, SQLite Local DB Functions, Supabase Mobile Client, Supabase Web Client, Sync Functions, App (Mobile Root), LoginScreen, MachineListScreen (+8 more)

### Community 8 - "Mobile App Config"
Cohesion: 0.14
Nodes (13): package, expo, android, ios, name, orientation, platforms, plugins (+5 more)

### Community 9 - "Mobile Dependencies"
Cohesion: 0.14
Nodes (14): dependencies, expo, expo-secure-store, expo-sqlite, react, react-native, @react-native-community/netinfo, react-native-safe-area-context (+6 more)

### Community 10 - "Root Package Config"
Cohesion: 0.14
Nodes (13): description, name, private, scripts, build:mobile, build:web, dev:mobile, dev:supabase (+5 more)

### Community 11 - "Web Node TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

## Knowledge Gaps
- **147 isolated node(s):** `name`, `version`, `private`, `description`, `dev:mobile` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Profile Interface` connect `Web React Dashboard` to `Mobile App Core`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Mobile Dependencies` to `Mobile Package Config`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Machine Interface` connect `Mobile App Core` to `Web React Dashboard`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Web React Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._
- **Should `Web TS Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._