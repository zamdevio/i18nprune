# Sprint focus

**Shipped receipts:** [`shipped/`](../shipped/README.md)

**Open defects & perf follow-ups:** [`bugs.md`](./bugs.md) — check before starting work.

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | **AST / `typed`** — opt-in depth + finite-keys Track B | [`extractor/ast.md`](./extractor/ast.md) |
| **Next** | **Registry** — non-JS providers; **Python first** after TS/JS typed path | [`extractor/registry.md`](./extractor/registry.md) |
| **Shipped** | **`serve` stdio** — S.1–S.5; HTTP dismissed | [`shipped/serve/stdio.md`](../shipped/serve/stdio.md) · [`systems/serve.md`](../systems/serve.md) |
| **After that** | VS Code extension | [`extension/README.md`](./extension/README.md) *(own branch)* |
| **Then** | Locale-only generate | [`locale-only.md`](./locale-only.md) |
| **Queued** | Config layout UX | [`config.md`](./config.md) |
| **Planned** | `search` command | [`search.md`](./search.md) |
| **Research** | Terminal protocol | [`terminal.md`](./terminal.md) |
| **Shipped** | Extractor HOC §B (opt-in prop helpers) | [`shipped/extractor/hoc-b.md`](../shipped/extractor/hoc-b.md) |
| **Shipped** | Extractor finite-keys Track A (locale-assisted candidates) | [`shipped/extractor/finite-keys-a.md`](../shipped/extractor/finite-keys-a.md) |
| **Shipped** | Extractor cross-file (imported static const index) | [`shipped/extractor/cross-file.md`](../shipped/extractor/cross-file.md) |
| **Shipped** | Extractor light-dataflow (same-file chains + mixed-template folding) | [`shipped/extractor/light-dataflow.md`](../shipped/extractor/light-dataflow.md) |
| **Shipped** | BUG-004/005 deep-merge + nested `feature_bundle` | [`shipped/locale/deep-merge-nested-feature-bundle.md`](../shipped/locale/deep-merge-nested-feature-bundle.md) |
| **Shipped** | Cleanup uncertain-prefix protection → 1.1.1 | [`shipped/locale/cleanup-uncertain-protection.md`](../shipped/locale/cleanup-uncertain-protection.md) |
| **Shipped** | Preserve + sync → 1.0.3 | [`shipped/locale/preserve-sync.md`](../shipped/locale/preserve-sync.md) |

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Dependency chain

```txt
preserve-sync / heuristic extractor v2 (done)
  → serve stdio (shipped; HTTP dismissed)
  → AST / typed + finite-keys Track B   ← now
  → registry (Python first, then other langs)
  → extension (own branch) → locale-only → search → …
```

Config layout UX (`config.md`) is orthogonal CLI polish — can ship between larger tracks.

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from the active plan doc only.
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier` when touching exports.
