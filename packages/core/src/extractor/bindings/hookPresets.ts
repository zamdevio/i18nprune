/**
 * Framework hook → local helper bind table for extractor `fast` depth (HOC §A).
 *
 * @remarks Kept out of `calls.ts` — presets drive local-name expansion only.
 * Module source strings are not required; evidence is a runtime **named** import
 * of the hook identifier (any package).
 */

export type HookHelperPreset = {
  /** Imported / local hook names that participate in this preset. */
  readonly hooks: readonly string[];
  /** Locals bound from destructuring / direct assign of the hook call. */
  readonly binds: readonly string[];
};

/** Shipped presets — react-i18next / next-i18next / next-intl style. */
export const HOOK_HELPER_PRESETS: readonly HookHelperPreset[] = [
  { hooks: ['useTranslation'], binds: ['t'] },
  { hooks: ['useTranslations'], binds: ['t'] },
] as const;

/** Flat set of hook identifiers covered by {@link HOOK_HELPER_PRESETS}. */
export function hookNamesFromPresets(presets: readonly HookHelperPreset[] = HOOK_HELPER_PRESETS): Set<string> {
  const out = new Set<string>();
  for (const p of presets) {
    for (const h of p.hooks) out.add(h);
  }
  return out;
}
