# `--json` and long-running commands (`generate`, `fill`, `sync`, …)

This page describes **how machine-readable mode and long-running work interact** with **prompts**, **progress**, and **stdout**. Release sequencing and **`--report-file`** are tracked in the **[Roadmap](../roadmap/README.md)** and maintainer **[phases index](../phases/README.md)**.

## Two different meanings of “JSON mode”

1. **Global argv `--json`** — recorded for duplicate-config / non-interactive behaviour (see [CLI overview](../cli/README.md)).
2. **`run.json` (structured stdout)** — only turned on for commands listed in **`packages/cli/src/constants/jsonoutput.ts`** (`COMMANDS_WITH_JSON_OUTPUT`).

A command can be “JSON-capable” but still need **all inputs from flags** in CI.

## Interactive prompts vs `--json`

**Rule of thumb:** **`--json` means “no interactive prompts on stdin”** for that command. If required data is missing (e.g. **`--lang`** for **`generate`** where it is mandatory in non-interactive mode), the command should **fail fast** with a clear **`I18nPruneError` / usage** message instead of opening prompts.

- **Interactive (TTY, no `--json`):** prompts may run (language, meta fields, confirmations).
- **Non-interactive or `--json`:** the same command must obtain everything from **flags + env + config**; otherwise exit non-zero. For **`generate`**, **`run.json`** (structured stdout for that command) is treated like non-interactive for prompts — **`canPromptGenerate`** returns false when **`ctx.run.json`** is true.

That way **`generate --json`** and **`fill --json`** are predictable in scripts and CI. For **`generate`**, non-interactive defaults for catalog-backed fields (when **`--lang`** is valid) are defined in [commands/generate](../commands/generate/README.md) and [Exit codes & behavior](./README.md).

## Progress and “how it’s going”

Long work has **three** audiences:

| Audience | Mechanism |
|----------|-----------|
| **Human TTY** | stderr **progress** (spinner / bar) — wired for **`generate`** / **`fill`** via session progress; respects **`-q` / `-s`**. |
| **`--json` machine** | **No live stream** of per-key progress on stdout (would corrupt JSON). Emit **one JSON document at the end** (or structured **line-delimited** events only if a spec is added later). |
| **Logs** | stderr lines are separate from stdout JSON; scripts should redirect or filter. |

**`sync`** is usually fast (filesystem + JSON writes); **`--json`** can return a **summary object** (counts, paths touched) at the end without a progress bar, or a minimal **progress** line on stderr only in human mode.

## Summary

- **`--json`** ⇒ **structured stdout**, **no prompts**, **no TTY progress mixed into stdout**.
- **Human** ⇒ prompts + stderr progress allowed.
- **Progress for JSON users** ⇒ final payload + optional stderr policy (quiet/silent) — not a half-printed JSON stream.

## Related

- [Roadmap](../roadmap/README.md) — **`--report-file`**, ordering of long-command work.
- [Exit codes & behavior](./README.md) — non-interactive rules, **`generate`** catalog behaviour.
- [Verbosity & JSON](../cli/verbosity/README.md) — `--quiet`, `--silent`, `--json`
