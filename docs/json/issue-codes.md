# Issue codes (`issues[]`)

When a command emits JSON with **`--json`**, the envelope includes **`issues[]`**: structured findings for scripts and integrations. Each entry has **`severity`**, **`code`**, **`message`**, and optional **`path`**.

**Stable links:** every code below is a heading derived from the issue code. The CLI adds **`docHref`** on each issue — a full URL to this page with the matching hash, e.g. `https://docs.i18nprune.dev/json/issue-codes#i18nprune-io-read_failed`.

**Legacy field:** **`docPath`** (relative docs path without origin) may still appear on older payloads; prefer **`docHref`** for integrations.

**Type:** `Issue` in `@zamdevio/i18nprune/core`.

**Link generation contract:** `Issue.code` values in runtime stay dotted (for machine stability, e.g. `i18nprune.io.read_failed`), while docs anchors are derived by replacing `.` with `-` (`#i18nprune-io-read_failed`). This transform is centralized in `issueCodeToAnchorFragment()` and used by `issueCodeDocHref()` in `packages/cli/src/core/result/issueDocLinks.ts`.

Constants are exported from **`@zamdevio/i18nprune/core`** (same names as `packages/cli/src/constants/issueCodes.ts`). In **human** mode, **`printCommandSummary`** may emit a separate **`kind: summary`** line that can carry **`issues`** when provided on **`CommandSummary`** — **`--json`** commands avoid that path for the primary subcommand (see [CLI JSON parity](../edge-cases/solved/cli-json-command-parity.md)).

---

## Registry (quick lookup)

| `code` | Default severity | Emitted by |
|--------|------------------|------------|
| `i18nprune.context.discovery_warning` | `warning` | Context resolution, **`tryResolveContext`** |
| `i18nprune.context.resolution_failed` | `error` | **`tryResolveContext`** on failure |
| `i18nprune.validate.missing_literal_keys` | `warning` | **`validate`**, **`runValidate`** |
| `i18nprune.validate.dynamic_key_sites` | `warning` | **`validate`**, **`runValidate`** |
| `i18nprune.validate.source_locale_unreadable` | `error` | **`validate`**, **`runValidate`** |
| `i18nprune.fill.usage` | `error` | **`fill`**, **`runFill`** — non-interactive run without **`--target`** / **`--all`**, or no non-source locales to fill |
| `i18nprune.locales.usage` | `error` | **`locales`** subcommands — missing required args / invalid invocation in non-interactive or JSON mode |
| `i18nprune.locale.target_not_found` | `error` | **`locales edit`**, **`locales delete`**, … — **`--target`** does not match an existing non-source locale file |
| `i18nprune.translate.identity_streak_warning` | `warning` | **`generate`**, **`fill`** — many consecutive leaves unchanged after translation (threshold approaching abort) |
| `i18nprune.translate.identity_streak_abort` | `error` | **`generate`**, **`fill`** — identity streak exceeded configured threshold (often **`ok: false`** with **`--json`**) |
| `i18nprune.report.invalid_format` | `error` | **`report`** — invalid **`--format`** value (JSON mode emits envelope + issue) |
| `i18nprune.cli.invalid_json_pretty` | `error` | Global option parsing — invalid **`--json-pretty <true|false>`** value while JSON output is enabled |
| `i18nprune.io.read_failed` | `error` | JSON commands when filesystem/JSON read fails before a normal payload (`missing`, `sync`, `fill`, `quality`, `review`, `cleanup`, `generate`, `report`, …) |
| `i18nprune.scan.dynamic_key_sites` | `warning` | **`sync`**, **`cleanup`**, **`quality`**, **`review`**, **`generate`**, **`report`**, … |
| `i18nprune.missing.paths_not_in_current_scan` | `warning` | **`missing`**, **`runMissing`** |
| `i18nprune.sync.locale_file_not_found` | `warning` | **`sync`**, **`runSync`** |
| `i18nprune.cleanup.uncertain_paths_excluded` | `info` | **`cleanup`**, **`runCleanupCheck`** |
| `i18nprune.cleanup.ripgrep_unavailable` | `warning` | **`cleanup`**, **`runCleanupCheck`** |
| `i18nprune.quality.english_identical_leaves` | `info` | **`quality`**, **`runQuality`** |
| `i18nprune.languages.empty_filter` | `info` | **`languages`**, **`runLanguages`** |
| `i18nprune.doctor.<id>` | `warning` / `error` | **`doctor`**, **`runDoctor`** |

---

## `i18nprune-context-discovery_warning`

**Severity:** `warning`  
**When:** Path **discovery** adjusted missing **`source`**, **`localesDir`**, or **`src`** (or similar) using heuristics. The **`message`** is human-readable text from the resolver.  
**Who:** Any command that calls **`resolveContext`**, and **`tryResolveContext`** (success branch — warnings are mirrored into **`issues[]`**).  
**What to do:** Confirm the discovered paths are correct; add explicit paths in **`i18nprune.config`** or CLI overrides if discovery picked the wrong directory. See [Config](../config/README.md) and [CLI runtime](../cli/runtime/README.md).

