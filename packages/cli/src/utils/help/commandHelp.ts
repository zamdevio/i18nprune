import { CLI_NAME } from '@/constants/cli.js';
import type { CommandHelpExtra } from '@/types/help/index.js';
import { getCommandInvocationPath } from '@/utils/cli/path.js';
import type { Command } from 'commander';

const NOTE_CONFIG = 'Global -c / --config selects the project config file for this run.';
const NOTE_JSON = 'Use global -j when this command supports machine-readable output.';
const NOTE_LIST = 'Human list rows respect global -T / -F (default 3 unless --full).';
const NOTE_DRY_RUN = 'Preview with -n or --dry-run before writing files.';
const NOTE_TARGET = 'Scope with -t / --target or command-specific target flags.';
const NOTE_KITS = 'Kits read-only reports; global -j controls JSON envelope shape on supported subcommands.';

/** Invocation path keys (e.g. `validate`, `kits identical`, `locales list`). */
const COMMAND_HELP_EXTRAS: Record<string, CommandHelpExtra> = {
  init: {
    examples: [
      `${CLI_NAME} init`,
      `${CLI_NAME} init --rich`,
      `${CLI_NAME} init --auto --yes`,
      `${CLI_NAME} init --preset next-intl -c ./apps/web/i18nprune.config.ts`,
    ],
    related: ['config', 'validate', 'doctor'],
    notes: ['Use -y / --yes for non-interactive bootstrap in CI.'],
  },
  config: {
    examples: [`${CLI_NAME} config`, `${CLI_NAME} config -j`, `${CLI_NAME} config -c apps/web/i18nprune.config.ts`],
    related: ['doctor', 'init', 'providers'],
    notes: [NOTE_CONFIG, NOTE_JSON],
  },
  validate: {
    examples: [
      `${CLI_NAME} validate`,
      `${CLI_NAME} validate -j`,
      `${CLI_NAME} validate -T 5`,
      `${CLI_NAME} validate -c apps/web/i18nprune.config.ts`,
    ],
    related: ['sync', 'generate', 'kits honest', 'locales dynamic'],
    notes: [NOTE_CONFIG, NOTE_JSON, NOTE_LIST],
  },
  missing: {
    examples: [
      `${CLI_NAME} missing --dry-run`,
      `${CLI_NAME} missing --target ar`,
      `${CLI_NAME} missing --target ar,ja --dry-run`,
    ],
    related: ['validate', 'sync', 'generate'],
    notes: [NOTE_DRY_RUN, NOTE_TARGET],
  },
  sync: {
    examples: [
      `${CLI_NAME} sync --dry-run --target ar`,
      `${CLI_NAME} sync --metadata --target ar`,
      `${CLI_NAME} sync --target ar --strip-metadata`,
      `${CLI_NAME} sync --target all -T 1`,
    ],
    related: ['validate', 'generate', 'missing', 'patch'],
    notes: [NOTE_DRY_RUN, NOTE_TARGET, NOTE_LIST],
  },
  generate: {
    examples: [
      `${CLI_NAME} generate --metadata --target ar --dry-run`,
      `${CLI_NAME} generate --metadata --target ar --dry-run -T 1`,
      `${CLI_NAME} generate --metadata --target ar`,
      `${CLI_NAME} generate --metadata --target ar --resume`,
      `${CLI_NAME} generate --metadata --target ar --resume --provider llm`,
      `${CLI_NAME} generate --force --metadata --target ar`,
    ],
    related: ['sync', 'validate', 'quality', 'providers'],
    notes: [NOTE_DRY_RUN, NOTE_TARGET, NOTE_JSON, NOTE_LIST],
  },
  quality: {
    examples: [`${CLI_NAME} quality`, `${CLI_NAME} quality --target ar`, `${CLI_NAME} quality -j -T 10`],
    related: ['review', 'generate', 'kits identical'],
    notes: [NOTE_TARGET, NOTE_JSON, NOTE_LIST],
  },
  review: {
    examples: [`${CLI_NAME} review`, `${CLI_NAME} review --target ar`, `${CLI_NAME} review -j`],
    related: ['quality', 'validate', 'kits identical'],
    notes: [NOTE_TARGET, NOTE_JSON],
  },
  cleanup: {
    examples: [
      `${CLI_NAME} cleanup --dry-run`,
      `${CLI_NAME} cleanup --rg --target ar`,
      `${CLI_NAME} cleanup --ask-per-key`,
    ],
    related: ['validate', 'missing', 'sync'],
    notes: [NOTE_DRY_RUN, NOTE_TARGET],
  },
  languages: {
    examples: [`${CLI_NAME} languages`, `${CLI_NAME} langs --filter arabic`, `${CLI_NAME} languages -T 20`],
    related: ['generate', 'locales list', 'config'],
    notes: [NOTE_LIST],
  },
  providers: {
    examples: [`${CLI_NAME} providers`, `${CLI_NAME} providers -j`],
    related: ['generate', 'config', 'doctor'],
    notes: [NOTE_JSON],
  },
  locales: {
    workflows: [
      'Inspect files          locales list',
      'Dynamic key sites      locales dynamic',
      'Remove target JSON     locales delete --target <code>',
    ],
    notes: ['Subcommands are read-only except locales delete.'],
  },
  'locales list': {
    examples: [`${CLI_NAME} locales list`, `${CLI_NAME} locales list -T 5`, `${CLI_NAME} locales list -F`],
    related: ['languages', 'sync', 'validate'],
    notes: [NOTE_LIST],
  },
  'locales dynamic': {
    examples: [
      `${CLI_NAME} locales dynamic`,
      `${CLI_NAME} locales dynamic -T 10`,
      `${CLI_NAME} locales dynamic -F`,
    ],
    related: ['validate', 'kits dynamic', 'cleanup'],
    notes: [NOTE_LIST],
  },
  'locales delete': {
    examples: [
      `${CLI_NAME} locales delete --target ar`,
      `${CLI_NAME} locales delete --target ar --ask`,
    ],
    related: ['sync', 'cleanup', 'locales list'],
    notes: [NOTE_TARGET, 'Destructive — use --ask on a TTY for an extra confirmation.'],
  },
  kits: {
    workflows: [
      'PR audit markdown      kits pr -o pr.md',
      'Combined signal        kits honest --strict',
      'Source-identical rows  kits identical -t ar',
      'Dynamic sites          kits dynamic -cn dashboard',
      'Baseline snapshot      kits baseline -sb baseline.json',
    ],
    notes: [NOTE_KITS, NOTE_LIST],
  },
  'kits dynamic': {
    examples: [
      `${CLI_NAME} kits dynamic`,
      `${CLI_NAME} kits dynamic -cn useTranslation`,
      `${CLI_NAME} kits dynamic -mxdy 50 --strict`,
      `${CLI_NAME} kits dynamic -o dynamic.md`,
    ],
    related: ['locales dynamic', 'validate', 'kits honest'],
    notes: [NOTE_KITS, NOTE_LIST],
  },
  'kits identical': {
    examples: [
      `${CLI_NAME} kits identical`,
      `${CLI_NAME} kits identical -t ar`,
      `${CLI_NAME} kits identical -t ar -F`,
      `${CLI_NAME} kits identical --raw`,
      `${CLI_NAME} kits identical --strict`,
    ],
    related: ['quality', 'review', 'generate', 'kits honest'],
    notes: [NOTE_KITS, NOTE_LIST],
  },
  'kits honest': {
    examples: [
      `${CLI_NAME} kits honest`,
      `${CLI_NAME} kits honest -t ar --strict`,
      `${CLI_NAME} kits honest -fcs dashboard -o honest.md`,
    ],
    related: ['validate', 'kits pr', 'quality'],
    notes: [NOTE_KITS, NOTE_LIST],
  },
  'kits baseline': {
    examples: [
      `${CLI_NAME} kits baseline`,
      `${CLI_NAME} kits baseline -sb snapshots/baseline.json`,
      `${CLI_NAME} kits baseline -b snapshots/baseline.json`,
    ],
    related: ['kits honest', 'kits pr'],
    notes: [NOTE_KITS],
  },
  'kits pr': {
    examples: [
      `${CLI_NAME} kits pr`,
      `${CLI_NAME} kits pr -o pr.md`,
      `${CLI_NAME} kits pr -fcs router --strict`,
      `${CLI_NAME} kits pr -sb pr-baseline.json`,
    ],
    related: ['kits honest', 'validate', 'report'],
    notes: [NOTE_KITS, NOTE_LIST],
  },
  share: {
    workflows: [
      'Upload project         share upload --project',
      'Upload report JSON     share upload --report --from report.json',
      'List local cache       share list',
    ],
    notes: ['Requires worker URL env or --worker-url on upload/view/delete.'],
  },
  'share upload': {
    examples: [
      `${CLI_NAME} share upload --project`,
      `${CLI_NAME} share upload --report --from ./report.json`,
    ],
    related: ['report', 'share list', 'doctor'],
    notes: ['Pass --project or --report; omit both only on an interactive TTY.'],
  },
  'share list': {
    examples: [`${CLI_NAME} share list`, `${CLI_NAME} share list --project <id>`],
    related: ['share upload', 'share view', 'doctor'],
    notes: ['Reads upload rows from share.json beside the project cache.'],
  },
  'share view': {
    examples: [
      `${CLI_NAME} share view --project <id>`,
      `${CLI_NAME} share view --report <id> -v`,
    ],
    related: ['share list', 'share upload', 'report'],
    notes: ['Fetches live worker metadata for a hosted id.'],
  },
  'share delete': {
    examples: [
      `${CLI_NAME} share delete --project <id>`,
      `${CLI_NAME} share delete --report <id> --local-only`,
    ],
    related: ['share list', 'share view', 'doctor'],
    notes: ['Use -lo / --local-only to drop cache metadata without worker DELETE.'],
  },
  report: {
    examples: [
      `${CLI_NAME} report`,
      `${CLI_NAME} report --format json --out report.json`,
      `${CLI_NAME} report --from ./cached-report.json`,
    ],
    related: ['validate', 'share upload', 'kits pr'],
    notes: [NOTE_JSON, 'Use --from to render a saved project report JSON without rescanning.'],
  },
  patch: {
    examples: [`${CLI_NAME} patch`, `${CLI_NAME} patch --fix`, `${CLI_NAME} patch --init`, `${CLI_NAME} patch --top 10`],
    related: ['sync', 'generate', 'doctor'],
    notes: ['Analyze first; use --fix to apply suggested metadata corrections.'],
  },
  doctor: {
    examples: [`${CLI_NAME} doctor`, `${CLI_NAME} doctor --strict`, `${CLI_NAME} doctor -j`],
    related: ['config', 'init', 'providers'],
    notes: [NOTE_JSON, 'Read-only diagnostics — use --strict to fail on warnings.'],
  },
  version: {
    examples: [`${CLI_NAME} version`, `${CLI_NAME} -V`, `${CLI_NAME} version --check`],
    related: ['doctor', 'help'],
  },
  help: {
    examples: [
      `${CLI_NAME} help`,
      `${CLI_NAME} help generate`,
      `${CLI_NAME} help locales dynamic`,
      `${CLI_NAME} help kits identical`,
    ],
  },
};

function appendSection(lines: string[], header: string, body: string[]): void {
  if (!body.length) return;
  lines.push('', header);
  for (const line of body) lines.push(`  ${line}`);
}

/** Raw appendix for Commander formatHelp (before colorize). */
export function formatCommandHelpExtras(cmd: Command, rootName: string): string {
  const path = getCommandInvocationPath(cmd, rootName);
  const extra = COMMAND_HELP_EXTRAS[path];
  if (!extra) return '';

  const lines: string[] = [];
  appendSection(lines, 'Workflows:', extra.workflows ?? []);
  appendSection(lines, 'Examples:', extra.examples ?? []);
  appendSection(
    lines,
    'Related:',
    extra.related?.length ? [extra.related.join('  ·  ')] : [],
  );
  appendSection(lines, 'Notes:', extra.notes ?? []);
  return lines.length ? lines.join('\n') : '';
}
