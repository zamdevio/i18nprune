import { sortKeysDeep, stripVolatileEnvelope } from './normalizeGenerateParity.ts';

/** Present only when `rg` is missing from PATH — not part of fixture/CLI contract under test. */
const CLEANUP_ENV_DEPENDENT_ISSUE_CODES = new Set(['i18nprune.cleanup.ripgrep_unavailable']);

function stripCleanupEnvironmentIssues(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.issues)) return value;
  return {
    ...obj,
    issues: obj.issues.filter((issue) => {
      if (issue === null || typeof issue !== 'object') return true;
      const code = (issue as { code?: string }).code;
      return code === undefined || !CLEANUP_ENV_DEPENDENT_ISSUE_CODES.has(code);
    }),
  };
}

/** Stable JSON text for byte comparison against committed cleanup snapshots. */
export function normalizeCleanupJsonEnvelope(stdout: string, fixtureAbs: string): string {
  const trimmed = stdout.trimEnd();
  const parsed: unknown = JSON.parse(trimmed);
  const stripped = stripVolatileEnvelope(parsed, fixtureAbs);
  const stable = stripCleanupEnvironmentIssues(stripped);
  const sorted = sortKeysDeep(stable);
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
