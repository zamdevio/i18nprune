# Auto-patching (loader + config)

When enabled, **i18nprune** can apply **small, reviewable edits** to your app’s **loader** and **language configuration** files so new or updated locales stay wired correctly. This is **opt-in** and **recipe-based** — there is no silent rewrite of arbitrary projects.

## Relationship to the ADR

Design rationale, rejected alternatives, and consequences: [ADR 004 — Opt-in auto-patching](../architecture/decisions/004-auto-patch.md).

## Behaviour

| Situation | What happens |
|-----------|----------------|
| Patching **off** or **unset** | Only **`localesDir`** JSON / meta work runs; app source files are untouched. |
| Patching **on** + **recognised** recipe | Patches run in a defined order; each step is deterministic and documented for that recipe. |
| **Unrecognised** layout, parse error, or missing path | **No write** to app files; the run **warns** (and may exit non-zero when strict behaviour is added). |

## Config and loader schema (direction)

Recipes are identified in **i18nprune** config (exact field names will ship with the feature). A recipe typically declares:

- **Which files** participate (loader module, app language list, etc.).
- **Which pattern family** they use (split loader + config vs single module — see ADR 004).
- **Identifiers** the tool must find (e.g. map keys, export names) so edits land in the right place.

The CLI ships **documentation per recipe** so you can align naming, imports, and paths **deliberately**. Mismatches are **fail-closed**.

## Code entry point

Implementation lives under **`packages/cli/src/core/patching/`** (`index.ts` and helpers). Until recipes ship, **`isPatchingEnabled()`** is always false.

## See also

- [User-project loader & config](./loader.md) — discovery, patterns, phased rollout ([ADR 003](../architecture/decisions/003-user-i18n-loader-integration.md))
- [Phase notes (maintainers)](../phases/patching/README.md)
- [Exit codes & behaviour](../behavior/README.md) — how warnings and failures surface
- [Roadmap](../roadmap/README.md) — patching / sequencing
