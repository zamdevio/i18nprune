import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { resolveLocaleMetaProfile } from '../metaProfile.js';

describe('resolveLocaleMetaProfile', () => {
  const rt = createNodeRuntimeAdapters();

  it('uses catalog RTL direction when no meta sidecar exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-meta-profile-'));
    try {
      fs.writeFileSync(path.join(dir, 'ar.json'), '{}');
      const profile = resolveLocaleMetaProfile(rt, dir, 'ar');
      expect(profile.source).toBe('catalog');
      expect(profile.direction).toBe('rtl');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back to ltr for catalog entries without RTL direction', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-meta-profile-'));
    try {
      fs.writeFileSync(path.join(dir, 'fr.json'), '{}');
      const profile = resolveLocaleMetaProfile(rt, dir, 'fr');
      expect(profile.source).toBe('catalog');
      expect(profile.direction).toBe('ltr');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back to catalog when the meta sidecar is corrupt JSON', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-meta-profile-'));
    try {
      fs.writeFileSync(path.join(dir, 'ja.json'), '{}');
      fs.writeFileSync(path.join(dir, 'ja.meta.json'), '{not-json');
      const profile = resolveLocaleMetaProfile(rt, dir, 'ja');
      expect(profile.source).toBe('catalog');
      expect(profile.englishName).toBe('Japanese');
      expect(profile.metaPath.endsWith('ja.meta.json')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
