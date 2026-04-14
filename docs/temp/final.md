# Pre-release / final pass checklist (docs)

Use this list **before** calling a development phase “done” when the repo has seen **path, API, or behavior** churn. Tick items after you re-read or update the file.

## High impact

- [ ] [`docs/architecture/tree/README.md`](../architecture/tree/README.md) — repo layout, `packages/*`, `apps/*`, notable `docs/` entries.
- [ ] [`docs/README.md`](../README.md) — top-level index links still valid.
- [ ] [`docs/json/README.md`](../json/README.md) — envelope, command list, links to `issue-codes`, long-running JSON behavior.
- [ ] [`docs/exports/core.md`](../exports/core.md) — stable vs advanced table matches exports; new programmatic entrypoints documented.

## Cross-cutting

- [ ] [`docs/cli/README.md`](../cli/README.md) — global flags, `--json` pointer.
- [ ] [`docs/commands/README.md`](../commands/README.md) — orchestration link.
- [ ] [`docs/behavior/commands.md`](../behavior/commands.md) — snapshot table vs reality.
- [ ] [`apps/web`](../) — `docsUrl(...)` targets for marketing / API pages.
- [ ] Run **`pnpm run docs:sync`** so `apps/docs/content/` matches `docs/`.

## Optional deep pass

- [ ] Command READMEs you touched this phase.
- [ ] ADR “See also” links if folders moved.
- [ ] `docs/phases/**` completion notes vs what actually shipped.
- [ ] [Comment & JSDoc cleanup (noise vs signal)](../phases/temp/comments.md) — trim redundant comments; one JSDoc per constant group where possible; rich JSDoc on important public APIs.

---

*This file is **tracked** in git. Session scratch work belongs in **ignored** [`docs/phases/temp/`](../phases/temp/) — see [agents/temp-notes.md](../agents/temp-notes.md).*
