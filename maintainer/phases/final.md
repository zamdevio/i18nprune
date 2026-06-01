# Pre-publish checklist

**Maintainer-only.** Run **once** before tagging. When done, **delete this file**.

**Remaining v1 context:** [`V1-RELEASE.md`](./V1-RELEASE.md) · [`active-phase.md`](./active-phase.md)

---

## 1 — Phase hygiene

- [ ] Close or defer open slices in **`docs-refactor.md`** per release scope (platform + tree T0–T10 + CI CI-1–5 shipped — [`systems/platform.md`](../systems/platform.md), [`systems/ci.md`](../systems/ci.md), [`shipped-slices.md`](./shipped-slices.md)).
- [ ] Keep **`maintainer/phases/extension/**`** as post-v1 roadmap (do not delete on release).
- [ ] Keep **`extractor.md`** — future hardening + inventory cross-links.

---

## 2 — Architecture decisions (`docs/architecture/decisions/`)

- [ ] Refactor ADRs for public clarity (filenames, titles, `template.md` pattern).
- [ ] Fix cross-links + run **`pnpm docs:sync`** and **`pnpm exec vitepress build`** in **`apps/docs`** after renames.
- [ ] Update **`docs/architecture/topology/*.md`** — remove stale planned notes.

---

## 3 — App surfaces

- [ ] Smoke **`apps/web`**, **`apps/workers/i18nprune`** vs shipped CLI JSON contracts.
- [ ] **`apps/workers/meta`:** update CodeSandbox SDK link in `constants/urls.ts` if needed.

---

## 4 — Contributor operability

- [ ] CI runs `pnpm typecheck`, `pnpm test`, `pnpm vitest run tests/parity` on PRs.
- [ ] **`maintainer/agents/onboarding.md`** matches repo layout and root scripts.

---

## 5 — Last step

- [ ] **`maintainer/agents/`** docs match final repo state.
- [ ] **`maintainer/README.md`** + **`V1-RELEASE.md`** describe post-v1 maintenance story.
- [ ] **Delete this file** when tagging.
