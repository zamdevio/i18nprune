# Phase — Elite Tier roadmap

**Status:** **planned (next after `i18nprune.dev`)**.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Why this phase exists

After report + docs polish, this phase tracks capability upgrades that move i18nprune from strong CLI tooling to a broader ecosystem-grade platform.

---

## Priority gaps to close

### 1) Ecosystem integrations

- VS Code extension surface (optional starter scope: open report, jump to key locations).
- CI templates and examples for common providers.
- GitHub PR annotations/check summaries for missing/dynamic findings.

### 2) Incremental / cached scanning

- Avoid full-scan-only workflow on large projects.
- Add cache keys and invalidation strategy (config + src hash boundaries).
- Document expected speedups and cache correctness constraints.

### 3) External plugin system

- Define stable extension points for scanner/report/format hooks.
- Keep core safe defaults while allowing project-specific adapters.
- Version/plugin-compat contract in docs.

### 4) Dynamic keys beyond heuristic baseline

- Improve confidence model and data quality around dynamic keys.
- Keep honest messaging: unresolved runtime expressions remain non-deterministic.
- Track advanced techniques without overstating certainty.

---

## Deliverables

- [ ] Elite-tier strategy doc with scope, sequencing, and acceptance criteria.
- [ ] RFC(s) for integrations, cache model, and plugin API shape.
- [ ] Milestone split into implementable sub-phases with tests/docs gates.

---

## Ordering

This phase starts **after** the active [`../i18nprune.dev.md`](../i18nprune.dev.md) phase reaches handoff.

---

## See also

- [`../README.md`](../README.md)
- [`../key-sites.md`](../key-sites.md)
- [`../report.md`](../report.md)
