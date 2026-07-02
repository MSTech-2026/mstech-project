import * as SQLite from 'expo-sqlite';
import { PendingReport } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('gial_dsr.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_reports (
        id TEXT PRIMARY KEY,
        machine_id TEXT NOT NULL,
        report_date TEXT NOT NULL,
        sample_count INTEGER NOT NULL,
        evk_status TEXT NOT NULL,
        verification_failure_reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL,
        synced_at TEXT
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS machine_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

export async function insertPendingReport(report: Omit<PendingReport, 'status' | 'error_message' | 'id' | 'created_at'>): Promise<string> {
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO pending_reports (id, machine_id, report_date, sample_count, evk_status, verification_failure_reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?);`,
    [id, report.machine_id, report.report_date, report.sample_count, report.evk_status, report.verification_failure_reason || null, now]
  );
  return id;
}

export async function getAllPendingReports(): Promise<PendingReport[]> {
  const database = await getDb();
  return database.getAllAsync<PendingReport>(
    `SELECT * FROM pending_reports WHERE status = 'pending' ORDER BY created_at ASC;`
  );
}

export async function updatePendingReportStatus(id: string, status: 'pending' | 'synced' | 'failed', errorMessage?: string): Promise<void> {
  const syncedAt = status === 'synced' ? new Date().toISOString() : null;
  const database = await getDb();
  await database.runAsync(
    `UPDATE pending_reports SET status = ?, error_message = ?, synced_at = ? WHERE id = ?;`,
    [status, errorMessage || null, syncedAt, id]
  );
}

export async function deletePendingReport(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM pending_reports WHERE id = ?;`, [id]);
}

export async function getPendingReportCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM pending_reports WHERE status = 'pending';`
  );
  return result?.count ?? 0;
}

export async function cacheMachines(machines: Array<{ id: string; data: string }>): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync(`DELETE FROM machine_cache;`);
  for (const machine of machines) {
    await database.runAsync(
      `INSERT OR REPLACE INTO machine_cache (id, data, updated_at) VALUES (?, ?, ?);`,
      [machine.id, machine.data, now]
    );
  }
}

export async function getCachedMachines(): Promise<Array<{ id: string; data: string }>> {
  const database = await getDb();
  return database.getAllAsync<{ id: string; data: string }>(
    `SELECT * FROM machine_cache ORDER BY updated_at DESC;`
  );
}
