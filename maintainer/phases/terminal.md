# Terminal protocol exploitation — phase plan

**Status:** **research / planned** — presentation-only vertical; does not block extractor v2, search, AST tier, or extension.  
**Tracker:** [`active-phase.md`](./active-phase.md) · **Receipts:** [`shipped/README.md`](../shipped/README.md) (when slices ship).  
**Implementation home:** `packages/cli/src/shared/terminal/`, `packages/cli/src/shared/progress/`, `packages/cli/src/shared/run/` · **Data source:** `@i18nprune/core` `RunEmitter` / `RunEvent` ([`types/shared/run/`](../../packages/core/src/types/shared/run/index.ts)).

**Goal:** Make the CLI feel like a first-class native developer tool by **exposing more SDK intelligence through terminal capabilities** — not by moving domain logic into the CLI or rewriting core.

---

## Guiding philosophy

> **Expose more SDK intelligence through terminal capabilities.**

Not:

> Make prettier output.

Terminal foundations (ANSI color, basic progress bars, spinners, log channels, `--no-color`, parity-safe stderr) are **already shipped**. This phase exploits **protocol-level** terminal features — progress reporting, titles, hyperlinks, notifications, live status regions, and (exploratory) alternate-screen / interactive UX — to render intelligence the SDK already emits.

---

## Architectural position

| Layer | Owns | Must not own |
|-------|------|----------------|
| **SDK / Core** (`packages/core`) | Scanning, analysis, providers, caching, reports, policies, telemetry, execution metadata, `runXxx` orchestration | Terminal rendering, TTY detection beyond host adapters, OSC sequences |
| **CLI** (`packages/cli`) | Rendering, presentation, terminal integration, protocol exploitation, argv, prompts, `--json` envelope wiring | Domain decisions, cache rebuild policy, provider routing, duplicate telemetry collection |

**Boundary rule:** Core emits **facts** (`RunEvent`, progress ticks, structured `data` on messages). CLI **chooses how** to surface them (log line, OSC progress, title, hyperlink, notification). New operational facts belong in core first; new terminal affordances belong in CLI.

**Related:** [`agents/architecture.md`](../agents/architecture.md) §1–3 · ADR 006 command orchestrator boundary · [`systems/operations/entrypoints.md`](../systems/operations/entrypoints.md).

---

## Motivation

Operators already receive rich operational metadata today — mostly as plain `[cache]`, `[verbose]`, or `[info]` lines gated by `--debug-cache`, `--verbose`, or default verbosity. Examples the SDK already emits (non-exhaustive):

| Domain | Examples already in `run.message` / progress / summary |
|--------|--------------------------------------------------------|
| **Cache** | Hit/miss, rebuild strategy (`reuse` / `patch` / `full`), file deltas, invalidation reasons, locale-read cache bust |
| **Scan / analysis** | Dynamic site counts, key observations, patching status, extractor phase labels |
| **Translate / generate** | Provider id, model id, workers requested/used, max concurrency, rpm/rps/intervalMs, cacheHits, parallel pool slots |
| **Sync / validate** | Phase labels (`read_source`, `merge`, `compare`, …), per-target progress |
| **Cleanup / quality / review** | Decision summaries, locale statistics, review metadata |
| **Report / share** | Generation paths, manifest events, upload byte sizes, share links |
| **Doctor** | Finding counts, structured issue payloads with doc hrefs |

The gap is **presentation**, not data: the CLI often flattens high-signal metadata into scrolling prose. Terminal protocols can keep a **stable status surface** (title bar, taskbar, pinned region) while long runs proceed.

**Existing CLI hooks to extend (do not rewrite):**

- `createCliRunEmitter` → `renderRunEvent` (`packages/cli/src/shared/run/renderRunEvent.ts`)
- Rich translation progress (`packages/cli/src/shared/progress/translation.ts`) — multi-line stderr redraw, parallel pool rows
- Terminal cursor helpers (`packages/cli/src/shared/terminal/cursor.ts`)
- Logger policy gates (`packages/cli/src/utils/logger/policy.ts`) — respect `--json`, `-q`, `-s`, `NO_COLOR`

---

## Protocol categories

### 1. Terminal progress reporting

**Intent:** Reflect **real** operation progress (from `run.progress.*` and translation ticks) in the **terminal chrome**, not only inline stderr bars.

