# Export governance scripts

Maintainer tooling for inspecting and validating the `@i18nprune/core` public export surface. These scripts answer questions like “how big is our SDK root barrel?”, “what changed since the last tag?”, and “does the working tree violate tier rules?”

**Not user-facing.** End users never run these. See [`maintainer/systems/exports.md`](../../maintainer/systems/exports.md) for the full engineering map.

---

## Quick start

```bash
pnpm exports:help              # full usage
pnpm exports:inventory         # summary for working tree
pnpm exports:diff v0.1.4       # vs last release tag
pnpm exports:trend             # flat exports across release tags
pnpm exports:timeline @4w      # commits in time window
pnpm exports:graph             # re-export map (subpaths + modules)
pnpm exports:validate          # governance stub (CI gate in EX-4)
```

Each command supports `-h` / `--help` for command-specific usage:

```bash
pnpm exports:diff --help
pnpm exports:inventory -h
```

---

## Commands

### `exports:inventory`

Prints root barrel counts: flat exports, namespace exports, and stability tier breakdown.

| Ref | Meaning |
|-----|---------|
| *(omit)* | **Working tree** — includes uncommitted edits |
| `HEAD` | Committed HEAD |
| `v0.1.4` | Tag |
| `main` | Branch tip |
| `d60df9e` | Short SHA (must be unambiguous to git) |
| `d60df9e4a30b9af632359277ca182f6fafa3b264` | Full SHA |

```bash
pnpm exports:inventory
pnpm exports:inventory HEAD
pnpm exports:inventory v0.1.4
pnpm exports:inventory d60df9e4a30b9af632359277ca182f6fafa3b264
pnpm exports:inventory -v              # every flat symbol + namespaces
pnpm exports:inventory v0.1.4 --verbose
pnpm exports:inventory --no-cache      # skip cache read/write
```

### `exports:diff`

Compares two export snapshots. Default: **HEAD → working tree**.

**Single ref** — compare that commit against the working tree:

```bash
pnpm exports:diff                      # HEAD → working tree
pnpm exports:diff v0.1.4               # tag → working tree
pnpm exports:diff d60df9e              # short SHA → working tree
pnpm exports:diff d60df9e4a30b…        # full SHA → working tree
```

**Range `A..B`** — compare two commits (tags, SHAs, HEAD, branches):

```bash
pnpm exports:diff v0.1.3..v0.1.4
pnpm exports:diff v0.1.2..HEAD
pnpm exports:diff a6caa74..d60df9e
```

Refs are resolved with `git rev-parse --verify` — anything git accepts works, including **short and full commit hashes**.

```bash
pnpm exports:diff v0.1.3..v0.1.4 -v    # tier/kind per added/removed symbol
pnpm exports:diff v0.1.4 --no-cache    # bypass .exports/cache/
```

### `exports:trend`

Root export counts for the last N `v*` release tags (default 12).

```bash
pnpm exports:trend
pnpm exports:trend --tags=6
pnpm exports:trend -v
```

### `exports:timeline`

Flat export count at each commit that **changed** `packages/core/src/index.ts` (not every repo commit).

| Column | Meaning |
|--------|---------|
| **flat** | Root flat export count at that commit |
| **Δ** | Change vs the row **above** (newest first); `—` on first row |
| **+N / −N** | N more/fewer flat exports than the newer barrel edit above |

```bash
pnpm exports:timeline              # default @4w, limit 20
pnpm exports:timeline @3m --limit=0   # no commit cap
pnpm exports:timeline 2026-W24 -v
```

### `exports:graph`

Re-export governance map: target subpath groups, root namespaces, top source modules.

```bash
pnpm exports:graph
pnpm exports:graph v0.1.4 -v
```

### `exports:validate`

Checks governance rules on the **working tree**. Exits `0` on pass, `1` on failure.

Today (stub — strict CI gate lands in EX-4):

- tsconfig `@i18nprune/core` paths ⊆ `package.json` exports
- no **unclassified** symbols on root flat exports

```bash
pnpm exports:validate
pnpm exports:validate -v               # all notes + advanced/internal flat lists
pnpm exports:validate --since=HEAD~1   # reserved; noted in verbose output
```

---

## Flags

| Flag | Commands | Effect |
|------|----------|--------|
| `-v`, `--verbose` | inventory, diff, validate | Extra detail (see below) |
| `-f`, `--force` | inventory, diff, graph, trend, timeline | Skip cache read; rebuild and overwrite on disk (`refresh`) |
| `--no-cache` | inventory, diff, graph, trend, timeline | Skip cache read and write for this run (`bypass`) |
| `-h`, `--help` | all | Command-specific or full help |
| `--since=<ref>` | validate | Reserved for future delta validation |

### Verbose output

| Command | `-v` adds |
|---------|-----------|
| **inventory -v** | Full symbol table: tier, category, symbolKind, targetSubpath + subpath rollups |
| **diff -v** | Category/symbolKind/targetSubpath for added/removed + cache SHAs |
| **validate -v** | All path-parity notes; advanced/internal flat symbol lists |

---

## Snapshot schema (v1)

Cached snapshots use three independent version fields (all in `paths.ts`):

