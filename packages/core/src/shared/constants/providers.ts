/**
 * Canonical translation **provider ids** — the single source of truth for the union, the zod enum,
 * the runtime guard, and any host-side enumeration.
 *
 * The tuple is authored first; {@link TranslationProviderId} is derived from it, so a new backend
 * cannot be added to one without the other. Before this file existed there were five hand-kept copies
 * of the list (schema, cache validator, registry, handoff order, rate limits) and one of them
 * (`translator/cache/l2Io.ts`) silently went stale when `brave` was added.
 *
 * Keep this module **dependency-free**: `translator/cache/l2Io.ts` imports the guard, and the
 * registry (which statically pulls in every provider implementation) must stay out of that path.
 * The public type path remains `types/translator/providers.js`, which re-exports from here.
 */

/** Registered translation backends, in registry order. */
export const TRANSLATION_PROVIDER_IDS = [
  'google',
  'brave',
  'mymemory',
  'libre',
  'deepl',
  'llm',
] as const;

/** Registered translation backends (`resolveTranslator` may not implement every id yet). */
export type TranslationProviderId = (typeof TRANSLATION_PROVIDER_IDS)[number];

/** Narrow an arbitrary string to a registered provider id. */
export function isTranslationProviderId(value: string): value is TranslationProviderId {
  return (TRANSLATION_PROVIDER_IDS as readonly string[]).includes(value);
}
