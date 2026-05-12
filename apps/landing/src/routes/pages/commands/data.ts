import { docsCommandUrl, getDocsUrl } from "../../../constants/links";
import {
  commandsPageDoctorTerminal,
  commandsPageSyncTerminal,
  commandsPageValidateTerminal,
} from "./terminal";
import type { CommandCategory } from "../../../types/commands-page";

function L(path: string, label: string) {
  return { path, label };
}

export const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    id: "validate-detect",
    title: "Validate & detect",
    intro:
      "Catch drift before it ships: compare literal translation keys in source code to your source locale JSON, surface dynamic call sites, and verify local tooling.",
    commands: [
      {
        slug: "validate",
        title: "validate",
        summary:
          "Ensures string literal keys used in translation calls exist in the source locale JSON. Non-literal first arguments are reported as dynamic key sites.",
        detail:
          "Uses your configured `functions`, `src`, and resolved `source` path. Pair with `--json` for machine-readable reports and CI gates.",
        examples: [
          {
            caption: "Human-readable report in the terminal",
            code: "i18nprune validate",
            lang: "bash",
            outcome: "Lists missing keys and dynamic sites; non-zero when policy violations require attention.",
          },
          {
            caption: "Machine-readable JSON on stdout (for scripts & reports)",
            code: "i18nprune validate --json",
            lang: "bash",
            outcome: "Structured document you can pipe to files for automation.",
          },
        ],
        sessionTerminal: commandsPageValidateTerminal,
        moreLinks: [
          L("cli/README", "CLI overview"),
          L("examples/commands/validate/README", "Full validate examples"),
          L("cli/verbosity/README", "Verbosity & output"),
          L("behavior/json-long", "JSON mode & long runs"),
          L("regex/README#detection-limits", "Detection limits (heuristics)"),
        ],
      },
      {
        slug: "missing",
        title: "missing",
        summary:
          "Adds dotted key paths that appear in code but are absent from a chosen JSON file — by default the source locale (same file `validate` checks).",
        detail:
          "Use `--dry-run` to preview and `--target` to target one or more existing locale files. Writes need `--yes` in CI/non-interactive environments.",
        examples: [
          {
            caption: "Preview keys that would be added (no write)",
            code: "i18nprune missing --dry-run",
            lang: "bash",
            outcome: "Shows paths that would receive the __I18NPRUNE_MISSING__ scaffold; no file change.",
          },
          {
            caption: "Limit human listing (full list uses --full)",
            code: "i18nprune missing --dry-run --top 5",
            lang: "bash",
            outcome: "Caps preview rows; JSON mode always returns complete `paths`.",
          },
          {
            caption: "Write placeholders into a specific locale file",
            code: "i18nprune missing --target ja --yes",
            lang: "bash",
            outcome: "Merges missing paths into `locales/ja.json` (resolved under `localesDir`).",
          },
        ],
        moreLinks: [
          L("config/commands", "Command namespaces in config"),
          L("examples/commands/missing/README", "Full missing examples"),
          L("examples/README", "Examples & report file"),
        ],
      },
      {
        slug: "doctor",
        title: "doctor",
        summary:
          "Read-only diagnostics: Node version, ripgrep on PATH, config presence, and whether resolved source locale / locales dir / src exist.",
        detail:
          "Use `--only` to run a subset of checks, `--strict` to fail on warnings, and `--json` for CI-friendly output.",
        examples: [
          {
            caption: "Full diagnostic pass",
            code: "i18nprune doctor",
            lang: "bash",
            outcome: "Prints findings per check; exit 0 when no errors (and no warns if `--strict`).",
          },
          {
            caption: "Only runtime and tooling",
            code: "i18nprune doctor --only runtime,tools",
            lang: "bash",
            outcome: "Skips config/path checks — useful for quick agent images.",
          },
          {
            caption: "Minimal fields (matches benchmark screenshot)",
            code: "time i18nprune doctor --json | jq '.data.findings[] | {id, severity, title}'",
            lang: "bash",
            outcome: "One line per finding; pair with `--strict` on the CLI when you need non-zero on warns.",
          },
        ],
        sessionTerminal: commandsPageDoctorTerminal,
        moreLinks: [
          L("examples/commands/doctor/README", "Full doctor examples"),
          L("versioning/README", "Versioning & updates"),
        ],
      },
    ],
  },
  {
    id: "repair-generate",
    title: "Repair & generate",
    intro:
      "Align locale files with your source catalog, remove stale keys safely, and run translation workflows when you need new or refreshed strings.",
    commands: [
      {
        slug: "sync",
        title: "sync",
        summary:
          "Merges and prunes locale JSON under `localesDir` to match the source locale shape, respecting `policies.preserve`. Warns on dynamic key patterns like `validate`.",
        detail:
          "The source locale file is never modified. Use `--target` to restrict which locale files are updated, or `--dry-run` to see would-write lines without touching disk.",
        examples: [
          {
            caption: "Sync all non-source locales",
            code: "i18nprune sync",
            lang: "bash",
            outcome: "Updates every target locale JSON to mirror source structure (subject to preserve rules).",
          },
          {
            caption: "Preview changes without writing",
            code: "i18nprune sync --dry-run",
            lang: "bash",
            outcome: "Logs `would write …` lines; no files modified.",
          },
          {
            caption: "Only specific locale files",
            code: "i18nprune sync --target ja,pt-br",
            lang: "bash",
            outcome: "Limits sync to the listed codes (comma-separated, normalized).",
          },
        ],
        sessionTerminal: commandsPageSyncTerminal,
        moreLinks: [
          L("config/policies/README", "Preserve & parity policies"),
          L("examples/commands/sync/README", "Full sync examples"),
          L("examples/jq-cookbook/README", "jq cookbook"),
          L("locales/metadata/README", "Locale metadata mode"),
        ],
      },
      {
        slug: "cleanup",
        title: "cleanup",
        summary:
          "Removes unused key paths from locale files using the source JSON as the catalog, `reference` policy, optional ripgrep on string values, and optional `--ask` for namespace or per-key confirms.",
        detail:
          "`--check-only` or global `--json` audits without writes. Destructive runs use one bulk confirm unless `--ask` (TTY). Global `--yes` skips all prompts. CI needs `--yes` or check-only.",
        examples: [
          {
            caption: "Audit what would be removed (safe)",
            code: "i18nprune cleanup --check-only",
            lang: "bash",
            outcome: "Reports `wouldRemove`-style detail; does not modify files.",
          },
          {
            caption: "Same audit in machine-readable form",
            code: "i18nprune cleanup --json",
            lang: "bash",
            outcome: "JSON payload suitable for archiving; no writes.",
          },
          {
            caption: "Interactive: confirm by top-level namespace (TTY)",
            code: "i18nprune cleanup --ask",
            lang: "bash",
            outcome: "Prompts per namespace batch; use `--ask-per-key` for each key. Overridden by global `--yes`.",
          },
          {
            caption: "Skip ripgrep (faster, riskier)",
            code: "i18nprune cleanup --skip-rg --yes",
            lang: "bash",
            outcome: "Uses static analysis only — use only when you accept the trade-off.",
          },
        ],
        moreLinks: [
          L("examples/commands/cleanup/README", "Full cleanup examples"),
          L("regex/README#detection-limits", "Detection limits (heuristics)"),
          L("roadmap/README", "Roadmap · maintainer sequencing (`maintainer/V1-RELEASE.md` in repo)"),
          L("json/README", "Machine output with `--json`"),
        ],
      },
      {
        slug: "generate",
        title: "generate",
        summary:
          "Creates or overwrites a target locale JSON from the source file using the translation provider; writes optional `<lang>.meta.json` with catalog labels and direction. Use `--resume` to re-translate review-eligible leaves that still match the source (non-interactive runs need `--target` or `--all`).",
        detail:
          "Non-interactive runs require `--target` unless `--resume` is combined with `--all`. Multi-target accepts comma-separated codes. Use `--dry-run` to exercise progress without API calls or writes.",
        examples: [
          {
            caption: "Generate one locale from the catalog",
            code: "i18nprune generate --target ja",
            lang: "bash",
            outcome: "Translates string leaves into `locales/ja.json` (paths from config).",
          },
          {
            caption: "Several locales in one invocation",
            code: "i18nprune generate --target ar,id,ja,ms,zh-cn",
            lang: "bash",
            outcome: "Processes each target sequentially with shared config.",
          },
          {
            caption: "Plan without calling the API or writing files",
            code: "i18nprune generate --target pt-br --dry-run",
            lang: "bash",
            outcome: "Progress UI runs; logs what would have been written.",
          },
          {
            caption: "Top up one locale where values still match the source",
            code: "i18nprune generate --resume --target ja",
            lang: "bash",
            outcome: "Re-translates eligible review leaves in `ja.json` only.",
          },
          {
            caption: "Resume every non-source locale",
            code: "i18nprune generate --resume --all",
            lang: "bash",
            outcome: "Walks each non-source `*.json` under `localesDir` (interactive pick if no TTY).",
          },
        ],
        moreLinks: [
          L("progress/README", "Translation progress & stderr"),
          L("translator/README", "Translator pipeline"),
          L("examples/commands/generate/README", "Full generate examples"),
          L("examples/jq-cookbook/README", "jq cookbook"),
          L("locales/metadata/README", "Locale metadata mode"),
        ],
      },
    ],
  },
  {
    id: "quality-reporting",
    title: "Quality & reporting",
    intro:
      "Measure parity, ship HTML/JSON/CSV artifacts for humans and automation, and inspect merged config without mutating files.",
    commands: [
      {
        slug: "review",
        title: "review",
        summary:
          "Compact per-locale summary vs the source file: path counts, source-identical hints, and aggregates when leaves use structured `{ value, status, … }` objects. `--json` emits `localeReview`.",
        detail:
          "Deep scans and capped path listings live on `validate`, `quality`, and `report`. `review` stays a quick shape check; use `--target all` (default), one code, or a comma-separated list.",
        examples: [
          {
            caption: "Human summary for all locales",
            code: "i18nprune review",
            lang: "bash",
            outcome: "Stats per locale file (same as `--target all`).",
          },
          {
            caption: "Scope to one or several locales",
            code: "i18nprune review --target ja,ar",
            lang: "bash",
            outcome: "Restricts analysis to the listed files.",
          },
          {
            caption: "Machine-readable stdout",
            code: "i18nprune --json review",
            lang: "bash",
            outcome: "JSON suitable for dashboards; no extra confirmation prompts.",
          },
        ],
        moreLinks: [
          L("examples/commands/review/README", "Full review examples"),
          L("roadmap/README", "Roadmap: richer review output"),
        ],
      },
      {
        slug: "quality",
        title: "quality",
        summary:
          "Reports source-identical and parity-style metrics using config policies where implemented (alias: `q`).",
        examples: [
          {
            caption: "Project-wide quality pass",
            code: "i18nprune quality",
            lang: "bash",
            outcome: "Aggregated metrics based on configured policies.",
          },
          {
            caption: "Focus on one locale",
            code: "i18nprune quality --target ja",
            lang: "bash",
            outcome: "Narrows metrics to the chosen catalog code.",
          },
        ],
        moreLinks: [
          L("examples/commands/quality/README", "Full quality examples"),
          L("config/policies/README", "Policies reference"),
        ],
      },
      {
        slug: "report",
        title: "report",
        summary:
          "Emits a full project report: live scan (missing keys, dynamic sites, key observations) or re-export from `--from` without rescanning. Formats: html, json, csv, text.",
        detail:
          "This command uses `--format json`, not global `--json`. HTML bundles the offline report UI; suitable for attaching to tickets or hosting as a static artifact.",
        examples: [
          {
            caption: "Default: timestamped HTML in cwd",
            code: "i18nprune report",
            lang: "bash",
            outcome: "Writes `report-<timestamp>.html` you can open in any browser.",
          },
          {
            caption: "Structured JSON for pipelines",
            code: "i18nprune report --format json --out ./out/project-report.json",
            lang: "bash",
            outcome: "Pretty-printed `i18nprune.projectReport` document.",
          },
          {
            caption: "Re-render from a saved report (no scan)",
            code: "i18nprune report --from ./out/project-report.json --format text --out ./summary.txt",
            lang: "bash",
            outcome: "Validates and converts without touching source files.",
          },
        ],
        moreLinks: [
          L("examples/commands/report/README", "Full report examples"),
          L("commands/report/README", "Report command reference"),
          L("report/README", "Report UI & payload"),
        ],
      },
      {
        slug: "config",
        title: "config",
        summary:
          "Prints merged config, resolved paths, and an `I18NPRUNE_*` env snapshot. Read-only — never creates a config file.",
        examples: [
          {
            caption: "Human-readable merged config",
            code: "i18nprune config",
            lang: "bash",
            outcome: "Shows effective values and where each field came from.",
          },
          {
            caption: "Resolved paths only (`data` envelope)",
            code: "time i18nprune config --json | jq '.data.resolvedPaths'",
            lang: "bash",
            outcome: "Quick CI check of absolute source, locales dir, and src root — full envelope has `fieldSources` and more.",
          },
        ],
        moreLinks: [
          L("examples/commands/config/README", "Full config examples"),
          L("config/README", "Configuration overview"),
        ],
      },
    ],
  },
  {
    id: "locales-catalog",
    title: "Locales & catalog",
    intro:
      "Inspect the bundled language list and manage locale files with nested subcommands — list, edit, dynamic, delete — as your workflow matures.",
    commands: [
      {
        slug: "languages",
        title: "languages",
        summary:
          "Lists supported catalog codes and labels from the bundled `languages.json` — the same codes `generate` validates against.",
        examples: [
          {
            caption: "Print catalog (human layout)",
            code: "i18nprune languages",
            lang: "bash",
            outcome: "Enumerates codes you can pass to `--target` and related commands.",
          },
        ],
        moreLinks: [
          L("examples/commands/languages/README", "Full languages examples"),
          L("commands/languages/README", "Languages command"),
        ],
      },
      {
        slug: "locales",
        title: "locales",
        summary:
          "Namespace for working with existing locale JSON: `locales list`, `locales edit`, and related flows. Use nested help for the full surface.",
        examples: [
          {
            caption: "Discover subcommands via styled help",
            code: "i18nprune help locales list\ni18nprune locales list --help",
            lang: "bash",
            outcome: "Shows the same topic as running a subcommand with `--help`.",
          },
        ],
        moreLinks: [
          L("examples/commands/locales/README", "Full locales examples"),
          L("commands/locales/README", "Locales overview"),
          L("commands/locales/list/README", "locales list"),
          L("commands/locales/edit/README", "locales edit"),
        ],
      },
      {
        slug: "init",
        title: "init",
        summary:
          "Scaffolds `i18nprune.config.ts` (or `.mts` / `.js` / `.mjs`) when missing — interactive unless you pass global `--yes`. Use `--rich` for an expanded template (all supported namespaces). Never overwrites an existing config.",
        examples: [
          {
            caption: "Non-interactive default config",
            code: "i18nprune init --yes",
            lang: "bash",
            outcome: "Writes a starter `.ts` config when none exists.",
          },
          {
            caption: "Full starter template (all namespaces)",
            code: "i18nprune init --yes --rich",
            lang: "bash",
            outcome: "Writes the same paths with every optional namespace filled in (e.g. `patching.enabled: false`) so you can trim or customize.",
          },
        ],
        moreLinks: [
          L("examples/commands/init/README", "Full init examples"),
          L("commands/init/README", "init reference"),
        ],
      },
    ],
  },
];

/** Primary Nextra URL for a top-level CLI command (`…/commands/{slug}/README`). */
export function primaryDocHref(slug: string): string {
  return docsCommandUrl(slug);
}

const COMMAND_EXAMPLE_PATHS: Record<string, string> = {
  validate: "examples/commands/validate/README",
  missing: "examples/commands/missing/README",
  doctor: "examples/commands/doctor/README",
  sync: "examples/commands/sync/README",
  cleanup: "examples/commands/cleanup/README",
  generate: "examples/commands/generate/README",
  review: "examples/commands/review/README",
  quality: "examples/commands/quality/README",
  report: "examples/commands/report/README",
  config: "examples/commands/config/README",
  languages: "examples/commands/languages/README",
  locales: "examples/commands/locales/README",
  init: "examples/commands/init/README",
};

export function commandExamplesHref(slug: string): string | null {
  const path = COMMAND_EXAMPLE_PATHS[slug];
  return path ? getDocsUrl(path) : null;
}
