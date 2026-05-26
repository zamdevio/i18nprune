# Pre-publish checklist

**Maintainer-only.** Run this **once** before tagging a stable release. When every item is done, **delete this file** from the repository so long-lived planning stays in **`V1-RELEASE.md`** and **`maintainer/README.md`** only.

---

## 1 — Phase / roadmap hygiene

- [ ] Finish open topics under **`maintainer/phases/*.md`** that still gate shipping (**`standard-toolkit.md`**, …).
- [ ] Keep **`maintainer/phases/extension/**`** as the long-lived VS Code roadmap (do **not** delete `maintainer/phases/` on release).
- [ ] Remove superseded phase Markdown once the behavior is covered by **`docs/`** + tests (history stays in git); keep extension / future phases that describe post-v1 work.
- [ ] Decide the fate of **extractor work**:
  - if extractor improvements are still partially implemented, keep **`maintainer/phases/extractor.md`** as a future phase;
  - if extractor improvements are fully shipped and documented, delete **`extractor.md`** post-v1.

---

## 2 — Architecture decisions (**`docs/architecture/decisions/`**)

- [ ] Refactor ADR files for **public clarity**: shorter, consistent **filenames** and **titles**, aligned patterns (start from **`template.md`**).
- [ ] Update cross-links: **`docs/README.md`** ADR index rows, nested **`architecture/README.md`** references, **`apps/docs/.vitepress/sidebar.ts`** if URLs change.
- [ ] Run **`pnpm docs:sync`** (or `node apps/docs/scripts/sync.js`) and **`pnpm exec vitepress build`** in **`apps/docs`** after renames.
- [ ] Update **`docs/architecture/topology/*.md`** to reflect final shipped architecture (remove stale planned notes; keep planned labels only where future work remains).

---

## 3 — App surfaces (**`apps/web`**, **`apps/workers/i18nprune`** / **`@i18nprune/worker-i18nprune`**)

- [ ] Quick pass: confirm workspace UI, **`i18nprune`** worker routes, and API typings still match the shipped CLI JSON contracts (validate, locales, report, etc.); fix any drift you find.
- [ ] **`apps/workers/meta`** (`@i18nprune/worker-meta`): smoke **`pnpm meta:build`** / route list if you change shared worker tooling.

---

## 4 — Contributor operability

- [ ] Confirm **`.github/workflows/ci.yml`** runs on PRs:
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm vitest run tests/parity` (frozen CLI `--json` + stderr)
- [ ] Verify **`maintainer/agents/onboarding.md`** matches repo layout, root scripts table, and [`systems/share.md`](../systems/share.md).

## 5 — Last step

- [ ] Verify **`maintainer/agents/`** docs match the final repo state (architecture, rules, jsdoc, git, onboarding).
- [ ] Ensure **`maintainer/README.md`** and **`maintainer/phases/V1-RELEASE.md`** describe the post-v1 maintenance story (what lives where, which phases remain for extensions).
- [ ] Delete **`maintainer/phases/final.md`** when you are ready to tag—this checklist must not linger after publish prep is finished.
