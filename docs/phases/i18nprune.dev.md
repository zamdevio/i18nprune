# Phase — i18nprune.dev + docs.i18nprune.dev

**Status:** **Completed** — landing/docs split, routes, payload docs, and demo report link/deploy path are all in place for the shipped `apps/web` scope. This phase now serves as a reference baseline for future web iterations. **Exports/programmatic** and **report** phases remain **closed** on their own ([exports/README.md](./exports/README.md), [report.md](./report.md)).

**Implementation:** landing SPA lives in **`apps/web`** (Vite + React), targeting **i18nprune.dev**. Technical docs remain the Nextra app under **`apps/docs`** with canonical markdown in root **`docs/`** (sync with `pnpm run docs:sync` when you mirror content into the app).

---

## Goal

Establish a clear public surface:

- **`i18nprune.dev`** → product landing + demo narrative
- **`docs.i18nprune.dev`** → technical docs (synced into `apps/docs/content/`)
- **CLI** remains the execution layer

### Terms (two layers)

- **Report payload** — The JSON contract the report UI consumes (`i18nprune.projectReport`, `schemaVersion`, etc.). **Documented** at [`docs/report/payload.md`](../report/payload.md) (synced to `apps/docs`); schema source is **`packages/report`**. The report SPA supports **manual JSON import** with the same Zod validation as the CLI (`apps/report`, `validatePayloadString`).
- **Landing ↔ report UI** — **Proof on the marketing site:** the home hero links to **`https://report.i18nprune.dev`** (new tab). **Remaining ops:** run `pnpm report:deploy` (or deploy project `report-i18nprune`) and attach the custom domain in Cloudflare.

---

## Locked direction

1. **Domain split**
   - Landing UX, product story, screenshots, quick start on `i18nprune.dev`.
   - Deep command/reference/architecture docs on `docs.i18nprune.dev`.

2. **Monorepo structure**
   - Use `apps/web` for landing and `apps/docs` for docs app runtime.
   - Keep canonical markdown content in root `docs/`, synced into docs app content.

3. **Try sample report**
   - Ship a browsable demo report: either a path on the main site (for example `/demo/report.html`) **or** a separate static deploy on a subdomain (for example `report.i18nprune.dev`, CF Pages `report-i18nprune`) — same artifact, independent cache and release cadence.
   - Support exporting the same sample bundle from CLI/dev assets without requiring users to generate one first.

4. **Schema and payload discoverability**
   - Document what `report.html` expects for embedded payload shape.
   - Provide an example placeholder JSON payload that can be dropped into the report shell for experimentation.

5. **Landing clarity & “instant” value (adoption)**
   - Disprove the “clear but not instantly obvious” gap: **one plain sentence** under the hero on what breaks in real repos (missing/unused keys, drift) and that the tool **fixes structure + proves in CI**.
   - **Positioning:** use **“ESLint for i18n”** as the primary analogy on the landing badge/hero (see [Launch](../../launch/README.md)).
   - **Proof, not only prose:** a **styled terminal** block on the home page (`apps/web/src/components/terminal/`) with a **before → commands → after** story (illustrative; not a live shell).
   - **Visual proof (next):** embed or link the **report UI** (“what your i18n looks like”) once `/demo/report` or assets exist.
   - Document launch/adoption checklist in **[docs/launch/README.md](../../launch/README.md)**; keep this phase file aligned with what ships in **`apps/web`**.

---

## Deliverables

- [x] New website workspace/folder scaffolded in-repo for `i18nprune.dev` (`apps/web`).
- [x] Landing architecture implemented with route pages (`/features`, `/workflow`, `/commands`, `/examples`, `/benchmark`, `/api`, `/opensource`, `/story`) plus composed home sections.
- [x] Header/footer route model implemented; footer CTA constrained to pages where it fits.
- [x] Docs deployment path clarified for `apps/docs` (current docs host + optional `docs.i18nprune.dev` alias).
- [x] Improve non-home pages from section clones to standalone pages with substantive content.
- [x] **`/examples`** — advanced CLI + JSON patterns (CI exit codes, jq filters, non-interactive generate/fill, sync audit, pipelines); complements **`/api`** (not a duplicate of docs).
- [x] **`/benchmark`** — performance positioning (representative real-world timings, determinism, same contract across commands); links to examples + docs.
- [x] Demo report **deployed** to the chosen subdomain (artifact + DNS); strategy documented in this file + [`docs/report/payload.md`](../report/payload.md).
- [x] Public docs page for report payload: [`docs/report/payload.md`](../report/payload.md).
- [x] Hero subhead: immediate plain-language value + **“ESLint for i18n”** badge (see `apps/web` home hero).
- [x] Home **Terminal** demo component + illustrative `validate` / `sync` flow (`apps/web/src/components/terminal/`).
- [x] Link **report UI** demo from landing (hero → `LINKS.demoReport`, new tab); live when subdomain is deployed.

