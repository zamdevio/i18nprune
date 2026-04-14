import { docsCommandUrl } from "../../../constants/links";
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
          "Uses your configured `functions`, `src`, and resolved `source` path. Pair with `--json` for machine-readable reports that feed `missing --from-report` and CI gates.",
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
            outcome: "Structured document you can pipe to files or pass to `missing --from-report`.",
          },
        ],
        sessionTerminal: commandsPageValidateTerminal,
        moreLinks: [
          L("cli/README", "CLI overview"),
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
          "Use `--dry-run` to preview, `--locale` to target a specific locale file, and `--from-report` to align with a prior `validate --json` run. Writes need `--yes` in CI/non-interactive environments.",
        examples: [
          {
            caption: "Preview keys that would be added (no write)",
            code: "i18nprune missing --dry-run",
            lang: "bash",
            outcome: "Shows paths that would receive empty string placeholders; no file change.",
          },
          {
            caption: "Limit human listing (full list uses --full-list)",
            code: "i18nprune missing --dry-run --top 5",
            lang: "bash",
            outcome: "Caps preview rows; JSON mode always returns complete `paths`.",
          },
          {
            caption: "Write placeholders into a specific locale file",
            code: "i18nprune missing --locale ja --yes",
            lang: "bash",
            outcome: "Merges missing paths into `locales/ja.json` (resolved under `localesDir`).",
          },
          {
            caption: "Pipeline from validate JSON (recommended for parity)",
            code: "i18nprune validate --json > report.json\ni18nprune missing --from-report report.json --yes",
            lang: "bash",
            outcome: "Uses the same missing set validate computed for the source locale target.",
          },
        ],
        moreLinks: [
          L("config/commands", "Command namespaces in config"),
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
        moreLinks: [L("versioning/README", "Versioning & updates")],
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
        moreLinks: [L("config/policies/README", "Preserve & parity policies")],
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
          L("regex/README#detection-limits", "Detection limits (heuristics)"),
          L("phases/active-phase", "Active sprint (reference + `--ask`)"),
          L("commands/report/README", "Per-run `--report-file`"),
        ],
      },
      {
        slug: "generate",
        title: "generate",
        summary:
          "Creates or overwrites a target locale JSON from the source file using the translation provider; writes optional `<lang>.meta.json` with catalog labels and direction.",
        detail:
          "Non-interactive runs require `--target`. Multi-target accepts comma-separated codes. Use `--dry-run` to exercise progress without API calls or writes.",
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
        ],
        moreLinks: [
          L("progress/README", "Translation progress & stderr"),
          L("translator/README", "Translator pipeline"),
        ],
      },
      {
        slug: "fill",
        title: "fill",
        summary:
          "Re-translates leaves that still match the source (stale English-identical strings) — complementary to `generate` for keeping translations fresh.",
        detail:
          "`--target` accepts one code, a comma list, or `all` / `--all` for every non-source locale. Requires a target when non-interactive.",
        examples: [
          {
            caption: "Refresh one locale",
            code: "i18nprune fill --target ja",
            lang: "bash",
            outcome: "Updates matching leaves in `ja.json` where values still equal source strings.",
          },
          {
            caption: "All target locales",
            code: "i18nprune fill --target all",
            lang: "bash",
            outcome: "Walks every non-source `*.json` under `localesDir`.",
          },
          {
            caption: "Count work without API or writes",
            code: "i18nprune fill --target ja --dry-run",
            lang: "bash",
            outcome: "Reports counts and would-write paths only.",
          },
        ],
        moreLinks: [L("behavior/commands", "Command behaviors")],
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
          "Per-locale summary: string path counts and English-identical counts vs the source locale. `--json` emits a structured `localeReview` object.",
        detail:
          "Additional format switches and path lists are on the roadmap; today’s output focuses on actionable parity signals for each locale file.",
        examples: [
          {
            caption: "Human summary for all locales",
            code: "i18nprune review",
            lang: "bash",
            outcome: "Table-style stats per locale file.",
          },
          {
            caption: "Scope to one locale",
            code: "i18nprune review --target ja",
            lang: "bash",
            outcome: "Restricts analysis to `ja.json`.",
          },
          {
            caption: "Machine-readable stdout",
            code: "i18nprune --json review",
            lang: "bash",
            outcome: "JSON suitable for dashboards; no extra confirmation prompts.",
          },
        ],
        moreLinks: [L("roadmap/README", "Roadmap: richer review output")],
      },
      {
        slug: "quality",
        title: "quality",
        summary:
          "Reports English-identical and parity-style metrics using config policies where implemented (alias: `q`).",
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
        moreLinks: [L("config/policies/README", "Policies reference")],
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
        moreLinks: [L("config/README", "Configuration overview")],
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
          "Lists supported catalog codes and labels from the bundled `languages.json` — the same codes `generate` / `fill` validate against.",
        examples: [
          {
            caption: "Print catalog (human layout)",
            code: "i18nprune languages",
            lang: "bash",
            outcome: "Enumerates codes you can pass to `--target` and related commands.",
          },
        ],
        moreLinks: [L("commands/languages/README", "Languages command")],
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
          L("commands/locales/README", "Locales overview"),
          L("commands/locales/list/README", "locales list"),
          L("commands/locales/edit/README", "locales edit"),
        ],
      },
      {
        slug: "init",
        title: "init",
        summary:
          "Scaffolds `i18nprune.config.ts` (or `.mts` / `.js` / `.mjs`) when missing — interactive unless you pass global `--yes`. Never overwrites an existing config.",
        examples: [
          {
            caption: "Non-interactive default config",
            code: "i18nprune init --yes",
            lang: "bash",
            outcome: "Writes a starter `.ts` config when none exists.",
          },
        ],
        moreLinks: [L("commands/init/README", "init reference")],
      },
    ],
  },
];

/** Primary Nextra URL for a top-level CLI command (`…/commands/{slug}/README`). */
export function primaryDocHref(slug: string): string {
  return docsCommandUrl(slug);
}
