// Sanitize cell values against CSV Formula Injection (CWE-1236)
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(raw.trim())) {
    return `'${raw}`;
  }
  return raw.trim().replace(/"/g, '""');
}
