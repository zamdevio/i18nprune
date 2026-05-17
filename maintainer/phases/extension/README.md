# Phase — VS Code extension

**Status:** **Planned** — execute only after explicit scheduling.  
**Implementation home:** **`apps/extension/`** (this monorepo).  
**Planning home:** **`maintainer/phases/extension/`** (this file + sibling `*.md` specs).

**Prerequisite:** stable **`@i18nprune/core`**, CLI **`--json`** contracts, and the locked vertical order on core (see **[`../active-phase.md`](../active-phase.md)** — extractor → init → locales before release-grade extension work).

Update **[`apps/extension/README.md`](../../../apps/extension/README.md)** when the **workspace** entrypoints or scope blurbs change; keep **deep** sequencing and rules **here**.

---

## Philosophy

### One intelligence core, many hosts

- **`@i18nprune/core`** owns detection, analysis, caching rules, and normalized outputs.
- **CLI, VS Code extension, and future hosts** are thin: orchestration, presentation, and platform APIs (filesystem, editor, webview).

The extension does **not** re-implement i18n truth. It consumes **normalized, versioned** data from core and maps it to VS Code UX.

---

## Architectural rules (non-negotiable)

| Rule | Rationale |
|------|-----------|
| **Core owns intelligence; extension owns UX** | Single source of truth; no drift between CLI and editor. |
| **No hover-time workspace scans** | Hover callbacks must be lookup-only over in-memory state. |
| **One workspace intelligence layer** | Hydrate once, watch incrementally, serve fast reads — all consumers attach here. |
| **Core owns detection** | Call patterns, key resolution, locale graphs — not re-derived in the extension with parallel regex engines. |
| **Extension consumes normalized data** | Shapes defined by core; extension maps to `MarkdownString`, diagnostics, webview props. |
| **Incremental updates only** | Invalidation scoped by dependency graph; avoid full rebuild on every keystroke. |
| **No duplicated parsing** | No extension-owned “second indexer” that contradicts core. Doc-level hints (e.g. cursor → string span) may exist only as **presentation aids** keyed off core’s catalog, not a second truth. |

---

## Upstream dependency (core before extension)

Extension implementation assumes this order on the **core** side:

```txt
core extractor
  ↓
core init
  ↓
core locales
  ↓
extension implementation (this repo)
```

The extension **must not** rely on behaviors core does not explicitly guarantee. If a capability is missing, extend **core** first (or defer the extension slice).

---

## Phase index and status

Status values: **planned** | **in progress** | **done** | **blocked** | **deferred**

| Phase | Document | Status | Depends on (conceptual) |
|-------|----------|--------|-------------------------|
| Monorepo home | [apps/extension/README.md](../../../apps/extension/README.md) | **done** | Extension sources under **`apps/extension/`** |
| Foundation | [foundation.md](./foundation.md) | planned | Minimal stable core surface for project binding; core **extractor** trajectory |
| Core integration | [core-integration.md](./core-integration.md) | planned | Foundation; documented core entrypoints + `CoreContext` / paths story |
| Workspace intelligence | [workspace-intelligence.md](./workspace-intelligence.md) | planned | Foundation; **core integration** checklist; core **locales** + normalized project model |
| Generate (dashboard) | [generate.md](./generate.md) | planned | Foundation; **core integration**; stable **`runGenerate`** + host hooks (can parallel early WI if context-only) |
| Hover | [hover.md](./hover.md) | planned | Workspace intelligence |
| Diagnostics | [diagnostics.md](./diagnostics.md) | planned | Workspace intelligence; **after** hover patterns prove noise levels |
| Init UI | [init-ui.md](./init-ui.md) | planned | Foundation; core **init** APIs (`runInit`, `--json` parity) |
| Completions | [completions.md](./completions.md) | planned | Workspace intelligence |
| Dashboard | [dashboard.md](./dashboard.md) | planned | Workspace intelligence; **Generate** tab in [generate.md](./generate.md) |
| Performance | [performance.md](./performance.md) | planned | Diagnostics + real usage data (informs budgets) |
| Post-MVP backlog | [post-mvp.md](./post-mvp.md) | deferred | Hover / diagnostics / Generate maturity |

**Sequencing note:** Hover and diagnostics both need the intelligence layer; diagnostics follow **hover** so key-at-cursor semantics and confidence thresholds are learned before widening to squiggles.

**Generate** can proceed once `CoreContext` + `runGenerate` contracts are ready; it does **not** strictly block on full workspace intelligence if the host only needs config-scoped runs (see [generate.md](./generate.md)).

---

## How to use this hub

1. Read **this README** for rules, gates, and phase order.  
2. Open the **phase doc** you are implementing (sibling `*.md` in this folder).  
3. Align any new core requirement with **Upstream dependency** before coding the extension.  
4. Update the **phase index** table when a phase truly moves (keep honest).

**Build from repo root** (delegates to **`apps/extension/package.json`** scripts): `pnpm ext:web:dev`, `pnpm ext:web:build`, `pnpm ext:compile`, `pnpm ext:watch`, `pnpm ext:build`.

### Topic quick map

| Topic | Phase doc |
|-------|-----------|
| Source-of-truth core paths, SDK `runGenerate` example, API shape (`GenerateHostHooks` required) | [core-integration.md](./core-integration.md) |
| Checklist before tightening `@i18nprune/core` (paths, cancellation, envelopes, multi-root, tests, release) | [core-integration.md](./core-integration.md) |
| Generate dashboard tab, IPC, host hooks, implementation slices, non-goals | [generate.md](./generate.md) |
| Interactive diff, multi-language editor, project breadcrumbs | [post-mvp.md](./post-mvp.md) (deferred) |
| Architecture / hover / diagnostics / completions / performance / foundation / dashboard / init UI | Matching sibling `*.md` in this folder |

