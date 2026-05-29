# v1 release — consolidated work plan

**Single hub:** Ordered **sessions** below.  
**Sprint tweaks:** [`active-phase.md`](./active-phase.md).

**Locked vertical order (extractor → init → locales → extension):** [`active-phase.md` § Locked cross-phase dependency chain](./active-phase.md#locked-cross-phase-dependency-chain)

**Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md)

**Location:** Maintainer-only under **`maintainer/`**. **`phases/`** detail is **not** mirrored to **`apps/docs`** (`pnpm docs:sync` reads only **`docs/**`**).

**Pre-publish:** **[`final.md`](./final.md)** holds the one-time gate (hygiene + ADR polish); **Session G** below walks it. Delete **`final.md`** per its footer after Session **G**.

---

## Recommended v1 sequence (start here after shipped Session C)

Ship **init → locales → cache → translate-cache** on **`@i18nprune/core`** before **hosted app** catch-up. **F**, **H**, **H-cache**, **H.1**, **C.3+ apps**, and **landing (D.2)** are **shipped**; **active next:** **cross-platform** ([`cross-platform.md`](./cross-platform.md)). Then **docs (D)**, **release (E)**, **`final.md` (G)**.

| Step | Session | What |
|------|---------|------|
| **1** | **F — Init** (**shipped** — core + CLI) | [`shipped-slices.md`](./shipped-slices.md) — `runInit`, presets, CLI **`init`** |
| **2** | **H — Locales** (**shipped** — core + CLI) | [`shipped-slices.md`](./shipped-slices.md) · [`docs/commands/locales`](../../docs/commands/locales/README.md) |
| **2a** | **H-cache — Project cache** (**shipped**) | [`cache.md`](./cache.md) — Phases 0–4 (incremental analysis + invalidate policy) |
| **2b** | **H.1 — Translate cache** (**shipped**) | [`shipped-slices.md`](./shipped-slices.md) · [`docs/cli/cache.md`](../../docs/cli/cache.md) |
| **3** | **C.3 — Apps + share** | [`apps.md`](./apps.md) — rows **0–10 shipped** (including row **9** worker `runReport` route and row **W** metadata polish) |
| **3b** | **XP — Cross-platform** | [`cross-platform.md`](./cross-platform.md) — CLI + SDK on Win/macOS/Linux/WSL; **version cache** (`~/.config/i18nprune/updatestate.json`), **project cache** (`~/.i18nprune/cache`), **translate cache** |
| **4** | **D — Docs** | [`docs-refactor.md`](./docs-refactor.md) — nav trim, SDK quickstart, tree flattening |
| **5** | **D.2 — Landing** (**shipped**) | [`shipped-slices.md`](./shipped-slices.md) — `apps/landing` locale layouts, Used By, report surface, mobile |
| **6** | **E + G** | Release polish + execute / delete [`final.md`](./final.md) when tagging |

