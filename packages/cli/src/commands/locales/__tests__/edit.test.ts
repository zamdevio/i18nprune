import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { localesEdit } from '../edit.js';
import { resetCliGlobals, setCliYesFlag } from '@/shared/context/index.js';
import { resolveContext } from '@/shared/context/index.js';
import type { Context } from '@/types/core/context/index.js';

vi.mock('@/shared/context/index.js', async () => {
  const actual = await vi.importActual<typeof import('@/shared/context/index.js')>('@/shared/context/index.js');
  return {
    ...actual,
    resolveContext: vi.fn(),
  };
});

const resolveContextMock = vi.mocked(resolveContext);
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-locales-edit-'));
  tempDirs.push(dir);
  return dir;
}

function makeContext(root: string, run: Partial<Context['run']> = {}): Context {
  const localesDir = path.join(root, 'locales');
  fs.mkdirSync(localesDir, { recursive: true });
  for (const code of ['en', 'ar', 'so']) {
    fs.writeFileSync(path.join(localesDir, `${code}.json`), '{}\n', 'utf8');
  }
  return {
    config: {
      source: './locales/en.json',
      localesDir: './locales',
      src: './src',
      functions: ['t'],
    },
    paths: {
      sourceLocale: path.join(localesDir, 'en.json'),
      localesDir,
      srcRoot: path.join(root, 'src'),
    },
    run: {
      json: false,
      jsonPretty: true,
      quiet: false,
      silent: false,
      debugScan: false,
      debugCache: false,
      ...run,
    },
    meta: {
      fieldSources: {},
      warnings: [],
      cache: {
        enabled: false,
        reason: 'default',
        rootDir: '',
        metaPath: '',
        projectId: '',
        projectRoot: root,
        projectDir: '',
        filesPath: '',
        snapshotPath: '',
        analysisPath: '',
        readOnly: false,
      },
    },
    adapters: createNodeRuntimeAdapters(),
  };
}

function parseLoggedEnvelope(log: ReturnType<typeof vi.spyOn>): unknown {
  const raw = log.mock.calls.map((call) => String(call[0])).join('\n');
  return JSON.parse(raw);
}

describe('localesEdit', () => {
  beforeEach(() => {
    process.exitCode = undefined;
    resetCliGlobals();
    setCliYesFlag(false);
    resolveContextMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetCliGlobals();
    setCliYesFlag(false);
    process.exitCode = undefined;
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('edits multiple targets in JSON mode, auto-fills defaults, and skips unknown targets', async () => {
    const root = makeTempDir();
    const ctx = makeContext(root, { json: true });
    resolveContextMock.mockResolvedValue(ctx);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await localesEdit({ target: 'ar,missing,so' });

    const out = parseLoggedEnvelope(log) as {
      ok: boolean;
      data: { targets: string[]; skippedTargets: string[]; updated: number; rows: Array<{ target: string }> };
      issues: Array<{ severity: string; code: string; message: string }>;
    };
    expect(out.ok).toBe(true);
    expect(out.data.targets).toEqual(['ar', 'so']);
    expect(out.data.skippedTargets).toEqual(['missing']);
    expect(out.data.updated).toBe(2);
    expect(out.data.rows.map((row) => row.target)).toEqual(['ar', 'so']);
    expect(out.issues.some((issue) => issue.severity === 'warning' && issue.code === 'i18nprune.locale.target_not_found')).toBe(true);
    expect(fs.existsSync(path.join(root, 'locales', 'ar.meta.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'locales', 'so.meta.json'))).toBe(true);
  });

  it('returns a plain JSON usage error when --json omits --target', async () => {
    const root = makeTempDir();
    const ctx = makeContext(root, { json: true });
    resolveContextMock.mockResolvedValue(ctx);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await localesEdit({});

    const out = parseLoggedEnvelope(log) as {
      ok: boolean;
      issues: Array<{ message: string }>;
    };
    expect(out.ok).toBe(false);
    expect(out.issues[0]?.message).toContain('locales edit requires --target <code[,code]|all>');
    expect(out.issues[0]?.message).not.toContain('\u001b');
    expect(process.exitCode).toBe(1);
  });

  it('restores corrupt meta JSON from catalog defaults in JSON mode', async () => {
    const root = makeTempDir();
    const ctx = makeContext(root, { json: true });
    fs.writeFileSync(path.join(root, 'locales', 'ar.meta.json'), '{not-json', 'utf8');
    resolveContextMock.mockResolvedValue(ctx);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await localesEdit({ target: 'ar' });

    const out = parseLoggedEnvelope(log) as {
      ok: boolean;
      data: { target: string; profileSource: string; after: { englishName: string; nativeName: string; direction: string } };
    };
    expect(out.ok).toBe(true);
    expect(out.data.target).toBe('ar');
    expect(out.data.profileSource).toBe('catalog');
    expect(out.data.after).toMatchObject({ englishName: 'Arabic', direction: 'rtl' });
    const restored = JSON.parse(fs.readFileSync(path.join(root, 'locales', 'ar.meta.json'), 'utf8')) as {
      englishName: string;
      direction: string;
    };
    expect(restored.englishName).toBe('Arabic');
    expect(restored.direction).toBe('rtl');
  });
});
