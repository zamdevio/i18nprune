export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatPeakDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
