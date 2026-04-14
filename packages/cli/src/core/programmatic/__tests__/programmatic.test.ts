import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach } from 'vitest';
import { clearContextCache } from '@/core/context/index.js';
import { tryResolveContext } from '@/core/programmatic/tryResolveContext.js';
import { runValidate } from '@/core/programmatic/runValidate.js';
import {
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
} from '@/constants/issueCodes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** `programmatic/__tests__` → repo root (6 levels). */
const repoRoot = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const fixture = path.join(repoRoot, 'tests/fixtures/sample-i18n-app');

describe('programmatic entrypoints', () => {
  beforeEach(() => {
    clearContextCache();
  });

  it('tryResolveContext returns context and mirrors discovery warnings as issues', () => {
    const r = tryResolveContext(fixture);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.kind).toBe('context');
    expect(r.data.paths.sourceLocale).toContain('en.json');
    expect(Array.isArray(r.issues)).toBe(true);
  });

  it('runValidate matches validate JSON envelope shape and issues codes', () => {
    const r = tryResolveContext(fixture);
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
});
