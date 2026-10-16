# `providers` — command system sheet

## Status

- **Stability:** stable
- **Last reviewed:** systems tree bootstrap

## CLI entry

- **`runProviders`:** `packages/cli/src/commands/providers/jsonEnvelope.ts`
- **Human:** `packages/cli/src/commands/providers/run.ts`

## Core & shared

- Provider registry / help payload from `@i18nprune/core` translator providers.
- **Provider id single source of truth:** `packages/core/src/shared/constants/providers.ts`
  (`TRANSLATION_PROVIDER_IDS` tuple → `TranslationProviderId` type → `isTranslationProviderId` guard).
  The zod enum (`config/schema/translate.ts`), handoff order (`translator/policy/handoff.ts`), the
  registry guards, and the cache validator (`translator/cache/l2Io.ts`) all derive from it.

## Bundled credentials (why a key is in source)

`brave` ships with a **hardcoded** `BRAVE_TRANSLATE_DEFAULT_KEY`
(`shared/translator/providers/brave/index.ts`). That is deliberate, not an oversight:

- It is Brave's **public widget key** — the value Brave's own `te_lib` translate client embeds in
  pages. It has been observed as the **same value across Brave desktop, iOS, and other platforms**,
  i.e. one key shared by every Brave translate client install, not a per-user secret.
- Brave validates it at their edge (`403` when absent/mismatched), and the `brave` backend exists so
  `translate` works **without any user setup** — the same out-of-box posture as `google` gtx.

**Consequences to keep in mind:** because one key is shared by all users, Brave may **rotate or block
it at any time**, and when that happens **every install breaks at once** (not one user's). That is why
the default rate limits for `brave` are conservative (`DEFAULT_PROVIDER_RATE_LIMITS.brave`) and why
the override path — `I18NPRUNE_TRANSLATE_BRAVE_KEY` (wins) or the `brave` row's `key` — must stay
documented and wired. User-facing copy lives in `docs/config/translate.md`; do not restate key values
there beyond the override instructions.

`brave` is **unofficial** — it is not a public Brave API. Treat the bundled key as a convenience
default and the backend as a fallback, not a production dependency.

## Frozen API

- **`--json`** providers list payload.
