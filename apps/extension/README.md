# apps/extension — VS Code extension (workspace)

**VS Code** extension sources live here — **not** a browser extension.

**Plans & sequencing:** **[`maintainer/phases/extension/README.md`](../../maintainer/phases/extension/README.md)** — philosophy, architectural rules, phase index, gates (G1–G5), Tracks A–D, init onboarding (I1–I3), and links to each phase doc. Read that before changing scope here.

## Prerequisites

- Stable **`@i18nprune/core`** and documented CLI **`--json`** envelopes ([JSON output](../../docs/json/README.md), [programmatic API](../../docs/json/programmatic.md)).

## Current state

- **`package.json`** — manifest, activation, and tooling as wired for this workspace.
- Implementation follows **`maintainer/phases/extension/README.md`** (workspace settings, spawn-vs-core decision, tests before marketplace).

## Quick index

- **[TODO.md](TODO.md)** — short map into **`maintainer/phases/extension/`** (no duplicate long-form specs in this folder).

## Public site

The [Open source](https://i18nprune.dev/opensource) page should link to **`maintainer/phases/extension/README.md`** (same hub as above).
