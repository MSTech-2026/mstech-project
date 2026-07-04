import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyReport, Machine } from '../types';
import { Select } from './Select';
import { MonthlyReport } from './MonthlyReport';

interface DashboardProps {
  profile: Profile;
  onLogout: () => void;
}

const MACHINES_TOTAL = 29;

export function Dashboard({ profile, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<'daily' | 'monthly'>('daily');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEvk, setFilterEvk] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [profile.site_id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

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

    if (reportsRes.error || machinesRes.error) {
      setError("Network failure. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    if (reportsRes.data) {
      const mapped = reportsRes.data.map((r: unknown) => {
        if (!r || typeof r !== 'object') return r;
        const record = r as Record<string, unknown>;
        const m = record.machines as Record<string, string> | undefined;
        const p = record.profiles as Record<string, string> | undefined;
        return {
          ...record,
          machine_serial: m?.serial_number,
          machine_model: m?.model,
          machine_location: m?.location,
          technician_email: p?.email,
        };
      });
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

  const handleExport = async () => {
    // exception: lazy load for performance to split exceljs from main bundle
    const { exportToExcel } = await import('../lib/excel');
    const filename = `GIAL-DSR-${filterDate || 'all'}.xlsx`;
    exportToExcel(filteredReports, filename);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = filterDate === todayStr;

  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (loading) return;
    
    const tl = gsap.timeline();
    
    // Animate Header
    tl.fromTo('.profile-card', 
      { y: -10, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );

    // Animate Hero section elements
    tl.fromTo('.hero-section', 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      "-=0.2"
    );

    // Animate filters
    tl.fromTo('.filter-bar', 
      { y: 15, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
      "-=0.3"
    );

    // Stagger table rows
    tl.fromTo('.content-table tbody tr', 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
      "-=0.2"
    );
  }, [loading, filteredReports]);

  return (
    <div className="app-layout" ref={container}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">GIAL DSR</h1>
        </div>
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div
            role="button"
            tabIndex={0}
            className={`nav-item${activeView === 'daily' ? ' active' : ''}`}
            onClick={() => setActiveView('daily')}
            style={{ cursor: 'pointer' }}
            aria-current={activeView === 'daily' ? 'page' : undefined}
          >
            Dashboard
          </div>
          <div
            role="button"
            tabIndex={0}
            className={`nav-item${activeView === 'monthly' ? ' active' : ''}`}
            onClick={() => setActiveView('monthly')}
            style={{ cursor: 'pointer' }}
            aria-current={activeView === 'monthly' ? 'page' : undefined}
          >
            Monthly Report
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{profile.email}</span>
            <span className="user-role">{profile.role.toUpperCase()}</span>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Sign out" aria-label="Logout">&#x23FB;</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" id="main-content">
        <header className="top-bar">
          <div className="breadcrumb">
            <span className="breadcrumb-active">{activeView === 'daily' ? 'Dashboard' : 'Monthly Report'}</span>
            {activeView === 'daily' && ' / Today'}
          </div>
          <div className="search-bar">
            <input type="text" placeholder="Search..." className="search-input" />
          </div>
        </header>

        {activeView === 'monthly' ? (
          <div className="content-body">
            <div style={{ flex: 1, padding: '0' }}>
              <MonthlyReport profile={profile} />
            </div>
          </div>
        ) : (
        <div className="content-body">
          {/* Left Panel: Context/Stats */}
          <div className="left-panel">
            <div className="profile-card" aria-live="polite">
              <div className="profile-header">
                <div className="profile-avatar">
                  {profile.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="profile-name">Today's Status</h2>
                  <p className="profile-meta">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              
              <h3 className="section-title">Overview</h3>
              
              <div className="stat-row">
                <span className="stat-label">Total Logged</span>
                <span className="stat-value">{stats.total} / {MACHINES_TOTAL}</span>
              </div>
              <div className="progress-bar-container" style={{ marginBottom: '24px' }}>
                <div className="progress-bar-fill" style={{ width: `${stats.percentage}%` }} />
              </div>

              <h3 className="section-title">Breakdown</h3>
              <div className="stat-row">
                <span className="stat-label">Verified</span>
                <span className="stat-value" style={{ color: 'var(--verified)' }}>{stats.verified}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Failed</span>
                <span className="stat-value" style={{ color: stats.failed > 0 ? 'var(--failed)' : 'inherit' }}>{stats.failed}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Bypass</span>
                <span className="stat-value" style={{ color: stats.bypass > 0 ? 'var(--bypass)' : 'inherit' }}>{stats.bypass}</span>
              </div>
              
              {isToday && stats.missing > 0 && (
                <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'var(--failed-bg)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--failed)', fontWeight: 500 }}>
                    {stats.missing} machine{stats.missing > 1 ? 's' : ''} pending verification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Data Table */}
          <div className="right-panel">
            <div className="table-container" aria-live="polite">
              <div className="filters-bar" style={{ padding: '24px' }}>
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
                  <Select
                    label="EVK Status"
                    value={filterEvk}
                    onChange={setFilterEvk}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'verified', label: 'Verified' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'bypass', label: 'Bypass' },
                    ]}
                  />
                </div>
                <div style={styles.filterGroup}>
                  <Select
                    label="Machine"
                    value={filterMachine}
                    onChange={setFilterMachine}
                    options={[
                      { value: 'all', label: 'All machines' },
                      ...machines.map((m) => ({
                        value: m.id,
                        label: `${m.serial_number} — ${m.location}`,
                      })),
                    ]}
                  />
                </div>
                <div className="filter-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button onClick={fetchData} style={styles.refreshBtn}>
                    Refresh
                  </button>
                  <button onClick={handleExport} style={{ ...styles.exportBtn, backgroundColor: 'var(--accent-blue)', color: 'var(--accent-blue-fg)' }} disabled={filteredReports.length === 0}>
                    Export .xlsx
                  </button>
                </div>
              </div>

              <div style={{ padding: '0 24px 24px', overflowX: 'auto' }}>
                {error ? (
                  <div style={styles.stateBox}>
                    <p style={styles.stateHeading}>Connection Error</p>
                    <p style={styles.stateText}>{error}</p>
                    <button onClick={fetchData} style={{ ...styles.refreshBtn, marginTop: '16px' }}>Retry</button>
                  </div>
                ) : loading ? (
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
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead className="table-header">
                      <tr>
                        <th>Date</th>
                        <th>Machine</th>
                        <th>Model</th>
                        <th>Location</th>
                        <th>Technician</th>
                        <th style={{ textAlign: 'right' }}>Sample Count</th>
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
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.machine_location}</td>
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
                          <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: r.verification_failure_reason ? 'var(--text-1)' : 'var(--text-4)' }}>
                            {r.verification_failure_reason || '\u2014'}
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--text-3)' }}>
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
              </div>
            </div>
          </div>
        </div>
        )}
      </main>
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
