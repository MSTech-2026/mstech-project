import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyReport } from '../types';

const EVK_COLORS: Record<string, { bg: string; fg: string }> = {
  verified: { bg: 'FFdcfce7', fg: 'FF166534' },
  failed: { bg: 'FFfee2e2', fg: 'FF991b1b' },
  bypass: { bg: 'FFfef3c7', fg: 'FF92400e' },
};

const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FF475569' }, size: 10 },
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF1F5F9' } },
  alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
};

const CELL_STYLE = {
  font: { color: { argb: 'FF111827' }, size: 11 },
  alignment: { vertical: 'middle' as const },
};

function styleEvkCell(cell: ExcelJS.Cell, status: string) {
  const colors = EVK_COLORS[status] || EVK_COLORS.verified;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors.bg },
  };
  cell.font = { bold: true, color: { argb: colors.fg }, size: 11 };
}

export async function exportToExcel(reports: DailyReport[], filename: string = 'gial-dsr-report.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DSR Report');

  const headers = [
    'Equipment Name', 'Sample Count',
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    Object.assign(cell, HEADER_STYLE);
    cell.font = HEADER_STYLE.font;
    cell.fill = HEADER_STYLE.fill;
    cell.alignment = HEADER_STYLE.alignment;
  });
  headerRow.height = 24;

  reports.forEach((r) => {
    const row = worksheet.addRow([
      r.machine_serial || '',
      r.sample_count,
    ]);

    row.eachCell((cell) => {
      cell.font = CELL_STYLE.font;
      cell.alignment = CELL_STYLE.alignment;
    });


    const countCell = row.getCell(2);
    countCell.alignment = { vertical: 'middle', horizontal: 'right' };
    const colors = EVK_COLORS[r.evk_status] || EVK_COLORS.verified;
    countCell.font = { ...CELL_STYLE.font, color: { argb: colors.fg } };
  });

  worksheet.columns = [
    { width: 25 }, { width: 14 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
}

export async function exportMonthlyReport(
  reports: DailyReport[],
  machines: Array<{ id: string; serial_number: string; model: string }>,
  year: number,
  month: number,
  filename?: string,
) {
  const workbook = new ExcelJS.Workbook();
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
  const worksheet = workbook.addWorksheet(`${monthName} ${year}`);

  const daysInMonth = new Date(year, month, 0).getDate();

  const headers: string[] = ['Machine', 'Model'];
  for (let d = 1; d <= daysInMonth; d++) {
    headers.push(String(d));
  }
  headers.push('Total', 'Verified', 'Failed', 'Bypass');

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = HEADER_STYLE.font;
    cell.fill = HEADER_STYLE.fill;
    cell.alignment = { ...HEADER_STYLE.alignment, horizontal: 'center' };
  });
  headerRow.height = 24;

  // Build pivot: machine_id -> day -> report
  const pivot: Record<string, Record<number, DailyReport>> = {};
  reports.forEach((r) => {
    const day = new Date(r.report_date).getDate();
    if (!pivot[r.machine_id]) pivot[r.machine_id] = {};
    pivot[r.machine_id][day] = r;
  });

  // Fill rows
  machines.forEach((machine) => {
    const machineData = pivot[machine.id] || {};
    const rowValues: (string | number)[] = [machine.serial_number, machine.model];

    let total = 0;
    let verified = 0;
    let failed = 0;
    let bypass = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const report = machineData[d];
      if (report) {
        rowValues.push(report.sample_count);
        total += report.sample_count;
        if (report.evk_status === 'verified') verified++;
        else if (report.evk_status === 'failed') failed++;
        else if (report.evk_status === 'bypass') bypass++;
      } else {
        rowValues.push('');
      }
    }

    rowValues.push(total, verified, failed, bypass);

    const row = worksheet.addRow(rowValues);

    // Style machine name and model columns
    row.getCell(1).font = { bold: true, color: { argb: 'FF111827' }, size: 11 };
    row.getCell(2).font = { color: { argb: 'FF475569' }, size: 10 };

    // Style day cells with EVK colors
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = row.getCell(d + 2); // +2 because columns 1 and 2 are machine/model
      const report = machineData[d];
      if (report) {
        styleEvkCell(cell, report.evk_status);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.font = { color: { argb: 'FF94A3B8' }, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // Style summary columns
    const summaryStart = daysInMonth + 3;
    for (let i = 0; i < 4; i++) {
      const cell = row.getCell(summaryStart + i);
      cell.font = { bold: true, color: { argb: 'FF111827' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  // Column widths
  worksheet.columns = [
    { width: 18 }, // Machine
    { width: 16 }, // Model
    ...Array(daysInMonth).fill({ width: 5 }), // Days
    { width: 8 },  // Total
    { width: 10 }, // Verified
    { width: 8 },  // Failed
    { width: 8 },  // Bypass
  ];

  const finalFilename = filename || `GIAL-DSR-${monthName}-${year}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), finalFilename);
}
