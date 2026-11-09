import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell } from '@/lib/csv';

describe('Admin CSV Formula Sanitization', () => {
  it('neutralizes dangerous formula injection characters at string start', () => {
    expect(sanitizeCsvCell('=cmd|"/c calc"!A0')).toBe('\'=cmd|"/c calc"!A0');
    expect(sanitizeCsvCell('+12345')).toBe('\'+12345');
    expect(sanitizeCsvCell('-@SUM(A1:A10)')).toBe('\'-@SUM(A1:A10)');
    expect(sanitizeCsvCell('@test')).toBe('\'@test');
    expect(sanitizeCsvCell('\tmalicious')).toBe('\'\tmalicious');
    expect(sanitizeCsvCell('\rmalicious')).toBe('\'\rmalicious');
  });

  it('preserves safe strings and numbers without leading formula characters', () => {
    expect(sanitizeCsvCell('CraftHacks')).toBe('CraftHacks');
    expect(sanitizeCsvCell('alice@example.com')).toBe('alice@example.com');
    expect(sanitizeCsvCell(42)).toBe('42');
    expect(sanitizeCsvCell(null)).toBe('');
  });
});