| Mechanism | Protocol | Notes |
|-----------|----------|-------|
| **OSC 9;4** | ConEmu / Windows Terminal progress | `ESC ] 9 ; 4 ; <percent> ; <state> BEL` — state: 0=error, 1=indeterminate, 2=normal, 3=warning, 4=paused |
| **Windows Terminal** | Tab / taskbar integration | Often via OSC 9;4 or WT-specific sequences; tab icon overlays in newer builds |
| **iTerm2** | `ESC ] 9 ; 3 ; <fraction> BEL` | Legacy progress; check current iTerm docs |
| **Kitty** | `ESC ] 99 ; i=<id>:p=<percent> ; <message> ST` | Per-task progress with optional message |

**Support matrix considerations:**

| Concern | Policy |
|---------|--------|
| **Detection** | Feature-detect via env (`WT_SESSION`, `TERM_PROGRAM`) + safe probe; never assume OSC support |
| **CI / pipes** | Disable when `!stderr.isTTY` or `--json` / `-s` (progress chrome is human-only) |
| **NO_COLOR** | OSC progress is not “color” but is decorative — gate like `canPrintProgress` |
| **Nested runs** | Single global progress owner per process; sub-ops push/pop stack |
| **Indeterminate** | Use for scan/analysis phases before countable work exists |
| **Parity** | Human stderr parity fixtures stay plain (`NO_COLOR=1`); OSC must not affect snapshots |

**Implementation opportunities:**

- Map `GenerateProgressEvent.phase` + `current/total` → OSC percent during `generate` / `sync` / `validate`
- Map translation `TranslationProgress` pool slots → indeterminate or weighted percent
- On `run.completed` / `run.failed`, set terminal progress to 100% or error state, then clear on exit

**Research references:**

