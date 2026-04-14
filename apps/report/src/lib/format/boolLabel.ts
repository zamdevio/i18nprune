/** Compact Yes / No / em dash for table cells and print rows. */
export function yesNoCell(v: boolean | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '—';
}
