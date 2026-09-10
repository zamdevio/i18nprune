---
layout: home

title: i18nprune — Locale sync, validate, and generate
description: "Keep translation keys and locale files aligned — detect drift, review dynamic key risks, and automate safe locale maintenance with the CLI and SDK."

hero:
  name: i18nprune
  text: Locale files that stay honest
  tagline: Validate, sync, prune, and generate translations with a CI-friendly CLI and a stable SDK — schema-first, preserve-aware, and readable in human or JSON mode.
  image:
    src: /i18nprune.svg
    alt: i18nprune
  actions:
    - theme: brand
      text: Get started
      link: /onboarding/
    - theme: alt
      text: Commands
      link: /commands/
    - theme: alt
      text: SDK
      link: /sdk/operations

features:
  - icon: ✅
    title: Validate and gate CI
    details: Catch missing keys, dynamic sites, and parity drift with stable issue codes and a frozen --json envelope.
  - icon: 🔄
    title: Sync with preserve
    details: Align target locale shape to scan ∩ source, then hydrate declared copyPrefixes and uncertainPrefixes without scan-anchor hacks.
  - icon: 🧹
    title: Cleanup unused keys
    details: Dry-run unused removal on source or targets with optional rg guards — preserve rules stay in the loop.
  - icon: 🌐
    title: Generate and resume
    details: Fill missing translations with provider workers; --resume skips verbatim preserve paths and respects your policies.
  - icon: 📦
    title: Three locale layouts
    details: Flat files, per-locale directories, and feature bundles — the same commands understand segments end to end.
  - icon: 🧩
    title: SDK-ready core
    details: "@i18nprune/core exposes the same engines as the CLI — embed validate, sync, and generate in your own hosts."
---

## Install

**CLI (terminal):**

```bash
npm install -g i18nprune
# or: pnpm add -g i18nprune
```

**On demand (no global install):**

```bash
npx i18nprune --help
pnpm dlx i18nprune --help
```

**SDK (embed in your app):**

```bash
npm install @i18nprune/core
# or: pnpm add @i18nprune/core
```

The **`i18nprune`** npm package ships the CLI. Prefer **`@i18nprune/core`** when you import APIs from Node or workers.

## Quick start

```bash
i18nprune init
i18nprune validate
i18nprune sync --dry-run
i18nprune missing --target all
i18nprune generate --resume --all
```

Start with [Onboarding](/onboarding/) for the shortest path, then [Commands](/commands/) for day-to-day ops.

## Documentation

| Topic | What you will learn |
|-------|---------------------|
| [Onboarding](/onboarding/) | CLI / SDK / CI / hosted paths to first value |
| [Commands](/commands/) | Per-command reference |
| [Examples](/examples/) | CI gates, jq recipes, generate --resume |
| [Config](/config/) | `defineConfig`, locales layout, policies |
| [Policies](/config/policies) | `copyPrefixes`, `uncertainPrefixes`, parity |
| [CLI overview](/cli/) | Global flags and argument preprocessing |
| [JSON (`--json`)](/cli/json) | Machine-readable envelope for scripts and CI |
| [Issues](/issues/) | Stable issue codes and remediation |
| [Architecture](/architecture/) | System layers and data flow |
| [SDK operations](/sdk/operations) | Programmatic `runXxx` surfaces |
| [Release notes](https://releases.i18nprune.dev) | CLI and Core version history |

## Design principles

**Schema-first, host-thin.** Core owns detection, cache policy, and locale IO contracts. The CLI is a thin host for prompts, progress, and `--json`. Preserve and uncertain-prefix rules are one config contract across sync, cleanup, and generate — not per-command workarounds.
