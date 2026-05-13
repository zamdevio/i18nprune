# Agent rules

- **TypeScript** — `moduleResolution: NodeNext`; imports use `.js` extensions.
- **CLI orchestration** — parse argv into typed options, build `Context` with `resolveContext()`, keep command files thin.
- **Output contract** — respect `RunOptions` gates (`json`/`quiet`/`silent`), use `logger` for terminal output, keep JSON payloads structured and stable.
- **Non-interactive safety** — `--json` and CI/non-TTY flows must not prompt; fail fast with actionable errors.
- **Types location (CLI)** — move reusable/public type contracts to `packages/cli/src/types/**` and re-export from nearest type barrel and `packages/cli/src/types/index.ts` where needed.
- **`i18nprune/core` types (mandatory layout)** — all public TS types for the core package live under `packages/core/src/types/**`:
  - **No** single-file domains at the root of `types/` (e.g. not `types/errors.ts`). Use **`types/<domain>/index.ts`** as the barrel and add sibling `*.ts` files in that folder when splitting helps (e.g. `types/policies/preserve.ts` + `parity.ts` → `types/policies/index.ts`).
  - **JSON types** use `types/json/path/`, `types/json/envelope/`, `types/json/stringLeaf/`, aggregated by `types/json/index.ts`.
  - **Nested `types/<a>/<b>/`:** add only when **`src/<a>/<b>/`** introduces **distinct** public types that do not fit cleanly in `types/<a>/index.ts`. If types can **blend** into the parent barrel (clarity maintained), **omit** the child `types/` folder to avoid empty or redundant barrels. Runtime `src/languages/catalog/**` uses **`types/languages/index.ts`** only when catalog has no separate type surface.
  - When a new major operation lands as `src/<operation>/`, add **`types/<operation>/`** only when it exports **new** type contracts; otherwise extend an existing `types/*` domain.
  - Runtime modules import **`import type`** from `types/...`; do not define duplicate public shapes next to implementation files.
  - **Canonical layout:** mirror existing domains under `packages/core/src/types/**` and [`docs/agents/analysis.md`](./analysis.md); align exported barrels with `packages/core/package.json` `exports`.
- **No runtime-owned exported types** — if a type is exported from a runtime module, move it to `packages/cli/src/types/**` and import it back as `import type`.
- **Core APIs** — prefer richer shared functions over wrappers (example: `resolveKeyPlaceholdersWithTrace()`); avoid duplicate logic paths.
- **Extractor robustness** — parse and bound translation call spans (`t(...)`) before key inspection; support multiline calls and inline/block comments.
- **Tests** — colocated unit tests in `packages/cli/src/**/__tests__/`; CLI behavior coverage in `tests/integration/`.
- **Static hygiene tools (recommended)** —
  - Run **`pnpm knip`** from repo root for dead-code/dead-dependency scans (unused exports, files, deps, scripts).
  - Use **`madge`** checks when touching module topology/import boundaries to catch cycles and graph drift early.
  - Keep these as *diagnostic* tools that inform cleanup slices; do not bundle broad hygiene churn into unrelated behavior PRs.
- **Issue-code lifecycle (must stay in sync)** — every new CLI `issues[]` code must be wired in all three places:
  1. `packages/cli/src/constants/issueCodes.ts` (stable constant),
  2. `docs/issues/README.md` (registry row + dedicated section),
  3. emitting command/helper path (usually `core/result/cliEnvelopeIssues.ts` or command-specific JSON envelope).
  Prefer constant imports over inline strings in command code.
- **Cross-surface contract** — one core behavior must remain consistent across surfaces:
  - CLI (human output),
  - JSON (`CliJsonEnvelope` for CI),
  - HTML/report artifacts,
  - programmatic exports (`i18nprune/core`).
  If behavior changes in one surface, verify parity expectations in docs and tests for the others.

---

## Maintainer planning (`maintainer/**`) {#phase-docs-maintainerphases}

For **repository collaborators only**: sequencing hubs & scratch processes live outside **`docs/`**.

1. **Scratch & spikes** — use **`maintainer/temp/`** locally (**gitignored**). Promote anything worth keeping into **`docs/`**, ADRs, or focused phase Markdown—never commit scratch.
2. **Sessions / sequencing** — follow **`maintainer/phases/V1-RELEASE.md`** plus narrative in **`maintainer/phases/active-phase.md`**.
3. **Public docs** — keep user-visible explanations authoritative under **`docs/`**; avoid leaking contributor-only files into reader-facing pages unless necessary.

Hub: **`maintainer/README.md`** · phase index **`maintainer/phases/README.md`**.
