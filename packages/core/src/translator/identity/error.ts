/**
 * Thrown when the streak guard decides not to proceed (cap reached + non-interactive, or
 * the user declined the confirm prompt). The host catches this, prints a friendly notice,
 * and surfaces a structured `i18nprune.translate.identity_streak_abort` issue.
 */
export class IdentityAbortError extends Error {
  constructor(
    public readonly command: string,
    public readonly target: string,
    public readonly threshold: number,
    public readonly count: number,
    public readonly path: string,
  ) {
    super(
      `${command}: aborted after ${String(count)} consecutive source-identical translations for ${target} (threshold: ${String(threshold)}, latest: ${path})`,
    );
    this.name = 'IdentityAbortError';
  }
}
