# `fill`

Re-translates string leaves that still **match the source** (stale English-identical strings).

```bash
i18nprune fill --lang ja
i18nprune fill --lang ja,pt-br
i18nprune fill --lang all
i18nprune fill --lang ja --dry-run
```

## `--lang`: one code, list, or `all`

- **Single code** — Same as before (e.g. **`ja`**).
- **Comma-separated** — Runs **`fill`** once per locale in order (e.g. **`ja,pt-br`**).
- **`all`** — Every **non-source** **`*.json`** under **`localesDir`** (excluding **`*.meta.json`**).
- **Interactive (TTY):** If **`--lang`** is omitted, a **menu** offers **All target locales (N)** or each code (not the free-text **`promptLanguageCodeOnly`** flow).

## Inputs and non-interactive rules

- **`--lang`** — **Required** when non-interactive (no TTY, `CI`, `I18NPRUNE_NO_INIT`, or **`--json`**). With a TTY and no flag, the CLI prompts via the menu above. Each resolved code must be a **catalog** code (same list as **`generate`**). The **source locale** basename is **not** allowed (same rule as **`generate`**). Unknown codes exit with a **usage**-class error (non-zero).
- **`--dry-run`** — Counts matching leaves and skips API calls and file writes. **`logger.info`** lines state that nothing was written and mirror **`generate`** (`would write` paths, optional meta line, subtitle).
- **`--no-meta`** — Do not write **`<lang>.meta.json`**. By default **`fill`** creates or updates the sidecar with **English/native** from the bundled catalog and preserves existing **`direction: "rtl"`** when already set (otherwise **`ltr`**).
- **Global flags** — **`--json`** suppresses live progress; **`-q` / `-s`** reduce output. See [JSON & long runs](../../behavior/json-long.md).

## Progress and translation

- Uses the same **`createSessionProgress`** pipeline as **`generate`** (rich stderr progress when **`canPrintProgress`** allows; stdin restored after the run). Policy: [Translation progress](../../progress/README.md).
- Translation uses **`translateLeaf`** (shared with **`generate`**). See [Translator & progress](../../architecture/translator-and-progress.md).

## See also

- [Translation progress](../../progress/README.md)
- [Command behaviors](../../behavior/commands.md)
- [Policies](../../config/policies/README.md) — `policies.parity`
