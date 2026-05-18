# Phase: Init UI (onboarding)

**Status:** planned  
**Goal:** Premium onboarding — **visual host** over **core init** intelligence, not a parallel wizard engine.

---

## When the init webview appears

| Condition | Extension behavior |
|-----------|-------------------|
| **No** `i18nprune.config.*` in the **workspace folder** the user opened (same root VS Code uses for the window / multi-root folder entry) | **Show** the init onboarding webview (primary empty-state for that workspace). |
| At least one config file matches project discovery rules (same set CLI uses: `i18nprune.config.ts`, `.js`, `.mjs`, `.cjs`, … per core) | **Do not** auto-open init; user may run **“i18nprune: Initialize project”** (or equivalent command) from the palette if they want to re-run onboarding. |
| Config exists but is invalid / unreadable | Show init **or** a dedicated error panel per product choice — **must** still call **core** `runInit` / load paths; no extension-only config parser. |

**Binding rule:** Trigger is **per workspace folder**, not global. Multi-root: each folder without config may show its own init state when that folder is active (or a single webview scoped to the active folder — pick one at implementation; document in `apps/extension/README.md`).

**Implementation home:** `apps/extension/` webview panel; data from **`runInit`** (and related core init APIs) with **`--json`-shaped** results where applicable.

---

## Philosophy

- **Core init APIs** own detection steps, confidence scores, and “what we found” facts.
- **Extension** renders: checklists, progress, editable config preview, and actions (“Write config”) by **calling core** and reflecting results.

Future UX examples (illustrative only):

```txt
✓ Detected next-intl (92%)
✓ Found messages/en/**/*.json
✓ Found useTranslations()
```

Then: editable config preview → user confirms → **Write config** via core (or core-directed write), not hand-built merge logic in the extension.

---

## Dependencies

- **Foundation** — settings, workspace binding, logging ([`foundation.md`](./foundation.md)).
- **Core init** — **Session F shipped** (`runInit`, presets, `--json`); extension must not ship before stable init result types ([`../init.md`](../init.md)).

**Schedule:** Init UI is **extension** work **after** core **locales** contracts stabilize ([`../active-phase.md`](../active-phase.md) locked chain). Do not block Session **H** on the webview.

---

## Rules

- **No duplicated init logic** — no second detector for frameworks or folder layouts in the extension.
- **Degrade gracefully** — if core returns partial data, UI shows partial with honest “unknown” states.

---

## Non-goals

- Implementing init flows before core init contract exists.
- Hardcoding framework lists in the extension that belong in core.
- Replacing **`i18nprune init`** CLI — webview is a host; CLI remains the CI/automation path.
