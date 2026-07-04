import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';

let isSyncing = false;

export function startSyncListener(onCountChange: (count: number) => void) {
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      import('../store').then((mod) => {
        const store = mod.useStore.getState();
        if (store.profile?.site_id && store.user?.id) {
          flushPendingQueue(store.profile.site_id, store.user.id).then(async () => {
            onCountChange(await db.refreshPendingCount());
          });
        }
      });
    }
  });
}

export async function flushPendingQueue(
  siteId: string,
  technicianId: string
): Promise<{ success: number; failed: number }> {
  if (isSyncing) return { success: 0, failed: 0 };
  isSyncing = true;

  let successCount = 0;
  let failedCount = 0;

  try {
    const reports = await db.getAllPendingReports();

    for (const report of reports) {
      try {
        const { error } = await supabase.from('daily_reports').insert({
          site_id: siteId,
          technician_id: technicianId,
          machine_id: report.machine_id,
          report_date: report.report_date,
          sample_count: report.sample_count,
          evk_status: report.evk_status,
          verification_failure_reason: report.verification_failure_reason || null,
        });

        if (error) {
          if (error.code === '23505') {
            await db.deletePendingReport(report.id);
            successCount++;
          } else if (error.code === '42501' || error.code === '42P01') {
            await db.updatePendingReportStatus(report.id, 'failed', error.message);
            failedCount++;
          } else {
            failedCount++;
            break;
          }
        } else {
          await db.deletePendingReport(report.id);
          successCount++;
        }
      } catch {
        failedCount++;
        break;
      }
    }
  } catch {
    failedCount = -1;
  }

  isSyncing = false;
  return { success: successCount, failed: failedCount };
}

export async function submitReport(
  siteId: string,
  technicianId: string,
  report: {
    machine_id: string;
    report_date: string;
    sample_count: number;
    evk_status: 'verified' | 'failed' | 'bypass';
    verification_failure_reason?: string;
  }
): Promise<{ success: boolean; offline: boolean; error?: string }> {
  const netState = await NetInfo.fetch();

  if (netState.isConnected && netState.isInternetReachable) {
    const { error } = await supabase.from('daily_reports').insert({
      site_id: siteId,
      technician_id: technicianId,
      machine_id: report.machine_id,
      report_date: report.report_date,
      sample_count: report.sample_count,
      evk_status: report.evk_status,
      verification_failure_reason: report.verification_failure_reason || null,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, offline: false, error: 'DUPLICATE_REPORT' };
      }
      if (error.code === '42501') {
        return { success: false, offline: false, error: 'RLS_FORBIDDEN' };
      }
      return { success: false, offline: false, error: error.message };
    }
    return { success: true, offline: false };
  }

  await db.insertPendingReport(report);
  return { success: true, offline: true };
}
