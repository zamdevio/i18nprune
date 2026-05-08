# ADR 001 — Scope and shape of the v0.x CLI

## Status: Accepted

## Context

We needed a tool that teams can run **locally and in CI** to reduce i18n foot-guns: missing keys, divergent locale JSON, unsafe cleanup, and opaque translation runs. The tool therefore needs a **single binary** with an explicit set of **subcommands** for the first major versions:

1. **Framework-only plugins** — Great inside one stack (e.g. one bundler), poor for polyglot repos or scripting.
2. **Heavy TMS / cloud suites** — Strong for teams with process budget; overkill for small apps and bad for “run in GitHub Actions with no account”.
3. **Ad-hoc scripts per repo** — Flexible but duplicated, rarely share one **verbosity + JSON** contract or one **config merge order**.
4. **Monolithic “do everything” i18n platforms** — Hard to reason about, slow to adopt.

We wanted something **installable as one npm package**, **framework-agnostic** (JSON locales + source scan), and **honest** about static analysis limits.

## Decision rationale

Ship **one binary**, **`i18nprune`**, with an explicit set of **subcommands** for the first major versions:

| Area | Subcommands / behaviour |
|------|-------------------------|
| Setup | `init`, `config` |
| Correctness | `validate`, `sync`, `quality`, `review` |
| Translation | `generate`, `fill` (provider-backed; Google first) |
| Maintenance | `cleanup` (optional rg) |
| Reference | `languages` (catalog) |
| Ops | `doctor` (diagnostics) |
| Meta | `help`, global `-v` / `--version` |

**Cross-cutting:** global **`--json`**, **`--quiet`**, **`--silent`**; central **`logger`**; **`RunOptions`** set once in **`preAction`**; **`resolveContext()`** for merged config and paths.

## The Why

**Multiple packages** would reduce install size but introduce version skew and duplicated policy code. **ESLint-only** or **TS-plugin-only** approaches do not solve JSON sync, generate, or cleanup for everyone. **Convention-only** (`locales/en.json` only) fails in monorepos; we keep **defaults + discovery** with full override instead.

## Consequences

**Positive:** One mental model; **JSON mode** can grow per command; **doctor** is a single CI preflight.

**Trade-offs:** Bundle includes provider + core even for validate-only use — acceptable for a CLI. New subcommands must stay aligned with **`logger`** and **`RunOptions`**.

**Follow-up:** Richer **`review`** and provider plugins stay incremental without breaking the global flag contract if JSON shapes are versioned.

## See also

- [Architecture overview](..)
- [Commands index](../../commands)
