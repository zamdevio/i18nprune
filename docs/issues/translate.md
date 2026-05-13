# Translate — issue codes & troubleshooting

[← Issue codes index](./README.md)

Product reference for **`generate`** translation: **[Translation config](../config/translate.md)** and **[Environment variables](../config/env.md)** (translation backends section).

Each section below follows the **[topic page pattern](./README.md#authoring-topic-pages-for-contributors)** (`Code`, `Severity`, `When`, …).

---

## `identity_streak_warning`

**Code:** `i18nprune.translate.identity_streak_warning`  
**Severity:** `warning`  
**When:** **`generate`** sees many consecutive string leaves whose post-translation value still **equals** the source (identity streak approaching the abort threshold).  
**Who:** **`translateLeaf`** / **`createIdentityStreakGuard`** (`@i18nprune/core`); invoked from **`runGenerate`**.  
**What to do:** Check API keys, provider, source/target language codes, and network; confirm you are not repeatedly “translating” into the source language by mistake.

---

## `identity_streak_abort`

**Code:** `i18nprune.translate.identity_streak_abort`  
**Severity:** `error`  
**When:** The identity streak guard **stops the run** to avoid burning quota on a broken configuration. In **`--json`** mode this typically yields **`ok: false`** on the primary envelope.  
**Who:** **`runGenerate`**, **`translateLeaf`**, **`createIdentityStreakGuard`**. **`--yes`** in human/non-JSON flows may allow continuing without a prompt where implemented.  
**What to do:** Same as **[`identity_streak_warning`](#identity-streak-warning)** — fix configuration; re-run with **`--yes`** only after you understand why translations were identical.

---

## `unknown_translation_provider`

**Code:** `i18nprune.translate.unknown_translation_provider`  
**Severity:** `error`  
**When:** CLI exits with **`USAGE`** (e.g. `Unknown translation provider "…"` or unknown **`--provider`**), usually from a **typo**, an **unsupported id**, or a **stale `I18NPRUNE_TRANSLATE_PROVIDER`** value.  
**Who:** **`parseProviderLabel`** / **`resolveTranslationProviderOptions`** (`packages/cli`); **`validateResolvedTranslationOptions`** (`@i18nprune/core`).  
**What to do:**

1. Run **`i18nprune generate --help`** and use a supported **`--provider`** id, or see **`listTranslationProviders()`** in **`@i18nprune/core`** / doctor output.
2. Fix **`translate.primary`** and matching **`translate.providers`** rows (unknown **`id`** rejected at load; **`primary`** must match an enabled row).
3. Unset or correct **`I18NPRUNE_TRANSLATE_PROVIDER`** if it overrides your file unintentionally (**precedence**: flag → env → config → default — see **[translate config](../config/translate.md)**).

---

## `provider_not_implemented_yet`

**Code:** `i18nprune.translate.provider_not_implemented_yet`  
**Severity:** `error`  
**When:** **`USAGE`** like *Translation provider "…" is not implemented yet* — a **new** provider id was added to the typed registry before its **`Translator`** shipped (today all registered ids are implemented; this code remains for forward compatibility).  
**Who:** **`resolveTranslator`** (`packages/core` / **`registry.ts`**).  
**What to do:** Run **`i18nprune providers`** for supported ids; upgrade **`@i18nprune/core`** / CLI.

---

## `missing_credentials`

**Code:** `i18nprune.translate.missing_credentials`  
**Severity:** `error`  
**When:** **`generate`** aborts before the first outbound translation call: a backend that **requires secrets or a base URL** is selected, but **`assertTranslationProviderCredentialsReady`** (and **`resolveTranslator`**) still see missing **`apiKey`** / **`baseUrl`** / **`model`** after env merge.  
**Who:** **`assertTranslationProviderCredentialsReady`**, **`executeGenerate`** / **`executeFill`** (`packages/cli`).  
**What to do:**

1. **DeepL:** set **`apiKey`** on the **`deepl`** **`translate.providers`** row, or export **`I18NPRUNE_TRANSLATE_DEEPL_API_KEY`** (env wins over file when both are set — see **[env.md](../config/env.md)**).
2. **LibreTranslate:** set **`baseUrl`** on the **`libre`** row (instance origin, no trailing slash) or **`I18NPRUNE_TRANSLATE_LIBRE_URL`**.
3. **LLM:** set **`apiKey`**, **`baseUrl`**, and **`model`** on the **`llm`** row, or **`I18NPRUNE_TRANSLATE_LLM_*`** env vars.
4. Confirm the effective backend: **`--provider`** and **`I18NPRUNE_TRANSLATE_PROVIDER`** override **`translate.primary`** — credentials from the file apply **only** when the resolved **`id`** matches that row (**`enabled: false`** rows are skipped).

---

## `env_overrides_config_unexpectedly`

**Code:** `n/a` — not emitted as `issues[]`; narrative anchor for **[env.md](../config/env.md)** behavior.  
**Severity:** `info` (troubleshooting only).  
**When:** Translation-related values in **`i18nprune.config.*`** never seem to apply, because for each credential field a **non-empty** matching **`I18NPRUNE_TRANSLATE_*`** env var **supersedes** the same field on the active **`translate.providers`** row.  
**Who:** **`resolveTranslationProviderOptions`** (`packages/cli`).  
**What to do:** Print env in CI / shell (**`printenv | grep I18NPRUNE_TRANSLATE`**) and unset vars you do not intend, or rely on env-only secrets in CI and omit them from the committed config.

---

## `translate_block_ignored_wrong_id`

**Code:** `n/a` — not emitted as `issues[]`; troubleshooting anchor.  
**Severity:** `info`  
**When:** You set **`apiKey`** (or other fields) on a **`translate.providers`** row, but the run still behaves like another backend — **`translate.providers`** merges **only** the row whose **`id`** matches the **resolved** backend (flag → env → **`primary`**). Example: **`I18NPRUNE_TRANSLATE_PROVIDER=google`** ignores **`deepl`** row fields.  
**Who:** **`resolveTranslationProviderOptions`**.  
**What to do:** Align **`id`**, **`--provider`**, and **`I18NPRUNE_TRANSLATE_PROVIDER`**, or remove the env override so the file’s **`id`** wins.

---

## `config_file_rejected_at_load`

**Code:** See **`i18nprune.config.*`** on **[Config issues](./config.md)** (usually **`invalid`** for bad **`translate.*`** shape).  
**Severity:** `error`  
**When:** **`Invalid i18nprune config`** on startup — each **`translate.providers`** element must match the strict discriminated union (no stray keys on **`google`**, etc.); **`translate.primary`** must reference an enabled row; duplicate **`id`** values are rejected.  
**Who:** Config Zod load path (`packages/cli` / **`schema.ts`**).  
**What to do:** Compare your object to **[translate config](../config/translate.md)**; run **`i18nprune init --rich`** for a fresh template.
