# Phase: Init UI (onboarding)

**Status:** planned  
**Goal:** Premium onboarding — **visual host** over **core init** intelligence, not a parallel wizard engine.

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

- **Foundation** — settings, workspace binding, logging.
- **Core init** — stable, testable API that returns structured init results the UI can render without reinterpretation.

---

## Rules

- **No duplicated init logic** — no second detector for frameworks or folder layouts in the extension.
- **Degrade gracefully** — if core returns partial data, UI shows partial with honest “unknown” states.

---

## Non-goals

- Implementing init flows before core init contract exists.
- Hardcoding framework lists in the extension that belong in core.
