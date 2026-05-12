# Origin — why i18nprune exists

This project didn’t start as an idea.

It started as a **blocker**.

---

## The real situation

While building **CepatEdge** — an enterprise-grade maintenance platform —  
i18n became a serious friction point.

Not in theory. In practice.

- missing translation keys
- inconsistent locale structures
- no reliable validation
- manual cleanup everywhere
- no confidence in CI

At small scale, this is annoying.

At system scale, it becomes a slowdown.

---

## About CepatEdge (context)

CepatEdge is not a small project.

It’s a full system:

- multiple applications (`apps/web`, `apps/workers`, `apps/docs`)
- large API surface (auth, maintenance workflows, analytics, system APIs)
- role-based flows (staff, technician, HOD, admin)
- edge-first architecture (Cloudflare Workers + Neon DB)
- extensive documentation and planning structure

The repository itself spans **hundreds of files across many domains**, including:

- backend APIs
- frontend dashboards
- system tooling
- architecture decisions
- operational workflows

---

## The breaking point

At some point, it became clear:

> continuing without fixing i18n properly  
> would slow everything else down

So development didn’t “adapt”.

It paused.

---

## The decision

Instead of patching the problem repeatedly:

Build a tool that can:

- validate translation usage
- detect missing / unused keys
- sync locale structures
- generate and **`generate --resume`** keys
- produce structured reports
- integrate into CI workflows

Not a script.  
Not a temporary fix.

A **system-level tool**.

---

## Why build it separately

This couldn’t live inside CepatEdge.

It needed to be:

- reusable
- isolated
- testable across projects
- designed as a proper CLI + API

So i18nprune became its own repository.

---

## Open source plan for CepatEdge

CepatEdge is planned to be open-sourced.

The goal is to release:

- the full system architecture
- real-world patterns (edge, caching, RBAC, workflows)
- documentation and decision history
- deployment and operational strategies

This matters because:

> i18nprune is not theoretical  
> it was built under real system pressure

---

## The outcome

i18nprune is the result:

- a production-oriented i18n toolkit
- designed for automation and CI
- built from real constraints, not assumptions

---

## Why this matters

i18n is often ignored until it becomes painful.

This project treats it differently:

> something that should be  
> visible, enforceable, and automated

---

## Related topics

These pages sit **beside** the technical manuals — they explain **why** and **how**, not CLI flags.

| Topic | Doc |
|-------|-----|
| **How this repo was built** (Cursor, agent passes, usage limits, human direction) | [Cursor & tooling](../cursor/README.md) |
| **Vision** — where the product is headed | [Vision](../vision/README.md) |
| **Roadmap** | [Roadmap](../roadmap/README.md) |
| **Contributing** | [Contributing](../contributors/README.md) |
| **Agent notes (repo-only)** | See `maintainer/agents/README.md` (not published on the docs site) |
| **Docs index** (commands, JSON, exports, …) | [Documentation home](../README.md) |