# Topology

Architecture topology pages describe system shape, boundaries, and data flow.

They are intentionally higher-level than command docs and ADR implementation details.

## Pages

- [overview](./overview.md) — repo-level map and ownership boundaries
- [translation](./translation.md) — translation pipeline topology
- [runtime](./runtime.md) — CLI runtime lifecycle and output contracts
- [provider](./provider.md) — translation provider chain and fallback boundaries

## Documentation boundary

This section is part of the public documentation set.

- **Published docs** (`docs/**`) describe stable architecture, user-facing behavior, and technical concepts intended for external readers.
- **Internal maintainer notes** (outside the published docs tree) track in-flight planning and implementation sequencing.

For topology diagrams, maintain editable source files in internal maintainer docs, and publish rendered assets through the docs site's public asset path.
