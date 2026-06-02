# Share hash dedup and `--force` replace

## Problem

Uploading the same prepared snapshot twice should not always create duplicate worker rows. Conversely, operators sometimes **must** rotate share links after a policy change even when zip bytes are unchanged.

## What we do

1. **Content hash:** core builds a stable payload hash from the prepared envelope (config + snapshot semantics). The worker stores rows keyed by that hash when dedup is enabled.
2. **Default upload:** if the worker already has the hash, response includes **`HASH_ALREADY_EXISTS`** (warning) and **reuses** `projectId` / `reportId` — local `share.json` still updates to the latest links.
3. **`--force`:** purge the prior worker row for that hash and allocate **new** ids — **old URLs 404**; use only when link rotation is intentional.
4. **`--no-cache`:** skips local `share.json` read/write; does not disable remote dedup — you still get hash reuse unless `--force`.

## Operator checklist

| Situation | Action |
|-----------|--------|
| “Upload did nothing new” | Expected dedup — check warning / `skippedReason: hash_unchanged` in verbose flows |
| “I need a fresh link” | `share upload --project --force` (accept old link breakage) |
| CI upload | `share upload --project --json` (no TTY confirm; same dedup rules) |

## See also

- [Share command — content-hash dedup](../../commands/share/README.md#content-hash-dedup)
- [Share issues](../../issues/share.md)
- [ADR 009 — Share hosted snapshot contract](../../architecture/decisions/009-share-hosted-snapshot-contract.md)
