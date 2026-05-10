# `examples/`

Programmatic SDK examples for `@i18nprune/core`. Each example is a standalone script you can run from the repo root with `pnpm tsx examples/sdk/<op>/<file>.ts`. They are typechecked with the rest of the repo via the root `tsconfig.json` so they never go stale.

## Available examples

| Op | Path | Status |
| --- | --- | --- |
| `generate` | [`sdk/generate/runGenerate.ts`](sdk/generate/runGenerate.ts) | ✅ ready |
| `translate` (primitive) | `sdk/translate/runTranslate.ts` | ⏳ post-translate-policy |
| `fill` | _folded into `generate --resume`_ | n/a (deleted) |
| `sync` | `sdk/sync/runSync.ts` | ⏳ after sync migration to core |
| `missing` | `sdk/missing/runMissing.ts` | ⏳ after missing migration to core |
| `cleanup` | `sdk/cleanup/runCleanup.ts` | ⏳ after cleanup migration to core |
| `quality` | `sdk/quality/runQuality.ts` | ⏳ after quality migration to core |
| `review` | `sdk/review/runReview.ts` | ⏳ after review migration to core |
| `validate` | `sdk/validate/runValidate.ts` | ⏳ after validate migration to core |

Examples are added **as each op finishes its core migration**. The locked order in `maintainer/phases/core-architecture.md` is: `generate` → `translate-policy` → other ops. Each new core op gets its example shipped in the **same slice** as the op's migration, so the SDK contract is always documented alongside the code.

## Per-op example contract

Every example must:

1. **Compile** under the root `tsconfig.json` (no separate tsconfig). The `examples/**/*.ts` glob is included; just write `.ts`.
2. **Run as `pnpm tsx examples/sdk/<op>/<file>.ts`** from repo root, with no API keys for the public path. Use `mymemory` for translate / generate; mock or skip for ops that need paid providers.
3. **Show, top to bottom, in this exact order**:
   1. Build `RuntimeAdapters` (explicit; never auto-default).
   2. Load config + project files via the adapters.
   3. Build the L2 context for the op (`CoreContext`, `TranslateContext`, etc.).
   4. Implement a **headless** version of every required host-hook surface (no TTY, no `console`, log-to-stderr).
   5. (Optional) Implement run-hook overrides showing the most useful policy choice.
   6. Call the L3 entry (`runGenerate`, `runTranslate`, …) with `dryRun: true` by default.
   7. Inspect the returned payload + issues.
4. **Default to non-destructive** — `dryRun: true` (or equivalent), no real writes unless the user flips a flag.
5. **Have a sibling `README.md`** with: what it shows, files in the directory, run command, key takeaways.
6. **Use only public exports** from `@i18nprune/core` and the relevant `@i18nprune/core/runtime/<kind>`. No reaching into deep paths.
7. **Be commented for SDK consumers**, not for maintainers — explain why each step exists, not what each line does.

## Adding a new op example

When a new op finishes its core migration:

1. Create `examples/sdk/<op>/`.
2. Copy `examples/sdk/generate/` as the structure template (config + locales + script + README).
3. Adjust the script to call the new L3 entry. Keep section comments aligned with the contract above.
4. Add the row to the table in this README and bump the status to `ready`.
5. Verify `pnpm typecheck` is clean. Verify `pnpm tsx examples/sdk/<op>/<file>.ts` runs without API keys.

The example ships in the **same PR** as the op's migration slice — never a follow-up.
