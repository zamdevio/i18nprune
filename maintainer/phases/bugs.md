# Bugs — open defect register

**Status:** living document.
**Scope:** defects found in shipping CLI / core behaviour. Not a roadmap — planned work lives in [`focus.md`](./focus.md) and the per-vertical phase docs.

This file is **generic and self-pruning**: a bug lives here only while it is open. When a fix ships, move the entry to [`shipped/`](../shipped/README.md) and delete it from this file. Do not accumulate fixed bugs here.

---

## How to use

### Adding a bug

1. Assign the next free id (`BUG-00N`), append it to the [index](#index), and add a full entry below.
2. Every entry needs: **expected**, **actual**, **repro**, **evidence**, **impact**, **fix sketch**, and a **regression test** to add with the fix.
3. `repro` must be runnable by someone who has never seen the consumer repo. Prefer a minimal config + one fixture file over "open the app and click".
4. Record the exact version(s) verified. Mark **both** if you tested more than one.
5. Cite `file:line` for every code claim. If the claim is behavioural, cite the command and its output.
6. If a bug is version-specific to a consumer's layout mode, say which mode (`flat_file`, `locale_directory` + `locale_per_dir`, …).

### Removing a bug

1. Fix + regression test land.
2. Cut a [shipped](../shipped/README.md) receipt; cross-link it from the release notes if the bug was user-visible.
3. Delete the entry here and its index row. A fixed bug must not linger.

### Legend

| Field | Values |
|---|---|
| **Severity** | `critical` (data loss / wrong output by default) · `high` (silent wrong behaviour, no data loss) · `medium` (documented contract not honoured) · `low` (polish) |
| **Status** | `open` · `in progress` · `blocked` |

---

## Index

| id | Title | Area | Severity | Status | Verified against |
|----|-------|------|----------|--------|------------------|

_No open defects._ `BUG-001`, `BUG-002`, and `BUG-003` all landed in v1.1.1 — see [`shipped/locale/cleanup-uncertain-protection.md`](../shipped/locale/cleanup-uncertain-protection.md).

---

## Candidates — not yet verified as bugs

Not defects until reproduced. Keep separate from the register above so it stays trustworthy.

| Observation | Why it may not be a bug |
|---|---|
| `locales dynamic` count unchanged (28) after the v1.1.0 extractor HOC §A work | Expected for **data-object** keys (`t(item.labelKey)`), which have no const map or hook to fold. Confirm on a hook/alias codebase before treating as a regression |
| `policies.preserve.copyPrefixes` is *verbatim* (skip MT) while dynamic families are translated | Not wrong (`sync --dry-run` reports 0 leaves filled from source), but it is the wrong flavour semantically. Now that declared `uncertainPrefixes` reaches `cleanup`, consumers should switch knobs; the split is **shape** (`uncertainPrefixes`) vs **verbatim** (`copyPrefixes`) |
