import { describe, it, expect } from 'vitest';
import { expandFunctionsWithBindings, scanImportBindings } from '../../bindings/index.js';
import { findDynamicKeySitesInJavascriptMergedText } from '../providers/javascript.js';
import { tryResolveTemplatePrefixBeforeUnknown } from '../rebuild.js';

describe('pre-dynamic rebuild (template + const map)', () => {
  it('omits dynamic site when template resolves via const strings', () => {
    const text = `
      const NS = 'app.pages';
      const x = t(\`\${NS}.home.title\`);
    `;
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    expect(sites.length).toBe(0);
  });

  it('still reports dynamic when placeholder cannot be resolved', () => {
    const text = 't(`foo.${unknownId}.bar`);';
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    expect(sites.some((s) => s.kind === 'template_interpolation')).toBe(true);
  });

  it('detects template interpolation when t is imported under an alias', () => {
    const text = `import { t as tr } from 'x';\ntr(\`foo.\${unknownId}.bar\`);`;
    const eff = expandFunctionsWithBindings(['t'], scanImportBindings(text));
    const sites = findDynamicKeySitesInJavascriptMergedText(text, eff);
    expect(sites.some((s) => s.kind === 'template_interpolation')).toBe(true);
  });

  it('attaches resolvedPrefix when a static path prefix exists before unknown interpolation', () => {
    const text = 't(`app.section.${unknown}.title`);';
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const s = sites.find((x) => x.kind === 'template_interpolation');
    expect(s?.resolvedPrefix).toBe('app.section');
  });

  it('bounds preview to the current call and marks multiline calls', () => {
    const text = `
function navItemSearchText(item, t) {
  return t(
    item.labelKey,
    item.labelInterpolation ?? {},
  ).toLowerCase();
}
export function filterNavByQuery() {}
`;
    const sites = findDynamicKeySitesInJavascriptMergedText(text, ['t']);
    const s = sites.find((x) => x.kind === 'non_literal');
    expect(s?.preview.includes('export function')).toBe(false);
    expect(s?.isMultilineCall).toBe(true);
  });
});

describe('tryResolveTemplatePrefixBeforeUnknown', () => {
  it('returns null when no dot-path prefix remains', () => {
    expect(tryResolveTemplatePrefixBeforeUnknown('${x}.a', {})).toBeNull();
  });
});
