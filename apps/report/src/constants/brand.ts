import { CLI_NAME } from './cli.js';

/** Header line in the report shell (keep **`index.html` `<title>`** in sync manually — see `packages/cli/src/constants/cli.ts` JSDoc). */
export const REPORT_SHELL_BRAND = `${CLI_NAME} · Report` as const;

export function reportPageTitle(toolVersion: string): string {
  return `${CLI_NAME} report · v${toolVersion}`;
}
