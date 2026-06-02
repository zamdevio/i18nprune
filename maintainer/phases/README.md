# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`final.md`](./final.md) | **Release checklist** (current gate) |
| [`active-phase.md`](./active-phase.md) | **Current sprint focus** |
| [`shipped-slices.md`](./shipped-slices.md) | Closed slices — check before re-implementing |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Open work

| Doc | Status |
|-----|--------|
| [`final.md`](./final.md) | Pre-publish gate (delete after release) |

**Reference (shipped, future work):** [`extractor.md`](./extractor.md) · **Extension:** [`extension/README.md`](./extension/README.md)

**Systems maps (engineering truth):** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped-slices.md`](./shipped-slices.md); fold durable notes into [`systems/`](../systems/).
3. Session noise → **`maintainer/temp/`** only.
