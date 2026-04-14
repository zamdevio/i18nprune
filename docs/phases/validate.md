# Phase — Validate: locale configuration & catalog health (planned)

**Status:** **not started** — do **not** implement until **opt-in auto-patching** is **stable** (central patching module + documented recipes). This phase **depends** on that surface so we can optionally align with **user-project i18n wiring** when the user enables it.

**Prerequisite:** [ADR 004 — Opt-in auto-patching](../architecture/decisions/004-auto-patch.md) implemented and exercised; [patching user guide](../patching/README.md) stable.

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Why after auto-patch?

“Validate locale health” needs a **trusted, optional** view of how the app loads i18n (loader + config). That overlaps the same integration work as **patching** and **loader discovery**. Sequencing avoids half-finished warnings and duplicate ADR scope.

---

## Goals

Extend **`validate`** (or a dedicated subcommand later) so it can **warn** when **on-disk locale metadata** and/or **resolved project config** disagree with **bundled catalog** or **best practices** — without failing the run unless you add **`--strict`** later.

### Data sources (best effort; all optional)

| Source | What we compare | When skipped |
|--------|-----------------|--------------|
| **`locales/*.meta.json`** | `direction`, `englishName`, `nativeName` (or whatever fields we standardise) vs **`languages.json`** for the file’s locale code | No sidecar for that locale, or unreadable JSON |
| **User i18n loader + config** (future) | Only when **implemented** and **user opts in** (same contract as patching / [ADR 003](../architecture/decisions/003-user-i18n-loader-integration.md)) | Loader not detected, opt-in off, or parse fails |

### Example warnings (non-exhaustive)

- **Direction** mismatch: meta says `ltr` but catalog / convention suggests `rtl` for that code (or vice versa) — **recommendation**, not a hard error.
- **English / native labels** differ from official catalog endonyms — suggest adopting **`languages.json`** strings for consistency across tooling.
- **Unknown or non-normalized** locale codes in filenames vs config.

### Skipping rules

- If **no** `*.meta.json` **and** no enabled loader snapshot: **do not** warn about meta/loader — report only existing **`validate`** behaviour (missing keys, dynamic sites).
- If **some** locales have meta and **some** do not: warn only where data exists; optionally one **info** line that N locales have no meta sidecar.
- Partial data is always **graceful degradation**.

---

## Documentation (when implemented)

- [commands/validate](../commands/validate/README.md) if split; else [behavior](../behavior/README.md)
- Cross-link from [JSON mode](../behavior/json-long.md) if machine-readable warnings are added

---

## Link from the phases index

After auto-patch ships, the [phases README](./README.md) roadmap already sequences **Validate locale health** after **ADR 004**; keep this file as the spec for that step.
