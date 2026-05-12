# Active sprint

**v1 consolidated plan:** **[`V1-RELEASE.md`](../V1-RELEASE.md)** (sessions A–H — use first for sequencing).

**Narrative focus:** **Session A (providers / progress UX)** → **`review`** refinements → **extractor / false-positive hardening (Session C)** → patching backlog in **`docs/patching/README.md`**. Hub overview: **`maintainer/phases/README.md`**.

---

## Guiding rules (standard-toolkit aligned)

- **CI-first contract:** treat `validate --json` + stable `issues[]` codes as the default machine gate.
- **Structured observability:** i18n state is structured data; keep human and JSON surfaces in parity.
- **Opt-in mutation only:** never patch user project files implicitly; destructive/project-changing behavior must be explicit.
- **Small sharp iterations:** prefer narrow, testable improvements over broad speculative rewrites.
- **Edge-case honesty:** record unresolved tradeoffs in `docs/edge-cases/unsolved/inventory.md` quickly.

---

## Providers + CLI progress (**Session A — P0**)

**Focus:** Tick/progress semantics and translation provider orchestration shared by **`generate`** (including **`generate --resume`**). Maintainer notes: **[`providers.md`](./providers.md)** (includes **shipped baseline vs optional tail** for V1-RELEASE Session A) · user docs **`docs/progress/README.md`**, **`docs/commands/generate`**, **`docs/config/translate.md`**.

---

## CLI — `review` command uplift (**Session B**)

**Goal:** Stable **`review --json`** and tight filters once behavior is settled. Reference **`docs/commands/review/README.md`**. Keep **`review`** compact—deep scans stay on **`validate`** / **`report`**.

---

## Extractor hardening (**Session C**)

**Docs:** [`docs/regex/key-sites-and-dynamic.md`](../../docs/regex/key-sites-and-dynamic.md) · backlog **`maintainer/EXTRACTOR_IMPROVEMENT.md`** (bounded PRs, e.g. prose false positives).

---

## Patching backlog (**Session D**)

Tracked publicly under **[`docs/patching/README.md`](../../docs/patching/README.md)** (“Maintainer backlog” section).

---

## Public API / programmatic exports

Normative docs: **`docs/json/`**, **`docs/exports/`**.

---

## Foundation tracks (ordering)

| Track | Status | Doc |
|-------|--------|-----|
| **v1 sessions (ordered)** | **Use first** | **[`../V1-RELEASE.md`](../V1-RELEASE.md)** |
| **Translation providers + progress** | **P0 — Session A** | [`providers.md`](./providers.md) |
| **`review` uplift** | **Session B** | [`docs/commands/review/README.md`](../../docs/commands/review/README.md) |
| **Extractor / keySites follow-ups** | **Session C** | [`EXTRACTOR_IMPROVEMENT.md`](../EXTRACTOR_IMPROVEMENT.md), [`docs/regex/`](../../docs/regex/README.md) |
| **Patching backlog** | **Session D** | [`docs/patching/README.md`](../../docs/patching/README.md) |
| **Standard toolkit** | **Parallel / Session E** | [`standard-toolkit.md`](./standard-toolkit.md) |

---

## Recently shipped (historical pointers)

Baseline CLI slices + exports parity: **[`shipped-slices.md`](./shipped-slices.md)**

**2026-05 maintainer note (CLI correctness + quiet):**

- **Sync:** `mergeToTemplateShape` preserves existing structured leaves (`{ value: string, … }`) at paths the source still has as plain strings, so `--metadata` / `--strip-metadata` no longer clobber translated values at those paths only because of shape mismatch before leaf normalization.
- **Logging:** `[i18nprune] [scan]` (`--debug-scan`) now **respects `--quiet`** (same visibility family as `[info]`); warnings still show in quiet unless `--silent`.
- **Copy / issues:** Doctor / missing / report / `locales dynamic` surface non-literal key counts without implying cache freshness; validate success line clarifies “code scan vs source locale JSON”.
- **Next:** Continue **Session A** ordering in **[`V1-RELEASE.md`](../V1-RELEASE.md)** — after **core-architecture Phase 1**, execute **[`translate-policy.md`](./translate-policy.md)** as written (no extra blocker from this slice unless Phase 1 is still open).

