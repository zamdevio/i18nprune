/** Shared human-readable patching workflow hints (CLI-only). */

export const PATCH_INSPECT_THEN_FIX =
  'Run "i18nprune patch" to inspect issues, then "i18nprune patch --fix" to apply automatic fixes.';

export const PATCH_FIX_METADATA = 'Run "i18nprune patch --fix" to apply suggested config.json corrections.';

export const PATCH_RENEW_CLI_FILES =
  'If config.json or loaders.generated.ts looks corrupt or out of date, run "i18nprune patch --init --force" to renew only those two CLI-owned files.';

export function patchingNotAppliedMessage(command: string): string {
  return `patching (${command}): not applied this run (pass --patch on the command to apply loader updates). ${PATCH_INSPECT_THEN_FIX}`;
}
