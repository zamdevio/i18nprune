# <title> — systems note

> **Scaffold:** copy to the right folder (`commands/`, `operations/`, or a future sibling), rename, remove this callout. Use **kebab-case** filenames.

## Purpose

- One or two sentences: what this document helps a maintainer or agent **do** (navigate code, understand a flow, not replace user docs).

## Status

- **Lifecycle:** `stable` | `evolving` | `superseded by …`
- **Last reviewed (PR / date):** …

## Scope

- **In scope:** …
- **Out of scope:** (user-facing `docs/`, long-term roadmap detail — point to **`maintainer/phases/`** or **`maintainer/phases/extension/`** for extension-specific plans.)

## Primary artifacts

- **Code / config paths:** `packages/...`, `apps/...` (be specific; avoid volatile line numbers.)
- **Types / contracts:** e.g. `packages/core/src/types/...` when relevant.

## Flow or structure

- Short numbered or bulleted walkthrough, or a table of **entry function → file**.

## Cross-links

- **Related systems pages:** …
- **Phase / shipped context (if any):** `maintainer/phases/...` — use for **when/why** decisions and slice memory, not as a substitute for **current** wiring (that lives here + code).
- **Run / envelope behavior:** prefer **`maintainer/systems/operations/`** and **`packages/core/src/types/shared/run/`** over ad-hoc maintainer drafts.

## Frozen API (optional)

- **`--json`**, issue codes, exit codes, parity tests — only if this note touches a frozen surface.

## Change discipline

- Update this file **in the same PR** that changes the behavior or entrypoints it describes.
