import { CsvHelper } from './csv.helper';

describe('CsvHelper', () => {
  describe('toCsv', () => {
    it('should return empty string for empty array', () => {
      expect(CsvHelper.toCsv([])).toBe('');
    });

    it('should convert simple objects to CSV', () => {
      const rows = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const csv = CsvHelper.toCsv(rows);
      expect(csv).toBe('name,age\nAlice,30\nBob,25');
    });

    it('should handle values with commas by quoting', () => {
      const rows = [{ name: 'Doe, John', role: 'admin' }];
      const csv = CsvHelper.toCsv(rows);
      expect(csv).toBe('name,role\n"Doe, John",admin');
    });

    it('should handle values with double quotes by escaping', () => {
      const rows = [{ name: 'Say "Hello"', role: 'user' }];
      const csv = CsvHelper.toCsv(rows);
      expect(csv).toBe('name,role\n"Say ""Hello""",user');
    });

    it('should handle null and undefined as empty strings', () => {
      const rows = [{ name: null, role: undefined }];
      const csv = CsvHelper.toCsv(rows);
      expect(csv).toBe('name,role\n,');
    });

    it('should JSON.stringify object values', () => {
      const rows = [{ data: { key: 'val' } }];
      const csv = CsvHelper.toCsv(rows);
      expect(csv).toContain('""key"":""val""');
    });
  });

  describe('fromCsv', () => {
    it('should return empty array for header-only CSV', () => {
      expect(CsvHelper.fromCsv('name,age')).toEqual([]);
    });

    it('should parse simple CSV', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = CsvHelper.fromCsv(csv);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });

    it('should handle quoted values with commas', () => {
      const csv = 'name,role\n"Doe, John",admin';
      const result = CsvHelper.fromCsv(csv);
      expect(result).toEqual([{ name: 'Doe, John', role: 'admin' }]);
    });

    it('should handle escaped double quotes', () => {
      const csv = 'name,role\n"Say ""Hello""",user';
      const result = CsvHelper.fromCsv(csv);
      expect(result).toEqual([{ name: 'Say "Hello"', role: 'user' }]);
    });

    it('should roundtrip: toCsv -> fromCsv preserves data', () => {
      const original = [
        { code: 'TEST', label: 'Test Object', description: 'A "test" desc' },
        { code: 'OTHER', label: 'Other, complex', description: '' },
      ];
      const csv = CsvHelper.toCsv(original);
      const parsed = CsvHelper.fromCsv(csv);
      // fromCsv returns string values
      expect(parsed).toEqual([
        { code: 'TEST', label: 'Test Object', description: 'A "test" desc' },
        { code: 'OTHER', label: 'Other, complex', description: '' },
      ]);
    });
  });
});
