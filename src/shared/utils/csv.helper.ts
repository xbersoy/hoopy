/**
 * Shared helper for CSV ↔ JSON conversion.
 * Handles escaping, quoting, multi-line values, etc.
 * No external dependencies needed.
 */

export class CsvHelper {
  /**
   * Convert an array of flat objects to a CSV string.
   * Keys of the first object define the columns.
   */
  static toCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escapeCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escapeCell(row[h])).join(','));
    }
    return lines.join('\n');
  }

  /**
   * Parse a CSV string into an array of objects.
   * First row is treated as headers.
   */
  static fromCsv(csv: string): Record<string, string>[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = CsvHelper.parseCsvRow(lines[0]);
    const results: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = CsvHelper.parseCsvRow(lines[i]);
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] ?? '';
      }
      results.push(row);
    }
    return results;
  }

  private static parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < row.length && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }
}
