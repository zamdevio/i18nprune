# `i18nprune/core`

The **programmatic heart** of i18nprune — battle-tested primitives used by the CLI itself.

## API tiers (semver intent)

| Tier | Meaning |
|------|---------|
| **Stable** | Documented for integrations; breaking changes ship on a **major** bump. |
| **Advanced** | Supported and typed, but sharper edges (heuristics, ordering, or TTY-only helpers) — read the section notes before upgrading blindly. |

**Stable (initial classification):** `resolveContext`, `clearContextCache`, `scanProjectLiteralKeyUsage`, `computeMissingLiteralKeys`, `computeMissingLiteralKeysFromResolvedKeys`, `resolvedLiteralKeysInProject`, `readJsonFile`, `collectTranslationSurfaceLeaves`, `translationSurfacePathValueMap`, `scanSources`, `isPreservePath`, `buildKeyReferenceContext`, `resolveReferenceConfig`, `scanProjectDynamicKeySites`, CLI JSON output types (`ValidateJsonOutput`, `CleanupJsonOutput`, `MissingJsonOutput`, `SyncJsonOutput`), `Context`, `ResolvedPaths`, `ProjectLiteralKeyUsage`. For **`I18nPruneConfig`** / **`defineConfig`** authoring, use **`i18nprune/core/config`**.

**Advanced:** lower-level observation pipeline (`scanProjectKeyObservations`, `literalKeyUsageFromObservations`, `resolvedKeysFromObservations`, `scanKeyObservations`, `exactLiteralKeys`), per-file dynamic analysis helpers (`findDynamicKeySites`, `analyzeDynamicKeysFromSourceText`), template rebuild utilities (`tryRebuildTemplateKeyFromConsts`, `tryResolveTemplatePrefixBeforeUnknown`), and interactive helpers (`canAsk`, `promptApprovedRemovalKeys`, `groupKeysByTopSegment`) — use only when you need the same hooks as the CLI.

For **`i18nprune.config.*`**, import **`defineConfig`** and **`I18nPruneConfig`** from **`i18nprune/core/config`** (typed merge + **`satisfies Partial<I18nPruneConfig>`**). **`i18nprune/core`**’s **`defineConfig`** is a generic identity helper for non-CLI embeds; it does not merge CLI defaults.

## Flat vs namespaced imports (both supported)

We **fully support** both styles **for the same symbols**:

- **Flat** — `import { resolveContext, scanProjectLiteralKeyUsage } from 'i18nprune/core'`  
  Fine for small scripts, snippets, and existing code. **Not deprecated.**

- **Namespaced** — `import { context, extractor } from 'i18nprune/core'`  
  **Recommended for new integrations and larger tools:** clearer grouping, easier discovery in the IDE, and a stable mental model that mirrors `core/` domains.

**Recommendation:** prefer **namespaces** for new code; keep **flat** where it already works or reads shorter. There is **no** plan to remove flat exports before an explicit **major** version with a migration story. For CLI machine-readable output, see [JSON output (`--json`)](../json/README.md).

### Namespaced imports

```ts
import { context, extractor, validate, files } from 'i18nprune/core';

const ctx = context.resolveContext();
const usage = extractor.scanProjectLiteralKeyUsage(ctx);
const raw = files.readJsonFile(ctx.paths.sourceLocale);
const missing = validate.computeMissingLiteralKeys(ctx, raw);
```

Namespaces: **`context`**, **`extractor`**, **`dynamic`**, **`json`**, **`ask`**, **`preserve`**, **`reference`**, **`validate`**, **`scanner`**, **`files`**, **`result`** (envelope helpers + `RESULT_API_VERSION`).

Structured CLI JSON: global **`--json`** — see **[JSON output (`--json`)](../json/README.md)**.

## When to use

Use this when building:
- Custom CI scripts
- Pre-commit hooks
- Bulk migration tools
- IDE extensions
- Internal devops tooling

## Core Functions

### Context

```ts
import { resolveContext, clearContextCache } from 'i18nprune/core';

const ctx = resolveContext();           // uses process.cwd()
const ctx2 = resolveContext('/path/to/project');

clearContextCache(); // for tests or long-running processes
```

### Headless envelopes (no `process.exit`)

**`tryResolveContext`** returns a **`Result`** (no throw). Older CLI-hosted helpers (**`runValidate`**, **`runConfig`**, **`runCleanupCheck`**, **`runDoctor`**, **`runLanguages`**, **`runReport`**) return the same **`CliJsonEnvelope`** the CLI uses for global **`--json`** (including **`issues[]`**). Migrated core ops such as **`runGenerate`**, **`runSync`**, **`runMissing`**, **`runQuality`**, and **`runReview`** return `{ payload, issues }`; the CLI owns envelope wrapping. **`stringifyEnvelope`** serializes envelopes like stdout.

```ts
import {
  tryResolveContext,
  runValidate,
  runConfig,
  stringifyEnvelope,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
} from 'i18nprune/core';

const res = tryResolveContext('/path/to/project');
if (!res.ok) {
  console.error(res.issues);
} else {
  const v = runValidate(res.data);
  console.log(v.ok, v.issues, v.data.missing);
  console.log(stringifyEnvelope(runConfig(res.data), true));
}
```

