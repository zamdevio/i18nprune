# v1 release — work remaining

**Sprint narrative:** [`active-phase.md`](./active-phase.md) · **Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md) · **Systems maps:** [`systems/README.md`](../systems/README.md)

**Pre-publish gate:** [`final.md`](./final.md) — delete that file after tagging.

---

## Remaining sequence

| Step | Session | Doc | Status |
|------|---------|-----|--------|
| **1** | **XP — Cross-platform** | [`systems/platform.md`](../systems/platform.md) | **Shipped** — matrix CI on `main` |
| **2** | **Tree — Naming & layout** | [`shipped-slices.md`](./shipped-slices.md) | **Shipped** — T0–T10 (core + CLI); apps shim cleanup `96aed18` |
| **3** | **CI — GitHub Actions** | [`ci.md`](./ci.md) | **Shipped** — split verify, PR annotations, nightly arch, artifacts, Turborepo change detection |
| **4** | **D — Docs** | [`docs-refactor.md`](./docs-refactor.md) | **Active** — nav trim (~10 categories), SDK quickstart, tree flattening |
| **5** | **E + G — Release** | [`final.md`](./final.md) | CI smoke, ADR polish, changelog, delete `final.md` |

---

## Session XP — Cross-platform (**shipped**)

Prove and harden **CLI** + **`@i18nprune/core` SDK** on Windows, macOS, native Linux, and WSL.

**Disk surfaces to audit:** version cache (`state/version.json`), project cache (`files.json`, `analysis.json`), translate L2 (`translations/*.json`), share local (`share.json`). See [`systems/cache.md`](../systems/cache.md).

**Map:** [`systems/platform.md`](../systems/platform.md).

---

## Session Tree — Naming & layout (**shipped**)

Repo tree standardization after XP — **shipped** (T0–T10 core + CLI). Apps: non-barrel type shims cleared (`96aed18`); no further `apps/*` tree pass for v1 — receipt [`shipped-slices.md`](./shipped-slices.md).

---

## Session CI — GitHub Actions (**shipped**)

**Plan:** [`ci.md`](./ci.md) · **Map:** [`systems/ci.md`](../systems/ci.md)

| Slice | What |
|-------|------|
| **CI-1** | Split `verify` into typecheck · cli:build · test · parity jobs + `needs:` DAG — **shipped** |
| **CI-2** | Vitest PR annotations (`github-actions` reporter) — **shipped** |
| **CI-3** | Nightly knip + madge (non-blocking) — **shipped** |
| **CI-4** | Upload CLI dist debug artifacts (Windows / failure) — **shipped** |
| **CI-5** | Turborepo affected pipeline + docs-only scope — **shipped** |

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

## CI (workflow)

**Shipped:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — job DAG typecheck → cli-build → test → parity (3-OS matrix). Nightly arch: [`.github/workflows/architecture.yml`](../../.github/workflows/architecture.yml). **Receipt:** [`ci.md`](./ci.md) · [`systems/ci.md`](../systems/ci.md).

---

## Post-v1 (do not block)

| Item | Pointer |
|------|---------|
| **Extension** | [`extension/README.md`](./extension/README.md) |
| **Extractor** future hardening | [`extractor.md`](./extractor.md) |
| `translate.policy.routing: 'auto'` | post-v1 optional |
