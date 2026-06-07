---
description: "Commands that prompt on TTY (share upload, cleanup --ask, locales delete, init without --yes) hang or fail in GitHub Actions, Docker, and other non-TTY…"
---

# CI non-interactive confirmation gates

## Problem

Commands that prompt on TTY (`share upload`, `cleanup --ask`, `locales delete`, init without `--yes`) hang or fail in GitHub Actions, Docker, and other non-TTY environments.

## What we do

1. **Global `--yes`:** skips interactive confirms where the command respects it; wins over `--ask` ([CLI prompts](../../cli/prompts.md)).
2. **`--json`:** machine-readable stdout contract — **no interactive prompts** for required inputs on JSON-capable commands; share upload **auto-proceeds** without TTY confirm (same practical effect as `--yes` for upload).
3. **Non-TTY default for share:** without a TTY, `share upload` uploads without the manifest confirm unless you rely on dry workflows — prefer explicit `--yes` or `--json` in CI for clarity.
4. **Explicit ids:** `share view` / `share delete` error without `--project` / `--report` on non-TTY — pass ids from `share list --json` or cache files.
5. **`canAsk` gating** in `packages/cli/src/core/ask/` — combines TTY detection, `--json`, and `--yes`.

## CI patterns

```bash
# Validate gate
i18nprune validate --json | jq -e '.ok and ((.issues | length) == 0)'

# Destructive cleanup
i18nprune cleanup --yes --json

# Share upload
i18nprune share upload --project --json

# Init in automation
i18nprune init --yes
```

## See also

- [CLI prompts](../../cli/prompts.md)
- [JSON output (`--json`)](../../cli/json.md)
- [Share command — TTY behavior](../../commands/share/README.md#upload-flags)
- [ADR 007 — CLI JSON envelope contract](../../architecture/decisions/007-cli-json-envelope-contract.md)