---

## `i18nprune-context-resolution_failed`

**Severity:** `error`  
**When:** **`resolveContext`** threw (invalid config, Zod validation, unsupported setup).  
**Who:** **`tryResolveContext`** failure branch; programmatic callers that avoid throwing.  
**What to do:** Fix the underlying error message (often config validation). Run **`i18nprune doctor`** or **`i18nprune config --json`** after fixing **`i18nprune.config.*`**.

---

## `i18nprune-validate-missing_literal_keys`

**Severity:** `warning`  
**When:** Literal translation keys appear in scanned sources but not in the **source** locale JSON.  
**Who:** **`validate`**, **`runValidate`**.  
**What to do:** Add keys to the source locale, remove dead calls, or adjust **`functions`** / scan roots. See [commands/validate](../commands/validate/README.md).

---

## `i18nprune-validate-dynamic_key_sites`

**Severity:** `warning`  
**When:** Call sites use **non-literal** keys (computed / variable keys). Static analysis cannot enumerate them.  
**Who:** **`validate`**, **`runValidate`**.  
**What to do:** Treat as documentation: ensure runtime key coverage by other means; see [dynamic keys](../barriers/dynamic-keys.md).

---

## `i18nprune-validate-source_locale_unreadable`

**Severity:** `error`  
**When:** The configured **source locale JSON** cannot be read or parsed (missing file, permission, **invalid JSON**).  
**Who:** **`validate`**, **`runValidate`** — **`validate --json`** still prints **one** stdout envelope (does not throw before JSON).  
**What to do:** Fix **`source`** path, file permissions, or JSON syntax. See [Config](../config/README.md).

---

## `i18nprune-io-read_failed`

**Severity:** `error`  
**When:** A command that supports **`--json`** could not complete because of **filesystem or JSON parse** failure while building the normal payload (same class of problems as unreadable locale files, but outside **`validate`**’s dedicated code).  
**Who:** **`missing`**, **`sync`**, **`quality`**, **`review`**, **`cleanup`**, **`generate`**, **`report`**, etc., when their **`run*`** paths catch I/O errors. **`path`** may mirror **`errno`**’s path when available.  
**What to do:** Read **`message`**, fix the file path or JSON content, then re-run. Prefer **`--config`** / a single config file in CI. See [Behavior](../behavior/README.md).

---

## `i18nprune-scan-dynamic_key_sites`

**Severity:** `warning`  
**When:** Same **non-literal call sites** story as validate, emitted on commands that align locale JSON or report parity (**`sync`**, **`cleanup`**, **`quality`**, **`review`**, **`generate`**, **`report`**, …).  
**Who:** Shared helper **`issuesFromDynamicScanCount`**.  
**What to do:** Same as dynamic keys for validate — document and handle at runtime.

---

## `i18nprune-missing-paths_not_in_current_scan`

**Severity:** `warning`  
**When:** **`missing --from-report`** listed paths that are not present in the **current** code scan (stale report or renamed keys).  
**Who:** **`missing`**, **`runMissing`**.  
**What to do:** Re-run **`validate --json`**, refresh **`--from-report`**, or drop stale paths.

---

## `i18nprune-sync-locale_file_not_found`

**Severity:** `warning`  
**When:** **`sync --target`** requested a locale basename with **no** matching **`*.json`** under **`localesDir`** (skipped).  
**Who:** **`sync`**, **`runSync`**.  
**What to do:** Create the locale file (e.g. **`generate`**) or fix **`--target`** spelling.

---

## `i18nprune-cleanup-uncertain_paths_excluded`

**Severity:** `info`  
**When:** **`cleanup`** excluded paths under **uncertain** key prefixes per **`reference`** / policy.  
**Who:** **`cleanup`**, **`runCleanupCheck`**.  
**What to do:** Expected informational signal; tighten **`reference`** / policies if exclusions are wrong.

---

## `i18nprune-cleanup-ripgrep_unavailable`

