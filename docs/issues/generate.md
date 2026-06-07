---
description: Generate issue codes — usage hints, empty source leaves, rate limits, and network errors.
---

# Generate — issue codes (`i18nprune.generate.*`)

[← Issue codes index](./README.md)

## `usage`

**Code:** `i18nprune.generate.usage`  
**Severity:** `error`  
**When:** **`i18nprune generate`** exits with **`USAGE`** (invalid flags, missing **`--target`** in non-interactive mode, or other command-level validation) and the error has no more specific **`issueCode`** (e.g. not already **`i18nprune.translate.*`**).  
**Who:** **`runGenerate`**, **`executeGenerate`** (`packages/cli`).  
**What to do:** Read **`message`** / **`issues[]`**; fix flags or config. Translation **`USAGE`** (unknown provider, missing credentials / base URL, provider not implemented) → **`i18nprune.translate.*`** — **[Translate issues](./translate.md)**.

## `source_empty_string_leaves`

**Code:** `i18nprune.generate.source_empty_string_leaves`  
**Severity:** `warning`  
**When:** **`i18nprune generate`** found one or more **string leaf values** in the source locale JSON that are empty or whitespace-only (`""`, `" "`, `\n`, …). Those values are copied into the target as-is (**no translator call**); leaves are flagged **`needsReview`** when structured metadata is enabled. Empty sources do **not** count toward the consecutive **source-identical** (identity streak) guard.  
**Who:** **`translateAndNormalizeGenerateLocale`** / **`executeGenerate`**.  
**What to do:** Remove or fix empty string entries **in the source locale file only**. Then align other locales to the surviving keys using **`i18nprune sync`**. If your project uses structured locale leaves (metadata on each string), add **`--metadata`** to **`sync`** so sidecars and leaf shapes stay consistent.

## `translate_rate_limited`

**Code:** `i18nprune.generate.translate_rate_limited`  
**Severity:** `error`  
**When:** The translation backend returns **HTTP 429** (*Too Many Requests*) during **`generate`** (including **`generate --resume`**; often when `--workers` is high or the provider quota is low). i18nprune retries a few times and then stops the run.  
**Who:** **`translateLeaf`** (`@i18nprune/core`), surfaced by **`runGenerate`**.  
**What to do:** Reduce concurrency (lower **`--workers`**), wait and retry, or switch providers. For MyMemory specifically, quotas are low; consider another provider for bulk runs.

## `translate_network_error`

**Code:** `i18nprune.generate.translate_network_error`  
**Severity:** `error`  
**When:** The translation backend request fails due to network conditions (DNS failure, timeouts, connection reset/refused, proxy issues). i18nprune retries a few times and then stops the run.  
**Who:** **`translateLeaf`** (`@i18nprune/core`), surfaced by **`runGenerate`**.  
**What to do:** Check your network connectivity, DNS, VPN/proxy settings, and provider availability; then re-run. If it only fails at high `--workers`, lower concurrency.
