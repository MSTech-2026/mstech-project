import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyReport, Machine } from '../types';
import { Select } from './Select';

interface MonthlyReportProps {
  profile: Profile;
}

const EVK_BG: Record<string, string> = {
  verified: 'var(--verified-bg)',
  failed: 'var(--failed-bg)',
  bypass: 'var(--bypass-bg)',
};

const EVK_FG: Record<string, string> = {
  verified: 'var(--verified-fg)',
  failed: 'var(--failed-fg)',
  bypass: 'var(--bypass-fg)',
};

export function MonthlyReport({ profile }: MonthlyReportProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  const monthOptions = [];
  for (let m = 0; m < 12; m++) {
    const val = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
    const label = new Date(now.getFullYear(), m).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ value: val, label });
  }

  useEffect(() => {
    fetchData();
  }, [selectedMonth, profile.site_id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    const [reportsRes, machinesRes] = await Promise.all([
      supabase
        .from('daily_reports')
        .select('*, machines!inner(serial_number, model)')
        .eq('site_id', profile.site_id)
        .gte('report_date', startDate)
        .lte('report_date', endDate),
      supabase
        .from('machines')
        .select('*')
        .eq('site_id', profile.site_id)
        .eq('is_active', true)
        .order('location'),
    ]);

    if (reportsRes.error || machinesRes.error) {
      setError("Network failure. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    if (reportsRes.data) {
      const mapped = reportsRes.data.map((r: any) => ({
        ...r,
        machine_serial: r.machines?.serial_number,
        machine_model: r.machines?.model,
      }));
      setReports(mapped as DailyReport[]);
    }
    if (machinesRes.data) {
      setMachines(machinesRes.data as Machine[]);
    }
    setLoading(false);
  };

  const pivot = useMemo(() => {
    const map: Record<string, Record<number, DailyReport>> = {};
    reports.forEach((r) => {
      const day = new Date(r.report_date).getDate();
      if (!map[r.machine_id]) map[r.machine_id] = {};
      map[r.machine_id][day] = r;
    });
    return map;
  }, [reports]);

  const stats = useMemo(() => {
    let totalReports = 0;
    let verified = 0;
    let failed = 0;
    let bypass = 0;
    reports.forEach((r) => {
      totalReports++;
      if (r.evk_status === 'verified') verified++;
      else if (r.evk_status === 'failed') failed++;
      else if (r.evk_status === 'bypass') bypass++;
    });
    return { totalReports, verified, failed, bypass, expected: machines.length * daysInMonth };
  }, [reports, machines, daysInMonth]);

  const handleExport = async () => {
    // exception: lazy load for performance to split exceljs from main bundle
    const { exportMonthlyReport } = await import('../lib/excel');
    await exportMonthlyReport(reports, machines, year, month);
  };

  const dayHeaders: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dayHeaders.push(d);
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <h2 style={styles.title}>Monthly Verification Report</h2>
          <p style={styles.subtitle}>
            {monthName} {year}, {stats.totalReports} reports across {machines.length} machines
          </p>
        </div>
        <div style={styles.toolbarRight}>
          <Select
            label="Month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
          />
          <button onClick={handleExport} style={styles.exportBtn} disabled={reports.length === 0}>
            Export .xlsx
          </button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: 'var(--text-0)' }}>{stats.totalReports}</span>
          <span style={styles.statLabel}>Total Reports</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: 'var(--verified)' }}>{stats.verified}</span>
          <span style={styles.statLabel}>Verified</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: stats.failed > 0 ? 'var(--failed)' : 'var(--text-4)' }}>{stats.failed}</span>
          <span style={styles.statLabel}>Failed</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: stats.bypass > 0 ? 'var(--bypass)' : 'var(--text-4)' }}>{stats.bypass}</span>
          <span style={styles.statLabel}>Bypass</span>
        </div>
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: 'var(--text-0)' }}>
            {stats.expected > 0 ? Math.round((stats.totalReports / stats.expected) * 100) : 0}%
          </span>
          <span style={styles.statLabel}>Coverage</span>
        </div>
      </div>

      <div style={styles.tableWrap} aria-live="polite">
        {error ? (
          <div style={styles.emptyState}>
            <p style={{ color: 'var(--text-2)', fontWeight: 600, fontSize: '15px' }}>Connection Error</p>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '12px' }}>{error}</p>
            <button onClick={fetchData} style={{ ...styles.exportBtn, marginTop: '16px' }}>Retry</button>
          </div>
        ) : loading ? (
          <div style={styles.emptyState}>
            <div className="spinner" />
            <p style={{ color: 'var(--text-3)', marginTop: '12px' }}>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: 'var(--text-2)', fontWeight: 500 }}>No reports for {monthName} {year}</p>
            <p style={{ color: 'var(--text-4)', fontSize: '13px', marginTop: '4px' }}>
              Reports will appear here once technicians submit daily verifications.
            </p>
          </div>
        ) : (
          <div style={styles.tableScroll}>
            <table className="pivot-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'var(--bg-1)' }}>
                    Machine
                  </th>
                  {dayHeaders.map((d) => (
                    <th key={d} style={styles.th}>{d}</th>
                  ))}
                  <th style={{ ...styles.th, borderLeft: '1px solid var(--border-subtle)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => {
                  const machineData = pivot[machine.id] || {};
                  let total = 0;
                  return (
                    <tr key={machine.id}>
                      <td data-label="Machine" style={{ ...styles.td, ...styles.machineCell, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--bg-2)' }}>
                        <span style={styles.serialText}>{machine.serial_number}</span>
                      </td>
                      {dayHeaders.map((d) => {
                        const report = machineData[d];
                        if (report) {
                          total += report.sample_count;
                          return (
                            <td
                              data-label={d}
                              key={d}
                              style={{
                                ...styles.td,
                                ...styles.dayCell,
                                backgroundColor: EVK_BG[report.evk_status] || 'var(--bg-2)',
                                color: EVK_FG[report.evk_status] || 'var(--text-1)',
                                fontWeight: 600,
                              }}
                              title={`${report.evk_status} - ${report.sample_count} samples`}
                            >
                              {report.sample_count}
                            </td>
                          );
                        }
                        return (
                          <td data-label={d} key={d} style={{ ...styles.td, ...styles.dayCell, color: 'var(--text-4)' }}>
                            &mdash;
                          </td>
                        );
                      })}
                      <td data-label="Total" style={{ ...styles.td, ...styles.dayCell, fontWeight: 700, borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-0)' }}>
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '24px 24px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  toolbarLeft: {},
  toolbarRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-0)',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-3)',
    margin: '4px 0 0 0',
  },
  exportBtn: {
    padding: '9px 20px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-fg)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    height: '36px',
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    padding: '16px 24px',
    borderBottom: '1px solid var(--bg-2)',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-4)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableWrap: {
    padding: '0',
    overflow: 'hidden',
  },
  tableScroll: {
    overflowX: 'auto',
    padding: '0 24px 24px',
  },
  table: {
    borderCollapse: 'collapse',
    minWidth: '100%',
  },
  th: {
    padding: '6px 4px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-3)',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
    minWidth: '36px',
  },
  td: {
    padding: '4px',
    fontSize: '13px',
    borderBottom: '1px solid var(--bg-1)',
  },
  machineCell: {
    paddingRight: '12px',
    whiteSpace: 'nowrap',
    minWidth: '120px',
  },
  serialText: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-1)',
    fontVariantNumeric: 'tabular-nums',
  },
  dayCell: {
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    minWidth: '36px',
    height: '32px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
  },
};
