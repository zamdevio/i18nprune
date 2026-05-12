# `sync`

**Full examples:** [sync examples](../../examples/commands/sync/README.md)

Merges and prunes locale JSON files to match the **source** shape (honours **`policies.preserve`**). If the scan finds **non-literal** translation keys, a **warning** is printed (same heuristics as **`validate`** — dynamic keys are not enumerated).

**Leaf values:** By default **`sync`** keeps **plain string** leaves aligned with the **source** shape. With **`--metadata`** (or **`localeLeaves.mode: 'structured'`**), a post-pass **normalizes** leaves into the shared structured shape (promote / repair / hydrate — **no translation APIs**); see [Locales metadata mode](../../locales/metadata/README.md). **`sync --strip-metadata`** removes structured terminal fields and returns leaves to plain strings.

```bash
i18nprune sync
i18nprune sync --dry-run
i18nprune sync --metadata
i18nprune sync --strip-metadata
i18nprune sync --target all
i18nprune sync --target ja,pt-br
```

## `--target` (default: all non-source locales)

- **Omit** **`--target`** — Syncs **every** locale JSON under **`localesDir`** except the **source** file (same as **`all`**).
- **`--target all`** — Explicit “all targets” (same as omit).
- **`--target ja,pt-br`** — Only those basenames (comma-separated, normalized like **`pt-br`**).

The **source locale** file (basename of the configured `source` path) is **never** modified — **`sync`** only updates **other** `*.json` files under **`localesDir`**. Target codes must not be the source locale.

**`--dry-run`** prints **`would write …`** detail lines and an **`[info]`** line that no files were written.

## Reset metadata fields (`--strip-metadata`)

Use **`--strip-metadata`** when you want locale files to end with plain string leaves only:

- Converts structured terminal leaves (including **`needsTranslationAgain`**, **`confidence`**, **`needsReview`**, etc.) to plain **`"value"`** strings only — all per-leaf metadata fields are removed.
- Keeps non-leaf object/array structure intact.
- Useful when teams want to remove extra review metadata fields from locale JSON.

You can set a config default:

```ts
// i18nprune.config.ts
export default {
  // ...
  localeLeaves: {
    mode: 'structured',
    sync: { stripMetadata: true },
  },
};
```

CLI flag precedence: **`--strip-metadata`** always enables stripping for that run.  
When omitted, **`localeLeaves.sync.stripMetadata`** (if set) is used.

To write metadata, use **`--metadata`** (or set **`localeLeaves.mode: 'structured'`** in config).  
See [Locales metadata mode](../../locales/metadata/README.md) for shared writer behavior used by `sync` / `generate` (including **`generate --resume`**).

In `sync --json`, metadata details are available per locale file under `data.localeMetadataReports`, including `leafDecisions[]` for full per-leaf simulation/reporting.
For practical filters, see the [jq cookbook](../../examples/jq-cookbook/README.md).

## Planned: `sync meta` subcommand

**Not implemented yet** — see [Roadmap](../../roadmap/README.md) (“Planned: `sync meta` subcommand”).

**Goal:** A **`sync`** subcommand (same CLI pattern as **`locales list` / `locales edit`**) that:

- **Generates** missing **`<lang>.meta.json`** files for **all** existing locale JSON files under **`localesDir`** (using the bundled language catalog + normalization).
- **Re-syncs** existing **`.meta.json`** files so labels and direction stay aligned with the catalog when codes or catalog data change.

**Help & docs:** **`i18nprune help sync`**, **`i18nprune help sync meta`**, and **`sync meta --help`** should match the styled help behaviour used for **`locales`** (banner titles, docs links). A dedicated doc page (e.g. **`docs/commands/sync/meta/README.md`**) will be added when the subcommand ships.
