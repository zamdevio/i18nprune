# Edge cases

Notes on unusual situations and how the tool behaves.

## Solved

Problems we hit early and fixed deliberately:

- [Per-file const maps for static keys](./solved/per-file-const-map.md) — why merged-repo scans are weaker than per-file scans for template rebuilds.
- [CLI `--json` command parity](./solved/cli-json-command-parity.md) — **`COMMANDS_WITH_JSON_OUTPUT`** vs human-only paths; **`fill`** / **`printCommandSummary`** / single-document stdout for scripts.

## Unsolved / planning

Long-horizon analysis and policy sketches (not shipped fixes yet):

- [Unsolved hub](./unsolved) — index; [policy framework](./unsolved/policy-framework.md) — FP/FN framing and future config ideas.

## When to add a page

Add a **`solved/`** page when:

- The bug or confusion was **real** in production or review, and  
- The fix is **stable** and worth remembering for future contributors and agents.

Skip documenting one-off test quirks unless they affect users.