**`generate`** / **`report`:** see [JSON: programmatic](../json/programmatic.md) — both have **`run*`** helpers; **`report`** still uses **`--format`** for the on-disk artifact.

**`buildConfigSnapshot`** (and thus **`config --json`** / **`runConfig`**) sets **`cliVersion`** from **`CLI_VERSION`** in `packages/cli/src/constants/cli.ts` (kept in sync with `packages/cli/package.json`).

**`run*`** vs **`commands/<name>/run.ts`:** the command file owns **argv, `resolveContext`, human tables, logger, report file, exit code**. **`run*`** in `core/*/jsonEnvelope.ts` builds the **same domain outcome** the JSON branch needs: gather data, attach **`issues[]`**, wrap **`buildCliJsonEnvelope`**. The human branch often **recomputes** similar work (e.g. **`quality`**) because presentation (tables, colors, truncation) is separate; refactoring to one shared “compute then render” core is possible but not required for correctness.

See [JSON: programmatic](../json/programmatic.md) and [issue codes](../issues/README.md).

### Key Extraction & Scanning

```ts
import { scanProjectLiteralKeyUsage, scanProjectDynamicKeySites } from 'i18nprune/core';

const usage = scanProjectLiteralKeyUsage(ctx);
const literalKeys = usage.resolvedKeys;

const dynamicSites = scanProjectDynamicKeySites(ctx);
```

### Missing literal keys (same as `validate`)

Uses **per-file** template + const resolution (same as keySites), not a single merged-source const map.

Typed CLI JSON payloads (import from `i18nprune/core`): **`ValidateJsonOutput`**, **`CleanupJsonOutput`**, **`MissingJsonOutput`** — for **`validate`**, **`cleanup --json`**, and **`missing --json`** respectively.

```ts
import {
  computeMissingLiteralKeys,
  resolvedLiteralKeysInProject,
  readJsonFile,
  resolveContext,
} from 'i18nprune/core';

const ctx = resolveContext();
const raw = readJsonFile(ctx.paths.sourceLocale);
const missing = computeMissingLiteralKeys(ctx, raw); // dotted paths in code but not in that JSON
const allLiterals = resolvedLiteralKeysInProject(ctx); // Set of resolved keys across src
```

To scan the project **once** (e.g. validate-style pipelines), reuse the same observations for missing keys and usage:

```ts
import {
  computeMissingLiteralKeysFromResolvedKeys,
  literalKeyUsageFromObservations,
  readJsonFile,
  resolveContext,
  scanProjectKeyObservations,
} from 'i18nprune/core';

const ctx = resolveContext();
const observations = scanProjectKeyObservations(ctx);
const usage = literalKeyUsageFromObservations(observations);
const raw = readJsonFile(ctx.paths.sourceLocale);
const missing = computeMissingLiteralKeysFromResolvedKeys(raw, usage.resolvedKeys);
```

### Template rebuild and partial prefix

```ts
import {
  tryRebuildTemplateKeyFromConsts,
  tryResolveTemplatePrefixBeforeUnknown,
} from 'i18nprune/core';

tryRebuildTemplateKeyFromConsts('a.${NS}.b', { NS: 'section' }); // => 'a.section.b' or null
tryResolveTemplatePrefixBeforeUnknown('a.b.${id}.x', {}); // => 'a.b' when id is unknown
```

**`scanProjectDynamicKeySites`** uses the same rules: fully rebuilt templates are omitted from dynamic results; otherwise **`resolvedPrefix`** may be set. See **`docs/architecture/decisions/005-dynamic-key-rebuild-and-prefix.md`**.

### Interactive cleanup helpers (`--ask`)

```ts
import {
  canAsk,
  promptApprovedRemovalKeys,
  groupKeysByTopSegment,
} from 'i18nprune/core';
import type { PromptRemovalKeysMode } from 'i18nprune/core';

// Same primitives the `cleanup --ask` command uses; call only when canAsk() is true.
```

### JSON Utilities

```ts
import { collectTranslationSurfaceLeaves, readJsonFile } from 'i18nprune/core';

const sourceData = readJsonFile(ctx.paths.sourceLocale);
const allLeaves = collectTranslationSurfaceLeaves(sourceData);
```

## Safety & Design

- Same resolution logic as the CLI (no drift)
- Pure functions where possible
- No side effects except `readJsonFile`
- Full TypeScript support

## Heuristic extraction limits

Literal keys, key-site observations, and dynamic sites use **pattern matching** and **per-file const maps**, not a full TS program analysis. Indirect calls (e.g. `const fn = t`) and cross-file constants may not match CLI expectations.

Read **[Detection limits](../regex/README.md#detection-limits)** in `docs/regex/` for an honest scope statement, then [extraction](../regex/extraction.md) and [key-sites-and-dynamic](../regex/key-sites-and-dynamic.md) for details.

## See also

- [Main exports](../README.md)
- [Configuration](./config.md)
- [Usage Examples](./examples.md)
- [Regex & heuristics index](../regex/README.md)
