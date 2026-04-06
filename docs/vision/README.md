# Vision

## Problem

Teams ship i18n bugs when **keys in code drift from locale JSON**, when **locale files diverge in shape** from the source of truth, or when **automation cannot run** the same checks as developers (no stable JSON, unclear flags, fragile paths). Translation workflows also fail when tools assume a single framework or hide behaviour behind opaque magic.

## What i18nprune is for

**i18nprune** is a **Node.js CLI** focused on **correctness and predictability**:

1. **Validate** — Prove that literal keys used in configured translation calls exist in the **source locale** JSON (or fail loudly).
2. **Sync** — Keep secondary locale files **aligned in structure** with the source (merge + prune, with explicit preserve rules).
3. **Generate / fill** — Drive machine translation for string **leaves** while preserving nested JSON shape; provider is pluggable (Google first).
4. **Quality & review** — Surface parity and English-identical metrics so humans can prioritise fixes.
5. **Cleanup** — Remove unused keys with optional **ripgrep**-backed safety against deleting still-referenced strings.
6. **Doctor** — Read-only diagnostics (runtime, tools, config, paths) for CI and onboarding.

## Principles

- **Explicit over magic** — Config file + env + CLI overrides merge in a documented order; path discovery is opt-out (`--no-discovery`), not silent surprise.
- **Automation-first** — Global **`--json`**, **`--quiet`**, **`--silent`** and per-command JSON where defined so scripts and CI get stable contracts.
- **Human-friendly logs** — Tagged lines and a central **`logger`** so verbosity rules stay consistent; errors stay on stderr.
- **Small surface area** — One binary, clear subcommand names (no cryptic short aliases).

## Non-goals (for now)

- Replacing your i18n **runtime** library or React/Vue bindings.
- Being a full TMS or handling **non-JSON** resource formats out of the box.
- Perfect extraction of **dynamic** keys (string templates, indirect calls) — the tool is honest about static limits.

## Where to go next

- [Roadmap](../roadmap/README.md) — direction and planned work at a high level.
- [Architecture](../architecture/README.md) — how layers fit together.
- [Commands](../commands/README.md) — one page per subcommand.