**Severity:** `warning`  
**When:** **`rg`** is not on **`PATH`** and cleanup would use it for safer reference checks.  
**Who:** **`cleanup`**, **`runCleanupCheck`**.  
**What to do:** Install [ripgrep](https://github.com/BurntSushi/ripgrep) for stronger safety.

---

## `i18nprune-quality-english_identical_leaves`

**Severity:** `info`  
**When:** Target locale leaves still **match** the source string (parity / copy candidates).  
**Who:** **`quality`**, **`runQuality`**.  
**What to do:** Use **`fill`**, **`generate`**, or manual translation as appropriate.

---

## `i18nprune-languages-empty_filter`

**Severity:** `info`  
**When:** **`languages --filter`** matched **no** catalog rows.  
**Who:** **`languages`**, **`runLanguages`**.  
**What to do:** Widen or fix the filter substring.

---

## `i18nprune-fill-usage`

**Severity:** `error`  
**When:** **`fill`** cannot determine targets in non-interactive mode (**`--json`**, CI, no TTY): missing **`--target`** and **`--all`**, or there are no locale files to fill besides the source.  
**Who:** **`fill`**, **`runFill`**.  
**What to do:** Pass **`--target <code>`** (or a comma-separated list), or **`--all`**, and ensure **`localesDir`** contains at least one non-source locale JSON. See [commands/fill](../commands/fill/README.md).

---

## `i18nprune-locales-usage`

**Severity:** `error`  
**When:** A **`locales`** subcommand is invoked without required arguments or flags for the current mode (e.g. non-interactive **`locales edit`** without **`--target`**).  
**Who:** **`locales list`**, **`locales edit`**, **`locales dynamic`**, **`locales delete`** (and programmatic equivalents).  
**What to do:** Pass the documented **`--target`** / flags, or run interactively in a TTY. See [commands/locales](../commands/locales/README.md).

---

## `i18nprune-locale-target_not_found`

**Severity:** `error`  
**When:** **`--target`** names a code with no matching **`locales/<code>.json`** (excluding the source locale where applicable).  
**Who:** **`locales edit`**, **`locales delete`**, and similar target resolution paths.  
**What to do:** List locales with **`i18nprune locales list`**, fix spelling, or **`generate`** the locale first.

---

## `i18nprune-translate-identity_streak_warning`

**Severity:** `warning`  
**When:** **`generate`** or **`fill`** sees many consecutive string leaves whose post-translation value still **equals** the source (identity streak approaching the abort threshold).  
**Who:** Shared **`translateLeaf`** path with **`createIdentityStreakGuard`**.  
**What to do:** Check API keys, provider, source/target language codes, and network; confirm you are not repeatedly “translating” into the source language by mistake.

---

## `i18nprune-translate-identity_streak_abort`

**Severity:** `error`  
**When:** The identity streak guard **stops the run** to avoid burning quota on a broken configuration. In **`--json`** mode this typically yields **`ok: false`** on the primary envelope.  
**Who:** **`generate`**, **`fill`** (and shared translator). **`--yes`** in human/non-JSON flows may allow continuing without a prompt where implemented.  
**What to do:** Same as the warning — fix configuration; re-run with **`--yes`** only after you understand why translations were identical.

---

## `i18nprune-report-invalid_format`

**Severity:** `error`  
**When:** **`report`** receives an invalid **`--format`** value (anything outside `html`, `json`, `csv`, `text`).  
**Who:** **`report`** command argument parsing path. In **`--json`** mode, this is emitted inside a `CliJsonEnvelope` with this issue code instead of logger-only text.  
**What to do:** Pass a supported value, for example `--format json`.

---

## `i18nprune-cli-invalid_json_pretty`

**Severity:** `error`  
**When:** Global **`--json-pretty`** receives a non-boolean value (expected `true`/`false`, with aliases like `1/0`, `yes/no`).  
**Who:** Global CLI option parsing path before command execution.  
**What to do:** Pass a valid boolean, for example `--json-pretty false`.

---

## `i18nprune-doctor-*`

**Severity:** `warning` or `error` depending on finding  
**When:** A **doctor** check (**`runtime`**, **`tools`**, **`config`**, **`paths`**) is not **`ok`**.  
**Who:** **`doctor`**, **`runDoctor`**. The **`code`** is **`i18nprune.doctor.<id>`** where **`<id>`** matches the check identifier.  
**What to do:** Follow the **`message`** / embedded titles; see [commands/doctor](../commands/doctor/README.md).

Common IDs in the built-in checks today:

- `i18nprune.doctor.runtime`
- `i18nprune.doctor.tools`
- `i18nprune.doctor.config`
- `i18nprune.doctor.paths`

---

## Adding codes

1. Add `export const ISSUE_* = 'i18nprune....'` in `packages/cli/src/constants/issueCodes.ts`.
2. Add a **section heading** on this page using the anchor form of the issue code (example: ``## `i18nprune-io-read_failed` ``).  
   Links use the stable fragment convention **`#` + code with `.` → `-`** (underscores stay unchanged), e.g. `#i18nprune-io-read_failed`.
3. Emit via `buildCliJsonEnvelope` / helpers in `packages/cli/src/core/result/cliEnvelopeIssues.ts` (or command-specific builders). **`docHref`** is attached automatically for **`i18nprune.*`** codes.

## See also

- [JSON output (`--json`)](./README.md) — envelope shape  
- [Programmatic API](./programmatic.md) — `run*` helpers and `tryResolveContext`  
- [Prompts & CLI boundaries](../prompts/README.md)
