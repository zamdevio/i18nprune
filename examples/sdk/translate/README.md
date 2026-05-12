# `runTranslate` SDK Example

Programmatic use of `@i18nprune/core`'s `runTranslate` primitive from a Node script. This entry point translates strings or keyed leaves directly, without an `I18nPruneConfig`, locale directory, source JSON, or file writes.

## What This Example Shows

1. Building `RuntimeAdapters` explicitly with `createNodeRuntimeAdapters()`.
2. Authoring a translate-block config for the public Google backend.
3. Building a `TranslateContext` (config + adapters + env).
4. Implementing optional observation hooks for progress, provider attempts, and translated leaves.
5. Calling `runTranslate(ctx, opts)` with keyed leaves.
6. Reading ordered `translations`, route stats, warnings, and issues.

## Files

- `runTranslate.ts` — the example, top-to-bottom commented.

## Run It

From the repo root:

```bash
pnpm tsx examples/sdk/translate/runTranslate.ts
```

The example uses the public Google web-translate backend, so it needs network access but no API key.

## Key Takeaways

- **No project context is required.** Use `createTranslateContext`, not `createCoreContext`.
- **Adapters and env are explicit.** Core never auto-selects Node and never reads `process.env` directly.
- **Hooks are optional.** They observe translation progress; they are not a required host interface.
- **Output preserves input order.** Use keyed `leaves` when you want each result to echo a stable key.
- **Whitespace-only inputs are skipped.** The primitive returns a `skipped` result without calling the provider for those items.
