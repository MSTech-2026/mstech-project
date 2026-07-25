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
    styleEvkCell(countCell, r.evk_status);
    countCell.alignment = { vertical: 'middle', horizontal: 'right' };
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
  dateFrom: string,
  dateTo: string,
  filename?: string,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DSR Monthly');

  // Build date column list spanning the range
  const dateCols: string[] = [];
  const current = new Date(dateFrom + 'T00:00:00');
  const end = new Date(dateTo + 'T00:00:00');
  while (current <= end) {
    dateCols.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  const headers: string[] = ['Machine', 'Model'];
  dateCols.forEach((d) => {
    const parts = d.split('-');
    headers.push(`${parseInt(parts[1])}/${parseInt(parts[2])}`);
  });
  headers.push('Total', 'Verified', 'Failed', 'Bypass');

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = HEADER_STYLE.font;
    cell.fill = HEADER_STYLE.fill;
    cell.alignment = { ...HEADER_STYLE.alignment, horizontal: 'center' };
  });
  headerRow.height = 24;

  // Build pivot: machine_id -> date_string -> report
  const pivot: Record<string, Record<string, DailyReport>> = {};
  reports.forEach((r) => {
    if (!pivot[r.machine_id]) pivot[r.machine_id] = {};
    pivot[r.machine_id][r.report_date] = r;
  });

  // Fill rows
  machines.forEach((machine) => {
    const machineData = pivot[machine.id] || {};
    const rowValues: (string | number)[] = [machine.serial_number, machine.model];

    let total = 0, verified = 0, failed = 0, bypass = 0;

    dateCols.forEach((dateKey) => {
      const report = machineData[dateKey];
      if (report) {
        rowValues.push(report.sample_count);
        total += report.sample_count;
        if (report.evk_status === 'verified') verified++;
        else if (report.evk_status === 'failed') failed++;
        else if (report.evk_status === 'bypass') bypass++;
      } else {
        rowValues.push('');
      }
    });

    rowValues.push(total, verified, failed, bypass);

    const row = worksheet.addRow(rowValues);

    row.getCell(1).font = { bold: true, color: { argb: 'FF111827' }, size: 11 };
    row.getCell(2).font = { color: { argb: 'FF475569' }, size: 10 };

    dateCols.forEach((dateKey, idx) => {
      const cell = row.getCell(idx + 3); // +3 = machine(1) + model(2) + idx
      const report = machineData[dateKey];
      if (report) {
        styleEvkCell(cell, report.evk_status);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.font = { color: { argb: 'FF94A3B8' }, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // Style summary columns
    const summaryStart = dateCols.length + 3;
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
    ...Array(dateCols.length).fill({ width: 5 }), // Date columns
    { width: 8 },  // Total
    { width: 10 }, // Verified
    { width: 8 },  // Failed
    { width: 8 },  // Bypass
  ];

  const finalFilename = filename || `GIAL-DSR-${dateFrom}_to_${dateTo}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), finalFilename);
}
