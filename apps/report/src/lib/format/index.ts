export function previewCell(value: unknown, max = 200): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value.length > max ? `${value.slice(0, max)}…` : value;
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return String(value);
  }
}
