/**
 * Timeline range parsing for exports:timeline.
 * Supports ISO weeks, date ranges, and relative windows.
 */
export interface TimelineRange {
  label: string;
  since: string;
  until: string;
  sinceIso: string;
  untilIso: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/** ISO week year-week e.g. 2026-W24 */
function parseIsoWeek(token: string): TimelineRange | null {
  const match = /^(\d{4})-W(\d{2})$/i.exec(token);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const since = startOfUtcDay(weekStart);
  const until = endOfUtcDay(weekEnd);
  return {
    label: `${token}`,
    since: isoDate(since),
    until: isoDate(until),
    sinceIso: since.toISOString(),
    untilIso: until.toISOString(),
  };
}

function parseDateRange(token: string): TimelineRange | null {
  const idx = token.indexOf('..');
  if (idx <= 0) return null;
  const left = token.slice(0, idx).trim();
  const right = token.slice(idx + 2).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(left) || !/^\d{4}-\d{2}-\d{2}$/.test(right)) return null;
  const since = startOfUtcDay(new Date(`${left}T00:00:00.000Z`));
  const until = endOfUtcDay(new Date(`${right}T00:00:00.000Z`));
  return {
    label: `${left}..${right}`,
    since: left,
    until: right,
    sinceIso: since.toISOString(),
    untilIso: until.toISOString(),
  };
}

function parseRelative(token: string, now = new Date()): TimelineRange | null {
  const rel = /^@(\d+)([dwm])$/i.exec(token);
  if (!rel) return null;
  const amount = Number(rel[1]);
  const unit = rel[2]!.toLowerCase();
  const until = endOfUtcDay(now);
  const since = startOfUtcDay(new Date(until));
  if (unit === 'd') since.setUTCDate(since.getUTCDate() - amount + 1);
  if (unit === 'w') since.setUTCDate(since.getUTCDate() - amount * 7 + 1);
  if (unit === 'm') since.setUTCMonth(since.getUTCMonth() - amount);
  return {
    label: token,
    since: isoDate(since),
    until: isoDate(until),
    sinceIso: since.toISOString(),
    untilIso: until.toISOString(),
  };
}

export function parseTimelineRange(token: string): TimelineRange | null {
  const trimmed = token.trim();
  return parseIsoWeek(trimmed) ?? parseDateRange(trimmed) ?? parseRelative(trimmed);
}

export function formatTimelineRangeHelp(): string[] {
  return [
    '2026-W24           ISO week (Mon–Sun, UTC)',
    '2026-06-01..2026-06-14   inclusive date range',
    '@7d                last 7 days',
    '@4w                last 4 weeks',
    '@3m                last 3 months',
  ];
}
