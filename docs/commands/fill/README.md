# `fill`

Re-translates string leaves that still **match the source** (stale English-identical strings).

```bash
i18nprune fill --target ja
i18nprune fill --target ja,pt-br
i18nprune fill --target all
i18nprune fill --all
i18nprune fill --target ja --dry-run
i18nprune fill --target ja,pt-br --ask
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
- **`--no-meta`** — Do not write **`<lang>.meta.json`**. By default **`fill`** creates or updates the sidecar with **English/native** from the bundled catalog and preserves existing **`direction: "rtl"`** when already set (otherwise **`ltr`**).
- **Global `--json`** — Emits one primary **`CliJsonEnvelope`** on stdout (same contract as other JSON commands). Use **`--target`** or **`--all`** when non-interactive; see [JSON output](../../json/README.md) and **`runFill`** in **`@zamdevio/i18nprune/core`**.

## Progress and translation

- Uses the same **`createSessionProgress`** pipeline as **`generate`** (rich stderr progress when **`canPrintProgress`** allows; stdin restored after the run). Policy: [Translation progress](../../progress/README.md).
- Translation uses **`translateLeaf`** (shared with **`generate`**). See [Translator & progress](../../translator/README.md).

### Identity streak (same as `generate`)

Repeated **unchanged** translations trigger the same **warning / abort** guard as **`generate`**. **Human** mode can confirm; **global `--yes`** continues without prompts in non-interactive runs. **`--json`**: abort yields **`ok: false`** and **`issues[]`** (`i18nprune.translate.identity_streak_*`). See [issue codes](../../json/issue-codes.md).

### JSON payload

**`fill --json`** emits **`kind`: `fill`** with **`targetResults[]`**: each row includes **`updated`**, **`paths`**, **`status`**, and **`progress`** (**`TargetProgressSummary`**) for that locale. Top-level **`updated`** is the sum of leaves updated across targets.

## See also

- [Translation progress](../../progress/README.md)
- [Command behaviors](../../behavior/commands.md)
- [Policies](../../config/policies/README.md) — `policies.parity`
