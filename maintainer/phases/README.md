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
| [`init.md`](./init.md) | **Shipped (Session F — core + CLI)** — presets, `runInit`, `init --json`; extension host follow-ups in [`extension/README.md`](./extension/README.md) |
| [`locales.md`](./locales.md) | **Shipped (Session H)** — design reference; reader/writer; rows 0–10 done |
| [`cache.md`](./cache.md) | **Active (H-cache)** — incremental `analysis.json`; `cache.rebuild` / threshold; core-owned |
| [`translate-cache.md`](./translate-cache.md) | **Planned (H.1)** — L2 `translations.json`; **after** cache incremental; same `config.cache` |
| [`jsdoc.md`](./jsdoc.md) | **Active** — JSDoc enforcement tiers |
| [`standard-toolkit.md`](./standard-toolkit.md) | **Active** — CLI toolkit conventions |
| [`final.md`](./final.md) | **Gate** — one-time pre-publish checklist (delete after release) |
| [`V1-RELEASE.md`](./V1-RELEASE.md) | **Hub** — ordered v1 sessions |
| [`docs-refactor.md`](./docs-refactor.md) | **Active** — v1-scoped docs nav reduction + SDK quickstart |

---

## Lifecycle

1. Prefer **one hub** (**[`V1-RELEASE.md`](./V1-RELEASE.md)**) for sequencing; **`active-phase.md`** for sprint narrative **and** the **locked** extractor → init → locales → extension chain (**[§ Locked cross-phase dependency chain](./active-phase.md#locked-cross-phase-dependency-chain)**).
2. When closing a slice, update or stub the topic file here; duplicate long histories in **`docs/`** user pages is discouraged.
3. Session noise → **`maintainer/temp/`** only (never commit).
