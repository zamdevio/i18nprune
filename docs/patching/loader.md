# User-project i18n loader & config (extensibility)

This document describes how **i18nprune** can understand a **consumer project’s** i18n wiring (a small **loader** module plus **resource/config**, as many apps structure i18n), without running the user’s app.

**Formal decision & rationale:** [ADR 003 — User-project i18n loader integration](../architecture/decisions/003-user-i18n-loader-integration.md) (opt-in, warnings, non-interactive failure modes).

**Maintainer execution notes:** [phases/patching/loader.md](../phases/patching/loader.md).

**Tracking:** near-term sequencing lives in **[phases README](../phases/README.md)**; this file + the ADR are the durable spec.

## Goals

1. **Recognise** documented patterns in the user repo (imports, `resources` / locale paths, helper names).
2. **Stay safe:** if patterns do not match, **warn** and **do not** rewrite user files automatically.
3. **Optional auto-patch:** later, offer **opt-in** updates when i18nprune’s **expected templates** change (with preview / diff).

## Concepts

| Piece | Role |
|--------|------|
| **i18nprune config** | `i18nprune.config.ts` / `.mts` / `.js` — tool source of truth for paths + `functions` (no JSON config). |
| **User i18n module** | Typically `src/i18n.ts` (or similar): `createI18n`, `resources`, `t`, etc. |
| **Pattern registry** | Versioned **AST / regex** shapes we officially support (documented in `docs/`). |

We can support **either**:

- **Two files** — `i18nprune.config.*` + `src/i18n.ts` (loader), or  
- **One file** — combined loader + metadata if the team prefers a single entry (same pattern table, one scan target).

## Phased rollout

### Phase A — Discovery (read-only)

1. Add optional config keys, e.g. `i18nModule: 'src/i18n.ts'` (or infer from `src` + common filenames).
2. **`doctor` / `validate`**: if present, **parse** (lightweight) for:
   - default export vs named exports;
   - `resources` / locale keys we can correlate with `localesDir`;
   - overlap with `functions` in i18nprune config.
3. **Mismatch** → single **`[warn]`** with doc link (once we add the user guide page).

### Phase B — Strict pattern table

1. Publish **supported patterns** in docs (e.g. “Vue I18n `createI18n` + JSON resources”, “custom `t` wrapper”).
2. Implement **one pattern** end-to-end first; add more behind **feature flags** or minor versions.

### Phase C — Auto-patch (opt-in)

1. Store **template hashes** or version fields in generated stubs.
2. CLI: `i18nprune migrate` or `i18nprune init --upgrade` with **dry-run** default.
3. Never overwrite without **confirm** or **`--yes`** in CI.

## Risk controls

- **No silent edits** to user i18n files.
- **Dynamic keys** remain **warnings**, not inferred keys.
- **Pattern drift** → clear message + link to docs, not cryptic parse errors.

## Related

- [Patching overview](./README.md) — opt-in auto-patching ([ADR 004](../architecture/decisions/004-auto-patch.md))
- [ADR 002 — Configurable translation calls](../architecture/decisions/002-configurable-translation-calls.md) — configurable `functions` for extraction.
- [ADR 003 — User-project i18n loader](../architecture/decisions/003-user-i18n-loader-integration.md) — opt-in integration behaviour.
- [Validate command](../commands/validate/README.md) — literal vs dynamic behaviour.
