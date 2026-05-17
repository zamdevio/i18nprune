# Phase: Diagnostics

**Status:** planned  
**Goal:** Proactive editor feedback — **high confidence, low noise** — using the **same** workspace intelligence as hovers.

**Primary VS Code API:** `vscode.languages.createDiagnosticCollection` (+ optional code actions later).

---

## Examples (eventual)

- Invalid or unknown keys (when catalog is authoritative).
- Missing translations in required locales (as core defines “required”).
- Suspicious dynamic usage (only if core exposes a classified signal — do not invent heuristics in the extension alone).
- Low-confidence references — **off by default** or scoped to warnings with a setting.

---

## Confidence philosophy

| Principle | Practice |
|-----------|----------|
| **Prefer silence to noise** | Fewer, accurate diagnostics beat noisy “maybe” squiggles. |
| **Same data as hover** | If hover would not show a rich card, diagnostic probably should not fire (unless explicitly “strict mode”). |
| **User control** | Settings: strictness, enabled languages, max issues per file. |
| **Gradual rollout** | Start with 1–2 high-signal rules; add more only with telemetry or dogfooding feedback. |

---

## Dependencies

- **Workspace intelligence** — authoritative key/locale state.
- **Hover** phase precedes this in the roadmap so **key-at-cursor semantics** and false-positive rates are understood before editor-wide squiggles.

---

## Rules

- No second analysis pipeline; diagnostics are **views** over the same normalized structures hovers use.
- Debounce publication updates where core batches invalidation to avoid flicker.

---

## Non-goals

- ESLint-style full-program analysis in the extension.
- Diagnostics for files outside core’s supported project scope without clear UX.
