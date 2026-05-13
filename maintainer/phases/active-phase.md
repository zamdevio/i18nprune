# Active sprint

**v1 consolidated plan:** **[`V1-RELEASE.md`](./V1-RELEASE.md)** (sessions A–H — use first for sequencing).

**Narrative focus:** **Core-op migrations (Session A.2)** — `report`, then `locales` commands. After that: **extractor / false-positive hardening (Session C)** → patching backlog in **`docs/patching/README.md`**. Hub overview: **`maintainer/phases/README.md`**.

---

## Guiding rules (standard-toolkit aligned)

- **CI-first contract:** treat `validate --json` + stable `issues[]` codes as the default machine gate.
- **Structured observability:** i18n state is structured data; keep human and JSON surfaces in parity.
- **Opt-in mutation only:** never patch user project files implicitly; destructive/project-changing behavior must be explicit.
- **Small sharp iterations:** prefer narrow, testable improvements over broad speculative rewrites.
- **Edge-case honesty:** record unresolved tradeoffs in `docs/edge-cases/unsolved/inventory.md` quickly.

---

## Core-op migrations (**Session A.2 — active**)

**Focus:** Migrate remaining CLI-owned command orchestration to core `runXxx` entries per [`core-architecture.md`](./core-architecture.md) § 7.2.

| # | command | status |
|---|---------|--------|
| 1 | `validate` → `runValidate` | **Shipped** |
| 2 | `report` → `runReport` | **Next** |
| 3 | `doctor` → `runDoctor` | **Shipped** |
| 4 | `locales dynamic` | Pending |
| 5 | `locales list`, `locales edit`, `locales delete` | Pending |

---

## Extractor hardening (**Session C**)

**Docs:** [`extractor.md`](./extractor.md) (§0), [`docs/regex/key-sites-and-dynamic.md`](../../docs/regex/key-sites-and-dynamic.md).

---

## Patching backlog (**Session D**)

Tracked publicly under **[`docs/patching/README.md`](../../docs/patching/README.md)** ("Maintainer backlog" section).

---

## Public API / programmatic exports

Normative docs: **`docs/json/`**, **`docs/exports/`**.

---

## Foundation tracks (ordering)

| Track | Status | Doc |
|-------|--------|-----|
| **v1 sessions (ordered)** | **Use first** | **[`V1-RELEASE.md`](./V1-RELEASE.md)** |
| **Core-op migrations** | **Active — Session A.2** | [`core-architecture.md`](./core-architecture.md) § 7.2 |
| **Extractor / keySites follow-ups** | **Session C** | [`extractor.md`](./extractor.md), [`docs/regex/`](../../docs/regex/README.md) |
| **Patching backlog** | **Session D** | [`docs/patching/README.md`](../../docs/patching/README.md) |
| **Standard toolkit** | **Parallel / Session E** | [`standard-toolkit.md`](./standard-toolkit.md) |

---

## Recently shipped (historical pointers)

Baseline CLI slices + exports parity: **[`shipped-slices.md`](./shipped-slices.md)**

**2026-05 (doctor + cache refactor):**

- **Doctor:** `runDoctor` core entry shipped — pure orchestration with host-injected environment facts. SDK example at `examples/sdk/doctor/runDoctor.ts`.
- **Cache:** Sub-folder reorganization (`io/`, `setup/`), circular dependency elimination, JSDoc, `baselineFiles` mechanism for accurate delta reporting.
- **Translate policy + providers:** Steps 1–10 fully shipped; `fill` collapsed into `generate --resume`. Docs moved to `shipped-slices.md`.
