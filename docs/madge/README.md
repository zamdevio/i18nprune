# Dependency graph analysis (Madge)

This page explains how we use **[Madge](https://www.npmjs.com/package/madge)** on **`packages/core`** so advanced users and maintainers can **reproduce** the same structural checks and understand what they mean.

Madge answers: **“How are my TypeScript modules wired together?”** It does **not** replace a **bundler** or **Worker** graph audit. For **import surfaces**, host tiers, and **shipping** checks (bundle / `node:` boundaries), use **[Runtime (host adapters)](../runtime/README.md)**.

## Why this exists

- **`packages/core`** is meant to stay **acyclic**, **layered**, and easy to refactor as runtime adapters are threaded through operations (see the runtime hub when ready).
- Publishing **how** we verify the graph signals **engineering discipline**, not vanity metrics: readers can run the same commands and get the same guarantees.
- A clean graph makes **splitting** or **moving** modules (for example leaf utilities or future packages) **predictable**.

## Install

From the repository root (dev dependency is typical):

```bash
pnpm add -D madge
```

Or use **`npx madge`** without installing.

## Commands we care about

Run from the **repository root**. The entry file is the **public** core barrel:

```bash
madge packages/core/src/index.ts --circular
madge packages/core/src/index.ts --leaves
madge packages/core/src/index.ts --orphans
```

Optional: visualize the graph (large on big trees):

```bash
madge packages/core/src/index.ts --image graph-core.svg
```

Optional: see **who imports** a given module (useful when tracing a boundary):

```bash
madge packages/core/src/index.ts --depends path/to/module.ts
```

## `--circular`

**Meaning:** reports **import cycles** reachable from the entry. Cycles force awkward initialization order, confuse bundlers, and make refactors risky.

**What we want:** **no cycles** from `packages/core/src/index.ts`.

**Example (healthy):**

```text
✔ No circular dependency found!
```

If this fails, treat it as a **release blocker** until the cycle is broken or the entry scope is narrowed.

## `--leaves`

**Meaning:** modules that **nothing else in the analyzed graph imports** (from the perspective of the entry and its reachable files).

**How to read them:**

- Many **`types/*`** and **`shared/constants/*`** leaves are **expected**: pure types and small constants are not re-export hubs.
- **Extractor** and **review** leaves often indicate **small, focused units** at the bottom of the tree — good candidates for tests, moves, or reuse.
- Leaves are **not** “bad”; they are usually **stable leaves** of a layered design.

They are also practical **extraction points** if you split packages later: fewer inbound edges means less breakage when moving a file.

## `--orphans`

**Meaning:** modules **reachable from the entry** that **no other analyzed file imports** — most often the **entry file itself**.

For a **library** whose `index.ts` exists mainly to **re-export** a curated public API, seeing **only** `index.ts` as the orphan is **expected**: internals import each other; consumers import the barrel.

It confirms a pattern like:

```text
internal modules → layered graph
        ↓
   index.ts (public surface)
```

## What this does **not** prove

| Madge shows | It does **not** automatically show |
|-------------|-----------------------------------|
| Static **TypeScript** import graph from an entry | What a **Worker** or **browser** bundle **resolves** after tree-shaking and `package.json` **exports** |
| Absence of cycles | Absence of **`node:`** in a given **publish path** |

So: **graph hygiene** and **runtime / bundle hygiene** are **related** but **not identical**. After adapters land on the paths you ship to web/edge, add **CI** checks that fail on forbidden **`node:`** imports for those entry graphs — see **[docs/runtime/README.md](../runtime/README.md)**.

## Optional: CI gate

To fail the build when a cycle appears (example pattern):

```bash
madge packages/core/src/index.ts --circular || exit 1
```

Wire that into your pipeline once you are comfortable with flakiness (graph size, timeouts) and any intentional exceptions.

## Scope note

Examples above use **`packages/core/src/index.ts`** as the **library entry**. For the **CLI** or other packages, point Madge at **their** entry files instead; the same flags apply, the interpretation of “orphan” may differ (apps often have multiple roots).

## See also

- [Architecture overview](../architecture/README.md) — layers and data flow.
- [Project tree](../architecture/tree/README.md) — where `packages/core` sits in the repo.
- [Runtime (host adapters)](../runtime/README.md) — adapters, tiers, bundle / Worker safety notes.
