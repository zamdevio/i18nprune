# Active sprint

**Execution order:** [phases README](./README.md) (hub) + this file — **current focus:** **`review`** uplift (CepatEdge-style human + JSON) → then **`key-sites`** → **patching** (loader / ADR 004).

---

## CLI — `review` command (CepatEdge-style uplift)

**Status:** **Active (implementation focus).** Hub: [review.md](./review.md). Goal: richer human output (grouped views, **`--top` / `--full`**), stronger **`review --json`** payload, aligned with [prompts](../prompts/README.md) and [JSON output](../json/README.md).

---

## Recently completed (this track)

| Slice | Doc |
|-------|-----|
| **`locales`** (`list`, meta **`edit`**, **`dynamic`**, **`delete`**, **`--json`**) | [locales.md](./locales.md) |
| **`generate`** (progress envelope, identity streak) | [generate.md](./generate.md) |
| **`fill`** (same shared pipeline + JSON as **`generate`**) | [fill.md](./fill.md) |

---

## `i18nprune.dev` / landing + public site (`apps/web`)

**Status:** **Completed** — baseline marketing site scope is shipped. Hub: [i18nprune.dev.md](./i18nprune.dev.md).

---

## Exports / public API

**Status:** **Completed** — [exports/README.md](./exports/README.md). Specs: [json/README.md](../json/README.md), [programmatic.md](../json/programmatic.md).

---

## CLI `--json` parity (baseline commands + `locales`)

**Status:** **Completed** for baseline commands and **`locales`** leaf subcommands — [cli-json-command-parity.md](../edge-cases/solved/cli-json-command-parity.md), [locales.md](./locales.md).

---

## Foundation tracks (ordering)

| Track | Status | Doc |
|-------|--------|-----|
| **`review` uplift** | **Active** | [review.md](./review.md) |
| **Key observations (`keySites`)** | **Next** after review slice (can overlap where safe) | [key-sites.md](./key-sites.md) |
| **Patching / loader / ADR 004** | **After** key-sites + **`locales edit`** readiness | [patching/README.md](./patching/README.md) |
| **Translation providers (`--provider`)** | **After** review + key-sites churn settles | [providers.md](./providers.md) |

---

## Earlier closed work

Key reference + interactive cleanup: [key-reference-unification.md](./key-reference-unification.md), [interactive-key-confirmation.md](./interactive-key-confirmation.md).
