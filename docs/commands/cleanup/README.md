# `cleanup`

**Full examples:** [cleanup examples](../../examples/commands/cleanup/README.md)

Removes **unused** key paths from **all** locale JSON files under **`localesDir`**, using the **source** locale JSON as the key catalog, **`reference`** policy (uncertain prefixes, string presence), optional **ripgrep** checks on locale **string values** in **`src`**, and **`policies.preserve`**.

## Detection limits

Static key usage is inferred with **regex/heuristics**, not a full typechecker. Indirect patterns (e.g. aliasing `t`) may not be seen. Read [Detection limits](../../regex/README.md#detection-limits) and [extraction](../../regex/extraction.md) before trusting aggressive cleanup.
Cleanup key usage now follows the same **per-file key-site resolution** as `validate`/`missing`, so duplicate `const` identifiers across files (for example `const NS`) no longer collide into false usage paths.

## Safety

- **`--check-only`** — Report what would be removed; **no writes**.
- **Global `--json`** — Same as check-only for this command: prints a **`wouldRemove`** payload and **does not** modify files. The envelope includes **`data.summary`** (duration and counts) on the **same** stdout document — there is no separate **`kind: summary`** line.
- **Destructive run** (default, without `--check-only` / `--json`):
  - **Interactive (TTY):** Prompts for confirmation unless you pass **global `--yes`**.
  - **Non-interactive** (CI, no TTY, piped stdin): **Requires global `--yes`** or the command **throws** with a usage-class error. Use **`--check-only`** to audit without writes.
- **Global `--yes`** — Confirms the run without prompts; **overrides** **`--ask`** / **`--ask-per-key`**.
- **`--ask`** — Interactive TTY only: confirm removals **per top-level namespace** (segment before the first `.`). Ignored with **`--json`**, **`--check-only`**, or without a TTY (info message).
- **`--ask-per-key`** — With **`--ask`**, confirm **each** key separately (verbose).
- **`--skip-rg`** — Skips ripgrep; keys are removed using static + reference logic only (see **`reference.stringPresence`** when rg is enabled).

Logs: scan summary, per-key **detail** when rg finds string presence, confirmation, per-file **detail** after writes, and a final **info** line.

## Config

- **`policies.preserve`** — Paths never removed when they match copy keys/prefixes.
- **`reference`** — `uncertainKeyPolicy`, `stringPresence` (`guard` / `warn` / `off`), per-command overrides under `reference.commands.cleanup`.

## Global report file

With **global** **`stdout redirection`** / **`--format`**, supported runs append a structured artifact (see [report](../report/README.md)).

## See also

- [Policies](../../config/policies/README.md)
- [Regex / key sites & dynamic](../../regex/key-sites-and-dynamic.md)
- [Ripgrep in cleanup](../../regex/ripgrep.md)
- [Roadmap](../../roadmap/README.md) — reporting / `stdout redirection` sequencing
