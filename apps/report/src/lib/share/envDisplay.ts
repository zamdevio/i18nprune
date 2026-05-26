/** Display payload environment scalars as recorded — use em dash when absent. */
export function envDisplayValue(value: string | undefined): string {
  if (value === undefined) return '—';
  const trimmed = value.trim();
  return trimmed === '' ? '—' : value;
}
