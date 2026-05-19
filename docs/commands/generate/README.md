# `generate`

**Full examples:** [generate examples](../../examples/commands/generate/README.md)

Generates a **target locale JSON** from the source: nested structure preserved; string leaves translated (Google `gtx` provider).

```bash
i18nprune generate --target ja
i18nprune generate --target ar,id,ja,ms,zh-cn
i18nprune generate --target pt-br --dry-run
i18nprune generate --target ja --metadata
i18nprune generate --target ja --dry-run
i18nprune generate --resume --target ja
i18nprune generate --resume --all --dry-run
```

## Progress and translation

- **Live progress** is written to **stderr** (multi-line bar + key + timing on a TTY when allowed). It is **off** for **`--json`**, **`-q`**, **`-s`**, or non-TTY stderr — see [Translation progress](../../progress/README.md).
- **`--dry-run`** still walks every leaf and updates the progress UI but **does not** call the API or write under **`localesDir`**. When **`--json`** is off and **`--quiet` / `--silent`** are off, **`logger.info`** summarizes what **would** have been written (no **`Wrote …`** success lines).
- String work goes through **`translateLeaf`** (mask → provider → restore → validate; retries). See [Translator & progress](../../translator/README.md).

## `generate --resume` (top-up and partial continuation)

**`--resume`** is for **existing** target locale files: it re-translates **review-eligible** leaves that still **match the source** at the same path. It is **not** a **`translate.{…}` config field** — hosts pass it **per invocation** (CLI **`--resume`**, or **`GenerateRunOptions.resume`** + **`resumeReference`** when calling **`runGenerate`** from the SDK or an editor extension).

Also use **`--resume`** after a **partial** full **`generate`** when the envelope reports **`partial: true`** and **`resumeHint: "generate --resume"`** (see **`translate.policy.onIncompleteRun`** in [Translation config](../../config/translate.md)): finish the remaining strings without discarding work already written.

| Flag | Role |
|------|------|
| **`--resume`** | Top-up / continue mode for this run only. |
| **`--all`** | With **`--resume`**: every non-source **`*.json`** under **`localesDir`**. |
| **`--ask`** | With **`--resume`**, multiple targets, TTY: confirm before processing. |

**Non-interactive:** with **`--json`** or in CI, **`--resume`** requires **`--target …`** or **`--all`** (same catalog and source-exclusion rules as full **`generate`**).

**SDK:** `await runGenerate(ctx, { …targets, dynamicKeySites, resume: true, resumeReference: { uncertainPrefixes } }, hooks)` — build **`uncertainPrefixes`** the same way as for cleanup/sync reference policy (the CLI does this before calling core).

### `--workers` and what the bar means

- **`--workers <n>`** sets the maximum number of concurrent **`translateLeaf`** calls for this run (after config/env defaults — see [Translation config](../../config/translate.md) § Parallel translation).
- **`--workers 1`** (default): the bar’s **`current/total`** moves **in order** through leaves as each step finishes; **wall / avg / ETA** reflect that steady advance.
- **`--workers` > 1**: during the **parallel translate pool**, the bar uses **translate-job** counts (**`completed/total`** jobs in that sliding window), **avg/ETA** reflect throughput, and up to **five in-flight key paths** are listed (worker slots **key¹**…, **`… +N more`** when needed). **Identity / `onTranslated` hooks** consume results in **strict source-leaf order** as soon as each position is ready — you do **not** wait for the entire pool to finish — so up to **`--workers`** translate calls may still run **ahead** of that head while a prompt is open.

### Identity streak (translation guard)

If many consecutive string leaves come back **unchanged** after translation (same as source), the CLI treats that as a likely **misconfiguration or bad provider output** and may **warn** or **abort** after a threshold. In **human** mode you can confirm to continue; with **global `--yes`** (non-interactive) the run **continues without a prompt**. With **`--json`**, a streak that hits the abort threshold yields **`ok: false`** and **`issues[]`** with **`i18nprune.translate.identity_streak_*`** — see [issue codes](../../issues/README.md).

