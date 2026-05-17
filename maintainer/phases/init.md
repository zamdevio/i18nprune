# Init phase — onboarding intelligence

**Status:** **Session F — shipped (core + CLI).** `runInit`, preset registry + scoring, `buildInitConfigTemplate`, and **`i18nprune init`** (`--auto`, `--preset`, `--json`, TTY flows) ship from **`packages/core`** + **`packages/cli`**. **Extension** host tasks (I1–I3 in [`extension/README.md`](./extension/README.md)) and deeper **extractor-first** detection signals (per §Implementation sequencing) are **follow-ups**, not blockers for starting **Session H** on the agreed config/locale contract surface.

**Dependency:** **Extractor** phase remains upstream for call-site and runtime-usage signals; init **delegates** to extractor where detection needs usage evidence ([`extractor.md`](./extractor.md)).  
**Blocks:** **Locales** phase ([`locales.md`](./locales.md)) — locales work assumes **stable config schema** and **preset** vocabulary from init.

Canonical phase order: **[`active-phase.md` § Locked chain](./active-phase.md#locked-cross-phase-dependency-chain)**.

---

## Goal

**Best-in-class onboarding:** a user (CLI or IDE) can converge on a **high-confidence** `i18nprune` configuration with **transparent scoring**, minimal noise, and **one** intelligence implementation.

---

## Architectural decision

### One intelligence layer, many hosts

| Layer | Responsibility |
|-------|----------------|
| **`packages/core`** | Owns **reusable public APIs** for: project detection, candidate scoring, preset resolution, and config generation / merging. Returns **structured results** (candidates, scores, warnings, proposed config fragments). **No `console.*`** — core purity preserved; human text is assembled by hosts from structured payloads. |
| **CLI** | Thin host: argv, prompts, `--json`, exit codes. Example: `i18nprune init --auto`. |
| **Extension** | Thin host: visual setup, progress, apply/diff — calls the **same core APIs** as CLI. |

**Non-goal:** duplicated init heuristics in CLI vs extension. Any detection rule worth shipping lives in **core** (or core-callable modules), invoked by hosts.

Illustrative API **shapes** (names are **not** frozen):

- `detectProjectI18nSetup(...)` — structured scan output + scores  
- `generatePresetConfig(...)` — config document / fragments for a chosen preset  
- `getPresetRecommendations(...)` — ordered preset suggestions with rationale fields  

Exact signatures export from `packages/core` in a later slice; this doc locks **ownership and behavior**, not identifiers.

---

## Presets

### CLI / UX examples

- `i18nprune init --preset next-intl`  
- `i18nprune init --preset i18next`  
- (Additional presets as justified — each preset is a **curated bundle** of defaults.)

### Principle: **preset ≠ locale mode**

A **preset** configures, among other things:

- Default **locale mode** and **locale structure** hints (see [`locales.md`](./locales.md))  
- **Paths** and **glob / file patterns**  
- **Extractor defaults** (`functions`, conventions, framework-specific hooks *only when* represented as data config — not hidden forked logic)  
- **Runtime assumptions** documented per preset (what signals init expects from extractor)

The preset owns **opinionated defaults**; explicit user config overrides win per normal merge rules (documented at implementation time).

---

## `--auto` (premium onboarding)

**Goal:** automatically detect the project and emit a **high-confidence** config proposal (or a short ranked list when ambiguous).

### Signal sources (weighted heuristics)

Detection **must** combine evidence; avoid a single hardcoded `if (dep) then preset` tree as the sole logic.

| Signal | Examples / notes |
|--------|------------------|
| **package.json** | Known i18n libraries: `next-intl`, `i18next`, `react-intl`, `@lingui/core`, `next-i18next`, etc. Version ranges may inform confidence. |
| **Locale directory topology** | Common roots: `locales/`, `messages/`, `translations/`, `i18n/`, `lang/`, `public/locales/`, … Multiple candidates **must** be ranked, not first-wins blindly. |
| **Locale file topology** | Flat `locales/en.json`; locale-per-dir `messages/en/auth.json`; feature-bundle `locales/auth/en.json` — classification feeds **preset + locales** defaults ([`locales.md`](./locales.md)). |
| **Runtime usage** | Calls matching extractor conventions: `t()`, `useTranslations()`, `i18n.t()`, … Use **extractor** (and binding expansion when shipped) where appropriate — do not reimplement parallel regex engines for the same job. |
| **Convention match** | Framework markers (Next.js app/router, config files, known entry layouts). |
| **Conflicting signals** | Lower net confidence; surface **disambiguation** fields for hosts (CLI prompt vs extension UI). |

### Confidence scoring (**required**)

- Output **numeric or tiered confidence** per major conclusion (e.g. detected stack **92%**).  
- Weighted combination of: library detection, topology match, usage match, convention match, conflict penalties.  
- Prefer **scored heuristics** + explainable factors (for `--json` and extension UI), not opaque single scores.

---

## Logging and telemetry

**Decision:** **No new logging system** in core.

- Core returns **structured detection / trace** fields suitable for hosts.  
- Optional progress or diagnostic lines use existing **run event / message** patterns (`RunEmitter`, `run.message`, etc.) where already established for long-running init flows — **same channels as other ops**, not a parallel logger type.

CLI continues to own **human formatting**; extension owns **UI**.

---

## `--rich`

`--rich` remains supported, e.g.:

```bash
i18nprune init --preset next-intl --rich
```

**Quality bar:**

- Skimmable, educational, copy-safe sections  
- Avoid noise walls — rich mode explains **why** a preset was chosen, not every internal branch

---

## Implementation sequencing (suggested)

1. **Types + pure detection modules** in core (no CLI changes) — package graph + directory scoring + usage sampling via extractor.  
2. **Preset registry** (data-driven descriptors referencing locale defaults + extractor defaults).  
3. **Config generation + merge** with existing `resolveCoreConfig` / schema.  
4. **CLI `init --auto` / `--preset`** wiring + `--json` envelope.  
5. **Extension** consumes the same exports (see extension doc).

---

## Risks

- **Schema churn** without coordination blocks **locales** — gate locales work on init schema freeze points.  
- **Overfitting** one framework in heuristics — mitigate with scored multi-signal design.  
- **False-high confidence** — always allow host-level confirmation for destructive merges.

---

## Non-goals (init phase)

- Replacing extractor with AST-based whole-program analysis for init-only.  
- Remote config fetch or account-based onboarding.  
- Preset-specific **hidden** branching inside unrelated ops (keep presets **data** + thin glue).

---

## Future-safe notes

- New presets should be **additive** (new JSON descriptor + tests) where possible.  
- Detection output should version (e.g. `schemaVersion` field) for `--json` stability when we extend signals.
