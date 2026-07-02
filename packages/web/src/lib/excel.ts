import * as XLSX from 'xlsx';
import { DailyReport } from '../types';

export function exportToExcel(reports: DailyReport[], filename: string = 'gial-dsr-report.xlsx') {
  const rows = reports.map((r) => ({
    'Date': r.report_date,
    'Machine Serial': r.machine_serial || '',
    'Machine Model': r.machine_model || '',
    'Location': r.machine_location || '',
    'Technician': r.technician_email || '',
    'Sample Count': r.sample_count,
    'EVK Status': r.evk_status.toUpperCase(),
    'Failure Reason': r.verification_failure_reason || '',
    'Timestamp': new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
    { wch: 25 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 25 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DSR Report');
  XLSX.writeFile(workbook, filename);
}
