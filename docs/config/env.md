# Environment variables

Runtime behavior is controlled partly by **environment variables**. Canonical names live in **`packages/cli/src/constants/env.ts`** — update that file (one place) when adding or renaming vars; docs and snapshots should follow.

## `I18NPRUNE_*` — config overlay

Merged **after** defaults and the config **file**, **before** discovery and CLI flags (see [Configuration README](./README.md#merge-order)). Values are also listed in the **`i18nprune config --json`** output under the env snapshot (these keys only).

| Variable | Effect |
|----------|--------|
| **`I18NPRUNE_SOURCE`** | Override **`config.locales.source`** (path to source locale JSON). |
| **`I18NPRUNE_LOCALES_DIR`** | Override **`config.locales.directory`**. |
| **`I18NPRUNE_SRC`** | Override **`config.src`** (scan root). |
| **`I18NPRUNE_FUNCTIONS`** | Comma-separated list overriding **`config.functions`**. |
| **`I18NPRUNE_NO_DISCOVERY`** | When truthy (`1`, `true`, `yes`), skip discovery layer where applicable. |
| **`I18NPRUNE_NO_INIT`** | When truthy, treated like non-interactive init paths; also skips interactive prompts together with **`CI`** and non-TTY stdin (see [JSON & long runs](../behavior/json-long.md)). |
| **`I18NPRUNE_NO_UPDATE_CHECK`** | When truthy (`1`, `true`, `yes`), skip **all** npm registry update discovery: no background refresh, no banner hint, no **`version --check`** fetch. **`CI=true`** also skips (see [Versioning](../versioning/README.md)). |

## `I18NPRUNE_GENERATE_*` — generate command defaults

Read when running **`i18nprune generate`**; merged into options before CLI flags (see `packages/cli/src/commands/generate/env.ts`).

| Variable | Effect |
|----------|--------|
| **`I18NPRUNE_GENERATE_LANG`** | Default target language code. |
| **`I18NPRUNE_GENERATE_ENGLISH_NAME`** | Default English label for `.meta.json`. |
| **`I18NPRUNE_GENERATE_NATIVE_NAME`** | Default native endonym. |
| **`I18NPRUNE_GENERATE_DIRECTION`** | `ltr` or `rtl` only. |
| **`I18NPRUNE_GENERATE_FORCE`** | Truthy → force re-translate. |
| **`I18NPRUNE_GENERATE_DRY_RUN`** | Truthy → dry-run. |

## Translation backends (`generate`)

Full rules (**`translate.primary`**, **`translate.providers`** rows, credentials, precedence) are in **[Translation config](./translate.md)**.

Which backend runs (**precedence**): **`--provider`** → **`I18NPRUNE_TRANSLATE_PROVIDER`** → **`translate.primary`** → core default.

For **secrets and endpoints**, each env var listed below — when set — **supersedes** the matching field on the active **`translate.providers`** row (**`id`** must match — see **[translate](./translate.md)**):

| Variable | When used |
|----------|-----------|
| **`I18NPRUNE_TRANSLATE_PROVIDER`** | Backend id when flag omitted (`google`, `deepl`, `llm`, …). Case-insensitive. |
| **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** | Positive integer: default cap on parallel **`translateLeaf`** calls for **`generate`** (including **`generate --resume`**) when **`--workers`** is omitted. Lower precedence than **`--workers`**; higher than **`translate.workers`** in the file. |
| **`I18NPRUNE_TRANSLATE_DEEPL_API_KEY`** | Supersedes **`apiKey`** for **`deepl`**. |
| **`I18NPRUNE_TRANSLATE_LIBRE_URL`** | Supersedes **`baseUrl`** for **`libre`**. |
| **`I18NPRUNE_TRANSLATE_LLM_API_KEY`** | Supersedes **`apiKey`** for **`llm`**. |
| **`I18NPRUNE_TRANSLATE_LLM_BASE_URL`** | Supersedes **`baseUrl`** for **`llm`**. |
| **`I18NPRUNE_TRANSLATE_LLM_MODEL`** | Supersedes **`model`** for **`llm`**. |

These **`I18NPRUNE_TRANSLATE_*`** vars (especially keys) are intentionally **not** listed in **`i18nprune config --json`** `env` snapshot (avoid accidental leak of secrets in CI logs).

## Other variables

| Variable | Effect |
|----------|--------|
| **`CI`** | When `1` or `true`, contributes to skipping interactive prompts (with **`I18NPRUNE_NO_INIT`** and non-TTY stdin). |

## Source of truth

- **Names:** `packages/cli/src/constants/env.ts`
- **Config namespaces:** [Command namespaces](./commands.md) (**`config.missing`**, …)
