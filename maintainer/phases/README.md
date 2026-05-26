# Phases — maintainer hub (repo only; **not** on docs site)

Planning for core contributors. **`docs/`** is what **`pnpm docs:sync`** mirrors into **`apps/docs/content/`**; this folder is **`maintainer/phases/`** outside `docs/`, so it **never ships** with the public site.

**Rules:** [`docs/agents/rules.md`](../../docs/agents/rules.md#phase-docs-maintainerphases) · scratch: **`maintainer/temp/`** (gitignored — see [`maintainer/README.md`](../README.md))

---

## Start here — v1

**→ [`V1-RELEASE.md`](./V1-RELEASE.md)** (includes **recommended order:** init **F** (**shipped** core + CLI) → locales **H** → apps **C.3** → docs **D** → …)

**Locked vertical order:** [`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain) (extractor → init → locales → **cache** → translate-cache → extension)

**Active sprint tweaks:** [`active-phase.md`](./active-phase.md)

---

## Shipped reference

[`shipped-slices.md`](./shipped-slices.md)

---

## Index (open / reference docs)

| Doc | Status |
|-----|--------|
| [`extractor.md`](./extractor.md) | **Active** — JS/TS extractor improvement plan (false-positive hardening, future languages) |
| [`cache.md`](./cache.md) | **Shipped (H-cache)** — Phases 0–4 (incremental analysis + invalidate policy); user copy: [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| [`apps.md`](./apps.md) | **Active (C.3+)** — open: worker `runReport` row **9**, metadata polish **W** (report row **8** shipped) |
| [`standard-toolkit.md`](./standard-toolkit.md) | **Active** — CLI toolkit conventions |
| [`final.md`](./final.md) | **Gate** — one-time pre-publish checklist (delete after release) |
| [`V1-RELEASE.md`](./V1-RELEASE.md) | **Hub** — ordered v1 sessions |
| [`docs-refactor.md`](./docs-refactor.md) | **Active** — v1-scoped docs nav reduction + SDK quickstart |

**Shipped verticals** (init, locales, translate-cache, UI kit): receipts in [`shipped-slices.md`](./shipped-slices.md) — phase checklists removed after close. **UI rules:** [`maintainer/systems/ui.md`](../systems/ui.md). **JSDoc how-to:** [`maintainer/agents/jsdoc.md`](../agents/jsdoc.md).

---

## Lifecycle

1. Prefer **one hub** (**[`V1-RELEASE.md`](./V1-RELEASE.md)**) for sequencing; **`active-phase.md`** for sprint narrative **and** the **locked** extractor → init → locales → extension chain (**[§ Locked cross-phase dependency chain](./active-phase.md#locked-cross-phase-dependency-chain)**).
2. When closing a slice, update or stub the topic file here; duplicate long histories in **`docs/`** user pages is discouraged.
3. Session noise → **`maintainer/temp/`** only (never commit).