---

## Next-session handoff (new chat ready)

### Immediate priorities

- [ ] Commands page enhancement: richer usage examples + command grouping UX (optional overlap with **`/examples`** — keep commands as reference, examples as power patterns).
- [x] Theme-aware snippets with copy: **`CodeBlock`** (Shiki) already has a copy control; **`Terminal`** now has a copy button that copies the fake session as plain text (`terminalSessionToText`).
- [x] Dedicated programmatic API page (`/api`) — shipped; keep parity with docs when exports/docs change.
- [x] Story/open-source pages expanded (baseline copy); screenshots or deeper timeline still optional.
- [ ] Follow [docs/launch/README.md](../../launch/README.md) for README hub + root rewrites when scheduling a **launch PR** (positioning only — not web backlog).

### Commands page + shared `Terminal`

The **`/commands`** route uses **Shiki** `CodeBlock` + **Expected:** lines as the source of truth for copy. The shared **`Terminal`** component (`apps/web/src/components/terminal/`) is for **narrative strips** only (fake shell; typed `TerminalLine[]`).

| Approach | When to use |
|----------|-------------|
| **`CodeBlock` default** | Every copy-paste example (current behavior). |
| **`CommandSection.sessionTerminal`** | After the example list for 1–2 flagship sections (`validate`, optionally `sync` / `doctor`) — one illustrative session (`comment` → `prompt` → `out` / `ok`) aligned with the section story. |
| **Snippets** | Keep strips in `apps/web/src/routes/pages/commands/terminal.ts` (or similar) next to `data.ts`. |
| **Mobile** | `Terminal` is full-width; test scroll height on small screens. |

Do **not** remove **Expected:** lines — `Terminal` complements trust; it does not replace outcome text.

- [x] **`validate` / `sync` / `doctor` sections:** `CommandSection.sessionTerminal` + `terminal.ts` strips; **`/commands`** has section anchors (`#cat-{id}`) for jump navigation.

**ChatGPT-style alignment (landing + site):** items **1–3** (plain sentence under hero, ESLint analogy, proof via terminal/report) are tracked in **Locked direction** and **Deliverables** above; **4** is launch-doc scope ([docs/launch/README.md](../../launch/README.md) stays pre-launch + positioning); **5** is distribution scheduling ([docs/launch/distribution.md](../../launch/distribution.md)).

### Watchouts / guardrails

- Keep **workflow-first** narrative in hero and top sections; command density belongs in command/API pages.
- Preserve internal link stability (`/features`, `/workflow`, `/commands`, `/examples`, `/benchmark`, `/api`, `/opensource`, `/story`).
- Keep CTA visibility scoped by route (not globally repeated on every page).
- Keep links centralized under `apps/web/src/constants/links.ts` until/unless a shared package is introduced.
- Keep all cross-cutting types in `apps/web/src/types/*` and export via `types/index.ts`.
- When adding new sections with `.reveal`, ensure route-level reveal observer behavior remains intact.

---

## Non-goals (this phase)

- Implementing plugin architecture or caching internals (tracked in `elit-tier` phase).
- Rewriting report command internals unrelated to web/demo distribution.

---

## See also

- [`docs/launch/README.md`](../launch/README.md) — positioning, adoption checklist, README rewrite plan
- [`docs/phases/report.md`](./report.md)
- [`docs/phases/elit-tier/README.md`](./elit-tier/README.md)
- [`docs/report/README.md`](../report/README.md)
- [`docs/commands/report/README.md`](../commands/report/README.md)