The **locked dependency chain** (extractor → init → locales → extension) still governs **core** work — see [`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain). **Extension** follows stabilized init/locales contracts; **C.3** is a **host** refresh, not a prerequisite for **F**/**H**.

---

## Session A — Translation progress + providers (**shipped**)

**Shipped.** Core architecture phases 1–3, translate-policy steps 1–10, `fill` → `generate --resume` collapse, provider orchestration. See [`shipped-slices.md`](./shipped-slices.md).

---

## Session A.2 — Core-op migrations (**shipped**)

All ops shipped — see [`shipped-slices.md`](./shipped-slices.md).

---

## Session B — `review` command (**shipped**)

**Shipped.** Stable `--json`; filters landed. See [`shipped-slices.md`](./shipped-slices.md).

---

## Session C — Extractor & patching (**shipped**)

**Extractor hardening.** **Docs:** [`extractor.md`](./extractor.md) (§0 — design reference). User methodology: [`docs/extractor/README.md`](../../docs/extractor/README.md). Maintainer map: [`maintainer/systems/extractor.md`](../systems/extractor.md). Delivered: import binding resolution, lexical hardening + commented-call parity tests, edge-case inventory, methodology.

**Patching / auto-patching.** **User docs:** [`docs/patching/README.md`](../../docs/patching/README.md). Maintainer map: [`maintainer/systems/patching.md`](../systems/patching.md). Delivered: integration tests (core chain + CLI **`patch --fix` → `--patch sync` → `--patch generate`**), shared CLI **`Context` → `runPatching`** wiring (`fromContext.ts`), resolver preservation tests, **`config.json`** injection-status docs, core patching types and barrel layout.

**Next (core):** **cross-platform** ([`cross-platform.md`](./cross-platform.md)).

---

## Session F — Init phase (**shipped — core + CLI**)

**Receipt:** [`shipped-slices.md`](./shipped-slices.md). **Extension** onboarding UI (I1–I3) remains planned in [`extension/README.md`](./extension/README.md).

---

## Session H — Locales phase (**shipped**)

**Receipt:** [`shipped-slices.md`](./shipped-slices.md) · user docs [`docs/commands/locales`](../../docs/commands/locales/README.md).

---

## Session H-cache — Project cache incremental (**shipped**)

**Docs:** [`cache.md`](./cache.md)

**Shipped:** Phases **0–4** — segment-aware `files.json`, single `analysis.json`, src incremental patch, locale-aware reuse/patch, `cache.profile` + `--cache-profile`, invalidate policy after sync/generate — see [`shipped-slices.md`](./shipped-slices.md).

**Dependencies:** **Session H** row **10** — **shipped**.

---

## Session H.1 — Translate cache (**shipped**)

**Receipt:** [`shipped-slices.md`](./shipped-slices.md) · [`docs/cli/cache.md`](../../docs/cli/cache.md).

---

## Session C.3 — Apps rework (**active — rows 9 + W**)

**When:** After **translate-cache (H.1)** — **shipped**. **Session F (init)** and **Session H (locales)** contracts are in place. Hosted surfaces are **catch-up** to **`@i18nprune/core`**, not a blocker for init/locales.

**Scope:** Update **`apps/web`**, **`apps/report`**, and **`apps/workers/i18nprune`** — imports, types, runtime adapter usage vs **`@i18nprune/core`**. Add **core `share` op** (`packages/core/src/share/`), CLI **`i18nprune share`** (+ `list` / `delete`), worker **`/v1/reports`**, and hosted share links. **`apps/workers/meta`** stays separate unless shared worker tooling changes.

**Plan (authoritative):** **[`apps.md`](./apps.md)**. All C.3+ rows are shipped, including worker **`runReport`** (row **9**) and metadata grouping (row **W**).

---

## Session XP — Cross-platform hardening (**planned**)

**When:** After **apps C.3+** completion (fulfilled; rows **0–10** shipped).

**Scope:** Prove and harden **CLI** + **`@i18nprune/core` SDK** on Windows, macOS, native Linux, and WSL. All **disk caches**:

- **Version cache** — `updatestate.json` under `$XDG_CONFIG_HOME/i18nprune/` or `~/.config/i18nprune/` (CLI-only; see `packages/cli/src/utils/update/`)
- **Project cache** — `~/.i18nprune/cache/projects/<id>/` (`files.json`, `analysis.json`)
- **Translate cache** — `projects/<id>/translations/*.json` (H.1; same project dir)

**Plan (authoritative):** **[`cross-platform.md`](./cross-platform.md)**.

---

## Session D — Docs (focused)

**Plan:** [`docs-refactor.md`](./docs-refactor.md) (scoped to v1-essential items only).

Goal: **8–10 top-level nav categories** on the docs site, not 35. Group related content, flatten single-file dirs, remove noise.

**Guardrail:** Do **not** delete or relocate **`docs/report/README.md`** as part of cleanup — **report.i18nprune.dev** and multiple repo links depend on that path; see [`docs-refactor.md`](./docs-refactor.md) § *Keep `docs/report/README.md`*.

| Slice | What |
|-------|------|
| **D.1** | Root `README.md` rewrite — lead with the problem, not a feature table |
| **D.2** | Docs nav trim — consolidate 35 top-level dirs to ~10 essential groups |
| **D.3** | SDK quickstart — `docs/sdk/` with getting-started, runtime adapters, operations |
| **D.4** | Tree flattening — single-file dirs become sibling files (**preserve `docs/report/README.md`** — report app + inbound links) |
| **D.5** | Sidebar + VitePress build validation |
| **D.6** | **Disk cache docs** — relocate + rewrite per [`docs-refactor.md`](./docs-refactor.md) § *Project disk cache documentation* (core-owned engine; canonical URL **TBD** at execution) |

**Essential docs nav (target):**

| Category | Content |
|----------|---------|
| Getting started | Install, quickstart, config |
| Commands | One page per command (existing `docs/commands/`) |
| Configuration | Config reference (`docs/config/`) |
| SDK | Programmatic `@i18nprune/core` usage |
| Runtime | Node / Web / Edge adapters |
| Issues | Stable issue code reference |
| Examples | CI recipes, `--json`, workflows |
| CLI behavior | Verbosity, exit codes, JSON output |
| Architecture | Topology, decisions (ADRs) |

---

## Session D.2 — Landing page (`apps/landing`) (**shipped**)

**Receipt:** [`shipped-slices.md`](./shipped-slices.md). **When:** After **Session H (locales)**; shipped on **`main`** (commit `feat(landing): locale layouts, Used By, report surface, and mobile polish`).

**Scope (delivered):** **`apps/landing`** marketing site — locale-layouts section (architecture-adjacent, **no** `PRIMARY_NAV` entry), Used By stack marquee, report surface callouts, mobile polish, shared section utilities.

**Content (locked):**

| Topic | What to explain |
|-------|-----------------|
| **Locale modes** | `flat_file` vs `locale_directory` — when each fits |
| **Structures** | `locale_file`, `locale_per_dir`, `feature_bundle` — how files group under `locales.directory` |
| **Nested segments** | Per-locale directories and multi-file segments (e.g. `messages/en/auth.json`) |
| **Depth limit** | `MAX_LOCALE_SEGMENT_TREE_DEPTH = 16` under the configured locales root |
| **Read behavior** | Paths that do not match configured `mode` + `structure` → **`locale_read_path_layout_mismatch`**: **warn**, **skip**, **continue** (config is authority; no hard fail for stray files) |

**Non-goals:** Duplicating full command reference (that stays in **`docs/`**); replacing the docs site nav trim (**Session D** table row **D.2** — docs nav is a separate slice in [`docs-refactor.md`](./docs-refactor.md)).

---

## CI (repository)

**Workflow:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

| Step | Command |
|------|---------|
| Type safety + ui purity + worker compile gates | `pnpm typecheck` |
| Unit + integration tests | `pnpm test` |
| CLI `--json` / stderr byte parity | `pnpm vitest run tests/parity` |

Contributor onboarding (root scripts, reading order): [`maintainer/agents/onboarding.md`](../agents/onboarding.md).

---

## Session E — Release polish + gates

Execute **[`final.md`](./final.md)** §§1–2 (phase hygiene + ADR polish). Then:

- `pnpm typecheck`, `pnpm test`, `pnpm vitest run tests/parity`, smoke: `validate`, `generate`, `sync` on fixture.
- Version/changelog: [`docs/versioning/README.md`](../../docs/versioning/README.md).
- `pnpm docs:build` — verify no broken links.
- Complete `final.md` §3 — delete `maintainer/phases/final.md` once the release is tagged.

---

## Post-v1 (do not block)

| Item | Pointer |
|------|---------|
| **Extension** roadmap (editor; post–init/locales stabilization) | [`extension/README.md`](./extension/README.md) · [`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain) |
| `translate.policy.routing: 'auto'` advanced posture | post-v1 optional tail |
| Worker bundle `node:` CI | [`docs/runtime/README.md`](../../docs/runtime/README.md) |
| VitePress `@next`, `docs/exports` → `docs/sdk` | post-v1 docs |
| Extractor — non-JS/TS languages, external plugins | [`extractor.md`](./extractor.md) §1–2 |
