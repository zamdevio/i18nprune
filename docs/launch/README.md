# Launch & adoption (public-facing)

This folder is for **people discovering i18nprune**, not for CLI internals. Technical specs stay under **`docs/json/`**, **`docs/commands/`**, **`docs/exports/`**.

## Who this is for

- Developers evaluating an i18n toolchain in **CI** or **monorepos**
- Maintainers planning **rollout** (docs site, npm, landing, community posts)
- Anyone asking: *what is this, why is it different, where do I start?*

## Positioning (chosen)

**Primary analogy:** **“ESLint for i18n”** — static checks and fixes around translation keys and locale files, with the same **CLI + programmatic core** story as serious JS tooling.

Use it in READMEs, hero copy, and one-liners. It is a **metaphor** (we are not a fork of ESLint); link to concrete commands (`validate`, `sync`, `doctor`, `--json`) so the metaphor lands.

## What “good launch” includes (checklist)

| Area | Goal |
|------|------|
| **Landing (`apps/web`)** | Obvious value in seconds; proof (terminal demo, later: report embed); clear CTAs to docs + GitHub |
| **Docs site** | Single entry: install → first `validate` → link to JSON/programmatic for CI |
| **npm** | Package description matches positioning; README is scannable |
| **Proof** | Sample report or screenshot; commands page stays copy-paste first; optional narrative terminal strips are tracked in [i18nprune.dev phase](../phases/i18nprune.dev.md) |
| **Distribution** | Release post outline, changelog, optional Reddit/Dev.to/X — see [distribution](./distribution.md) when scheduling |

## README rewrite plan (repo + docs hub)

**Do these in one focused PR when ready** — not blocking code releases.

### Root `README.md`

1. **First screen:** one-line problem + **“ESLint for i18n”** + link to docs.
2. **Above the fold:** `validate` / `sync` copy-paste, link to full command list.
3. **Differentiator block:** same primitives as CLI → `@zamdevio/i18nprune/core` (2–3 bullets).
4. **Move long tables** lower or link to docs site to reduce scroll fatigue.
5. **Story (optional):** link [Origin](../origin/README.md) / [Cursor](../cursor/README.md) at end, not at top.

### `docs/README.md` (hub)

1. Keep the index table as the **map of topics**.
2. Add a **“New here?”** row pointing to `commands/validate`, `json/README`, `exports/README`.
3. Ensure **Launch** (this page) is linked once from the hub.

## Relation to other docs

| Doc | Role |
|-----|------|
| [Origin](../origin/README.md) | Why the project exists |
| [Cursor](../cursor/README.md) | How the repo was built (tooling narrative) |
| [Phases: i18nprune.dev](../phases/i18nprune.dev.md) | Landing site backlog + deferred work |
| [Phases: extension](../phases/extension/README.md) | VS Code extension (planned) |
| [Vision](../vision/README.md) | Product direction |
| [Roadmap](../roadmap/README.md) | Longer-term features |

## Feedback digest (from external review)

Useful themes to keep (already partially reflected on the landing hero):

- **Clarity gap:** strong headline, but newcomers still need **one plain sentence** on *what* breaks in real repos → addressed with a concrete subhead + terminal strip.
- **Trust:** “expected outcome” style command examples (commands page) → keep and extend.
- **Unfair advantage:** CLI and **`core`** share logic → emphasize for ecosystem credibility.
- **Next bets:** short **demo** on the page (terminal), embed **report UI** when ready, tighten **distribution** (posts, social) — not all in one day.

---

## Status

Living document. Update this file when you ship a launch milestone or change positioning.
