import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { scanProjectDynamicKeySites } from '../../../extractor/dynamic/orchestrate.js';
import { literalKeyUsageFromObservations } from '../../../extractor/keySites/projectUsage.js';
import { scanProjectKeyObservations } from '../../../extractor/keySites/orchestrate.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import {
  buildKeyReferenceContext,
  buildKeyReferenceContextFromReportDetails,
} from '../context.js';

const repoRoot = path.join(fileURLToPath(new URL('.', import.meta.url)), '../../../../../..');
const sampleFixture = path.join(repoRoot, 'tests/fixtures/sample-i18n');

describe('buildKeyReferenceContext', () => {
  it('combines usage and dynamic prefixes with reference policy filters', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/repo/src';
    const files = [path.join(srcRoot, 'main.ts')];
    const texts = new Map<string, string>([
      [
        files[0],
        [
          "const id = user.id;",
          "t('checkout.title');",
          "t(`checkout.items.${id}`);",
          "// t(`commented.only.${id}`);",
        ].join('\n'),
      ],
    ]);
    const readFile = (filePath: string) => texts.get(filePath) ?? '';
    const listFiles = () => files;

    const out = buildKeyReferenceContext(
      {
        srcRoot,
        functions: ['t'],
        listFiles,
        readFile,
        path: rt.path,
        cwd: '/repo',
      },
      {
        treatCommentedCallSitesAsRuntime: false,
        treatNonSourceFileSitesAsRuntime: false,
        uncertainKeyPolicy: 'protect',
        stringPresence: 'guard',
        stringPresenceMaxHitsPerKey: 5,
        respectPreserve: true,
      },
    );

    expect(out.provenKeys.has('checkout.title')).toBe(true);
    expect(out.uncertainPrefixes).toContain('checkout.items');
    expect(out.uncertainPrefixes).not.toContain('commented.only');
  });

  it('buildKeyReferenceContextFromReportDetails matches buildKeyReferenceContext for the same scans', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/repo/src';
    const files = [path.join(srcRoot, 'main.ts')];
    const texts = new Map<string, string>([
      [
        files[0],
        [
          "const id = user.id;",
          "t('checkout.title');",
          "t(`checkout.items.${id}`);",
          "// t(`commented.only.${id}`);",
        ].join('\n'),
      ],
    ]);
    const readFile = (filePath: string) => texts.get(filePath) ?? '';
    const listFiles = () => files;
    const scanInput = {
      srcRoot,
      functions: ['t'],
      listFiles,
      readFile,
      path: rt.path,
      cwd: '/repo',
    };
    const eff = {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect' as const,
      stringPresence: 'guard' as const,
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    };

    const direct = buildKeyReferenceContext(scanInput, eff);
    const observations = scanProjectKeyObservations(scanInput);
    const dynamicSites = scanProjectDynamicKeySites(scanInput);
    const fused = buildKeyReferenceContextFromReportDetails(observations, dynamicSites, eff);

    expect([...fused.provenKeys].sort()).toEqual([...direct.provenKeys].sort());
    expect([...fused.uncertainPrefixes].sort()).toEqual([...direct.uncertainPrefixes].sort());
  });

  it('counts mixed-template static prefix once when keySites and dynamic both report it', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/repo/src';
    const files = [path.join(srcRoot, 'main.ts')];
    const texts = new Map<string, string>([
      [
        files[0],
        ["const M = 'orders';", "t(`${M}.statuses.${data.status}`);"].join('\n'),
      ],
    ]);
    const readFile = (filePath: string) => texts.get(filePath) ?? '';
    const listFiles = () => files;
    const scanInput = {
      srcRoot,
      functions: ['t'],
      listFiles,
      readFile,
      path: rt.path,
      cwd: '/repo',
    };
    const eff = {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect' as const,
      stringPresence: 'guard' as const,
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    };

    const observations = scanProjectKeyObservations(scanInput);
    const dynamicSites = scanProjectDynamicKeySites(scanInput);
    const usage = literalKeyUsageFromObservations(observations);

    const partial = observations.find((o) => o.kind === 'template_partial');
    expect(partial?.dynamicRef).toEqual({ line: 2, filePath: 'main.ts' });
    expect(usage.uncertainPrefixes.size).toBe(0);

    const refCtx = buildKeyReferenceContextFromReportDetails(observations, dynamicSites, eff);
    expect(refCtx.uncertainPrefixes).toEqual(['orders.statuses']);
    expect(refCtx.uncertainPrefixes.filter((p) => p === 'orders.statuses')).toHaveLength(1);
  });

  it('matches sample-i18n uncertainPrefixes via fused keySites + dynamic scan', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = path.join(sampleFixture, 'src');
    const scanInput = {
      srcRoot,
      functions: ['t'],
      cwd: sampleFixture,
      path: rt.path,
      listFiles: () => {
        const out: string[] = [];
        const walk = (dir: string): void => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(abs);
            else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(abs);
          }
        };
        walk(srcRoot);
        return out;
      },
      readFile: (filePath: string) => fs.readFileSync(filePath, 'utf8'),
    };
    const eff = {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect' as const,
      stringPresence: 'guard' as const,
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    };

    const direct = buildKeyReferenceContext(scanInput, eff);
    const observations = scanProjectKeyObservations(scanInput);
    const dynamicSites = scanProjectDynamicKeySites(scanInput);
    const fused = buildKeyReferenceContextFromReportDetails(observations, dynamicSites, eff);

    expect([...fused.uncertainPrefixes].sort()).toEqual([...direct.uncertainPrefixes].sort());
    expect([...fused.uncertainPrefixes].sort()).toEqual(['app.footer']);

    const mixed = dynamicSites.filter(
      (s) => s.kind === 'template_interpolation' && s.classification === 'mixed_const_runtime',
    );
    expect(mixed).toHaveLength(1);
    expect(mixed[0]?.staticPrefix).toBe('app.footer');
    expect(dynamicSites).toHaveLength(3);

    const usage = literalKeyUsageFromObservations(observations);
    expect(usage.uncertainPrefixes.size).toBe(0);
    expect(observations.filter((o) => o.kind === 'template_partial').every((o) => o.dynamicRef)).toBe(
      true,
    );
  });
});
