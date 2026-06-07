#!/usr/bin/env node
/**
 * Targeted description overrides for docs where auto-excerpt is weak.
 * Run: node scripts/docs/improve-descriptions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const docsRoot = path.join(repoRoot, 'docs');

/** @type {Record<string, string>} */
const OVERRIDES = {
  'architecture/decisions/001-scope-v0-1.md':
    'ADR 001 — one installable CLI with explicit subcommands for local and CI i18n maintenance in v0.x.',
  'architecture/decisions/002-configurable-translation-calls.md':
    'ADR 002 — declarative functions config lists translation call shapes for validate, sync, and extraction.',
  'architecture/decisions/003-user-i18n-loader-integration.md':
    'ADR 003 — opt-in patching integrates generated locale loaders with app i18n config after mutations.',
  'architecture/decisions/004-auto-patch.md':
    'ADR 004 — opt-in auto-patching updates runtime i18n wiring when locale files or loader maps change.',
  'architecture/decisions/005-dynamic-key-rebuild-and-prefix.md':
    'ADR 005 — dynamic keys, per-file const maps, and partial prefix handling for static analysis limits.',
  'architecture/decisions/006-command-orchestrator-boundary.md':
    'ADR 006 — CLI command modules orchestrate; reusable domain logic lives in @i18nprune/core runXxx entries.',
  'architecture/decisions/007-cli-json-envelope-contract.md':
    'ADR 007 — stable CLI --json envelope (ok, kind, data, issues, meta.apiVersion) for automation and CI.',
  'architecture/decisions/008-cache-ownership-and-host-boundary.md':
    'ADR 008 — core owns cache rebuild policy; CLI and IDE hosts pass adapters without forking delta logic.',
  'architecture/decisions/009-share-hosted-snapshot-contract.md':
    'ADR 009 — hosted share upload contract: payload hash dedup, force replace, and non-interactive CI gates.',
  'architecture/decisions/010-locale-layout-and-metadata-modes.md':
    'ADR 010 — locale directory layout modes, metadata sidecars, and strip-vs-preserve conflict rules.',
  'architecture/decisions/011-runtime-neutral-sdk-host-model.md':
    'ADR 011 — runtime-neutral core with host adapters for Node, web, and edge filesystem/env bindings.',
  'architecture/decisions/template.md':
    'ADR template — context, decision, and consequences format for architecture records in docs.',
  'architecture/tree.md':
    'Monorepo layout map — packages, apps, docs mirror, and how CLI, core, and hosts relate.',
  'architecture/extraction/README.md':
    'How i18nprune discovers translation calls from source text, dynamic vs literal keys, and known limits.',
  'architecture/extraction/dynamic.md':
    'Dynamic translation keys use non-literal first arguments — reported, not enumerated, by static analysis.',
  'architecture/extraction/regex.md':
    'Regex-based extraction rules, per-file const maps, and conservative limits vs full TypeScript semantics.',
  'cli/verbosity.md':
    'Global --json, --quiet, and --silent flags — what each suppresses on stderr and when the banner stays.',
  'cli/prompts.md':
    'When the CLI prompts on TTY, how --json and CI disable confirmations, and which commands gate on stdin.',
  'cli/cache.md':
    'CLI disk cache under the tool home directory — profiles, rebuild modes, and separation from worker share storage.',
  'commands/README.md':
    'Index of i18nprune subcommands with links to per-command docs, flags, and JSON envelope parity.',
  'commands/config.md':
    'Print resolved project config, locale paths, scan roots, and active I18NPRUNE_* environment variables.',
  'commands/help.md':
    'CLI help — global usage, per-command flags, documentation links, and non-interactive reference output.',
  'onboarding/cli.md':
    'Install i18nprune from npm, create config with init, and run validate or sync in your first project.',
  'onboarding/ci.md':
    'Run validate --json in CI, gate on ok and exit codes, and keep jobs non-interactive with global flags.',
  'onboarding/README.md':
    'Shortest path into i18nprune — install, validate keys, sync locales, and link to CLI, SDK, or hosted flows.',
  'config/cache.md':
    'Cache profile and rebuild settings — reuse analysis, locale deltas, and when full rescans run.',
  'config/locales.md':
    'Configure source locale code, locales directory, layout mode, and JSON file structure for your project.',
  'config/patching.md':
    'Patching block controls opt-in loader and i18n config updates alongside locale file mutations.',
  'config/env.md':
    'I18NPRUNE_* environment variables for provider selection, paths, cache, and non-interactive CI behavior.',
  'edge-cases/README.md':
    'Edge-case notes — solved behavior receipts and unsolved inventory for extraction and policy gaps.',
  'edge-cases/solved/cli-json-command-parity.md':
    'Which subcommands honor --json on stdout and how COMMANDS_WITH_JSON_OUTPUT keeps CLI/SDK parity.',
  'edge-cases/unsolved/inventory.md':
    'Tracked unsolved extractor and policy gaps — hook destructuring, aliases, and planned detection rules.',
  'issues/validate.md':
    'Validate issue codes — missing_literal_keys, dynamic_key_sites, and source_locale_unreadable.',
  'issues/sync.md':
    'Sync issue codes — missing locale files, metadata flag conflicts, and retained scan extras.',
  'issues/translate.md':
    'Translate and provider issue codes — credentials, unknown providers, identity streaks, and config load.',
  'issues/generate.md':
    'Generate issue codes — usage hints, empty source leaves, rate limits, and network errors.',
  'issues/cleanup.md':
    'Cleanup issue codes — uncertain path exclusions and ripgrep availability for string-presence checks.',
  'issues/doctor.md':
    'Doctor issue codes — Node runtime, ripgrep on PATH, config file presence, and locale path readiness.',
  'issues/config.md':
    'Config issue codes — missing, invalid, or unloadable i18nprune.config project files.',
  'issues/share.md':
    'Share issue codes — local cache rows, remote upload rejections, zip failures, and worker availability.',
  'issues/report.md':
    'Report issue codes — invalid export format and hosted report document parse failures.',
  'issues/missing.md':
    'Missing command issue codes — scaffold paths not seen in the current source scan.',
  'issues/quality.md':
    'Quality issue codes — english_identical_leaves parity warnings between source and targets.',
  'issues/locales.md':
    'Locales subcommand usage issue codes and CLI argument validation for list, dynamic, and delete.',
  'issues/locale.md':
    'Locale file issue codes — missing targets, placeholder leaves, and source/target leaf mismatches.',
  'issues/languages.md':
    'Languages catalog issue codes — empty filters and unsupported BCP-47 codes in generate hints.',
  'issues/patching.md':
    'Patching issue codes — config schema, size limits, catalog mismatches, and locale file alignment.',
  'issues/project.md':
    'Project workspace issue codes — config discovery, locales directory, src root, and layout validation.',
  'issues/paths.md':
    'Path and filesystem issue codes — Windows reserved names, long paths, and network drive caveats.',
  'issues/io.md':
    'IO issue codes — read failures when loading locale JSON or project files during analysis.',
  'issues/context.md':
    'Context resolution issue codes — config discovery warnings and failed project context resolution.',
  'issues/scan.md':
    'Scan issue codes — dynamic_key_sites warnings from non-literal translation call patterns.',
  'issues/cli.md':
    'CLI issue codes — invalid --json-pretty usage and root-level argument validation failures.',
  'runtime/worker.md':
    'Edge and Cloudflare Worker runtime adapters for share upload and hosted tooling on workers.i18nprune.dev.',
};

function setDescription(relPath, description) {
  const full = path.join(docsRoot, relPath);
  if (!fs.existsSync(full)) return false;
  let content = fs.readFileSync(full, 'utf8');
  if (!/^---\n/.test(content)) return false;
  const next = content.replace(/^description:.*$/m, `description: ${yamlQuote(description)}`);
  if (next === content) return false;
  fs.writeFileSync(full, next, 'utf8');
  return true;
}

function yamlQuote(value) {
  if (/^[\w .,;:!?()/'"—-]+$/.test(value) && !value.includes('  ')) {
    return value;
  }
  return JSON.stringify(value);
}

let updated = 0;
for (const [rel, desc] of Object.entries(OVERRIDES)) {
  if (setDescription(rel, desc)) updated += 1;
}
console.log(`improved ${updated} description(s)`);
