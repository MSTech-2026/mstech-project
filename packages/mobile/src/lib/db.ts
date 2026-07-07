// Default db module — re-exports native implementation.
// Metro (native) resolves db.native.ts, webpack (web) resolves db.web.ts.
// This file exists for TypeScript resolution only.
export * from './db.native';
