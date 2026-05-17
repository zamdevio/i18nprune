# Phase: Hover

**Status:** planned  
**Goal:** GitLens-quality **contextual** hover for locale keys — rich, fast, low-noise.

**Primary VS Code API:** `vscode.languages.registerHoverProvider` with a narrow `DocumentSelector`.

---

## User-facing intent

Examples the hover should eventually support well:

```ts
t("auth.login.title")
```

```tsx
i18n.t("dashboard.header")
```

```json
"auth.login.title"
```

(YAML and other formats: lower priority; confidence gating — see diagnostics phase philosophy.)

---

## Hover content (target sections)

When confidence is sufficient, hover may include:

- **Validity** — e.g. valid key / unknown key / partial coverage.
- **Locale coverage** — compact summary (cap count; link to dashboard for full table).
- **Translation preview** — a few locales; truncated strings.
- **Provenance** — e.g. defined in / primary source file as core reports it.
- **Confidence** — implicit via when we show rich vs minimal hover (optional explicit line).
- **Quick actions** — command URIs in `MarkdownString` (trusted): Open translation, Reveal in dashboard, Copy key.

Illustrative copy (not spec text):

```txt
✓ Valid locale key
⚠ Missing in 2 locales
```

```txt
Defined in:
messages/en/auth.json
```

---

## Hard rules

| Rule | Detail |
|------|--------|
| **Lookup-only** | `provideHover` reads from workspace intelligence + optional **doc-local** span index; **never** scans the whole workspace. |
| **No expensive work in hover** | No disk full reads, no core full re-analysis, no unbounded string search across repo. |
| **Core owns truth** | All “is this a key?” and “what’s missing?” answers flow from normalized core-backed state. |
| **Cancellation** | Respect `CancellationToken`; bail if model version changed mid-flight. |

---

## Dependencies

- **Workspace intelligence** phase: read APIs and stable invalidation story for data hovers display.

---

## Sequencing note

Implement **after** the intelligence layer can answer key queries in O(1)-ish time from memory. Optional **doc span index** (presentation-only) may map cursor → candidate string; **validation** of that string as a key still uses core’s catalog, not a parallel regex “truth.”

---

## Non-goals

- Semantic tokens / LSP (separate major investment).
- Autofix inside hover (may point to commands or future quick-fixes instead).