When a confirm dialog is shown (TTY **stderr**): the **last progress frame stays on screen** (**`pauseClock({ clearBar: false })`**) and **Inquirer `confirm`** uses **`stderr`** too, so **`stdout`** (banners, **`console.log`** info) does not splice into the dialog. (**Non-TTY** runs fall back to **`stdout`** for the prompt.) After you answer, **`clearPromptOnDone`** erases the prompt block below the bar and **`resumeClock`** unfreezes timings / redraws from the last tick. Answering **Y/y** continues translation; **N/n** or **Enter** stops the run ( **`info`** explains no locale writes; **`issues[]`** still carries **`i18nprune.translate.identity_streak_abort`**). **Ctrl+C on the prompt** logs a cancel **`info`**, sets **`process.exitCode`** to **130**, and ends the run — no translation write. Streak prompts fire every **8 / 16 / …** consecutive **source-identical** model outputs; **`Recent … (max 5)`** is always a **rolling** window of those samples, not every key.

## Source locale (not a target)

The configured **source** JSON (basename of `source`, e.g. `en`) is the **source of truth**. It is **not** a valid **`--target`** for **`generate`** — use it only as the reference file; pick a **target** catalog code instead.

## Display metadata (catalog)

**`generate`** does not write **`<lang>.meta.json`** sidecars. English label, native endonym, and layout direction for progress lines and host summaries come from the bundled **`languages.json`** catalog (via **`resolveGenerateLocaleDisplay`** in core).

To persist locale display metadata for app loaders, use **`src/i18n/config.json`** and **`i18nprune patch`** — see [Locale filesystem layouts](../../locales/layouts.md).

## Locale leaf metadata mode (`--metadata`)

`--metadata` persists structured locale leaves in `<lang>.json` from **`translateLeaf`** output:

- Writes or repairs `{ value, status, confidence, needsReview, needsTranslationAgain, source }` at translated paths (core always computes metadata; the flag gates disk writes).
- Skips rewriting leaves that are already valid for the active mode.
- Repairs partial/corrupt metadata fields and reports those repairs in JSON payload rows (`targetResults[].localeMetadata`), including full per-leaf decisions (`leafDecisions[]`).

Default remains plain strings unless config opts in. For full model and rollback (`sync --strip-metadata`), see [Locales metadata mode](../../locales/metadata/README.md).
For JSON extraction patterns, see the [jq cookbook](../../examples/jq-cookbook/README.md).

## Interactive vs non-interactive

| Mode | Language (`--target`) |
|------|------------------------|
| **TTY** | Prompts for target when omitted. |
| **Non-interactive** (`--json`, `CI=1`, …) | **`--target`** (or **`--all`** with **`--resume`**) is required. |

With global **`--yes`**, `generate` skips confirm prompts where applicable.

**Non-interactive validation**

- **Missing target selector:** fail fast with a clear usage or configuration error; **exit code non-zero** (typically **1** or **2** for usage-class errors — see [Exit codes & behavior](../../behavior/README.md)).
- **Target code not in the bundled catalog** (unknown or unsupported code after normalization): **fail fast** with an error that names the code and points you at **`i18nprune languages`** and the docs; **exit non-zero**.

See global **`--json`**, **`--quiet`**, **`--silent`**, and [JSON mode & long commands](../../behavior/json-long.md).

### JSON mode (primary envelope)

**`generate --json`** prints one **`CliJsonEnvelope`** on stdout after the run (`kind`: **`generate`**). Payload types live in **`@i18nprune/core`** (`GenerateJsonPayload`, **`packages/core/src/types/generate/generateRun.ts`**); the CLI re-exports them for command-local typing. Payload includes **`targets`**, **`dryRun`**, **`leavesProcessed`**, **`dynamicKeySites`**, and **`targetResults`** (per-target status, paths, preserve/parity counts, optional **`progress`** with **`GenerateTargetProgressSummary`**, and **`resumeUpdatedLeafCount`** on resume rows). It is a **session summary**, not a per-leaf translation log (use **`stdout redirection`** or stderr for operational detail). Identity-streak outcomes surface as **`issues[]`** when applicable.

Headless: **`runGenerate(ctx, opts)`** from **`i18nprune/core`** (async; same writes as the CLI when not **`dryRun`**). Pass **`resume: true`** and **`resumeReference`** in **`opts`** for top-up mode — never via persisted **`translate`** config.

**Multiple `--target` codes (comma-separated):** the CLI still emits **one** stdout **`CliJsonEnvelope`** for the whole run. `data.targets` lists every code; `data.targetResults` has **one row per target** that was processed or skipped (status, paths, preserve/parity counts). It does **not** emit one JSON document per locale — that would break the “single primary document on stdout” rule and complicate CI parsers. The locale bodies live on disk (or in **`stdout redirection`**), not duplicated in full inside stdout JSON.

## Roadmap

Catalog defaults and validation rules for **`generate`** are covered in [Roadmap](../../roadmap/README.md).
