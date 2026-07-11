import { style } from '@/utils/style/index.js';

const WORKFLOW_LINES = [
  'New project bootstrap     init → validate → sync → generate --target <loc>',
  'Fix MT sentinel leaks       validate → sync --metadata --target <loc> → generate --resume --metadata --target <loc>',
  'Refresh stale translations  quality → generate --resume --metadata --target <loc>',
  'Audit before PR             kits honest → kits pr -o pr.md',
  'CI read-only gate           validate -j · kits pr --strict',
  'Locale shape only           sync --dry-run --target <loc>',
  'Share report snapshot       report --format json --out report.json → share upload --report --from report.json',
] as const;

/** Root help only — appended in configureCliHelp.formatHelp. */
export function formatWorkflowAppendix(): string {
  const lines = [
    '',
    style.bold(style.magenta('Workflows:')),
    ...WORKFLOW_LINES.map((line) => `  ${style.dim(line)}`),
    '',
  ];
  return lines.join('\n');
}
