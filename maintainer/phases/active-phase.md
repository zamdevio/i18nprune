# Active sprint

**v1 consolidated plan:** **[`V1-RELEASE.md`](./V1-RELEASE.md)** — use first for sequencing.

**Narrative focus:** **Extractor hardening (Session C)** — false-positive reduction in `packages/core/src/extractor/`. After that: apps rework (C.2) → docs (D) → landing (D.2) → release polish (E). Hub overview: **`maintainer/phases/README.md`**.

---

## Guiding rules (standard-toolkit aligned)

- **CI-first contract:** treat `validate --json` + stable `issues[]` codes as the default machine gate.
- **Structured observability:** i18n state is structured data; keep human and JSON surfaces in parity.
- **Opt-in mutation only:** never patch user project files implicitly; destructive/project-changing behavior must be explicit.
- **Small sharp iterations:** prefer narrow, testable improvements over broad speculative rewrites.
- **Edge-case honesty:** record unresolved tradeoffs in `docs/edge-cases/unsolved/inventory.md` quickly.

---

## Extractor hardening (**Session C — active**)

**Docs:** [`extractor.md`](./extractor.md) (§0).

Pure logic work: tighten call-site parsing to reject prose false positives while preserving real commented-call detection. Add regression tests.

---

## Apps rework (**Session C.2**)

Update `apps/web` and `apps/workers/i18nprune` to work with current core API after Session A/A.2 migrations.

---

## Docs (**Session D**)

**Plan:** [`docs-refactor.md`](./docs-refactor.md) (scoped to v1-essential items).

Target: ~10 top-level nav categories. Root README rewrite. SDK quickstart. Tree flattening.

---

## Foundation tracks (ordering)

| Track | Status | Doc |
|-------|--------|-----|
| **v1 sessions (ordered)** | **Use first** | **[`V1-RELEASE.md`](./V1-RELEASE.md)** |
| **Core-op migrations** | **Shipped — Session A.2** | [`shipped-slices.md`](./shipped-slices.md) |
| **Extractor hardening** | **Active — Session C** | [`extractor.md`](./extractor.md) |
| **Patching backlog** | **Post-v1** | [`docs/patching/README.md`](../../docs/patching/README.md) |
| **Standard toolkit** | **Parallel** | [`standard-toolkit.md`](./standard-toolkit.md) |

---

## Recently shipped (historical pointers)

Baseline CLI slices + exports parity: **[`shipped-slices.md`](./shipped-slices.md)**

**2026-05 (core-op migrations):**

- **All ops migrated** to core `runXxx` entries — CLI is thin host. `core-architecture.md` plan deleted (fully shipped).
- **Doctor:** `runDoctor` core entry. SDK example at `examples/sdk/doctor/runDoctor.ts`.
- **Report:** `runReport` core entry with environment snapshot injection.
- **Locales:** `runDynamic`, `runLocalesList`, `writeLocaleMetaEdit`, `deleteLocaleFiles`.
- **Cache:** Sub-folder reorganization (`io/`, `setup/`), circular dependency elimination, `baselineFiles` mechanism.
- **Agents:** Reconstructed `maintainer/agents/` — `architecture.md`, `jsdoc.md`, `rules.md`, `git.md`.
