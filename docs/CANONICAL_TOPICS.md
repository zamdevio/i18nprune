# Canonical topic map (one primary doc each)

Use this table to find the **single** user-facing home for a topic. **`docs/phases/**`** may repeat planning context; product docs should link here instead of duplicating long specs.

| Topic | Canonical doc |
|--------|----------------|
| **CLI entry, global flags** | [cli/README.md](./cli/README.md) |
| **JSON / `--json` envelope** | [json/README.md](./json/README.md) |
| **Issue codes (`issues[]`)** | [json/issue-codes.md](./json/issue-codes.md) |
| **Programmatic API vs CLI JSON** | [json/programmatic.md](./json/programmatic.md) |
| **`--json` + long-running commands** | [behavior/json-long.md](./behavior/json-long.md) |
| **Exports / `@zamdevio/i18nprune/core`** | [exports/README.md](./exports/README.md) · [exports/core.md](./exports/core.md) |
| **Command orchestration (vs `core`)** | [commands/orchestration/README.md](./commands/orchestration/README.md) |
| **CLI prompts (`core/ask`, per-command)** | [cli/prompts/README.md](./cli/prompts/README.md) |
| **Translator pipeline** | [translator/README.md](./translator/README.md) |
| **Live progress (stderr)** | [progress/README.md](./progress/README.md) |
| **User loader & config (future)** | [patching/loader.md](./patching/loader.md) |
| **Opt-in patching** | [patching/README.md](./patching/README.md) |
| **Repo / package layout** | [architecture/tree/README.md](./architecture/tree/README.md) |
| **Architecture overview** | [architecture/README.md](./architecture/README.md) |
| **ADRs** | [architecture/decisions/](./architecture/decisions/) |
| **Edge cases (solved)** | [edge-cases/README.md](./edge-cases/README.md) |
| **Maintainer phases** | [phases/README.md](./phases/README.md) |
| **Agent onboarding** | [agents/README.md](./agents/README.md) |
| **Why the project exists (backstory)** | [origin/README.md](./origin/README.md) |
| **Cursor / how the repo was built** | [cursor/README.md](./cursor/README.md) |
| **Launch & adoption (positioning, checklist)** | [launch/README.md](./launch/README.md) |
| **Pre-release doc sweep** | [temp/final.md](./temp/final.md) |
| **Session scratch (gitignored)** | [agents/temp-notes.md](./agents/temp-notes.md) → `docs/phases/temp/` |

When you add a major topic, **either** extend an existing row **or** add one row and link it from [docs/README.md](./README.md).
