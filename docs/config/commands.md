# Command namespaces in config

The root config object includes **optional namespaces** for individual commands so settings stay grouped and safe to extend (`config.validate`, `config.missing`, …).

**Related:** [Environment variables](./env.md) (all supported env names; source of truth: `packages/cli/src/constants/env.ts`). When **`@zamdevio/i18nprune/config`** export surface is tightened in the [exports phase](../phases/exports/README.md), this page should stay aligned with **`I18nPruneConfig`** and the published **`defineConfig`** types.

## `validate`

- **Purpose:** reserved for **`i18nprune validate`**-specific options.
- **Shape today:** empty object `{}` or omitted. Unknown keys are **allowed** (forward compatibility).
- **Example:**

```ts
export default {
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  validate: {},
};
```

## `missing`

- **Purpose:** defaults for **`i18nprune missing`** human output.
- **Fields:**

| Field | Type | Effect |
|-------|------|--------|
| **`displayDefaultTop`** | positive integer | Default cap for **human** path listings when you omit **`--top`** and do not pass **`--full-list`**. |

**Precedence for that default cap:** environment variable **`MISSING_DISPLAY_DEFAULT_TOP`** (if set to a valid positive integer) → **`config.missing.displayDefaultTop`** → built-in **10**.

CLI **`--top N`** always overrides the default cap for that run. **`--full-list`** ignores the cap.

**Example:**

```ts
export default {
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  missing: { displayDefaultTop: 15 },
};
```

`defineConfig()` from **`@zamdevio/i18nprune/config`** deep-merges **`missing`** (and **`validate`**) with defaults the same way it merges **`policies`**.

## Environment variables (command-related)

Full reference: [Environment variables](./env.md) (includes **`CI`**, **`MISSING_DISPLAY_DEFAULT_TOP`**, **`I18NPRUNE_*`**, **`I18NPRUNE_GENERATE_*`**). Global CLI flags (e.g. **`--yes`**, **`--json`**) are documented per command.
