# Temporary notes (`docs/phases/temp/`)

The folder **`docs/phases/temp/`** is **gitignored**. Use it for **session-only** planning: scratch checklists, copy-paste research, or “what I’m doing right now” notes.

## Rules

1. **Do not** commit files under `docs/phases/temp/` — they are for local / agent working memory only.
2. **Do not** duplicate long-lived specs there. When something stabilizes, move it to:
   - **`docs/phases/<topic>.md`** or a phase subfolder for maintainer execution context, or  
   - **`docs/<topic>/README.md`** (or another canonical `docs/**` path) for product docs.
3. Prefer **one canonical doc per topic** under `docs/` (excluding `docs/phases/**` planning overlap, which is allowed).

## When agents should use it

- Mid-task brain dumps before restructuring docs or code.  
- Short-lived task graphs that would clutter `active-phase.md`.  
- Anything you would delete at the end of the day without losing shipped truth.

## End-of-phase cleanup

Before opening a PR, **delete or empty** your `docs/phases/temp/*` files. Use **[`docs/temp/final.md`](../temp/final.md)** for reminders about docs that must be refreshed after large moves (tree, paths, behavior).
