# Active sprint

**v1 consolidated plan:** **[`V1-RELEASE.md`](./V1-RELEASE.md)** — use first for sequencing.

**Locked vertical order (extractor → init → locales → extension):** **[§ Locked cross-phase dependency chain](#locked-cross-phase-dependency-chain)** below (same file — no duplicate maintainer-root hub). **init** and **locales** are **planned** (`init.md`, `locales.md`); do not start locales core work before init alignment per [`init.md`](./init.md).

**Narrative focus:** **Apps rework (Session C.3)** and follow-on verticals — **Extractor** and **auto-patching** are **shipped** (extractor methodology in `docs/extractor/README.md`; patching in `docs/patching/`). Then: docs (D) → landing (D.2) → release polish (E). Hub overview: **`maintainer/phases/README.md`**.

**Planned verticals (post-C.1 / cross-session):** **[`init.md`](./init.md)** (Session **F**) → **[`locales.md`](./locales.md)** (Session **H**) → extension consumes stable contracts (**[`extension/README.md`](./extension/README.md)**).

---

## Locked cross-phase dependency chain

**Canonical ordering** for major verticals (v1+). Session ordering and shipped history: **[`V1-RELEASE.md`](./V1-RELEASE.md)**.

### Locked chain

```txt
extractor
    ↓
init
    ↓
locales
    ↓
extension
```

| Phase | Role | Maintainer doc |
|-------|------|----------------|
| **extractor** | Strengthens key detection and runtime-facing signals (bindings, call sites, dynamic classification). **Session C.1 shipped** — contracts are stable for **init** / **locales** / **extension**; downstream phases **must respect** extractor contracts and must not fork parallel detection “truth”. | [`extractor.md`](./extractor.md) |
| **init** | Best-in-class onboarding: **core-owned** detection + preset/config generation; **CLI and extension are hosts only**. Depends on stable **config schema** and preset model so locales can hang configuration cleanly. | [`init.md`](./init.md) |
| **locales** | Multi-topology locale **storage** via **reader/writer** abstraction; **normalized locale surface** for all existing ops. **Must not start** until **init** is aligned (schema + presets). | [`locales.md`](./locales.md) |
| **extension** | Consumes **stabilized core** APIs and payloads — **no parallel scanning/indexing truth**. May prototype early, but **release-grade** behavior assumes **init + locales** contracts are stable. | [`extension/README.md`](./extension/README.md) |

### Responsibilities (one sentence each)

- **Extractor:** what the code *says* (calls, keys, dynamic sites, bindings-derived function sets).
- **Init:** what the project *is* (framework, topology candidates, preset, generated config) — **scored heuristics**, not ad-hoc `if (lib)` trees in hosts.
- **Locales:** where strings *live* on disk (flat file vs directory trees) and how reads/writes map to the **same logical keys** ops already understand.
- **Extension:** surfaces core intelligence (hovers, diagnostics, wizards) — **hosts** only.

### Explicit boundaries

- **Preset ≠ locale mode:** presets bundle *opinionated defaults* (paths, patterns, locale layout hints, extractor defaults). Locale **mode/structure** remain explicit config concerns; see [`init.md`](./init.md) and [`locales.md`](./locales.md).
- **Locales config does not own extractor behavior:** reader/writer handle **storage**; extractor stays separate.
- **Missing-key file placement** is **not** a new config surface in v1 of this plan — **core-owned suggestions** inside the **`missing`** operation; hosts handle UX only ([`locales.md`](./locales.md) § Missing key placement).

### Risk notes

- Skipping **init** before **locales** risks churn in `CoreResolvedPaths` / config shape and double-migration pain.
- Letting **`if (mode === …)`** leak into every op **bypasses** the reader/writer contract — high regression risk; keep ops on **normalized surfaces** ([`locales.md`](./locales.md)).
- Extension shipping **before** locales stabilization invites **duplicated** filesystem intelligence in the host — explicitly **out of scope** for the agreed model.

---

## Guiding rules (standard-toolkit aligned)

- **CI-first contract:** treat `validate --json` + stable `issues[]` codes as the default machine gate.
- **Structured observability:** i18n state is structured data; keep human and JSON surfaces in parity.
- **Opt-in mutation only:** never patch user project files implicitly; destructive/project-changing behavior must be explicit.
- **Small sharp iterations:** prefer narrow, testable improvements over broad speculative rewrites.
- **Edge-case honesty:** record unresolved tradeoffs in `docs/edge-cases/unsolved/inventory.md` quickly.

---

## Extractor hardening (**Session C.1 — shipped**)

**Docs:** [`extractor.md`](./extractor.md) (§0 — design reference + shipped slice checklist C.1.1–C.1.6). User-facing methodology: [`docs/extractor/README.md`](../../docs/extractor/README.md). Unresolved tradeoffs: [`docs/edge-cases/unsolved/inventory.md`](../../docs/edge-cases/unsolved/inventory.md).

Work delivered: **import binding resolution** (alias-aware per-file `functions` expansion), **lexical hardening** (prose false-positive rejection in `shared/calls.ts`), **dynamic commented-call parity tests**, **inventory entries**, and **methodology** (`docs/extractor/README.md`, `maintainer/systems/extractor.md`).

| Slice | What | Status |
|-------|------|--------|
| **C.1.1** | Import binding resolution module (`extractor/bindings/`) | **Shipped** |
| **C.1.2** | Wire binding expansion into orchestrators | **Shipped** |
| **C.1.3** | Call-site lexical hardening (prose rejection in `shared/calls.ts`) | **Shipped** |
| **C.1.4** | Commented-call parity tests | **Shipped** |
| **C.1.5** | Edge-case inventory entries | **Shipped** |
| **C.1.6** | Extractor methodology docs (user-facing + maintainer) | **Shipped** |

---

## Apps rework (**Session C.3**)

Update **`apps/web`** and **`apps/workers/i18nprune`** (`@i18nprune/worker-i18nprune`) to match the current **`@i18nprune/core`** API after Session A/A.2 migrations. **`apps/workers/meta`** is the **`@i18nprune/worker-meta`** service (no core dependency).

---

## Docs (**Session D**)

**Plan:** [`docs-refactor.md`](./docs-refactor.md) (scoped to v1-essential items).

Target: ~10 top-level nav categories. Root README rewrite. SDK quickstart. Tree flattening. **Do not delete `docs/report/README.md`** — **report.i18nprune.dev** and cross-links rely on it (see docs-refactor § *Keep `docs/report/README.md`*).

---

## Foundation tracks (ordering)

| Track | Status | Doc |
|-------|--------|-----|
| **v1 sessions (ordered)** | **Use first** | **[`V1-RELEASE.md`](./V1-RELEASE.md)** |
| **Phase dependency chain** | **Locked** | **[§ Locked cross-phase dependency chain](#locked-cross-phase-dependency-chain)** (this file) |
| **Core-op migrations** | **Shipped — Session A.2** | [`shipped-slices.md`](./shipped-slices.md) |
| **Extractor hardening** | **Shipped — Session C.1** | [`extractor.md`](./extractor.md) |
| **Init phase (onboarding)** | **Planned — Session F** | [`init.md`](./init.md) |
| **Locales phase (multi-topology)** | **Planned — Session H** | [`locales.md`](./locales.md) |
| **Patching hardening** | **Shipped** | [`docs/patching/README.md`](../../docs/patching/README.md) |
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
- **Extractor hardening (Session C.1):** `extractor/bindings/`, orchestrator `functions` expansion, prose first-arg filter in `shared/calls.ts`, dynamic commented-call parity tests, inventory rows — methodology in [`docs/extractor/README.md`](../../docs/extractor/README.md).
- **Auto-patching hardening:** user-facing [`docs/patching/`](../../docs/patching/README.md); CLI `fromContext` run wiring; integration tests `patching.analyzeAndRun` + `patching.cliChain`; maintainer map [`maintainer/systems/patching.md`](../systems/patching.md).
