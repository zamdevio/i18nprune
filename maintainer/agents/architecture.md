# Architecture guide

How code is organized, where things live, and the rules that keep the codebase healthy.

---

## 1. Package topology

```
packages/
  core/          @i18nprune/core — domain logic, zero side effects
  cli/           i18nprune CLI — thin host (argv, prompts, banners, rendering)
  report/        Report schema (@i18nprune/report-schema)
  ui/            @i18nprune/ui — runtime cluster UI kit (web, report, worker docs shell)

apps/
  docs/          VitePress documentation site
  report/        Report SPA (reads core report payloads)
  web/           Web runtime (workspace, share)
  landing/       Marketing site (isolated UI domain)
  extension/     VS Code extension + webview (isolated UI domain)
  workers/       Cloudflare Workers (API + Swagger /docs)

examples/
  sdk/           Per-op SDK usage examples (runDoctor, runGenerate, …)

tests/
  integration/   CLI behavior tests against fixture
  parity/        Byte-identical snapshot gates
  fixtures/      Sample i18n apps
```

**Rule:** Domain logic lives in `packages/core/`. The CLI is a host — it calls core and renders. If you're writing business logic, it goes in core. If you're writing UI (prompts, colors, banners, spinners), it goes in CLI.

---

## 2. Core purity contract

These are absolute — no exceptions:

- **No `console.*`** in `packages/core/src/**`.
- **No `process.*`** in core — environment comes via the passed-in `env` parameter.
- **No direct file IO** in core — all reads/writes go through `RuntimeAdapters` (`ctx.adapters.fs`, `ctx.adapters.path`).
- **No default-resolving adapters** — core never auto-creates `createNodeRuntimeAdapters()`. The host always supplies adapters explicitly.

---

## 3. The `runXxx` pattern

Every operation has a single core entry:

```
packages/core/src/<op>/run.ts    →  export function runXxx(ctx, opts, host?)
packages/core/src/<op>/index.ts  →  barrel: re-exports run.ts + types
```

**Signature:** `runXxx(ctx: CoreContext, opts: XxxRunOptions, host?: XxxHostHooks)`

- `ctx` — bundled config + adapters + env + paths + run options (built via `createCoreContext`)
- `opts` — per-call parameters (target, flags, limits)
- `host` — optional host callbacks (emit, runId, decision hooks)
- **Returns** `{ payload, issues }` — the op's JSON-shaped result

**CLI wiring:** The CLI builds `CoreContext` via `createCliCoreContext(cliCtx)`, calls `runXxx`, then renders the result and shapes the `--json` envelope.

Current ops: `runGenerate`, `runSync`, `runMissing`, `runCleanup`, `runQuality`, `runReview`, `runValidate`, `runReport`, `runDoctor`, `runDynamic`, `runLocalesList`, `writeLocaleMetaEdit`, `deleteLocaleFiles`, `runShare`, `runShareList`, `runShareView`, `runShareDelete`.

---

## 4. Type layout

All public types live under `packages/core/src/types/<domain>/`:

```
types/
  generate/index.ts      CoreContext, GenerateOptions, GenerateOutput, …
  translator/index.ts    TranslateContext, TranslateOptions, TranslateOutput, …
  doctor/                doctorFinding.ts, doctorRun.ts, index.ts
  json/                  envelope/, path/, stringLeaf/, index.ts
  shared/run/index.ts    RunEmitter, RunEvent, OperationId, …
  …
```

**Rules:**

- Each domain gets `types/<domain>/index.ts` as its barrel.
- Split into sibling files (`doctorFinding.ts`, `doctorRun.ts`) when the barrel would be too large — the barrel re-exports them.
- No single-file domains at the root (not `types/errors.ts` — use `types/errors/index.ts`).
- Runtime modules use `import type` from `types/` barrels — never duplicate exported shapes beside implementation files.
- CLI never re-exports core types via shim files.

---

