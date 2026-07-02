import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { exportToExcel } from '../lib/excel';
import { Profile, DailyReport, Machine } from '../types';

interface DashboardProps {
  profile: Profile;
  onLogout: () => void;
}

const MACHINES_TOTAL = 29;

export function Dashboard({ profile, onLogout }: DashboardProps) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEvk, setFilterEvk] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [profile.site_id]);

  const fetchData = async () => {
    setLoading(true);

    const query = supabase
      .from('daily_reports')
      .select(`
        *,
        machines!inner(serial_number, model, location),
        profiles!inner(email)
      `)
      .eq('site_id', profile.site_id)
      .order('report_date', { ascending: false })
      .limit(500);

    const [reportsRes, machinesRes] = await Promise.all([
      query,
      supabase.from('machines').select('*').eq('site_id', profile.site_id).eq('is_active', true),
    ]);

    if (reportsRes.data) {
      const mapped = reportsRes.data.map((r: any) => ({
        ...r,
        machine_serial: r.machines?.serial_number,
        machine_model: r.machines?.model,
        machine_location: r.machines?.location,
        technician_email: r.profiles?.email,
      }));
      setReports(mapped as DailyReport[]);
    }

    if (machinesRes.data) {
      setMachines(machinesRes.data as Machine[]);
    }

    setLoading(false);
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterDate && r.report_date !== filterDate) return false;
      if (filterEvk !== 'all' && r.evk_status !== filterEvk) return false;
      if (filterMachine !== 'all' && r.machine_id !== filterMachine) return false;
      return true;
    });
  }, [reports, filterDate, filterEvk, filterMachine]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayReports = reports.filter((r) => r.report_date === today);
    const verified = todayReports.filter((r) => r.evk_status === 'verified').length;
    const failed = todayReports.filter((r) => r.evk_status === 'failed').length;
    const bypass = todayReports.filter((r) => r.evk_status === 'bypass').length;
    const total = todayReports.length;
    const missing = MACHINES_TOTAL - total;
    return { total, verified, failed, bypass, missing, percentage: Math.round((total / MACHINES_TOTAL) * 100) };
  }, [reports]);

  const handleExport = () => {
    const filename = `GIAL-DSR-${filterDate || 'all'}.xlsx`;
    exportToExcel(filteredReports, filename);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = filterDate === todayStr;

  return (
    <div style={styles.container}>
      <header className="header-inner">
        <div>
          <h1 style={styles.headerTitle}>GIAL DSR</h1>
          <p style={styles.headerSub}>Daily Service Report, Guwahati International Airport</p>
        </div>
        <div className="header-right">
          <span style={styles.userEmail}>{profile.email}</span>
          <span style={styles.roleBadge}>{profile.role.toUpperCase()}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>

      {isToday && (
        <section className="hero-inner" aria-live="polite" aria-label="Daily verification status">
          <div style={styles.heroStat}>
            <span style={styles.heroNumber}>{stats.total}</span>
            <span style={styles.heroDenom}>/{MACHINES_TOTAL}</span>
          </div>
          <div style={styles.heroMeta}>
            <p style={styles.heroLabel}>machines logged today</p>
            <div style={styles.heroBar}>
              <div style={{ ...styles.heroBarFill, width: `${stats.percentage}%` }} />
            </div>
            {stats.missing > 0 && (
              <p style={styles.heroMissing}>{stats.missing} machine{stats.missing > 1 ? 's' : ''} pending</p>
            )}
            {stats.missing === 0 && (
              <p style={styles.heroComplete}>All machines verified</p>
              )}
            </div>
            <div className="hero-breakdown">
              <div style={styles.heroBreakItem}>
                <span style={{ ...styles.heroBreakDot, backgroundColor: 'var(--verified)' }} />
                <span style={styles.heroBreakLabel}>{stats.verified} verified</span>
              </div>
              {stats.failed > 0 && (
                <div style={styles.heroBreakItem}>
                  <span style={{ ...styles.heroBreakDot, backgroundColor: 'var(--failed)' }} />
                  <span style={styles.heroBreakLabel}>{stats.failed} failed</span>
                </div>
              )}
              {stats.bypass > 0 && (
                <div style={styles.heroBreakItem}>
                  <span style={{ ...styles.heroBreakDot, backgroundColor: 'var(--bypass)' }} />
                  <span style={styles.heroBreakLabel}>{stats.bypass} bypass</span>
                </div>
              )}
            </div>
        </section>
      )}

      <section className="filters-bar">
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={styles.filterInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>EVK Status</label>
          <select
            value={filterEvk}
            onChange={(e) => setFilterEvk(e.target.value)}
            style={styles.filterInput}
          >
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
            <option value="bypass">Bypass</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Machine</label>
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            style={styles.filterInput}
          >
            <option value="all">All machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.serial_number} &mdash; {m.location}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button onClick={fetchData} style={styles.refreshBtn}>
            Refresh
          </button>
          <button onClick={handleExport} style={styles.exportBtn} disabled={filteredReports.length === 0}>
            Export .xlsx
          </button>
        </div>
      </section>

      <section className="table-section" aria-live="polite" aria-label="Daily reports table">
        {loading ? (
          <div style={styles.stateBox}>
            <div className="spinner" />
            <p style={styles.stateText}>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={styles.stateBox}>
            <p style={styles.stateHeading}>No reports found</p>
            <p style={styles.stateText}>
              {isToday
                ? 'No technicians have submitted reports yet today.'
                : 'No reports match the selected filters. Try a different date or clear the filters.'}
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Machine</th>
                <th>Model</th>
                <th>Location</th>
                <th>Technician</th>
                <th>Sample Count</th>
                <th>EVK</th>
                <th>Failure Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id}>
                  <td>{r.report_date}</td>
                  <td style={styles.serialCell}>{r.machine_serial}</td>
                  <td>{r.machine_model}</td>
                  <td style={{ maxWidth: '200px' }}>{r.machine_location}</td>
                  <td>{r.technician_email}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.sample_count}</td>
                  <td>
                    <span style={{
                      ...styles.evkBubble,
                      ...(r.evk_status === 'verified' ? styles.evkVerified
                        : r.evk_status === 'failed' ? styles.evkFailed
                        : styles.evkBypass),
                    }}>
                      {r.evk_status}
                    </span>
                  </td>
                  <td style={{ maxWidth: '180px', color: r.verification_failure_reason ? 'var(--text-1)' : 'var(--text-4)' }}>
                    {r.verification_failure_reason || '\u2014'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {new Date(r.created_at).toLocaleTimeString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-0)',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-0)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  headerSub: {
    fontSize: '12px',
    color: 'var(--text-3)',
    margin: '2px 0 0 0',
  },
  userEmail: {
    fontSize: '12px',
    color: 'var(--text-3)',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: 'var(--accent-subtle)',
    color: 'var(--accent)',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  logoutBtn: {
    padding: '5px 12px',
    backgroundColor: 'transparent',
    color: 'var(--text-3)',
    border: '1px solid var(--border-default)',
    borderRadius: '5px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  heroStat: {
    display: 'flex',
    alignItems: 'baseline',
  },
  heroNumber: {
    fontSize: '56px',
    fontWeight: 700,
    color: 'var(--text-0)',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  heroDenom: {
    fontSize: '24px',
    fontWeight: 400,
    color: 'var(--text-4)',
    marginLeft: '4px',
  },
  heroMeta: {
    flex: 1,
    minWidth: '200px',
  },
  heroLabel: {
    fontSize: '13px',
    color: 'var(--text-3)',
    marginBottom: '8px',
  },
  heroBar: {
    height: '8px',
    backgroundColor: 'var(--bg-3)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  heroBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: '4px',
    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  heroMissing: {
    fontSize: '12px',
    color: 'var(--accent)',
    margin: 0,
  },
  heroComplete: {
    fontSize: '12px',
    color: 'var(--verified)',
    margin: 0,
    fontWeight: 500,
  },
  heroBreakItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  heroBreakDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  heroBreakLabel: {
    fontSize: '13px',
    color: 'var(--text-2)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  filterLabel: {
    fontSize: '11px',
    color: 'var(--text-4)',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  filterInput: {
    padding: '7px 10px',
    backgroundColor: 'var(--bg-1)',
    border: '1px solid var(--border-default)',
    borderRadius: '5px',
    color: 'var(--text-1)',
    fontSize: '13px',
    outline: 'none',
  },
  exportBtn: {
    padding: '7px 16px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-fg)',
    border: 'none',
    borderRadius: '5px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },
  refreshBtn: {
    padding: '7px 16px',
    backgroundColor: 'var(--bg-2)',
    color: 'var(--text-2)',
    border: '1px solid var(--border-default)',
    borderRadius: '5px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '16px',
  },
  serialCell: {
    fontWeight: 500,
    color: 'var(--text-0)',
    fontVariantNumeric: 'tabular-nums',
  },
  evkBubble: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'lowercase',
  },
  evkVerified: {
    backgroundColor: 'var(--verified-bg)',
    color: 'var(--verified-fg)',
  },
  evkFailed: {
    backgroundColor: 'var(--failed-bg)',
    color: 'var(--failed-fg)',
  },
  evkBypass: {
    backgroundColor: 'var(--bypass-bg)',
    color: 'var(--bypass-fg)',
  },
  stateBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 32px',
    gap: '12px',
  },
  stateHeading: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-2)',
    margin: 0,
  },
  stateText: {
    fontSize: '13px',
    color: 'var(--text-3)',
    textAlign: 'center' as const,
    margin: 0,
    maxWidth: '400px',
  },
};
