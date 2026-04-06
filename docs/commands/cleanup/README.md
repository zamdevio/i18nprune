# `cleanup`

Removes **unused** key paths from **all** locale JSON files under **`localesDir`**, using the **source** locale JSON as the key catalog and optional **ripgrep** checks so string values still referenced in **`src`** are not deleted blindly.

## Safety

- **`--check-only`** — Report what would be removed; **no writes**.
- **Global `--json`** — Same as check-only for this command: prints a **`wouldRemove`** payload and **does not** modify files.
- **Destructive run** (default, without `--check-only` / `--json`):
  - **Interactive (TTY):** Prompts for confirmation unless you pass **global `--yes`**.
  - **Non-interactive** (CI, no TTY, piped stdin): **Requires global `--yes`** or the command **throws** with a usage-class error. Use **`--check-only`** to audit without writes.
- **`--skip-rg`** — Skips ripgrep; keys are removed using static analysis only (riskier; see CLI help).

Logs: scan summary, per-key **detail** when rg finds a conflicting string match, confirmation, per-file **detail** after writes, and a final **info** line.

## Global report file

With **global** **`--report-file`** / **`--report-format`**, supported runs append a structured artifact (see [report](../report/README.md)).

## See also

- [Policies](../../config/policies/README.md)
- [Roadmap](../../roadmap/README.md) — reporting / `--report-file` sequencing