### When you implement

1. Open the relevant **`maintainer/phases/extension/<name>.md`**.  
2. Align with **[core-integration.md](./core-integration.md)** for any core call.  
3. Bump status in the **phase index** table above and in that phase file when work moves.

---

## Out of scope (planning set)

- Concrete TypeScript interfaces (belong in core or ADRs when implementation starts).
- Feature creep beyond what each phase doc states.

---

## Positioning (product)

**“ESLint for i18n”** in the editor: surface missing keys, dynamic call sites where the model allows, and **links to docs** — same engine as CI, not a second translation system.

## Why a separate phase

A VS Code extension is **distribution**, not core CLI behavior. It must call **`core`** and/or the **`i18nprune`** binary so results match [validate](../../../docs/commands/validate/README.md) and [JSON output](../../../docs/json/README.md).

## Goal

An extension that **does not fork** i18n semantics: diagnostics and commands must match **`validate`**, **`doctor`**, and documented JSON payloads. Optional distribution (Marketplace / Open VSX) comes **after** local dogfooding and automated tests.

---

## Phase gates (do not skip)

| Gate | Requirement |
|------|---------------|
| **G1 — Contract** | Extension reads the same merged config and cwd rules as the CLI (document failure modes: missing config, multi-root). |
| **G2 — Execution** | One supported path: **spawn CLI** with workspace folder `cwd` *or* in-process **`core`** with `tryResolveContext` — pick one for v1 and document it; no mixed behavior without tests. |
| **G3 — JSON** | If using CLI: parse **`--json`** stdout per [JSON output](../../../docs/json/README.md) (line-oriented, multi-document awareness). If using `core`: use `runValidate` / etc. — same envelope. |
| **G4 — Tests** | Automated tests run in CI: at minimum unit tests for argument building + fixture workspace; optional integration test with **VS Code test host** once commands exist. |
| **G5 — Failure UX** | Clear error when CLI binary missing or wrong version; link to [workflow](../../../docs/workflow/README.md) and install docs. |

---

## Implementation sequence (strict)

### Track A — Foundation (before any UI polish)

1. **Workspace layout** — `apps/extension/`: `package.json` (publisher, engines, activation), `src/extension.ts`, build producing a single `dist/`, `.vscodeignore`, license file.
2. **Configuration** — settings: `i18nprune.executablePath` (optional), `i18nprune.configPath` (optional), respect `files.watcher` / workspace trust as needed.
3. **Resolution** — resolve workspace folder(s); single-folder v1 is acceptable if documented.
4. **Runner** — `child_process.spawn` of `i18nprune` with `cwd`, forward `stdio`, capture stdout for `--json` lines; Windows + POSIX tested in CI or documented matrix.
5. **Smoke command** — one palette command: **“Run validate (JSON)”** → output channel shows parsed summary (`ok`, `kind`, issue count) or raw JSON on parse failure.

### Planned — Init / onboarding (editor host; after Session F)

**Prerequisite:** stable **`@i18nprune/core`** init surface (`runInit`, `detectInitProject`, `INIT_PRESET_IDS` / `formatInitPresetIdList`) and CLI **`init --json`** parity (same `CliJsonEnvelope`, issue codes, no duplicate heuristics in the host). See **[`../init.md`](../init.md)**. Phase detail: **[init-ui.md](./init-ui.md)**.

**Placement:** after **Track A** smoke path is reliable (workspace `cwd`, JSON capture); can ship before full **Track B** diagnostics — onboarding is orthogonal to `validate` diagnostics.

| Id | Task |
|----|------|
| **I1** | **Execution (G2/G3)** — Same pattern as other commands: in-process **`runInit`** *or* spawn **`i18nprune init --json`** with workspace folder `cwd`; parse envelope / issues; never fork preset scoring in extension code. |
| **I2** | **UX** — Command or walkthrough: show **`preset`** / **`detection`** when useful; on ambiguous auto, offer preset quick-pick (**`generic` first**, same order as CLI); apply **`proposedConfigSource`** only after explicit confirm (no silent writes). |
| **I3** | **Optional** — Richer surface (webview) for scored factors; link to docs for `i18nprune.init.*` issue codes. |

### Track B — Trust surface

6. **Diagnostics (optional v1.1)** — map `validate --json` issues to `vscode.Diagnostic` (file + range); behind setting `i18nprune.enableDiagnostics`.
7. **Status bar** — last run exit code + timestamp; click opens output channel.

### Track C — Hardening

8. **Version check** — compare CLI `--version` (or package) against supported range; warn in output channel.
9. **Telemetry off by default** — if any, opt-in only.

### Track D — Distribution (after A–C green)

10. **Packaging** — `.vsix` build script, changelog, README for marketplace.
11. **Publish** — Open VSX and/or Visual Studio Marketplace per org policy.

---

## Explicit non-goals until Track B is stable

- Full **Language Server** / incremental sync across all files.
- **CodeLens** on every string literal.
- Bundling a duplicate copy of `core` with divergent behavior.

---

## Quick links

| Doc | Role |
|-----|------|
| [Programmatic API](../../../docs/json/programmatic.md) | `run*` helpers vs CLI `--json` |
| [`docs/exports/README.md`](../../../docs/exports/README.md) | Published API tiers |

---

## See also

- [JSON output (`--json`)](../../../docs/json/README.md) · [Command orchestration](../../../docs/commands/orchestration/README.md)
- **[`../init.md`](../init.md)** · **[`../locales.md`](../locales.md)** — core verticals the extension must not get ahead of.
