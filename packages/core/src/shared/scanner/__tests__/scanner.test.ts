import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { ScanDebugEvent } from '../../../types/scanner/debug.js';
import { resetRunOptions, setRunOptions } from '../../options/runOptions.js';
import { listSourceFiles } from '../files.js';
import { scanSources } from '../index.js';

const tempDirs: string[] = [];

afterEach(() => {
  resetRunOptions();
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('scanner', () => {
  const rt = createNodeRuntimeAdapters();

  it('emits scan debug events for dir skips and non-source files (via onScanDebug)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(root, 'dist', 'skip.ts'), 'export const skip = true;');
    fs.writeFileSync(path.join(root, 'src', 'note.txt'), 'not scanned');
    const events: ScanDebugEvent[] = [];
    setRunOptions({
      silent: false,
      json: false,
      jsonPretty: true,
      quiet: false,
      debugScan: true,
      onScanDebug: (e) => events.push(e),
    });
    listSourceFiles(rt, root);
    const dirSkip = events.find((e) => e.kind === 'skip_directory' && e.basename === 'dist');
    expect(dirSkip?.kind).toBe('skip_directory');
    if (dirSkip?.kind === 'skip_directory') {
      expect(dirSkip.reason).toContain('built-in directory skip');
    }
    const txtSkip = events.find((e) => e.kind === 'skip_file' && e.basename === 'note.txt');
    expect(txtSkip?.kind).toBe('skip_file');
    if (txtSkip?.kind === 'skip_file') {
      expect(txtSkip.reason).toContain('not a scanned source extension');
    }
  });

  it('per-call onScanDebug overrides global listener', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    const globalEvents: ScanDebugEvent[] = [];
    const localEvents: ScanDebugEvent[] = [];
    setRunOptions({ silent: false, onScanDebug: (e) => globalEvents.push(e) });
    listSourceFiles(rt, root, undefined, { onScanDebug: (e) => localEvents.push(e) });
    expect(localEvents.some((e) => e.kind === 'skip_directory')).toBe(true);
    expect(globalEvents.length).toBe(0);
  });

  it('lists scanable source files and skips known build dirs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(root, 'src', 'b.tsx'), 'export const b = 2;');
    fs.writeFileSync(path.join(root, 'dist', 'skip.ts'), 'export const skip = true;');
    fs.writeFileSync(path.join(root, 'src', 'note.txt'), 'not scanned');
    const files = listSourceFiles(rt, root).map((f) => path.basename(f)).sort();
    expect(files).toEqual(['a.ts', 'b.tsx']);
  });

  it('scans concatenated source text', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'a.ts'), 'const a = 1;');
    fs.writeFileSync(path.join(root, 'src', 'b.ts'), 'const b = 2;');
    const out = scanSources(rt, root);
    expect(out.files.length).toBe(2);
    expect(out.text).toContain('const a = 1;');
    expect(out.text).toContain('const b = 2;');
  });

  it('exclude.dirs skips a custom directory basename', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src', 'fixtures'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'keep.ts'), 'export const k = 1;');
    fs.writeFileSync(path.join(root, 'src', 'fixtures', 'x.ts'), 'export const x = 1;');
    const files = listSourceFiles(rt, root, { dirs: ['fixtures'] }).map((f) => path.basename(f)).sort();
    expect(files).toEqual(['keep.ts']);
  });

  it('exclude.useDefaultSkip false allows scanning dist', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(root, 'dist', 'in-dist.ts'), 'export const d = 1;');
    const files = listSourceFiles(rt, root, { useDefaultSkip: false }).map((f) => path.basename(f)).sort();
    expect(files).toEqual(['in-dist.ts']);
  });

  it('exclude.extensions skips declaration files via d.ts token', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.writeFileSync(path.join(root, 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(root, 'b.d.ts'), 'export declare const b: number;');
    const files = listSourceFiles(rt, root, { extensions: ['d.ts'] }).map((f) => path.basename(f)).sort();
    expect(files).toEqual(['a.ts']);
  });

  it('exclude.patterns skips by relative path from scan root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src', 'generated'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'ok.ts'), 'export const ok = 1;');
    fs.writeFileSync(path.join(root, 'src', 'generated', 'bad.ts'), 'export const bad = 1;');
    const files = listSourceFiles(rt, root, { patterns: [/^src\/generated\//] })
      .map((f) => path.relative(root, f).replace(/\\/g, '/'))
      .sort();
    expect(files).toEqual(['src/ok.ts']);
  });

  it('exclude.preset production skips compiled/tests-like paths', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-scan-'));
    tempDirs.push(root);
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.mkdirSync(path.join(root, 'compiled'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'keep.ts'), 'export const keep = 1;');
    fs.writeFileSync(path.join(root, 'src', 'x.spec.ts'), 'export const spec = 1;');
    fs.writeFileSync(path.join(root, 'compiled', 'vendor.ts'), 'export const vendor = 1;');

    const files = listSourceFiles(rt, root, { preset: 'production' })
      .map((f) => path.relative(root, f).replace(/\\/g, '/'))
      .sort();
    expect(files).toEqual(['src/keep.ts']);
  });
});
