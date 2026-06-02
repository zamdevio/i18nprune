# Solved edge cases

Short, factual write-ups of edge cases we detected and fixed (or designed around) before first release.

| Topic | Summary |
|-------|---------|
| [Per-file const maps](./per-file-const-map.md) | Same identifier name in different files must not share one const map when rebuilding template keys. |
| [CLI `--json` command parity](./cli-json-command-parity.md) | `COMMANDS_WITH_JSON_OUTPUT` vs human-only paths; single-document stdout for scripts. |
| [Sync metadata flag conflict](./sync-metadata-flag-conflict.md) | `--strip-metadata` wins over `--metadata`; warning code for ambiguous CI flags. |
| [Generate `--resume` contract](./generate-resume-partial-run-contract.md) | Partial leaf fill vs translation L1/L2 cache; read `targetResults` in `--json`. |
| [Share hash dedup and `--force`](./share-hash-dedup-and-force-replace.md) | Reuse remote ids by default; `--force` rotates links intentionally. |
| [Locale layout mismatch rebuild](./locale-layout-mismatch-rebuild.md) | Layout fingerprint change triggers full analysis rebuild. |
| [CI non-interactive gates](./ci-noninteractive-confirmation-gates.md) | `--yes`, `--json`, and non-TTY rules for upload/cleanup/init. |
