# Phases — maintainer hub

**Not on docs site** — `maintainer/phases/` is contributor-only.

---

## Start here

| Doc | Role |
|-----|------|
| [`active-phase.md`](./active-phase.md) | **Current sprint focus** (post-v1: extension) |
| [`shipped-slices.md`](./shipped-slices.md) | Closed slices — **ISO week timeline**; check before re-implementing |

Scratch / spikes: **`maintainer/temp/`** (gitignored).

---

## Active work

| Doc | Status |
|-----|--------|
| [`extension/README.md`](./extension/README.md) | **Next vertical** — VS Code extension (`apps/extension/`) |

**Shipped reference (future hardening, not blockers):**

| Doc | Role |
|-----|------|
| [`extractor.md`](./extractor.md) | Session C.1 shipped — extractor improvements + inventory links |
| [`extension/`](./extension/) | Extension specs (execute per extension README) |

**Systems maps (engineering truth):** [`systems/README.md`](../systems/README.md) — `cache.md`, `share.md`, `extractor.md`, …

---

## Lifecycle

1. Scope from the **active plan doc** only — one slice per PR.
2. Close slices in [`shipped-slices.md`](./shipped-slices.md) under the matching **ISO week**; sync [`apps/git/scripts/phases.config.json`](../../apps/git/scripts/phases.config.json); fold durable notes into [`systems/`](../systems/).
3. Session noise → **`maintainer/temp/`** only.
4. **Publish / tag:** checklist in [`agents/git.md`](../agents/git.md) (no separate phase file).
