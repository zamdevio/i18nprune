# Export Example: localeLeaves

Programmatic usage of shared locale-leaf policy + normalization.

## Script

```ts
import { applyLocaleLeafMode, resolveLocaleLeafMode } from 'i18nprune/core';

const sourceMap = new Map<string, string>([
  ['home.title', 'Home'],
  ['home.cta', 'Continue'],
]);

const target = {
  home: {
    title: { value: 'Accueil', confidence: 'bad' }, // corrupt confidence
    cta: 'Continue', // legacy string
  },
};

const mode = resolveLocaleLeafMode({
  configMode: 'legacy_string',
  metadataFlag: true,
  stripMetadataFlag: false,
});

const out = applyLocaleLeafMode({ localeJson: target, sourceMap, mode: mode.mode });
console.log(JSON.stringify(out.report, null, 2));
```

## Shape with jq

```bash
node ./scripts/locale-leaves-example.mjs \
| jq '{mode, promotedLegacyLeaves, repairedCorruptLeaves, reasons: .byReason, actions: (.leafDecisions | group_by(.action) | map({action: .[0].action, count: length}))}'
```

## Timing

```bash
time node ./scripts/locale-leaves-example.mjs
```

## Why this export matters

- Same normalization logic used by `sync` / `generate` / `fill`
- Stable mode precedence rules
- Full per-leaf decisions for custom reporting pipelines
