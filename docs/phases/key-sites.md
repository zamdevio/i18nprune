# Phase — Key observations (`keySites`)

**Status:** **active** — foundation work: **typed key observations** (literals + template resolution + `constMap` trace), optional links to **heuristic dynamic** sites, then **CLI / `core` adoption**. **`locales`** JSON + **`list`** are **shipped**; **key-sites** continues and can overlap with **`review`** and other tracks — see [active-phase.md](./active-phase.md).

This file is **development-only** (see repo `.gitignore` for `docs/phases/`).

---

## Why this phase first

Today **`exactLiteralKeys`** on merged source collapses everything into **`Set<string>`** — we lose **file:line**, **template raw text**, and **substitution steps**. **`missing` / `validate` / `cleanup`** and future reporting DTOs need the **same** canonical model. Shipping **keySites** first avoids rewiring twice.

**Update (shipped):** **`computeMissingLiteralKeys`** / **`missing --from-report`** and **`cleanup`** now use the same per-file literal key usage scan, so duplicate identifiers like `const NS` in different files do not collide into false “missing” or false “unused” paths. See [extraction.md](../regex/extraction.md#duplicate-const-identifiers-across-files).

---

## Design decisions (locked)

### 1–2. Data shape + composable types

- **Composable interfaces:** e.g. **`SourceSpan`** (`filePath`, `line`, `column?`, `functionName?`), **`ConstSubstitution`** (ordered `{ identifier, value }[]`), kind-specific payloads.
- **Combined union:** **`KeyObservation`** (name TBD) discriminated by **`kind`** (`literal` | `template_resolved` | `template_partial` | …).
- **Every resolved path** (plain literal or rebuilt template) carries **full `span`** + **`resolvedKey`** when known.
- **Central message helper:** one place maps **`kind` (+ fields)** → human string for CLI and later HTML (no duplicated copy).

### 3. Optional `dynamicRef`

- When **`span`** matches (or heuristic provides a stable id) a **`DynamicKeySite`**, attach **`dynamicRef`** for cross-navigation — **does not** merge trust levels; **keySites** stay **high-trust** for static/template resolution, **dynamic** stays **heuristic**.

### 4. Namespaces (option **A**)

- **`keySites`** — deterministic / template-resolved observations (public **`core`** surface).
- **`dynamic`** — existing heuristic scanner (**unchanged contract**).
- **Merged view** only in **report DTOs** (e.g. HTML page model), not as the only primitive API.

### 5. Module layout

- **`packages/cli/src/core/extractor/keySites/`** — types, **`scanKeyObservations`**, **`resolveWithTrace`** (instrument `resolveKeyPlaceholders`), tests.
- Refactor **`exactLiteralKeys`** to **derive** from **`KeyObservation[]`** — **parity tests** against current behaviour.

### 6. Dynamic scanning layout (consolidated)

| Module | Role |
|--------|------|
| **`core/extractor/dynamic/`** | Providers, **`findDynamicKeySites`**, rebuild, comments — plus **`orchestrate.ts`** for **`scanProjectDynamicKeySites`** / **`analyzeDynamicKeysFromSourceText`**. |
| **`core/extractor/dynamic/index.ts`** | Barrel: mechanics + orchestration. **Imports:** `@/core/extractor/dynamic/index.js`. |

The old **`core/dynamic/index.ts`** shim was removed; everything lives under **`extractor/dynamic`**.

### 7. Report integration boundary

- Key-sites provides structured observations consumed by report DTO builders.
- Report command/format decisions are tracked in **[report.md](./report.md)**.

### 8. `core` exports (later in this phase or follow [exports phase](./exports/README.md))

- **`export * as keySites`** (or named exports) from **`packages/cli/src/exports/core.ts`** — **semver-stable** types + **`scanProjectKeyObservations`**, **`literalKeyUsageFromObservations`**, **`scanProjectLiteralKeyUsage`**, **`ProjectLiteralKeyUsage`** (see [exports phase](./exports/README.md)).
- **`dynamic`** remains its own namespace — **two namespaces**, not one merged blob.

---

## Milestones (lean, ordered)

1. **Types** — `SourceSpan`, `ConstSubstitution`, **`KeyObservation`** union (+ optional **`dynamicRef`**).
2. **Trace** — extend **`resolveKeyPlaceholders`** (or wrapper) to return **substitution steps** + final string or **`null`**.
3. **Scan** — **`scanKeyObservations(text, functions, constMap)`** (+ file loop helper); parity tests vs **`exactLiteralKeys`** output set.
4. **Wire** — **`computeMissingLiteralKeys`** / **`validate`** use resolved keys from observations; **`validate --json`** includes **additive** **`keyObservations`** — **no breaking change** to existing fields. **`validate`** uses **one** project scan for observations + missing keys (**`computeMissingLiteralKeysFromResolvedKeys`**) where possible.
5. **`missing` / `cleanup`** — richer messages using **`span`** (optional milestone).
6. **`@zamdevio/i18nprune/core`** — export stable API (**keySites** namespace).
7. **Reports integration** — command/report layers can embed observation summaries by **`kind`** (full report planning lives in **[report.md](./report.md)**).

---

## Non-goals (this phase)

- Replacing **`DynamicKeySite`** model entirely — **link**, don’t merge primitives.
- **Locales** subcommand completion — **blocked** behind milestone **4** minimum (see [locales.md](./locales.md) note).

---

## Acceptance (phase “done” for handoff)

- [ ] **`KeyObservation`** (or chosen name) documented in **`packages/cli/src/types/`** and used internally.
- [ ] **Parity:** same resolved key set as today’s **`exactLiteralKeys`** on fixture projects.
- [x] **`validate --json`** includes structured observations (**additive**).
- [ ] **`core`** exports **keySites** surface + types (**semver**-conscious).
- [ ] **Locales** phase **unblocked** or explicitly re-prioritized in [README](./README.md).

---

## See also

- [exports/README.md](./exports/README.md) — public API grouping (`scan*` / `compute*` vs `run*`) + Result envelope plan.
- [locales.md](./locales.md) — deferred until keySites foundation lands.
- [dynamic README](../dynamic/README.md) — end-user dynamic-keys story.
