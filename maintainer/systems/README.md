# Systems map (`maintainer/systems`)

**Audience:** Maintainers / agents aligning **engineering truth** across ops (validate, sync, cleanup, providers, envelope, programmatic API, parity tests).
**Audience is not:** end users (`docs/commands/*`, CLI `--help`).
**Companion:** User-facing **`docs/commands/*`** mirrors behavior; **`maintainer/phases/`** captures **delivery sequencing**, shipped slices, and extension intent (some items there are temporary until v1; **routing and types** defer to **`operations/`**, **`commands/`**, and **`packages/`**.)

---

## What lives here?

| Folder | Holds |
| :--- | :--- |
| **`systems/operations/`** | Run/orchestration model, **canonical `runXxx` wiring table**, event contracts (see also `packages/core/src/types/shared/run/`) |
| **`systems/commands/`** | Operator sheets keyed by **`i18nprune help <op>`** — entrypoints, programmatic surfaces, envelopes, **`run.*` emitters**, pointers for parity |
| **`systems/extractor.md`** | Extractor subsystem map: bindings, call sites, in/out of scope vs `docs/extractor/README.md` |
| **`systems/patching.md`** | Patching subsystem: core vs CLI, barrels, `LOCALE_REGISTRY` contract, orchestration note |
| **Scaffold:** `systems/TEMPLATE.md` | Skeleton for **any** new sheet under **`operations/`**, **`commands/`**, or future siblings (not commands-only); copy and adapt |

Design rules: **`maintainer/agents/architecture.md`** and **`maintainer/agents/rules.md`**.

---

## PR discipline (systems docs)

Adding or changing **`systems/commands/<op>.md`** or **`systems/operations/`** MUST land as part of PRs touching `packages/*/src/**`.

- Update **`maintainer/phases/active-phase.md`**, **`shipped-slices.md`**, or **`maintainer/phases/extension/*.md`** only when the PR is **actually** recording phase or extension planning (not for routine wiring-only changes).
- Prefer updating **`maintainer/agents/`** when **agent authoring rules change**.

---

## Tree (current shape)

```
maintainer/systems/
├── README.md (this hub)
├── TEMPLATE.md
├── extractor.md
├── patching.md
├── operations/
│   ├── README.md
│   └── flows-and-entrypoints.md
└── commands/
    ├── README.md (index + authoring rules)
    ├── sync.md (+ stubs for cleanup, doctors, envelopes, programmatic, parity, ...)
    └── *.md stubs (validate, cleanup, ...)
```

Keep this tree truthful with `git`; don't maintain a brittle wall of filenames here.

---

## Where else (planning vs code)

| Need | Canonical place |
| :--- | :--- |
| **Slices, sequencing, extension notes** | `maintainer/phases/` ( **`extension/`** for longer-lived extension work **where referenced**.) |
| **Run/orchestration + `runSync`/`run*` table** | `maintainer/systems/operations/` and `packages/core/src/types/shared/run/` |
| **Per-op maintainer truth** | `maintainer/systems/commands/<op>.md` |
| **User docs** | `docs/commands/<op>/README.md` |
| **Extractor (user)** | `docs/extractor/README.md` |
| **Extractor (maintainer)** | `maintainer/systems/extractor.md` |
| **Patching (maintainer)** | `maintainer/systems/patching.md` |
| **Agent authoring rules** | `maintainer/agents/` (architecture, rules, jsdoc, git) |

---

## Adding a new systems note

1. Copy `maintainer/systems/TEMPLATE.md` to `maintainer/systems/<area>/<slug>.md` (or extend an existing stub).
2. Fill **Purpose**, **Primary artifacts**, **Flow or structure**, **Cross-links** (point to **`maintainer/phases/...`** only for **timing / intent**, not as a substitute for current wiring).
3. If the surface is parity-frozen (`--json`, issue codes), call that out explicitly.
4. Link the new doc from **`operations/README.md`** or **`commands/README.md`** as appropriate.

---

## What next (optional follow-ups)

- **Short “run event / envelope invariants”** block in **`operations/flows-and-entrypoints.md`** as the single prose summary (instead of scattering across transient maintainer drafts).
- **`systems/shared/`** if we need cross-cutting maintainer sheets (providers, envelopes) that aren't **per-op**.
- Thin **“how to extend the CLI without breaking parity”** pointer from **`maintainer/phases/extension/*.md`** into **`systems/commands/`**, so extension plans don't duplicate full wiring tables.
