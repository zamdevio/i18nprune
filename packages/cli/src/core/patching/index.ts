/**
 * Opt-in auto-patching for recognised loader + config layouts (ADR 004).
 *
 * - Patching runs only when enabled in config and a **named recipe** matches.
 * - Recipes are documented with required file paths, identifiers, and shapes.
 *
 * @see docs/patching/README.md
 * @see docs/architecture/decisions/004-auto-patch.md
 */
export type { PatchingRecipeId } from '@/types/core/patching/index.js';

/** Whether any patching recipe is configured (future: read from resolved config). */
export function isPatchingEnabled(): boolean {
  return false;
}
