import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanProjectDynamicKeySites } from '../../../extractor/dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../../../extractor/keySites/orchestrate.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import {
  buildKeyReferenceContext,
  buildKeyReferenceContextFromReportDetails,
} from '../context.js';

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
});
