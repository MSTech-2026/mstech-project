// Web localStorage database implementation
// Expo Metro uses this for web builds instead of SQLite

import { PendingReport } from '../types';

const PENDING_KEY = 'gial_dsr_pending_reports';
const MACHINE_CACHE_KEY = 'gial_dsr_machine_cache';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage write failed', e);
  }
}

export function insertPendingReport(report: Omit<PendingReport, 'status' | 'error_message' | 'id' | 'created_at'>): string {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const reports = readJson<PendingReport[]>(PENDING_KEY, []);
  reports.push({
    ...report,
    id,
    created_at: now,
    status: 'pending',
    error_message: undefined,
  });
  writeJson(PENDING_KEY, reports);
  return id;
}

export async function getAllPendingReports(): Promise<PendingReport[]> {
  return readJson<PendingReport[]>(PENDING_KEY, []).filter((r: PendingReport) => r.status === 'pending');
}

export async function deletePendingReport(id: string): Promise<void> {
  const reports = readJson<PendingReport[]>(PENDING_KEY, []);
  writeJson(PENDING_KEY, reports.filter((r: PendingReport) => r.id !== id));
}

export async function updatePendingReportStatus(id: string, status: 'pending' | 'synced' | 'failed', errorMessage?: string): Promise<void> {
  const reports = readJson<PendingReport[]>(PENDING_KEY, []);
  const idx = reports.findIndex((r: PendingReport) => r.id === id);
  if (idx !== -1) {
    reports[idx].status = status;
    reports[idx].synced_at = status === 'synced' ? new Date().toISOString() : undefined;
    reports[idx].error_message = errorMessage;
  }
  writeJson(PENDING_KEY, reports);
}

export async function refreshPendingCount(): Promise<number> {
  return readJson<PendingReport[]>(PENDING_KEY, []).filter((r: PendingReport) => r.status === 'pending').length;
}

export function cacheMachines(machines: Array<{ id: string; data: string }>): void {
  writeJson(MACHINE_CACHE_KEY, machines);
}

export async function getCachedMachines(): Promise<Array<{ id: string; data: string }>> {
  return readJson<Array<{ id: string; data: string }>>(MACHINE_CACHE_KEY, []);
}
