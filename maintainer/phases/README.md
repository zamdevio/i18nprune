# Phases — maintainer hub (repo only; **not** on docs site)

Planning for core contributors. **`docs/`** is what **`pnpm docs:sync`** mirrors into **`apps/docs/content/`**; this folder is **`maintainer/phases/`** outside `docs/`, so it **never ships** with the public site.

**Rules:** [`docs/agents/rules.md`](../../docs/agents/rules.md#phase-docs-maintainerphases) · scratch: **`maintainer/temp/`** (gitignored — see [`maintainer/README.md`](../README.md))

---

## Start here — v1

**→ [`V1-RELEASE.md`](../V1-RELEASE.md)**

**Active sprint tweaks:** [`active-phase.md`](./active-phase.md)

---

## Shipped reference

[`shipped-slices.md`](./shipped-slices.md)

---

## Index (open / reference docs)

See sessions in **`../V1-RELEASE.md`** and topic files here (`providers.md`, `standard-toolkit.md`, `extension/`, …).

---

## Lifecycle

1. Prefer **one hub** (**[`V1-RELEASE.md`](../V1-RELEASE.md)**) for sequencing; **`active-phase.md`** for sprint narrative.
2. When closing a slice, update or stub the topic file here; duplicate long histories in **`docs/`** user pages is discouraged.
3. Session noise → **`maintainer/temp/`** only (never commit).
