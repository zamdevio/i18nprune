import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const cliJs = path.join(root, 'dist/cli.js');
const fixture = path.join(root, 'tests/fixtures/sample-i18n');
/** Empty source locale vs one literal key in code — stable `missing` CLI coverage. */
const missingCliFixture = path.join(root, 'tests/fixtures/missing-cli');
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function runCli(args: string[], cwd: string = fixture): string {
  return execFileSync(process.execPath, [cliJs, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

/** First JSON document on stdout (pretty-printed multi-line or compact single-line). */
function parseFirstEnvelope(out: string): {
  ok: boolean;
  kind: string;
  data: Record<string, unknown>;
  issues: { code?: string; severity?: string; message?: string }[];
  meta: { apiVersion?: string };
} {
  const t = out.trim();
  try {
    return JSON.parse(t) as {
      ok: boolean;
      kind: string;
      data: Record<string, unknown>;
      issues: { code?: string; severity?: string; message?: string }[];
      meta: { apiVersion?: string };
    };
  } catch {
    /* Multiple compact lines: first self-contained `{…}` line */
    for (const line of t.split('\n')) {
      const s = line.trim();
      if (s.startsWith('{') && s.endsWith('}')) {
        try {
          return JSON.parse(s) as {
            ok: boolean;
            kind: string;
            data: Record<string, unknown>;
            issues: { code?: string; severity?: string; message?: string }[];
            meta: { apiVersion?: string };
          };
        } catch {
          /* continue */
        }
      }
    }
    throw new Error('No JSON object in output');
  }
}

describe('CLI against sample-i18n fixture', () => {
  it('validate reports literal keys vs source JSON (fixture may include missing keys)', () => {
    const out = runCli(['validate']);
    expect(out).toMatch(/validate · (ok|failed) ·/);
    expect(out).toMatch(/summary: dynamic=\d+ · keyObservations=\d+ · missing=\d+/);
  });

  it('missing without --yes exits non-zero in non-interactive mode when paths would be added', () => {
    expect(() => runCli(['missing'], missingCliFixture)).toThrow();
  });

  it('missing --json --dry-run returns envelope with missing payload in data', () => {
    const out = runCli(['missing', '--dry-run', '--json'], missingCliFixture);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('missing');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      paths?: string[];
      dryRun?: boolean;
    };
    expect(d.dryRun).toBe(true);
    expect(Array.isArray(d.paths)).toBe(true);
    expect(d.paths).toContain('fixture.missing.alpha');
  });

  it('generate --resume --json --dry-run --all returns generate envelope', () => {
    const out = runCli(['generate', '--resume', '--json', '--dry-run', '--all']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('generate');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      dryRun?: boolean;
      targets?: string[];
      leavesProcessed?: number;
      targetResults?: {
        target: string;
        resumeUpdatedLeafCount?: number;
        progress?: { updatedLeafCount?: number; durationMs?: number };
      }[];
    };
    expect(d.dryRun).toBe(true);
    expect(Array.isArray(d.targets)).toBe(true);
    expect(typeof d.leavesProcessed).toBe('number');
    const rows = d.targetResults;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows && rows.length > 0).toBe(true);
    expect(typeof rows?.[0]?.progress?.durationMs).toBe('number');
  });

  it('generate --json --dry-run multi-target includes per-target progress', () => {
    const out = runCli(['generate', '--json', '--dry-run', '--target', 'so,de']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('generate');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      dryRun?: boolean;
      targets?: string[];
      targetResults?: { target: string; progress?: { sourceLeafCount?: number; durationMs?: number } }[];
    };
    expect(d.dryRun).toBe(true);
    expect(d.targets).toContain('so');
    expect(d.targets).toContain('de');
    expect(Array.isArray(d.targetResults)).toBe(true);
    expect(d.targetResults?.some((r) => r.target === 'so')).toBe(true);
    expect(typeof d.targetResults?.[0]?.progress?.sourceLeafCount).toBe('number');
  });

  it('validate --json uses envelope; data has dynamic and missing', () => {
    const r = spawnSync(process.execPath, [cliJs, 'validate', '--json'], {
      cwd: fixture,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    expect([0, 1]).toContain(r.status ?? 0);
    const out = r.stdout ?? '';
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('validate');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      count?: number;
      keyObservations?: { count: number };
      dynamic?: { count: number; sites?: unknown[] };
      missing?: string[];
    };
    expect(d.dynamic).toBeDefined();
    expect(d.count).toBe(d.keyObservations?.count);
    expect(typeof d.dynamic?.count).toBe('number');
    expect(d.dynamic).not.toHaveProperty('sites');
    expect(d.keyObservations).not.toHaveProperty('observations');
    expect(Array.isArray(d.missing)).toBe(true);
    expect(Array.isArray(j.issues)).toBe(true);
    if (d.missing !== undefined && d.missing.length > 0) {
      expect(j.issues.some((i) => i.code === 'i18nprune.validate.missing_literal_keys')).toBe(true);
    }
    if ((d.dynamic as { count: number }).count > 0) {
      expect(j.issues.some((i) => i.code === 'i18nprune.validate.dynamic_key_sites')).toBe(true);
    }
  });

  it('validate --json on unreadable source locale prints one JSON envelope (issues[], not logger-only)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-validate-missing-locale-'));
    tempDirs.push(dir);
    const cfg = `export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
};
`;
    fs.writeFileSync(path.join(dir, 'i18nprune.config.mjs'), cfg, 'utf8');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    const r = spawnSync(process.execPath, [cliJs, 'validate', '--json'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    expect(r.status).toBe(1);
    expect(r.stderr ?? '').not.toMatch(/\[i18nprune\].*\[error\]/);
    const j = parseFirstEnvelope(r.stdout ?? '');
    expect(j.ok).toBe(false);
    expect(j.kind).toBe('validate');
    expect(Array.isArray(j.issues)).toBe(true);
    expect(j.issues.some((i) => i.code === 'i18nprune.validate.source_locale_unreadable')).toBe(true);
  });

  it('config --json returns envelope; data has i18nprune.config snapshot', () => {
    const out = runCli(['--json', 'config']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('config');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      kind?: string;
      resolvedPathKinds?: { sourceLocale?: string; localesDir?: string; srcRoot?: string };
    };
    expect(d.kind).toBe('i18nprune.config');
    expect(d.resolvedPathKinds?.sourceLocale).toBe('file');
    expect(d.resolvedPathKinds?.localesDir).toBe('directory');
    expect(d.resolvedPathKinds?.srcRoot).toBe('directory');
  });

  it('review --json returns envelope; data has localeReview', () => {
    const out = runCli(['--json', 'review']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('review');
    const d = j.data as {
      kind?: string;
      locales?: Record<string, { legacyLeaves?: number; structuredLeaves?: number }>;
    };
    expect(d.kind).toBe('localeReview');
    expect(d.locales).toBeDefined();
    const ar = d.locales?.['ar.json'];
    expect(ar).toBeDefined();
    expect(typeof ar?.legacyLeaves).toBe('number');
    expect(typeof ar?.structuredLeaves).toBe('number');
  });

  it('review --json --target ar limits to one locale file', () => {
    const out = runCli(['--json', 'review', '--target', 'ar']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('review');
    const d = j.data as { locales?: Record<string, unknown> };
    expect(Object.keys(d.locales ?? {})).toEqual(['ar.json']);
  });

  it('doctor --json returns envelope; data has doctor block', () => {
    const out = runCli(['--json', 'doctor']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('doctor');
    const d = j.data as { findings?: unknown[] };
    expect(Array.isArray(d.findings)).toBe(true);
  });

  it('sync --dry-run prints human sync stats via info logger', () => {
    const out = runCli(['sync', '--dry-run']);
    expect(out).not.toMatch(/Sync summary/);
    expect(out).toMatch(/\[i18nprune\] \[info\].*target file\(s\)/);
    expect(out).toMatch(/sync · ok · \d+ms/);
  });

  it('sync --json --dry-run with --metadata and --strip-metadata warns and uses legacy mode', () => {
    const out = runCli(['sync', '--json', '--dry-run', '--target', 'ar', '--metadata', '--strip-metadata']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('sync');
    const hasConflictIssue = j.issues.some((i) => i.code === 'i18nprune.sync.metadata_flag_conflict');
    expect(hasConflictIssue).toBe(true);
    const d = j.data as {
      localeMetadataReports?: Record<string, { mode?: string }>;
    };
    expect(d.localeMetadataReports?.['ar.json']?.mode).toBe('legacy_string');
  });

  it('cleanup --json returns cleanup envelope payload without writes', () => {
    const out = runCli(['cleanup', '--json']);
    const j = parseFirstEnvelope(out);
    expect(j.kind).toBe('cleanup');
    expect(j.meta.apiVersion).toBe('1');
    const d = j.data as {
      wouldRemove?: number;
      keys?: string[];
      dynamicKeySites?: number;
    };
    expect(typeof d.wouldRemove).toBe('number');
    expect(Array.isArray(d.keys)).toBe(true);
    expect(typeof d.dynamicKeySites).toBe('number');
  });

  it('locales dynamic --json respects global --top and --full', () => {
    const fullRaw = runCli(['--json', '--full', 'locales', 'dynamic']);
    const full = parseFirstEnvelope(fullRaw) as unknown as {
      kind: string;
      data: { dynamic: { count: number; sites: unknown[] }; full: boolean };
    };
    expect(full.kind).toBe('locales-dynamic');
    expect(full.data.full).toBe(true);
    expect(full.data.dynamic.sites).toHaveLength(full.data.dynamic.count);

    const topRaw = runCli(['--json', '--top', '2', 'locales', 'dynamic']);
    const top = parseFirstEnvelope(topRaw) as unknown as {
      kind: string;
      data: { dynamic: { count: number; sites: unknown[] }; shown: number; full: boolean };
    };
    expect(top.kind).toBe('locales-dynamic');
    expect(top.data.dynamic.count).toBe(full.data.dynamic.count);
    const cap = Math.min(2, full.data.dynamic.count);
    expect(top.data.dynamic.sites).toHaveLength(cap);
    expect(top.data.shown).toBe(cap);
    expect(top.data.full).toBe(false);
  });
});