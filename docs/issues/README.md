# Issues reference (`issues[]`)

When a command emits JSON with **`--json`**, the envelope includes **`issues[]`**: structured findings for scripts and integrations. Each entry has **`severity`**, **`code`**, **`message`**, and optional **`path`**.

The same stable **`Issue.code`** strings also appear in **human / normal terminal** output (for example `issue: …` lines with a docs URL). **`issues[]`** is the structured view in **`--json`**; the codes are one contract for both modes.

**Who uses this:** the **CLI** is the primary consumer today (it attaches **`docHref`** on **`i18nprune.*`** issues). Other clients (editors, CI wrappers, libraries) can use the same codes and link helpers from **`@i18nprune/core`**; behavior is shared, but the shipped UX is CLI-first for now.

**Stable links:** the CLI adds **`docHref`** on each **`i18nprune.*`** issue — a URL to the topic page for that code’s namespace, with a **short hash** (slug of the segment after `i18nprune.<namespace>.`, same rules as VitePress heading ids — underscores become hyphens), e.g. `https://docs.i18nprune.dev/issues/translate#identity-streak-abort`.

**`docPath`:** optional repo-relative path under `docs/` (e.g. `issues/translate`). Prefer **`docHref`** in UIs.

**Type:** `Issue` in `i18nprune/core`.

