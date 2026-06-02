# Pre-publish checklist

**Maintainer-only.** Run **once** before tagging. When done, **delete this file**.

**Remaining v1 context:** [`active-phase.md`](./active-phase.md) · [`shipped-slices.md`](./shipped-slices.md)

---

## 1 — Phase hygiene

- [x] Close or defer open slices per release scope (platform + tree T0–T10 + CI CI-1–5 shipped — [`systems/platform.md`](../systems/platform.md), [`systems/ci.md`](../systems/ci.md), [`shipped-slices.md`](./shipped-slices.md)).
- [x] Keep **`maintainer/phases/extension/**`** as post-v1 roadmap (do not delete on release).
- [x] Keep **`extractor.md`** — future hardening + inventory cross-links.

---

## 2 — Architecture decisions (`docs/architecture/decisions/`)

- [x] Refactor ADRs for public clarity (filenames, titles, `template.md` pattern).
- [x] Fix cross-links + run **`pnpm docs:sync`** and **`pnpm exec vitepress build`** in **`apps/docs`** after renames.
- [x] Retired **`docs/architecture/topology/**`** (content covered by architecture hub, ADRs, and runtime docs).

---

## 3 — App surfaces

- [x] Smoke **`apps/web`**, **`apps/workers/i18nprune`** vs shipped CLI JSON contracts.
- [x] **`apps/workers/meta`:** verify CodeSandbox SDK link in `constants/urls.ts` (no change needed if still valid).

---

## 4 — Contributor operability

- [x] CI runs `pnpm typecheck`, `pnpm test`, `pnpm vitest run tests/parity` on PRs.
- [x] **`maintainer/agents/onboarding.md`** matches repo layout and root scripts.

---

## 5 — Last step

- [ ] **`maintainer/agents/`** docs match final repo state.
- [ ] **`maintainer/README.md`** describes post-v1 maintenance story.
- [ ] **Delete this file** when tagging.
