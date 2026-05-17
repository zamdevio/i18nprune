# Phase: Foundation

**Status:** planned  
**Goal:** Stable extension spine — activation, boundaries, project ownership — **without** rich editor UX (no hover in this phase).

---

## Purpose

Deliver a maintainable shell that can later host workspace intelligence, hovers, and dashboard features without rework.

---

## Responsibilities

| Area | Responsibility |
|------|----------------|
| **Activation lifecycle** | Narrow `activationEvents`; lazy work after `activate`; clean `deactivate`. |
| **Command registration** | Commands registered in one place; delegates to modules (keep orchestration thin). |
| **Settings architecture** | `contributes.configuration` schema, defaults, and a small settings reader — no business logic duplication. |
| **Workspace detection** | Discover `i18nprune` projects, active project selection, persistence — **delegating rules to core** where core defines them. |
| **Logger integration** | Structured or leveled logging consistent with debugging in the field (no PII in keys if policy requires). |
| **Extension ↔ core boundary** | Explicit adapter module: “call core / map results” — no scatter of `@i18nprune/core` imports across UI files. |
| **Project ownership model** | Single active project vs multi-root; path → project binding strategy documented before intelligence layer. |
| **Monorepo / multi-project awareness** | Discovery list, user override, sensible defaults — aligned with core’s notion of project root. |

---

## Dependencies

- **Core:** Extractor / project identification contracts stable enough to bind a workspace folder to a project without the extension guessing file formats.
- **This repo:** None from later phases.

---

## Related: core integration gate

Before calling core for real workloads (generate, validate, future WI hydration), satisfy the checklist in **[core-integration.md](core-integration.md)** — pinned exports, `CoreResolvedPaths`, cancellation, envelope shapes, multi-root honesty, tests, release hygiene.

---

## Explicit non-goals

- GitLens-style hovers.
- Diagnostic squiggles.
- Full init wizard UI (see init-ui phase).

---

## Exit criteria (documentation-level)

- Phase doc updated with “done” only when: activation path is documented, settings keys listed, and core boundary file/module name is agreed for implementation.
