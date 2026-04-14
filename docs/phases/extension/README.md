# Phase — VS Code extension

**Status:** **Planned** — execute only after explicit scheduling.

**Prerequisite:** stable **`@zamdevio/i18nprune/core`** and CLI **`--json`** contracts (exports phase closed — [exports/README.md](../exports/README.md)).

This file is the **single source of truth** for the extension: positioning, **execution contract** for `apps/extension/`, gates, and implementation order. Update [apps/extension/README.md](../../../apps/extension/README.md) when scope changes.

---

## Positioning

**“ESLint for i18n”** in the editor: surface missing keys, dynamic call sites where the model allows, and **links to docs** — same engine as CI, not a second translation system.

## Why a separate phase

A VS Code extension is **distribution**, not core CLI behavior. It must call **`core`** and/or the **`i18nprune`** binary so results match [validate](../../commands/validate/README.md) and [JSON output](../../json/README.md).

---

## Goal

An extension that **does not fork** i18n semantics: diagnostics and commands must match **`validate`**, **`doctor`**, and documented JSON payloads. Optional distribution (Marketplace / Open VSX) comes **after** local dogfooding and automated tests.

---

## Phase gates (do not skip)

| Gate | Requirement |
|------|----------------|
| **G1 — Contract** | Extension reads the same merged config and cwd rules as the CLI (document failure modes: missing config, multi-root). |
| **G2 — Execution** | One supported path: **spawn CLI** with workspace folder `cwd` *or* in-process **`core`** with `tryResolveContext` — pick one for v1 and document it; no mixed behavior without tests. |
| **G3 — JSON** | If using CLI: parse **`--json`** stdout per [JSON output](../../json/README.md) (line-oriented, multi-document awareness). If using `core`: use `runValidate` / etc. — same envelope. |
| **G4 — Tests** | Automated tests run in CI: at minimum unit tests for argument building + fixture workspace; optional integration test with **VS Code test host** once commands exist. |
| **G5 — Failure UX** | Clear error when CLI binary missing or wrong version; link to [workflow](../../workflow/README.md) and install docs. |

---

## Implementation sequence (strict)

### Track A — Foundation (before any UI polish)

1. **Workspace layout** — `apps/extension/`: `package.json` (publisher, engines, activation), `src/extension.ts`, build (esbuild/webpack) producing a single `dist/`, `.vscodeignore`, MIT license file.
2. **Configuration** — settings: `i18nprune.executablePath` (optional), `i18nprune.configPath` (optional), respect `files.watcher` / workspace trust as needed.
3. **Resolution** — resolve workspace folder(s); single-folder v1 is acceptable if documented.
4. **Runner** — `child_process.spawn` of `i18nprune` with `cwd`, forward `stdio`, capture stdout for `--json` lines; Windows + POSIX tested in CI or documented matrix.
5. **Smoke command** — one palette command: **“Run validate (JSON)”** → output channel shows parsed summary (`ok`, `kind`, issue count) or raw JSON on parse failure.

### Track B — Trust surface

6. **Diagnostics (optional v1.1)** — map `validate --json` issues to `vscode.Diagnostic` (file + range); behind setting `i18nprune.enableDiagnostics`.
7. **Status bar** — last run exit code + timestamp; click opens output channel.

### Track C — Hardening

8. **Version check** — compare CLI `--version` (or package) against supported range; warn in output channel.
9. **Telemetry off by default** — if any, opt-in only.

### Track D — Distribution (after A–C green)

10. **Packaging** — `.vsix` build script, changelog, README for marketplace.
11. **Publish** — Open VSX and/or Visual Studio Marketplace per org policy.

---

## Explicit non-goals until Track B is stable

- Full **Language Server** / incremental sync across all files.
- **CodeLens** on every string literal.
- Bundling a duplicate copy of `core` with divergent behavior.

---

## Quick links

| Doc | Role |
|-----|------|
| [Programmatic API](../../json/programmatic.md) | `run*` helpers vs CLI `--json` |
| [exports phase](../exports/README.md) | Prerequisite API stability |

---

## See also

- [JSON output (`--json`)](../../json/README.md) · [Command orchestration](../../commands/orchestration/README.md)
- [Launch & adoption](../../launch/README.md)
