# Phase: Core integration

**Status:** planned  
**Goal:** Pin and document how this extension **binds to `@i18nprune/core`** — contracts, paths, cancellation, payloads — **before** shipping heavier features (Generate tab, tighter WI coupling).

This phase is **cross-cutting**: it supports Foundation, Generate, and later Workspace intelligence without duplicating TODO.md in two places.

---

## Source-of-truth references (core monorepo)

These live outside this repo; treat them as authoritative for core behavior:

| Reference | Purpose |
|-----------|---------|
| `~/i18nprune/maintainer/phases/core-architecture.md` | Locked architecture: phased refactor, `runTranslate` / `runGenerate` layering, parity rules, adapter rules. |
| `~/i18nprune/examples/sdk/generate/runGenerate.ts` | Working reference: minimal headless `GenerateHostHooks`, `createCoreContext`, **`runGenerate(ctx, opts, host, hooks?)`**. |

**API shape note:** Maintainer markdown may show a shorter `(ctx, opts)` for readability. The **implemented public API** requires a third argument **`GenerateHostHooks`** (and optional `GenerateRunHooks`). Mirror the **SDK example**, not pseudo-code alone.

---

## Checklist: before tightening integration

Use this as a gate before treating core as “locked” for extension work:

1. **Pin the integration surface** — Document which exports the extension relies on (`runGenerate`, `createCoreContext`, `createNodeRuntimeAdapters`, config loaders, envelope builders). Treat semver bumps on those surfaces as regression-test triggers.

2. **`CoreContext` requires `paths`** — `createCoreContext({ config, adapters, env, paths, run? })` expects **`CoreResolvedPaths`**: `sourceLocale`, `localesDir`, `srcRoot` (absolute). Same pattern as the SDK example and CLI `resolveContext`; extension derives these from loaded `I18nPruneConfig` + `projectRoot` (mirror validate path resolution).

3. **Cancellation** — Long runs (`generate`, future ops) accept **`CancellationToken`** from commands / webview-triggered work; cooperative cancel between targets when core supports it.

4. **Single envelope / payload shapes** — Prefer **`GenerateRunResult`** (`payload: GenerateJsonPayload`, `issues`) to the webview over ad hoc objects so Monitor / Generate stay aligned with CLI `--json`.

5. **Multi-root** — Document current behavior (e.g. first folder) or add an explicit root picker **before** assuming paths for all workspaces.

6. **Tests worth adding early** — Snapshot parsing / IPC helpers (`parseDashboardSnapshot`, generate IPC handlers once added); optional fixture `GenerateJsonPayload` → UI mapping.

7. **Release hygiene** — Publisher / displayName / `engines`; optional documented **minimum `@i18nprune/core` version** in README or phase notes.

---

## Dependencies

- **Foundation** — workspace binding, settings, logging exist enough to call core safely.
- **Core** — Extractor / project binding stable enough that `paths` resolution is not guesswork.

---

## Relationship to other phases

| Consumer | How core-integration helps |
|----------|------------------------------|
| [generate.md](generate.md) | `runGenerate`, hooks, IPC payloads — must follow this checklist. |
| [workspace-intelligence.md](workspace-intelligence.md) | Same boundary module; WI reads normalized core outputs, not ad hoc shapes. |
| [dashboard.md](dashboard.md) | Webview receives envelopes defined here, not one-off DTOs. |

---

## Non-goals

- Implementing Generate UI (see [generate.md](generate.md)).
- Defining new core APIs here — request them in core, then update this checklist.
