# Agent rules

- **TypeScript** — `moduleResolution: NodeNext`; imports use `.js` extensions.
- **CLI orchestration** — parse argv into typed options, build `Context` with `resolveContext()`, keep command files thin.
- **Output contract** — respect `RunOptions` gates (`json`/`quiet`/`silent`), use `logger` for terminal output, keep JSON payloads structured and stable.
- **Non-interactive safety** — `--json` and CI/non-TTY flows must not prompt; fail fast with actionable errors.
- **Types location** — move reusable/public type contracts to `packages/cli/src/types/**` and re-export from nearest type barrel and `packages/cli/src/types/index.ts` where needed.
- **No runtime-owned exported types** — if a type is exported from a runtime module, move it to `packages/cli/src/types/**` and import it back as `import type`.
- **Core APIs** — prefer richer shared functions over wrappers (example: `resolveKeyPlaceholdersWithTrace()`); avoid duplicate logic paths.
- **Extractor robustness** — parse and bound translation call spans (`t(...)`) before key inspection; support multiline calls and inline/block comments.
- **Tests** — colocated unit tests in `packages/cli/src/**/__tests__/`; CLI behavior coverage in `tests/integration/`.

---

## Phase docs (`docs/phases/**`)

Phase files are **long-lived** planning and handoff context. They are **not deleted** when a slice ships; they should stay **usable** for the next maintainer or agent.

1. **After completing a phase** — Rewrite the same file into a clear shape: short **status** (done / superseded / parked), **what shipped**, **what moved elsewhere** (ADRs, product docs, `docs/edge-cases/solved/`), and **links** to follow-up work. Avoid leaving only raw scratch or mixed tenses.
2. **New phases** — Follow the same pattern: title, scope, checklist, status line, handoff links. Prefer one **active** hub ([`active-phase.md`](../phases/active-phase.md)) plus focused phase READMEs over duplicate narratives.
3. **Session-only noise** — Use [`docs/phases/temp/`](./temp-notes.md) (gitignored) for throwaway notes; do not let temp structure drift into tracked phase files without a cleanup pass.
4. **Index** — Keep [`docs/phases/README.md`](../phases/README.md) honest: point to the canonical phase doc per topic and to these rules.

See also: [`temp-notes.md`](./temp-notes.md) for when to use `docs/phases/temp/`.
