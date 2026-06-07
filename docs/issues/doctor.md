---
description: Doctor issue codes — Node runtime, ripgrep on PATH, config file presence, and locale path readiness.
---

# Doctor — issue codes (`i18nprune.doctor.*`)

[← Issue codes index](./README.md)

## Doctor codes (overview)

**Severity:** `warning` or `error` depending on finding  
**When:** A **doctor** check (**`runtime`**, **`tools`**, **`config`**, **`paths`**) is not **`ok`**.  
**Who:** **`doctor`**, **`runDoctor`**. The **`code`** in **`issues[]`** uses the same convention as other namespaces: **`i18nprune.doctor.<tail>`** with **underscores** in **`tail`** (e.g. **`i18nprune.validate.missing_literal_keys`**). The published **`docHref`** hash is the VitePress-style slug of that tail (underscores → hyphens).  
**What to do:** Follow the **`message`** / embedded titles; see [commands/doctor](../commands/doctor.md).

Built-in checks map to these **machine codes** (and doc anchors):

| Check id | When it warns/errors | `issues[].code` |
| --- | --- | --- |
| **`runtime`** | Node.js &lt; 18 | `i18nprune.doctor.runtime_unsupported_node` |
| **`tools`** | **rg** not on `PATH` | `i18nprune.doctor.tools_rg_not_on_path` |
| **`config`** | No **`i18nprune.config.*`** on disk | `i18nprune.doctor.config_missing_file` |
| **`paths`** | Resolved **`source`** / **`localesDir`** / **`src`** missing | `i18nprune.doctor.paths_source_locale_missing` (**error**) or `i18nprune.doctor.paths_directories_missing` (**warn**) |

Section headings **`#runtime`**, **`#tools`**, **`#config`**, **`#paths`** below group narrative by check id. Each **emitted** code is documented under a **level-2** heading with the **short anchor** in backticks (suffix after **`i18nprune.doctor.`** — same style as [translate](./translate.md)).

---

## `runtime` {#runtime}

**Check id:** **`runtime`**  
**What it checks:** Node.js major version is at least **18** (aligns with the package **`engines`** field).

## `runtime_unsupported_node`

**Code:** **`i18nprune.doctor.runtime_unsupported_node`**  
**Severity:** **`error`**  
**Meaning:** The current Node.js process is too old for supported **i18nprune** CLI/runtime behavior.

**Fix:** Install Node **18+** (LTS recommended), e.g. via [nodejs.org](https://nodejs.org/) or your version manager, then rerun **`i18nprune doctor`**.

---

## `tools` {#tools}

**Check id:** **`tools`**  
**What it checks:** **ripgrep** (**`rg`**) is available on **`PATH`** (optional; used only when you pass **`cleanup --rg`**).

## `tools_rg_not_on_path`

**Code:** **`i18nprune.doctor.tools_rg_not_on_path`**  
**Severity:** **`warning`**  
**Meaning:** **rg** was not found. Default **`cleanup`** uses the static scan only. **`cleanup --rg`** skips the string-presence guard when **rg** is missing.

**Fix:** Install **ripgrep** only if you want **`cleanup --rg`**: [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep).

---

## `config` {#config}

**Check id:** **`config`**  
**What it checks:** Whether an **`i18nprune.config`** file (**.ts**, **.mts**, **.js**, **.mjs**, etc.) was discovered next to your project.

## `config_missing_file`

**Code:** **`i18nprune.doctor.config_missing_file`**  
**Severity:** **`warning`**  
**Meaning:** No config file was found; the CLI uses **built-in defaults** (same merge as **`defineConfig`** + Zod, but you have no checked-in project overrides).

**Why it matters:** Paths, **`exclude`**, **`policies`**, **`patching`**, **`translate`**, etc. all fall back to defaults, which may not match your repo layout.

**Fix:** Run **`i18nprune init`** (use **`--rich`** for every namespace scaffolded) or add **`i18nprune.config.ts`** manually. You can still rely on defaults intentionally; this warning is informational.

---

## `paths` {#paths}

**Check id:** **`paths`**  
**What it checks:** **`source`**, **`localesDir`**, and **`src`** resolve to paths that exist on disk (after config + cwd resolution). When everything exists, the detail line may still note **non-literal translation call sites** (dynamic keys) as context — that is **not** a path failure.

## `paths_source_locale_missing`

**Code:** **`i18nprune.doctor.paths_source_locale_missing`**  
**Severity:** **`error`**  
**Meaning:** The resolved **source locale JSON** path does not exist. Most commands cannot run safely.

**Fix:** Correct **`source`** in config (or create the missing JSON at the expected path).

## `paths_directories_missing`

**Code:** **`i18nprune.doctor.paths_directories_missing`**  
**Severity:** **`warning`**  
**Meaning:** The source locale file exists, but **`localesDir`** and/or **`src`** is missing. Some commands may partially work; fix paths before relying on scans or locale writes.

**Fix:** Point **`localesDir`** / **`src`** at real directories, or create the expected folder structure.
