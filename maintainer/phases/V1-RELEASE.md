# v1 release — work remaining

**Sprint narrative:** [`active-phase.md`](./active-phase.md) · **Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md) · **Systems maps:** [`systems/README.md`](../systems/README.md)

**Pre-publish gate:** [`final.md`](./final.md) — delete that file after tagging.

---

## Remaining sequence

| Step | Session | Doc | Status |
|------|---------|-----|--------|
| **1** | **XP — Cross-platform** | [`cross-platform.md`](./cross-platform.md) | **Active** — CLI + SDK + all disk caches on Win/macOS/Linux/WSL |
| **2** | **Tree — Naming & layout** | [`tree.md`](./tree.md) | **Planned** — logic/type/test parity; no behavior changes |
| **3** | **D — Docs** | [`docs-refactor.md`](./docs-refactor.md) | Nav trim (~10 categories), SDK quickstart, tree flattening |
| **4** | **E + G — Release** | [`final.md`](./final.md) | CI smoke, ADR polish, changelog, delete `final.md` |

---

## Session XP — Cross-platform (**active**)

Prove and harden **CLI** + **`@i18nprune/core` SDK** on Windows, macOS, native Linux, and WSL.

**Disk surfaces to audit:** version cache (`updatestate.json`), project cache (`files.json`, `analysis.json`), translate L2 (`translations/*.json`), share local (`share.json`). See [`systems/cache.md`](../systems/cache.md).

**Tracker:** [`cross-platform.md`](./cross-platform.md) (XP-0…XP-7).

---

## Session Tree — Naming & layout (**planned**)

Repo tree standardization after XP. **Plan:** [`tree.md`](./tree.md).

---

## Session D — Docs

**Plan:** [`docs-refactor.md`](./docs-refactor.md)

| Slice | What |
|-------|------|
| **D.0** | **Onboarding hub** — `docs/onboarding/` chooser + CLI / SDK / CI / hosted paths; contributors → maintainer onboarding link |
| **D.1** | Root `README.md` rewrite (problem-first; points at onboarding hub) |
| **D.2** | Docs nav trim (~10 top-level groups; **Start** promotes onboarding paths) |
| **D.3** | SDK quickstart (`docs/sdk/`) |
| **D.4** | Tree flattening (**keep** `docs/report/README.md`) |
| **D.5** | Sidebar + VitePress build validation |
| **D.6** | Disk cache user docs — relocate off `docs/cli/cache.md` per docs-refactor |

---

## Session E — Release

Execute [`final.md`](./final.md). Gates: `pnpm typecheck`, `pnpm test`, `pnpm vitest run tests/parity`, `pnpm docs:build`, fixture smoke.

---

## CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — `pnpm typecheck` · `pnpm test` · `pnpm vitest run tests/parity`

---

## Post-v1 (do not block)

| Item | Pointer |
|------|---------|
| **Extension** | [`extension/README.md`](./extension/README.md) |
| **Extractor** future hardening | [`extractor.md`](./extractor.md) |
| `translate.policy.routing: 'auto'` | post-v1 optional |
