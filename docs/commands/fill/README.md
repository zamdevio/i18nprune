# `fill`

**Full examples:** [fill examples](../../examples/commands/fill/README.md)

Re-translates string leaves that still **match the source locale** (stale source-identical copies).

```bash
i18nprune fill --target ja
i18nprune fill --target ja,pt-br
i18nprune fill --target all
i18nprune fill --all
i18nprune fill --target ja --dry-run
i18nprune fill --target ja,pt-br --ask
i18nprune fill --target ja --metadata
i18nprune fill --target all --no-locale-meta
```

## `--target`: one code, list, or `all`

- **Single code** — Same as before (e.g. **`ja`**).
- **Comma-separated** — Runs **`fill`** once per locale in order (e.g. **`ja,pt-br`**).
- **`all`** — Every **non-source** **`*.json`** under **`localesDir`** (excluding **`*.meta.json`**).
- **Interactive (TTY):** If **`--target`** / **`--lang`** is omitted, a **menu** offers **All target locales (N)** or each code (not the free-text **`promptLanguageCodeOnly`** flow).

## Inputs and non-interactive rules

- **`--target` / `--lang` / `--all`** — One of them is required when non-interactive (no TTY, `CI`, `I18NPRUNE_NO_INIT`, or **`--json`**). With a TTY and no flag, the CLI prompts via the menu above. Each resolved code must be a **catalog** code (same list as **`generate`**). The **source locale** basename is **not** allowed (same rule as **`generate`**). Unknown codes exit with a **usage**-class error (non-zero).
- **`--dry-run`** — Counts matching leaves and skips API calls and file writes. **`logger.info`** lines state that nothing was written and mirror **`generate`** (`would write` paths, optional meta line, subtitle).
- **`--ask`** — Interactive TTY: confirm the resolved target locale list before processing. Ignored without TTY; global **`--yes`** overrides prompts.
- **`--metadata`** — Persist structured leaves from **`translateLeaf`** (`value`, `status`, `confidence`, `needsReview`, `needsTranslationAgain`, `source`). Without this flag (or config opt-in), plain string leaves remain default; core still computes metadata in memory.
- **`--no-locale-meta`** — Do not write **`<lang>.meta.json`** (merged with root **`noLocaleMeta`** in config; either **`true`** skips). See [Locale sidecar](#locale-sidecar-langmetajson) below.
- **Global `--json`** — Emits one primary **`CliJsonEnvelope`** on stdout (same contract as other JSON commands). Use **`--target`** or **`--all`** when non-interactive; see [JSON output](../../json/README.md) and **`runFill`** in **`i18nprune/core`**.

## Locale sidecar (`<lang>.meta.json`)

By default, **`fill`** writes **`<lang>.meta.json`** next to **`<lang>.json`** with:

- **`lang`** — target code  
- **`englishName`** — English label  
- **`nativeName`** — native endonym  
- **`direction`** — **`ltr`** or **`rtl`**

This file is the **locale catalog sidecar** (labels and direction for tooling). It is **not** the same as **`--metadata`**, which opts in to structured **per-leaf** objects inside **`<lang>.json`** for review and quality commands.

**Skipping the sidecar:** pass **`--no-locale-meta`** or set root **`noLocaleMeta: true`** in config. If **either** is true, **`fill`** does not create or update **`<lang>.meta.json`** (CLI flag and config use **OR** semantics). Existing **`.meta.json`** files on disk are still read when inferring **`direction: rtl`**, but they are not rewritten when skipped. To change labels or direction when you **do** write sidecars, use **`i18nprune locales edit`**.

## Progress and translation

- Uses the same **`createSessionProgress`** pipeline as **`generate`** (rich stderr progress when **`canPrintProgress`** allows; stdin restored after the run). Policy: [Translation progress](../../progress/README.md).
- Translation uses **`translateLeaf`** (shared with **`generate`**). See [Translator & progress](../../translator/README.md).

### `--workers` and bar semantics

Same model as **`generate`**: **`--workers 1`** gives **strict** in-order bar advance; **`--workers` > 1** uses **translate-job** counts on the bar during the pool, **honest avg/ETA** for those jobs, and a **multi-key** in-flight list (see **`generate`** § `--workers`). Precedence and env: [Translation config](../../config/translate.md) § Parallel translation.

### Identity streak (same as `generate`)

Repeated **unchanged** translations trigger the same **warning / abort** guard as **`generate`**. **Human** mode can confirm; **global `--yes`** continues without prompts in non-interactive runs. **`--json`**: abort yields **`ok: false`** and **`issues[]`** (`i18nprune.translate.identity_streak_*`). See [issue codes](../../issues/README.md).

Interactive confirms use **`pauseClock`** / **`resumeClock`** on the rich progress timer (see **`generate`** progress section). With **`--workers` > 1**, identity checks run after the pool drains for that batch.

### JSON payload

**`fill --json`** emits **`kind`: `fill`** with **`targetResults[]`**: each row includes **`updated`**, **`paths`**, **`status`**, **`progress`** (**`TargetProgressSummary`**), and optional **`localeMetadata`** report data when metadata normalization runs (including full per-leaf decisions in `leafDecisions[]`). Top-level **`updated`** is the sum of leaves updated across targets.

When the host streams **`run.*`** events, per-leaf translate progress is published as **`run.progress.fill`** with **`phase: 'translate'`** on the same throttled cadence as **`generate`** (first, last, and every 50th tick) so large locales do not flood the stream.

### Rate-limit / network failures

`fill` surfaces the same shared translation failure issues as `generate`:

- **`i18nprune.generate.translate_rate_limited`**
- **`i18nprune.generate.translate_network_error`**

For MyMemory quota limits, the CLI parses and prints the reported **`NEXT AVAILABLE IN ...`** wait window when provided by the backend.

## See also

- [Translation progress](../../progress/README.md)
- [Command behaviors](../../behavior/commands.md)
- [Policies](../../config/policies/README.md) — `policies.parity`
- [Locales metadata mode](../../locales/metadata/README.md)
- [jq cookbook](../../examples/jq-cookbook/README.md)
