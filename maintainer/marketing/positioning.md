# i18nprune — positioning (maintainer)

Short messaging guide for social posts, landing tone, and release copy. **Do not pin npm semver** in public posts — link live surfaces instead.

**Facts live elsewhere (do not duplicate inventories here):**

- Shipped work → [`maintainer/phases/shipped-slices.md`](../phases/shipped-slices.md)
- Changelog → [releases.i18nprune.dev](https://releases.i18nprune.dev)
- Build timeline → [git.i18nprune.dev](https://git.i18nprune.dev)
- Commands & limits → [docs.i18nprune.dev](https://docs.i18nprune.dev)

---

## One-liner

MIT i18n toolkit: one TypeScript core validates, syncs, generates, and reports on locale JSON — CLI, SDK, and hosted surfaces — with a stable `--json` contract for CI.

---

## What we say

| Say | Why it's true |
|-----|----------------|
| **One engine, many runtimes** — `@i18nprune/core` with Node, Web, and Edge adapters; same algorithms in CLI, Workers, and custom hosts | ADR 011, `docs/runtime/` |
| **Cross-platform CLI** — Linux, macOS, Windows path/cache semantics; CI matrix tested | `docs/cli/cache.md`, platform path issues |
| **Three locale layouts** — flat files, per-locale directories, feature bundles | Config schema + init presets |
| **Five translation providers** — google, deepl, llm, libre, mymemory; policy routing; `generate --resume` | `providers --json`, generate docs |
| **Safe defaults** — `cache.profile: balanced`; mutations need `--yes`; `sync --dry-run` first; `--json` non-interactive for CI | cache ADR, command docs |
| **Stable automation API** — `--json` envelope `meta.apiVersion: "1"`; stable `issues[].code`; parity snapshot tests | ADR 007, `tests/parity/` |
| **Advanced pattern-based extraction** — import binding expansion, per-file const maps, mixed-template fusion, dynamic key classification (conservative: won't guess runtime-only holes) | `packages/core/src/extractor/`, E.1–E.6 shipped |
| **High accuracy on typical JS/TS** — near 100% on string-literal keys, ~99%+ on const-resolved templates; stack fixtures (Next, Vue, SvelteKit, Nuxt, Remix) | Landing CodeIntelligence + repo fixtures |
| **Hosted workflow** — offline HTML reports, shareable review links, web workspace, worker OpenAPI | report/web/worker apps |
| **IDE extension — coming soon** | Not on Marketplace yet |

---

## What we don't say

| Don't say | Say instead |
|-----------|-------------|
| "1.0 stable" / "production-ready for every stack" | Pre-1.0 on npm; CLI JSON contract frozen at `apiVersion: "1"` |
| "IDE extension available now" | IDE extension in development |
| "Covers all React/i18next patterns" | Link [extraction architecture](https://docs.i18nprune.dev/architecture/extraction/) |
| "Drop-in TMS replacement" | Local/CI toolkit; optional providers, not a TMS account |
| Pin `i18nprune@x.y.z` in posts | `npm i -g i18nprune` or `npx i18nprune` + [releases portal](https://releases.i18nprune.dev) |
| Lead with small unsolved edge cases | Lead with shipped capabilities; optional AST assist is **coming**, not a disclaimer |

---

## Extraction story (for posts)

**Today (shipped):** Pattern-based scanner with three layers — **import bindings** (ESM/CJS aliases, `i18n.t`, renamed imports), **per-file const maps** (`` `${NS}.key` `` resolved per file, no cross-file collisions), **template rebuild** (mixed static/runtime template holes classified safely). Prose junk and commented-out calls handled; dynamic sites reported, not guessed.

**Accuracy framing:** Near **100%** on plain string-literal keys; **~99%+** on const-resolved template keys in typical JS/TS codebases. Conservative by design on runtime-only dynamic holes — avoids false deletions in cleanup/sync.

**Coming (major, OK to mention):** Optional **TypeScript AST assist** as an opt-in strictness mode — layered on top of the fast default path, not a rewrite. **IDE extension** on the same core.

---

## Link bundle

| Label | URL |
|-------|-----|
| Home | https://i18nprune.dev |
| Docs | https://docs.i18nprune.dev |
| CLI install | `npm i -g i18nprune` or `npx i18nprune` |
| SDK | `npm i @i18nprune/core` |
| GitHub | https://github.com/zamdevio/i18nprune |
| Releases | https://releases.i18nprune.dev |
| Git timeline | https://git.i18nprune.dev |
| Web workspace | https://web.i18nprune.dev |
| Report | https://report.i18nprune.dev |
| Worker API | https://worker.i18nprune.dev/docs |

**Primary CTA:** `npx i18nprune init --yes` → `i18nprune validate --json | jq -e '.ok'`

---

## Post tone

- **Achievement-first** — flex real shipped surface (multi-runtime, cross-platform, layouts, providers, extraction depth, CI JSON).
- **Honest scope in one line** — pre-1.0 on npm; extension coming soon.
- **No version pins** in social copy.
