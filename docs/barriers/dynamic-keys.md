# Barrier: dynamic and non-literal translation keys

## The wall

Static analysis can only prove keys that appear as **string literals** in source (e.g. `t('foo.bar')`). Anything else is **unknown at analysis time**:

- `t(user.role + '.label')`
- `` t(`prefix.${id}`) `` with `${…}`
- Keys loaded from JSON, CMS, or env at runtime

If we **pretended** those were static, we would **delete real keys**, **mark false positives**, or **ship broken i18n**. That destroys trust.

## What we automated

- **Heuristic detection** (`src/core/extractor/dynamic.ts`, orchestrated via `src/core/dynamic/`): scan for calls to configured **`functions`** and flag when the first argument is **not** a simple `'…'` / `"…"` string.
- **Skip false positives** such as **`function t(`** declarations (wrapper definitions), so we do not warn on your helper’s signature.
- **Single pipeline for commands**: **`validate`** and **`sync`** use the same **`analyzeDynamicKeysFromSourceText`** / **`scanProjectDynamicKeySites`** helpers so behaviour stays aligned.
- **`validate --json`**: includes a **`dynamic`** block (count + capped site list) for scripts and CI.

## What we report to the user (human mode)

- **Warnings**, not errors — dynamic usage does **not** fail **`validate`** by itself.
- Short **preview** snippets so developers can jump to the call site and fix, ignore, or add keys manually.

## What the user must handle manually

- **Design**: prefer static keys, key maps, or enums for anything safety-critical.
- **Runtime**: ensure dynamic paths still exist in locale JSON (the tool cannot enumerate them).
- **Review**: use warnings as a checklist, not an auto-fix.

## Non-interactive modes (CI, `--json`, no TTY)

- **Dynamic keys do not trigger prompts** — there is nothing to “pick”; we only **emit data** (`--json`) or **print warnings** (human).
- **Ambiguity is for config files**, not dynamic keys: multiple `i18nprune.config.*` files without `--config` will **exit 1** in non-interactive environments (see [config docs](../config/README.md)).

## Mental model

> **We detect and disclose; we do not guess keys.**

That keeps the tool honest and puts control with the developer for anything runtime-built.
