# i18nprune extension — quick index

Long-form planning lives under **`maintainer/phases/extension/`** (hub **[README.md](../../maintainer/phases/extension/README.md)** + one `*.md` per phase). Update those when roadmap or contracts change; use this file as a **short map** into them.

---

## Roadmap entry

| Doc | Purpose |
|-----|---------|
| [maintainer/phases/extension/README.md](../../maintainer/phases/extension/README.md) | Philosophy, architectural rules, phase index, core → extension dependency, gates (G1–G5), Tracks A–D |
| [maintainer/phases/extension/](../../maintainer/phases/extension/) | One focused doc per phase (implementation order + responsibilities) |

---

## Where topics live

| Topic | Phase doc |
|-------|-----------|
| Source-of-truth core paths, SDK `runGenerate` example, API shape (`GenerateHostHooks` required) | [core-integration.md](../../maintainer/phases/extension/core-integration.md) |
| Checklist before tightening `@i18nprune/core` (paths, cancellation, envelopes, multi-root, tests, release) | [core-integration.md](../../maintainer/phases/extension/core-integration.md) |
| Generate dashboard tab, IPC, host hooks, implementation slices, non-goals | [generate.md](../../maintainer/phases/extension/generate.md) |
| Interactive diff, multi-language editor, project breadcrumbs | [post-mvp.md](../../maintainer/phases/extension/post-mvp.md) (deferred) |
| Monorepo home (`apps/extension`) | [monorepo-home.md](../../maintainer/phases/extension/monorepo-home.md) (**done**) |
| Architecture / hover / diagnostics / completions / performance / foundation / dashboard / init UI | Matching files under [maintainer/phases/extension/](../../maintainer/phases/extension/) |

---

## When you implement

1. Open the relevant **`maintainer/phases/extension/<name>.md`**.  
2. Align with **[core-integration.md](../../maintainer/phases/extension/core-integration.md)** for any core call.  
3. Bump status in **[README.md](../../maintainer/phases/extension/README.md)** (phase index table) and the phase file when work is actually done or in progress.
