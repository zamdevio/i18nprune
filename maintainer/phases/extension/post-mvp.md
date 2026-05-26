# Phase: Post-MVP editor & UX backlog

**Status:** deferred  
**Goal:** Track **editor-heavy** enhancements that are **not** part of the initial intelligence / Generate roadmap. Revisit after hover, diagnostics, and Generate are stable.

These items originated from the extension backlog; they are intentionally **out of sequence** for early phases to avoid scope creep.

---

## Backlog items

| Item | Intent |
|------|--------|
| **Share host surface** | After extension foundation + core share are stable: wire **`runShare*`** (or CLI `--json` spawn) from the editor; document the extension as a fourth share host in [`maintainer/systems/share.md`](../../systems/share.md) (alongside CLI, web, worker). |
| **Interactive diff view** | VS Code–like side-by-side or inline diff for translation changes. |
| **Multi-language editor** | Multiple locale columns or synchronized editing where product fits. |
| **Project breadcrumbs** | Deeper breadcrumb integration across workspace navigation. |

---

## Dependencies (when un-deferred)

- [workspace-intelligence.md](workspace-intelligence.md) and/or [diagnostics.md](diagnostics.md) — most editor affordances assume stable key/locale model and file provenance.
- Product decision on whether diff/multi-edit live in webview, custom editor, or native diff APIs.

---

## Rules

- Still **no duplicate analysis** — any “compare locales” view reads from core-backed or WI-backed state.
- Each backlog item should get its own short ADR or phase split when promoted from **deferred**.

---

## Non-goals

- Implementing any of the three in this document during Foundation / WI / hover unless explicitly re-scoped.
