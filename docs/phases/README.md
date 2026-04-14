# Phases (maintainer hub)

Planning notes under `docs/phases/`. They are **synced to the Nextra docs site** with the rest of `docs/` (same content as in git / the published repo). Product docs also live under `docs/commands/`, `docs/architecture/`, `docs/regex/`.

**How to maintain phase files:** Follow **[Agent rules → Phase docs](../agents/rules.md#phase-docs-docsphases)** — after a phase completes, **rewrite** the same file so it stays readable (status, what shipped, links forward). Use **`docs/phases/temp/`** only for session scratch — see [agents/temp-notes.md](../agents/temp-notes.md). Goal: no mixed-era chaos; new phases reuse that pattern.

**Session scratch:** `docs/phases/temp/` is **gitignored** — see [agents/temp-notes.md](../agents/temp-notes.md).

---

## Start here

**Hub:** [active-phase.md](./active-phase.md)

**CLI execution order:** locales → generate/fill (**done**); **review** → key-sites → patching — see [active-phase.md](./active-phase.md) and the phase rows below.

| Area | Status |
|------|--------|
| **CLI `review` uplift (CepatEdge-style)** | **Active** — [review.md](./review.md), [active-phase.md](./active-phase.md) |
| **CLI (`locales`, `generate`, `fill` — progress + JSON + identity streak)** | **Done** — [locales.md](./locales.md), [generate.md](./generate.md), [fill.md](./fill.md) |
| **`i18nprune.dev` / `apps/web`** | **Done** — [i18nprune.dev.md](./i18nprune.dev.md) |
| **Exports + baseline `--json` parity** | **Done** — [exports/README.md](./exports/README.md), [cli-json-command-parity.md](../edge-cases/solved/cli-json-command-parity.md) |

**Completed (reference):**

- **`locales` / `generate` / `fill`** — [locales.md](./locales.md), [generate.md](./generate.md), [fill.md](./fill.md)  
- **[exports/README.md](./exports/README.md)** — namespaces, JSON envelope, programmatic `run*`  
- **[commands.md](./commands.md)** — command orchestrator boundary (`completed`)  
- Key reference + **`cleanup --ask`** — [key-reference-unification.md](./key-reference-unification.md), [interactive-key-confirmation.md](./interactive-key-confirmation.md)

| Doc | Role |
|-----|------|
| [key-reference-unification.md](./key-reference-unification.md) | `reference` config, `core/preserve`, key context, ripgrep modes |
| [interactive-key-confirmation.md](./interactive-key-confirmation.md) | `--ask` / `--ask-per-key` behavior and precedence |

---

## All phase files (index)

| File | Summary |
|------|---------|
| [active-phase.md](./active-phase.md) | Current sprint hub |
| [key-reference-unification.md](./key-reference-unification.md) | Preserve + reference + detection docs links |
| [interactive-key-confirmation.md](./interactive-key-confirmation.md) | Interactive removal confirmations |
| [i18nprune.dev.md](./i18nprune.dev.md) | Public web / `apps/web` |
| [web-report-i18n.md](./web-report-i18n.md) | Full i18n for `apps/web` + `apps/report` (after app churn settles) |
| [Prompts & CLI boundaries](../prompts/README.md) | Where Inquirer runs, `--json` / CI skips, utils debt (maintainer) |
| [extension/README.md](./extension/README.md) | VS Code extension — plan, gates, tracks ([apps/extension](../../../apps/extension/README.md)) |
| [key-sites.md](./key-sites.md) | keySites milestone notes |
| [generate.md](./generate.md) | `generate` command phase notes (**completed**) |
| [fill.md](./fill.md) | `fill` command phase notes (**completed**) |
| [missing.md](./missing.md) | `missing` command |
| [report.md](./report.md) | `report` command |
| [versioning.md](./versioning.md) | CLI version / registry |
| [locales.md](./locales.md) | `locales` subcommands (**completed** for CLI slice; ADR 004 follow-up) |
| [missing-pipeline.md](./missing-pipeline.md) | Pipeline automation ideas |
| [validate.md](./validate.md) | Rich validate backlog |
| [commands.md](./commands.md) | Command orchestrator boundary (commands orchestrate; core owns logic) |
| [exports/README.md](./exports/README.md) | Exports phase (**completed** — checklist + api-surface, docs-sync, alignment notes) |
| [patching/README.md](./patching/README.md) | Loader + patching phase hub |
| [patching/loader.md](./patching/loader.md) | Maintainer checklist (canonical spec: [patching/loader.md](../patching/loader.md)) |
| [providers.md](./providers.md) | **`generate`/`fill`** `--provider` (google, ai, future) — schedule after locales + shared envelope work |
| [review.md](./review.md) | **Active** — review command uplift (CepatEdge-style human + JSON) |
| [elit-tier/README.md](./elit-tier/README.md) | Integrations / plugins ideas |

---

## Public pointers

- [Roadmap](../roadmap/README.md) — product direction  
- [Workflow](../workflow/README.md) — local dev  
- [Detection limits](../regex/README.md#detection-limits) — what static analysis can prove  

---

## Phase rules

1. `docs/phases/**` is **tracked in git** (source of maintainer execution context).
2. Keep one active sprint in [active-phase.md](./active-phase.md); mark completed work in the relevant phase README (avoid duplicate **COMPLETED.md** files unless a long archive is explicitly needed).
3. Do not delete completed phase docs unless their decisions are preserved in ADRs/architecture docs or a canonical replacement phase README.
4. Keep each phase actionable: explicit checklist, status, and clear handoff links.
5. **Lifecycle:** When work finishes, update the phase doc in place so the next reader gets a clear **done / superseded / parked** story — see [Agent rules — Phase docs](../agents/rules.md#phase-docs-docsphases) and [temp-notes](../agents/temp-notes.md) for scratch vs durable content.
