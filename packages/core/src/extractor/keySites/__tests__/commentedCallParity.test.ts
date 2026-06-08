import { describe, expect, it } from 'vitest';

import { findDynamicKeySitesInJavascriptFile } from '../../dynamic/providers/javascript.js';
import { commentRangesForJsLikeText } from '../../shared/jslikeTextRanges.js';
import { scanKeyObservations } from '../scan.js';

const FILE = 'app.tsx';

function scanBoth(text: string) {
  const commentRanges = commentRangesForJsLikeText(text);
  const observations = scanKeyObservations(text, ['t'], {}, { commentRanges });
  const dynamicSites = findDynamicKeySitesInJavascriptFile(text, ['t'], FILE);
  return { observations, dynamicSites };
}

describe('commented-call parity (keySites / dynamic)', () => {
  it('skips line-commented literal and template calls in keySites', () => {
    const text = [
      "t('active.key');",
      '// t(`commented.${x}`);',
      '// t(commentedId);',
    ].join('\n');
    const { observations, dynamicSites } = scanBoth(text);
    expect(
      observations
        .filter((o) => o.kind === 'literal' || o.kind === 'template_resolved')
        .map((o) => o.resolvedKey),
    ).toEqual(['active.key']);
    expect(dynamicSites.filter((s) => !s.isCommented)).toHaveLength(0);
    expect(dynamicSites.filter((s) => s.isCommented)).toHaveLength(2);
  });

  it('skips block-commented template interpolation in keySites', () => {
    const text = 'const x = 1;\n/* t(`block.${id}`) */\n';
    const { observations, dynamicSites } = scanBoth(text);
    expect(observations).toHaveLength(0);
    expect(dynamicSites).toHaveLength(1);
    expect(dynamicSites[0]?.kind).toBe('commented');
  });

  it('skips block-commented multiline template calls in keySites', () => {
    const text = [
      '/*',
      't(',
      '  `pages.${section}.title`,',
      ');',
      '*/',
      "t('live.key');",
    ].join('\n');
    const { observations } = scanBoth(text);
    expect(observations).toHaveLength(1);
    expect(observations[0]?.kind).toBe('literal');
    if (observations[0]?.kind === 'literal') {
      expect(observations[0].resolvedKey).toBe('live.key');
    }
  });

  it('keeps active template partial while skipping commented sibling on same pattern', () => {
    const text = [
      "const NS = 'app';",
      't(`${NS}.live.${id}`);',
      '// t(`${NS}.comment.${id}`);',
    ].join('\n');
    const { observations, dynamicSites } = scanBoth(text);
    expect(observations.filter((o) => o.kind === 'template_partial')).toHaveLength(1);
    expect(dynamicSites.filter((s) => s.kind === 'template_interpolation')).toHaveLength(1);
    expect(dynamicSites.filter((s) => s.kind === 'commented')).toHaveLength(1);
  });

  it('documents inline-comment first-arg edge (call offset is outside comment ranges)', () => {
    const text = "t(/*key*/`pages.${id}.title`);";
    const { observations, dynamicSites } = scanBoth(text);
    expect(observations.some((o) => o.kind === 'template_partial')).toBe(true);
    expect(dynamicSites.some((s) => s.kind === 'template_interpolation')).toBe(true);
  });
});
