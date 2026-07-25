import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyReport, Machine } from '../types';
import { Select } from './Select';
import { MonthlyReport } from './MonthlyReport';
import { sortMachines } from '../lib/machineOrder';

interface SortHeaderProps {
  column: string;
  label: string;
  sortColumn: string;
  sortDir: 'asc' | 'desc';
  onSort: (column: string) => void;
  align?: 'left' | 'right';
}

function SortHeader({ column, label, sortColumn: activeCol, sortDir, onSort, align = 'left' }: SortHeaderProps) {
  const isActive = activeCol === column;
  const arrow = isActive ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25B3';
  return (
    <th
      scope="col"
      aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{ textAlign: align }}
      onClick={() => onSort(column)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(column); } }}
      tabIndex={0}
      role="columnheader"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)', fontSize: '10px' }}>{arrow}</span>
      </span>
    </th>
  );
}

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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEvk, setFilterEvk] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('report_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, [profile.site_id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const query = supabase
      .from('daily_reports')
      .select(`*, machines!inner(serial_number, model, location), profiles!inner(email)`)
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
        return { ...record, machine_serial: m?.serial_number, machine_model: m?.model, machine_location: m?.location, technician_email: p?.email };
      });
      setReports(mapped as DailyReport[]);
    }
    if (machinesRes.data) setMachines(sortMachines(machinesRes.data as Machine[]));
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

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const getValue = (r: DailyReport) => r[sortColumn as keyof DailyReport];
      const aVal = getValue(a); const bVal = getValue(b);
      if (typeof aVal === 'string' && typeof bVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });
  }, [filteredReports, sortColumn, sortDir]);

  const handleSort = (column: string) => {
    if (sortColumn === column) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDir('asc'); }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayReports = reports.filter((r) => r.report_date === today);
    const verified = todayReports.filter((r) => r.evk_status === 'verified').length;
    const failed = todayReports.filter((r) => r.evk_status === 'failed').length;
    const bypass = todayReports.filter((r) => r.evk_status === 'bypass').length;
    const missing = MACHINES_TOTAL - todayReports.length;
    return { total: todayReports.length, verified, failed, bypass, missing, percentage: Math.round((todayReports.length / MACHINES_TOTAL) * 100) };
  }, [reports]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportToExcel } = await import('../lib/excel');
      await exportToExcel(filteredReports, `GIAL-DSR-${filterDate || 'all'}.xlsx`);
    } finally { setExporting(false); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = filterDate === todayStr;
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (loading) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tl = gsap.timeline();
    tl.fromTo('.stats-grid', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
    tl.fromTo('.table-card', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.15');
    tl.fromTo('table tbody tr', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' }, '-=0.1');
  }, [loading, filteredReports]);

  return (
    <div className="app-layout" ref={container}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">G</div>
          <span className="sidebar-title">GIAL DSR</span>
        </div>
        <div className="sidebar-subtitle">Administrator</div>
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div
            role="button" tabIndex={0}
            className={`nav-item${activeView === 'daily' ? ' active' : ''}`}
            onClick={() => setActiveView('daily')}
            aria-current={activeView === 'daily' ? 'page' : undefined}
          >
            <span className="nav-icon">📋</span> Dashboard
          </div>
          <div
            role="button" tabIndex={0}
            className={`nav-item${activeView === 'monthly' ? ' active' : ''}`}
            onClick={() => setActiveView('monthly')}
            aria-current={activeView === 'monthly' ? 'page' : undefined}
          >
            <span className="nav-icon">📅</span> Monthly Report
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{profile.email.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{profile.email}</div>
            <div className="user-role">{profile.role}</div>
          </div>
          <button onClick={onLogout} className="logout-btn" title="Sign out" aria-label="Sign out">&times;</button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content" id="main-content">
        {/* ── Top Bar ── */}
        <header className="top-bar">
          <div className="top-bar-left">
            <div className="breadcrumb">
              GIAL DSR / <span className="breadcrumb-active">{activeView === 'daily' ? 'Dashboard' : 'Monthly Report'}</span>
            </div>
            <div className="segmented-control">
              <button className={`segment-btn${activeView === 'daily' ? ' active' : ''}`} onClick={() => setActiveView('daily')}>Daily</button>
              <button className={`segment-btn${activeView === 'monthly' ? ' active' : ''}`} onClick={() => setActiveView('monthly')}>Monthly</button>
            </div>
          </div>
          <div className="search-bar">
            <span className="search-icon">&#128269;</span>
            <input type="text" className="search-input" placeholder="Search reports..." aria-label="Search reports" />
          </div>
        </header>

        {/* ── Content ── */}
        {activeView === 'monthly' ? (
          <div className="content-body animate-in">
            <MonthlyReport profile={profile} />
          </div>
        ) : (
          <div className="content-body animate-in" aria-live="polite">
            {/* ── Stats Grid ── */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-value">{stats.total}<span style={{ fontSize: 'var(--text-md)', color: 'var(--text-muted)', fontWeight: 400 }}> / {MACHINES_TOTAL}</span></span>
                <span className="stat-card-label">Logged Today</span>
                <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${stats.percentage}%` }} /></div>
              </div>
              <div className="stat-card">
                <span className="stat-card-value" style={{ color: 'var(--verified-fg)' }}>{stats.verified}</span>
                <span className="stat-card-label">Verified</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-value" style={{ color: stats.failed > 0 ? 'var(--failed-fg)' : 'var(--text-secondary)' }}>{stats.failed}</span>
                <span className="stat-card-label">Failed</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-value" style={{ color: stats.bypass > 0 ? 'var(--bypass-fg)' : 'var(--text-secondary)' }}>{stats.bypass}</span>
                <span className="stat-card-label">Bypass</span>
              </div>
              {isToday && stats.missing > 0 && (
                <div className="stat-card" style={{ borderColor: 'rgba(198, 40, 40, 0.2)' }}>
                  <span className="stat-card-value" style={{ color: 'var(--failed-fg)' }}>{stats.missing}</span>
                  <span className="stat-card-label">Pending</span>
                </div>
              )}
            </div>

            {/* ── Filters Toolbar ── */}
            <div className="toolbar">
              <div className="toolbar-left">
                <div className="filter-group">
                  <span className="filter-label">Date</span>
                  <input type="date" className="filter-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
                <div className="filter-group">
                  <Select label="EVK Status" value={filterEvk} onChange={setFilterEvk}
                    options={[{ value: 'all', label: 'All' }, { value: 'verified', label: 'Verified' }, { value: 'failed', label: 'Failed' }, { value: 'bypass', label: 'Bypass' }]} />
                </div>
                <div className="filter-group">
                  <Select label="Machine" value={filterMachine} onChange={setFilterMachine}
                    options={[{ value: 'all', label: 'All machines' }, ...machines.map((m) => ({ value: m.id, label: `${m.serial_number} - ${m.location}` }))]} />
                </div>
              </div>
              <div className="toolbar-right">
                <button className="btn-secondary" onClick={fetchData}>Refresh</button>
                <button className="btn-export" onClick={handleExport} disabled={filteredReports.length === 0 || exporting}>
                  {exporting ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Preparing...</> : 'Export report'}
                </button>
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="table-card">
              <div className="table-inner">
                {error ? (
                  <div className="state-box">
                    <span className="state-icon">&#9888;</span>
                    <h3 className="state-heading">Connection Error</h3>
                    <p className="state-text">{error}</p>
                    <button className="btn-primary" style={{ marginTop: 'var(--space-md)' }} onClick={fetchData}>Retry</button>
                  </div>
                ) : loading ? (
                  <div className="state-box">
                    <div className="spinner" style={{ width: '24px', height: '24px' }} />
                    <p className="state-text" style={{ marginTop: 'var(--space-md)' }}>Loading reports...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="state-box">
                    <span className="state-icon">&#128196;</span>
                    <h3 className="state-heading">No reports found</h3>
                    <p className="state-text">{isToday ? 'No technicians have submitted reports yet today.' : 'No reports match the selected filters. Try a different date or clear the filters.'}</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <SortHeader column="report_date" label="Date" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                        <SortHeader column="machine_serial" label="Machine" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                        <SortHeader column="machine_model" label="Model" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                        <th>Location</th>
                        <th>Technician</th>
                        <SortHeader column="sample_count" label="Samples" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} align="right" />
                        <SortHeader column="evk_status" label="EVK" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                        <th>Failure Reason</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReports.map((r) => (
                        <tr key={r.id}>
                          <td>{r.report_date}</td>
                          <td className="has-serial">{r.machine_serial}</td>
                          <td>{r.machine_model}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.machine_location}</td>
                          <td>{r.technician_email}</td>
                          <td style={{ textAlign: 'right' }}>{r.sample_count}</td>
                          <td>
                            <span className={`status-badge status-${r.evk_status}`}>{r.evk_status}</span>
                          </td>
                          <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: r.verification_failure_reason ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {r.verification_failure_reason || '\u2014'}
                          </td>
                          <td style={{ fontSize: 'var(--text-base-sm)', color: 'var(--text-muted)' }}>
                            {new Date(r.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile Bottom Nav ── */}
        <nav className="mobile-nav" aria-label="Mobile Navigation">
          <div className="mobile-nav-items">
            <button className={`mobile-nav-item${activeView === 'daily' ? ' active' : ''}`} onClick={() => setActiveView('daily')}>
              <span className="nav-icon">📋</span> Daily
            </button>
            <button className={`mobile-nav-item${activeView === 'monthly' ? ' active' : ''}`} onClick={() => setActiveView('monthly')}>
              <span className="nav-icon">📅</span> Monthly
            </button>
            <button className="mobile-nav-item" onClick={fetchData}>
              <span className="nav-icon">🔄</span> Refresh
            </button>
            <button className="mobile-nav-item" onClick={handleExport} disabled={filteredReports.length === 0 || exporting}>
              <span className="nav-icon">📥</span> Export
            </button>
          </div>
        </nav>

        {/* ── Footer ── */}
        <footer className="app-footer">
          <span className="footer-text">GIAL DSR — Guwahati International Airport</span>
          <div className="footer-links">
            <span>{new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
