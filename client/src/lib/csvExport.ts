/**
 * Utility for exporting table data to CSV with proper UTF-8 Arabic support.
 * Usage: exportToCSV(data, columns, 'filename')
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToCSV<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (!data.length) return;

  // Build header row
  const headers = columns.map((col) => `"${col.header}"`).join(',');

  // Build data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        const str = val === null || val === undefined ? '' : String(val);
        // Escape double quotes inside cell value
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = [headers, ...rows].join('\r\n');

  // UTF-8 BOM for proper Arabic display in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
