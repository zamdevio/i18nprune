import { describe, it, expect } from 'vitest';
import { injectJsonIntoPayloadScript } from '../htmlTemplate.js';

describe('injectJsonIntoPayloadScript', () => {
  it('replaces only the JSON script body and leaves other occurrences of the placeholder token intact', () => {
    const tpl = `<!doctype html><html><head>
<script id="i18nprune-inline-payload" type="application/json">__I18NPRUNE_REPORT__</script>
<script type="module">const x="__I18NPRUNE_REPORT__";console.log(x)</script>
</head><body></body></html>`;
    const safe = '{"kind":"i18nprune.projectReport"}';
    const out = injectJsonIntoPayloadScript(tpl, safe, 'test.html');
    expect(out).toContain(`<script id="i18nprune-inline-payload" type="application/json">${safe}</script>`);
    expect(out).toMatch(/const x="__I18NPRUNE_REPORT__"/);
    expect(out.split('__I18NPRUNE_REPORT__').length).toBe(2);
  });

  it('supports type before id attribute order', () => {
    const tpl = `<script type="application/json" id="i18nprune-inline-payload">OLD</script>`;
    const out = injectJsonIntoPayloadScript(tpl, '{}', 't.html');
    expect(out).toContain('>{}</script>');
    expect(out).not.toContain('OLD');
  });
});
