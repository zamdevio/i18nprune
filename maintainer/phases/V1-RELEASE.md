# v1 release — consolidated work plan

**Single hub:** Ordered **sessions** below.  
**Sprint tweaks:** [`active-phase.md`](./active-phase.md).

**Locked vertical order (extractor → init → locales → extension):** [`active-phase.md` § Locked cross-phase dependency chain](./active-phase.md#locked-cross-phase-dependency-chain)

**Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md)

**Location:** Maintainer-only under **`maintainer/`**. **`phases/`** detail is **not** mirrored to **`apps/docs`** (`pnpm docs:sync` reads only **`docs/**`**).

**Pre-publish:** **[`final.md`](./final.md)** holds the one-time gate (hygiene + ADR polish); **Session G** below walks it. Delete **`final.md`** per its footer after Session **G**.

---

## Recommended v1 sequence (start here after shipped Session C)

Ship the **core onboarding + storage vertical** before **hosted app** catch-up: **`@i18nprune/core`** must own project structure, presets, and normalized locale surfaces (**init → locales**) so SDK contracts stabilize. **`apps/web`** and **`apps/workers/i18nprune`** are already deployed and healthy; **defer Session C.3** until **F** and **H** have landed the core changes those hosts consume — then align imports/types to the new core surface. After that, run **docs (D)**, **landing (D.2)**, **release polish (E)**, and the **`final.md`** gate (**G**).

| Step | Session | What |
|------|---------|------|
| **1** | **F — Init** | [`init.md`](./init.md) — core-owned detection, presets, generated config |
| **2** | **H — Locales** | [`locales.md`](./locales.md) — reader/writer, multi-topology storage (**after** init schema) |
| **3** | **C.3 — Apps** | `apps/web`, `apps/workers/i18nprune` — catch up to post-init/locales **`@i18nprune/core`** |
| **4** | **D — Docs** | [`docs-refactor.md`](./docs-refactor.md) — nav trim, SDK quickstart, tree flattening |
| **5** | **D.2 — Landing** | `apps/landing` — lean onboarding + value proposition |
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

**Next (core):** Session **F** (init), then **H** (locales) — see [Recommended v1 sequence](#recommended-v1-sequence-start-here-after-shipped-session-c). **Next (hosts):** Session **C.3** runs **after F + H** so apps track the settled core/SDK surface.

---

## Session F — Init phase (**planned**)

**Docs:** [`init.md`](./init.md)

**Goal:** Best-in-class onboarding — **core-owned** detection, scoring, and config/preset generation; CLI and extension remain **hosts** only (**one intelligence layer, many hosts**).

**Dependencies:** **Extractor** (Session **C.1**, shipped) remains the authoritative usage/call-site signal layer; init **consumes** extractor capabilities where runtime evidence is required — no duplicate detection engines in hosts.

**Blocks:** **Session H (Locales)** must not ship core storage work until init **schema + preset** alignment from [`init.md`](./init.md) is in place.

---

## Session H — Locales phase (**planned**)

**Docs:** [`locales.md`](./locales.md)

**Goal:** Multi-topology locale **storage** (`flat_file`, `locale_directory`, structures `locale_file` / `locale_per_dir` / `feature_bundle`) via **reader/writer** abstraction; ops keep consuming **normalized locale surfaces**.

**Dependencies:** **Session F (Init)** for stable **`locales`** config shape and presets.

**Extension:** Release-grade editor work follows **stabilized** core contracts — see [`extension/README.md`](./extension/README.md) and [`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain).

---

## Session C.3 — Apps rework (**planned — after F + H**)

**When:** After **Session F (init)** and **Session H (locales)** have shipped the core project-structure and locale-storage contracts **`apps/web`** and **`apps/workers/i18nprune`** depend on. Hosted surfaces are already deployed and working; this session is **catch-up** to the new **`@i18nprune/core`** API, not a blocker for init/locales.

**Scope:** Update **`apps/web`** and **`apps/workers/i18nprune`** (`@i18nprune/worker-i18nprune`) — imports, types, runtime adapter usage vs **`@i18nprune/core`**. **`apps/workers/meta`** (`@i18nprune/worker-meta`) is separate (cache/metadata; no **`core`** dependency); touch only if shared worker tooling changes.

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

## Session D.2 — Landing page (`apps/landing`)

Reduce extra pages. Remove excessive terminal/code blocks. Focus on onboarding flow and value proposition.

---

## Session E — Release polish + gates

Execute **[`final.md`](./final.md)** §§1–2 (phase hygiene + ADR polish). Then:

- `pnpm typecheck`, `pnpm test`, smoke: `validate`, `generate`, `sync` on fixture.
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
