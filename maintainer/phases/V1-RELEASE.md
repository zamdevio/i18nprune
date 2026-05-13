# v1 release — consolidated work plan

**Single hub:** Ordered **sessions** below.  
**Sprint tweaks:** [`active-phase.md`](./active-phase.md).

**Shipped (do not reopen):** [`shipped-slices.md`](./shipped-slices.md)

**Location:** Maintainer-only under **`maintainer/`**. **`phases/`** detail is **not** mirrored to **`apps/docs`** (`pnpm docs:sync` reads only **`docs/**`**).

**Pre-publish:** **[`final.md`](./final.md)** holds the one-time gate (hygiene + ADR polish); **Session G** below walks it. Delete **`final.md`** per its footer after Session **G**.

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

## Session C — Extractor hardening (**active**)

**Docs:** [`extractor.md`](./extractor.md) (§0).

Bounded PR: prose false positives (`t (or vice versa)`-style) + tests. Pure logic work in `packages/core/src/extractor/`. Small scope, few commits.

---

## Session C.2 — Patching hardening

**Refs:** [`docs/patching/README.md`](../../docs/patching/README.md) (backlog section).

Patching is already implemented and working. This session hardens it:

| Slice | What |
|-------|------|
| Tests | Resolver + loader variants, config injection status cases, optional integration (`init → patch → sync --patch → generate`) |
| Shared orchestration | One patching handler path for `patch`, `sync --patch`, `generate --patch`, `locales edit --patch`, `locales delete --patch` — centralize envelope + `canAsk` / `--yes` / `--json` |
| Messaging | Tighten `patch --init` messaging when config injection skips (`skipped_existing`) |
| Core structure | Optional folder barrels under `packages/core/src/patching/*` (no behavior change) |
| Docs | Troubleshooting in patching README; mismatch examples in `config.md`; command docs for `--init` injection statuses |

---

## Session C.3 — Apps rework

Update `apps/web` and `apps/workers/i18nprune` to work with the current core API after heavy Session A/A.2 migrations. Verify imports, types, and runtime adapter usage are current.

---

## Session D — Docs (focused)

**Plan:** [`docs-refactor.md`](./docs-refactor.md) (scoped to v1-essential items only).

Goal: **8–10 top-level nav categories** on the docs site, not 35. Group related content, flatten single-file dirs, remove noise.

| Slice | What |
|-------|------|
| **D.1** | Root `README.md` rewrite — lead with the problem, not a feature table |
| **D.2** | Docs nav trim — consolidate 35 top-level dirs to ~10 essential groups |
| **D.3** | SDK quickstart — `docs/sdk/` with getting-started, runtime adapters, operations |
| **D.4** | Tree flattening — single-file dirs become sibling files |
| **D.5** | Sidebar + VitePress build validation |

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
| `translate.policy.routing: 'auto'` advanced posture | post-v1 optional tail |
| Worker bundle `node:` CI | [`docs/runtime/README.md`](../../docs/runtime/README.md) |
| VitePress `@next`, `docs/exports` → `docs/sdk` | post-v1 docs |
| Extractor — non-JS/TS languages, external plugins | [`extractor.md`](./extractor.md) §1–2 |
