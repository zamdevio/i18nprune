import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import { clearContextCache } from '@/shared/context/index.js';
import { tryResolveContext } from '@/shared/context/index.js';
import { runValidate } from '../jsonEnvelope.js';
import {
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
} from '@i18nprune/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** `commands/validate/__tests__` -> repo root (6 levels). */
const repoRoot = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const fixture = path.join(repoRoot, 'tests/fixtures/sample-i18n');

describe('validate JSON envelope', () => {
  let prevCwd: string;

  beforeEach(() => {
    clearContextCache();
    prevCwd = process.cwd();
    process.chdir(fixture);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    clearContextCache();
  });

  it('tryResolveContext returns context and mirrors discovery warnings as issues', async () => {
    const r = await tryResolveContext();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kind).toBe('context');
    expect(r.data.paths.sourceLocale).toContain('en.json');
    expect(Array.isArray(r.issues)).toBe(true);
  });

  it('runValidate matches validate JSON envelope shape and issues codes', async () => {
    const r = await tryResolveContext();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const env = runValidate(r.data);
    expect(env.kind).toBe('validate');
    expect(typeof env.ok).toBe('boolean');
    expect(env.data).toHaveProperty('missing');
    expect(env.data).toHaveProperty('dynamic');
    expect(env.data.count).toBe(env.data.keyObservations.count);
    expect(Array.isArray(env.issues)).toBe(true);
    const codes = env.issues.map((i) => i.code);
    if (env.data.missing.length > 0) {
      expect(codes).toContain(ISSUE_VALIDATE_MISSING_LITERAL_KEYS);
    }
    if (env.data.dynamic.count > 0) {
      expect(codes).toContain(ISSUE_VALIDATE_DYNAMIC_KEY_SITES);
    }
  });

  it('runValidate with node runtime adapters matches default filesystem I/O', async () => {
    const r = await tryResolveContext();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const baseline = runValidate(r.data);
    const withAdapters = runValidate(r.data, { adapters: createNodeRuntimeAdapters() });
    expect(withAdapters).toEqual(baseline);
  });
});
