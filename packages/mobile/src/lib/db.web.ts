import { PendingReport } from '../types';

const PENDING_KEY = 'gial_dsr_pending_reports';
const MACHINES_KEY = 'gial_dsr_machine_cache';

function getPendingReports(): PendingReport[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingReports(reports: PendingReport[]): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(reports));
}

export function insertPendingReport(report: Omit<PendingReport, 'status' | 'error_message' | 'id' | 'created_at'>): string {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const entry: PendingReport = {
    id,
    machine_id: report.machine_id,
    report_date: report.report_date,
    sample_count: report.sample_count,
    evk_status: report.evk_status,
    verification_failure_reason: report.verification_failure_reason,
    status: 'pending',
    created_at: now,
  };
  const reports = getPendingReports();
  reports.push(entry);
  savePendingReports(reports);
  return id;
}

export async function getAllPendingReports(): Promise<PendingReport[]> {
  return getPendingReports().filter((r) => r.status === 'pending');
}

export async function deletePendingReport(id: string): Promise<void> {
  const reports = getPendingReports().filter((r) => r.id !== id);
  savePendingReports(reports);
}

export async function updatePendingReportStatus(id: string, status: 'pending' | 'synced' | 'failed', errorMessage?: string): Promise<void> {
  const reports = getPendingReports();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reports[idx].status = status;
    if (errorMessage) reports[idx].error_message = errorMessage;
    savePendingReports(reports);
  }
}

export async function refreshPendingCount(): Promise<number> {
  return getPendingReports().filter((r) => r.status === 'pending').length;
}

export function cacheMachines(machines: Array<{ id: string; data: string }>): void {
  localStorage.setItem(MACHINES_KEY, JSON.stringify(machines));
}

export async function getCachedMachines(): Promise<Array<{ id: string; data: string }>> {
  try {
    const raw = localStorage.getItem(MACHINES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