| Constant | File | Purpose |
|----------|------|---------|
| **`SNAPSHOT_VERSION`** | `inventory.full.json`, `timeline.summary.json` | JSON **shape** (fields, arrays) |
| **`TOOL_VERSION`** | same + `meta.json` | **Scanner logic** (tiers, parser) — auto-expire on bump |
| **`CACHE_META_VERSION`** | `meta.json` only | Index **shape** (`entries` map) — not the snapshot payload |

**Auto-expire:** stale `toolVersion` (and mismatched `SNAPSHOT_VERSION`) purge on read; stale `CACHE_META_VERSION` resets `meta.json` and re-heals from disk.

| Field | Purpose |
|-------|---------|
| `version` | Snapshot schema — must match `SNAPSHOT_VERSION` or cache is purged |
| `toolVersion` | Scanner generation — must match `TOOL_VERSION` or cache is purged |
| `git.commitDate` | Trend / timeline axis (ISO timestamp) |
| `summary.subpaths[]` | Rollup per published npm subpath (full profile only) |
| `symbols[]` | Flat root exports with `category`, `symbolKind`, `targetSubpath`, `sourceModule` |
| `namespaces[]` | Root `export * as` mirrors |
| `edges[]` | Re-export graph (flat + namespace → source module) |
| `scanDepth` | `full` or `light` (timeline) |
| `sourceFingerprint` | Root barrel hash — invalidates worktree cache on edit |

Timeline ranges: `2026-W24`, `2026-06-01..2026-06-14`, `@7d`, `@4w`, `@3m` — see `time/ranges.ts`.

---

## Cache

Historical snapshots live under **`.exports/cache/`** (gitignored). Two profiles:

```text
.exports/cache/
  meta.json                              # index of full snapshots (trend/heal)
  <sha>/
    inventory.full.json                  # full scan
    timeline.summary.json                # timeline root summary only
```

| Profile | File | Commands |
|---------|------|----------|
| **full** | `inventory.full.json` | inventory, diff, graph, trend, validate |
| **timeline** | `timeline.summary.json` | timeline |

- First resolve → **miss** (build + write); repeat → **hit**.
- Worktree HEAD checks **`sourceFingerprint`** on full cache.
- Corrupt JSON or SHA mismatch → removed on next access → rebuild.
- **`--force` / `-f`** → skip read, rebuild, overwrite → **refresh** (use after tier/heuristic script changes).
- **`--no-cache`** → skip read and write → **bypass** (ephemeral result only).

Old refs are read via **`git show <sha>:packages/core/src/index.ts`**. Missing barrel at ref → clean `ExportError` (no stack trace).

---

## Errors

User-facing failures use a single-line header plus metadata — no stack traces:

```text
exports  error · Unknown git ref "v0.1.1"
       code       unknown_ref
       ref        v0.1.1
       suggestion Known version tags: v0.1.2, v0.1.3, v0.1.4
```

Set `EXPORTS_DEBUG=1` to print stacks for unexpected internal failures only.

---

## Layout

```text
scripts/exports/
  run.ts              CLI entry
  paths.ts            repo paths + cache filenames
  README.md           this file (operator manual)
  help/               usage text (--help)
  errors/             ExportError types
  logger/             colored output + column legends
  git/                ref resolve, git log, git show, session stats
  cache/store/        meta heal, full + timeline cache profiles
  inventory/          parse barrels, tiers, categories, graph
  format/             diff computation
  time/               timeline range tokens
  commands/           inventory, diff, validate, trend, timeline, graph
```

Tier rules live in **`inventory/tiers.ts`** (code, not committed JSON).

---

## Examples

**Pre-release sanity check**

```bash
pnpm exports:inventory
pnpm exports:diff v0.1.4
pnpm exports:validate
```

**What shipped between two tags**

```bash
pnpm exports:diff v0.1.3..v0.1.4
pnpm exports:diff v0.1.3..v0.1.4 -v
```

**Local edits vs last commit**

```bash
pnpm exports:diff
```

**Compare two specific commits by hash**

```bash
pnpm exports:diff a6caa74..d60df9e
```

**Drill into tier classification**

```bash
pnpm exports:inventory -v | rg ISSUE_
pnpm exports:validate -v
```

---

## Roadmap

| Phase | Command | Status |
|-------|---------|--------|
| 1 | `exports:inventory` | Done |
| 2 | `exports:diff` | Done |
| 3 | `exports:validate` | Stub (strict CI in EX-4) |
| 4 | `exports:trend` | Done |
| 5 | `exports:timeline` | Done |
| 6 | `exports:graph` | Done |

Core refactor slices: [`maintainer/phases/exports.md`](../../maintainer/phases/exports.md) (EX-0…EX-5).

---

## EX-0 audit (closed)

Deep-import violations and host migration checklist live in [`maintainer/phases/exports.md` § EX-0 exit criteria](../../maintainer/phases/exports.md#ex-0--export-scripts-bootstrap). Execute fixes in **EX-1** (subpaths) and **EX-2** (hosts).

---

## Related docs

- [`maintainer/systems/exports.md`](../../maintainer/systems/exports.md) — tiers, subpaths, CI placement (links back here for commands)
- [`maintainer/phases/exports.md`](../../maintainer/phases/exports.md) — EX-0…EX-5 slices; EX-0 **done**