- [Windows Terminal — progress on taskbar](https://learn.microsoft.com/en-us/windows/terminal/tutorials/progress-bar-sequences)
- [ConEmu OSC 9;4](https://conemu.github.io/en/AnsiEscapeCodes.html#ConEmu_specific_OSC)
- [iTerm2 proprietary escape codes](https://iterm2.com/documentation-escape-codes.html)

---

### 2. Terminal titles

**Intent:** Surface **where the run is** without scanning scrollback.

| Title segment | SDK source |
|---------------|------------|
| Active operation | `run.started` / `op` |
| Phase | `run.progress.*.phase` |
| Current locale / target | `target` on progress events; `run.message.target` |
| Provider | `GenerateProgressEvent.providerId` |
| Completion | `run.completed.ok`, `run.summary.issueCount` |

**Mechanism:** OSC 0 / OSC 2 — `ESC ] 0 ; <title> BEL` or `ESC ] 2 ; <title> BEL`.

**Examples:**

```txt
i18nprune generate · zh-cn · translate (42%) · google
i18nprune validate · compare · ✓ 0 issues
```

**Policy:**

- Restore previous title on exit (`process.on('exit')` + saved stack)
- Respect minimal mode: skip when not TTY or when `--silent` (optional — titles are low-noise)
- Windows conhost vs WT: prefer OSC 0; fall back to no-op

---

### 3. Terminal hyperlinks

**Intent:** Turn stable URLs already computed in core into **clickable** stderr/stdout where supported.

| Link type | Core source | Terminal use |
|-----------|-------------|--------------|
| Issue documentation | `issueCodeDocHref`, `enrichIssuesWithDocHrefs` | Clickable issue codes in human output |
| Report artifact | `run.message` paths / `run.summary` | `file://` or docs-hosted report |
| Share links | `run.share.links` events | Workspace / report URLs after upload |
| Generated locale files | write summaries | Open in editor (host-dependent) |

**Mechanism:** OSC 8 — `ESC ] 8 ; ; <url> BEL` text `ESC ] 8 ; ; BEL` (see [hyperlinks in terminal emulators](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda)).

**Policy:**

- Gate behind `canPrintDecorative` or explicit `--links` default-on when TTY supports OSC 8
- Never emit hyperlinks in `--json` stdout (envelope already carries `href` fields)
- Parity tests: strip OSC 8 or use plain text in fixtures

---

### 4. Notifications

**Intent:** Alert when long-running work completes and the terminal is unfocused.

| Event | Trigger |
|-------|---------|
| Generate finished | `run.completed` for `generate` |
| Review finished | `run.completed` for `review` |
| Report written | `run.completed` for `report` |
| Share uploaded | `run.share.uploaded` |

**Mechanisms:**

| Emulator | Sequence |
|----------|----------|
| **iTerm2** | `ESC ] 9 ; 9 ; <message> BEL` |
| **Kitty** | `ESC ] 99 ; notify=<message> ST` |
| **Bell** | `BEL` — universal but intrusive; last resort |

**Policy:** Opt-in via config or env (`I18NPRUNE_TERMINAL_NOTIFY=1`); never fire in CI; include op name + issue count in body.

---

### 5. Live status regions

**Intent:** Continuously updated **execution dashboard** — inspired by cargo, docker, git, bun — without losing scrollback history.

**Patterns to research:**

| Tool | Pattern | Applicable to i18nprune |
|------|---------|-------------------------|
| **cargo** | Multi-line status + spinner; redraw with cursor-up | Already similar in `translation.ts` |
| **docker** | Pull progress layers; compact summary line | Per-target locale build rows |
| **git** | Sideband progress on fetch | Provider health / rate-limit backoff |
| **bun** | Single-line throughput | rpm/rps + cacheHits in footer |

**Design sketch:**

```txt
┌ i18nprune generate ────────────────────────────────────────┐
│ target zh-cn · phase translate · google · 128/400 leaves   │
│ cache L2 hits 89 · workers 4/4 · rpm 60                    │
│ keys: navigation.title · settings.profile … +3             │
└────────────────────────────────────────────────────────────┘
```

**Implementation notes:**

- Reuse `rewindStderrForRedraw` / cursor-up block from existing progress code
- Subscribe to `RunEmitter` once at command host — aggregate `run.message.data` key/value pairs into a footer model
- Separate **pinned status** (redrawn) from **append-only log** (`logger.info` lines) — do not duplicate messages in both
- Gate with `canPrintProgress` and TTY checks

---

### 6. Alternate screen workflows (exploratory)

**Intent:** Investigate whether **full-screen** TUI improves specific workflows without replacing normal CLI output for CI.

**Candidate workflows (future-facing, no commitment):**

| Workflow | Why alternate screen |
|----------|---------------------|
| **Review** | Paginated locale diff, keyboard navigation |
| **Interactive inspection** | Browse dynamic sites / key observations |
| **Patch preview** | Side-by-side before `--yes` |

**Mechanisms:** `ESC [?1049h` (alternate buffer) / `ESC [?1049l` (restore); hide cursor; restore on SIGINT.

**Risks:** Breaks log capture in CI; conflicts with existing prompts; accessibility. **Default remains inline** — alternate screen is opt-in (`--tui` or subcommand) if ever shipped.

---

### 7. Interactive terminal UX (exploratory)

**Intent:** Research keyboard-driven flows; **do not** force implementation in v1 of this phase.

| Capability | Notes |
|------------|-------|
| Keyboard navigation | Arrow keys, vim bindings — requires raw mode + careful SIGINT handling |
| Filtering | Live filter on issue lists / dynamic site tables |
| Selection | Multi-select locales for generate |
| Review workflows | Approve/reject translation candidates |

**Existing foundation:** `packages/cli/src/shared/terminal/stdin-discard-while-raw.ts`, prompt libraries in command hosts.

**Boundary:** Interactive UX still calls `runXxx` — no duplicated validation logic in TUI layer.

---

## Integration with SDK telemetry

### Event contract (source of truth)

Core defines `RunEvent` in [`packages/core/src/types/shared/run/index.ts`](../../packages/core/src/types/shared/run/index.ts):

| Event | Terminal exploitation |
|-------|----------------------|
| `run.started` | Set title prefix; reset progress |
| `run.progress.generate` / `.sync` / `.validate` | Phase label, percent, OSC progress |
| `run.message` (`channel: cache` \| `verbose` \| default) | Status region lines; hyperlinks for paths |
| `run.summary` | Final title suffix; notification body |
| `run.completed` / `run.failed` | Terminal progress terminal state; notification |
| `run.share.*` | Hyperlink emit for workspace URLs |
| Translation progress callbacks | Rich bar + pool rows (existing) |

### CLI wiring pattern

```txt
runXxx(ctx, opts, { emit: createCliRunEmitter(run, createTerminalProtocolEmitter(run)) })
```

`createTerminalProtocolEmitter` (future) — side-effect only, no mutation of events; composes with JSON collectors and verbose taps.

### What core should add (only when facts are missing)

Prefer enriching existing `run.message` `data` records over new CLI-only probes:

- Structured fields for cache delta counts (already partially present for `--debug-cache`)
- Explicit `run.progress.*` for ops that today only emit messages (`cleanup`, `report`)
- Non-secret provider health snapshots on translate stalls

**Do not** add `console.*` or terminal sequences in core.

---

## Implementation opportunities (suggested slices)

Status: **planned** — ship incrementally; one slice per PR; parity unchanged unless explicitly scoped.

| Slice | Scope | Exit criteria |
|-------|-------|---------------|
| **T.1 — Terminal protocol module** | `packages/cli/src/shared/terminal/protocol/` — OSC writers, capability probe, no-op fallbacks | Unit tests for sequence bytes; no-op when not TTY |
| **T.2 — Title + progress OSC** | Wire `run.progress.*` + `run.completed` for `generate` / `sync` / `validate` | Manual WT + iTerm smoke; disabled in parity env |
| **T.3 — Hyperlinks for issues** | OSC 8 on issue codes when `href` present in enriched issues | Parity strips links; docs note in `docs/cli/output.md` |
| **T.4 — Status region v1** | Pinned footer aggregating translate stats (cacheHits, workers, rpm) | No duplicate log lines; respects `-q` |
| **T.5 — Notifications (opt-in)** | Env-gated completion notify for long `generate` | Off by default; CI safe |
| **T.6 — Share / report links** | Hyperlinks on `run.share.links` + report path messages | — |
| **T.7 — Research doc → systems map** | Fold stable rules into `maintainer/systems/commands/` pointer | — |

---

## Non-goals

- Moving SDK logic into CLI (scanning, analysis, provider routing, cache policy)
- Duplicating SDK telemetry in CLI-only state machines
- SDK rewrites, Rust rewrites, Tauri rewrites
- Replacing current command architecture or `--json` envelope
- ANSI color / basic bars / spinners (already solved)
- User-facing VitePress docs for OSC sequences (maintainer + optional `docs/cli/output.md` note only)
- Mandatory TUI / alternate-screen for standard commands

---

## Future ideas

- **Per-op status profiles** — `generate` shows provider footer; `validate` shows scan/compare phases
- **tmux / screen** integration — window name via OSC 2 when multiplexer detected
- **WezTerm / Ghostty** feature flags — progressive enhancement
- **Structured `--json` stream** of terminal side-effects for IDE hosts (extension renders instead of OSC)
- **Rate-limit visualization** — sparkline of provider backoff from verbose messages
- **Multi-project monorepo** — title shows active `projectId` from context

---

## Research references

| Topic | Link |
|-------|------|
| Terminal hyperlinks (OSC 8) | https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda |
| Windows Terminal progress | https://learn.microsoft.com/en-us/windows/terminal/tutorials/progress-bar-sequences |
| ConEmu OSC codes | https://conemu.github.io/en/AnsiEscapeCodes.html |
| iTerm2 escape codes | https://iterm2.com/documentation-escape-codes.html |
| Kitty remote control / notifications | https://sw.kovidgoyal.net/kitty/rc_protocol/ |
| NO_COLOR convention | https://no-color.org/ |
| Existing CLI output policy | [`docs/cli/output.md`](../../docs/cli/output.md), [`docs/cli/verbosity.md`](../../docs/cli/verbosity.md) |
| Run event contract | [`packages/core/src/types/shared/run/index.ts`](../../packages/core/src/types/shared/run/index.ts) |
| Cache debug semantics | [`systems/cache.md`](../systems/cache.md) |
| Platform matrix | [`systems/platform.md`](../systems/platform.md) |

---

## Desired outcome

After this phase, operators running `i18nprune generate`, `sync`, `validate`, and related ops should **see what the SDK already knows** — cache behavior, provider posture, phase, targets, and links — through terminal-native surfaces (title, progress, pinned status, clickable docs) without reading scrollback or enabling verbose mode. The CLI should feel intentional and tool-native **because it communicates better**, not because it does more work.
