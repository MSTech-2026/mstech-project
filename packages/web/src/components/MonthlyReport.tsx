import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, DailyReport, Machine } from '../types';
import { Select } from './Select';
import { sortMachines } from '../lib/machineOrder';

interface MonthlyReportProps {
  profile: Profile;
}

export function MonthlyReport({ profile }: MonthlyReportProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [displayMode, setDisplayMode] = useState<'month' | 'range'>('month');
  const [dateFrom, setDateFrom] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [dateTo, setDateTo] = useState(() => {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  const monthOptions: { value: string; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const val = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
    monthOptions.push({ value: val, label: new Date(now.getFullYear(), m).toLocaleString('en-US', { month: 'long', year: 'numeric' }) });
  }

  // Column headers for the pivot table — day numbers in month mode, dates in range mode
  const columns = useMemo(() => {
    if (displayMode === 'month') {
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        return {
          key: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          label: String(d),
        };
      });
    }
    const cols: { key: string; label: string }[] = [];
    const current = new Date(dateFrom + 'T00:00:00');
    const end = new Date(dateTo + 'T00:00:00');
    while (current <= end) {
      const key = current.toISOString().slice(0, 10);
      const label = `${current.getMonth() + 1}/${current.getDate()}`;
      cols.push({ key, label });
      current.setDate(current.getDate() + 1);
    }
    return cols;
  }, [displayMode, year, month, daysInMonth, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [selectedMonth, profile.site_id, displayMode, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    let startDate: string, endDate: string;
    if (displayMode === 'range') {
      if (dateFrom > dateTo) {
        setError('Start date must be before end date.');
        setLoading(false);
        return;
      }
      startDate = dateFrom;
      endDate = dateTo;
    } else {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
    }
    const [reportsRes, machinesRes] = await Promise.all([
      supabase.from('daily_reports').select('*, machines!inner(serial_number, model)').eq('site_id', profile.site_id).gte('report_date', startDate).lte('report_date', endDate),
      supabase.from('machines').select('*').eq('site_id', profile.site_id).eq('is_active', true).order('location'),
    ]);
    if (reportsRes.error || machinesRes.error) { setError("Network failure. Please check your connection and try again."); setLoading(false); return; }
    if (reportsRes.data) {
      setReports(reportsRes.data.map((r: any) => ({ ...r, machine_serial: r.machines?.serial_number, machine_model: r.machines?.model })) as DailyReport[]);
    }
    if (machinesRes.data) setMachines(sortMachines(machinesRes.data as Machine[]));
    setLoading(false);
  };

  const pivot = useMemo(() => {
    const map: Record<string, Record<string, DailyReport>> = {};
    reports.forEach((r) => {
      if (!map[r.machine_id]) map[r.machine_id] = {};
      map[r.machine_id][r.report_date] = r;
    });
    return map;
  }, [reports]);

  const stats = useMemo(() => {
    let total = 0, verified = 0, failed = 0, bypass = 0;
    reports.forEach((r) => { total++; if (r.evk_status === 'verified') verified++; else if (r.evk_status === 'failed') failed++; else if (r.evk_status === 'bypass') bypass++; });
    return { totalReports: total, verified, failed, bypass, expected: machines.length * columns.length };
  }, [reports, machines.length, columns.length]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportMonthlyReport } = await import('../lib/excel');
      const fromKey = columns.length > 0 ? columns[0].key : dateFrom;
      const toKey = columns.length > 0 ? columns[columns.length - 1].key : dateTo;
      const label = displayMode === 'range' ? `${fromKey}_to_${toKey}` : `${monthName}_${year}`;
      await exportMonthlyReport(reports, machines, fromKey, toKey, `GIAL-DSR-${label}.xlsx`);
    } finally { setExporting(false); }
  };

  const summaryLabel = displayMode === 'range' && columns.length > 0
    ? `${new Date(columns[0].key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(columns[columns.length - 1].key + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${monthName} ${year}`;

  const emptyTitle = displayMode === 'range' ? 'No reports in this range' : `No reports for ${monthName} ${year}`;

  return (
    <div>
      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <span className="stat-card-value">{stats.totalReports}</span>
          <span className="stat-card-label">Total Reports</span>
          <span className="stat-card-sub">{stats.expected} expected</span>
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
        <div className="stat-card">
          <span className="stat-card-value">{stats.expected > 0 ? Math.round((stats.totalReports / stats.expected) * 100) : 0}%</span>
          <span className="stat-card-label">Coverage</span>
        </div>
      </div>

      {/* ── Pivot Table ── */}
      <div className="table-card">
        <div className="monthly-toolbar">
          <div className="monthly-toolbar-left">
            <h2>Monthly Verification Report</h2>
            <p>{summaryLabel} &middot; {reports.length} reports across {machines.length} machines</p>
          </div>
          <div className="monthly-toolbar-right">
            <div className="mode-toggle">
              <button className={displayMode === 'month' ? 'active' : ''} onClick={() => setDisplayMode('month')}>Month</button>
              <button className={displayMode === 'range' ? 'active' : ''} onClick={() => setDisplayMode('range')}>Range</button>
            </div>
            {displayMode === 'month' ? (
              <Select label="Month" value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} />
            ) : (
              <div className="date-range-inputs">
                <input type="date" className="date-range-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
                <span className="range-to-label">→</span>
                <input type="date" className="date-range-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
              </div>
            )}
            <button className="btn-export" onClick={handleExport} disabled={reports.length === 0 || exporting}>
              {exporting ? <><span className="spinner" style={{ width: '12px', height: '12px' }} /> Preparing...</> : 'Export report'}
            </button>
          </div>
        </div>

        <div className="pivot-table-wrap" aria-live="polite" aria-label="Monthly verification pivot">
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
          ) : reports.length === 0 ? (
            <div className="state-box">
              <span className="state-icon">&#128197;</span>
              <h3 className="state-heading">{emptyTitle}</h3>
              <p className="state-text">Reports will appear here once technicians submit daily verifications.</p>
            </div>
          ) : (
            <table className="pivot-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: '140px', position: 'sticky', left: 0, zIndex: 3 }}>Machine</th>
                  {columns.map((col) => <th key={col.key}>{col.label}</th>)}
                  <th style={{ borderLeft: '1px solid var(--border-light)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => {
                  const machineData = pivot[machine.id] || {};
                  let total = 0;
                  return (
                    <tr key={machine.id}>
                      <td data-label="Machine" className="machine-cell">{machine.serial_number}</td>
                      {columns.map((col) => {
                        const report = machineData[col.key];
                        if (report) {
                          total += report.sample_count;
                          const cellClass = report.evk_status === 'verified' ? 'pivot-cell-verified' : report.evk_status === 'failed' ? 'pivot-cell-failed' : 'pivot-cell-bypass';
                          return <td data-label={col.label} key={col.key} className={cellClass} title={`${report.evk_status} - ${report.sample_count} samples`}>{report.sample_count}</td>;
                        }
                        return <td data-label={col.label} key={col.key} className="pivot-cell-empty">{'\u2014'}</td>;
                      })}
                      <td data-label="Total" className="total-cell">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="legend">
          <div className="legend-item"><span className="legend-swatch verified" />Verified</div>
          <div className="legend-item"><span className="legend-swatch failed" />Failed</div>
          <div className="legend-item"><span className="legend-swatch bypass" />Bypass</div>
          <div className="legend-item"><span className="legend-swatch empty" />No Data</div>
        </div>
      </div>
    </div>
  );
}
