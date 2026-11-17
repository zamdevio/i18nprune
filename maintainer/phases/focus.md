# Sprint focus

**Shipped receipts:** [`shipped/`](../shipped/README.md)

**Open defects & perf follow-ups:** [`bugs.md`](./bugs.md) — check before starting work.

---

## Focus now

| Priority | Vertical | Doc |
|----------|----------|-----|
| **Now** | **Close-out before next release** — finish extractor (finite-keys → HOC §B → AST/`typed`) **and** close serve, then one release | [`extractor/README.md`](./extractor/README.md) · [`serve.md`](./serve.md) |
| **With that release** | BUG-004/005 (deep-merge loaders + nested `feature_bundle`) already fixed in-tree — ship in the same cut | [`shipped/locale/deep-merge-nested-feature-bundle.md`](../shipped/locale/deep-merge-nested-feature-bundle.md) |
| **Next** (after release) | VS Code extension | [`extension/README.md`](./extension/README.md) *(own branch)* |
| **Then** | Locale-only generate | [`locale-only.md`](./locale-only.md) |
| **Queued** | Config layout UX | [`config.md`](./config.md) |
| **Planned** | `search` command | [`search.md`](./search.md) |
| **Closing** | `serve` — S.1–S.5 landed (stdio goal met); S.6 optional HTTP in the same close-out if we keep the vertical complete | [`serve.md`](./serve.md) · [ADR 012](../../docs/architecture/decisions/012-cli-serve-transport.md) |
| **Research** | Terminal protocol | [`terminal.md`](./terminal.md) |
| **Shipped** | Extractor cross-file (imported static const index) | [`shipped/extractor/cross-file.md`](../shipped/extractor/cross-file.md) |
| **Shipped** | Extractor light-dataflow (same-file chains + mixed-template folding) | [`shipped/extractor/light-dataflow.md`](../shipped/extractor/light-dataflow.md) |
| **Shipped** | Cleanup uncertain-prefix protection → 1.1.1 | [`shipped/locale/cleanup-uncertain-protection.md`](../shipped/locale/cleanup-uncertain-protection.md) |
| **Shipped** | Preserve + sync → 1.0.3 | [`shipped/locale/preserve-sync.md`](../shipped/locale/preserve-sync.md) |

Engineering maps: [`systems/README.md`](../systems/README.md).

---

## Dependency chain

```txt
preserve-sync (done)
  → extractor v2 close-out (finite-keys → HOC §B → AST/`typed`)
  → serve close-out (S.1–S.5 done; S.6 if keeping the vertical complete)
  → one release (YAML covers extractor + serve + BUG-004/005 + post-1.1.1 work)
  → extension (own branch) → locale-only → search → …
provider registry stays on hold until typed + extension are stable
```

Config layout UX (`config.md`) is orthogonal CLI polish — can ship between larger tracks.

---

## Guiding rules

- **CI-first:** `expgov validate` + parity tests on SDK/CLI changes.
- **One concern per PR** — scope from the active plan doc only.
- **No bulk `stable.exact` dumps** — module-by-module reclassification + `@sdkTier` when touching exports.
