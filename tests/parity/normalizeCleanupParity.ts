import { sortKeysDeep, stripVolatileEnvelope } from './normalizeGenerateParity.ts';

/** Stable JSON text for byte comparison against committed cleanup snapshots. */
export function normalizeCleanupJsonEnvelope(stdout: string, fixtureAbs: string): string {
  const trimmed = stdout.trimEnd();
  const parsed: unknown = JSON.parse(trimmed);
  const stripped = stripVolatileEnvelope(parsed, fixtureAbs);
  const sorted = sortKeysDeep(stripped);
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

/** Keep only `[i18nprune] ...` stderr logger lines; normalize paths and ms. */
export function normalizeCleanupHumanStderr(raw: string, fixtureAbs: string): string {
  const stripped = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '\n');
  const segments = stripped.split(/(?=\[i18nprune\])/);
  const lines = segments.map((s) => s.trim()).filter((s) => s.startsWith('[i18nprune]'));
  let out = lines.join('\n');
  let rest = out;
  while (rest.includes(fixtureAbs)) {
    rest = rest.split(fixtureAbs).join('<fixture>');
  }
  out = rest.replace(/cleanup · ok · \d+ms/g, 'cleanup · ok · <ms>');
  return `${out}\n`;
}