**Link contract:** runtime **`Issue.code`** values stay dotted (`i18nprune.translate.identity_streak_abort`). Published anchors and paths come from **`resolveIssueCodeDocLink()`** (or **`issueCodeDocHref()`** for the full URL only). Topic headings in Markdown use the **raw suffix** in backticks (e.g. `` ## `identity_streak_abort` ``); the site slug matches the anchor in **`docHref`** (underscores → hyphens, VitePress-style).

Issue code string constants **`ISSUE_*`** are exported from **`i18nprune/core`** (same names as `packages/cli/src/constants/issueCodes.ts`).

## Topic pages

| Topic | What this page is for |
|-------|----------------------|
| [cleanup](./cleanup.md) | Prune runs, ripgrep availability, uncertain paths |
| [cli](./cli.md) | Global CLI flags and parsing (e.g. JSON pretty) |
| [config](./config.md) | Programmatic config load (`tryLoadCoreConfigFromPath`, …) |
| [context](./context.md) | Workspace discovery and context resolution |
| [doctor](./doctor.md) | **`doctor`** check findings (Node, rg, config file, resolved paths) + links to patching analyzer issues when relevant |
| [generate](./generate.md) | `generate` command **`USAGE`** fallback (`i18nprune.generate.usage`) — includes **`--resume`** |
| [io](./io.md) | stdin read and JSON parse failures on JSON commands |
| [languages](./languages.md) | `languages` filters and empty results |
| [locale](./locale.md) | Single-locale targets in `locales` subcommands |
| [locales](./locales.md) | `locales` usage and target resolution |
| [missing](./missing.md) | `missing` vs paths in the current scan |
| [patching](./patching.md) | Patching analyzer findings |
| [quality](./quality.md) | Quality hints (e.g. identical English leaves) |
| [report](./report.md) | Report format and payload errors |
| [scan](./scan.md) | Dynamic key sites across pipelines |
| [sync](./sync.md) | Missing locale files and metadata flag conflicts |
| [translate](./translate.md) | Identity streak guard; provider / credentials / env troubleshooting (**`generate`** / **`generate --resume`**; list backends: **`i18nprune providers`**) |
| [validate](./validate.md) | Missing keys, dynamic sites, unreadable source |

## Registry (quick lookup)

| `code` | Default severity | Emitted by |
|--------|------------------|------------|
| `i18nprune.context.discovery_warning` | `warning` | Context resolution, **`tryResolveContext`** |
| `i18nprune.context.resolution_failed` | `error` | **`tryResolveContext`** on failure |
| `i18nprune.validate.missing_literal_keys` | `warning` | **`validate`**, **`runValidate`** |
| `i18nprune.validate.dynamic_key_sites` | `warning` | **`validate`**, **`runValidate`** |
| `i18nprune.validate.source_locale_unreadable` | `error` | **`validate`**, **`runValidate`** |
| `i18nprune.locales.usage` | `error` | **`locales`** subcommands |
| `i18nprune.locale.target_not_found` | `error` / `warning` | **`locales edit`**, **`locales delete`**, **`missing --target`**, … |
| `i18nprune.locale.source_placeholder_leaves` | `warning` | **`validate`**, **`missing`**, **`sync`**, **`quality`**, **`review`** when the source locale contains missing placeholders |
| `i18nprune.locale.target_placeholder_leaves` | `warning` | **`missing --target`**, **`sync`**, **`quality`**, **`review`** when non-source locales contain missing placeholders |
| `i18nprune.translate.identity_streak_warning` | `warning` | **`generate`** (including **`--resume`**) |
| `i18nprune.translate.identity_streak_abort` | `error` | **`generate`** (including **`--resume`**) |
| `i18nprune.translate.unknown_translation_provider` | `error` | Provider id resolution / validation |
| `i18nprune.translate.provider_not_implemented_yet` | `error` | **`resolveTranslator`** — reserved for newly registered ids without an engine yet |
| `i18nprune.translate.missing_credentials` | `error` | **`generate`** before outbound calls (DeepL / Libre URL / LLM) |
| `i18nprune.generate.usage` | `error` | **`generate`** — generic **`USAGE`** when no translate-specific `issueCode` |
| `i18nprune.report.invalid_format` | `error` | **`report`** |
| `i18nprune.cli.invalid_json_pretty` | `error` | Global CLI option parsing |
| `i18nprune.io.read_failed` | `error` | JSON commands on I/O / JSON parse failures |
| `i18nprune.scan.dynamic_key_sites` | `warning` | **`sync`**, **`cleanup`**, **`quality`**, … |
| `i18nprune.missing.paths_not_in_current_scan` | `warning` | **`missing`**, **`runMissing`** |
| `i18nprune.patching.*` | varies | Patching analyzer (**`doctor`**, **`validate`**) |
| `i18nprune.sync.locale_file_not_found` | `warning` | **`sync`**, **`runSync`** |
| `i18nprune.sync.metadata_flag_conflict` | `warning` | **`sync`**, **`runSync`** |
| `i18nprune.cleanup.uncertain_paths_excluded` | `info` | **`cleanup`**, **`runCleanup`** |
| `i18nprune.cleanup.ripgrep_unavailable` | `warning` | **`cleanup`**, **`runCleanup`** |
| `i18nprune.quality.english_identical_leaves` | `info` | **`quality`**, **`runQuality`** |
| `i18nprune.languages.empty_filter` | `info` | **`languages`**, **`runLanguages`** |
| `i18nprune.languages.unsupported_language_code` | `error` | **`assertSupportedTargetLanguageCode`**, CLI **`validateTargetLanguageCode`** |
| `i18nprune.doctor.*` (underscore tail like **`config_missing_file`**, **`paths_source_locale_missing`**; URL hash slug uses hyphens) | `warning` / `error` | **`doctor`**, **`runDoctor`** |
| `i18nprune.config.missing` | `error` | Core config load — file not found (`I18nPruneError.issueCode`) |
| `i18nprune.config.invalid` | `error` | Core config load — parse error (`issueCode`) |
| `i18nprune.config.load_failed` | `error` | Core config load — other failure (`issueCode`) |

## Adding codes

1. Add `export const ISSUE_* = 'i18nprune....'` in `packages/cli/src/constants/issueCodes.ts` (re-exported from `@i18nprune/core`).
2. Add a **section heading** on the matching topic page under `docs/issues/<parent>.md` using the short anchor form (example: `## \`read_failed\`` for `i18nprune.io.read_failed`).
3. Emit via envelope builders; **`docHref`** is attached automatically for **`i18nprune.*`** codes.

## Authoring topic pages (for contributors)

Readers usually land from **`docHref`** with a hash — they want **meaning**, **what to do next**, and **links to the command or config** that emitted the code.

### Recommended section shape (per `Issue.code`)

Use a **level-2 heading** with the **short anchor** in backticks (suffix after `i18nprune.<parent>.`), e.g. `` ## `identity_streak_abort` `` for `i18nprune.translate.identity_streak_abort`.

Inside the section, prefer this order (skip lines that do not apply):

1. **`Code:`** — full dotted string (`i18nprune…`) when this section documents that exact runtime code (omit or mark “n/a” for narrative-only troubleshooting that is not emitted as `issues[]`).
2. **`Severity:`** — `error` | `warning` | `info` (match the default severity in the registry table when relevant).
3. **`When:`** — concrete trigger (command, flag, file state).
4. **`Who:`** — module or command name (helps maintainers grep the codebase).
5. **`Why:`** — optional; use only when **`When:`** does **not** already state the reason (skip **`Why:`** if it would repeat **`When:`**).
6. **`What to do:`** — numbered steps, flags, config keys; link to command / config docs.

**Extras (optional):** one short opening sentence if the title is terse; **`Related:`** (other `Issue.code` links) only when it saves a round trip.

**`Who:`** — name the **command** (`generate`, …) and/or **core entry** (`tryLoadCoreConfigFromPath`, `resolveTranslator`, …) so maintainers can **`rg`** the codebase.

Published URLs use **`/issues/<parent>#<anchor>`**; keep headings aligned with **`resolveIssueCodeDocLink()`** so anchors stay stable.

## See also

- [JSON output (`--json`)](../json/README.md)
- [Programmatic API](../json/programmatic.md)
- [Prompts & CLI boundaries](../prompts/README.md)
