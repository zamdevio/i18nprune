# `sync`

Merges and prunes locale JSON files to match the **source** shape (honours **`policies.preserve`**). If the scan finds **non-literal** translation keys, a **warning** is printed (same heuristics as **`validate`** — dynamic keys are not enumerated).

```bash
i18nprune sync
i18nprune sync --dry-run
i18nprune sync --target all
i18nprune sync --target ja,pt-br
```

## `--target` (default: all non-source locales)

- **Omit** **`--target`** — Syncs **every** locale JSON under **`localesDir`** except the **source** file (same as **`all`**).
- **`--target all`** — Explicit “all targets” (same as omit).
- **`--target ja,pt-br`** — Only those basenames (comma-separated, normalized like **`pt-br`**).

The **source locale** file (basename of the configured `source` path) is **never** modified — **`sync`** only updates **other** `*.json` files under **`localesDir`**. Target codes must not be the source locale.

**`--dry-run`** prints **`would write …`** detail lines and an **`[info]`** line that no files were written.

## Planned: `sync meta` subcommand

**Not implemented yet** — see [Roadmap](../../roadmap/README.md) (“Planned: `sync meta` subcommand”).

**Goal:** A **`sync`** subcommand (same CLI pattern as **`locales list` / `locales edit`**) that:

- **Generates** missing **`<lang>.meta.json`** files for **all** existing locale JSON files under **`localesDir`** (using the bundled language catalog + normalization).
- **Re-syncs** existing **`.meta.json`** files so labels and direction stay aligned with the catalog when codes or catalog data change.

**Help & docs:** **`i18nprune help sync`**, **`i18nprune help sync meta`**, and **`sync meta --help`** should match the styled help behaviour used for **`locales`** (banner titles, docs links). A dedicated doc page (e.g. **`docs/commands/sync/meta/README.md`**) will be added when the subcommand ships.
