# Phase: Completions

**Status:** planned  
**Goal:** Smart locale key completion (e.g. inside `t("|")`) using **workspace intelligence** read APIs — **no** workspace rescan on each completion request.

**Primary VS Code API:** `vscode.languages.registerCompletionItemProvider` (narrow selector + optional trigger characters).

---

## Examples

```ts
t("|")   // suggest keys
```

Filtering, prefix match, and ranking should use **pre-indexed** key lists from the intelligence layer (populated from core), not filesystem walks.

---

## Dependencies

- **Workspace intelligence** — stable key catalog and invalidation when keys change.

---

## Rules

- **Never rescan workspace** in `provideCompletionItems`.
- **No duplicate indexing** of keys separate from the intelligence layer’s catalog (doc-level position hints are optional but must not become a second source of key truth).
- **Cancellation** — respect token; cap result count for large projects.

---

## Non-goals

- Completing arbitrary non-i18n string literals without high confidence (avoid noise).
- LSP-powered completions in this phase unless product direction explicitly merges phases.
