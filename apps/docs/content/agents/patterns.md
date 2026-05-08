# Agent patterns

Use these patterns when changing CLI behavior or core extractors.

- **Command shape**: parse options in `packages/cli/src/commands/*`, call `resolveContext()`, delegate logic to `packages/cli/src/core/*`, then print human summary and/or JSON.
- **Core first**: shared behavior belongs in `packages/cli/src/core/*` and `packages/cli/src/utils/*`; command files should orchestrate only.
- **Machine-safe mode**: when `--json` is supported, avoid interactive prompts and keep output deterministic.
- **Reports**: append structured entries with `pushReportEntry`, then finalize once with `finalizeReportFile`.
- **Extractor layering**: literal/template observations live in `packages/cli/src/core/extractor/keySites/`; heuristic dynamic detection lives in `packages/cli/src/core/extractor/dynamic/`.
- **Call-bound scanning**: parse exact `t(...)` call spans first, then inspect only the first argument expression. Do not scan unrelated lines above/below the matched call.
- **Multiline preservation**: when calls span multiple lines, preserve that metadata (`isMultilineCall`) in scanner outputs so reports can surface complexity instead of flattening it away.
- **Const resolution**: use `resolveKeyPlaceholdersWithTrace()` for template placeholder substitution; consume `.resolved` for behavior and `.substitutions` for diagnostics.
- **Types placement (CLI)**: public and reusable types go under `packages/cli/src/types/**`; runtime modules import those types instead of defining duplicate local shapes.
- **Types placement (`i18nprune/core`)**: follow the **`i18nprune/core` types** bullets in [`rules.md`](./rules.md); implementation modules **`import type`** from `packages/core/src/types/**` barrels—never duplicate exported shapes beside runtime files.
- **Issue and docs coupling pattern**: when a new `Issue.code` is added, do the implementation and docs update in the same change set (constant + emit path + `docs/issues/README.md` section + relevant command docs links).
- **Surface parity pattern**: treat CLI, `--json`, report artifacts, and core exports as one product. If changing behavior in one surface, add at least one verification point for each impacted surface (test, docs snippet, or web-page linkage).

When adding new scanner or extraction features, preserve this direction: richer core data models first, thin CLI adapters second.