## 5. Barrel and namespace design

**Op barrels** (`packages/core/src/<op>/index.ts`):

- Re-export the `runXxx` function from `run.ts`
- Re-export types from `../types/<op>/index.js`
- No logic — barrel only

**Namespace barrels** (`packages/core/src/namespaces/<name>.ts`):

- Thin re-export files for subpath exports (e.g. `@i18nprune/core/doctor`)
- Map to `package.json` `exports` field entries

**Root barrel** (`packages/core/src/index.ts`):

- Public API surface — flat exports + namespace re-exports
- Every new op adds its exports here

---

## 6. Import discipline

- **ESM only** — `"type": "module"` throughout.
- `**.js` extensions** on all relative imports (TypeScript `moduleResolution: NodeNext`).
- `**import type`** for type-only imports — keeps runtime bundles clean.
- **No circular imports** — verified by `madge:circular` (see § 8).
- **Cross-package imports** use the package name (`@i18nprune/core`), never relative paths across package boundaries.

---

## 7. CLI as thin host

The CLI owns **only**:

- **argv parsing** — Commander options, env overlay
- **Prompts** — interactive confirmations, locale detail entry
- **Banners** — styled command headers
- **Rendering** — human summary printing, progress bars, ANSI styling
- `**--json` envelope** — wrapping core's `{ payload, issues }` into `CliJsonEnvelope`
- **Exit codes** — mapping core results to `process.exitCode`
- **Logger** — `logger.info/warn/err/detail` with policy gates (`json`/`quiet`/`silent`)

The CLI must **not**:

- Duplicate operation message copy that core already emits via `run.message` events
- Own business logic that should live in a `runXxx` entry
- Define types that belong in `packages/core/src/types/`

---

## 8. Health gates

Required and diagnostic commands (`typecheck`, `test`, `knip`, `madge`, `empty:*`, `empty:*:del`): **[`maintainer/systems/health.md`](../systems/health.md)**.

Knip config and ignore catalog: **[`maintainer/systems/knip.md`](../systems/knip.md)**.

**Before commit:** `pnpm typecheck` + `pnpm test`. If you changed module structure or barrels, also run `pnpm madge:circular` and `pnpm knip`.

---

## 9. Issue code lifecycle

Every new `issues[]` code must be wired in three places in one change:

1. **Constant** — `packages/core/src/shared/constants/issueCodes.ts`
2. **Docs** — `docs/issues/README.md` (registry row + section)
3. **Emitter** — the command or helper that produces the issue

Issue codes are **stable API** — never rename existing codes even when display copy changes.

---

## 10. Cross-surface parity

i18nprune ships one behavior across four surfaces:


| Surface                              | Owner                             |
| ------------------------------------ | --------------------------------- |
| CLI human output                     | `packages/cli/`                   |
| `--json` (`CliJsonEnvelope`)         | `packages/cli/`                   |
| Report artifacts (HTML/CSV)          | `apps/report/` + `packages/core/` |
| Programmatic SDK (`@i18nprune/core`) | `packages/core/`                  |


When changing core behavior, verify impact on all surfaces. Parity snapshot tests (`tests/parity/`) gate refactors.

---

## 11. UI domains

Three UI domains; only the **runtime cluster** uses `@i18nprune/ui`:

| Domain | Paths | `@i18nprune/ui` |
|--------|-------|-----------------|
| Marketing | `apps/landing` | **Never** |
| Editor host | `apps/extension/src/webview` | **Never** |
| Runtime cluster | `apps/web`, `apps/report`, worker `/docs` shell | **Yes** |

**Purity rule:** If a component requires domain imports (`@i18nprune/core`, worker clients, routing, share/report logic), it does **not** belong in `packages/ui`. `@i18nprune/core` must never import `@i18nprune/ui`.

**Canonical detail:** [`maintainer/systems/ui.md`](../systems/ui.md) · enforcement: `pnpm ui:purity`.