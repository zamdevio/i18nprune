# Auto-patching

Keep lazy locale loader wiring aligned with your locale JSON files and **`src/i18n/config.json`** after **`generate`**, **`sync`**, **`locales edit`**, or **`locales delete`** — without hand-editing the generated module whenever locales change.

## When to use it

Use auto-patching if you adopt the **`loader_generated`** recipe: CLI-owned **`loaders.generated.ts`** plus **`config.json`** under **`src/i18n/`** (typical layout). See [Loader integration](./loader.md) for ownership and [Patching config](./config.md) for every field.

## Enable patching

1. Set **`patching.enabled: true`** in **`i18nprune.config.*`** with **`recipe`**, **`loaderPath`**, and **`configPath`** filled in, **or**
2. Pass the **global** **`--patch`** flag on a mutation command for that run only (it overrides **`patching.enabled: false`** for that process).

**Flag placement:** **`--patch`** is a **global** option — it goes **before** the subcommand:

```bash
i18nprune --patch sync --yes --target fr
i18nprune --patch generate --yes --target fr
```

Not: ~~`i18nprune sync --patch`~~ (unsupported).

## Operator workflow

1. Run locale-changing commands with **`--patch`** when you want loader files updated in the same run, **or** omit **`--patch`** and run **`i18nprune patch`** afterward to inspect state.
2. If **`patch`** shows fixable metadata or config/file drift, run **`i18nprune patch --fix`** (add **`--yes`** in CI so writes are allowed).
3. If **`config.json`** / **`loaders.generated.ts`** are missing or corrupt, run **`i18nprune patch --init`**. To **replace** only those two CLI-owned files and reset the **`patching`** block in config, use **`i18nprune patch --init --force`** (destructive — read the CLI warnings first).

## `patch` subcommand

| Command | What it does |
|--------|----------------|
| **`i18nprune patch`** | Analyze patching health and print diagnostics. |
| **`i18nprune patch --fix`** | Apply supported auto-fixes (metadata, drift, safe regeneration). |
| **`i18nprune patch --init`** | Create missing scaffold files under **`<src>/i18n/`** and may inject a **`patching`** block into **`i18nprune.config.*`**. |
| **`i18nprune patch --init --force`** | Renew **only** **`config.json`** and **`loaders.generated.ts`** and reset **`patching`** defaults in config; see [loader.md § patch --init](./loader.md#patch-init-and-force). |

In non-interactive runs, pair **`--fix`** / **`--init`** with the global **`--yes`** flag when the CLI would otherwise require confirmation.

## Principles

- **Opt-in:** no loader or config mutation unless **`patching.enabled`** or **`--patch`** applies.
- **Recipe-driven:** **`loader_generated`** is the supported recipe today.
- **Deterministic and bounded:** edits stay within configured paths and size limits ([config reference](./config.md)).
- **Safe failure model:** default **`patching.mode: 'warn_skip'`** reports and skips; **`strict`** allows the hosting command to fail when patching preconditions are not met.

## Runtime behavior

- **`patching` missing or `enabled: false`:** patching is skipped unless **`--patch`** is set (per-command behavior is documented on each command).
- **Enabled with valid paths:** a plan is built and applicable writes are applied.
- **Invalid paths, parse/schema errors, oversized files, unsupported patterns:** behavior depends on **`patching.mode`** — see [Failure and mode behavior](./config.md#failure-and-mode-behavior).

## Output and automation

- **`--json`:** emits stable JSON envelopes on stdout where the command supports it. Human **`[i18nprune] [info]`** lines — including short “patching (sync)” / “patching (generate)” summaries after **`--patch`** mutations — are **hidden** under **`--json`**. Use envelope **`issues[]`**, payload fields, and exit codes for CI; omit **`--json`** when you need those log lines for debugging.
- **`--quiet` / `--silent`:** further reduce human output; with **`--json`**, machine output stays the contract. See [CLI verbosity](../cli/verbosity/README.md).

## Documentation map

- [Loader contract and generated-module behavior](./loader.md)
- [Patching config reference and policy](./config.md)
- [Patching-related issue codes](../issues/patching.md)
- [ADR 004 — Opt-in auto-patching](../architecture/decisions/004-auto-patch.md)
- [ADR 003 — User-project i18n loader integration](../architecture/decisions/003-user-i18n-loader-integration.md)

## Troubleshooting

- **`generate` / `sync` / `locales` says patching was skipped** — Patching is opt-in: set **`patching.enabled: true`** or pass **`--patch`** **before** the subcommand. If **`patching`** exists but **`configPath`** or **`loaderPath`** is empty, the CLI warns and skips until you fix the block (often via **`patch --init`**).
- **`patch --init` warns that `i18nprune.config.*` already has a patching block** — Scaffold files may still be created, but an existing **`patching:`** section is not silently overwritten. Edit paths, remove the block and re-run init, or use **`patch --init --force`** for the renewal path (see the warning text).
- **`patch --fix` reports no changes** — Nothing auto-fixable may remain; run **`i18nprune patch`** (no flags) for diagnostics. Under **`patching.mode: 'strict'`**, invalid state can fail the command instead of warn-skip — see [config reference](./config.md#failure-and-mode-behavior).
- **`src/i18n/config.json` is invalid JSON or wrong shape** — **`patch --fix` cannot repair it** until the file parses. Use **`patch --init --force`** to replace **only** **`config.json`** and **`loaders.generated.ts`** from locale **`*.json`** files on disk plus catalog defaults (hand-edited locale row fields are not preserved by that renewal).
- **`generate` / `sync` with `--patch` while `config.json` is broken** — Post-command patching uses the same engine as **`patch`**; it skips until the file is valid or you run **`patch --init --force`**.
