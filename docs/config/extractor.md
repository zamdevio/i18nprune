---
description: Extractor config — translation helper discovery, hook presets, and opt-in prop helpers (extractor.hoc).
---

# Extractor config

How i18nprune decides which calls count as translation lookups. Most projects only need **`functions`**. Opt into **`extractor.hoc`** when child components receive the helper as a **prop** and you are missing keys under a hook-centric `functions` list.

## `functions` (always on)

List of callee names treated as translation helpers (for example `t`, `i18n.t`). Init presets usually include both the helper and common hooks.

```ts
functions: ['t', 'useTranslation'],
```

On every file, the extractor also expands:

- **Import aliases** — `import { t as translate }` when `t` / `translate` is configured
- **Hook presets (HOC §A)** — `const { t } = useTranslation()` / `const t = useTranslations()` when the hook is imported and listed in `functions`
- **One-hop aliases** — `const tt = t` in the same file

See [Regex & limits](../architecture/extraction/regex.md) and [ADR 002](../architecture/decisions/002-configurable-translation-calls.md).

## When you need `extractor.hoc`

**Default is off.** Turn it on only if you see this pattern and those keys are missing from validate / cleanup:

```tsx
// Row.tsx — no import of t, no useTranslation in this file
export function Row({ t }: { t: TFunction }) {
  return <span>{t('row.label')}</span>;
}

// Page.tsx — hook lives here; t is passed down
const { t } = useTranslation();
return <Row t={t} />;
```

| Your `functions` | What happens without `extractor.hoc` |
|------------------|--------------------------------------|
| Includes `'t'` (init default) | `Row` is usually already scanned — you may not need this knob |
| Hook-only, e.g. `['useTranslation']` | `Page` is covered by the hook preset; **`Row` is not** — enable `extractor.hoc` |

### Config

```ts
extractor: {
  // Opt-in: treat destructured props as helpers. Off by default —
  // unrelated props named `t` can become false positives.
  hoc: {
    enabled: true,
    propNames: ['t'], // optional; default ['t']
  },
},
```

| Field | Default | Meaning |
|-------|---------|---------|
| `extractor.hoc.enabled` | `false` | Promote matching destructured first-param props |
| `extractor.hoc.propNames` | `['t']` | Which prop names to promote |

Supported shapes: `function Row({ t })` and `const Row = ({ t }) => …`.  
**Not** supported yet: renames (`{ t: translate }`), JSX `<Row t={t} />` tracing.

## Init scaffolds

| Command | `extractor.hoc` in the file? |
|---------|------------------------------|
| `i18nprune init` / `init --yes` (minimal) | **No** |
| `i18nprune init --rich` | **Commented example only** — still off until you uncomment and set `enabled: true` |

## Related

- [Configuration hub](./README.md)
- [`init`](../commands/init.md)
- [Extraction overview](../architecture/extraction/README.md)
- [Regex & limits](../architecture/extraction/regex.md)
