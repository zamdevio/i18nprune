# Programmatic exports (`i18nprune` · `@i18nprune/core`)

The **npm `i18nprune`** package ships the **CLI** plus stable **subpath** APIs. The **`@i18nprune/core`** package is the **standalone engine** the CLI depends on — use it when you want library code without pulling the full CLI surface.

| Import / package | Purpose |
|------------------|---------|
| **`i18nprune`** (bin + `package.json` `exports`) | Install for **`i18nprune`** command and bundled subpaths. |
| **`i18nprune/core/config`** | From the **`i18nprune`** package: typed **`defineConfig`** + **`I18nPruneConfig`** for **`i18nprune.config.*`**. |
| **`i18nprune/core`** | From the **`i18nprune`** package: engine re-exports (extractor, translator, …). Prefer **`i18nprune/core/config`** for config files. |
| **`@i18nprune/core`** | Direct dependency on the engine package for scripts, Workers, or custom hosts. |

The default export (`.`) of **`i18nprune`** is the **CLI entry** and should not be imported as a library.

---

**See the dedicated guides:**

- [Configuration API](./config.md)
- [Core API](./core.md)
- [Usage Examples & Recipes](./examples.md)
- [Examples Index (per export)](./examples/README.md)
- [JSON output (`--json`)](../json/README.md) — CLI envelope, flags, programmatic types
- [Programmatic API & CLI JSON](../json/programmatic.md) — library `Result` roadmap vs `--json` contract

---

## Configuration Guide

See the dedicated page: **[Configuration API](./config.md)**

```ts
import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'en',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: { preserve: {}, parity: {} },
} satisfies Partial<I18nPruneConfig>);
```

**Exports:** **`defineConfig`**, **`I18nPruneConfig`** (see [Configuration API](./config.md)).

**Does not:** load the filesystem, run scans, or resolve discovery—those happen at runtime when the CLI (or **`core`**) runs with a working directory and optional overrides.

---

## Core API Guide

See the dedicated page: **[Core API](./core.md)**

### `resolveContext` / `clearContextCache`

- **`resolveContext(cwd?)`** — Builds **`Context`**: merged `config`, absolute **`paths`** (`sourceLocale`, `localesDir`, `srcRoot`), default **`run`** flags, and **`meta`** (field provenance, warnings). Merge order matches the CLI: defaults → config file → env → discovery → global CLI overrides (when set through the same mechanisms the CLI uses).
- **`clearContextCache()`** — Clears cached resolution between tests or long-lived processes.

### Grouped namespaces (optional)

On **`i18nprune/core`**, the same functions are also available under **`context`**, **`extractor`**, **`dynamic`**, **`json`**, **`ask`**, **`preserve`**, **`reference`**, **`validate`**, **`scanner`**, **`files`**, and **`result`**. **Flat and namespaced imports are both supported** — see [Core API](./core.md#flat-vs-namespaced-imports-both-supported).

### Extraction & scanning

- **`scanSources(srcRoot)`** — Concatenates scanned project source text (same pipeline as the CLI scanner).
- **`exactLiteralKeys(text, functions, constMap)`** — Literal translation keys from merged source text.
- **`findDynamicKeySites`**, **`analyzeDynamicKeysFromSourceText`**, **`scanProjectDynamicKeySites`** — Non-literal translation call heuristics (same as **`validate`** / **`locales dynamic`**). Templates that fully rebuild from the const map are omitted; partial paths may set **`resolvedPrefix`** (see **`tryRebuildTemplateKeyFromConsts`**, **`tryResolveTemplatePrefixBeforeUnknown`**).

### JSON

- **`collectTranslationSurfaceLeaves(root)`** — Translation string terminals (legacy strings or structured `{ value, … }` leaves) with **logical paths** aligned to the source locale (used by **quality**, **review**, **sync** coverage, **generate**, etc.).
- **`translationSurfacePathValueMap(root)`** — `Map<path, value>` from the same walk (see **`@i18nprune/core`** / **`projects`** namespace on the engine package).
- **`readJsonFile(path)`** — Read JSON from disk (shared helper).

### Types

`Context`, `ResolvedPaths`, `I18nPruneConfig`, `DynamicKeySite`, `Policies`.

---

## What is *not* exported (by design)

- **Unmigrated command orchestration** stays in the CLI layer. Migrated operations such as **`generate`**, **`sync`**, **`missing`**, **`quality`**, **`review`**, and **`cleanup`** expose core `runXxx` entries; CLI-specific prompts and rendering remain host-owned.
- **Translator providers** are not a stable public API yet; extend via CLI or future explicit exports.
- **Logger / UI** — not part of **`core`**; keep scripts machine-readable.

---

## Versioning

Follow **semver** for the package. Treat **`core`** and **`config`** as **stable** once documented; breaking changes require a **major** bump. The CLI UX and default flags may evolve with minors/patches as long as **`core`** contracts stay compatible.

---

## See also

- [Config](../config/README.md) — file formats and merge order
- [CLI overview](../cli/README.md) — global flags that influence `resolveContext` when using the CLI
- [Architecture](../architecture/README.md)
