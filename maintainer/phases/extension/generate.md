# Phase: Generate (dashboard + host)

**Status:** planned  
**Goal:** First-class **Generate** experience in the dashboard (view tab / route pattern aligned with Monitor and other views), driven by core **`runGenerate`** — extension host owns execution; webview owns controls and display.

**Does not require** full [workspace-intelligence.md](workspace-intelligence.md) if the only need is `CoreContext` + config from workspace — but results and progress must still follow **core-integration.md** rules (envelopes, cancellation, no duplicate orchestration in the webview bundle).

---

## What core already provides (contract summary)

| Piece | Role |
|-------|------|
| **`runGenerate(ctx, opts, host, hooks?)`** | L3 entry; reads/writes locale files via adapters; returns **`GenerateRunResult`** (`payload`, `issues`). |
| **`createCoreContext`** | Bundles `config`, `adapters`, **`env`**, **`paths`**, optional **`run`** flags. |
| **`createNodeRuntimeAdapters()`** | From `@i18nprune/core/runtime/node` — passed explicitly (no hidden defaults in core). |
| **`runTranslate`** | String-level primitive; optional later for “quick translate snippet” UX — **Generate page uses `runGenerate` first**. |
| **`GenerateHostHooks`** | Progress, session tick, identity guard, **prompts** (`promptMetaLocaleDetails`, `promptFullRetranslate`), logging. Extension implements VS Code–hosted or headless variant (SDK + CLI `hooks.ts` as references). |
| **`GenerateRunHooks`** | Optional `onIncomplete`, `onHandoffPick` — map to dialogs or safe defaults. |

---

## Architecture (efficient, minimal hacks)

1. **Extension host owns execution** — Load config + build `CoreContext` in Node (reuse workspace config load + **core-integration** path resolution). Call **`runGenerate`** only from the extension host, not inside the webview bundle.

2. **IPC contract** — Webview sends e.g. `runGenerate` with user choices: `targets[]`, `dryRun`, `metadata`, `resume`, optional provider/worker pins. Extension responds with **`generateFinished`** (serialized `GenerateRunResult` or slim summary + paths) and **`generateProgress`** (map host progress / session ticks to small UI messages).

3. **Headless host baseline** — Start from `examples/sdk/generate/runGenerate.ts`: e.g. `shouldSkipInteractivePrompts: () => true`; replace prompts with `vscode.window.showQuickPick` / `showInputBox` when interactive prompts are allowed, matching CLI semantics without TTY.

4. **Cancellation** — Wire `CancellationToken` from command/task into the run; partial results via `issues` / payload as core defines.

5. **Dashboard integration** — Nav item + route (same tab/stage pattern as other dashboard views). Surface: target multi-select (from config `locales` / catalog), toggles (dry-run, metadata, resume), run button, results from **`payload.targetResults`**, optional links to written files.

6. **Secrets / env** — Providers read credentials from **`env`** in context; document API keys in user env or future Secret Storage — no secrets in webview.

---

## Suggested implementation slices

1. Extension module: **resolve `CoreResolvedPaths`** from workspace + loaded config (shared helper with validate).
2. **IPC** + thin wrapper **`runGenerateForWorkspace(opts, token)`** implementing **`GenerateHostHooks`** (headless first, VS Code prompts second).
3. Webview **Generate** view: controls + progress + results list.
4. Polish: open generated file, reveal folder, debounce double-runs.

---

## Dependencies

- [core-integration.md](core-integration.md) — pinned surface, paths, cancellation, payloads.
- **Foundation** — commands, webview registration, message routing.
- **Core** — stable `runGenerate` + host hook contract.
- [dashboard.md](dashboard.md) — shell and navigation; this phase defines the **Generate** vertical inside it.

---

## Explicit non-goals (v1)

- Reimplementing provider loops or file IO in the webview.
- Parity with every CLI banner/cursor behavior — match **`GenerateJsonPayload`** and user-visible outcomes instead.

---

## Related implementation anchors (this repo)

When work starts, expect touchpoints under:

- Workspace config + `projectRoot` (see workspace module naming in repo).
- Validate workspace pattern: core + adapters + workspace root.
- Dashboard webview: message handlers for generate IPC.

*(Exact paths may drift; grep for `runValidate` / dashboard IPC patterns.)*
